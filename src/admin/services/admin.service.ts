import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Point } from 'geojson';
import { CategoriesEntity } from 'src/utils/models/categories.entity';
import { Not, Repository, In } from 'typeorm';
import { ConsolidationCenterEntity } from '../models/consolidationCenters.entity';
import * as admin from 'firebase-admin';
import { Expo } from 'expo-server-sdk';
import readXlsxFile from 'read-excel-file/node'
import * as pdf from 'html-pdf'
import * as fs from 'fs'
import * as nodemailer from 'nodemailer'
import { UsersEntity } from 'src/users/models/users.entity';
import { BaseLocationsEntity } from '../models/baseLocations.entity';
import { PortalSettingsEntity } from '../models/portalSettings.entity';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from 'src/common/redis/redis.provider';

const PAUSE_AUTO_ALLOCATION_SETTING = 'pause_auto_allocation';
const PAUSE_AUTO_ALLOCATION_REDIS_KEY = 'autoAlloc:paused';

const firebaseCredentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './goodmove-firebase.json';
const fbCredentials: any = fs.existsSync(firebaseCredentialsPath)
  ? JSON.parse(fs.readFileSync(firebaseCredentialsPath, 'utf8'))
  : null;
let expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
var mail = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(ConsolidationCenterEntity)
        private ccRepo: Repository<ConsolidationCenterEntity>,
        @InjectRepository(CategoriesEntity)
        private catRepo: Repository<CategoriesEntity>,
        @InjectRepository(UsersEntity)
        private usersRepo: Repository<UsersEntity>,
        @InjectRepository(BaseLocationsEntity)
        private baseLocationsRepo: Repository<BaseLocationsEntity>,
        @InjectRepository(PortalSettingsEntity)
        private portalSettingsRepo: Repository<PortalSettingsEntity>,
        @Inject(REDIS_CLIENT)
        private redis: Redis
    ){
        if(!admin.apps.length && fbCredentials) {
            admin.initializeApp({
                credential: admin.credential.cert(fbCredentials)
            });
        }
    }

    async addConsolidationCenter(reqBody: any): Promise<any> {
        const pointObject: Point = {
            type: "Point",
            coordinates: [reqBody.longitude,reqBody.latitude]
        };
        const ccInput = {
            "unique_id": reqBody.unique_id,
            "address": reqBody.address,
            "city": reqBody.city,
            "state": reqBody.state,
            "country": reqBody.country,
            "zip_code": reqBody.zip_code,
            "latitude": reqBody.latitude,
            "longitude": reqBody.longitude,
            "location": pointObject
        }
        
        const driverData = await this.ccRepo.save(ccInput)
        return driverData
    }

    async getConsolidationCenters(reqBody: any): Promise<any> {
        const [items, count] = await this.ccRepo.findAndCount({order:{id: 'ASC'}, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) })
        return {items, count}
    }

    async addBaseLocation(reqBody: any): Promise<any> {
      const pointObject: Point = {
          type: "Point",
          coordinates: [reqBody.longitude,reqBody.latitude]
      };
      const bLoc = await this.baseLocationsRepo.findOne({where:{unique_id: reqBody.unique_id}})
      if(!bLoc) {
        const ccInput = {
          "unique_id": reqBody.unique_id,
          "address": reqBody.address,
          "city": reqBody.city,
          "state": reqBody.state,
          "country": reqBody.country,
          "zip_code": reqBody.zip_code,
          "latitude": reqBody.latitude,
          "longitude": reqBody.longitude,
          "location": pointObject
        }
        const baseLocationData = await this.baseLocationsRepo.save(ccInput)
        return baseLocationData
      } else {
        return {message: 'Driver already have Base Location'}
      }
      
  }
  async getBaseLocations(reqBody: any): Promise<any> {
    const [items, count] = await this.baseLocationsRepo.findAndCount({order:{id: 'ASC'}, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) })
    return {items, count}
  }
  async editBaseLocation(reqBody: any): Promise<any> {
    const pointObject: Point = {
        type: "Point",
        coordinates: [reqBody.longitude,reqBody.latitude]
    };
    const baseLocationData = await this.baseLocationsRepo.update({id:reqBody.id}, {location: pointObject})
    return baseLocationData
}

  async getPortalSettings(reqBody: any): Promise<any> {
    const [items, count] = await this.portalSettingsRepo.findAndCount({order:{id: 'ASC'}, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 100) })
    return {items, count}
  }

  async addPortalSetting(reqBody: any): Promise<any> {
    const existing = await this.portalSettingsRepo.findOne({where:{setting_name: reqBody.setting_name}})
    if (existing) {
      return {message: 'A setting with this name already exists'}
    }
    const settingInput = {
      setting_name: reqBody.setting_name,
      setting_value: !!reqBody.setting_value,
      created_by: reqBody.created_by
    }
    const settingData = await this.portalSettingsRepo.save(settingInput)
    await this.syncPortalSettingRedis(settingData.setting_name, settingData.setting_value)
    return settingData
  }

  async editPortalSetting(reqBody: any): Promise<any> {
    const setting = await this.portalSettingsRepo.findOneBy({id: reqBody.id})
    const settingValue = !!reqBody.setting_value
    const settingData = await this.portalSettingsRepo.update({id: reqBody.id}, {
      setting_value: settingValue,
      updated_by: reqBody.updated_by
    })
    if (setting) {
      await this.syncPortalSettingRedis(setting.setting_name, settingValue)
    }
    return settingData
  }

  // Website "Book a Demo" form submission - reuses the same nodemailer
  // transport as the invoice emails above.
  async bookDemo(reqBody: any): Promise<boolean> {
    const mailOptions = {
      from: 'noreplygo.20221@gmail.com',
      to: 'admin@goodmove.in',
      subject: 'New Book a Demo request',
      text: `New demo request from the website:

Name: ${reqBody.name}
Mobile: ${reqBody.mobile}
Email: ${reqBody.email}
Additional Info: ${reqBody.additionalInfo || '-'}`,
    }
    return new Promise((resolve) => {
      mail.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
          resolve(false)
        } else {
          console.log('Email sent: ' + info.response);
          resolve(true)
        }
      });
    })
  }

  // Mirrors known portal settings into Redis so services like the auto-allocation
  // algorithm can read their current value without querying Postgres.
  private async syncPortalSettingRedis(settingName: string, settingValue: boolean): Promise<void> {
    if (settingName === PAUSE_AUTO_ALLOCATION_SETTING) {
      await this.redis.set(PAUSE_AUTO_ALLOCATION_REDIS_KEY, settingValue ? '1' : '0')
      console.log(`[portalSettings] synced Redis key=${PAUSE_AUTO_ALLOCATION_REDIS_KEY} value=${settingValue}`)
    }
  }
    public async getNearestCC(loc: any) {
        let origin = {
          type: "Point",
          coordinates: [loc.long, loc.lat]
        };
       let  locations = await this.ccRepo
            .createQueryBuilder('consolidation_centers')
            .select(['*','ST_Distance(location, ST_SetSRID(ST_GeomFromGeoJSON(:origin), ST_SRID(location)))/1000 AS distance' ])
            .orderBy("distance","ASC")
            .setParameters({
               // stringify GeoJSON
              origin: JSON.stringify(origin)
            })
           .getRawMany();
        return locations[0];
    }
    public async getDistanceToCC(loc: any) {
        let origin = {
          type: "Point",
          coordinates: [loc.long, loc.lat]
        };
       let  locations = await this.ccRepo
            .createQueryBuilder('consolidation_centers')
            .select(['*','ST_Distance(location, ST_SetSRID(ST_GeomFromGeoJSON(:origin), ST_SRID(location)))/1000 AS distance' ])
            .where("id = :id", {id: loc.ccId})
            .orderBy("distance","ASC")
            .setParameters({
               // stringify GeoJSON
              origin: JSON.stringify(origin)
            })
           .getRawOne();
        return locations;
    }
    
    public async getDriverNearestBaseLocation(loc: any) {
      let origin = {
        type: "Point",
        coordinates: [loc.long, loc.lat]
      };
     let  locations = await this.baseLocationsRepo
          .createQueryBuilder('base_locations')
          .select(['*','ST_Distance(location, ST_SetSRID(ST_GeomFromGeoJSON(:origin), ST_SRID(location)))/1000 AS distance' ])
          .where("unique_id = :id", {id: loc.driver_id})
          .orderBy("distance","ASC")
          .setParameters({
             // stringify GeoJSON
            origin: JSON.stringify(origin)
          })
         .getRawMany();
      return locations[0];
    }
    public async getMainNearestBaseLocation(loc: any) {
      let origin = {
        type: "Point",
        coordinates: [loc.long, loc.lat]
      };
     let  locations = await this.baseLocationsRepo
          .createQueryBuilder('base_locations')
          .select(['*','ST_Distance(location, ST_SetSRID(ST_GeomFromGeoJSON(:origin), ST_SRID(location)))/1000 AS distance' ])
          .where("is_main_base = :id", {id: true})
          .orderBy("distance","ASC")
          .setParameters({
             // stringify GeoJSON
            origin: JSON.stringify(origin)
          })
         .getRawMany();
      return locations[0];
    }
    async getCategories(reqBody: any): Promise<any> {
        const packagingTypes = await this.catRepo.find({where: {cate_type: 'packaging_type'}})
        const volumeTypes = await this.catRepo.find({where: {cate_type: 'volume_unit'}})
        const lengthTypes = await this.catRepo.find({where: {cate_type: 'length_unit'}})
        const heightTypes = await this.catRepo.find({where: {cate_type: 'height_unit'}})
        const dimentionTypes = await this.catRepo.find({where: {cate_type: 'dimension_unit'}})
        const breadthTypes = await this.catRepo.find({where: {cate_type: 'breadth_unit'}})
        const weightTypes = await this.catRepo.find({where: {cate_type: 'weight_unit'}})
        const commodityTypes = await this.catRepo.find({where: {cate_type: 'commodity_type'}})
        return {
            "packaging_types": packagingTypes,
            'volume_unit_types': volumeTypes,
            'length_unit_types': lengthTypes,
            'height_unit_types': heightTypes,
            'breadth_unit_types': breadthTypes,
            'weight_unit_types': weightTypes,
            'commodity_type_types': commodityTypes,
            'dimension_unit_types': dimentionTypes
        }
    }

    async sendNotification(reqBody: any): Promise<any> {
        const payload = {
            notification: {
                title: "test",
                body: "test body"
            }
        }
        return await admin.messaging().sendToDevice(reqBody.token, payload)
    }

    async sendPushNotification(title: string, body: string, savedPushTokens: any ) {
        let notifications = [];
        for (let pushToken of savedPushTokens) {
          if (!Expo.isExpoPushToken(pushToken)) {
            // console.error(`Push token ${pushToken} is not a valid Expo push token`);
            continue;
          }
      
          notifications.push({
            to: pushToken,
            sound: "default",
            title: title,
            body: body,
            data: { body }
          });
        }
      
        let chunks = expo.chunkPushNotifications(notifications);
      
        (async () => {
          for (let chunk of chunks) {
            try {
              let receipts = await expo.sendPushNotificationsAsync(chunk);
              console.log(receipts);
              return receipts
            } catch (error) {
              console.error(error);
              return null
            }
          }
        })();
        return 
      };
    
    async sendSingleInvoice(filePath: string): Promise<any> {
      const schema: any = {
        'Invoice No.' : {
          prop: 'invoiceNo'
        },
        'Invoice Date' : {
          prop: 'invoiceDate',
          type: (value) => {
            return new Date(value).toLocaleDateString("en-US")
          }
        },
        'Name of the company' : {
          prop: 'company'
        },
        'From' : {
          prop: 'from'
        },
        'To' : {
          prop: 'to'
        },
        'Freight charges based on load and distance' : {
          prop: 'freightCharges'
        },
        'Waiting charges' : {
          prop: 'waitingCharges'
        },
        'Discount' : {
          prop: 'discount'
        },
        'Total charges' : {
          prop: 'totalCharges'
        },
        'SGST' : {
          prop: 'sgst'
        },
        'CGST' : {
          prop: 'cgst'
        },
        'Tax Amount Payable' : {
          prop: 'tax'
        },
        'Address of the company' : {
          prop: 'companyAddress'
        },
        'Name of the customer' : {
          prop: 'customerName'
        },
        'Mobile no' : {
          prop: 'mobile'
        },
        'email id' : {
          prop: 'email'
        },
        'GST No.' : {
          prop: 'gstNo'
        },
        'tatt' : {
          prop: 'tatt'
        },
        'tpa' : {
          prop: 'tpa'
        }
      }
      const pdfOptions: any = {
        childProcessOptions: {
          env: {
            OPENSSL_CONF: '/dev/null',
          },
        }
      }
      let data = await readXlsxFile(filePath, {schema})
      // console.log(data)
      for (let row of data.rows) {
        // console.log(row)
            
            var template = './public/invoice.html'
            var pdf_path = './public/inv3.pdf'
            // console.log(template)
            var html = fs.readFileSync(template, 'utf8');
            
            for(let key in schema) {
              if(key == 'email id') {
                html = html.replace('{{'+key+"}}", row[schema[key].prop].split(",")[0])
              } else {
                html = html.replace('{{'+key+"}}", row[schema[key].prop])
              }
              
            }
            // console.log(html)
            pdf.create(html, pdfOptions).toFile(pdf_path, function(err, res1) {
              if (err) return console.log(err);
              // console.log(res1); // { filename: '/app/businesscard.pdf' }
              fs.existsSync(res1.filename)
              var mailOptions = {
                from: 'noreplygo.20221@gmail.com',
                to: row["email"] + ', admin@gogoodmove.com',
                // to: 'nageswararaonali@gmail.com',
                subject: 'G-O (Invoice No:'+row["invoiceNo"]+'): Thank you for shipping with us!',
                text: `Greetings from G-O!!!

Please find attached the invoice.
                
We deliver your goods safely while you focus on your core business!`,
                attachments: [
                      {   // file on disk as an attachment
                          filename: row["invoiceNo"]+'.pdf',
                          path: pdf_path // stream this file
                      }
                  ]
              }
              
              mail.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                  fs.unlinkSync(pdf_path);
                }
              });
            });
      }
      await fs.unlinkSync(filePath)
      return true
    }

    async sendBulkInvoice(filePath: string): Promise<any> {
      const schema: any = {
        'Invoice No.' : {
          prop: 'invoiceNo'
        },
        'Invoice Date' : {
          prop: 'invoiceDate',
          type: (value) => {
            return new Date(value).toLocaleDateString("en-US")
          }
        },
        'Name of the company' : {
          prop: 'company'
        },
        'Booking date' : {
          prop: 'bookingDate'
        },
        'Total bookings' : {
          prop: 'totalBookings'
        },
        'Freight charges based on load and distance' : {
          prop: 'freightCharges'
        },
        'Waiting charges' : {
          prop: 'waitingCharges'
        },
        'Discount' : {
          prop: 'discount'
        },
        'Total charges' : {
          prop: 'totalCharges'
        },
        'SGST' : {
          prop: 'sgst'
        },
        'CGST' : {
          prop: 'cgst'
        },
        'Tax Amount Payable' : {
          prop: 'tax'
        },
        'Address of the company' : {
          prop: 'companyAddress'
        },
        'Name of the customer' : {
          prop: 'customerName'
        },
        'Mobile no' : {
          prop: 'mobile'
        },
        'email id' : {
          prop: 'email'
        },
        'GST No.' : {
          prop: 'gstNo'
        },
        'tatt' : {
          prop: 'tatt'
        },
        'tpa' : {
          prop: 'tpa'
        }
      }
      const pdfOptions: any = {
        childProcessOptions: {
          env: {
            OPENSSL_CONF: '/dev/null',
          },
        }
      }
      let data = await readXlsxFile(filePath, {schema})
      // console.log(data)
      // for await (let row of data.rows) {
        data.rows.map((row) => {
        // console.log(row)
            
        var template = './public/bulkinvoice.html'
        var pdf_path = './public/'+row["invoiceNo"]+'.pdf'
        // console.log(template)
        var html = fs.readFileSync(template, 'utf8');
        
        for(let key in schema) {
          if(key == 'email id') {
            html = html.replace('{{'+key+"}}", row[schema[key].prop].split(",")[0])
          } else {
            html = html.replace('{{'+key+"}}", row[schema[key].prop])
          }
        }
        // console.log(html)
        pdf.create(html, pdfOptions).toFile(pdf_path, function(err, res1) {
          if (err) return console.log(err);
          console.log(res1); // { filename: '/app/businesscard.pdf' }
          fs.existsSync(res1.filename)
          var mailOptions = {
            from: 'noreplygo.20221@gmail.com',
            to: row["email"] + ', admin@gogoodmove.com',
            // to: 'nageswararaonali@gmail.com',
            subject: 'G-O (Invoice No:'+row["invoiceNo"]+'): Thank you for shipping with us!',
            text: `Greetings from G-O!!!

Please find attached the invoice.
            
We deliver your goods safely while you focus on your core business!`,
            attachments: [
                  {   // file on disk as an attachment
                      filename: row["invoiceNo"]+'.pdf',
                      path: pdf_path // stream this file
                  }
              ]
          }
          
          mail.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
              fs.unlinkSync(pdf_path);
            }
          });
        });
      })
      await fs.unlinkSync(filePath)
      return true
    }

    async sendFlipkartBulkInvoice(filePath: string): Promise<any> {
      const schema = {
        'Invoice No.' : {
          prop: 'invoiceNo'
        },
        'Invoice Date' : {
          prop: 'invoiceDate',
          type: (value) => {
            return new Date(value).toLocaleDateString("en-US")
          }
        },
        'Name of the company' : {
          prop: 'company'
        },
        'Booking date' : {
          prop: 'bookingDate'
        },
        'Total bookings' : {
          prop: 'totalBookings'
        },
        'Freight charges based on load and distance' : {
          prop: 'freightCharges'
        },
        'Waiting charges' : {
          prop: 'waitingCharges'
        },
        'Discount' : {
          prop: 'discount'
        },
        'Total charges' : {
          prop: 'totalCharges'
        },
        'SGST' : {
          prop: 'sgst'
        },
        'CGST' : {
          prop: 'cgst'
        },
        'Tax Amount Payable' : {
          prop: 'tax'
        },
        'Address of the company' : {
          prop: 'companyAddress'
        },
        'Name of the customer' : {
          prop: 'customerName'
        },
        'Mobile no' : {
          prop: 'mobile'
        },
        'email id' : {
          prop: 'email'
        },
        'GST No.' : {
          prop: 'gstNo'
        }
      }
      const pdfOptions: any = {
        childProcessOptions: {
          env: {
            OPENSSL_CONF: '/dev/null',
          },
        }
      }
      let data = await readXlsxFile(filePath, {schema})
      // console.log(data)
      // for await (let row of data.rows) {
        data.rows.map((row: any) => {
        console.log(row)
        let totalFreightCharges = row['totalCharges'] + row['tax'];
            
        var template = './public/bulkinvoice.html'
        var pdf_path = './public/'+row["invoiceNo"]+'.pdf'
        // console.log(template)
        var html = fs.readFileSync(template, 'utf8');
        
        for(let key in schema) {
          if(key == 'email id') {
            html = html.replace('{{'+key+"}}", row[schema[key].prop].split(",")[0])
          } else {
            html = html.replace('{{'+key+"}}", row[schema[key].prop])
          }
        }
        html = html.replace('{{Final-Total-Charges}}', totalFreightCharges)
        // console.log(html)
        pdf.create(html, pdfOptions).toFile(pdf_path, function(err, res1) {
          if (err) return console.log(err);
          console.log(res1); // { filename: '/app/businesscard.pdf' }
          fs.existsSync(res1.filename)
          var mailOptions = {
            from: 'noreplygo.20221@gmail.com',
            to: row["email"] + ', admin@gogoodmove.com',
            // to: 'nageswararaonali@gmail.com',
            subject: 'G-O (Invoice No:'+row["invoiceNo"]+'): Thank you for shipping with us!',
            text: `Greetings from G-O!!!

Please find attached the invoice.
            
We deliver your goods safely while you focus on your core business!`,
            attachments: [
                  {   // file on disk as an attachment
                      filename: row["invoiceNo"]+'.pdf',
                      path: pdf_path // stream this file
                  }
              ]
          }
          
          // mail.sendMail(mailOptions, function(error, info){
          //   if (error) {
          //     console.log(error);
          //   } else {
          //     console.log('Email sent: ' + info.response);
          //     fs.unlinkSync(pdf_path);
          //   }
          // });
        });
      })
      await fs.unlinkSync(filePath)
      return true
    }

    async sendCustomerNotifications(): Promise<any> {
      const allCustomers = await this.usersRepo.find({where: {user_type : 'Customer', device_token: Not('')}})
      for(let customer of allCustomers) {
        const title = "Hey " + customer.name + ","
        const body = "Looking for a partner to deliver your goods? Start shipping with GoodMove. Your safe, reliable and affordable city logistics partner."
        await this.sendPushNotification(title, body, customer.device_token.split(","))
      }
      return true
    }

    async sendNotificationToUsers(reqBody: any): Promise<any> {
      const allCustomers = await this.usersRepo.find({where: {id : In(reqBody.users), device_token: Not('')}})
      for(let customer of allCustomers) {
        const title = "Hey " + customer.name + ","
        const body = "Looking for a partner to deliver your goods? Start shipping with GoodMove. Your safe, reliable and affordable city logistics partner."
        await this.sendPushNotification(title, body, customer.device_token.split(","))
      }
      return true
    }

    async sendNotificationToAll(reqBody: any): Promise<any> {
      const allCustomers = await this.usersRepo.find({where: {device_token: Not('')}})
      for(let customer of allCustomers) {
        const title = "பொங்கல் வாழ்த்துக்கள்"
        const body = `இன்பம் பொங்கி வழியட்டும்
        இல்லங்களிலும் உள்ளங்களிலும்
        இனிய தைதிருநாள் நல்வாழ்த்துகள்`
        await this.sendPushNotification(title, body, customer.device_token.split(","))
      }
      return true
    }
    
    
}
