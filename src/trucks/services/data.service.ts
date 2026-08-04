import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Like, Not, Repository } from 'typeorm';
import * as moment from 'moment';
import { ShopsEntity } from '../models/shop.entity';
import { Point } from 'geojson';
import { UtilsService } from 'src/utils/services/utils.service';
import { ConfigService } from '@nestjs/config';
import { RateDetailsEntity } from '../models/gmRates';
import { parse } from 'csv-parse';
import { CustomerCompanyEntity } from '../models/cusomerCompanyDetails';
import { SpecialAddressEntity } from 'src/users/models/specialAddress.entity';
import { BookingEntity } from 'src/bookings/models/booking.entity';
import { BookingStatusEntity } from 'src/bookings/models/bookingStatus.entity';
import { CustomerAddressRatesEntity } from '../models/customerAddressRates.entity';

var QRCode = require('qrcode')
var fs = require("fs")

@Injectable()
export class DataService {
    constructor(
        @InjectRepository(ShopsEntity)
        private shopsRepo: Repository<ShopsEntity>,
        @InjectRepository(RateDetailsEntity)
        private gmRates: Repository<RateDetailsEntity>,
        @InjectRepository(CustomerCompanyEntity)
        private customerCompany: Repository<CustomerCompanyEntity>,
        @InjectRepository(SpecialAddressEntity)
        private splAddressRepo: Repository<SpecialAddressEntity>,
        @InjectRepository(BookingEntity)
        private bookingRepository: Repository<BookingEntity>,
        @InjectRepository(BookingStatusEntity)
        private bsRepo: Repository<BookingStatusEntity>,
        @InjectRepository(CustomerAddressRatesEntity)
        private carRepo: Repository<CustomerAddressRatesEntity>,
        private utilsService: UtilsService,
        private configService: ConfigService
    ){

    }

    updateGMRates = async (reqBody): Promise<any> => {
        let csvData = [];
        const that = this
        fs.createReadStream('./public/data/rates_data.csv')
            .pipe(parse({delimiter: ','}))
            .on('data', function(csvrow) {
                console.log(csvrow);
                //do something with csvrow
                csvData.push(csvrow);        
            })
            .on('end',async function() {
            //do something with csvData
            // console.log(csvData);
                let i=0;
                for(let rate of csvData) {
                    if(i != 0) {
                        let reqObj = {
                            base_rate: rate[2],
                            rate_per_km: rate[3],
                            loading: rate[4],
                            unloading: rate[5],
                            loading_unloading: rate[6]
                        }
                        let whereCon = {
                            id: rate[0],
                            quantity: rate[1],
                            company_id: rate[7]
                        }
                        console.log(whereCon)
                        console.log(reqObj)
                        let upd = await that.gmRates.update(whereCon, reqObj)
                        console.log(upd)
                    }
                    i++;
                }
            });
            // let i=0;
            // for(let rate of csvData) {
            //     if(i != 0) {
            //         let reqObj = {
            //             base_rate: rate[2],
            //             rate_per_km: rate[3],
            //             loading: rate[4],
            //             unloading: rate[5],
            //             loading_unloading: rate[6]
            //         }
            //         let whereCon = {
            //             id: rate[0],
            //             quantity: rate[1],
            //             company_id: rate[7]
            //         }
            //         console.log(whereCon)
            //         console.log(reqObj)
            //         await this.gmRates.update(whereCon, reqObj)
            //     }
            //     i++;
            // }
        return csvData;
        /*const shopInput = {
            "contact_number": reqBody.contact_number,
            "shop_name": reqBody.shop_name,
            "latitude": reqBody.latitude,
            "longitude": reqBody.longitude,
            "address": reqBody.address,
            "shop_type": reqBody.shop_type,
            "status": "Active",
            "location": pointObject
        }
        const shopData = await this.shopsRepo.save(shopInput)
        
        return shopData*/
    }

    updateCompanyData = async (reqBody): Promise<any> => {
        let csvData = [];
        const that = this;
        fs.createReadStream('./public/data/companies_data.csv')
            .pipe(parse({delimiter: ','}))
            .on('data', function(csvrow) {
                csvData.push(csvrow);        
            })
            .on('end',async function() {
                let i=0;
                for(let cpy of csvData) {
                    if(i != 0) {
                        let reqObj = {
                            company_name: cpy[1],
                            users: cpy[2],
                            return_percentage: cpy[3],
                            min_base_fare: cpy[4],
                            extra_charge_percentage: cpy[5],
                            additional_pickup_charge: cpy[6],
                            return_percentage_value: cpy[7],
                            // is_active: cpy[8],
                            name: cpy[9],
                            mobile: cpy[10],
                            email: cpy[11],
                            address: cpy[12],
                            gst: cpy[13],
                            billing_cycle: cpy[14],
                            waiting_charge_type: cpy[15],
                            loading_charge: cpy[16],
                            address_id: cpy[17] ? cpy[17] : 0,
                            // is_discount_applicable: cpy[18],
                            discount_on_waiting_charges: cpy[19],
                            dead_miles_price: cpy[20]
                        }
                        let whereCon = {
                            id: cpy[0]
                        }
                        console.log(whereCon)
                        console.log(reqObj)
                        await that.customerCompany.update(whereCon, reqObj)
                    }
                    i++;
                }
            });
            
        return csvData;
    }

    feedSpecialAddress = async (reqBody): Promise<any> => {
        const pointObject: Point = {
            type: "Point",
            coordinates: [reqBody.longitude, reqBody.latitude]
        };
        let reqObj = {
            latitude: reqBody.latitude,
            longitude: reqBody.longitude,
            location: pointObject,
            amount: reqBody.amount
        }
        return await this.splAddressRepo.save(reqObj)
    }

    updateMultiBookingId = async (reqBody): Promise<any> => {
        let bookings = await this.bookingRepository.find({where: {multi_booking_id: ''}, take: 10000})
        for(let booking of bookings) {
            let multi_booking_id = (new Date(booking.pickup_time).getTime()).toString(36);
            console.log(booking.id, booking.multi_booking_id, multi_booking_id)
            await this.bookingRepository.update({id: booking.id}, {multi_booking_id: multi_booking_id})

        }
        return true
    }
    
    cTimeUpdatesOld = async (reqBody): Promise<any> => {
        let csvData = [];
        const that = this;
        fs.createReadStream('./public/time_updates.csv')
            .pipe(parse({delimiter: ','}))
            .on('data', function(csvrow) {
                csvData.push(csvrow);        
            })
            .on('end',async function() {
                let i=0;
                for(let cpy of csvData) {
                    if(i != 0) {
                        console.log("id ", cpy[0], cpy[8])
                        let prdFormat = cpy[2].split(" ")[0]
                        let prdts = prdFormat.split("-")
                        let prtimed = prdts[2]+"-"+prdts[1]+"-"+prdts[0]+" "+cpy[2].split(" ")[1]
                        let prtime = moment(prtimed).format('YYYY-MM-DD HH:mm:ss')

                        let pddFormat = cpy[3].split(" ")[0]
                        let pddts = pddFormat.split("-")
                        let pdtimed = pddts[2]+"-"+pddts[1]+"-"+pddts[0]+" "+cpy[3].split(" ")[1]
                        let pdtime = moment(pdtimed).format('YYYY-MM-DD HH:mm:ss')

                        let crdFormat = cpy[4].split(" ")[0]
                        let crdts = crdFormat.split("-")
                        let crtimed = crdts[2]+"-"+crdts[1]+"-"+crdts[0]+" "+cpy[4].split(" ")[1]
                        let crtime = moment(crtimed).format('YYYY-MM-DD HH:mm:ss')

                        let cddFormat = cpy[5].split(" ")[0]
                        let cddts = cddFormat.split("-")
                        let cdtimed = cddts[2]+"-"+cddts[1]+"-"+cddts[0]+" "+cpy[5].split(" ")[1]
                        let cdtime = moment(cdtimed).format('YYYY-MM-DD HH:mm:ss')

                        let upd = {
                            reached_pickup: cpy[2],
                            completed_pickup: cpy[3],
                            reached_drop: cpy[4],
                            completed_drop: cpy[5],
                        }
                        console.log(upd)
                        await that.bookingRepository.update({id: cpy[0]}, upd)
                    }
                    i++;
                }
            });
            
        return csvData;
    }

    cTimeUpdates = async (reqBody): Promise<any> => {
        
        let csvData = [];
        const that = this;
        fs.createReadStream('./public/may_21.csv')
            .pipe(parse({delimiter: ','}))
            .on('data', function(csvrow) {
                csvData.push(csvrow);        
            })
            .on('end',async function() {
                let i=0;
                for(let cpy of csvData) {
                    if(i != 0) {
                        console.log("id ", cpy[0], cpy[9])
                        let cTime = moment(cpy[9]).add(330, 'minutes').format('YYYY-MM-DD HH:mm:ss')
                        let upd = {
                            completed_drop: cTime,
                        }
                        console.log(upd)
                        await that.bookingRepository.update({id: cpy[0]}, upd)
                    }
                    i++;
                }
            });
            
        return csvData;
    }

    updateBookingTimes = async (reqBody): Promise<any> => {
        // let customers = [887,390,389,391,392,399,400,402,425,651,403,409,396,538,537,740,835,876,888,406,444,458,459,601,539,838,385,849]
        const bookings = await this.bookingRepository.createQueryBuilder('b')
                                            .select('id, customer_id, reached_pickup')
                                            .where("reached_pickup > :fpickupDate and reached_pickup < :epickupDate", {fpickupDate: '2024-06-01', epickupDate: '2024-06-07'})
                                            .orderBy('reached_pickup')
                                            .getRawMany()
        let bIds = ''
        let nids = ''
        if(bookings && bookings.length) {
            for(let booking of bookings) {
                let bTimes = {};
                let bookingStatus = await this.bsRepo.find({where:{booking_id: booking.id, status: In (['Reached pickup', 'Completed pickup', 'Reached drop', 'Completed drop'])}})
                if(bookingStatus.length) {
                    let i=0;
                    for(let bStatus of bookingStatus) {
                        let cTime = moment(bStatus['updated_at']).add(330, 'minutes').format('YYYY-MM-DD HH:mm:ss')
                        if(bStatus['status'] == 'Reached pickup') {
                            bTimes['reached_pickup'] = cTime
                            i++
                        }
                        if(bStatus['status'] == 'Completed pickup') {
                            bTimes['completed_pickup'] = cTime
                            i++
                        }
                        if(bStatus['status'] == 'Reached drop') {
                            bTimes['reached_drop'] = cTime
                            i++
                        }
                        if(bStatus['status'] == 'Completed drop') {
                            bTimes['completed_drop'] = cTime
                            i++
                        }
                    }
                    await this.bookingRepository.update({id: booking.id}, bTimes)
                    
                } else {
                    console.log("no times ----------------------")
                }
                
                console.log(booking.id, booking.customer_id, booking.reached_pickup)
                console.log(bTimes)
                
                bIds = bIds + booking.id + ','
            }
        }
        console.log(bookings.length)
        console.log(bIds)
        console.log("--------------")
        console.log(nids)
        return true
    }

    formBookingData = async (reqBody): Promise<any> => {
        let bData = [
            [46585,	"2024-11-18 02:59:55.320"],
            [46586,	"2024-11-18 02:59:59.472"],
            [46589,	"2024-11-18 03:36:53.784"]];
        
        let bString = "";
        const reportFileName= './public/bks_17_28_bks.csv';
        const headerData = ['Booking id', 'Date']
        for(let i=0; i<headerData.length; i++){
            bString += headerData[i] + ","
        }
        bString += '\n'
        for(let bkg of bData) {
            console.log(bkg[0]+',\t'+moment(bkg[1]).add(330, 'minutes').format('YYYY-MM-DD HH:mm:ss'))
            bString += bkg[0] + "," + moment(bkg[1]).add(330, 'minutes').format('YYYY-MM-DD HH:mm:ss') + '\n'
            // bookings.push(booking)
        }
        await fs.writeFileSync(reportFileName, bString, 'utf8')
            
        
    }

    feedCompanyAddressRates = async (reqBody): Promise<any> => {
        console.log("code running ...")
        let csvData = [];
        const that = this;
        fs.createReadStream('./public/BalajiRatesFile.csv')
            .pipe(parse({delimiter: ','}))
            .on('data', function(csvrow) {
                console.log("data on ")
                csvData.push(csvrow);        
            })
            .on('end',async function() {
                let i=0;
                console.log("loading .....")
                for(let addrData of csvData) {
                    if(i != 0) {
                        console.log("addr ", addrData[0],4, addrData[19], addrData[20])
                        
                        // await that.bookingRepository.update({id: cpy[0]}, upd)
                        if(addrData[19] && addrData[20]) {
                            let objd = {
                                company_id: 4,
                                address_id: addrData[0],
                                fare: parseFloat(addrData[19]),
                                return_fare: parseFloat(addrData[20])
                            }
                            console.log(objd)
                            await that.carRepo.save(objd)
                        }
                        
                    }
                    i++;
                }
            });
            
        return csvData;
    }
    
    
}
