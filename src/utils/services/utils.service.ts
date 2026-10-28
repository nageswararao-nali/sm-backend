import { HttpService } from '@nestjs/axios';
import { ConsoleLogger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { lastValueFrom } from 'rxjs';
import { TourRouteEntity } from 'src/tours/models/tourRoute.entity';
import { DriversEntity } from 'src/trucks/models/driver.entity';
import { UsersEntity } from 'src/users/models/users.entity';
import { Like, Repository, getManager, DataSource } from 'typeorm';
import { CategoriesEntity } from '../models/categories.entity';
import { Expo } from 'expo-server-sdk';
import { DriverSessionsEntity } from 'src/trucks/models/driverSessions.entity';
import { S3 } from 'aws-sdk';
import { CustomerCompanyEntity } from 'src/trucks/models/cusomerCompanyDetails';
import { map } from 'rxjs/operators';
import * as moment from 'moment';
import { BaseLocationsEntity } from 'src/admin/models/baseLocations.entity';
import { DriverSessionDistanceEntity } from 'src/trucks/models/driverSessionDistance.entity';

let expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

@Injectable()
export class UtilsService {
    constructor(
        private httpService: HttpService,
        private configService: ConfigService,
        @InjectRepository(UsersEntity)
        private usersRepository: Repository<UsersEntity>,
        @InjectRepository(CategoriesEntity)
        private categoriesRepository: Repository<CategoriesEntity>,
        @InjectRepository(DriversEntity)
        private driversRepository: Repository<DriversEntity>,
        @InjectRepository(DriverSessionsEntity)
        private dsRepository: Repository<DriverSessionsEntity>,
        @InjectRepository(TourRouteEntity)
        private tourRouteRepository: Repository<TourRouteEntity>,
        @InjectRepository(CustomerCompanyEntity)
        private companyRepo: Repository<CustomerCompanyEntity>,
        @InjectRepository(BaseLocationsEntity)
        private baseLocationsRepo: Repository<BaseLocationsEntity>,
        @InjectDataSource() private dataSource: DataSource,
        @InjectRepository(DriverSessionDistanceEntity)
        private driverSessionDistance: Repository<DriverSessionDistanceEntity>,
        ) {}
    async sendOtp(mobile: string): Promise<any> {
        const otp_url = "https://api.msg91.com/api/v5/otp?authkey="+this.configService.get('MMSG91_AUTHKEY')+"&template_id="+this.configService.get('MSG91_SEND_OTP_TEMPLATE_ID')+"&DLT_TE_ID="+this.configService.get('MSG91_SEND_OTP_DLT_ID')+"&otp_length="+this.configService.get('OTP_LENGTH')+"&mobile=+91"+mobile;
        console.log(otp_url)
        let res = await lastValueFrom(this.httpService.get(otp_url, { 
            headers: { "Accept-Encoding": "gzip,deflate,compress" } 
        }))
        console.log(res)
        console.log(res.data)
        return res.data
    }

    async verifyOtp(mobile: string, otp: number): Promise<any> {
        const verify_otp_url = "https://api.msg91.com/api/v5/otp/verify?mobile=+91"+mobile+"&otp="+otp+"&authkey="+this.configService.get('MMSG91_AUTHKEY')
        let res = await lastValueFrom(this.httpService.get(verify_otp_url, { 
            headers: { "Accept-Encoding": "gzip,deflate,compress" } 
        }))
        return res.data
    }
    
    async sendBookingSMS(data: any): Promise<any> {
        const url = this.configService.get('MSG_SEND_SMS_URL')
        const options = {
            headers: {
                'authkey': this.configService.get('MMSG91_AUTHKEY'),
                'Content-Type': 'application/json'
            }
        }
        const respData = await lastValueFrom(
            this.httpService.post(url, data, options).pipe(
              map(resp => resp.data)
            )
          );
        return respData
    }

    async getUserById(user_id: number): Promise<any> {
        const user = await this.usersRepository.findOneBy({id: user_id});
        return user
    }

    async getName(cust_id: number): Promise<any> {
        const user = await this.usersRepository.findOneBy({id: cust_id});
        return user ? user.name : ''
    }

    async getCatName(cat_id: number): Promise<any> {
        const category = await this.categoriesRepository.findOneBy({id: cat_id});
        return category ? category.cate_name : ''
    }

    async getDeviceToken(cust_id: number): Promise<any> {
        const user = await this.usersRepository.findOneBy({id: cust_id});
        return user ? user.device_token : ''
    }

    async getBookingId(bookingId: any): Promise<any> {
        if (typeof bookingId === 'number'){
            return '#'+bookingId
        } else {
            return '#C'+bookingId
        }
    }
    async getDriverName(driver_id: number): Promise<any> {
        const driver = await this.driversRepository.findOneBy({id: driver_id});
        return driver ? driver.name : ''
    }
    async driverDarkroom(driver_id: number, status: boolean): Promise<any> {
        const driver = await this.driversRepository.update({user_id: driver_id}, {is_darkroom: status});
        return driver 
    }
    async isUserWithDriver(driver_id: number): Promise<any> {
        const driver = await this.driversRepository.findOneBy({user_id: driver_id});
        return driver
    }
    async getCCManagerByccId(cc_id: number): Promise<any> {
        const ccManager = await this.usersRepository.findOneBy({cc_id, status: 'Active'});
        return ccManager ? ccManager.id : null
    }
    
    async getDistance(from: any, to: any): Promise<any> {
        const otp_url = "https://maps.googleapis.com/maps/api/distancematrix/json?origins="+from.lat+","+from.long+"&destinations="+to.lat+","+to.long+"&key="+process.env.GOOGLE_MAPS_API_KEY;
        let res = await lastValueFrom(this.httpService.get(otp_url))
        return res.data
    }

    async getMinDistance(from: any, to: any): Promise<any> {
        const otp_url = "https://maps.googleapis.com/maps/api/directions/json?destination="+to.lat+","+to.long+"&origin="+from.lat+","+from.long+"&key="+process.env.GOOGLE_MAPS_API_KEY+"&alternatives=true";
        let res = await lastValueFrom(this.httpService.get(otp_url))
        return res.data
    }

    async getDistanceFromOSM(from: any, to: any): Promise<any> {
        const otp_url = "http://router.project-osrm.org/route/v1/driving/"+from.long+","+from.lat+";"+to.long+","+to.lat+"?overview=false";
        let res = await lastValueFrom(this.httpService.get(otp_url))
        return res.data
    }

    async getDistanceFromGOOSM(from: any, to: any): Promise<any> {
        // const otp_url = "http://3.110.41.208:5000/route/v1/driving/"+from.long+","+from.lat+";"+to.long+","+to.lat+"?overview=false";
        // const otp_url = "http://router.project-osrm.org/route/v1/driving/"+from.long+","+from.lat+";"+to.long+","+to.lat+"?overview=false";
        // const otp_url = "https://routing.openstreetmap.de/routed-foot/route/v1/foot/"+from.long+","+from.lat+";"+to.long+","+to.lat+"?overview=false";
        // const otp_url = "https://osrm.goodmove.in/routed-foot/route/v1/foot/"+from.long+","+from.lat+";"+to.long+","+to.lat+"?overview=false";
        const otp_url = "https://osrm.goodmove.in/route/v1/driving/"+from.long+","+from.lat+";"+to.long+","+to.lat+"?overview=false";
        console.log(otp_url)
        let res = await lastValueFrom(this.httpService.get(otp_url))
        return res.data
    }

    async getDistanceFromGOOSMMatch(from: any, to: any, p1T: any, p2T: any): Promise<any> {
        const otp_url = "http://3.110.41.208:5000/match/v1/driving/"+from.long+","+from.lat+";"+to.long+","+to.lat+"?steps=true&overview=full"+"&timestamps="+p1T+";" +p2T+"&radiuses=50;50";
        // console.log(otp_url)
        let res = await lastValueFrom(this.httpService.get(otp_url))
        return res.data
    }

    async getWaypointsFromGOOSRM(from: any, to: any): Promise<any> {
        // const otp_url = "http://3.110.41.208:5000/route/v1/driving/"+from.long+","+from.lat+";"+to.long+","+to.lat+"?geometries=geojson";
        // const otp_url = "http://router.project-osrm.org/route/v1/driving/"+from.long+","+from.lat+";"+to.long+","+to.lat+"?geometries=geojson";
        const otp_url = "https://osrm.goodmove.in/route/v1/driving/"+from.long+","+from.lat+";"+to.long+","+to.lat+"?geometries=geojson";
        // console.log(otp_url)
        let res = await lastValueFrom(this.httpService.get(otp_url))
        return res.data
    }

    async getWaypointsWithTimeFromGOOSRM(from: any, to: any): Promise<any> {
        // const url = "http://router.project-osrm.org/route/v1/driving/"+from.long+","+from.lat+";"+to.long+","+to.lat+"?overview=full&steps=true&geometries=polyline6";
        const url = "https://osrm.goodmove.in/route/v1/driving/"+from.long+","+from.lat+";"+to.long+","+to.lat+"?overview=full&steps=true&geometries=polyline6";
        console.log(url)
        let res = await lastValueFrom(this.httpService.get(url))
        return res.data
    }

    async getGoogleSnappedPoints(pnts: string): Promise<any> {
        const map_url = "https://roads.googleapis.com/v1/snapToRoads?path="+pnts+"&interpolate=true&key="+process.env.GOOGLE_MAPS_API_KEY
        let res = await lastValueFrom(this.httpService.get(map_url))
        return res.data
    }

    async getGoogleAddressByLatLong(pnt: any): Promise<any> {
        const map_url = "https://maps.googleapis.com/maps/api/geocode/json?latlng="+pnt.lat+","+pnt.long+"&key="+process.env.GOOGLE_MAPS_API_KEY
        let res = await lastValueFrom(this.httpService.get(map_url))
        return res.data
    }

    async getGoogleAddressByPlaceId(placeId: string): Promise<any> {
        const map_url = "https://maps.googleapis.com/maps/api/geocode/json?place_id="+placeId+"&key="+process.env.GOOGLE_MAPS_API_KEY
        let res = await lastValueFrom(this.httpService.get(map_url))
        return res.data
    }

    async getTimeFromGoogle(from: any, to: any): Promise<any> {
        const map_url = "https://maps.googleapis.com/maps/api/distancematrix/json?destinations="+to.latitude+"%2C"+to.longitude+"&origins="+from.latitude+"%2C"+from.longitude+"&key="+process.env.GOOGLE_MAPS_API_KEY
        console.log(map_url)
        let res = await lastValueFrom(this.httpService.get(map_url))
        return res.data
    }

    

    async getTollCharges(from: any, to: any): Promise<any> {
        const headersRequest = {
            'Content-Type': 'application/json', // afaik this one is not needed
            'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY,
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.travelAdvisory.tollInfo,routes.legs.travelAdvisory.tollInfo',
        };
        const reqObj = {
            "origin":{
              "location":{
                "latLng":{
                  "latitude":from.lat,
                  "longitude":from.long
                }
              }
            },
            "destination":{
              "location":{
                "latLng":{
                  "latitude":to.lat,
                  "longitude": to.long
                }
              }
            },
            "travelMode": "DRIVE",
            "extraComputations": ["TOLLS"],
            "routeModifiers":{
              "vehicleInfo":{
                "emissionType": "GASOLINE"
              },
              "tollPasses": [
                "IN_FASTAG",
                "IN_LOCAL_HP_PLATE_EXEMPT"
              ]
            }
        }
        console.log(reqObj)
        const res = await lastValueFrom(this.httpService.post('https://routes.googleapis.com/directions/v2:computeRoutes', reqObj, { headers: headersRequest }));
        console.log(res.data)
        return res.data;
    }

    async getDistanceFromGOOSMMapMatch(points:  any, radius: number): Promise<any> {
        let i=0
        // let redius = 100
        let pointsstr = ''
        let timestamps = ''
        let radiuses = ''
        for (let point of points) {
            if(i==0) {
                pointsstr = pointsstr + point.longitude + ","+point.latitude; 
                timestamps = timestamps + point.timestamp
                radiuses = radiuses + radius
            } else {
                pointsstr = pointsstr + ";" + point.longitude + ","+point.latitude; 
                timestamps = timestamps + ";" + point.timestamp
                radiuses = radiuses + ";" + radius
            }
            i++
        }
        const otp_url = "http://3.110.41.208:5000/match/v1/driving/"+pointsstr+"?steps=true&overview=full&radiuses="+radiuses+"&timestamps="+timestamps;
        // console.log(otp_url)
        try {
            let res = await lastValueFrom(this.httpService.get(otp_url))
            // console.log(res)
            return res.data
        } catch(e) {
            console.log(otp_url)
            // console.log(e)
            return {code: 'NotOK'}
        }
        
    }

    async getTourPickupDistance(loc: any, sId: number): Promise<any> {
        let origin = {
        type: "Point",
        coordinates: [loc.long, loc.lat]
        };
        let locations = await this.tourRouteRepository
            .createQueryBuilder('tour_route')
            .select(['*','ST_Distance(location, ST_SetSRID(ST_GeomFromGeoJSON(:origin), ST_SRID(location)))/1000 AS distance'])
            .where("id = :id", {id: sId})
            .orderBy("distance","ASC")
            .setParameters({
                // stringify GeoJSON
                origin: JSON.stringify(origin)
            })
            .getRawOne();
        return locations;
    }
    
    async updateSeq(id: number, reqBody: any): Promise<any> {
        delete reqBody.mobile_number;
        const driverData = await this.tourRouteRepository.update(id, reqBody)
        return driverData;
    }

    async getSeq(id: number): Promise<any> {
        const seqData = await this.tourRouteRepository.findOneBy({id})
        return seqData;
    }

    async sendPushNotification(title: string, body: string, savedPushTokens: any, data: any = {} ) {
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
            data: { body, ...data }
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

    async closeSession(user_id: number, from_manager = false): Promise<any> {
        let sessionData = await this.dsRepository.findOne({where: {user_id: user_id, status: true}, order: {id: 'DESC'}})
        console.log("sessionData")
        console.log(sessionData)
        if(sessionData) {
            let updData = {
                status: false
            }
            if(!from_manager) {
                updData["session_end_time"] = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
            }
            await this.dsRepository.update({id: sessionData.id}, updData)
            await this.dsRepository.update({user_id: user_id}, {status: false})
            let distance = 0;
            sessionData = await this.dsRepository.findOneBy({id: sessionData.id})
            let [items] = await this.driverSessionDistance.findAndCount({where:{session_id: sessionData.id}})
            for(let item of items) {
                distance = distance + parseFloat(item.distance)
            }
            let start_time = moment(sessionData.session_start_time)
            let end_time = moment(sessionData.session_end_time)
            let duration_time = moment.duration(end_time.diff(start_time));
            let hours: any = duration_time.asHours();
            distance = Math.ceil(distance);
            // hours = Math.ceil(hours)
            hours = hours.toFixed(2)
            console.log(distance, hours)
            await this.dsRepository.update({id: sessionData.id}, {total_distance: distance.toString(), total_time: hours})
            console.log("step 2a")
        }
        return sessionData
    }

    async uploadS3(params) {
        const s3 = this.getS3();
        return new Promise((resolve, reject) => {
            s3.upload(params, (err, data) => {
            if (err) {
                reject(err.message);
            }
            resolve(data);
            });
        });
    }

    getS3() {
        return new S3({
            accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY')
        });
    }

    async getAllCustomers(): Promise<any> {
        const users = await this.usersRepository.find({where: {user_type: 'Customer'}});
        return users
    }

    async getUserDetails(user_id:  number): Promise<any> {
        const user = await this.usersRepository.findOneBy({id: user_id});
        return user
    }

    async companyUsers(user_id: number): Promise<any> {
        let company = await this.companyRepo.findOne({where: {users: Like(`%#${user_id},%`)}})
        return company
    }

    async getAllCompanies(reqBody: any): Promise<any> {
        let whereCon = {}
        if("is_active" in reqBody) {
            whereCon["is_active"] = reqBody.is_active
        }
        if(reqBody.bCycle) {
            whereCon["billing_cycle"] = reqBody.bCycle
        }
        if(reqBody.is_regular) {
            whereCon["is_regular"] = true
        }
        let companies = await this.companyRepo.find({where: whereCon, order:{id: 'DESC'}, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10)})
        return companies
    }

    async tagCutomerToCompany(reqBody: any): Promise<any> {
        let user_id = reqBody.user_id
        let company_id = reqBody.company_id
        let usercompany = await this.companyRepo.findOne({where: {users: Like(`%#${user_id},%`)}})
        if(usercompany) {
            let userCompanyUsers = usercompany.users.split(',')
            let index = userCompanyUsers.indexOf('#'+user_id.toString())
            userCompanyUsers.splice(index, 1)
            let usersd = userCompanyUsers.join(',')
            await this.companyRepo.update({id: usercompany.id}, {users: usersd})
        }
        let company = await this.companyRepo.findOneBy({id: company_id})
        let users = company.users + '#' + user_id + ","
        await this.companyRepo.update({id: company_id}, {users: users})
        return company
    }

    async findOrAddShopCustomer(customer_mobile: string): Promise<any> {
        let user = await this.usersRepository.findOne({where: {mobile: customer_mobile}});
        if(!user) {
            let userInput = {
                name: customer_mobile,
                mobile: customer_mobile,
                user_type: 'Customer',
                status: 'Active',
                is_available: false
            }
            user = await this.usersRepository.save(userInput)
        }
        
        return user;
    }

    async getCustomerByMobile(customer_mobile: string): Promise<any> {
        let user = await this.usersRepository.findOne({where: {mobile: customer_mobile}});
        return user;
    }

    async getDriverBaseLocation(driver_id: number): Promise<any> {
        if(driver_id) {
            let bLoc = await this.baseLocationsRepo.findOne({where: {unique_id: driver_id.toString()}});
            return bLoc;
        } else {
            return null
        }        
    }

    async getUnassignedCustomers(): Promise<any> {
        let unassignedCustomers = await this.dataSource.query("select u.* from users u left join customer_company cc on cc.users like concat('%#',u.id,',%') where u.user_type='Customer' and cc.id is null ")
        return unassignedCustomers
    }

    async addCustomerCompany(reqBody: any): Promise<any> {
        let companyData
        if(reqBody.id) {
            const { id, ...updateFields } = reqBody
            const existing = await this.companyRepo.findOneBy({ id })
            const mergedData = { ...existing, ...updateFields }
            companyData = await this.companyRepo.update({ id }, mergedData)
        } else {
            companyData = await this.companyRepo.save(reqBody)
        }
        return companyData
    }

    async callGoodMoveAPI(apiUrl: string, data: any): Promise<any> {
        const baseUrl = process.env.ENV == 'test' ? this.configService.get('testApiBaseUrl') : this.configService.get('prodApiBaseUrl')
        const url = baseUrl+apiUrl
        const options = {
            headers: {
                'Content-Type': 'application/json'
            }
        }
        const respData = await lastValueFrom(
            this.httpService.post(url, data, options).pipe(
              map(resp => resp.data)
            )
          );
        return respData
    }

    async sendBookingToSimulation(data: any): Promise<any> {
        const url = 'http://13.204.67.217:3000/add-booking'
        console.log("calling with ur ", url)
        const options = {
            headers: {
                'Content-Type': 'application/json'
            }
        }
        const respData = await lastValueFrom(
            this.httpService.post(url, data, options).pipe(
              map(resp => resp.data)
            )
          );
        console.log("calling done ")
        return respData
    }

    
}
