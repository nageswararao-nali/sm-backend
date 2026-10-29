import { Injectable, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Point } from 'geojson';
import { TourAssignTruckDriversEntity } from 'src/tours/models/tourAssignTruckDrivers.entity';
import { TourBookingDetailsEntity } from 'src/tours/models/tourBookingDetails.entity';
import { TourRouteEntity } from 'src/tours/models/tourRoute.entity';
import { ToursEntity } from 'src/tours/models/tours.entity';
import { DriversEntity } from 'src/trucks/models/driver.entity';
import { TrucksEntity } from 'src/trucks/models/truck.entity';
import { UtilsService } from 'src/utils/services/utils.service';
import { Between, In, IsNull, LessThan, Like, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { BookingsModule } from '../bookings.module';
import { TourService } from 'src/tours/services/tour.service';
import { LocationService } from 'src/trucks/services/location.service';
import { BookingEntity } from '../models/booking.entity';
import { BookingStatusEntity } from '../models/bookingStatus.entity';
import { TripEntity } from '../models/trip.entity';
import * as nodemailer from 'nodemailer'
import * as fs  from 'fs';
import * as pdf from 'html-pdf'
import 'moment-timezone';
import * as moment from 'moment';
import { S3 } from 'aws-sdk';
import { CustomerCompanyEntity } from 'src/trucks/models/cusomerCompanyDetails';
import { ShopsEntity } from 'src/trucks/models/shop.entity';
import { CustomerAddressEntity } from 'src/users/models/customerAddress.entity';
import { ConfigService } from '@nestjs/config';
import * as ccavenue from 'src/bookings/services/ccavenue';
import { DriverSessionDistanceEntity } from 'src/trucks/models/driverSessionDistance.entity';
import { InvoiceDetailsEntity } from '../models/invoiceDetails';
import { InvoiceNumberEntity } from '../models/invoiceNumber';
import { from } from 'rxjs';
import { RateDetailsEntity } from 'src/trucks/models/gmRates';
import { DeletedBookingsEntity } from '../models/deletedBookings.entity';
import { PendingBookingEntity } from '../models/pendingBookings';
import { CustomerBookingLogsEntity } from '../models/customerBookingLogs';
import { PaymentTransactionsEntity } from '../models/paymentTransactions.entity';
import { PaymentTransactionErrorsEntity } from '../models/paymentTransactionErrors.entity';
import { BookingTimeBackupEntity } from '../models/bdookingTimeBackup';
import { DriverSessionsEntity } from 'src/trucks/models/driverSessions.entity';
import { LocationsEntity } from 'src/trucks/models/locations.entity';
import { DeliveryProofEntity } from 'src/tours/models/deliveryProof.entity';
import { DriverLastLocationDetails } from 'src/trucks/models/driverLastLocDetails';
import { timeStamp } from 'console';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from 'src/common/redis/redis.provider';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BookingDispatchEntity } from '../models/bookingDispatch.entity';
import { BookingDispatchCandidateEntity } from '../models/bookingDispatchCandidate.entity';


var crypto = require('crypto');
const turl = require('turl');
var mail = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});
const cgstPercentage = 9;
const sgstPercentage = 9

@Injectable()
export class BookingService {
    baseUrl = ''
    paymentBaseUrl = ''
    apiBaseUrl = ''
    constructor(
        @InjectRepository(BookingEntity)
        private bookingRepo: Repository<BookingEntity>,
        @InjectRepository(TripEntity)
        private tripRepo: Repository<TripEntity>,
        private utilService: UtilsService,
        @InjectRepository(BookingStatusEntity)
        private bsRepo: Repository<BookingStatusEntity>,
        @InjectRepository(ToursEntity)
        private tourRepo: Repository<ToursEntity>,
        @InjectRepository(TrucksEntity)
        private truckRepo: Repository<TrucksEntity>,
        @InjectRepository(DriversEntity)
        private driverRepo: Repository<DriversEntity>,
        @InjectRepository(TourRouteEntity)
        private tourRouteRepo: Repository<TourRouteEntity>,
        @InjectRepository(TourBookingDetailsEntity)
        private tourBookingDetails: Repository<TourBookingDetailsEntity>,
        @InjectRepository(TourAssignTruckDriversEntity)
        private tourAssignTruckDriverRepository: Repository<TourAssignTruckDriversEntity>,
        @InjectRepository(CustomerCompanyEntity)
        private companyRepo: Repository<CustomerCompanyEntity>,
        @InjectRepository(ShopsEntity)
        private shopRepo: Repository<ShopsEntity>,
        @InjectRepository(CustomerAddressEntity)
        private cAddrRepo: Repository<CustomerAddressEntity>,
        @InjectRepository(DriverSessionDistanceEntity)
        private driverSessionDistance: Repository<DriverSessionDistanceEntity>,
        @InjectRepository(InvoiceDetailsEntity)
        private invoiceDetailsRepo: Repository<InvoiceDetailsEntity>,
        @InjectRepository(InvoiceNumberEntity)
        private invoiceNumberRepo: Repository<InvoiceNumberEntity>,
        @InjectRepository(RateDetailsEntity)
        private gmRates: Repository<RateDetailsEntity>,
        @InjectRepository(DeletedBookingsEntity)
        private dBookingRepo: Repository<DeletedBookingsEntity>,
        @InjectRepository(PendingBookingEntity)
        private pendingBookingRepo: Repository<PendingBookingEntity>,
        @InjectRepository(CustomerBookingLogsEntity)
        private customerBookingLogRepo: Repository<CustomerBookingLogsEntity>,
        @InjectRepository(PaymentTransactionsEntity)
        private paymentTransactionRepo: Repository<PaymentTransactionsEntity>,
        @InjectRepository(PaymentTransactionErrorsEntity)
        private paymentTransactionErrorRepo: Repository<PaymentTransactionErrorsEntity>,
        @InjectRepository(BookingTimeBackupEntity)
        private bookingTimeBackupRepo: Repository<BookingTimeBackupEntity>,
        @InjectRepository(DriverSessionsEntity)
        private dsRepo: Repository<DriverSessionsEntity>,
        @InjectRepository(LocationsEntity)
        private locationRepo: Repository<LocationsEntity>,
        @InjectRepository(DriverLastLocationDetails)
        private driverLastLocRepo: Repository<DriverLastLocationDetails>,
        @InjectRepository(DeliveryProofEntity)
        private deliveryProofRepo: Repository<DeliveryProofEntity>,
        private configService: ConfigService,
        @Inject(REDIS_CLIENT) private redis: Redis,
        @Inject(forwardRef(() => TourService))
        private tourService: TourService,
        private locationService: LocationService,
        @InjectRepository(BookingDispatchEntity)
        private dispatchRepo: Repository<BookingDispatchEntity>,
        @InjectRepository(BookingDispatchCandidateEntity)
        private dispatchCandidateRepo: Repository<BookingDispatchCandidateEntity>,
        @InjectQueue('dispatch-timeout')
        private dispatchTimeoutQueue: Queue


    ){
        this.baseUrl = process.env.ENV == 'test' ? this.configService.get('testBaseUrl') : this.configService.get('prodBaseUrl')
        this.paymentBaseUrl = process.env.ENV == 'test' ? this.configService.get('testPaymentBaseUrl') : this.configService.get('prodPaymentBaseUrl')
        this.apiBaseUrl = process.env.ENV == 'test' ? this.configService.get('testApiBaseUrl') : this.configService.get('prodApiBaseUrl')
    }

    async addBooking(reqBody: any): Promise<any> {
        const customer = await this.utilService.getUserById(reqBody.customer_id)
        if (!customer) {
            throw new BadRequestException(`Customer with id ${reqBody.customer_id} not found`)
        }
        const customerName = customer.name
        // const customerName = await this.utilService.getName(reqBody.customer_id)
        let loading_charge: any = 0
        let toll_charge: any = 0
        let is_full_payment = false;
        let payment_at = 'drop';
        // let payment_at = 'pickup';
        let total_booking_fare: any = 0;
        // if(reqBody.loading_charge) {
        //     const companyData = await this.companyRepo.find({where: {users: Like(`%#${reqBody.customer_id},%`)}})
        //     loading_charge = companyData[0].loading_charge ? companyData[0].loading_charge : 0
        // }
        const companyData = await this.companyRepo.findOne({where: {users: Like(`%#${reqBody.customer_id},%`)}})
        if("loading_charge" in reqBody) { 
            loading_charge = reqBody.loading_charge
        } else {
            const rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(reqBody.commodity_weight ? reqBody.commodity_weight : 0), company_id: companyData ? companyData.id : 0}, order: {quantity: 'ASC'}})
            if(reqBody.both_loading_unloading_charge_applicable) {
                loading_charge = rate_data.loading_unloading
            } else {
                if(reqBody.loading_charge_applicable) {
                    loading_charge = loading_charge + rate_data.loading
                }
                if(reqBody.unloading_charge_applicable) {
                    loading_charge = loading_charge + rate_data.unloading
                }
            }
        }
        if("toll_charge" in reqBody) { 
            toll_charge = reqBody.toll_charge
        } else {
            const tollRes = await this.utilService.getTollCharges({lat: reqBody.pickup_lat, long:reqBody.pickup_long}, {lat: reqBody.dropoff_lat, long:reqBody.dropoff_long})
            if(tollRes.routes && tollRes.routes.length && tollRes.routes[0].legs && tollRes.routes[0].legs.length) {
                if(tollRes.routes[0].legs[0].travelAdvisory?.tollInfo?.estimatedPrice) {
                    toll_charge = parseInt(tollRes.routes[0].legs[0].travelAdvisory.tollInfo.estimatedPrice[0]?.units) > 0 ? 125 : 0
                }
            }
        }
        if (typeof reqBody.estimated_fare === 'string' || reqBody.estimated_fare instanceof String) {
            total_booking_fare += parseInt(reqBody.estimated_fare ? reqBody.estimated_fare : '0')
        } else {
            total_booking_fare += (reqBody.estimated_fare ? reqBody.estimated_fare : 0)
        }
        if (typeof loading_charge === 'string') {
            total_booking_fare += parseInt(loading_charge ? loading_charge : '0')
        } else {
            total_booking_fare += (reqBody.loading_charge ? reqBody.loading_charge : 0)
        }
        if (typeof reqBody.additional_fare === 'string' || reqBody.additional_fare instanceof String) {
            total_booking_fare += parseInt(reqBody.additional_fare ? reqBody.additional_fare : '0')
        } else {
            total_booking_fare += (reqBody.additional_fare ? reqBody.additional_fare : 0)
        }
        if (typeof toll_charge === 'string') {
            total_booking_fare += parseInt(toll_charge ? toll_charge : '0')
        } else {
            total_booking_fare += (toll_charge ? toll_charge : 0)
        }
        let multi_booking_id = (reqBody.multi_booking_id && reqBody.multi_booking_id != '')  ? reqBody.multi_booking_id : (new Date().getTime()).toString(36);
        //console.log(total_booking_fare, "total_booking_fare")
        if(reqBody.booking_for == 'drop') {
            reqBody.dropoff_receiver_contact = customer.mobile;
            reqBody.dropoff_receiver_name = customer.name;
        }
        if(reqBody.booking_for == 'pickup') {
            reqBody.pickup_receiver_contact = customer.mobile;
            reqBody.pickup_receiver_name = customer.name;
        }
        const bookingInput = {
            'customer_id' : reqBody.customer_id,
            'engaged_consolidation_manager' : reqBody.engaged_consolidation_manager ? reqBody.engaged_consolidation_manager : '',
            'pickup_location' : reqBody.pickup_location ? reqBody.pickup_location : '',
            'pickup_city' : reqBody.pickup_city ? reqBody.pickup_city : '',
            'pickup_state' : reqBody.pickup_state ? reqBody.pickup_state : '',
            'pickup_country' : reqBody.pickup_country ? reqBody.pickup_country : '',
            'pickup_pincode' : reqBody.pickup_pincode ? reqBody.pickup_pincode : '',
            'pickup_time' : reqBody.pickup_time ? reqBody.pickup_time : '',
            'pickuptime_flexiblity_status' : reqBody.pickuptime_flexiblity_status ? reqBody.pickuptime_flexiblity_status : '',
            'pickup_flexible_time' : reqBody.pickup_flexible_time ? reqBody.pickup_flexible_time : '',
            'dropoff_location' : reqBody.dropoff_location ? reqBody.dropoff_location : '',
            'dropoff_city' : reqBody.dropoff_city ? reqBody.dropoff_city : '',
            'dropoff_state' : reqBody.dropoff_state ? reqBody.dropoff_state : '',
            'dropoff_country' : reqBody.dropoff_country ? reqBody.dropoff_country : '',
            'dropoff_pincode' : reqBody.dropoff_pincode ? reqBody.dropoff_pincode : '',
            'dropoff_time' : reqBody.dropoff_time ? reqBody.dropoff_time : '',
            'dropofftime_flexiblity_status' : reqBody.dropofftime_flexiblity_status ? reqBody.dropofftime_flexiblity_status : '',
            'dropoff_flexible_time' : reqBody.dropoff_flexible_time ? reqBody.dropoff_flexible_time : '',
            'commodity_weight' : reqBody.commodity_weight ? reqBody.commodity_weight : '',
            'consignment_image' : reqBody.consignment_image ? reqBody.consignment_image : '',
            'receiver_name' : reqBody.dropoff_receiver_name ? reqBody.dropoff_receiver_name : 'Abhinesh',
            'receiver_contact' : reqBody.dropoff_receiver_contact ? reqBody.dropoff_receiver_contact : '9789083517',
            'instruction' : reqBody.instruction ? reqBody.instruction : '',
            'status' : reqBody.status ? reqBody.status : 'Pending',
            'pickup_lat' : reqBody.pickup_lat ? reqBody.pickup_lat : null,
            'pickup_long' : reqBody.pickup_long ? reqBody.pickup_long : null,
            'dropoff_lat' : reqBody.dropoff_lat ? reqBody.dropoff_lat : null,
            'dropoff_long' : reqBody.dropoff_long ? reqBody.dropoff_long : null,
            'assign_tour_status' : reqBody.assign_tour_status ? reqBody.assign_tour_status : 0,
            "created_by": reqBody.customer_id,
            "customer_name": customerName,
            "is_having_loading_charges": reqBody.is_having_loading_charges ? reqBody.is_having_loading_charges : false,
            "loading_charge": loading_charge,
            "pickup_receiver_contact": reqBody.pickup_receiver_contact ? reqBody.pickup_receiver_contact : '',  
            "pickup_receiver_name": reqBody.pickup_receiver_name ? reqBody.pickup_receiver_name : '', 
            "dropoff_receiver_contact": reqBody.dropoff_receiver_contact ? reqBody.dropoff_receiver_contact : '',  
            "dropoff_receiver_name": reqBody.dropoff_receiver_name ? reqBody.dropoff_receiver_name : '', 
            "pickup_address_id": reqBody.pickup_address_id ? reqBody.pickup_address_id: 0, 
            "dropoff_address_id": reqBody.dropoff_address_id ? reqBody.dropoff_address_id : 0,
            "time_interval": reqBody.time_interval ? reqBody.time_interval : 'Immediate',
            'estimated_fare': reqBody.estimated_fare ? reqBody.estimated_fare : 0,
            'total_fare': reqBody.total_fare ? reqBody.total_fare : 0,
            'booking_for': reqBody.booking_for ? reqBody.booking_for : 'neither', // pickup, drop, neither
            'is_vivegam': reqBody.is_vivegam === false ? reqBody.is_vivegam : true,
            'loading_charge_applicable': reqBody.loading_charge_applicable ? reqBody.loading_charge_applicable : false,
            'unloading_charge_applicable': reqBody.unloading_charge_applicable ? reqBody.unloading_charge_applicable : false,
            'both_loading_unloading_charge_applicable': reqBody.both_loading_unloading_charge_applicable ? reqBody.both_loading_unloading_charge_applicable : false,
            'toll_charges': toll_charge,
            'multi_booking_id': multi_booking_id,
            "payment_type": reqBody.payment_type, // COD, online
            "payment_status": reqBody.payment_status ? reqBody.payment_status : 'Pending',
            "estimate_fare_info": reqBody.estimate_fare_info ? reqBody.estimate_fare_info : '',
            "trip_type": reqBody.trip_type, // oneway, round, multipickup, multidrop
            "is_regular": companyData ? companyData.is_regular : false,
            "additional_fare": reqBody.additional_fare ? reqBody.additional_fare : 0,
            "additional_fare_comments": reqBody.additional_fare_comments ? reqBody.additional_fare_comments : '',
            "is_full_payment": false,
            "payment_at": 'drop',
            "vehicle_type": reqBody.vehicle_type ? reqBody.vehicle_type : '',
            "amount_collected" : '0',
            "is_booking_from_app": reqBody.is_booking_from_app ? reqBody.is_booking_from_app : false,
            "payment_made_by": reqBody.payment_made_by, // other_party_pay, pay_at_pickup, pay_at_drop, ill_pay
            "total_booking_fare": total_booking_fare,
            "dcNumber": reqBody.dcNumber,
            "tdcNumber": reqBody.tdcNumber,
            "booking_type": reqBody.booking_type ? reqBody.booking_type : null,
            "requestInfo": reqBody.requestInfo ? reqBody.requestInfo : null,
            "total_distance": reqBody.total_distance ? reqBody.total_distance : null
        }

        // console.log(bookingInput)
        const bookingDetails = await this.bookingRepo.save(bookingInput)
        try {
            
            console.log("set this in redis ....")
            await this.processGoodMoveBooking(customerName, reqBody, bookingDetails)
            await this.redis.set('booking:' + bookingDetails.id, JSON.stringify(bookingDetails), 'EX', 36000);

            //remove below line after simulation testing done 
            // console.log("calling simulation add booking api")
            // const sResp = await this.utilService.sendBookingToSimulation(bookingDetails)
            // console.log(sResp)
            
            return bookingDetails
        } catch(e) {
            console.log(e)
            return bookingDetails
        }
    }

    async processGoodMoveBooking(customerName, reqBody, bookingDetails): Promise<any> {
        let is_full_payment = false;
        let payment_at = 'drop';
        const bsReq = {
            booking_id: bookingDetails.id,
            status: 'Created',
            created_by: reqBody.customer_id,
            created_at: new Date(),
            updated_at: new Date()
        }
        await this.addBookingStatus(bsReq)
        const driverToken = await this.utilService.getDeviceToken(reqBody.customer_id)
        const TITLE = 'Booking #'+bookingDetails.id
        const BODY = 'Your booking will be confirmed soon'
        if(driverToken) {
            await this.utilService.sendPushNotification(TITLE, BODY, driverToken.split(","))
        }
        
        var mailOptions = {
            from: 'noreplygo.20221@gmail.com',
            to: 'hr.goodmove@gmail.com, siva.k.meet@gmail.com',
            // to: 'nageswararaonali@gmail.com',
            subject: 'GoodMove Booking',
            text: `New booking with booking id # ${bookingDetails.id}
    Customer Name: ${customerName}
    Pickup time: ${reqBody.pickup_time}
    Pickup Location: ${reqBody.pickup_location}
    Dropoff Location: ${reqBody.dropoff_location}
            `
        }
        // await mail.sendMail(mailOptions);
        let smsData = {
            "template_id": this.configService.get('BOOKING_CONFIRM_SMS_TEMPLATE_ID'),
            "sender": this.configService.get('SMS_SENDER_ID'),
            "short_url": "1",
            "mobiles": "91"+bookingDetails.pickup_receiver_contact,
            "b_id": bookingDetails.id,
            "b_link": " "+this.baseUrl+"/booking/"+bookingDetails.id + " "
        }
        const pickupSMSRespData = await this.utilService.sendBookingSMS(smsData)
        smsData["mobiles"] = "91"+bookingDetails.dropoff_receiver_contact
        const dropoffSMSRespData = await this.utilService.sendBookingSMS(smsData)

        let sms_mobile = '';
        if(['other_party_pay', 'pay_at_pickup', 'pay_at_drop'].indexOf(bookingDetails.payment_made_by) > -1) {
            if((bookingDetails.trip_type == 'oneway' || bookingDetails.trip_type == 'round') && bookingDetails.booking_for == 'pickup') {
                sms_mobile = bookingDetails.dropoff_receiver_contact
                is_full_payment = true;
                payment_at = 'drop';
            }
            if((bookingDetails.trip_type == 'oneway' || bookingDetails.trip_type == 'round') && bookingDetails.booking_for == 'drop') {
                sms_mobile = bookingDetails.pickup_receiver_contact
                is_full_payment = false;
                payment_at = 'pickup';
            }
            if((bookingDetails.trip_type == 'oneway' || bookingDetails.trip_type == 'round') && bookingDetails.booking_for == 'neither') {
                if(bookingDetails.payment_made_by == 'pay_at_pickup') {
                    sms_mobile = bookingDetails.pickup_receiver_contact
                    is_full_payment = false;
                    payment_at = 'pickup';
                }
                if(bookingDetails.payment_made_by == 'pay_at_drop') {
                    sms_mobile = bookingDetails.dropoff_receiver_contact
                    is_full_payment = true;
                    payment_at = 'drop';
                }
            }
        }
        // if(bookingDetails.trip_type == 'multipickup' && bookingDetails.booking_for == 'drop') {
        if(bookingDetails.trip_type == 'multipickup') {
            if(bookingDetails.booking_for == 'drop') {
                sms_mobile = bookingDetails.dropoff_receiver_contact;
            }
            is_full_payment = true;
            payment_at = 'drop';
        }
        // if(bookingDetails.trip_type == 'multidrop' && bookingDetails.booking_for == 'pickup') {
        if(bookingDetails.trip_type == 'multidrop') {
            is_full_payment = false;
            payment_at = 'pickup';
            if(bookingDetails.booking_for == 'pickup') {
                sms_mobile = bookingDetails.pickup_receiver_contact
            }
        }
        if(bookingDetails.payment_made_by.toLowerCase() == 'ill_pay') {
            if((bookingDetails.trip_type == 'oneway' || bookingDetails.trip_type == 'round') && bookingDetails.booking_for == 'pickup') {
                sms_mobile = bookingDetails.pickup_receiver_contact
                is_full_payment = false;
                payment_at = 'pickup';
            }
            if((bookingDetails.trip_type == 'oneway' || bookingDetails.trip_type == 'round') && bookingDetails.booking_for == 'drop') {
                sms_mobile = bookingDetails.dropoff_receiver_contact
                is_full_payment = false;
                payment_at = 'drop';
            }
            // is_full_payment = true;
            // payment_at = 'drop';
            await this.bookingRepo.update({id: bookingDetails.id}, {is_full_payment, payment_at})
        }
        // await this.sendPaymentLinkSMS(sms_mobile, bookingDetails)
        if(sms_mobile) {
            await this.sendPaymentLinkSMS(sms_mobile, bookingDetails)
            await this.bookingRepo.update({id: bookingDetails.id}, {is_full_payment, payment_at})
        }
    }

    async sendPaymentLinkSMS(mobile, bookingDetails) {
        //console.log("sending sms ....")
        const smsData = {
            "template_id": this.configService.get('BOOKING_PAYMENT_SMS_TEMPLATE_ID'),
            "sender": this.configService.get('SMS_SENDER_ID'),
            // "short_url": "1",
            "mobiles": "91"+mobile,
            // "mobiles": "919030935373",
            "b_id": bookingDetails.id,
            "b_link": "bookings?id="+bookingDetails.multi_booking_id + ""
            // "b_link": ""+bookingDetails.multi_booking_id + ""
        }
        const smsRespData = await this.utilService.sendBookingSMS(smsData)
        //console.log("smsRespData")
        //console.log(smsRespData)
        return smsRespData
    }

    async addMultiBooking(reqBody: any): Promise<any> {
        var uid = (new Date().getTime()).toString(36)
        let bookings = []
        console.log(uid);
        // let bookingObj = JSON.parse(JSON.stringify(reqBody));
        // //console.log(reqBody)
        let bookingObj = Object.assign({},reqBody);
        delete bookingObj.pickup
        delete bookingObj.drop
        let pCount = reqBody.pickup.length
        let dCount = reqBody.drop.length
        let no_bookings = pCount > dCount ? pCount : dCount;
        if(reqBody.trip_type.toLowerCase() == 'round') {
            no_bookings = 2
        }
        const estimated_fare = bookingObj.estimated_fare ? Math.ceil(bookingObj.estimated_fare/no_bookings) : 0
        const loading_charge = bookingObj.loading_charge ? Math.ceil(bookingObj.loading_charge/no_bookings) : 0
        const toll_charge = bookingObj.toll_charge ? Math.ceil(bookingObj.toll_charge/no_bookings) : 0
        const additional_fare = bookingObj.additional_fare ? Math.ceil(bookingObj.additional_fare/no_bookings) : 0
        const commodity_weight = (bookingObj.commodity_weight && reqBody.trip_type.toLowerCase() != 'round') ? Math.ceil(bookingObj.commodity_weight/no_bookings) : bookingObj.commodity_weight
        let dcIndex = 0;
        for(let pickup of reqBody.pickup) {
            for(let dropoff of reqBody.drop) {
                // //console.log(pickup.pickup_lat, dropoff.dropoff_lat)
                let dcNumber = (reqBody.dcNumbers && reqBody.dcNumbers[dcIndex]) ? reqBody.dcNumbers[dcIndex] : ''
                bookingObj = {...bookingObj, ...pickup, ...dropoff, multi_booking_id: uid, estimated_fare, loading_charge, toll_charge, commodity_weight, additional_fare, dcNumber: dcNumber}
                // //console.log(bookingObj)
               let booking = await this.addBooking(bookingObj)
               bookings.push(booking)
               dcIndex++
            }
        }
        if(reqBody.trip_type.toLowerCase() == 'round') {
            let pickupFields = ["pickup_location", "pickup_time", "pickuptime_flexiblity_status", "pickup_flexible_time", "pickup_receiver_contact", "pickup_receiver_name", "pickup_address_id", "pickup_lat", "pickup_long", "pickup_city", "pickup_state", "pickup_country", "pickup_pincode"];
            let dropFields = ["dropoff_location", "dropoff_time", "dropofftime_flexiblity_status", "dropoff_flexible_time", "dropoff_receiver_contact", "dropoff_receiver_name", "dropoff_address_id", "dropoff_lat", "dropoff_long", "dropoff_city", "dropoff_state", "dropoff_country", "dropoff_pincode"];
            for(let pickup of reqBody.drop) {
                for(let drop of reqBody.pickup) {
                    // //console.log(pickup.pickup_lat, dropoff.dropoff_lat)
                    bookingObj = {...bookingObj, multi_booking_id: uid}
                    let i=0;
                    for(let pickupField of pickupFields) {
                        bookingObj[pickupField] = pickup[dropFields[i]]
                        i++;
                    }
                    i=0;
                    for(let dropField of dropFields) {
                        if(dropField == 'dropoff_time') {
                            let num_hrs = 2;
                            if(bookingObj.is_vivegam) {
                                num_hrs = 6
                            }
                            //console.log(num_hrs)

                            let dTime = moment(pickup[dropField]).add(num_hrs, 'hours').format('YYYY-MM-DD HH:mm:ss')
                            bookingObj[dropField] = dTime
                        } else {
                            bookingObj[dropField] = drop[pickupFields[i]]
                        }
                        
                        i++;
                    }
                    bookingObj['commodity_weight'] = reqBody['return_weight']
                    bookingObj['dcNumber'] = (reqBody.dcNumbers && reqBody.dcNumbers[dcIndex]) ? reqBody.dcNumbers[dcIndex] : ''
                    // //console.log(bookingObj)
                   let booking = await this.addBooking(bookingObj)
                   bookings.push(booking)
                }
            }
        }
        this.broadcastMultiBooking(uid, bookings, reqBody)
        return bookings

    }

    async createReturnBooking(bookingDetails: any): Promise<any> {
        let pickupFields = ["pickup_location", "pickup_time", "pickuptime_flexiblity_status", "pickup_flexible_time", "pickup_receiver_contact", "pickup_receiver_name", "pickup_address_id", "pickup_lat", "pickup_long", "pickup_city", "pickup_state", "pickup_country", "pickup_pincode"];
        let dropFields = ["dropoff_location", "dropoff_time", "dropofftime_flexiblity_status", "dropoff_flexible_time", "dropoff_receiver_contact", "dropoff_receiver_name", "dropoff_address_id", "dropoff_lat", "dropoff_long", "dropoff_city", "dropoff_state", "dropoff_country", "dropoff_pincode"];
        let bookingData = {
            ...bookingDetails
        }
        delete bookingData.id
        let index = 0
        for(let pickupField of pickupFields) {
            bookingData[pickupField] = bookingDetails[dropFields[index]]
            index++
        }
        index=0
        for(let dropField of dropFields) {
            bookingData[dropField] = bookingDetails[pickupFields[index]]
            index++
        }
        let reqInfo = bookingDetails.requestInfo
        reqInfo.forwardBookingId = bookingDetails.id
        reqInfo.isReturn = true
        if(reqInfo.rto_otp) {
            reqInfo.drop.otp = (typeof reqInfo.rto_otp == "string") ? parseInt(reqInfo.rto_otp) : reqInfo.rto_otp
        }
        
        bookingData.requestInfo = reqInfo
        bookingData.pickup_time = moment(new Date()).tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss')
        bookingData.reached_pickup = moment(new Date()).tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss')
        bookingData.completed_pickup = moment(new Date()).tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss')
        bookingData.reached_drop = ''

        const bDetails = await this.bookingRepo.save(bookingData)
        return bDetails
    }

    async updateBooking(id: number, reqBody: any): Promise<any> {
        let loading_charge = 0
        // if(reqBody.loading_charge) {
        //     const companyData = await this.companyRepo.find({where: {users: Like(`%#${reqBody.customer_id},%`)}})
        //     loading_charge = companyData[0].loading_charge ? companyData[0].loading_charge : 0
        // }
        const companyData = await this.companyRepo.findOne({where: {users: Like(`%#${reqBody.customer_id},%`)}})
        const rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(reqBody.commodity_weight ? reqBody.commodity_weight : 0), company_id: companyData ? companyData.id : 0}, order: {quantity: 'ASC'}})
        if(reqBody.both_loading_unloading_charge_applicable) {
            loading_charge = rate_data.loading_unloading
        } else {
            if(reqBody.loading_charge_applicable) {
                loading_charge = loading_charge + rate_data.loading
            }
            if(reqBody.unloading_charge_applicable) {
                loading_charge = loading_charge + rate_data.unloading
            }
        }
        const bookingInput = {
            'customer_id' : reqBody.customer_id,
            'engaged_consolidation_manager' : reqBody.engaged_consolidation_manager ? reqBody.engaged_consolidation_manager : '',
            'pickup_location' : reqBody.pickup_location ? reqBody.pickup_location : '',
            'pickup_city' : reqBody.pickup_city ? reqBody.pickup_city : '',
            'pickup_state' : reqBody.pickup_state ? reqBody.pickup_state : '',
            'pickup_country' : reqBody.pickup_country ? reqBody.pickup_country : '',
            'pickup_pincode' : reqBody.pickup_pincode ? reqBody.pickup_pincode : '',
            'pickup_time' : reqBody.pickup_time ? reqBody.pickup_time : '',
            'pickuptime_flexiblity_status' : reqBody.pickuptime_flexiblity_status ? reqBody.pickuptime_flexiblity_status : '',
            'pickup_flexible_time' : reqBody.pickup_flexible_time ? reqBody.pickup_flexible_time : '',
            'dropoff_location' : reqBody.dropoff_location ? reqBody.dropoff_location : '',
            'dropoff_city' : reqBody.dropoff_city ? reqBody.dropoff_city : '',
            'dropoff_state' : reqBody.dropoff_state ? reqBody.dropoff_state : '',
            'dropoff_country' : reqBody.dropoff_country ? reqBody.dropoff_country : '',
            'dropoff_pincode' : reqBody.dropoff_pincode ? reqBody.dropoff_pincode : '',
            'dropoff_time' : reqBody.dropoff_time ? reqBody.dropoff_time : '',
            'dropofftime_flexiblity_status' : reqBody.dropofftime_flexiblity_status ? reqBody.dropofftime_flexiblity_status : '',
            'dropoff_flexible_time' : reqBody.dropoff_flexible_time ? reqBody.dropoff_flexible_time : '',
            'commodity_weight' : reqBody.commodity_weight ? reqBody.commodity_weight : '',
            'consignment_image' : reqBody.consignment_image ? reqBody.consignment_image : '',
            'receiver_name' : reqBody.receiver_name ? reqBody.receiver_name : 'Prakash',
            'receiver_contact' : reqBody.receiver_contact ? reqBody.receiver_contact : '8270247441',
            'instruction' : reqBody.instruction ? reqBody.instruction : '',
            'status' : reqBody.status ? reqBody.status : 'Pending',
            'pickup_lat' : reqBody.pickup_lat ? reqBody.pickup_lat : null,
            'pickup_long' : reqBody.pickup_long ? reqBody.pickup_long : null,
            'dropoff_lat' : reqBody.dropoff_lat ? reqBody.dropoff_lat : null,
            'dropoff_long' : reqBody.dropoff_long ? reqBody.dropoff_long : null,
            'assign_tour_status' : reqBody.assign_tour_status ? reqBody.assign_tour_status : 0,
            "created_by": reqBody.customer_id,
            "customer_name": await this.utilService.getName(reqBody.customer_id),
            "is_having_loading_charges": reqBody.is_having_loading_charges ? reqBody.is_having_loading_charges : false,
            "loading_charge": loading_charge,
            "pickup_receiver_name": reqBody.pickup_receiver_name,
            "pickup_receiver_contact": reqBody.pickup_receiver_contact,
            'loading_charge_applicable': reqBody.loading_charge_applicable ? reqBody.loading_charge_applicable : false,
            'unloading_charge_applicable': reqBody.unloading_charge_applicable ? reqBody.unloading_charge_applicable : false,
            'both_loading_unloading_charge_applicable': reqBody.both_loading_unloading_charge_applicable ? reqBody.both_loading_unloading_charge_applicable : false
        }
        // //console.log(bookingInput)
        const bookingDetails = await this.bookingRepo.update({id}, bookingInput)
        const trips = await this.tripRepo.find({where:{booking_id: id}})
        if(trips.length) {
            for (let trip of trips) {
                const pickPoint: Point = {
                    type: 'Point',
                    coordinates: [reqBody.pickup_long, reqBody.pickup_lat]
                }
                const dropPoint: Point = {
                    type: 'Point',
                    coordinates: [reqBody.dropoff_long, reqBody.dropoff_lat]
                }
                const tripInput = {
                    'customer_id' : reqBody.customer_id,
                    'engaged_consolidation_manager' : reqBody.engaged_consolidation_manager ? reqBody.engaged_consolidation_manager : '',
                    'pickup_location' : reqBody.pickup_location ? reqBody.pickup_location : '',
                    'pickup_time' : reqBody.pickup_time ? reqBody.pickup_time : '',
                    'dropoff_location' : reqBody.dropoff_location ? reqBody.dropoff_location : '',
                    'dropoff_time' : reqBody.dropoff_time ? reqBody.dropoff_time : '',
                    'pickup_lat' : reqBody.pickup_lat ? reqBody.pickup_lat : null,
                    'pickup_long' : reqBody.pickup_long ? reqBody.pickup_long : null,
                    'dropoff_lat' : reqBody.dropoff_lat ? reqBody.dropoff_lat : null,
                    'dropoff_long' : reqBody.dropoff_long ? reqBody.dropoff_long : null,
                    "created_by": reqBody.customer_id,
                    "pickup_point": pickPoint,
                    "dropoff_point": dropPoint,
                }
                await this.tripRepo.update({id: trip.id}, tripInput)
            }
        }
        const tourRoute = await this.tourRouteRepo.find({where: {booking_id: id}})
        if(tourRoute.length) {
            for(let tRoute of tourRoute) {
                const lat = tRoute.transport_type == 'pickup' ? reqBody.pickup_lat : reqBody.dropoff_lat;
                const long = tRoute.transport_type == 'pickup' ? reqBody.pickup_long : reqBody.dropoff_long;
                const pointObject: Point = {
                    type: "Point",
                    coordinates: [long,lat]
                };
                let tRouteInput = {
                    location: pointObject,
                    location_address: tRoute.location_address
                }
                await this.tourRouteRepo.update({id:tRoute.id}, tRouteInput)
            }
        }
        var mailOptions = {
            from: 'noreplygo.20221@gmail.com',
            to: 'hr.goodmove@gmail.com, siva.k.meet@gmail.com',
            // to: 'nageswararaonali@gmail.com',
            subject: 'GoodMove Bookings',
            text: 'Updated booking with booking id #'+id
        }
        await mail.sendMail(mailOptions);
        return bookingDetails
    }

    async updateBookingDCNumber(reqBody: any): Promise<any> {
        if(reqBody.bookingIds && reqBody.bookingIds.length) {
            for(let bookingId of reqBody.bookingIds) {
                await this.bookingRepo.update({id: bookingId}, {tdcNumber: reqBody.dcNumber})
            }
        }
        return true
    }

    async updateBookingDCNumberFromManager(reqBody: any): Promise<any> {
        
        let updObj = {}
        if(reqBody.dcNumber) {
            updObj['dcNumber'] = reqBody.dcNumber
        }
        if(reqBody.tdcNumber) {
            updObj['tdcNumber'] = reqBody.tdcNumber
        }
        await this.bookingRepo.update({id: reqBody.bookingId}, updObj)
       
        return true
    }

    // getBookingData = async (item) => {
    //     const booking = {
    //         ...item,
    //         customer_name: await this.utilService.getName(item.customer_id)
    //     }
    //     return booking
    // }
    
    async getBookings(reqBody: any): Promise<any> {
        let bookings: any = []
        let whereCon: any = {}
        let orderBy = {}
        let limit = reqBody.limit ? reqBody.limit : 10
        let todayDate = moment().format('YYYY-MM-DD')
        // whereCon['pickup_time'] = Not(Like(`${todayDate}%`))
        whereCon['booking_canceled_by_customer'] = 0
        whereCon['booking_canceled_by_manager'] = 0
        if(reqBody.customer_id) {
            whereCon["customer_id"] = reqBody.customer_id
        }
        if(reqBody.id) {
            whereCon["id"] = reqBody.id
        }
        if(reqBody.status) {
            whereCon["status"] = reqBody.status
        }
        if(reqBody.created_at) {
            let created_at_date = new Date(moment(new Date(reqBody.created_at)).format('YYYY-MM-DD'))
            let nextDay = new Date(created_at_date)
            nextDay.setDate(created_at_date.getDate()+1)
            //console.log(created_at_date, nextDay)
            whereCon["created_at"] = Between(created_at_date, nextDay)
        }

        if(reqBody.reached_pickup) {
            let reached_date = new Date(reqBody.reached_pickup)
            let nextDay = new Date(reached_date)
            nextDay.setDate(reached_date.getDate()+1)
            //console.log(reached_date, nextDay)
            // whereCon["reached_pickup"] = Between(reached_date, nextDay)
            whereCon["reached_pickup"] = Like(`${reqBody.reached_pickup}%`)
        }

        if(reqBody.booking_status) {
            whereCon["booking_status"] = reqBody.booking_status
        }

        if(reqBody.driver_name) {
            whereCon["driver_name"] = reqBody.driver_name
        }

        if(reqBody.pickup_time) {
            whereCon['pickup_time'] = Like(`${reqBody.pickup_time}%`)
        }

        if('is_manager_entered' in reqBody) {
            whereCon["is_manager_entered"] = reqBody.is_manager_entered
        }

        if(reqBody.from_manager_app) {
            orderBy['id'] = 'DESC'
        } else {
            orderBy['pickup_time'] = 'DESC'
            orderBy['id'] = 'DESC'
            limit = 20
        }
        if(reqBody.booking_type) {
            whereCon["booking_type"] = IsNull()
        }

        //console.log(whereCon)
        //console.log(orderBy)
        console.log(whereCon)
        const [items, count] = await this.bookingRepo.findAndCount({where: whereCon, order: orderBy, skip: (reqBody.offset ? reqBody.offset : 0), take: limit })
        for(let booking of items) {
            let bookingUrl = await turl.shorten(this.baseUrl+"/booking/"+booking.id)
            let tourData = await this.tourRouteRepo.findOneBy({booking_id: booking.id})
            let companyDetails = await this.companyRepo.findOne({where: {users: Like(`%#${booking.customer_id},%`)}})
            // const [deliveryProof] = await this.deliveryProofRepo.find({ where: { booking_id: booking.id }, order: { created_at: 'DESC' }, take: 1 })

            let bookingData = {
                ...booking,
                tour_id: tourData ? tourData.tour_id : '',
                company_name: companyDetails ? companyDetails.company_name : '',
                booking_url: bookingUrl,
                // delivery_proof_image: deliveryProof ? deliveryProof.image_url : null
            }
            bookings.push(bookingData)
        }
        // if(items && items.length) {
        //     await Promise.all(items.map(async (item) => {
        //         const booking = {
        //             ...item,
        //             customer_name: await this.utilService.getName(item.customer_id)
        //         }
        //         bookings.push(booking)
        //     }))
        // }
        // return {bookings, count}
        /*const bookingsData = await this.bookingRepo.createQueryBuilder("b")
                            .leftJoinAndSelect("users", "u", "u.id=b.customer_id")
                            .select(['b.*, u.name as customer_name'])
                            // .getSql()
                            .orderBy('id', 'DESC')
                            .take(reqBody.limit ? reqBody.limit : 10)
                            .skip(reqBody.offset ? reqBody.offset : 0)
                            .getRawMany() */
        /*if(items && items.length) {
            for(let item of items) {
                const bStatus = await this.getBSByBookingId(item.id);
                let driver_name = ''
                if(bStatus && bStatus.tour_id) {
                    let tourData = await this.tourRepo.findOneBy({id: bStatus.tour_id})
                    const driverData = await this.driverRepo.findOneBy({user_id: tourData.driver_id})
                    driver_name = driverData.name
                }
                let customer_name = await this.utilService.getName(item.customer_id)
                const booking = {
                    ...item,
                    customer_name: customer_name,
                    booking_status: bStatus ? bStatus.status : '',
                    driver_name: driver_name
                }
                if(!item.customer_name) {
                    await this.bookingRepo.update({id: item.id}, {customer_name: customer_name})
                }
                if(!item.driver_name && driver_name) {
                    await this.bookingRepo.update({id: item.id}, {driver_name: driver_name})
                }
                if(bStatus && bStatus.status) {
                    await this.bookingRepo.update({id: item.id}, {booking_status: bStatus.status})
                }
                
                // //console.log(reqBody.booking_status, bStatus)
                if(reqBody.booking_status && bStatus.status == reqBody.booking_status) {
                    bookings.push(booking)
                } else if(!reqBody.booking_status) {
                    bookings.push(booking)
                }
                
            }
        }*/
        
        return {items: bookings, count}
    }
    
    async getLiveBookings(reqBody: any): Promise<any> {
        let bookings: any = []
        let whereCon: any = {}
        let orderBy = {}
        let limit = reqBody.limit ? reqBody.limit : 10
        let todayDate = moment().tz('Asia/Calcutta').format('YYYY-MM-DD')
        whereCon['pickup_time'] = Like(`${todayDate}%`)
        whereCon['booking_canceled_by_customer'] = 0
        whereCon['booking_canceled_by_manager'] = 0
        if(reqBody.customer_id) {
            whereCon["customer_id"] = reqBody.customer_id
        }
        if(reqBody.id) {
            whereCon["id"] = reqBody.id
        }
        if(reqBody.status) {
            whereCon["status"] = reqBody.status
        }
        if(reqBody.created_at) {
            let created_at_date = new Date(moment(new Date(reqBody.created_at)).format('YYYY-MM-DD'))
            let nextDay = new Date(created_at_date)
            nextDay.setDate(created_at_date.getDate()+1)
            //console.log(created_at_date, nextDay)
            whereCon["created_at"] = Between(created_at_date, nextDay)
        }

        if(reqBody.reached_pickup) {
            let reached_date = new Date(reqBody.reached_pickup)
            let nextDay = new Date(reached_date)
            nextDay.setDate(reached_date.getDate()+1)
            //console.log(reached_date, nextDay)
            whereCon["reached_pickup"] = Between(reached_date, nextDay)
        }

        if(reqBody.booking_status) {
            whereCon["booking_status"] = reqBody.booking_status
        }

        if(reqBody.driver_name) {
            whereCon["driver_name"] = reqBody.driver_name
        }

        if(reqBody.pickup_time) {
            whereCon['pickup_time'] = Like(`${reqBody.pickup_time}%`)
        }

        if('is_manager_entered' in reqBody) {
            whereCon["is_manager_entered"] = reqBody.is_manager_entered
        }

        if(reqBody.from_manager_app) {
            orderBy['id'] = 'DESC'
        } else {
            const live_booking_status = ['Tour Completed']
            whereCon["booking_status"] = Not(In(live_booking_status))
            orderBy['id'] = 'DESC'
            limit = 50
        }

        //console.log(whereCon)
        //console.log(orderBy)
        //console.log(whereCon)
        const [items, count] = await this.bookingRepo.findAndCount({where: whereCon, order: orderBy, skip: (reqBody.offset ? reqBody.offset : 0), take: limit })
        for(let booking of items) {
            let bookingUrl = await turl.shorten(this.baseUrl+"/booking/"+booking.id)
            let tourData = await this.tourRouteRepo.findOneBy({booking_id: booking.id})
            let companyDetails = await this.companyRepo.findOne({where: {users: Like(`%#${booking.customer_id},%`)}})
            let bookingData = {
                ...booking,
                tour_id: tourData ? tourData.tour_id : '',
                company_name: companyDetails ? companyDetails.company_name : '',
                booking_url: bookingUrl
            }
            bookings.push(bookingData)
        }
        return {items: bookings, count}
    }

    async getTodayBookings(reqBody: any): Promise<any> {
        let bookings: any = []
        let whereCon: any = {}
        let todayDate = moment().tz('Asia/Calcutta').format('YYYY-MM-DD')
        // let todayDate = '2025-10-18'
        whereCon['pickup_time'] = Like(`${todayDate}%`)
        if(reqBody.customer_id) {
            whereCon["customer_id"] = reqBody.customer_id
        }
        if(reqBody.customer_name) {
            whereCon["customer_name"] = Like(`%${reqBody.customer_name}%`) 
        }
        if(reqBody.id) {
            whereCon["id"] = reqBody.id
        }
        if(reqBody.status) {
            whereCon["status"] = reqBody.status
        }
        if(reqBody.created_at) {
            let created_at_date = new Date(reqBody.created_at)
            let nextDay = new Date(created_at_date)
            nextDay.setDate(created_at_date.getDate()+1)
            //console.log(created_at_date, nextDay)
            whereCon["created_at"] = Between(created_at_date, nextDay)
        }

        if(reqBody.reached_pickup) {
            let reached_date = new Date(reqBody.reached_pickup)
            let nextDay = new Date(reached_date)
            nextDay.setDate(reached_date.getDate()+1)
            //console.log(reached_date, nextDay)
            whereCon["reached_pickup"] = Between(reached_date, nextDay)
        }

        if(reqBody.booking_status) {
            whereCon["booking_status"] = reqBody.booking_status
        }

        if(reqBody.driver_name) {
            whereCon["driver_name"] = reqBody.driver_name
        }

        if(reqBody.booking_type) {
            whereCon["booking_type"] = IsNull()
        }

        if('is_manager_entered' in reqBody) {
            whereCon["is_manager_entered"] = reqBody.is_manager_entered
        }

        const [items, count] = await this.bookingRepo.findAndCount({where: whereCon, order:{id: 'DESC'}, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) })
        for(let booking of items) {
            
            let tourData = await this.tourRouteRepo.findOneBy({booking_id: booking.id})
            let companyDetails = await this.companyRepo.findOne({where:{users: Like(`%#${booking.customer_id},%`)}})
            let bookingData = {
                ...booking,
                tour_id: tourData ? tourData.tour_id : '',
                company_name: companyDetails ? companyDetails.company_name : ''
            }
            bookings.push(bookingData)
        }
        /*if(items && items.length) {
            for(let item of items) {
                const bStatus = await this.getBSByBookingId(item.id);
                let driver_name = ''
                if(bStatus && bStatus.tour_id) {
                    let tourData = await this.tourRepo.findOneBy({id: bStatus.tour_id})
                    const driverData = await this.driverRepo.findOneBy({user_id: tourData.driver_id})
                    driver_name = driverData.name
                }
                const booking = {
                    ...item,
                    customer_name: await this.utilService.getName(item.customer_id),
                    booking_status: bStatus ? bStatus.status : '',
                    driver_name: driver_name
                }
                // //console.log(reqBody.booking_status, bStatus)
                if(reqBody.booking_status && bStatus.status == reqBody.booking_status) {
                    bookings.push(booking)
                } else if(!reqBody.booking_status) {
                    bookings.push(booking)
                }
            }
        }*/
        
        return {items: bookings, count}
    }

    

    async getBookingsDetails(reqBody: any): Promise<any> {
        let bookings: any = []
        let whereCon: any = {}
        if(reqBody.start_date) {
            // whereCon['created_at'] =  Between(new Date(reqBody.start_date), new Date(reqBody.end_date))
            whereCon['reached_pickup'] =  Between(new Date(reqBody.start_date), new Date(reqBody.end_date))
        } 
        if(reqBody.customer_id) {
            whereCon['customer_id'] = reqBody.customer_id
        }
        //console.log(whereCon)
        const items= await this.bookingRepo.find({where: whereCon, order:{id: 'DESC'}, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) })
        if(items && items.length) {
            for(let item of items) {
                const bStatus = await this.getBSByBookingId(item.id);
                let driverData: any = {}
                if(bStatus && bStatus.tour_id) {
                    let tour = await this.tourRepo.findOneBy({id: bStatus.tour_id})
                    if(tour.truck_owner_status == 'Accepted') {
                        driverData = await this.driverRepo.findOneBy({user_id: tour.driver_id})
                    }
                    
                }
                let companyDetails = await this.companyRepo.findOne({where: {users: Like(`%#${item.customer_id},%`)}})
                const booking = {
                    ...item,
                    customer_name: await this.utilService.getName(item.customer_id),
                    booking_status: bStatus ? bStatus.status : '',
                    driverData,
                    company_name: companyDetails ? companyDetails.company_name : ''
                }
                bookings.push(booking)
            }
        }
        
        return bookings
    }

    async getBookingById(booking_id: number): Promise<any> {
        const bookingData = await this.bookingRepo.findOneBy({id: booking_id})
        if(bookingData) {
            let driverData: any = {}
            let truckData = {}
            const bStatus = await this.getBSByBookingId(booking_id);
            const bStatuses = await this.getAllBSByBookingId(booking_id);
            bookingData["booking_status"] = bStatus ? bStatus.status : null
            bookingData["tour_id"] = null
            bookingData["tracking"] = bStatuses
            if(bStatus.tour_id) {
                let tour = await this.tourRepo.findOneBy({id: bStatus.tour_id})
                // if(tour.truck_owner_status == 'Accepted') {
                    driverData = await this.driverRepo.findOneBy({user_id: tour.driver_id})
                    truckData = await this.truckRepo.findOneBy({id: driverData.truck_id})
                    bookingData["tour_id"] = bStatus ? bStatus.tour_id : null
                // }
                
            }
            bookingData["driverData"] = driverData
            bookingData["truckData"] = truckData
            const [deliveryProof] = await this.deliveryProofRepo.find({ where: { booking_id }, order: { created_at: 'DESC' }, take: 1 })
            bookingData["delivery_proof_image"] = deliveryProof ? deliveryProof.image_url : null
            bookingData["delivery_proof_latitude"] = deliveryProof ? deliveryProof.lat : null
            bookingData["delivery_proof_longitude"] = deliveryProof ? deliveryProof.lng : null
            bookingData["delivery_proof_timestamp"] = deliveryProof ? moment(deliveryProof.created_at).format('YYYY-MM-DD HH:mm:ss') : null
        }
        return bookingData
    }

    async acceptBooking(booking_id: number, fare: any = 0): Promise<any> {
        const updateData = {
            'quotation_status': 1, 
            'fare': fare,
            'status': 'Awaiting confirmation',
            'quotation_payment_status': 0,
            'booking_accept_status': 0,
            'booking_confirm_status': 0
        }
        const bookingData = await this.bookingRepo.update({id: booking_id}, updateData)
        const bsReq = {
            booking_id: booking_id,
            status: 'Awaiting confirmation',
            created_by: 1,
            created_at: new Date(),
            updated_at: new Date()
        }
        const bookingDetails = await this.bookingRepo.findOneBy({id: booking_id})
        const driverToken = await this.utilService.getDeviceToken(bookingDetails.customer_id)
        const TITLE = 'Fare for booking id '+booking_id
        const BODY = 'Please confirm your booking id '+booking_id+' by accepting the fare for the trip.'
        if(driverToken) {
            await this.utilService.sendPushNotification(TITLE, BODY, driverToken.split(","))
        }
        await this.addBookingStatus(bsReq)
        return bookingData
    }
    
    async confirmBooking(booking_id: number, fare: number = 0): Promise<any> {
        const updateData = {
            'quotation_payment_status': 1,
            'booking_accept_status': 1,
            'booking_confirm_status': 1,
            'status': 'Confirmed'
        }
        const bookingData = await this.bookingRepo.update({id: booking_id}, updateData)
        const bsReq = {
            booking_id: booking_id,
            status: 'Confirmed',
            created_by: 1,
            created_at: new Date(),
            updated_at: new Date()
        }
        await this.addBookingStatus(bsReq)
        const bookingDetails = await this.bookingRepo.findOneBy({id: booking_id})
        const driverToken = await this.utilService.getDeviceToken(bookingDetails.customer_id)
        const TITLE = 'Booking #'+booking_id
        const BODY = 'Your booking has been confirmed. Driver and vehicle details will be shared shortly!'
        if(driverToken) {
            await this.utilService.sendPushNotification(TITLE, BODY, driverToken.split(","))
        }
        return bookingData
    }
    
    async tbeBooking(booking_id: number): Promise<any> {
        const updateData = {
            'quotation_status': 1,
            'fare': 'TBE',
            'quotation_payment_status': 1,
            'booking_accept_status': 1,
            'booking_confirm_status': 1,
            'status': 'Confirmed'
        }
        const bookingData = await this.bookingRepo.update({id: booking_id}, updateData)
        const bsReq = {
            booking_id: booking_id,
            status: 'Fare',
            created_by: 1,
            created_at: new Date(),
            updated_at: new Date()
        }
        await this.addBookingStatus(bsReq)
        const bookingDetails = await this.bookingRepo.findOneBy({id: booking_id})
        const driverToken = await this.utilService.getDeviceToken(bookingDetails.customer_id)
        const TITLE = 'Booking #'+booking_id
        const BODY = 'Your booking has been confirmed. Driver and vehicle details will be shared shortly!'
        if(driverToken) {
            await this.utilService.sendPushNotification(TITLE, BODY, driverToken.split(","))
        }
        return bookingData
    }

    async cancelByManager(booking_id: number): Promise<any> {
        const updateData = {
            'booking_canceled_by_manager': 1,
            'status': 'Canceled By Manager'
        }
        const bookingDetails = await this.bookingRepo.findOneBy({id: booking_id})
        let multi_booking_id = bookingDetails.multi_booking_id;
        let whereCond = {
            multi_booking_id
        }
        if(!multi_booking_id) {
            whereCond['id'] = booking_id
        }
        const bookings = await this.bookingRepo.find({where: whereCond})
        for(let booking of bookings) {
            const bookingData = await this.bookingRepo.update({id: booking.id}, updateData)
            const bsReq = {
                booking_id: booking.id,
                status: 'Canceled By Manager',
                created_by: 1,
                created_at: new Date(),
                updated_at: new Date()
            }
            await this.addBookingStatus(bsReq)
        }
        // const bookingDetails = await this.bookingRepo.findOneBy({id: booking_id})
        const driverToken = await this.utilService.getDeviceToken(bookingDetails.customer_id)
        const TITLE = 'Booking #'+booking_id
        const BODY = 'Due to the high demand in the bookings, we are unable to serve you currently for the booking id #'+booking_id+'. Kindly reschedule your trip.'
        if(driverToken) {
            await this.utilService.sendPushNotification(TITLE, BODY, driverToken.split(","))
        }
        
        return bookings
    }

    async cancelByCustomer(booking_id: number): Promise<any> {
        const updateData = {
            'booking_canceled_by_customer': 1,
            'status': 'Canceled By Customer'
        }
        const bookingData = await this.bookingRepo.update({id: booking_id}, updateData)
        const bsReq = {
            booking_id: booking_id,
            status: 'Canceled By Customer',
            created_by: 1,
            created_at: new Date(),
            updated_at: new Date()
        }
        await this.addBookingStatus(bsReq)
        return bookingData
    }

    async rejectFare(booking_id: number): Promise<any> {
        const updateData = {
            'quotation_status': 0, 
            'fare': '',
            'status': 'Pending',
            'quotation_payment_status': 0,
            'booking_accept_status': 0,
            'booking_confirm_status': 0
        }
        
        const bookingData = await this.bookingRepo.update({id: booking_id}, updateData)
        const bsReq = {
            booking_id: booking_id,
            status: 'Pending',
            created_by: 1,
            created_at: new Date(),
            updated_at: new Date()
        }
        await this.addBookingStatus(bsReq)
        const bookingDetails = await this.bookingRepo.findOneBy({id: booking_id})
        return bookingData
    }

    async addTrip(reqBody: any): Promise<any> {
        const pickPoint: Point = {
            type: 'Point',
            coordinates: [reqBody.pickup_long, reqBody.pickup_lat]

        }
        const dropPoint: Point = {
            type: 'Point',
            coordinates: [reqBody.dropoff_long, reqBody.dropoff_lat]
        }
        // //console.log(reqBody)
        const booking = await this.bookingRepo.findOneBy({id: reqBody.booking_id})
        const tripInput = {
            'customer_id' : reqBody.customer_id,
            'engaged_consolidation_manager' : reqBody.engaged_consolidation_manager ? reqBody.engaged_consolidation_manager : '',
            'pickup_location' : reqBody.pickup_location ? reqBody.pickup_location : '',
            'pickup_time' : reqBody.pickup_time ? reqBody.pickup_time : '',
            'dropoff_location' : reqBody.dropoff_location ? reqBody.dropoff_location : '',
            'dropoff_time' : reqBody.dropoff_time ? reqBody.dropoff_time : '',
            'status' : 'Pending',
            'pickup_lat' : reqBody.pickup_lat ? reqBody.pickup_lat : null,
            'pickup_long' : reqBody.pickup_long ? reqBody.pickup_long : null,
            'dropoff_lat' : reqBody.dropoff_lat ? reqBody.dropoff_lat : null,
            'dropoff_long' : reqBody.dropoff_long ? reqBody.dropoff_long : null,
            "created_by": reqBody.customer_id,
            "pickup_point": pickPoint,
            "dropoff_point": dropPoint,
            "booking_id": reqBody.booking_id,
            "trip_id": reqBody.trip_id,
            "booking": booking
        }
        // //console.log(tripInput)
        
        const tripDetails = await this.tripRepo.save(tripInput)
        await this.bookingRepo.update({id:reqBody.booking_id}, {marked_as_trip: true})
        const bsReq = {
            booking_id: reqBody.booking_id,
            status: 'Trip Created',
            created_by: 1,
            trip_id: reqBody.trip_id,
            created_at: new Date(),
            updated_at: new Date()
        }
        await this.addBookingStatus(bsReq)
        return tripDetails
    }

    async getTrips(reqBody: any): Promise<any> {
        let whereCon: any = {}
        if(reqBody.tour_id) {
            whereCon['tour_id'] = reqBody.tour_id
        }
        if(reqBody.id) {
            whereCon['id'] = reqBody.id
        }
        if(reqBody.booking_id) {
            whereCon['booking_id'] = reqBody.booking_id
        }
        if(reqBody.status) {
            whereCon['status'] = reqBody.status
        }
        if(reqBody.booking_type) {
            whereCon['booking'] = {booking_type: IsNull()}
        }
        const [items, count] = await this.tripRepo.findAndCount({where: whereCon, order:{tour_id: 'DESC', id: 'DESC'}, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) })
        return {items, count}
    }

    async getPendingTrips(reqBody: any): Promise<any> {
        const [items, count] = await this.tripRepo.findAndCount({where:{tour_id: IsNull()}, order:{id: 'DESC'}, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) })
        return {items, count}
    }

    async addBookingStatus(reqBody: any): Promise<any> {
        const bsDetails = await this.bsRepo.save(reqBody)
        await this.bookingRepo.update({id: reqBody.booking_id}, {'booking_status': reqBody.status})
        if(reqBody.tour_id) {
            await this.tourRepo.update({id: reqBody.tour_id}, {tour_status: reqBody.status})
        }
        return bsDetails
    }

    async updateBookingStatus(findQuery: any, updateValues: any): Promise<any> {
        //console.log(findQuery)
        //console.log(updateValues)
        const bsDetails = await this.bsRepo.update(findQuery, updateValues)
        return bsDetails
    }

    async deleteBookingStatus(reqBody: any): Promise<any> {
        const bsDetails = await this.bsRepo.delete(reqBody)
        return bsDetails
    }

    async getBSByBookingId(bookingId: number): Promise<any> {
        const bsDetails = await this.bsRepo.findOne({where: {booking_id: bookingId}, order: {id: 'DESC'}})
        return bsDetails
    }

    async getBSByBookingTourId(bookingId: number, tourId: number): Promise<any> {
        const bsDetails = await this.bsRepo.findOne({where: {booking_id: bookingId, tour_id: tourId}, order: {id: 'DESC'}})
        return bsDetails
    }

    async getBSByTourId(tourId: number): Promise<any> {
        const bsDetails = await this.bsRepo.findOne({where: {tour_id: tourId}, order: {id: 'DESC'}})
        return bsDetails
    }

    async getBookingStatusByFilter(whereCon: any): Promise<any> {
        const bsDetails = await this.bsRepo.findOne({where: whereCon})
        return bsDetails
    }
    

    async getAllBSByBookingId(bookingId: number): Promise<any> {
        const bsDetails = await this.bsRepo.find({where: {booking_id: bookingId}, order: {id: 'ASC'}})
        return bsDetails
    }

    async deleteTrip(tripId: any): Promise<any> {
        const tripData = await this.tripRepo.findOneBy({trip_id: tripId})
        if(tripData.tour_id) {
            await this.driverSessionDistance.delete({tour_id: tripData.tour_id})
            let tourSeqData = await this.tourRouteRepo.find({where: {tour_id: tripData.tour_id}})
            let isSingleTrip = true
            let bookingId = 0
            for(let seqData of tourSeqData) {
                if(seqData.trip_id != tripId) {
                    isSingleTrip = false
                } else {
                    bookingId = seqData.booking_id
                    await this.tourRouteRepo.delete({id: seqData.id})
                    await this.bookingRepo.update(seqData.booking_id, {marked_as_trip: false})
                    await this.deleteBookingStatus({booking_id: seqData.booking_id, tour_id: tripData.tour_id})
                }
            }
            if(isSingleTrip) {
                await this.bookingRepo.update(bookingId, {assign_tour_status_graph: 0})
                await this.tourBookingDetails.delete({tour_id: tripData.tour_id})
                await this.deleteBookingStatus({tour_id: tripData.tour_id})
                await this.tourAssignTruckDriverRepository.delete({tour_id: tripData.tour_id})
                await this.tourRepo.delete({id: tripData.tour_id})
            }
        }
        const delTrip = await this.tripRepo.delete({trip_id: tripId})
        await this.bookingRepo.update(tripData.booking_id, {marked_as_trip: false})
        await this.deleteBookingStatus({booking_id: tripData.booking_id, status: 'Trip Created'})
        return delTrip
    }

    async deleteBooking(id: number): Promise<any> {
        const booking = await this.bookingRepo.findOneBy({id})
        // remove any allocated tour stops for this booking, resequence the tour, and
        // sync the driver's Redis tour snapshot + allocation pool before deleting the booking
        await this.tourService.deleteBookingTour(id)
        if(booking.marked_as_trip) {
            // this.deleteTrip()
            const tripsData = await this.tripRepo.find({where: {booking_id: id}})
            for(let tripData of tripsData) {
                await this.deleteTrip(tripData.trip_id)
            }
        }
        await this.dBookingRepo.save({booking_id: booking.id, booking_data: JSON.stringify(booking), deleted_by: '1'})
        const delBooking = await this.bookingRepo.delete({id})
        
        return delBooking
    }

    async deleteMultiBooking(id: string): Promise<any> {
        let delBooking = {};
        if(id) {
            const bookings = await this.bookingRepo.find({where:{multi_booking_id:id}})
            for(let booking of bookings) {
                if(booking.marked_as_trip) {
                    // this.deleteTrip()
                    const tripsData = await this.tripRepo.find({where: {booking_id: booking.id}})
                    for(let tripData of tripsData) {
                        await this.deleteTrip(tripData.trip_id)
                    }
                }
                await this.dBookingRepo.save({booking_id: booking.id, booking_data: JSON.stringify(booking), deleted_by: '1'})
                delBooking = await this.bookingRepo.delete({id: booking.id})
            }
        } else {
            delBooking = {}
        }
        
        
        return delBooking
    }

    
    
    async getBookingsReport(reqBody: any): Promise<any> {
        let bookings: any = []
        let whereCon: any = {}
        if(reqBody.start_date) {
            let start_date = new Date(reqBody.start_date)
            let end_date = new Date(reqBody.end_date)
            end_date.setDate(end_date.getDate()+1)
            whereCon['created_at'] =  Between(start_date, end_date)
        } 
        if(reqBody.customer_id) {
            whereCon['customer_id'] = reqBody.customer_id
        }
        const items= await this.bookingRepo.find({where: whereCon, order:{id: 'DESC'}, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) })
        if(items && items.length) {
            for(let item of items) {
                const bStatus = await this.getAllBSByBookingId(item.id);
                let toursData: any = [], tourSequence: any, bookingSequence: any = {}
                if(bStatus.length) {
                    let tourIds = []
                    let bookingTour = bStatus.map((bData) => {
                        if(bData.tour_id) {
                            tourIds.push(bData.tour_id)
                        }
                        bookingSequence[bData.status] = bData
                    })
                    tourIds = [...new Set(tourIds)]
                    if(tourIds.length) {
                        const tours = await this.tourRepo.find({where: {id: In(tourIds)}})
                        tourSequence = await this.tourRouteRepo.find({where:{booking_id: item.id}, order:{sequence_number: 'ASC'}})
                        for(let tour of tours) {
                            let driverData: any = {}
                            let truckDetails: any = {}
                            if(tour.truck_owner_status == 'Accepted') {
                                driverData = await this.driverRepo.findOneBy({user_id: tour.driver_id})
                                const tourDriverDetails = await this.tourAssignTruckDriverRepository.findOneBy({tour_id: tour.id, driver_id: driverData.id})
                                if(tourDriverDetails) {
                                    truckDetails = await this.truckRepo.findOneBy({id: tourDriverDetails.truck_id})
                                }
                                
                            }
                            const tourData = {
                                ...tour,
                                driverData,
                                truckDetails
                            }
                            toursData.push(tourData)
                        }
                        
                    }
                    
                }
                
                const booking = {
                    ...item,
                    customer_name: await this.utilService.getName(item.customer_id),
                    booking_status: bStatus ? bStatus.status : '',
                    toursData,
                    tourSequence,
                    bookingSequence
                }
                bookings.push(booking)
            }
        }
        
        return bookings
    }

    async updateBookingFare(reqBody: any): Promise<any> {
        const bookingData = await this.bookingRepo.update({id: reqBody.booking_id}, {fare: reqBody.fare.toString()})
        const bookingDetails = await this.bookingRepo.findOneBy({id: reqBody.booking_id})
        if(bookingDetails.invoice_number) {
            await this.regenerateInvoiceById({invoiceNumber: bookingDetails.invoice_number})
        }
        return bookingData
    }

    async updateBookingWaitingCharge(reqBody: any): Promise<any> {
        const bookingData = await this.bookingRepo.update({id: reqBody.booking_id}, {waiting_charge: reqBody.waiting_charge.toString()})
        const bookingDetails = await this.bookingRepo.findOneBy({id: reqBody.booking_id})
        if(bookingDetails.invoice_number) {
            await this.regenerateInvoiceById({invoiceNumber: bookingDetails.invoice_number})
        }
        return bookingData
    }

    async addClosedBooking(reqBody: any): Promise<any> {
        let loading_charge = 0
        // if(reqBody.loading_charge) {
        //     const companyData = await this.companyRepo.find({where: {users: Like(`%#${reqBody.customer_id},%`)}})
        //     loading_charge = companyData[0].loading_charge ? companyData[0].loading_charge : 0
        // }
        const companyData = await this.companyRepo.findOne({where: {users: Like(`%#${reqBody.customer_id},%`)}})
        const rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(reqBody.commodity_weight ? reqBody.commodity_weight : 0), company_id: companyData ? companyData.id : 0}, order: {quantity: 'ASC'}})
        if(reqBody.both_loading_unloading_charge_applicable) {
            loading_charge = rate_data.loading_unloading
        } else {
            if(reqBody.loading_charge_applicable) {
                loading_charge = loading_charge + rate_data.loading
            }
            if(reqBody.unloading_charge_applicable) {
                loading_charge = loading_charge + rate_data.unloading
            }
        }
        const bookingInput = {
            'customer_id' : reqBody.customer_id,
            'engaged_consolidation_manager' : parseInt(process.env.ENV == 'test' ? process.env.testCCManagerId : process.env.prodCCManagerId),
            'pickup_location' : reqBody.pickup_location ? reqBody.pickup_location : '',
            'pickup_city' : reqBody.pickup_city ? reqBody.pickup_city : '',
            'pickup_state' : reqBody.pickup_state ? reqBody.pickup_state : '',
            'pickup_country' : reqBody.pickup_country ? reqBody.pickup_country : '',
            'pickup_pincode' : reqBody.pickup_pincode ? reqBody.pickup_pincode : '',
            'pickup_time' : reqBody.pickup_time ? reqBody.pickup_time : '',
            'pickuptime_flexiblity_status' : reqBody.pickuptime_flexiblity_status ? reqBody.pickuptime_flexiblity_status : '',
            'pickup_flexible_time' : reqBody.pickup_flexible_time ? reqBody.pickup_flexible_time : '',
            'dropoff_location' : reqBody.dropoff_location ? reqBody.dropoff_location : '',
            'dropoff_city' : reqBody.dropoff_city ? reqBody.dropoff_city : '',
            'dropoff_state' : reqBody.dropoff_state ? reqBody.dropoff_state : '',
            'dropoff_country' : reqBody.dropoff_country ? reqBody.dropoff_country : '',
            'dropoff_pincode' : reqBody.dropoff_pincode ? reqBody.dropoff_pincode : '',
            'dropoff_time' : reqBody.dropoff_time ? reqBody.dropoff_time : '',
            'dropofftime_flexiblity_status' : reqBody.dropofftime_flexiblity_status ? reqBody.dropofftime_flexiblity_status : '',
            'dropoff_flexible_time' : reqBody.dropoff_flexible_time ? reqBody.dropoff_flexible_time : '',
            'commodity_weight' : reqBody.commodity_weight ? reqBody.commodity_weight : '',
            'consignment_image' : reqBody.consignment_image ? reqBody.consignment_image : '',
            'receiver_name' : reqBody.receiver_name ? reqBody.receiver_name : 'Prakash',
            'receiver_contact' : reqBody.receiver_contact ? reqBody.receiver_contact : '8270247441',
            'instruction' : reqBody.instruction ? reqBody.instruction : '',
            'pickup_lat' : reqBody.pickup_lat ? reqBody.pickup_lat : null,
            'pickup_long' : reqBody.pickup_long ? reqBody.pickup_long : null,
            'dropoff_lat' : reqBody.dropoff_lat ? reqBody.dropoff_lat : null,
            'dropoff_long' : reqBody.dropoff_long ? reqBody.dropoff_long : null,
            'assign_tour_status' : reqBody.assign_tour_status ? reqBody.assign_tour_status : 0,
            "created_by": reqBody.customer_id,
            'quotation_status': 1,
            'fare': 'TBE',
            'estimated_fare': reqBody.estimated_fare ? reqBody.estimated_fare : 0,
            'quotation_payment_status': 1,
            'booking_accept_status': 1,
            'booking_confirm_status': 1,
            'status': 'Confirmed',
            // 'created_at': reqBody.pickup_time,
            'reached_pickup': reqBody.reached_pickup,
            'completed_pickup': reqBody.completed_pickup,
            'reached_drop': reqBody.reached_drop,
            'completed_drop': reqBody.completed_drop,
            'is_manager_entered': false,
            'is_closed_booking': reqBody.is_closed_booking,
            "customer_name": await this.utilService.getName(reqBody.customer_id),
            'driver_name': reqBody.driver_name,
            "is_having_loading_charges": reqBody.is_having_loading_charges ? reqBody.is_having_loading_charges : false,
            "loading_charge": loading_charge,
            "pickup_receiver_name": reqBody.pickup_receiver_name,
            "pickup_receiver_contact": reqBody.pickup_receiver_contact,
            'loading_charge_applicable': reqBody.loading_charge_applicable ? reqBody.loading_charge_applicable : false,
            'unloading_charge_applicable': reqBody.unloading_charge_applicable ? reqBody.unloading_charge_applicable : false,
            'both_loading_unloading_charge_applicable': reqBody.both_loading_unloading_charge_applicable ? reqBody.both_loading_unloading_charge_applicable : false
        }

        //console.log(bookingInput)
        const bookingDetails = await this.bookingRepo.save(bookingInput)
        const bsReq = {
            booking_id: bookingDetails.id,
            status: 'Created',
            created_by: reqBody.customer_id,
            created_at: reqBody.pickup_time,
            updated_at: new Date()
        }
        await this.addBookingStatus(bsReq)
        return bookingDetails
        
    }

    async updateBookingTime(reqBody: any): Promise<any> {
        let updateValues = {}
        // updateValues[reqBody.statusType] = reqBody.statusTime
        // updateValues['is_manager_entered'] = true
        // let booking = await this.bookingRepo.update({id: reqBody.booking_id}, updateValues)
        let tourStatus = {
            'reached_pickup': 'Reached pickup',
            'completed_pickup': 'Completed pickup',
            'reached_drop': 'Reached drop',
            'completed_drop': 'Completed drop'
        }
        for (let key in tourStatus) {
            updateValues[key] = reqBody[key]
            const bsFindQuery = {
                booking_id: reqBody.booking_id,
                status: tourStatus[key]
            }
            await this.updateBookingStatus(bsFindQuery, {created_at : new Date(reqBody[key])})
        }
        updateValues['is_manager_entered'] = false
        let booking = await this.bookingRepo.update({id: reqBody.booking_id}, updateValues)
        return booking
    }

    async updateBookingStatusTime(bookingId: number, timeType: string): Promise<any> {
        let updateValues = {}
        const nDate = new Date().toLocaleString('en-US', {timeZone: 'Asia/Calcutta'});
        updateValues[timeType] = moment(nDate).format('YYYY-MM-DD HH:mm:ss')
        if(bookingId) {
            let bookingUpdate = this.bookingRepo.update({id: bookingId}, updateValues)
            return bookingUpdate
        }
        return false
    }

    async addCustomerAddress(addressData: any): Promise<any> {
        const locPoint: Point = {
            type: 'Point',
            coordinates: [addressData.longitude, addressData.latitude]
        }
        const addrInput = {
            "address": addressData.address,
            "address_type": addressData.address_type,
            "city": addressData.city,
            "country": addressData.country,
            "customer_id": addressData.customer_id,
            "latitude": addressData.latitude,
            "longitude": addressData.longitude,
            "mobile": addressData.mobile,
            "pincode": addressData.pincode,
            "receiver_contact": addressData.receiver_contact,
            "receiver_name": addressData.receiver_name,
            "state": addressData.state,
            "created_by": addressData.customer_id,
            "location": locPoint
        }
        // //console.log(tripInput)
        const addrDetails = await this.cAddrRepo.save(addrInput)
        return addrDetails
    }

    async addShopBooking(reqBody: any): Promise<any> {
        const uid = (new Date().getTime()).toString(36)
        const customer_mobile = reqBody.customer_mobile;
        const customer = await this.utilService.findOrAddShopCustomer(customer_mobile);
        let pickupAddress = '';
        let pickup_receiver_name = '';
        let pickup_receiver_contact = '';
        if(reqBody.shop_id) {
            const shopDetails = await this.shopRepo.findOneBy({id: reqBody.shop_id})
            pickupAddress = shopDetails.address
            pickup_receiver_contact = shopDetails.contact_number
            pickup_receiver_name = shopDetails.shop_name
        } else {
            pickupAddress = reqBody.pickup_location
            pickup_receiver_contact = reqBody.customer_mobile ? reqBody.customer_mobile : '8270247441'
            pickup_receiver_name = reqBody.receiver_name
        }
        
        let loading_charge = 0
        // if(reqBody.loading_charge) {
        //     const companyData = await this.companyRepo.find({where: {users: Like(`%#${reqBody.customer_id},%`)}})
        //     loading_charge = companyData[0].loading_charge ? companyData[0].loading_charge : 0
        // }
        const companyData = await this.companyRepo.findOne({where: {users: Like(`%#${reqBody.customer_id},%`)}})
        const rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(reqBody.commodity_weight ? reqBody.commodity_weight : 0), company_id: companyData ? companyData.id : 0}, order: {quantity: 'ASC'}})
        if(reqBody.both_loading_unloading_charge_applicable) {
            loading_charge = rate_data.loading_unloading
        } else {
            if(reqBody.loading_charge_applicable) {
                loading_charge = loading_charge + rate_data.loading
            }
            if(reqBody.unloading_charge_applicable) {
                loading_charge = loading_charge + rate_data.unloading
            }
        }
        //console.log("welcome")
        const distanceByVehicle = {
            "2wheeler": 50,
            "3wheeler": 500,
            "4wheeler": 750
        }
        let pickup_time = ''
        if(reqBody.delivery_on == "nextday") {
            //console.log("next day")
            let tomorrow_date = moment().add(1, 'days').format('YYYY-MM-DD')
            pickup_time  = moment(tomorrow_date + ' ' + '03:30:00').tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss')
        } else {
            pickup_time = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss')
        }
        //console.log(pickup_time)
        const bookingInput = {
            'customer_id' : customer.id,
            'engaged_consolidation_manager' : reqBody.engaged_consolidation_manager ? reqBody.engaged_consolidation_manager : '',
            'pickup_location' : pickupAddress,
            'pickup_city' : reqBody.pickup_city ? reqBody.pickup_city : '',
            'pickup_state' : reqBody.pickup_state ? reqBody.pickup_state : '',
            'pickup_country' : reqBody.pickup_country ? reqBody.pickup_country : '',
            'pickup_pincode' : reqBody.pickup_pincode ? reqBody.pickup_pincode : '',
            'pickup_time' : pickup_time,
            'pickuptime_flexiblity_status' : reqBody.pickuptime_flexiblity_status ? reqBody.pickuptime_flexiblity_status : '',
            'pickup_flexible_time' : reqBody.pickup_flexible_time ? reqBody.pickup_flexible_time : '',
            'dropoff_location' : reqBody.dropoff_location ? reqBody.dropoff_location : '',
            'dropoff_city' : reqBody.dropoff_city ? reqBody.dropoff_city : '',
            'dropoff_state' : reqBody.dropoff_state ? reqBody.dropoff_state : '',
            'dropoff_country' : reqBody.dropoff_country ? reqBody.dropoff_country : '',
            'dropoff_pincode' : reqBody.dropoff_pincode ? reqBody.dropoff_pincode : '',
            // 'dropoff_time' : reqBody.dropoff_time ? reqBody.dropoff_time : '',
            'dropoff_time' : reqBody.dropoff_flexible_time ? reqBody.dropoff_flexible_time : (reqBody.dropoff_time ? reqBody.dropoff_time : ''),
            'dropofftime_flexiblity_status' : reqBody.dropofftime_flexiblity_status ? reqBody.dropofftime_flexiblity_status : '',
            'dropoff_flexible_time' : reqBody.dropoff_flexible_time ? reqBody.dropoff_flexible_time : '',
            'commodity_type' : reqBody.commodity_type ? reqBody.commodity_type : '',
            'other_commodity_name' : reqBody.other_commodity_name ? reqBody.other_commodity_name : '',
            'commodity_weight' : distanceByVehicle[reqBody.vehicle_type] ? distanceByVehicle[reqBody.vehicle_type] : 0,
            'weight_unit' : reqBody.weight_unit ? reqBody.weight_unit : '',
            'commodity_whole_volume' : reqBody.commodity_whole_volume ? reqBody.commodity_whole_volume : '',
            'volume_unit' : reqBody.volume_unit ? reqBody.volume_unit : '',
            'commodity_length' : reqBody.commodity_length ? reqBody.commodity_length : 0,
            'length_unit' : reqBody.length_unit ? reqBody.length_unit : '',
            'commodity_breadth' : reqBody.commodity_breadth ? reqBody.commodity_breadth : 0,
            'breadth_unit' : reqBody.breadth_unit ? reqBody.breadth_unit : '',
            'commodity_height' : reqBody.commodity_height ? reqBody.commodity_height : 0,
            'height_unit' : reqBody.height_unit ? reqBody.height_unit : '',
            'packaging_type' : reqBody.packaging_type ? reqBody.packaging_type : '',
            'consignment_image' : reqBody.consignment_image ? reqBody.consignment_image : '',
            'receiver_name' : reqBody.receiver_name ? reqBody.receiver_name : 'Prakash',
            'receiver_contact' : reqBody.customer_mobile ? reqBody.customer_mobile : '8270247441',
            'instruction' : reqBody.instruction ? reqBody.instruction : '',
            'status' : reqBody.status ? reqBody.status : 'Pending',
            'pickup_lat' : reqBody.pickup_lat ? reqBody.pickup_lat : null,
            'pickup_long' : reqBody.pickup_long ? reqBody.pickup_long : null,
            'dropoff_lat' : reqBody.dropoff_lat ? reqBody.dropoff_lat : null,
            'dropoff_long' : reqBody.dropoff_long ? reqBody.dropoff_long : null,
            'assign_tour_status' : reqBody.assign_tour_status ? reqBody.assign_tour_status : 0,
            "created_by": customer.id,
            "customer_name": customer.name,
            "is_having_loading_charges": reqBody.is_having_loading_charges ? reqBody.is_having_loading_charges : false,
            "loading_charge": loading_charge,
            "booking_type": reqBody.booking_type ? reqBody.booking_type : 'Home Delivery',
            "vehicle_type": reqBody.vehicle_type,
            "payment_type": reqBody.payment_type,
            "payment_status": 'Pending',
            "fare": reqBody.fare ? reqBody.fare : 0,
            "estimated_fare": reqBody.fare ? reqBody.fare : 0,
            "pickup_receiver_name": pickup_receiver_contact,
            "pickup_receiver_contact": pickup_receiver_contact,
            'booking_for': reqBody.booking_for ? reqBody.booking_for : 'Sender',
            'is_vivegam': reqBody.is_vivegam === false ? reqBody.is_vivegam : true,
            'total_distance': reqBody.distance ? reqBody.distance : 0,
            'shop_id': reqBody.shop_id ? reqBody.shop_id : 0,
            'loading_charge_applicable': reqBody.loading_charge_applicable ? reqBody.loading_charge_applicable : false,
            'unloading_charge_applicable': reqBody.unloading_charge_applicable ? reqBody.unloading_charge_applicable : false,
            'both_loading_unloading_charge_applicable': reqBody.both_loading_unloading_charge_applicable ? reqBody.both_loading_unloading_charge_applicable : false,
            "payment_at": "drop",
            "multi_booking_id": uid,
            "trip_type": "oneway", // oneway, round, multipickup, multidrop
            "is_regular": false,
            "additional_fare": '0',
            "additional_fare_comments": '',
            "is_full_payment": true,
            "total_fare": reqBody.fare ? reqBody.fare : 0,
            "dropoff_receiver_contact": reqBody.customer_mobile ? reqBody.customer_mobile : '8270247441',
            "dropoff_receiver_name": reqBody.receiver_name ? reqBody.receiver_name : 'Prakash'
        }
        //console.log(bookingInput)
        if(reqBody.save_address) {
            let addressData = {
                "address": reqBody.dropoff_location,
                "address_type": 'dropoff',
                "city": reqBody.dropoff_city,
                "country": reqBody.dropoff_country,
                "customer_id": customer.id,
                "latitude": reqBody.dropoff_lat,
                "longitude": reqBody.dropoff_long,
                "mobile": customer_mobile,
                "pincode": reqBody.dropoff_pincode,
                "receiver_contact": customer_mobile,
                "receiver_name": customer_mobile,
                "state": reqBody.dropoff_state,
                "created_by": customer.id
            }
            await this.addCustomerAddress(addressData);
        }
        const bookingDetails = await this.bookingRepo.save(bookingInput)
        let encoded_value = ''
        let accessCode = ""
        try {
            const bsReq = {
                booking_id: bookingDetails.id,
                status: 'Created',
                created_by: reqBody.customer_id,
                created_at: new Date(),
                updated_at: new Date()
            }
            await this.addBookingStatus(bsReq)
            
            var mailOptions = {
                from: 'noreplygo.20221@gmail.com',
                to: 'hr.goodmove@gmail.com, siva.k.meet@gmail.com, konarraj5@gmail.com',
                // to: 'nageswararaonali@gmail.com',
                subject: 'GoodMove MinL Bookings',
                text: `New booking with booking id # ${bookingDetails.id}
                Customer Name: ${reqBody.customer_mobile}
                Pickup time: ${reqBody.pickup_time}
                Pickup Location: ${reqBody.pickup_location}
                Dropoff Location: ${reqBody.dropoff_location}
                `
            }
            if(process.env.ENV != 'test') {
                await mail.sendMail(mailOptions);
            }
            
            let bookingUrl = await turl.shorten(this.baseUrl+"/booking/"+bookingDetails.id)
            const smsData = {
                "template_id": this.configService.get('BOOKING_CONFIRM_SMS_TEMPLATE_ID'),
                "sender": this.configService.get('SMS_SENDER_ID'),
                "short_url": "1",
                "mobiles": "91"+customer_mobile,
                "b_id": bookingDetails.id,
                "b_link": " "+this.baseUrl+"/booking/"+bookingDetails.id + " "
            }
            const smsRespData = await this.utilService.sendBookingSMS(smsData)
            if(reqBody.payment_type == 'COD' || reqBody.payment_type == 'PS') {
                
                if(reqBody.shop_id) {
                    //console.log("sending sms to shop")
                    const shopDetails = await this.shopRepo.findOneBy({id: reqBody.shop_id})
                    const shopSmsData = {
                        "template_id": this.configService.get('BOOKING_CONFIRM_SMS_TEMPLATE_ID'),
                        "sender": this.configService.get('SMS_SENDER_ID'),
                        "short_url": "1",
                        "mobiles": "91"+shopDetails.contact_number,
                        "b_id": bookingDetails.id,
                        "b_link": " "+this.baseUrl+"/booking/"+bookingDetails.id + " "
                    }
                    //console.log(shopSmsData)
                    const smsRespData = await this.utilService.sendBookingSMS(shopSmsData)
                    //console.log(smsRespData)
                }
                //console.log(smsRespData)
                
            } else {
                let merchant_id = '2351319'
                accessCode = "AVEU68LC87AL37UELA"
                let workingKey = 'B22B0C4BF6003323A64FDD2DF445EF58'
                let order_id = bookingDetails.id
                let fare = bookingDetails.fare.toFixed(2);
                /*if(reqBody.booking_type != 'Home Delivery') {
                    fare = 1.00
                }*/
                // let fare = 1.00
                let reqData = "merchant_id="+merchant_id+"&order_id="+order_id+"&currency=INR&amount="+fare+"&redirect_url="+this.apiBaseUrl+"/booking/getCCavenueResponse&cancel_url="+this.apiBaseUrl+"/booking/getCCavenueResponse&language=EN"
                encoded_value = await this.encrypt(reqData, workingKey)
            }
            bookingDetails['booking_url'] = bookingUrl
            return {bookingDetails, encoded_value, accessCode}
        } catch(e) {
            return {bookingDetails, encoded_value, accessCode}
        }
        
        // const encoded_value = await ccav.encrypt(reqData);
        
    }

    async getMinlBookingPayDetails(reqBody: any): Promise<any> {
        let encoded_value = ''
        let accessCode = ""
        if(!reqBody.booking_id) {
            return false;
        } else {
            let bookingDetails = await this.bookingRepo.findOneBy({id: reqBody.booking_id});
            if(!bookingDetails) {
                return false
            } else {
                let merchant_id = '2351319'
                accessCode = "AVEU68LC87AL37UELA"
                let workingKey = 'B22B0C4BF6003323A64FDD2DF445EF58'
                let order_id = bookingDetails.id
                let fare: any = parseInt(bookingDetails.fare).toFixed(2);
                /*if(reqBody.booking_type != 'Home Delivery') {
                    fare = 1.00
                }*/
                // let fare = 1.00
                let reqData = "merchant_id="+merchant_id+"&order_id="+order_id+"&currency=INR&amount="+fare+"&redirect_url="+this.apiBaseUrl+"/booking/getCCavenueResponse&cancel_url="+this.apiBaseUrl+"/booking/getCCavenueResponse&language=EN"
                encoded_value = await this.encrypt(reqData, workingKey)
            }
            return {bookingDetails, encoded_value, accessCode}
            
        }
    }

    async getBookingPayDetails(reqBody: any): Promise<any> {
        if(!reqBody.booking_id) {
            return false;
        } else {
            let bookingDetails = await this.bookingRepo.findOneBy({id: reqBody.booking_id});
            if(!bookingDetails) {
                return false
            } else {
                let merchant_id = '2351319'
                let accessCode = "AVVO64LB01BR33OVRB"
                let workingKey = 'AEE23A7C89F22D69487AF1982E0B3877'
                let order_id = bookingDetails.id
                // let fare = bookingDetails.additional_fare.toFixed(2)
                let totalFare: any = parseInt(bookingDetails.estimated_fare) + bookingDetails.loading_charge + bookingDetails.toll_charges + parseInt(bookingDetails.additional_fare)
                totalFare = totalFare.toFixed(2);
                // totalFare = 1.00
                let reqData = "merchant_id="+merchant_id+"&order_id="+order_id+"&currency=INR&amount="+totalFare+"&redirect_url="+this.apiBaseUrl+"/booking/getGMCCavenueResponse&cancel_url="+this.apiBaseUrl+"/booking/getGMCCavenueResponse&language=EN"
                let encoded_value = await this.encrypt(reqData, workingKey)
                return {bookingDetails, encoded_value, accessCode}
            }
        }
    }
    
    async getBookingPayDetailsByMultiId(reqBody: any): Promise<any> {
        if(!reqBody.booking_id) {
            return false;
        } else {
            let bookingDetails = await this.bookingRepo.find({where:{multi_booking_id: reqBody.booking_id, booking_canceled_by_manager: 0}, order:{id: 'ASC'}});
            //console.log(bookingDetails)
            if(bookingDetails && bookingDetails.length) {
                let merchant_id = '2351319'
                let accessCode = "AVVO64LB01BR33OVRB"
                let workingKey = 'AEE23A7C89F22D69487AF1982E0B3877'
                let order_id = reqBody.booking_id
                // let fare = bookingDetails.additional_fare.toFixed(2)
                // let totalFare: any = parseInt(bookingDetails.estimated_fare) + bookingDetails.loading_charge + bookingDetails.toll_charges + parseInt(bookingDetails.additional_fare)
                let totalFare: any = parseInt(bookingDetails[0].total_fare)
                totalFare = totalFare.toFixed(2);
                // totalFare = 1.00
                let reqData = "merchant_id="+merchant_id+"&order_id="+order_id+"&currency=INR&amount="+totalFare+"&redirect_url="+this.apiBaseUrl+"/booking/getGMCCavenueResponse&cancel_url="+this.apiBaseUrl+"/booking/getGMCCavenueResponse&language=EN"
                let encoded_value = await this.encrypt(reqData, workingKey)
                return {bookingDetails, encoded_value, accessCode}
            } else {
                return false
            }
        }
    }

    async uploadReceipt(file: any, tour_id: number) {
        const { originalname } = file;
        const bucketS3 = this.configService.get('CUSTOMER_RECEIPTS_BUCKET_NAME');
        const uploadedData: any = await this.uploadS3(file.buffer, bucketS3, originalname);
        return uploadedData.Location
    }
    async uploadS3(file, bucket, name) {
        const s3 = this.getS3();
        const params = {
            Bucket: bucket,
            Key: String(name),
            Body: file,
        };
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

    encrypt = async (plainText, working_key)  => {
        // const { working_key } = initOptions;
      const m = crypto.createHash('md5');
      m.update(working_key);
      const key = m.digest();
      const iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';
      const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
      let encoded = cipher.update(plainText, 'utf8', 'hex');
      encoded += cipher.final('hex');
      return encoded;
    }

    decrypt = async (encText, working_key) => {
        const m = crypto.createHash('md5');
        m.update(working_key);
        const key = m.digest();
        const iv = '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f';
        const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
        let decoded = decipher.update(encText, 'hex', 'utf8');
        decoded += decipher.final('utf8');
        return decoded;
    }
    
    async getCCavenueSession(reqBody: any): Promise<any> {
        let res = {}
        let merchant_id = '2351319'
        let accessCode = "AVMA69KE71CA69AMAC"
        let workingKey = '4130B48C7FBEC28A0D23658379D233D1'
        let order_id = 1
        let reqData = "merchant_id="+merchant_id+"&order_id="+order_id+"&currency=INR&amount=1.00&redirect_url="+this.apiBaseUrl+"/booking/getCCavenueResponse&cancel_url="+this.apiBaseUrl+"/booking/getCCavenueResponse&language=EN"
        
        let encoded_value = await this.encrypt(reqData, workingKey)
        // const encoded_value = await ccav.encrypt(reqData);
        //console.log(encoded_value)
        res['encoded_value'] = encoded_value;
        res['accessCode'] = accessCode;
        return res
    }

    async getCCavenueResponse(reqBody: any): Promise<any> {
        let res = ''
        let workingKey = 'B22B0C4BF6003323A64FDD2DF445EF58'
        //console.log(reqBody)
        const { encResp } = reqBody;
        try {
            const output = await this.decrypt(encResp, workingKey);
            // const encoded_value = await ccav.encrypt(reqData);
            //console.log("ccavenue resp")
            //console.log(output)
            const ccResp = Object.fromEntries(new URLSearchParams(output));
            //console.log(ccResp)
            if(ccResp.order_status == 'Shipped' || ccResp.order_status == 'Success') {
                //console.log("success page")
                let bookingDetails = await this.bookingRepo.findOne({where:{id: parseInt(ccResp.order_id)}})
                await this.bookingRepo.update({id: bookingDetails.id}, {'payment_status': 'Completed'})
                const smsData = {
                    "template_id": this.configService.get('BOOKING_CONFIRM_SMS_TEMPLATE_ID'),
                    "sender": this.configService.get('SMS_SENDER_ID'),
                    "short_url": "1",
                    "mobiles": "91"+bookingDetails.receiver_contact,
                    "b_id": bookingDetails.id,
                    "b_link": this.baseUrl+"/booking/"+bookingDetails.id
                }
                //console.log("sms daata")
                //console.log(smsData)
                const smsRespData = await this.utilService.sendBookingSMS(smsData)
                //console.log(smsRespData)
                res = 'http://minl.goodmove.in/paymentsuccess/'+ccResp.order_id
                
            } else {
                //console.log("failure page")
                res = 'http://minl.goodmove.in/paymentfailed/'+ccResp.order_id
            }
        } catch (e) {
            //console.log(e)
            res = 'http://minl.goodmove.in/paymentfailed/'
        }
        
        return res
    }

    async getGMCCavenueResponse(reqBody: any): Promise<any> {
        
        let res = ''
        // let workingKey = '4130B48C7FBEC28A0D23658379D233D1'
        // let accessCode = "AVVO64LB01BR33OVRB"
        let workingKey = 'AEE23A7C89F22D69487AF1982E0B3877'
        //console.log(reqBody)
        const { encResp } = reqBody;
        let output: any = {}
        try {
            output = await this.decrypt(encResp, workingKey);
        } catch (error) {
            await this.paymentTransactionErrorRepo.save({payment_data: "Invalid response from Gateway", message: error.message})
        }
        

        // const encoded_value = await ccav.encrypt(reqData);
        //console.log("ccavenue resp")
        //console.log(output)
        // sample ccavenue success response
        /*{
            order_id: 'luxlucqd',
            tracking_id: '113249437073',
            bank_ref_no: '410486261899',
            order_status: 'Success',
            failure_message: '',
            payment_mode: 'Unified Payments',
            card_name: 'UPI',
            status_code: 'null',
            status_message: 'Transaction Successful-NA-0',
            currency: 'INR',
            amount: '1.00',
            billing_name: '',
            billing_address: '',
            billing_city: '',
            billing_state: '',
            billing_zip: '',
            billing_country: '',
            billing_tel: '',
            billing_email: '',
            delivery_name: '',
            delivery_address: '',
            delivery_city: '',
            delivery_state: '',
            delivery_zip: '',
            delivery_country: '',
            delivery_tel: '',
            merchant_param1: '',
            merchant_param2: '',
            merchant_param3: '',
            merchant_param4: '',
            merchant_param5: '',
            vault: 'N',
            offer_type: 'null',
            offer_code: 'null',
            discount_value: '0.0',
            mer_amount: '1.00',
            eci_value: 'null',
            retry: 'N',
            response_code: 'null',
            billing_notes: '',
            trans_date: '13/04/2024 13:37:28',
            bin_country: '' }*/
        const ccResp = Object.fromEntries(new URLSearchParams(output));
        //console.log(ccResp)
        if(ccResp.order_status.toLocaleLowerCase() == 'shipped' || ccResp.order_status.toLocaleLowerCase() == 'success') {
            //console.log("success page")
            try {
                let bookingDetails = await this.bookingRepo.find({where:{multi_booking_id: ccResp.order_id}})
                let pay_amount = parseInt(ccResp.amount)
                let booking_pay_amount = bookingDetails.length > 1 ? pay_amount/bookingDetails.length : pay_amount
                await this.bookingRepo.update({multi_booking_id: ccResp.order_id}, {'payment_status': 'Completed', 'payment_type': 'online', amount_collected: booking_pay_amount.toString()})
                let transactionData = {
                    amount: ccResp.amount,
                    order_id: ccResp.order_id,
                    tracking_id: ccResp.tracking_id,
                    bank_ref_no: ccResp.bank_ref_no,
                    payment_mode: ccResp.payment_mode,
                    card_name: ccResp.card_name,
                    transaction_date: ccResp.trans_date,
                }
                await this.paymentTransactionRepo.save(transactionData)
            } catch (error) {
                await this.paymentTransactionErrorRepo.save({payment_data: JSON.stringify(ccResp), message: error.message})
            }
            
            /*const smsData = {
                "template_id": this.configService.get('BOOKING_CONFIRM_SMS_TEMPLATE_ID'),
                "sender": this.configService.get('SMS_SENDER_ID'),
                "short_url": "1",
                "mobiles": "91"+bookingDetails.receiver_contact,
                "b_id": bookingDetails.id,
                "b_link": this.baseUrl+"/booking/"+bookingDetails.id
            }
            //console.log("sms daata")
            //console.log(smsData)
            const smsRespData = await this.utilService.sendBookingSMS(smsData)
            //console.log(smsRespData)*/
            res = 'https://payment.goodmove.in/paymentsuccess/'+ccResp.order_id
            
        } else {
            //console.log("failure page")
            // res = 'https://payment.goodmove.in/paymentfailed/'+ccResp.order_id
            res = 'https://payment.goodmove.in/bookings/'+ccResp.order_id
        }
        
        return res
    }

    async updateBookingPaymentStatus(reqBody: any): Promise<any> {
        const bookingDetails = await this.bookingRepo.update({id: reqBody.booking_id}, {'payment_status': reqBody.status})
        //console.log(bookingDetails)
        return bookingDetails
    }

    async checkAndUpdateBookingPaymentStatus(reqBody: any): Promise<any> {
        const bookingData = await this.bookingRepo.findOneBy({id: reqBody.booking_id})
        if(bookingData) {
            let updData: any = {}
            let isUpdate = false
            if(bookingData.payment_type == 'COD') {
                updData = {'payment_status': 'Completed'}
                isUpdate = true
            } else if(bookingData.payment_type == 'Online payment' && bookingData.payment_status == 'Pending') {
                updData = {'payment_status': 'Completed', 'payment_type': 'COD'}
                isUpdate = true
            }
            if(isUpdate) {
                const bookingDetails = await this.bookingRepo.update({id: reqBody.booking_id}, updData)
            }
        }
        return true
    }
    
    async exportInvoiceBookingsCsv(reqBody: any): Promise<any> {
        let bookings: any = []
        let whereCon: any = {}
        let bString = ''
        let targetFileName = "bookings_"+reqBody.start_date+"_"+reqBody.end_date+'.csv'
        const reportFileName= './public/trips.csv';
        const headerData = ['', 'Booking id', 'Date', 'Company Name','Company name from database', 'DC No.', 'From', 'To', 
        'Distance (km)', 'Rates invoiced', 'Status of payment',	'Mode of payment',	'Driver Name', 'Driver Mobile',	'Amount paid to trucker', 'Status of payment', 'New Rates',	
        'Existing rates',	'Quantity (kg)',	'Pick up: In time',	'Pick up: Out time', 'Drop off: In Time', 'Drop off: Out Time',	'Vehicle type',
        'Loading/Unloading charges', 'Document charges', 'CFPs waiting charges', 'Actual waiting charges invoiced',	'Mode- unloading', 'Waiting time',
        'Waiting charges', 'List of industries', 'Tour Id', 'Waiting Charge Formula', 'Customer Name', 'Booking Type', 'BAP ID']
        let tomorrow_date = moment(reqBody.end_date).add(1, 'days').format('YYYY-MM-DD')
        if(reqBody.start_date) {
            // whereCon['created_at'] =  Between(new Date(reqBody.start_date), new Date(reqBody.end_date))
            whereCon['reached_pickup'] =  Between(new Date(reqBody.start_date), new Date(reqBody.end_date))
        } 
        //console.log(whereCon)
        // const items= await this.bookingRepo.find({where: whereCon, order:{id: 'DESC'}})
        let items = await this.bookingRepo
            .createQueryBuilder('b')
            .select("*")
            .where('booking_type is null and reached_pickup > :start_date and reached_pickup < :end_date', {start_date: reqBody.start_date, end_date: tomorrow_date, booking_type: 'Home Delivery'})
            .orderBy("reached_pickup", 'ASC')
            .getRawMany();

            let itemss = await this.bookingRepo
            .createQueryBuilder('b')
            .select("*")
            .where('booking_type !=:booking_type and reached_pickup >:start_date and reached_pickup <:end_date', {start_date: reqBody.start_date, end_date: tomorrow_date, booking_type: 'Home Delivery'})
            .orderBy("reached_pickup", 'ASC')
            .getSql()
            //console.log(itemss)
        // //console.log(items.length)
        // //console.log(items)
        for(let i=0; i<headerData.length; i++){
            bString += headerData[i] + ","
        }
        bString += '\n'
        if(items && items.length) {
            for(let item of items) {
                // //console.log(item.id)
                const bStatus = await this.getBSByBookingId(item.id);
                const tourRoutesData = await this.tourRouteRepo.findOne({where: {booking_id: item.id}})
                let driverData: any = {}
                let tourId = 0
                // //console.log(item.id, bStatus.tour_id)
                if(tourRoutesData && tourRoutesData.tour_id) {
                    tourId = tourRoutesData.tour_id
                    let tour = await this.tourRepo.findOneBy({id: tourRoutesData.tour_id})
                    if(tour.truck_owner_status == 'Accepted' || (tour.tour_status != 'Tour Created' && tour.tour_status != '')) {
                        driverData = await this.driverRepo.findOneBy({user_id: tour.driver_id})
                    }
                }
                const companyDetails = await this.companyRepo.findOne({where: {users: Like(`%#${item.customer_id},%`)}})

                if(!driverData) {
                    driverData = {}
                }
                const booking = {
                    ...item,
                    customer_name: await this.utilService.getName(item.customer_id),
                    booking_status: bStatus ? bStatus.status : '',
                    driverData,
                    company_name: companyDetails ? companyDetails.company_name : '',
                    bap_id: ''
                }
                let reached_pickup = booking.reached_pickup ?  booking.reached_pickup.split(" ")[1] : "";
                let completed_pickup = booking.completed_pickup ?  booking.completed_pickup.split(" ")[1] : "";
                let reached_drop = booking.reached_drop ?  booking.reached_drop.split(" ")[1] : "";
                let completed_drop = booking.completed_drop ?  booking.completed_drop.split(" ")[1] : "";
                let booking_date = booking.reached_pickup ?  booking.reached_pickup.split(" ")[0].toString() : "";
                bString += "," + booking.id + "," + booking_date + ",," + booking.company_name + "," + booking.dcNumber + "," + booking.pickup_location.replace(/,/g, "") + "," + booking.dropoff_location.replace(/,/g, "") + "," + booking.total_distance + ",,,," + booking.driverData.name + "," + booking.driverData.mobile_number + ",,," + booking.fare + ",," + booking.commodity_weight + ',' + reached_pickup + "," + completed_pickup + "," + reached_drop + "," + completed_drop + ",,"+ booking.loading_charge +","+ booking.toll_charges +",,,," + booking.waiting_time + "," + booking.waiting_charge + ",," + tourId + "," + (booking.waiting_charge_notes ? booking.waiting_charge_notes.replace(/,/g, "") : '') + "," + booking.customer_name + "," + booking.booking_type + "," + booking.bap_id + '\n'
                bookings.push(booking)
            }
            await fs.writeFileSync(reportFileName, bString, 'utf8')
            const s3 = this.getS3();
            const params = {
                Bucket: this.configService.get('TEST_BOOKING_REPORTS_BUCKET_NAME'),
                Key: String(targetFileName),
                Body: fs.readFileSync(reportFileName),
            };
            let c = await s3.upload(params).promise();
            
        }
        return "https://go-booking-reports.s3.ap-south-1.amazonaws.com/"+targetFileName
    }

    async exportInvoiceHomeDeliveryBookingsCsv(reqBody: any): Promise<any> {
        let bookings: any = []
        let whereCon: any = {}
        let bString = ''
        let targetFileName = "hd_bookings_"+reqBody.start_date+"_"+reqBody.end_date+'.csv'
        const reportFileName= './public/trips.csv';
        const headerData = ['', 'Booking id', 'Date', 'Company Name','Company name from database', 'DC No.', 'From', 'To', 
        'Distance (km)', 'Rates invoiced', 'Status of payment',	'Mode of payment',	'Driver Name', 'Driver Mobile',	'Payment Type', 'Payment Status', 'New Rates',	
        'Existing rates',	'Quantity (kg)',	'Pick up: In time',	'Pick up: Out time', 'Drop off: In Time', 'Drop off: Out Time',	'Vehicle type',
        'Loading/Unloading charges', 'Document charges', 'CFPs waiting charges', 'Actual waiting charges invoiced',	'Mode- unloading', 'Waiting time',
        'Waiting charges', 'List of industries']
        let tomorrow_date = moment(reqBody.end_date).add(1, 'days').format('YYYY-MM-DD')
        if(reqBody.start_date) {
            // whereCon['created_at'] =  Between(new Date(reqBody.start_date), new Date(reqBody.end_date))
            whereCon['reached_pickup'] =  Between(new Date(reqBody.start_date), new Date(reqBody.end_date))
        } 
        //console.log(whereCon)
        // const items= await this.bookingRepo.find({where: whereCon, order:{id: 'DESC'}})
        let items = await this.bookingRepo
            .createQueryBuilder('b')
            .select("*")
            .where('booking_type = :booking_type and created_at >:start_date and created_at <:end_date', {start_date: reqBody.start_date, end_date: tomorrow_date, booking_type: 'Home Delivery'})
            .orderBy("created_at", 'ASC')
            .getRawMany();
        //console.log(items.length)
        for(let i=0; i<headerData.length; i++){
            bString += headerData[i] + ","
        }
        bString += '\n'
        if(items && items.length) {
            for(let item of items) {
                const bStatus = await this.getBSByBookingId(item.id);
                let driverData: any = {name: '', mobile_number: ''}
                if(bStatus && bStatus.tour_id) {
                    let tour = await this.tourRepo.findOneBy({id: bStatus.tour_id})
                    if(tour.truck_owner_status == 'Accepted') {
                        driverData = await this.driverRepo.findOneBy({user_id: tour.driver_id})
                    }
                }
                let companyDetails = await this.shopRepo.findOne({where: {contact_number : item.pickup_receiver_contact}})
                const booking = {
                    ...item,
                    customer_name: await this.utilService.getName(item.customer_id),
                    booking_status: bStatus ? bStatus.status : '',
                    driverData,
                    company_name: companyDetails ? companyDetails.shop_name : ''
                }
                let reached_pickup = booking.reached_pickup ?  booking.reached_pickup.split(" ")[1] : "";
                let completed_pickup = booking.completed_pickup ?  booking.completed_pickup.split(" ")[1] : "";
                let reached_drop = booking.reached_drop ?  booking.reached_drop.split(" ")[1] : "";
                let completed_drop = booking.completed_drop ?  booking.completed_drop.split(" ")[1] : "";
                let booking_date = moment(booking.created_at).format('YYYY-MM-DD');
                bString += "," + booking.id + "," + booking_date + ",," + booking.company_name.replace(/,/g, "") + ",," + booking.pickup_location.replace(/,/g, "") + "," + booking.dropoff_location.replace(/,/g, "") + "," + booking.total_distance + ",,,," + booking.driverData.name + "," + booking.driverData.mobile_number + "," +booking.payment_type+ "," + booking.payment_status + "," + booking.fare + ",," + booking.commodity_weight + ',' + reached_pickup + "," + completed_pickup + "," + reached_drop + "," + completed_drop + ",,,,,,," + booking.waiting_time + "," + booking.waiting_charge + "," + '\n'
                bookings.push(booking)
            }
            await fs.writeFileSync(reportFileName, bString, 'utf8')
            const s3 = this.getS3();
            const params = {
                Bucket: this.configService.get('TEST_BOOKING_REPORTS_BUCKET_NAME'),
                Key: String(targetFileName),
                Body: fs.readFileSync(reportFileName),
            };
            let c = await s3.upload(params).promise();
            //console.log(c)
            return "https://go-booking-reports.s3.ap-south-1.amazonaws.com/"+targetFileName
        } else {
            return false
        }
        
    }

    
    async getMinlBookingsByCustomer(reqBody: any): Promise<any> {
        let bookings: any = []
        let whereCon: any = {}
        let orderBy = {}
        let limit = reqBody.limit ? reqBody.limit : 10
        let todayDate = moment().format('YYYY-MM-DD')
        // whereCon['pickup_time'] = Not(Like(`${todayDate}%`))
        whereCon['booking_canceled_by_customer'] = 0
        whereCon['booking_canceled_by_manager'] = 0
        let user = await this.utilService.getCustomerByMobile(reqBody.customer_mobile)
        whereCon["customer_id"] = user.id
        whereCon["booking_type"] = reqBody.booking_type ? reqBody.booking_type : 'Home Delivery'
        if(reqBody.id) {
            whereCon["id"] = reqBody.id
        }
        if(reqBody.status) {
            whereCon["status"] = reqBody.status
        }
        if(reqBody.created_at) {
            let created_at_date = new Date(moment(new Date(reqBody.created_at)).format('YYYY-MM-DD'))
            let nextDay = new Date(created_at_date)
            nextDay.setDate(created_at_date.getDate()+1)
            //console.log(created_at_date, nextDay)
            whereCon["created_at"] = Between(created_at_date, nextDay)
        }

        if(reqBody.reached_pickup) {
            let reached_date = new Date(reqBody.reached_pickup)
            let nextDay = new Date(reached_date)
            nextDay.setDate(reached_date.getDate()+1)
            //console.log(reached_date, nextDay)
            whereCon["reached_pickup"] = Between(reached_date, nextDay)
        }

        if(reqBody.booking_status) {
            whereCon["booking_status"] = reqBody.booking_status
        }

        if(reqBody.driver_name) {
            whereCon["driver_name"] = reqBody.driver_name
        }

        if(reqBody.pickup_time) {
            whereCon['pickup_time'] = Like(`${reqBody.pickup_time}%`)
        }

        if('is_manager_entered' in reqBody) {
            whereCon["is_manager_entered"] = reqBody.is_manager_entered
        }

        if(reqBody.from_manager_app) {
            orderBy['id'] = 'DESC'
        } else {
            orderBy['created_at'] = 'DESC'
            limit = 20
        }

        //console.log(whereCon)
        //console.log(orderBy)
        //console.log(whereCon)
        const [items, count] = await this.bookingRepo.findAndCount({where: whereCon, order: orderBy, skip: (reqBody.offset ? reqBody.offset : 0), take: limit })
        for(let booking of items) {
            let bookingUrl = await turl.shorten(this.baseUrl+"/booking/"+booking.id)
            let tourData = await this.tourRouteRepo.findOneBy({booking_id: booking.id})
            let companyDetails = await this.companyRepo.findOne({where: {users: Like(`%#${booking.customer_id},%`)}})
            let bookingData = {
                ...booking,
                tour_id: tourData ? tourData.tour_id : '',
                company_name: companyDetails ? companyDetails.company_name : '',
                booking_url: bookingUrl
            }
            bookings.push(bookingData)
        }
        // if(items && items.length) {
        //     await Promise.all(items.map(async (item) => {
        //         const booking = {
        //             ...item,
        //             customer_name: await this.utilService.getName(item.customer_id)
        //         }
        //         bookings.push(booking)
        //     }))
        // }
        // return {bookings, count}
        /*const bookingsData = await this.bookingRepo.createQueryBuilder("b")
                            .leftJoinAndSelect("users", "u", "u.id=b.customer_id")
                            .select(['b.*, u.name as customer_name'])
                            // .getSql()
                            .orderBy('id', 'DESC')
                            .take(reqBody.limit ? reqBody.limit : 10)
                            .skip(reqBody.offset ? reqBody.offset : 0)
                            .getRawMany() */
        /*if(items && items.length) {
            for(let item of items) {
                const bStatus = await this.getBSByBookingId(item.id);
                let driver_name = ''
                if(bStatus && bStatus.tour_id) {
                    let tourData = await this.tourRepo.findOneBy({id: bStatus.tour_id})
                    const driverData = await this.driverRepo.findOneBy({user_id: tourData.driver_id})
                    driver_name = driverData.name
                }
                let customer_name = await this.utilService.getName(item.customer_id)
                const booking = {
                    ...item,
                    customer_name: customer_name,
                    booking_status: bStatus ? bStatus.status : '',
                    driver_name: driver_name
                }
                if(!item.customer_name) {
                    await this.bookingRepo.update({id: item.id}, {customer_name: customer_name})
                }
                if(!item.driver_name && driver_name) {
                    await this.bookingRepo.update({id: item.id}, {driver_name: driver_name})
                }
                if(bStatus && bStatus.status) {
                    await this.bookingRepo.update({id: item.id}, {booking_status: bStatus.status})
                }
                
                // //console.log(reqBody.booking_status, bStatus)
                if(reqBody.booking_status && bStatus.status == reqBody.booking_status) {
                    bookings.push(booking)
                } else if(!reqBody.booking_status) {
                    bookings.push(booking)
                }
                
            }
        }*/
        
        return {items: bookings, count}
    }

    async getInvoiceBookingsByCompanyId(reqBody: any): Promise<any> {
        let bookings: any = []
        let whereCon: any = {}
        let orderBy = {}
        let notes = "";
        let limit = reqBody.limit ? reqBody.limit : 10;
        if(Array.isArray(reqBody.company_id)) {
            //console.log("array")
        } else {
            //console.log("not array")
        }
        //console.log((Array.isArray(reqBody.company_id), reqBody.company_id.length))
        if(!reqBody.company_id || (Array.isArray(reqBody.company_id) && !reqBody.company_id.length)) {
            return {items: false, count: "Company Details are mandatory"}
        }
        let companyDetails = await this.companyRepo.find({where: {id: In(reqBody.company_id)}})
        if (!companyDetails) {
            return {items: false, count: "Invalid Company Details"}
        }
        let customerIds = []
        for(let company of companyDetails) {
            let cCustomers = company.users.split(",")
            cCustomers.pop()
            
            for(let cId of cCustomers) {
                cId = cId.trim()
                customerIds.push(parseInt(cId.substring(1, cId.length)))
            }
        }
        whereCon['customer_id'] = In(customerIds);
        whereCon['booking_canceled_by_customer'] = 0
        whereCon['booking_canceled_by_manager'] = 0
        whereCon['is_invoice_generated'] = false
        if(!reqBody.from_date || !reqBody.to_date) {
            return {items: false, count: "From and To dates are mandatory"}
        }
        let from_date = new Date(reqBody.from_date).toISOString().substring(0, 10);
        let to_date = new Date(reqBody.to_date)
        let nextDay = new Date(to_date)
        nextDay.setDate(to_date.getDate()+1)
        const nextDayData = new Date(nextDay).toISOString().substring(0, 10);
        whereCon["reached_pickup"] = Between(from_date, nextDayData)
        orderBy['id'] = 'ASC';
        //console.log(whereCon)
        // const [items, count] = await this.bookingRepo.findAndCount({where: whereCon, order: orderBy})
        const [items, count] = await this.bookingRepo.findAndCount({where: whereCon, order: orderBy, skip: (reqBody.offset ? reqBody.offset : 0), take: limit })
        for(let booking of items) {
            // let bookingUrl = await turl.shorten(this.baseUrl+"/booking/"+booking.id)
            let tourData = await this.tourRouteRepo.findOneBy({booking_id: booking.id})
            let bookingData = {
                ...booking,
                tour_id: tourData ? tourData.tour_id : '',
                // company_name: companyDetails ? companyDetails.company_name : '',
                // booking_url: bookingUrl
            }
            bookings.push(bookingData)
        }
        return {items: bookings, count}
    }

    async sendBulkInvoice(invoiceData: any): Promise<any> {
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
        let data =[]
        // //console.log(data)
        // for await (let row of data.rows) {
          // //console.log(row)
              
        var template = './public/bulkinvoice.html'
        var pdf_path = './public/'+invoiceData["invoiceNo"]+'.pdf'
        // //console.log(template)
        var html = fs.readFileSync(template, 'utf8');
        
        for(let key in schema) {
            html = html.replace('{{'+key+"}}", invoiceData[schema[key].prop])
        }
        // //console.log(html)
        let pdfCreate =  (html, pdfOptions, pdf_path) => new Promise((resolve, reject) => {
            pdf.create(html, pdfOptions).toFile(pdf_path, function(err, res1) {
                if (err) return //console.log(err);
                //console.log("res1"); // { filename: '/app/businesscard.pdf' }
                //console.log(res1); // { filename: '/app/businesscard.pdf' }
                // fs.existsSync(res1.filename)
                
                resolve(pdf_path)
                
                
                });
        })
        await pdfCreate(html, pdfOptions, pdf_path)
        return pdf_path
        
    }

    async createTripFileForInvoice(invoiceData: any, bookings: any): Promise<any> {
        const tRow = `<tr style="height:15.75pt;">
            <td style="width:60px;border-top:0.75pt solid #cccccc; border-right-style:solid; border-right-width:0.75pt; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;">{{date}}</span></p>
            </td>
            <td style="width:55px;border-top:0.75pt solid #cccccc; border-right-style:solid; border-right-width:0.75pt; border-left:0.75pt solid #cccccc; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial; word-wrap: break-word;">{{booking}}</span></p>
            </td>
            <td style="border-top:0.75pt solid #cccccc; border-right-style:solid; border-right-width:0.75pt; border-left:0.75pt solid #cccccc; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;">{{from}}</span></p>
            </td>
            <td style="border-top:0.75pt solid #cccccc; border-right-style:solid; border-right-width:0.75pt; border-left:0.75pt solid #cccccc; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;">{{to}}</span></p>
            </td>
            <td style="width:50px;border-top:0.75pt solid #cccccc; border-left:0.75pt solid #cccccc; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;">{{loading}}</span></p>
            </td>
            <td style="width:20px;border-top:0.75pt solid #cccccc; border-left:0.75pt solid #cccccc; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;">{{toll}}</span></p>
            </td>
            <td style="width:50px;border-top:0.75pt solid #cccccc; border-right-style:solid; border-right-width:0.75pt; border-left:0.75pt solid #cccccc; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;">{{total}}</span></p>
            </td>
        </tr>`
        let booking_rows = ''
        for(let booking of bookings) {
            let bookingRow = tRow
            bookingRow = bookingRow.replace("{{date}}", booking.reached_pickup.substring(0, 10))
            bookingRow = bookingRow.replace("{{from}}", booking.pickup_location)
            bookingRow = bookingRow.replace("{{to}}", booking.dropoff_location)
            // bookingRow = bookingRow.replace("{{fare}}", booking.fare)
            // bookingRow = bookingRow.replace("{{waiting_charge}}", booking.waiting_charge)
            bookingRow = bookingRow.replace("{{booking}}", booking.id)
            bookingRow = bookingRow.replace("{{driver}}", booking.driver_name)
            bookingRow = bookingRow.replace("{{vehicle}}", booking.vehicle_number)
            // bookingRow = bookingRow.replace("{{toll}}", invoiceData.tollCharges)
            bookingRow = bookingRow.replace("{{toll}}", booking.toll_charges)
            bookingRow = bookingRow.replace("{{loading}}", booking.loading_charge)
            const total: any = (isNaN(parseInt(booking.fare)) ? 0 : parseInt(booking.fare)) + (isNaN(parseInt(booking.waiting_charge)) ? 0 : parseInt(booking.waiting_charge)) + (isNaN(parseInt(booking.loading_charge)) ? 0 : parseInt(booking.loading_charge)) + (isNaN(parseInt(booking.toll_charges)) ? 0 : parseInt(booking.toll_charges))
            // bookingRow = bookingRow.replace("{{total}}", invoiceData.totalCharges)
            bookingRow = bookingRow.replace("{{total}}", total)
            booking_rows = booking_rows + bookingRow
        }
        var template = './public/tripsheet.html'
        var pdf_path = './public/'+invoiceData['invoiceNo']+'_tripsheet.pdf'
        // //console.log(template)
        var html = fs.readFileSync(template, 'utf8');
        
        html = html.replace("{{booking_rows}}", booking_rows)
        // //console.log(html)
        const pdfOptions: any = {
            childProcessOptions: {
              env: {
                OPENSSL_CONF: '/dev/null',
              },
            },
            "orientation": "landscape",
            "border": {
                "top" : '25px',
                "bottom": '25px'
            }
          }
          let pdfCreate =  (html, pdfOptions, pdf_path) => new Promise((resolve, reject) => {
            pdf.create(html, pdfOptions).toFile(pdf_path, function(err, res1) {
                if (err) return //console.log(err);
                //console.log("res1"); // { filename: '/app/businesscard.pdf' }
                //console.log(res1); // { filename: '/app/businesscard.pdf' }
                // fs.existsSync(res1.filename)
                
                resolve(pdf_path)
                
                
                });
        })
        await pdfCreate(html, pdfOptions, pdf_path)
        return pdf_path
    }

    async createWaitingTripFileForInvoice(invoiceData: any, bookings: any): Promise<any> {
        const tRow = `<tr style="height:15.75pt;">
            <td style="border-top:0.75pt solid #cccccc; border-right-style:solid; border-right-width:0.75pt; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; text-align:right; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;">{{date}}</span></p>
            </td>
            <td style="border-top:0.75pt solid #cccccc; border-right-style:solid; border-right-width:0.75pt; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; text-align:right; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;">{{booking}}</span></p>
            </td>
            <td style="border-top:0.75pt solid #cccccc; border-right-style:solid; border-right-width:0.75pt; border-left:0.75pt solid #cccccc; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;">{{from}}</span></p>
            </td>
            <td style="border-top:0.75pt solid #cccccc; border-right-style:solid; border-right-width:0.75pt; border-left:0.75pt solid #cccccc; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;">{{to}}</span></p>
            </td>
            <td style="border-top:0.75pt solid #cccccc; border-right-style:solid; border-right-width:0.75pt; border-left:0.75pt solid #cccccc; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; text-align:right; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;">{{waiting_time}}</span></p>
            </td>
            <td style="border-top:0.75pt solid #cccccc; border-right-style:solid; border-right-width:0.75pt; border-left:0.75pt solid #cccccc; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; text-align:right; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;">{{waiting_charge}}</span></p>
            </td>
        </tr>`
        let booking_rows = ''
        for(let booking of bookings) {
            let bookingRow = tRow
            bookingRow = bookingRow.replace("{{date}}", booking.reached_pickup.substring(0, 10))
            bookingRow = bookingRow.replace("{{from}}", booking.pickup_location)
            bookingRow = bookingRow.replace("{{to}}", booking.dropoff_location)
            bookingRow = bookingRow.replace("{{fare}}", booking.fare)
            // bookingRow = bookingRow.replace("{{waiting_charge}}", invoiceData.waitingCharges)
            bookingRow = bookingRow.replace("{{waiting_charge}}", booking.waiting_charge)
            bookingRow = bookingRow.replace("{{waiting_time}}", booking.waiting_time)
            bookingRow = bookingRow.replace("{{booking}}", booking.id)
            // bookingRow = bookingRow.replace("{{driver}}", booking.driver_name)
            // bookingRow = bookingRow.replace("{{vehicle}}", booking.vehicle_number)
            // bookingRow = bookingRow.replace("{{toll}}", booking.toll_charges)
            // const total: any = (isNaN(parseInt(booking.fare)) ? 0 : parseInt(booking.fare)) + (isNaN(parseInt(booking.waiting_charge)) ? 0 : parseInt(booking.waiting_charge))
            // bookingRow = bookingRow.replace("{{total}}", total)
            booking_rows = booking_rows + bookingRow
        }
        var template = './public/tripsheet_waiting.html'
        var pdf_path = './public/'+invoiceData['invoiceNo']+'_waiting_tripsheet.pdf'
        // //console.log(template)
        var html = fs.readFileSync(template, 'utf8');
        
        html = html.replace("{{booking_rows}}", booking_rows)
        // //console.log(html)
        const pdfOptions: any = {
            childProcessOptions: {
              env: {
                OPENSSL_CONF: '/dev/null',
              },
            },
            "orientation": "landscape",
            "border": {
                "top" : '25px',
                "bottom": '25px'
            }
          }
          let pdfCreate =  (html, pdfOptions, pdf_path) => new Promise((resolve, reject) => {
            pdf.create(html, pdfOptions).toFile(pdf_path, function(err, res1) {
                if (err) return //console.log(err);
                //console.log("res1"); // { filename: '/app/businesscard.pdf' }
                //console.log(res1); // { filename: '/app/businesscard.pdf' }
                // fs.existsSync(res1.filename)
                
                resolve(pdf_path)
                
                
                });
        })
        await pdfCreate(html, pdfOptions, pdf_path)
        return pdf_path
    }

    async generateInvoiceByCompanyId(reqBody: any): Promise<any> {
        // const cgstPercentage = 6;
        // const sgstPercentage = 6;
        let bookings: any = []
        let whereCon: any = {}
        let orderBy = {}
        let notes = "";
        if(!reqBody.company_id || (Array.isArray(reqBody.company_id) && !reqBody.company_id.length)) {
            return {items: false, count: "Company Details are mandatory"}
        }
        for(let companyId of reqBody.company_id) {
            let companyDetails = await this.companyRepo.findOne({where: {id: companyId}})
            if (!companyDetails) {
                return {items: false, count: "Invalid Company Details"}
            }
            let cCustomers = companyDetails.users.split(",")
            cCustomers.pop()
            let customerIds = []
            for(let cId of cCustomers) {
                cId = cId.trim()
                customerIds.push(parseInt(cId.substring(1, cId.length)))
            }
            whereCon['customer_id'] = In(customerIds);
            whereCon['booking_canceled_by_customer'] = 0
            whereCon['booking_canceled_by_manager'] = 0
            whereCon['is_invoice_generated'] = false
            if(!reqBody.from_date || !reqBody.to_date) {
                return {items: false, count: "From and To dates are mandatory"}
            }
            // if(!reqBody.invoice_number) {
            //     return {items: false, count: "Invoice number missing"}
            // }
            let from_date = new Date(reqBody.from_date).toISOString().substring(0, 10);
            let to_date = new Date(reqBody.to_date)
            let nextDay = new Date(to_date)
            nextDay.setDate(to_date.getDate()+1)
            const nextDayData = new Date(nextDay).toISOString().substring(0, 10);
            whereCon["reached_pickup"] = Between(from_date, nextDayData)
            orderBy['id'] = 'ASC';
            //console.log(whereCon)
            const bookings = await this.bookingRepo.find({where: whereCon, order: orderBy})
            if(bookings.length) {
                let frightCharges = 0
                let weightCharges = 0
                let loadingCharges = 0
                let tollCharges = 0
                let bookingIds = []
                
                let invoice_date = moment(new Date()).format('YYYY-MM-DD')
                let invoiceNumberDetails = await this.invoiceNumberRepo.findOne({where:{invoice_date: invoice_date}})
                let inv_num = ''
                let uInvNum: any = 1;
                if(invoiceNumberDetails) {
                    uInvNum = invoiceNumberDetails.invoice_number + 1
                    await this.invoiceNumberRepo.update({invoice_date: invoice_date}, {invoice_number: uInvNum})
                } else {
                    await this.invoiceNumberRepo.save({invoice_date: invoice_date, invoice_number: uInvNum})
                }
                var pad = "0000"
                let str = ""+uInvNum
                inv_num = pad.substring(0, pad.length - str.length) + str
                let invoiceId = invoice_date + "-" +inv_num
                for(let booking of bookings) {
                    frightCharges = frightCharges + (isNaN(parseInt(booking.fare)) ? 0 : parseInt(booking.fare))
                    weightCharges = weightCharges + (isNaN(parseInt(booking.waiting_charge)) ? 0 : parseInt(booking.waiting_charge))
                    loadingCharges = loadingCharges + (booking.loading_charge ? booking.loading_charge : 0)
                    tollCharges = tollCharges + booking.toll_charges
                    bookingIds.push(booking.id)
                    await this.bookingRepo.update({id: booking.id}, {is_invoice_generated: true, invoice_number: invoiceId})
                }
                let discount = 0
                if(companyDetails.discount_on_waiting_charges) {
                    discount += (weightCharges * (companyDetails.discount_on_waiting_charges/100));
                }
                if(companyDetails.discount_on_freight_charges) {
                    discount += (frightCharges * (companyDetails.discount_on_freight_charges/100));
                }
                const invoiceDate = moment(new Date()).format('YYYY-MM-DD')
                let invoiceAmount = frightCharges + weightCharges + loadingCharges + tollCharges
                frightCharges = frightCharges + loadingCharges + tollCharges
                notes = notes + "invoice amount -" + invoiceAmount
                
                invoiceAmount = invoiceAmount - discount
                notes = notes + ", invoice discount -" + discount
                let sgst: any = 'NIL'
                let cgst: any = 'NIL'
                let tax: any = 'NIL'
                invoiceAmount = parseFloat(invoiceAmount.toFixed(2))
                let tatt = invoiceAmount
                if(companyDetails.gst) {
                    sgst = Number(invoiceAmount * (sgstPercentage/100)).toFixed(2)
                    cgst = Number(invoiceAmount * (cgstPercentage/100)).toFixed(2)
                    // invoiceAmount = invoiceAmount + sgst + cgst
                    tax = parseFloat(sgst) + parseFloat(cgst)
                    tatt += tax
                    notes = notes + ", sgst -" + sgst + ", cgst -" + cgst + ", "
                }

                if(companyDetails.is_waiting_charges_include) {
                    frightCharges = frightCharges + weightCharges
                    weightCharges = 0
                }

                let invoiceData = {
                    'invoiceNo': invoiceId,
                    'invoiceDate': invoiceDate,
                    'company': companyDetails.company_name,
                    'bookingDate': moment(from_date).format('MM-DD-YYYY') + " to " + moment(to_date).format('MM-DD-YYYY'),
                    'totalBookings': bookings.length,
                    'freightCharges': frightCharges,
                    'waitingCharges': weightCharges,
                    'loadingCharges': loadingCharges ? loadingCharges : 0,
                    'tollCharges': tollCharges ? tollCharges : 0,
                    'discount': discount,
                    'totalCharges': invoiceAmount,
                    'sgst': sgst,
                    'cgst': cgst,
                    'tax': tax,
                    'companyAddress': companyDetails.address,
                    'customerName': companyDetails.name,
                    'mobile': companyDetails.mobile,
                    'email': companyDetails.email,
                    // 'email': 'nageswararaonali@gmail.com, subycharles1@gmail.com',
                    'gstNo': companyDetails.gst,
                    'tatt': tatt,
                    'tpa': tatt
                }
                let invoiceLocalUrl = await this.sendBulkInvoice(invoiceData)
                let invoiceTripSheetLocalUrl = await this.createTripFileForInvoice(invoiceData, bookings)
                let invoiceWaitingTripSheetLocalUrl = await this.createWaitingTripFileForInvoice(invoiceData, bookings)
                let invoiceUrl = ""
                let tripSheetinvoiceUrl = ""
                let waitingtripSheetinvoiceUrl = ""
                // setTimeout(async () => {
                    const params = {
                        Key: invoiceId+'.pdf',
                        Body: fs.createReadStream(invoiceLocalUrl),
                        Bucket: this.configService.get('REPORTS_BUCKET_NAME'),
                    };
                    const fileRes: any = await this.utilService.uploadS3(params)
                    invoiceUrl = fileRes.Location
                    // fs.unlinkSync(invoiceLocalUrl);

                    const trip_params = {
                        Key: invoiceId+'_tripsheet.pdf',
                        Body: fs.createReadStream(invoiceTripSheetLocalUrl),
                        Bucket: this.configService.get('REPORTS_BUCKET_NAME'),
                    };
                    const trip_fileRes: any = await this.utilService.uploadS3(trip_params)
                    tripSheetinvoiceUrl = trip_fileRes.Location
                    // fs.unlinkSync(invoiceTripSheetLocalUrl);

                    const waiting_trip_params = {
                        Key: invoiceId+'_tripsheet_waiting.pdf',
                        Body: fs.createReadStream(invoiceTripSheetLocalUrl),
                        Bucket: this.configService.get('REPORTS_BUCKET_NAME'),
                    };
                    const waiting_trip_fileRes: any = await this.utilService.uploadS3(waiting_trip_params)
                    waitingtripSheetinvoiceUrl = waiting_trip_fileRes.Location
                    // fs.unlinkSync(invoiceWaitingTripSheetLocalUrl);
                    
                    var mailOptions = {
                        from: 'noreplygo.20221@gmail.com',
                        to: invoiceData["email"] + ', admin@gogoodmove.com',
                        // to: 'nageswararaonali@gmail.com, subycharles1@gmail.com',
                        // to: 'nageswararaonali@gmail.com',
                        // to: 'admin@goodmove.in',
                        subject: 'GoodMove (Invoice No:'+invoiceData["invoiceNo"]+'): Thank you for shipping with us!',
                        text: `Greetings from GoodMove!!!
            
Please find attached the invoice.
            
We deliver your goods safely while you focus on your core business!`,
                        attachments: [
                            {   // file on disk as an attachment
                                filename: invoiceData["invoiceNo"]+'.pdf',
                                path: invoiceLocalUrl // stream this file
                            },
                            {   // file on disk as an attachment
                                filename: invoiceData["invoiceNo"]+'_tripsheet.pdf',
                                path: invoiceTripSheetLocalUrl // stream this file
                            },
                            {   // file on disk as an attachment
                                filename: invoiceData["invoiceNo"]+'_waiting_tripsheet.pdf',
                                path: invoiceWaitingTripSheetLocalUrl // stream this file
                            }
                        ]
                    }
                    
                    let sendMailFun =  (mailOptions) => new Promise((resolve, reject) => {
                        mail.sendMail(mailOptions, function(error, info){
                            if (error) {
                            //console.log(error);
                            } else {
                            //console.log('Email sent: ' + info.response);
                            
                            }
                            fs.unlinkSync(invoiceLocalUrl);
                            fs.unlinkSync(invoiceTripSheetLocalUrl);
                            fs.unlinkSync(invoiceWaitingTripSheetLocalUrl);
                            resolve(info)
                        });
                    })
                    await sendMailFun(mailOptions)
                    //console.log(trip_fileRes)
                    const invoiceDetails: any = {
                        'invoice_number': invoiceId,
                        'invoice_date': invoiceDate,
                        'invoice_file': invoiceUrl,
                        'invoice_amount': Math.ceil(invoiceAmount),
                        'paid_amount': 0,
                        'comments': '',
                        'part_amount': 0,
                        'trip_file': tripSheetinvoiceUrl,
                        'waiting_trip_file': waitingtripSheetinvoiceUrl,
                        'company_name': companyDetails.name,
                        'payment_status': 'Pending',
                        'bookings': bookingIds.join(','),
                        'notes': notes + "___" + JSON.stringify(invoiceData)
                    }
                    //console.log(invoiceDetails)
                    await this.invoiceDetailsRepo.save(invoiceDetails)
                    
                // }, 10000)
                // return {items: bookings, count:1}
            } else {
                // return {}
            }
        }
        // let timeOut = reqBody.company_id.length * 10000 > 30000 ? 30000 : 
        setTimeout(async () => {
            return {items: [], count: ""}
        }, 30000)
        
        
        
    }

    async getInvoices(reqBody: any): Promise<any> {
        let whereCon: any = {}
        let orderBy = {}
        let limit = reqBody.limit ? reqBody.limit : 10
        if(reqBody.booking_id) {
            whereCon['bookings'] = Like(`%${reqBody.booking_id}%`)
        }
        orderBy['id'] = 'DESC';
        const [items, count] = await this.invoiceDetailsRepo.findAndCount({where: whereCon, order: orderBy, skip: (reqBody.offset ? reqBody.offset : 0), take: limit })
        
        return {items, count}
    }

    async updateInvoiceData(reqBody: any): Promise<any> {
        const bookingData = await this.invoiceDetailsRepo.update({id: reqBody.id}, reqBody)
        const bookingDetails = await this.bookingRepo.findOneBy({id: reqBody.id})
        return bookingData
    }
    
    async regenerateInvoiceById(reqBody: any): Promise<any> {
        let notes = '';
        // const cgstPercentage = 6;
        // const sgstPercentage = 6;
        const invoiceId = reqBody.invoiceNumber;
        const oldInvoiceDetails = await this.invoiceDetailsRepo.findOne({where: {invoice_number: invoiceId}})
        if(oldInvoiceDetails && !oldInvoiceDetails.invoiceType) {
            const bookingIds = oldInvoiceDetails.bookings.split(",");
            const bookings = await this.bookingRepo.find({where: {id: In(bookingIds)}, order: {id: 'ASC'}});
            const companyDetails = await this.utilService.companyUsers(bookings[0].customer_id)
            if(!companyDetails) {
                return false;
            }
            if(bookings.length) {
                let frightCharges = 0
                let weightCharges = 0
                let loadingCharges = 0
                let tollCharges = 0
                let bookingIds = []
                
                for(let booking of bookings) {
                    frightCharges = frightCharges + (isNaN(parseInt(booking.fare)) ? 0 : parseInt(booking.fare))
                    weightCharges = weightCharges + (isNaN(parseInt(booking.waiting_charge)) ? 0 : parseInt(booking.waiting_charge))
                    loadingCharges = loadingCharges + booking.loading_charge
                    tollCharges = tollCharges + booking.toll_charges
                    bookingIds.push(booking.id)
                    await this.bookingRepo.update({id: booking.id}, {is_invoice_generated: true, invoice_number: invoiceId})
                }
                let discount = 0
                if(companyDetails.discount_on_waiting_charges) {
                    discount += (weightCharges * (companyDetails.discount_on_waiting_charges/100));
                }
                if(companyDetails.discount_on_freight_charges) {
                    discount += (frightCharges * (companyDetails.discount_on_freight_charges/100));
                }
                // const invoiceDate = moment(new Date()).format('YYYY-MM-DD')
                let invoiceAmount = frightCharges + weightCharges + loadingCharges + tollCharges
                frightCharges = frightCharges + loadingCharges + tollCharges
                notes = notes + "invoice amount -" + invoiceAmount
                invoiceAmount = invoiceAmount - discount
                notes = notes + ", invoice discount -" + discount
                let sgst: any = 'NIL'
                let cgst: any = 'NIL'
                let tax: any = 'NIL'
                invoiceAmount = parseFloat(invoiceAmount.toFixed(2))
                let tatt = invoiceAmount
                if(companyDetails.gst) {
                    sgst = Number(invoiceAmount * (sgstPercentage/100)).toFixed(2)
                    cgst = Number(invoiceAmount * (cgstPercentage/100)).toFixed(2)
                    // invoiceAmount = invoiceAmount + sgst + cgst
                    tax = parseFloat(sgst) + parseFloat(cgst)
                    tatt += tax
                    notes = notes + ", sgst -" + sgst + ", cgst -" + cgst + ", "
                }
                if(companyDetails.is_waiting_charges_include) {
                    frightCharges = frightCharges + weightCharges
                    weightCharges = 0
                }
                let oldInvoiceData = JSON.parse(oldInvoiceDetails.notes.split("___")[1])
                //console.log(oldInvoiceData)
                // let oldInvoiceData = JSON.parse(oldInvoiceDetails.notes)
                let invoiceData = {
                    'invoiceNo': invoiceId,
                    'invoiceDate': oldInvoiceDetails.invoice_date,
                    'company': companyDetails.company_name,
                    'bookingDate':oldInvoiceData.bookingDate,
                    'totalBookings': bookings.length,
                    'freightCharges': frightCharges,
                    'waitingCharges': weightCharges,
                    'loadingCharges': loadingCharges ? loadingCharges : 0,
                    'tollCharges': tollCharges ? tollCharges : 0,
                    'discount': discount,
                    'totalCharges': invoiceAmount,
                    'sgst': sgst,
                    'cgst': cgst,
                    'tax': tax,
                    'companyAddress': companyDetails.address,
                    'customerName': companyDetails.name,
                    'mobile': companyDetails.mobile,
                    'email': companyDetails.email,
                    'gstNo': companyDetails.gst,
                    'tatt': tatt,
                    'tpa': tatt
                }
                //console.log("invoiceData")
                //console.log(invoiceData)
                let invoiceLocalUrl = await this.sendBulkInvoice(invoiceData)
                let invoiceTripSheetLocalUrl = await this.createTripFileForInvoice(invoiceData, bookings)
                let invoiceWaitingTripSheetLocalUrl = await this.createWaitingTripFileForInvoice(invoiceData, bookings)
                let invoiceUrl = ""
                let tripSheetinvoiceUrl = ""
                let waitingtripSheetinvoiceUrl = ""
                // setTimeout(async () => {
                    const params = {
                        Key: invoiceId+'.pdf',
                        Body: fs.createReadStream(invoiceLocalUrl),
                        Bucket: this.configService.get('REPORTS_BUCKET_NAME'),
                    };
                    const fileRes: any = await this.utilService.uploadS3(params)
                    invoiceUrl = fileRes.Location
                    
                    const trip_params = {
                        Key: invoiceId+'_tripsheet.pdf',
                        Body: fs.createReadStream(invoiceTripSheetLocalUrl),
                        Bucket: this.configService.get('REPORTS_BUCKET_NAME'),
                    };
                    const trip_fileRes: any = await this.utilService.uploadS3(trip_params)
                    tripSheetinvoiceUrl = trip_fileRes.Location

                    const waiting_trip_params = {
                        Key: invoiceId+'_tripsheet_waiting.pdf',
                        Body: fs.createReadStream(invoiceWaitingTripSheetLocalUrl),
                        Bucket: this.configService.get('REPORTS_BUCKET_NAME'),
                    };
                    const waiting_trip_fileRes: any = await this.utilService.uploadS3(waiting_trip_params)
                    waitingtripSheetinvoiceUrl = trip_fileRes.Location

                    var mailOptions = {
                        from: 'noreplygo.20221@gmail.com',
                        to: invoiceData["email"] + ', admin@gogoodmove.com',
                        // to: 'nageswararaonali@gmail.com, subycharles1@gmail.com',
                        // to: 'admin@goodmove.in',
                        subject: 'GoodMove (Invoice No:'+invoiceData["invoiceNo"]+'): Thank you for shipping with us!',
                        text: `Greetings from GoodMove!!!
            
Please find attached the invoice.
            
We deliver your goods safely while you focus on your core business!`,
                        attachments: [
                            {   // file on disk as an attachment
                                filename: invoiceData["invoiceNo"]+'.pdf',
                                path: invoiceLocalUrl // stream this file
                            },
                            {   // file on disk as an attachment
                                filename: invoiceData["invoiceNo"]+'_tripsheet.pdf',
                                path: invoiceTripSheetLocalUrl // stream this file
                            },
                            {   // file on disk as an attachment
                                filename: invoiceData["invoiceNo"]+'_waiting_tripsheet.pdf',
                                path: invoiceWaitingTripSheetLocalUrl // stream this file
                            }
                        ]
                    }
                    let sendMailFun =  (mailOptions) => new Promise((resolve, reject) => {
                        mail.sendMail(mailOptions, function(error, info){
                            if (error) {
                            //console.log(error);
                            } else {
                            //console.log('Email sent: ' + info.response);
                            
                            }
                            fs.unlinkSync(invoiceLocalUrl);
                            fs.unlinkSync(invoiceTripSheetLocalUrl);
                            fs.unlinkSync(invoiceWaitingTripSheetLocalUrl);
                            resolve(info)
                        });
                    })
                    await sendMailFun(mailOptions)

                    const invoiceDetails: any = {
                        'invoice_number': invoiceId,
                        'invoice_date': oldInvoiceDetails.invoice_date,
                        'invoice_amount': Math.ceil(invoiceAmount),
                        'notes': notes + "___" + JSON.stringify(invoiceData)
                    }
                    //console.log(invoiceDetails)
                    await this.invoiceDetailsRepo.update({invoice_number: invoiceId}, invoiceDetails)
                    
                // }, 10000)
                // return {items: bookings, count}
            } else {
                // return {}
            }
            return true
        } else {
            if(oldInvoiceDetails.invoiceType) {
                await this.invoiceByTour(oldInvoiceDetails)
                return true
            }
            return false
        }
    }

    async createTourTripFileForInvoice(invoiceData: any, bookings: any, tourSeq: any): Promise<any> {
        const tRow = `<tr style="height:15.75pt;">
            <td style="width:60px;border-top:0.75pt solid #cccccc; border-right-style:solid; border-right-width:0.75pt; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;">{{date}}</span></p>
            </td>
            <td style="width:55px;border-top:0.75pt solid #cccccc; border-right-style:solid; border-right-width:0.75pt; border-left:0.75pt solid #cccccc; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;word-wrap: break-word;">{{booking}}</span></p>
            </td>
            <td style="width:145px;border-top:0.75pt solid #cccccc; border-right-style:solid; border-right-width:0.75pt; border-left:0.75pt solid #cccccc; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;">{{tour}}</span></p>
            </td>
            <td style="width:30px;border-top:0.75pt solid #cccccc; border-left:0.75pt solid #cccccc; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;">{{loading}}</span></p>
            </td>
            <td style="width:20px;border-top:0.75pt solid #cccccc; border-left:0.75pt solid #cccccc; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;">{{toll}}</span></p>
            </td>
            <td style="width:25px;border-top:0.75pt solid #cccccc; border-right-style:solid; border-right-width:0.75pt; border-left:0.75pt solid #cccccc; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;">{{total}}</span></p>
            </td>
        </tr>`
        let booking_rows = ''
        let seqOrder = ''
        let ind = 0;
        for(let seq of tourSeq) {
            if(ind > 0 && seq.transport_type == tourSeq[ind-1].transport_type && seq.location_address == tourSeq[ind-1].location_address) {
                
            } else {
                let liTag = seq.transport_type == 'pickup' ? "<li class='pickup-li'>" : "<li class='drop-li'>";
                seqOrder = seqOrder + "<li style='font-size:8pt;'>" + seq.location_address + " </li> "
            }
            ind++;
        }
        let bookingData = {
            date: bookings[0].reached_pickup ? bookings[0].reached_pickup.substring(0, 10) : 'NIL',
            tour: seqOrder,
            driver_name: bookings[0].driver_name,
            vehicle_number: bookings[0].vehicle_number,
            toll_charges: bookings[0].toll_charges
        }
        let bookingIds = ''
        for(let booking of bookings) {
            bookingIds = bookingIds + (bookingIds ? ', ' : '') + booking.id
        } 
        let bookingRow = tRow
        bookingRow = bookingRow.replace("{{date}}", bookingData.date)
        bookingRow = bookingRow.replace("{{tour}}", bookingData.tour)
        bookingRow = bookingRow.replace("{{total}}", invoiceData.totalCharges.toString())
        bookingRow = bookingRow.replace("{{driver}}", bookingData.driver_name)
        bookingRow = bookingRow.replace("{{vehicle}}", bookingData.vehicle_number)
        bookingRow = bookingRow.replace("{{booking}}", bookingIds)
        bookingRow = bookingRow.replace("{{toll}}", bookingData.toll_charges.toString())
        bookingRow = bookingRow.replace("{{loading}}", invoiceData.loadingCharges.toString())
        booking_rows = booking_rows + bookingRow
        var template = './public/tour_tripsheet.html'
        var pdf_path = './public/'+invoiceData['invoiceNo']+'_tour_tripsheet.pdf'
        // //console.log(template)
        var html = fs.readFileSync(template, 'utf8');
        
        html = html.replace("{{booking_rows}}", booking_rows)
        // //console.log(html)
        const pdfOptions: any = {
            childProcessOptions: {
              env: {
                OPENSSL_CONF: '/dev/null',
              },
            },
            "orientation": "landscape",
            "border": {
                "top" : '25px',
                "bottom": '25px'
            }
          }
          let pdfCreate =  (html, pdfOptions, pdf_path) => new Promise((resolve, reject) => {
            pdf.create(html, pdfOptions).toFile(pdf_path, function(err, res1) {
                if (err) return //console.log(err);
                //console.log("res1"); // { filename: '/app/businesscard.pdf' }
                //console.log(res1); // { filename: '/app/businesscard.pdf' }
                // fs.existsSync(res1.filename)
                
                resolve(pdf_path)
                
                
                });
        })
        await pdfCreate(html, pdfOptions, pdf_path)
        return pdf_path
    }

    async createWaitingTourTripFileForInvoice(invoiceData: any, bookings: any, tourSeq: any): Promise<any> {
        const tRow = `<tr style="height:15.75pt;">
            <td style="width:55px;border-top:0.75pt solid #cccccc; border-right-style:solid; border-right-width:0.75pt; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; text-align:right; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;">{{date}}</span></p>
            </td>
            <td style="width:55px;border-top:0.75pt solid #cccccc; border-right-style:solid; border-right-width:0.75pt; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; text-align:right; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;">{{booking}}</span></p>
            </td>
            <td style="width:145px;border-top:0.75pt solid #cccccc; border-right-style:solid; border-right-width:0.75pt; border-left:0.75pt solid #cccccc; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;">{{tour}}</span></p>
            </td>
            <td style="width:55px;border-top:0.75pt solid #cccccc; border-left:0.75pt solid #cccccc; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; text-align:right; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;word-wrap: break-word;">{{waiting_time}}</span></p>
            </td>
            <td style="width:55px;border-top:0.75pt solid #cccccc; border-right-style:solid; border-right-width:0.75pt; border-left:0.75pt solid #cccccc; padding:1.5pt 1.88pt; vertical-align:bottom;">
                <p style="margin-top:0pt; margin-bottom:0pt; text-align:right; widows:2; orphans:2; font-size:8pt;"><span style="font-family:Arial;">{{waiting_charge}}</span></p>
            </td>
        </tr>`
        let booking_rows = ''
        let seqOrder = ''
        
        let ind = 0;
        for(let seq of tourSeq) {
            if(ind > 0 && seq.transport_type == tourSeq[ind-1].transport_type && seq.location_address == tourSeq[ind-1].location_address) {
                
            } else {
                let liTag = seq.transport_type == 'pickup' ? "<li class='pickup-li'>" : "<li class='drop-li'>";
                seqOrder = seqOrder + "<li style='font-size:8pt;'>" + seq.location_address + " </li> "
            }
            ind++;
        }
        let bookingData = {
            date: bookings[0].reached_pickup.substring(0, 10),
            tour: seqOrder,
            driver_name: bookings[0].driver_name,
            vehicle_number: bookings[0].vehicle_number
        }
        let waiting_time = 0;
        let bookingIds = ''
        for(let booking of bookings) {
            let wt = isNaN(booking.waiting_time) ? 0 : booking.waiting_time
            waiting_time = waiting_time + wt
            bookingIds = bookingIds + (bookingIds ? ', ' : '') + booking.id
        }
        let bookingRow = tRow
        bookingRow = bookingRow.replace("{{date}}", bookingData.date)
        bookingRow = bookingRow.replace("{{tour}}", bookingData.tour)
        bookingRow = bookingRow.replace("{{waiting_charge}}", invoiceData.waitingCharges.toString())
        bookingRow = bookingRow.replace("{{booking}}", bookingIds)
        bookingRow = bookingRow.replace("{{vehicle}}", bookingData.vehicle_number)
        bookingRow = bookingRow.replace("{{waiting_time}}", waiting_time.toString())
        booking_rows = booking_rows + bookingRow
        var template = './public/tour_tripsheet_waiting.html'
        var pdf_path = './public/'+invoiceData['invoiceNo']+'_tour_waiting_tripsheet.pdf'
        // //console.log(template)
        var html = fs.readFileSync(template, 'utf8');
        
        html = html.replace("{{booking_rows}}", booking_rows)
        // //console.log(html)
        const pdfOptions: any = {
            childProcessOptions: {
              env: {
                OPENSSL_CONF: '/dev/null',
              },
            },
            "orientation": "landscape",
            "border": {
                "top" : '25px',
                "bottom": '25px'
            }
          }
          let pdfCreate =  (html, pdfOptions, pdf_path) => new Promise((resolve, reject) => {
            pdf.create(html, pdfOptions).toFile(pdf_path, function(err, res1) {
                if (err) return //console.log(err);
                //console.log("res1"); // { filename: '/app/businesscard.pdf' }
                //console.log(res1); // { filename: '/app/businesscard.pdf' }
                // fs.existsSync(res1.filename)
                
                resolve(pdf_path)
                
                
                });
        })
        await pdfCreate(html, pdfOptions, pdf_path)
        return pdf_path
    }
    async invoiceByTour(invoiceDetails: any): Promise<any> {
        // const cgstPercentage = 6;
        // const sgstPercentage = 6
        let orderBy = {}
        let notes = ""
        const invoiceId = invoiceDetails.invoice_number;
        let tourId = invoiceDetails.invoiceType.split("Tour-")[1];
        const tourBookingData = await this.tourBookingDetails.find({where:{tour_id: tourId}})
        let bookingsData = []
        for(let bt of tourBookingData) {
            bookingsData.push(bt.booking_id)
        }
        orderBy['id'] = 'ASC';
        const bookings = await this.bookingRepo.find({where: {id : In(bookingsData)}, order: orderBy})
        const companyDetails = await this.utilService.companyUsers(bookings[0].customer_id)
        if(!companyDetails) {
            return false;
        }
        //console.log(bookings.length, " ====")
        if(bookings.length) {
            let frightCharges = 0
            let weightCharges = 0
            let loadingCharges = 0
            let tollCharges = 0
            let bookingIds = []
            
            for(let booking of bookings) {
                frightCharges = frightCharges + (isNaN(parseInt(booking.fare)) ? 0 : parseInt(booking.fare))
                weightCharges = weightCharges + (isNaN(parseInt(booking.waiting_charge)) ? 0 : parseInt(booking.waiting_charge))
                loadingCharges = loadingCharges + booking.loading_charge
                tollCharges = tollCharges + booking.toll_charges
                bookingIds.push(booking.id)
                await this.bookingRepo.update({id: booking.id}, {is_invoice_generated: true, invoice_number: invoiceId})
            }
            let discount = 0
            if(companyDetails.discount_on_waiting_charges) {
                discount += (weightCharges * (companyDetails.discount_on_waiting_charges/100));
            }
            if(companyDetails.discount_on_freight_charges) {
                discount += (frightCharges * (companyDetails.discount_on_freight_charges/100));
            }
            const invoiceDate = moment(new Date()).format('YYYY-MM-DD')
            //console.log(invoiceDate, " invoice date")
            let invoiceAmount = frightCharges + weightCharges + loadingCharges + tollCharges
            frightCharges = frightCharges + loadingCharges + tollCharges
            notes = notes + "invoice amount -" + invoiceAmount
            invoiceAmount = invoiceAmount - discount
            notes = notes + ", invoice discount -" + discount
            let sgst: any = 'NIL'
            let cgst: any = 'NIL'
            let tax: any = 'NIL'
            invoiceAmount = parseFloat(invoiceAmount.toFixed(2))
            let tatt = invoiceAmount
            if(companyDetails.gst) {
                sgst = Number(invoiceAmount * (sgstPercentage/100)).toFixed(2)
                cgst = Number(invoiceAmount * (cgstPercentage/100)).toFixed(2)
                // invoiceAmount = invoiceAmount + sgst + cgst
                tax = parseFloat(sgst) + parseFloat(cgst)
                tatt += tax
                notes = notes + ", sgst -" + sgst + ", cgst -" + cgst + ", "
            }
            if(companyDetails.is_waiting_charges_include) {
                frightCharges = frightCharges + weightCharges
                weightCharges = 0
            }
            let bookingDate = ''
            if(!invoiceDetails.bookingDate) {
                const tourData = await this.tourRepo.findOneBy({id: parseInt(tourId)})
                bookingDate = tourData.tour_date
            } else {
                bookingDate = invoiceDetails.bookingDate
            }
            let invoiceData = {
                'invoiceNo': invoiceId,
                'invoiceDate': invoiceDetails.invoice_date,
                'company': companyDetails.company_name,
                'bookingDate': bookingDate,
                'totalBookings': bookings.length,
                'freightCharges': frightCharges,
                'waitingCharges': weightCharges,
                'loadingCharges': loadingCharges ? loadingCharges : 0,
                'tollCharges': tollCharges ? tollCharges : 0,
                'discount': discount,
                'totalCharges': invoiceAmount,
                'sgst': sgst,
                'cgst': cgst,
                'tax': tax,
                'companyAddress': companyDetails.address,
                'customerName': companyDetails.name,
                'mobile': companyDetails.mobile,
                'email': companyDetails.email,
                'gstNo': companyDetails.gst,
                'tatt': tatt,
                'tpa': tatt
            }
            //console.log(invoiceData)
            //console.log("calling tour invoice")
            const tourSeq = await this.tourRouteRepo.find({where:{tour_id: parseInt(tourId), booking_id: In(bookingIds)}, order: {sequence_number: 'ASC'}})
            let invoiceLocalUrl = await this.sendBulkInvoice(invoiceData)
            let invoiceTripSheetLocalUrl = await this.createTourTripFileForInvoice(invoiceData, bookings, tourSeq)
            let invoiceWaitingTripSheetLocalUrl = await this.createWaitingTourTripFileForInvoice(invoiceData, bookings, tourSeq)
            let invoiceUrl = ""
            let tripSheetinvoiceUrl = ""
            let waitingtripSheetinvoiceUrl = ""
            // setTimeout(async () => {
                const params = {
                    Key: invoiceId+'.pdf',
                    Body: fs.createReadStream(invoiceLocalUrl),
                    Bucket: this.configService.get('REPORTS_BUCKET_NAME'),
                };
                const fileRes: any = await this.utilService.uploadS3(params)
                invoiceUrl = fileRes.Location
                // fs.unlinkSync(invoiceLocalUrl);

                const trip_params = {
                    Key: invoiceId+'_tour_tripsheet.pdf',
                    Body: fs.createReadStream(invoiceTripSheetLocalUrl),
                    Bucket: this.configService.get('REPORTS_BUCKET_NAME'),
                };
                const trip_fileRes: any = await this.utilService.uploadS3(trip_params)
                tripSheetinvoiceUrl = trip_fileRes.Location
                // fs.unlinkSync(invoiceTripSheetLocalUrl);

                const waiting_trip_params = {
                    Key: invoiceId+'_tour_tripsheet_waiting.pdf',
                    Body: fs.createReadStream(invoiceWaitingTripSheetLocalUrl),
                    Bucket: this.configService.get('REPORTS_BUCKET_NAME'),
                };
                const waiting_trip_fileRes: any = await this.utilService.uploadS3(waiting_trip_params)
                waitingtripSheetinvoiceUrl = waiting_trip_fileRes.Location
                // fs.unlinkSync(invoiceWaitingTripSheetLocalUrl);
                
                var mailOptions = {
                    from: 'noreplygo.20221@gmail.com',
                    to: invoiceData["email"] + ', admin@gogoodmove.com',
                    // to: 'nageswararaonali@gmail.com, subycharles1@gmail.com',
                    // to: 'admin@goodmove.in',
                    subject: 'GoodMove (Invoice No:'+invoiceData["invoiceNo"]+'): Thank you for shipping with us!',
                    text: `Greetings from GoodMove!!!
        
Please find attached the invoice.
            
We deliver your goods safely while you focus on your core business!`,
                    attachments: [
                        {   // file on disk as an attachment
                            filename: invoiceData["invoiceNo"]+'.pdf',
                            path: invoiceLocalUrl // stream this file
                        },
                        {   // file on disk as an attachment
                            filename: invoiceData["invoiceNo"]+'_tripsheet.pdf',
                            path: invoiceTripSheetLocalUrl // stream this file
                        },
                        {   // file on disk as an attachment
                            filename: invoiceData["invoiceNo"]+'_waiting_tripsheet.pdf',
                            path: invoiceWaitingTripSheetLocalUrl // stream this file
                        }
                    ]
                }
                let sendMailFun =  (mailOptions) => new Promise((resolve, reject) => {
                    mail.sendMail(mailOptions, function(error, info){
                        if (error) {
                        //console.log(error);
                        } else {
                        //console.log('Email sent: ' + info.response);
                        
                        }
                        fs.unlinkSync(invoiceLocalUrl);
                        fs.unlinkSync(invoiceTripSheetLocalUrl);
                        fs.unlinkSync(invoiceWaitingTripSheetLocalUrl);
                        resolve(info)
                    });
                })
                await sendMailFun(mailOptions)
                //console.log(trip_fileRes)
                const invoiceDetailsData: any = {
                    'invoice_number': invoiceId,
                    'invoice_date': invoiceDate,
                    'invoice_amount': Math.ceil(invoiceAmount),
                    'notes': notes + "___" + JSON.stringify(invoiceData)
                }
                //console.log(invoiceDetailsData)
                await this.invoiceDetailsRepo.update({invoice_number: invoiceId}, invoiceDetailsData)
                
            // }, 20000)
            // return {items: bookings, count}
        } else {
            // return {}
        }
    }
    async generateCompanyInvoiceByTour(reqBody: any): Promise<any> {
        // const cgstPercentage = 6;
        // const sgstPercentage = 6
        let bookings: any = []
        let whereCon: any = {}
        let orderBy = {}
        
        
        if(!reqBody.company_id || (Array.isArray(reqBody.company_id) && !reqBody.company_id.length)) {
            return {items: false, count: "Company Details are mandatory"}
        }
        for(let companyId of reqBody.company_id) {
            let bookingIds = []
            let companyDetails = await this.companyRepo.findOne({where: {id: companyId}})
            //console.log("companyDetails")
            //console.log(companyDetails)
            //console.log("---------------------------------------------------------")
            if (!companyDetails) {
                return {items: false, count: "Invalid Company Details"}
            }
            let cCustomers = companyDetails.users.split(",")
            cCustomers.pop()
            let customerIds = []
            for(let cId of cCustomers) {
                cId = cId.trim()
                customerIds.push(parseInt(cId.substring(1, cId.length)))
            }
            whereCon['customer_id'] = In(customerIds);
            whereCon['booking_canceled_by_customer'] = 0
            whereCon['booking_canceled_by_manager'] = 0
            whereCon['is_invoice_generated'] = false
            whereCon['booking_status'] = 'Tour Completed'
            if(!reqBody.from_date || !reqBody.to_date) {
                return {items: false, count: "From and To dates are mandatory"}
            }
            // if(!reqBody.invoice_number) {
            //     return {items: false, count: "Invoice number missing"}
            // }
            let from_date = new Date(reqBody.from_date).toISOString().substring(0, 10);
            let to_date = new Date(reqBody.to_date)
            let nextDay = new Date(to_date)
            nextDay.setDate(to_date.getDate()+1)
            const nextDayData = new Date(nextDay).toISOString().substring(0, 10);
            whereCon["reached_pickup"] = Between(from_date, nextDayData)
            orderBy['id'] = 'ASC';
            //console.log(whereCon)
            let tourIdsData = {}
            const mainBookings = await this.bookingRepo.find({where: whereCon, order: orderBy})
            if(mainBookings.length) {
                for(let bk of mainBookings) {
                    bookingIds.push(bk.id)
                }
                const tourBookingData = await this.tourBookingDetails.find({where:{booking_id: In(bookingIds)}})
                for(let bt of tourBookingData) {
                    if(!tourIdsData[bt.tour_id]) {
                        tourIdsData[bt.tour_id] = []
                    }
                    tourIdsData[bt.tour_id].push(bt.booking_id)
                }
                //console.log("tourIdsData  ------------")
                //console.log(tourIdsData)
                if(Object.keys(tourIdsData).length) {
                    for(let tourId of Object.keys(tourIdsData)) {
                        let notes = "";
                        //console.log("tour id ==" + tourId)
                        //console.log(tourIdsData[tourId])
                        const bookings = await this.bookingRepo.find({where: {id : In(tourIdsData[tourId])}, order: orderBy})
                        const tourData = await this.tourRepo.findOneBy({id: parseInt(tourId)})
                        let bookingDate = tourData.tour_date
                        //console.log(bookings.length, " ====")
                        if(bookings.length) {
                            let frightCharges = 0
                            let weightCharges = 0
                            let loadingCharges = 0
                            let tollCharges = 0
                            let bookingIds = []
                            
                            let invoice_date = moment(new Date()).format('YYYY-MM-DD')
                            let invoiceNumberDetails = await this.invoiceNumberRepo.findOne({where:{invoice_date: invoice_date}})
                            let inv_num = ''
                            let uInvNum: any = 1;
                            if(invoiceNumberDetails) {
                                uInvNum = invoiceNumberDetails.invoice_number + 1
                                await this.invoiceNumberRepo.update({invoice_date: invoice_date}, {invoice_number: uInvNum})
                            } else {
                                await this.invoiceNumberRepo.save({invoice_date: invoice_date, invoice_number: uInvNum})
                            }
                            var pad = "0000"
                            let str = ""+uInvNum
                            inv_num = pad.substring(0, pad.length - str.length) + str
                            let invoiceId = invoice_date + "-" +inv_num
                            for(let booking of bookings) {
                                frightCharges = frightCharges + (isNaN(parseInt(booking.fare)) ? 0 : parseInt(booking.fare))
                                weightCharges = weightCharges + (isNaN(parseInt(booking.waiting_charge)) ? 0 : parseInt(booking.waiting_charge))
                                loadingCharges = loadingCharges + booking.loading_charge
                                tollCharges = tollCharges + booking.toll_charges
                                bookingIds.push(booking.id)
                                await this.bookingRepo.update({id: booking.id}, {is_invoice_generated: true, invoice_number: invoiceId})
                            }
                            let discount = 0
                            if(companyDetails.discount_on_waiting_charges) {
                                discount += (weightCharges * (companyDetails.discount_on_waiting_charges/100));
                            }
                            if(companyDetails.discount_on_freight_charges) {
                                discount += (frightCharges * (companyDetails.discount_on_freight_charges/100));
                            }
                            const invoiceDate = moment(new Date()).format('YYYY-MM-DD')
                            //console.log(invoiceDate, " invoice date")
                            let invoiceAmount = frightCharges + weightCharges + loadingCharges + tollCharges
                            frightCharges = frightCharges + loadingCharges + tollCharges
                            notes = notes + "invoice amount -" + invoiceAmount
                            invoiceAmount = invoiceAmount - discount
                            notes = notes + ", invoice discount -" + discount
                            let sgst: any = 'NIL'
                            let cgst: any = 'NIL'
                            let tax: any = 'NIL'
                            invoiceAmount = parseFloat(invoiceAmount.toFixed(2))
                            let tatt = invoiceAmount
                            if(companyDetails.gst) {
                                sgst = Number(invoiceAmount * (sgstPercentage/100)).toFixed(2)
                                cgst = Number(invoiceAmount * (cgstPercentage/100)).toFixed(2)
                                // invoiceAmount = invoiceAmount + sgst + cgst
                                tax = parseFloat(sgst) + parseFloat(cgst)
                                tatt += tax
                                notes = notes + ", sgst -" + sgst + ", cgst -" + cgst + ", "
                            }
                            if(companyDetails.is_waiting_charges_include) {
                                frightCharges = frightCharges + weightCharges
                                weightCharges = 0
                            }
            
                            let invoiceData = {
                                'invoiceNo': invoiceId,
                                'invoiceDate': invoiceDate,
                                'company': companyDetails.company_name,
                                'bookingDate': bookingDate,
                                'totalBookings': bookings.length,
                                'freightCharges': frightCharges,
                                'waitingCharges': weightCharges,
                                'loadingCharges': loadingCharges ? loadingCharges : 0,
                                'tollCharges': tollCharges ? tollCharges : 0,
                                'discount': discount,
                                'totalCharges': invoiceAmount,
                                'sgst': sgst,
                                'cgst': cgst,
                                'tax': tax,
                                'companyAddress': companyDetails.address,
                                'customerName': companyDetails.name,
                                'mobile': companyDetails.mobile,
                                'email': companyDetails.email,
                                // 'email': 'nageswararaonali@gmail.com',
                                'gstNo': companyDetails.gst,
                                'tatt': tatt,
                                'tpa': tatt
                            }
                            //console.log("calling tour invoice")
                            const tourSeq = await this.tourRouteRepo.find({where:{tour_id: parseInt(tourId), booking_id: In(bookingIds)}, order: {sequence_number: 'ASC'}})
                            let invoiceLocalUrl = await this.sendBulkInvoice(invoiceData)
                            let invoiceTripSheetLocalUrl = await this.createTourTripFileForInvoice(invoiceData, bookings, tourSeq)
                            let invoiceWaitingTripSheetLocalUrl = await this.createWaitingTourTripFileForInvoice(invoiceData, bookings, tourSeq)
                            let invoiceUrl = ""
                            let tripSheetinvoiceUrl = ""
                            let waitingtripSheetinvoiceUrl = ""
                            // await setTimeout(async () => {
                                const params = {
                                    Key: invoiceId+'.pdf',
                                    Body: fs.createReadStream(invoiceLocalUrl),
                                    Bucket: this.configService.get('REPORTS_BUCKET_NAME'),
                                };
                                const fileRes: any = await this.utilService.uploadS3(params)
                                invoiceUrl = fileRes.Location
                                // fs.unlinkSync(invoiceLocalUrl);
            
                                const trip_params = {
                                    Key: invoiceId+'_tour_tripsheet.pdf',
                                    Body: fs.createReadStream(invoiceTripSheetLocalUrl),
                                    Bucket: this.configService.get('REPORTS_BUCKET_NAME'),
                                };
                                const trip_fileRes: any = await this.utilService.uploadS3(trip_params)
                                tripSheetinvoiceUrl = trip_fileRes.Location
                                // fs.unlinkSync(invoiceTripSheetLocalUrl);
            
                                const waiting_trip_params = {
                                    Key: invoiceId+'_tour_tripsheet_waiting.pdf',
                                    Body: fs.createReadStream(invoiceWaitingTripSheetLocalUrl),
                                    Bucket: this.configService.get('REPORTS_BUCKET_NAME'),
                                };
                                const waiting_trip_fileRes: any = await this.utilService.uploadS3(waiting_trip_params)
                                waitingtripSheetinvoiceUrl = waiting_trip_fileRes.Location
                                // fs.unlinkSync(invoiceWaitingTripSheetLocalUrl);
                                
                                var mailOptions = {
                                    from: 'noreplygo.20221@gmail.com',
                                    to: invoiceData["email"] + ', admin@gogoodmove.com',
                                    // to: 'nageswararaonali@gmail.com, subycharles1@gmail.com',
                                    // to: 'admin@goodmove.in',
                                    subject: 'GoodMove (Invoice No:'+invoiceData["invoiceNo"]+'): Thank you for shipping with us!',
                                    text: `Greetings from GoodMove!!!
                        
Please find attached the invoice.
            
We deliver your goods safely while you focus on your core business!`,
                                    attachments: [
                                        {   // file on disk as an attachment
                                            filename: invoiceData["invoiceNo"]+'.pdf',
                                            path: invoiceLocalUrl // stream this file
                                        },
                                        {   // file on disk as an attachment
                                            filename: invoiceData["invoiceNo"]+'_tripsheet.pdf',
                                            path: invoiceTripSheetLocalUrl // stream this file
                                        },
                                        {   // file on disk as an attachment
                                            filename: invoiceData["invoiceNo"]+'_waiting_tripsheet.pdf',
                                            path: invoiceWaitingTripSheetLocalUrl // stream this file
                                        }
                                    ]
                                }
                                
                                let sendMailFun =  (mailOptions) => new Promise((resolve, reject) => {
                                    mail.sendMail(mailOptions, function(error, info){
                                        if (error) {
                                        //console.log(error);
                                        } else {
                                        //console.log('Email sent: ' + info.response);
                                        
                                        }
                                        fs.unlinkSync(invoiceLocalUrl);
                                        fs.unlinkSync(invoiceTripSheetLocalUrl);
                                        fs.unlinkSync(invoiceWaitingTripSheetLocalUrl);
                                        resolve(info)
                                    });
                                })
                                await sendMailFun(mailOptions)
                                //console.log(trip_fileRes)
                                const invoiceDetails: any = {
                                    'invoice_number': invoiceId,
                                    'invoice_date': invoiceDate,
                                    'invoice_file': invoiceUrl,
                                    'invoice_amount': Math.ceil(invoiceAmount),
                                    'paid_amount': 0,
                                    'comments': '',
                                    'part_amount': 0,
                                    'trip_file': tripSheetinvoiceUrl,
                                    'waiting_trip_file': waitingtripSheetinvoiceUrl,
                                    'company_name': companyDetails.name,
                                    'payment_status': 'Pending',
                                    'bookings': bookingIds.join(','),
                                    'notes': notes + "___" + JSON.stringify(invoiceData),
                                    'invoiceType': 'Tour-'+tourId
                                }
                                //console.log(invoiceDetails)
                                await this.invoiceDetailsRepo.save(invoiceDetails)
                                
                            // }, 20000)
                            // return {items: bookings, count: 1}
                        } else {
                            // return {}
                        }
                    }
                }
            }
            
        }
        // let timeOut = reqBody.company_id.length * 10000 > 30000 ? 30000 : 
        setTimeout(async () => {
            return {items: [], count: ""}
        }, 30000)
        
        
        
    }

    async downloadInvoiceFiles(reqBody: any): Promise<any> {
        let whereCon: any = {};
        let fromDate = new Date(reqBody.from_date)
        fromDate.setDate(fromDate.getDate()-1)
        let toDate = new Date(reqBody.to_date)
        toDate.setDate(toDate.getDate()+1)
        //console.log(fromDate, toDate)
        whereCon["invoice_date"] = Between(fromDate, toDate)
        const invoiceDetails = await this.invoiceDetailsRepo.find({where: whereCon})
        return invoiceDetails
    }

    async declineBooking(reqBody: any): Promise<any> {
        let booking = {
            customer_id: reqBody.customer_id,
            booking_data: JSON.stringify(Object.assign({},reqBody))
        }
        const pendingBooking = await this.pendingBookingRepo.save(booking)
        return pendingBooking
    }

    async customerBookingLog(reqBody: any): Promise<any> {
        let customerLog = {
            customer_mobile: reqBody.customerMobile,
            log_type: reqBody.logType,
            booking_data: reqBody.bookingData
        }
        let cLog = await this.customerBookingLogRepo.save(customerLog)
        return cLog
    }

    async bookingTimesBackup(reqBody: any): Promise<any> {
        let pickupDate = reqBody.calc_date
        const bookings = await this.bookingRepo.createQueryBuilder('b')
                            .select('*')
                            .where("reached_pickup like :pickupDate", {pickupDate: `${pickupDate}%`})
                            .getRawMany()
        for(let booking of bookings) {
            let bookingData = {
                booking_id: booking.id,
                reached_pickup: booking.reached_pickup,
                completed_pickup: booking.completed_pickup,
                reached_drop: booking.reached_drop,
                completed_drop: booking.completed_drop,
                waiting_time: booking.waiting_time,
                waiting_charge: booking.waiting_charge
            }
            let cLog = await this.bookingTimeBackupRepo.save(bookingData)
        }
        
        return true
    }

    async driverSummaryReportPdf(finalSummaryData: any, reportDate: string): Promise<any> {
        let driverRows = ''
        let tRow = `<tr style="height:16pt">
                            <td style="width:40pt">
                                <p class="param-text">{{index}}</p>
                            </td>
                            <td style="width:60pt">
                                <p class="param-text">{{date}}</p>
                            </td>
                            <td style="width:120pt">
                                <p class="param-text">{{driverName}}</p>
                            </td>
                            <td style="width:40pt">
                                <p class="param-text">{{payout}}</p>
                            </td>
                            <td style="width:40pt">
                                <p class="param-text">{{revenue}}</p>
                            </td>
                            <td style="width:40pt">
                                <p class="param-text">{{distance}}</p>
                            </td>
                            <td style="width:40pt">
                                <p class="param-text">{{time}}</p>
                            </td>
                        </tr>`;
        let driverIds = Object.keys(finalSummaryData);
        let index = 1;
        for(let driverId of driverIds) {
            let summaryData = finalSummaryData[driverId];
            let driverRow = tRow
            driverRow = driverRow.replace("{{index}}", index.toString())
            driverRow = driverRow.replace("{{date}}", summaryData.reportDate)
            driverRow = driverRow.replace("{{driverName}}", summaryData.driverName)
            driverRow = driverRow.replace("{{payout}}", summaryData.payment)
            driverRow = driverRow.replace("{{revenue}}", summaryData.totalRevenue)
            driverRow = driverRow.replace("{{distance}}", summaryData.totalDistance)
            driverRow = driverRow.replace("{{time}}", summaryData.totalTime)
            driverRows += driverRow 
            index++
        }
        const pdfOptions: any = {
          childProcessOptions: {
            env: {
              OPENSSL_CONF: '/dev/null',
            },
          }
        }
        let data =[]
        // //console.log(data)
        // for await (let row of data.rows) {
          // //console.log(row)
              
        var template = './public/driver_report.html'
        var pdf_path = './public/drivers_day_report_'+reportDate+'.pdf'
        // //console.log(template)
        var html = fs.readFileSync(template, 'utf8');
        
        html = html.replace('{{DRIVERS_DATA}}', driverRows)
        // //console.log(html)
        let pdfCreate =  (html, pdfOptions, pdf_path) => new Promise((resolve, reject) => {
            pdf.create(html, pdfOptions).toFile(pdf_path, function(err, res1) {
                if (err) return //console.log(err);
                //console.log("res1"); // { filename: '/app/businesscard.pdf' }
                //console.log(res1); // { filename: '/app/businesscard.pdf' }
                // fs.existsSync(res1.filename)
                
                resolve(pdf_path)
                
                
                });
        })
        await pdfCreate(html, pdfOptions, pdf_path)
        return pdf_path
        
    }
    async driverDaySummary(reqBody: any): Promise<any> {
        let driverData = {};
        let driverSummaryData = {};
        const summaryDate = reqBody.calc_date
        let nextDate = new Date(summaryDate)
        nextDate.setDate(nextDate.getDate() + 1)
        console.log("nextDate")
        console.log(nextDate)
        const bookings = await this.bookingRepo.createQueryBuilder('b')
                            .select('*')
                            .where("reached_pickup like :pickupDate", {pickupDate: `${summaryDate}%`})
                            .getRawMany()
        for(let booking of bookings) {
            // console.log(booking.id)
            let trip = await this.tripRepo.findOneBy({booking_id: booking.id})
            // console.log(trip.tour_id)
            // console.log("-----------")
            if(trip && trip.tour_id) {
                let tourData = await this.tourRepo.findOneBy({id: trip.tour_id})
                if(!driverData[tourData.driver_id]) {
                    driverData[tourData.driver_id] = []
                }
            
                driverData[tourData.driver_id].push(booking.id)
                
            }
        }
        // console.log(driverData)
        let driverIds = Object.keys(driverData)
        for(let driverId of driverIds) {
            let summaryData = {
                driverName: '',
                driverMobile: '',
                reportDate: summaryDate,
                totalRevenue: 0,
                totalDistance: 0,
                totalTime: 0,
                payment: 0
            }
            // console.log(driverId)
            // console.log(driverData[driverId])
            let driverInfo = await this.driverRepo.findOneBy({user_id: parseInt(driverId)})
            summaryData.driverMobile = driverInfo.mobile_number
            summaryData.driverName = driverInfo.name
            
            // to run local un comment below lines
            /*const indianTimeZone = 'Asia/Kolkata';

            const dateSt = new Date(summaryDate)
            // Start and end of the day in the Indian time zone
            const startOfDayUTC = new Date(
                new Date(`${summaryDate}T00:00:00`).toLocaleString("en-US", { timeZone: indianTimeZone })
              );
              
              const endOfDayUTC = new Date(
                new Date(`${summaryDate}T23:59:59`).toLocaleString("en-US", { timeZone: indianTimeZone })
              );

            let driverSessions = await this.dsRepo.createQueryBuilder('b')
                            .select('*')
                            .where("user_id=:driverId and session_start_time > :pickupDate and session_start_time < :nextDate", {driverId: parseInt(driverId), pickupDate: startOfDayUTC, nextDate: endOfDayUTC})
                            .getRawMany()*/
            let driverSessions = await this.dsRepo.find({where:{user_id: parseInt(driverId), session_start_time: Between(summaryDate, nextDate) }})
            console.log(driverSessions)
            for(let dSession of driverSessions) {
                // console.log(dSession)
                summaryData.totalTime += parseFloat(dSession.total_time)
                summaryData.totalDistance += parseInt(dSession.total_distance)
                summaryData.payment += dSession.final_fare
            }
            for(let bookingId of driverData[driverId]) {
                let booking = bookings.filter((bkng) => {
                    return bkng.id == bookingId
                })[0]
                if(booking) {
                    let customer_company_details: any = await this.companyRepo.findOne({where:{users: Like((`%#${booking.customer_id},%`))}})
                    summaryData.totalRevenue += booking.fare ? parseInt(booking.fare) : 0
                    summaryData.totalRevenue += booking.loading_charge
                    summaryData.totalRevenue += booking.toll_charges
                    if(customer_company_details && customer_company_details.discount_on_waiting_charges && booking.waiting_charge) {
                        let waiting_charge = parseInt(booking.waiting_charge);
                        const dicounted_waiting_charge = waiting_charge - Math.ceil(((customer_company_details.discount_on_waiting_charges/100) * waiting_charge)) 
                        summaryData.totalRevenue += dicounted_waiting_charge
                    } else {
                        summaryData.totalRevenue += booking.waiting_charge ? parseInt(booking.waiting_charge) : 0
                    }
                    //adding booking loading and toll charges to driver payment
                    summaryData.payment += booking.loading_charge
                    summaryData.payment += booking.toll_charges
                }
            }
            driverSummaryData[driverId] = summaryData
            
        }
        console.log(driverSummaryData)
        let pdfUrl = await this.driverSummaryReportPdf(driverSummaryData, summaryDate)
        var mailOptions = {
                from: 'noreplygo.20221@gmail.com',
                to: 'nageswararaonali@gmail.com, prakash@goodmove.in, siva.k.meet@gmail.com , ram@goodmove.in, gitakrishnan@goodmove.in, admin@goodmove.in, abineshwilson123@gmail.com, siva@goodmove.in',
                // to: 'nageswararaonali@gmail.com',
                // to: 'admin@goodmove.in',
                subject: 'GoodMove (Driver Day Summary Report: '+summaryDate+'): Thank you for shipping with us!',
                text: `Greetings from GoodMove!!!
    
Please find attached the report.
        `,
                attachments: [
                    {   // file on disk as an attachment
                        filename: summaryDate+'.pdf',
                        path: pdfUrl // stream this file
                    }
                ]
            }
            let sendMailFun =  (mailOptions) => new Promise((resolve, reject) => {
                mail.sendMail(mailOptions, function(error, info){
                    if (error) {
                    console.log(error);
                    } else {
                    console.log('Email sent: ' + info.response);
                    
                    }
                    fs.unlinkSync(pdfUrl);
                    resolve(info)
                });
            })
            // await sendMailFun(mailOptions)
        return true
    }

    async driverDaySummaryManuel(reqBody: any): Promise<any> {
        let driverData = {};
        let driverSummaryData = {};
        const summaryDate = reqBody.calc_date
        let nextDate = new Date(summaryDate)
        nextDate.setDate(nextDate.getDate() + 1)
        console.log("nextDate")
        console.log(nextDate)
        const bookings = await this.bookingRepo.createQueryBuilder('b')
                            .select('*')
                            .where("reached_pickup like :pickupDate", {pickupDate: `${summaryDate}%`})
                            .getRawMany()
        for(let booking of bookings) {
            // console.log(booking.id)
            let trip = await this.tripRepo.findOneBy({booking_id: booking.id})
            // console.log(trip.tour_id)
            // console.log("-----------")
            if(trip && trip.tour_id) {
                let tourData = await this.tourRepo.findOneBy({id: trip.tour_id})
                if(tourData.driver_id == 756) {
                    if(!driverData[tourData.driver_id]) {
                        driverData[tourData.driver_id] = []
                    }
    
                
                    driverData[tourData.driver_id].push(booking.id)
                }
                
                
            }
        }
        // console.log(driverData)
        let driverIds = Object.keys(driverData)
        for(let driverId of driverIds) {
            let summaryData = {
                driverName: '',
                driverMobile: '',
                reportDate: summaryDate,
                totalRevenue: 0,
                totalDistance: 0,
                totalTime: 0,
                payment: 0
            }
            // console.log(driverId)
            // console.log(driverData[driverId])
            let driverInfo = await this.driverRepo.findOneBy({user_id: parseInt(driverId)})
            summaryData.driverMobile = driverInfo.mobile_number
            summaryData.driverName = driverInfo.name
            
            // to run local un comment below lines
            /*const indianTimeZone = 'Asia/Kolkata';

            const dateSt = new Date(summaryDate)
            // Start and end of the day in the Indian time zone
            const startOfDayUTC = new Date(
                new Date(`${summaryDate}T00:00:00`).toLocaleString("en-US", { timeZone: indianTimeZone })
              );
              
              const endOfDayUTC = new Date(
                new Date(`${summaryDate}T23:59:59`).toLocaleString("en-US", { timeZone: indianTimeZone })
              );

            let driverSessions = await this.dsRepo.createQueryBuilder('b')
                            .select('*')
                            .where("user_id=:driverId and session_start_time > :pickupDate and session_start_time < :nextDate", {driverId: parseInt(driverId), pickupDate: startOfDayUTC, nextDate: endOfDayUTC})
                            .getRawMany()*/
            let driverSessions = await this.dsRepo.find({where:{user_id: parseInt(driverId), session_start_time: Between(summaryDate, nextDate) }})
            console.log(driverSessions)
            for(let dSession of driverSessions) {
                // console.log(dSession)
                summaryData.totalTime += parseFloat(dSession.total_time)
                summaryData.totalDistance += parseInt(dSession.total_distance)
                summaryData.payment += dSession.final_fare
            }
            for(let bookingId of driverData[driverId]) {
                let booking = bookings.filter((bkng) => {
                    return bkng.id == bookingId
                })[0]
                if(booking) {
                    let customer_company_details: any = await this.companyRepo.findOne({where:{users: Like((`%#${booking.customer_id},%`))}})
                    summaryData.totalRevenue += booking.fare ? parseInt(booking.fare) : 0
                    summaryData.totalRevenue += booking.loading_charge
                    summaryData.totalRevenue += booking.toll_charges
                    if(customer_company_details && customer_company_details.discount_on_waiting_charges && booking.waiting_charge) {
                        let waiting_charge = parseInt(booking.waiting_charge);
                        const dicounted_waiting_charge = waiting_charge - Math.ceil(((customer_company_details.discount_on_waiting_charges/100) * waiting_charge)) 
                        summaryData.totalRevenue += dicounted_waiting_charge
                    } else {
                        summaryData.totalRevenue += booking.waiting_charge ? parseInt(booking.waiting_charge) : 0
                    }
                    //adding booking loading and toll charges to driver payment
                    summaryData.payment += booking.loading_charge
                    summaryData.payment += booking.toll_charges
                }
            }
            driverSummaryData[driverId] = summaryData
            
        }
        console.log(driverSummaryData)
        
        return true
    }

    async genCSV(): Promise<any> {
        let bookings = [
          ]
          
        
            let bString = "";
            const reportFileName= './public/raj_aug_1_28_bks.csv';
            const headerData = ['Booking id', 'Date', 'Customer Name', 'Company Name', 'From', 'To', 'Waiting time', 'Waiting charges', 'Estimated Fare']
            for(let i=0; i<headerData.length; i++){
                bString += headerData[i] + ","
            }
            bString += '\n'
            if(bookings && bookings.length) {
                for(let bkg of bookings) {
                    const item = await this.bookingRepo.findOneBy({id: bkg.bookingId})
                    //console.log(item.id)
                    let companyDetails = await this.companyRepo.findOne({where: {users: Like(`%#${item.customer_id},%`)}})
                    const booking = {
                        ...item,
                        customer_name: await this.utilService.getName(item.customer_id),
                        company_name: companyDetails ? companyDetails.company_name : ''
                    }
                    let booking_date = booking.reached_pickup ?  booking.reached_pickup.split(" ")[0].toString() : "";
                    bString += booking.id + "," + booking_date + "," + booking.customer_name + "," + booking.company_name + "," + booking.pickup_location.replace(/,/g, "") + "," + booking.dropoff_location.replace(/,/g, "") + ","  + booking.waiting_time + "," + booking.waiting_charge + "," + bkg.estimated_fare + "," + '\n'
                    // bookings.push(booking)
                }
                await fs.writeFileSync(reportFileName, bString, 'utf8')
                
            }

    }

    async findNearbyDrivers(lat: any, lng: any, radiusKm: number, vehicleType: string) {
        const radiusMeters = radiusKm * 1000;

        let drivers = await this.driverLastLocRepo.query(
          `
          SELECT *,
                 ST_Distance(location, ST_MakePoint($1, $2)::geography) AS distance
          FROM driver_last_location_details
          WHERE ST_DWithin(location, ST_MakePoint($1, $2)::geography, $3) and vehicle_type = $4
          ORDER BY distance ASC
          `,
          [lng, lat, radiusMeters, vehicleType],
        );

        // fall back to every on-duty driver of this vehicle type, regardless of distance,
        // rather than silently broadcasting to nobody when nothing is within radiusKm
        if (!drivers.length) {
            drivers = await this.driverLastLocRepo.find({where: {vehicle_type: vehicleType}});
        }

        return drivers;
    }

    // Broadcasts a just-created multi_booking_id group to every eligible on-duty driver.
    // Called from addMultiBooking once all leg rows are saved - never throws, since a
    // broadcast failure must not fail the booking-creation response.
    async broadcastMultiBooking(multiBookingId: string, legs: BookingEntity[], reqBody: any): Promise<any> {
        try {
            if (!legs.length) return;
            const firstLeg = legs[0];
            const vehicleType = reqBody.vehicle_type || firstLeg.vehicle_type;
            if (!vehicleType) {
                console.log('broadcastMultiBooking: no vehicle_type on booking, skipping', multiBookingId);
                return;
            }
            const driverRadiusKm = 15;

            const drivers = await this.findNearbyDrivers(firstLeg.pickup_lat, firstLeg.pickup_long, driverRadiusKm, vehicleType);
            if (!drivers.length) {
                console.log('broadcastMultiBooking: no on-duty drivers found for', multiBookingId, vehicleType);
                return;
            }

            const expiresAt = moment().add(30, 'seconds').toDate();
            await this.dispatchRepo.save({
                multi_booking_id: multiBookingId,
                status: 'broadcasting',
                expires_at: expiresAt,
            });

            // de-duplicate the shared stop: multipickup shares one drop, multidrop shares one pickup
            const isMultiPickup = reqBody.trip_type === 'multipickup';
            const isMultiDrop = reqBody.trip_type === 'multidrop';
            const pickups = isMultiPickup ? legs.map(l => l.pickup_location) : [firstLeg.pickup_location];
            const drops = isMultiDrop ? legs.map(l => l.dropoff_location) : [firstLeg.dropoff_location];

            const tokens: string[] = [];
            const candidateRows = [];
            for (const driver of drivers) {
                // driver_last_location_details.driver_id is actually a user_id, see
                // driver.service.ts's updateDriverLastLocDetails (saves reqBody.user_id here)
                const driverEntity = await this.driverRepo.findOneBy({user_id: driver.driver_id});
                if (!driverEntity) continue;
                const pushToken = await this.utilService.getDeviceToken(driver.driver_id);
                candidateRows.push({
                    multi_booking_id: multiBookingId,
                    driver_id: driver.driver_id,
                    truck_id: driver.truck_id,
                    truck_owner_id: driverEntity.truck_owner_id,
                    push_token: pushToken || null,
                    status: 'pending',
                });
                if (pushToken) tokens.push(pushToken);
            }
            if (candidateRows.length) {
                await this.dispatchCandidateRepo.save(candidateRows);
            }

            if (tokens.length) {
                const TITLE = 'New booking nearby';
                const BODY = pickups.length > 1
                    ? `${pickups.length} pickups → ${drops[0]}`
                    : (drops.length > 1 ? `${pickups[0]} → ${drops.length} drops` : `${pickups[0]} → ${drops[0]}`);
                await this.utilService.sendPushNotification(TITLE, BODY, tokens, {
                    type: 'DISPATCH_REQUEST',
                    multiBookingId,
                    expiresAt: expiresAt.toISOString(),
                    pickups,
                    drops,
                });
            }

            await this.dispatchTimeoutQueue.add('check-timeout', {multiBookingId}, {delay: 30000});
        } catch (e) {
            console.log('broadcastMultiBooking error', e);
        }
    }

    // The race-safe accept: the conditional UPDATE below is the actual correctness
    // guarantee (exactly one concurrent caller can flip status broadcasting->assigned),
    // everything after it is just cleanup/UX for whoever won vs. lost.
    async acceptDispatch(reqBody: any): Promise<any> {
        const { multi_booking_id, driver_id } = reqBody;

        const updateResult = await this.dispatchRepo.createQueryBuilder()
            .update(BookingDispatchEntity)
            .set({ status: 'assigned', winner_driver_id: driver_id })
            .where('multi_booking_id = :id AND status = :s', { id: multi_booking_id, s: 'broadcasting' })
            .execute();

        if (!updateResult.affected) {
            return { success: false, message: 'This booking has already been assigned to another driver' };
        }

        await this.dispatchCandidateRepo.update(
            { multi_booking_id, driver_id },
            { status: 'accepted', responded_at: new Date() }
        );
        const losers = await this.dispatchCandidateRepo.find({ where: { multi_booking_id, status: 'pending' } });
        if (losers.length) {
            await this.dispatchCandidateRepo.update(
                { multi_booking_id, status: 'pending' },
                { status: 'lost', responded_at: new Date() }
            );
            const loserTokens = losers.map(l => l.push_token).filter(Boolean);
            if (loserTokens.length) {
                await this.utilService.sendPushNotification(
                    'Booking no longer available',
                    'This booking has already been accepted by another driver.',
                    loserTokens,
                    { type: 'DISPATCH_CLOSED', multiBookingId: multi_booking_id }
                );
            }
        }

        const legs = await this.bookingRepo.find({ where: { multi_booking_id }, order: { id: 'ASC' } });
        const driverData = await this.driverRepo.findOneBy({ user_id: driver_id });
        if (!legs.length || !driverData) {
            return { success: false, message: 'Booking or driver record not found' };
        }

        // auto-create the trip rows (addTour requires a trip_id per leg, normally a
        // manager-driven step via addTrip). One trip_id PER booking, equal to that
        // booking's own id - matches the established convention in tour.service.ts's
        // own automated callers (addClosedTour, the return-booking flow), both of which
        // set trip_id: booking.id rather than a value shared across several bookings;
        // addBookingStatusTimeData even branches specifically on booking_id == trip_id
        // as the common case.
        for (const leg of legs) {
            const tripIdStr = leg.id.toString();
            await this.addTrip({
                booking_id: leg.id,
                trip_id: tripIdStr,
                customer_id: leg.customer_id,
                engaged_consolidation_manager: leg.engaged_consolidation_manager,
                pickup_location: leg.pickup_location,
                pickup_time: leg.pickup_time,
                dropoff_location: leg.dropoff_location,
                dropoff_time: leg.dropoff_time,
                pickup_lat: leg.pickup_lat,
                pickup_long: leg.pickup_long,
                dropoff_lat: leg.dropoff_lat,
                dropoff_long: leg.dropoff_long,
            });
        }

        // build addTour's sequence[] - every leg gets its OWN pickup+drop pair tied to its
        // own booking_id, matching exactly what the manual manager-interface flow produces
        // (manager-interface/src/pages/Dashboard/Trips.js's handleCheckBoxChange: every
        // selected trip contributes one pickup entry + one drop entry, never de-duplicated,
        // even when several trips share the same physical drop location). This pairing is
        // load-bearing elsewhere in tour.service.ts (e.g. completeStop/updateSeq look up
        // tour_route rows by {booking_id, transport_type} to drive per-booking status writes
        // like "Completed drop") - collapsing a shared stop into one row for a multipickup/
        // multidrop group would leave some booking_ids with no drop (or no pickup) tour_route
        // row at all and break that tracking. Pickups are still sequenced before drops (not
        // interleaved per-leg) so a multipickup/multidrop route doesn't revisit the shared
        // stop once per leg.
        const sequence = [];
        let seqNum = 1;
        for (const leg of legs) {
            sequence.push({
                booking_id: leg.id, trip_id: leg.id.toString(), transport_type: 'pickup',
                sequence_number: seqNum++, pickup_lat: leg.pickup_lat, pickup_long: leg.pickup_long,
                location_address: leg.pickup_location, consolidation_center_id: null,
            });
        }
        for (const leg of legs) {
            sequence.push({
                booking_id: leg.id, trip_id: leg.id.toString(), transport_type: 'drop',
                sequence_number: seqNum++, dropoff_lat: leg.dropoff_lat, dropoff_long: leg.dropoff_long,
                location_address: leg.dropoff_location, consolidation_center_id: null,
            });
        }

        const tourData = await this.tourService.addTour({
            booking_id: legs.map(l => l.id),
            driver_id,
            engaged_consolidation_manager: legs[0].engaged_consolidation_manager,
            tour_fare: legs.reduce((sum, l) => sum + (Number(l.estimated_fare) || 0), 0),
            sequence,
        });

        // the driver already won the race, so accept immediately rather than leaving the
        // tour in addTour's default awaiting-accept state
        const acceptResult = await this.tourService.acceptTour({
            tour_id: tourData.id,
            driver_id,
            truck_id: driverData.truck_id,
            truck_owner_id: driverData.truck_owner_id,
        });

        await this.dispatchRepo.update(
            { multi_booking_id },
            { winner_truck_id: driverData.truck_id, winner_truck_owner_id: driverData.truck_owner_id, tour_id: tourData.id }
        );

        return { success: true, tour_id: tourData.id, driver_name: acceptResult.driver_name };
    }

    async declineDispatch(reqBody: any): Promise<any> {
        await this.dispatchCandidateRepo.update(
            { multi_booking_id: reqBody.multi_booking_id, driver_id: reqBody.driver_id, status: 'pending' },
            { status: 'expired', responded_at: new Date() }
        );
        return { success: true };
    }

    async deleteBookingTour(bookingId):Promise<any> {
        
    }

    async testPaymentLinkSMS():Promise<any> {
        // return await this.sendPaymentLinkSMS('9030935373', {id: 1234, multi_booking_id: '1231231'})
        let smsData = {
            "template_id": this.configService.get('BOOKING_CONFIRM_SMS_TEMPLATE_ID'),
            "sender": this.configService.get('SMS_SENDER_ID'),
            "short_url": "1",
            "mobiles": "919030935373",
            "b_id": 123,
            "b_link": " "+this.baseUrl+"/booking/123123"+ " "
        }
        const pickupSMSRespData = await this.utilService.sendBookingSMS(smsData)
        return pickupSMSRespData
    }

    async recordReturnBookingStatus(newBooking: any): Promise<any> {
        try {
            let bsReq = {
                booking_id: newBooking.id,
                status: 'Return Initiated',
                created_by: newBooking.customer_id,
                created_at: new Date(),
                updated_at: new Date()
            }
            await this.bsRepo.save(bsReq)
            bsReq['status'] = "Reached pickup"
            await this.bsRepo.save(bsReq)
            bsReq['status'] = "Completed pickup"
            await this.bsRepo.save(bsReq)
        } catch(e) {
            console.log("error while recording return booking status")
            console.log(e)
        }
    }

    async recordReturnDisposeBookingStatus(newBooking: any): Promise<any> {
        try {
            let bsReq = {
                booking_id: newBooking.id,
                status: 'Return Initiated',
                created_by: newBooking.customer_id,
                created_at: new Date(),
                updated_at: new Date()
            }
            await this.bsRepo.save(bsReq)
            bsReq['status'] = "Reached pickup"
            await this.bsRepo.save(bsReq)
            bsReq['status'] = "Completed pickup"
            await this.bsRepo.save(bsReq)
            bsReq['status'] = "Canceled By Manager"
            await this.bsRepo.save(bsReq)
        } catch(e) {
            console.log("error while recording return dispose booking status")
            console.log(e)
        }
    }

    async getBookingsByDate(date: number): Promise<any> {
        const dateStr = '2025-10-13'
        const bookingsData = await this.bookingRepo.find({where: {reached_pickup: Like(`%${dateStr}%`)}})
        console.log(bookingsData.length)
        return bookingsData
    }

    // const lockKey = `driver-lock:${driver.id}`;

    //   // Try to reserve this driver (30s TTL example)
    //   const lock = await this.redis.set(lockKey, bookingId, 'NX', 'EX', 30);

    //   if (!lock) {
    //     // someone else already reserved this driver
    //     continue;
    //   }

    //   try {
    //     // Call external allocate API
    //     await this.callAllocateApi(bookingId, driver.id);

    //     // Update DB: mark driver as busy, booking as allocated
    //     await this.markAllocated(bookingId, driver.id);

    //     // Success → keep or release lock depending on your semantics
    //     await this.redis.del(lockKey);
    //     return;
    //   } catch (e) {
    //     // Release lock so others can try this driver again
    //     await this.redis.del(lockKey);
    //     // maybe continue to next driver, or rethrow
    //     throw e;
    //   }

    async checkDrivers(booking: any): Promise<any> {
        const driverRadius = 500
        const last_track_diff = 30
        // const driverRadius = 4
        let drivers = await this.findNearbyDrivers(13.024591518533352, 80.17052038876145, driverRadius, '2W')
        console.log(drivers)
        if(drivers && drivers.length) {
            for(let driver of drivers) {
                // await this.tourRepo
                let d1 = moment.tz(driver.last_tracked_at, "YYYY-MM-DD HH:mm:ss.SSS", 'Asia/Calcutta')
                let d2 = moment().tz('Asia/Calcutta')
                console.log(d1, d2)
                const diff = d2.diff(d1, 'minutes')
                console.log({
                    raw: driver.last_tracked_at,
                    parsedIST: moment.tz(driver.last_tracked_at, "YYYY-MM-DD HH:mm:ss.SSS", "Asia/Kolkata").format(),
                    parsedUTC: moment.utc(driver.last_tracked_at).format(),
                    nowIST: moment.tz("Asia/Kolkata").format(),
                  });
                  const lastTracked = moment.parseZone(driver.last_tracked_at); // stays at 2025-10-22T14:23:55Z
                  let diffMins = moment().diff(lastTracked, 'minutes');       
                console.log(diff)
                console.log(diffMins)
                 diffMins = moment.utc().diff(moment.utc(driver.last_tracked_at), 'minutes');
                 console.log(diffMins, "utc")
            }
            const driver = drivers[0]
        }
        return []
    }
}
