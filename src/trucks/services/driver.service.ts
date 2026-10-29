import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersEntity } from 'src/users/models/users.entity';
import { UsersService } from 'src/users/services/users.service';
import { UtilsService } from 'src/utils/services/utils.service';
import { Between, In, LessThan, Like, Not, Repository } from 'typeorm';
import { DriversEntity } from '../models/driver.entity';
import { LocationsEntity } from '../models/locations.entity';
import { DriverSessionsEntity } from '../models/driverSessions.entity';
import { LocationService } from './location.service';
import { TruckService } from './truck.service';
import * as moment from 'moment';
import { GMTruckerRatesEntity } from '../models/gmTruckerRates';
import { GMTruckerPaymentsEntity } from '../models/gmTruckerPayments';
import { ToursEntity } from 'src/tours/models/tours.entity';
import { DriverSessionDistanceEntity } from '../models/driverSessionDistance.entity';
import { BookingEntity } from 'src/bookings/models/booking.entity';
import { TourRouteEntity } from 'src/tours/models/tourRoute.entity';
import { GMDriverRatesEntity } from '../models/gmDriverRates';
import { DriverTransactionsEntity } from '../models/driverTransactions';
import readXlsxFile from 'read-excel-file/node'
import * as fs from 'fs'
import { S3 } from 'aws-sdk';
import { Point } from 'geojson'
import { ConfigService } from '@nestjs/config';
import { UserLoginsEntity } from 'src/users/models/userLogin.entity';
import { DriverSessionSummaryEntity } from '../models/driverSessionSummary.entity';
import { CustomerCompanyEntity } from '../models/cusomerCompanyDetails';
import * as nodemailer from 'nodemailer'
import * as pdf from 'html-pdf'
import { DriverLastLocationDetails } from '../models/driverLastLocDetails';

var mail = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

@Injectable()
export class DriverService {
    constructor(
        @InjectRepository(DriversEntity)
        private driverRepository: Repository<DriversEntity>,
        @InjectRepository(UsersEntity)
        private usersRepository: Repository<UsersEntity>,
        @InjectRepository(DriverSessionsEntity)
        private dsRepository: Repository<DriverSessionsEntity>,
        @InjectRepository(LocationsEntity)
        private locationsRepo: Repository<LocationsEntity>,
        @InjectRepository(GMTruckerRatesEntity)
        private truckerRateRepo: Repository<GMTruckerRatesEntity>,
        @InjectRepository(GMTruckerPaymentsEntity)
        private truckerPaymentRepo: Repository<GMTruckerPaymentsEntity>,
        @InjectRepository(ToursEntity)
        private toursEntity: Repository<ToursEntity>,
        @InjectRepository(DriverSessionDistanceEntity)
        private driverSessionDistance: Repository<DriverSessionDistanceEntity>,
        @InjectRepository(BookingEntity)
        private bookingRepo: Repository<BookingEntity>,
        @InjectRepository(TourRouteEntity)
        private tourRouteRepo: Repository<TourRouteEntity>,
        @InjectRepository(GMDriverRatesEntity)
        private driverRates: Repository<GMDriverRatesEntity>,
        @InjectRepository(DriverTransactionsEntity)
        private driverTransactions: Repository<DriverTransactionsEntity>,
        @InjectRepository(UserLoginsEntity)
        private userLoginRepo: Repository<UserLoginsEntity>,
        @InjectRepository(DriverSessionSummaryEntity)
        private dssRepo: Repository<DriverSessionSummaryEntity>,
        @InjectRepository(CustomerCompanyEntity)
        private companyRepo: Repository<CustomerCompanyEntity>,
        @InjectRepository(DriverLastLocationDetails)
        private driverLastLocRepo: Repository<DriverLastLocationDetails>,
        private utilsService: UtilsService,
        private truckService: TruckService,
        private userService: UsersService,
        private locService: LocationService,
        private configService: ConfigService
    ){}

    async addDriver(reqBody): Promise<any> {
        const driverInput = {
            "truck_owner_id": reqBody.truck_owner_id,
            "name": reqBody.name,
            "mobile_number": reqBody.mobile_number,
            "license_number": reqBody.license_number,
            "status": "Available",
            "truck_id": reqBody.truck_id,
            "user_id": reqBody.user_id
        }
        const driverData = await this.driverRepository.save(driverInput)
        return driverData
    }

    async getDriver(reqBody: any): Promise<any> {
        const driverData = await this.driverRepository.findOneBy(reqBody)
        return driverData
    }

    async driverDetails(mobile: string): Promise<any> {
        let driverDetails: any = {}
        const driverData = await this.driverRepository.findOne({where: {mobile_number: mobile}})
        if (driverData) {
            driverDetails.driverData = driverData
            const userData = await this.userService.getUserById(driverData.user_id)
            driverDetails.userData = userData
        } else {
            // checkUser() allows both Driver and Owner accounts to log into the trucker
            // app, but an Owner has no row of their own in the drivers table (that table
            // is for the driver(s) assigned to their truck, looked up separately via
            // driverByOwner). Fall back to the users table directly instead of crashing
            // on driverData.user_id below.
            const userData = await this.usersRepository.findOneBy({mobile})
            if (!userData) {
                return null
            }
            driverDetails.driverData = {name: userData.name}
            driverDetails.userData = userData
        }
        return driverDetails
    }

    async updateDriver(id: number, reqBody: any): Promise<any> {
        delete reqBody.mobile_number;
        const driverData = await this.driverRepository.update({user_id: id}, reqBody)
        return driverData;
    }

    async updateDriverLastLocDetails(reqBody: any): Promise<any> {
        const pointObject: Point = {
            type: "Point",
            coordinates: [reqBody.longitude, reqBody.latitude]
        };
        let lastDetails:  any = {
            latitude: reqBody.latitude,
            longitude: reqBody.longitude,
            location: pointObject,
            last_tracked_at: moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss')
        }
        const lastDriverDetails = await this.driverLastLocRepo.findOne({where: {driver_id: reqBody.user_id}})
        const driverData = await this.driverRepository.findOneBy({user_id: reqBody.user_id})
        const user = await this.usersRepository.findOneBy({id: reqBody.user_id})
        if(user.is_available) {
            if(lastDriverDetails) {
                if(lastDriverDetails.truck_id != driverData.truck_id) {
                    const truckData = await this.truckService.getTruck(driverData.truck_id)
                    lastDetails.truck_id = driverData.truck_id
                    lastDetails.vehicle_type = truckData.vehicle_type
                }
                // console.log(lastDetails)
                await this.driverLastLocRepo.update({driver_id: reqBody.user_id}, lastDetails)
            } else {
                const truckData = await this.truckService.getTruck(driverData.truck_id)
                lastDetails.truck_id = driverData.truck_id
                lastDetails.vehicle_type = truckData.vehicle_type
                lastDetails.driver_id = reqBody.user_id
                // console.log(lastDetails)
                await this.driverLastLocRepo.save(lastDetails)
            }
        } else if(lastDriverDetails) {
            await this.driverLastLocRepo.delete({driver_id: reqBody.user_id})
        }
        
        
        return 
    } 

    async deleteDriver(id: number): Promise<any> {
        const driverData = await this.driverRepository.delete(id)
        return driverData;
    }

    async deleteByOwner(id: number): Promise<any> {
        const driverData = await this.driverRepository.delete({truck_owner_id: id})
        return driverData;
    }

    async getDrivers(reqBody: any): Promise<any> {
        const offset = reqBody.offset || 0
        const limit = reqBody.limit || 10
        const count = await this.driverRepository.createQueryBuilder('driver').getCount()
        const items = await this.driverRepository.createQueryBuilder('driver')
            .leftJoin('users', 'u', 'u.id = driver.user_id')
            .orderBy('u.is_available', 'DESC', 'NULLS LAST')
            .addOrderBy('driver.last_tracked_at', 'DESC', 'NULLS LAST')
            .limit(limit)
            .offset(offset)
            .getMany()
        let drivers = []
        for await (const driver of items) {
            driver['truck_owner_name'] = await this.utilsService.getName(driver.truck_owner_id)
            const truckData = await this.truckService.getTruck(driver.truck_id)
            driver['vehicle_number'] = truckData ? truckData.registration_number : ''
            const userData = await this.userService.getUserById(driver.user_id)
            driver['available_status'] = userData ? userData.is_available : ''
            const baseLoc = await this.utilsService.getDriverBaseLocation(driver.user_id)
            driver['baseLocation'] = baseLoc
            drivers.push(driver)
        }
        return {drivers, count}
    }

    async createSession(seqData, reqBody): Promise<any> {
        const driverSessionInput = {
            "start_location": seqData.id,
            "user_id": reqBody.user_id,
            "status": true,
            "total_time": reqBody.total_time ? reqBody.total_time : 0, // minutes
            "total_distance": reqBody.total_distance ? reqBody.total_distance : '0.0', // meters
            "start_odometer_reading": reqBody.start_odometer_reading ? reqBody.start_odometer_reading : 1050, // this should remove and come from trucker upload
            "session_start_time": reqBody.session_start_time ? (reqBody.session_start_time) : moment(new Date()),
        }
        const driverData = await this.dsRepository.save(driverSessionInput)
        return driverData
    }

    async updateSessionTours(session_id, driver_id, start_time, end_time): Promise<any> {
        let whereCon: any = {}
        let bookingIds = []
        let bookingTourIds = []
        if(start_time) {
            // whereCon['created_at'] =  Between(new Date(reqBody.start_date), new Date(reqBody.end_date))
            whereCon['reached_pickup'] =  Between(start_time, end_time)
        } 
        console.log(whereCon)
        const items= await this.bookingRepo.find({where: whereCon, order:{id: 'ASC'}})
        for(let booking of items) {
            bookingIds.push(booking.id)
        }
        console.log("bookingIds")
        console.log(bookingIds)
        const tourRoutes = await this.tourRouteRepo.find({where: {booking_id: In(bookingIds)}, order: {booking_id: 'ASC'}})
        for(let tourRoute of tourRoutes) {
            console.log()
            if(tourRoute.tour_id) {
                bookingTourIds.push(tourRoute.tour_id)
            }
        }
        bookingTourIds = [...new Set(bookingTourIds)]
        console.log("bookingTourIds")
        console.log(bookingTourIds)
        for(let tour_id of bookingTourIds) {
            const tourData = await this.toursEntity.findOneBy({id: tour_id, driver_id: driver_id})
            if(tourData) {
                const tourSequence = await this.tourRouteRepo.find({where: {tour_id: tour_id}, order: {sequence_number: 'ASC'}})
                if(tourSequence && tourSequence.length) {
                    let bookingId = tourSequence[0].booking_id
                    let bookingData = await this.bookingRepo.findOneBy({id: bookingId})
                    if(bookingData.reached_pickup >= start_time && bookingData.reached_pickup < end_time) {
                        const tDistance = await this.locService.calcTourDistance(tour_id);
                        let sessionDistanceData = {
                            session_id: session_id,
                            tour_id: tour_id,
                            distance: tDistance,
                            tour_type: tourData.tour_type
                        }
                        const existingTourDistance = await this.driverSessionDistance.findOneBy({tour_id: tour_id})
                        if(existingTourDistance && existingTourDistance.id) {
                            await this.driverSessionDistance.update({id: existingTourDistance.id}, sessionDistanceData)
                        } else {
                            await this.driverSessionDistance.save(sessionDistanceData)
                        }
                    }
                }
            }
            
        }

    }

    async createSessionByManager(seqData, reqBody): Promise<any> {
        const driverSessionInput = {
            "start_location": seqData.id,
            "user_id": reqBody.user_id,
            "status": false,
            "total_time": reqBody.total_time ? reqBody.total_time : 0, // minutes
            "total_distance": reqBody.total_distance ? reqBody.total_distance : '0.0', // meters
            "start_odometer_reading": reqBody.start_odometer_reading ? reqBody.start_odometer_reading : 1050 ,// this should remove and come from trucker upload
            "end_odometer_reading": reqBody.end_odometer_reading ? reqBody.end_odometer_reading : 1050 ,// this should remove and come from trucker upload
            // "created_at": reqBody.created_at ? reqBody.created_at : new Date(),
            "session_start_time": reqBody.session_start_time ? (reqBody.session_start_time) : '',
            "session_end_time": reqBody.session_end_time ? (reqBody.session_end_time) : '',
            "final_fare": reqBody.final_fare ? reqBody.final_fare : 0
        }
        const sessionData = await this.dsRepository.save(driverSessionInput)
        const session_start_time = moment(reqBody.session_start_time ? reqBody.session_start_time : sessionData.session_start_time)
        const session_end_time = moment(reqBody.session_end_time ? reqBody.session_end_time : sessionData.session_end_time)
        console.log(reqBody.session_start_time ? reqBody.session_start_time : sessionData.session_start_time)
        console.log(session_start_time)
        await this.updateSessionTours(sessionData.id, sessionData.user_id, session_start_time, session_end_time)
        return sessionData
    }

    async createTourSession(inputData : any): Promise<any> {
        const sessionData = await this.dsRepository.save(inputData)
        return sessionData
    }
    
    async getLatestSession(user_id: number): Promise<any> {
        let tour_ids: any = []
        const exceptStatus = ['Completed']
        let tour_count = 0
        let distance = 0
        let sessionData = await this.dsRepository.findOne({where: {user_id: user_id, status: true}, order: {id: 'DESC'}})
        if(sessionData && sessionData.id) {
            // tour_ids = await this.locService.getTourIdsOfSession(sessionData.id)
            let [items, count] = await this.driverSessionDistance.findAndCount({where:{session_id: sessionData.id}})
            for(let item of items) {
                let tourData = await this.toursEntity.findOne({where:{id: item.tour_id, status: Not(In(exceptStatus))}})
                if(!tourData) {
                    distance = distance + parseFloat(item.distance)
                    tour_count++
                }

            }
            // tour_count = count
        }
        let activeSessionData = {
            ...sessionData,
            no_tours: tour_count,
            total_distance: distance
        }
        return activeSessionData
    }

    async getDriverLatestSession(user_id: number): Promise<any> {
        let sessionData = await this.dsRepository.findOne({where: {user_id: user_id}, order: {id: 'DESC'}})
        return sessionData
    }

    async getClosedSession(user_id: number, session_date: any): Promise<any> {
        let created_at_date = new Date(moment(new Date(session_date)).format('YYYY-MM-DD'))
        let nextDay = new Date(created_at_date)
        nextDay.setDate(created_at_date.getDate()+1)
        const whereCond = {
            user_id: user_id, 
            session_start_time: Between(session_date, nextDay),
            is_closed_session: true
        }
        console.log("whereCond")
        console.log(whereCond)
        const closedSession = await this.dsRepository.findOne({where: whereCond, order:{id: 'DESC'}})
        return closedSession
    }

    async updateDriverSession(user_id: number) {
        const sessionData = await this.dsRepository.findOne({where: {user_id: user_id}, order: {id: 'DESC'}})
        if(sessionData) {
            const updateSession = await this.dsRepository.update({id: sessionData.id}, {status: false, session_end_time: moment(new Date())})
        }
        // await this.locService.calcDriverSessionDistance(user_id)
        return sessionData
    }

    async getLatestSessions(reqBody: any): Promise<any> {
        let sessions = []
        const exceptStatus = ['Completed']
        let whereCon: any = {}
        whereCon['user_id'] = reqBody.user_id;
        if(reqBody.session_date) {
            // whereCon['session_start_time'] = Like(`${reqBody.session_date}%`)
            let reached_date = moment(reqBody.session_date)
            let nextDay = moment(reached_date).add(1,'days');
            // nextDay.setDate(reached_date.getDate()+1)
            // console.log(reached_date, nextDay)
            // console.log(reached_date)
            // console.log(nextDay)
            whereCon["session_start_time"] = Between(reached_date, nextDay)
        }
        if(reqBody.driver_id) {
            whereCon['user_id'] = reqBody.driver_id
        }
        if(reqBody.paid) {
            whereCon['paid'] = reqBody.paid
        }
        const [items, count] = await this.dsRepository.findAndCount({where: whereCon, order:{id: 'DESC'}, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) })
        for (let sessionData of items) {
            let sDistances = await this.driverSessionDistance.find({where:{session_id: sessionData.id}})
            let distance = 0
            let no_tours = 0
            if(sDistances && sDistances.length) {
                for(let item of sDistances) {
                    let tourData = await this.toursEntity.findOne({where:{id: item.tour_id, status: Not(In(exceptStatus))}})
                    if(!tourData) {
                        distance = distance + parseFloat(item.distance)
                        no_tours++
                    }

                }
                // no_tours = sDistances.length
            }
            let session = {
                ...sessionData,
                total_distance: distance,
                no_tours: no_tours
            }
            sessions.push(session)
        }
        return {sessions, count}
    }

    async getAllSessions(reqBody: any): Promise<any> {
        let allSessions = []
        const exceptStatus = ['Completed']
        // const [items, count] = await this.dsRepository.findAndCount({order:{id: 'DESC'}, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) })
        const sessions = await this.dsRepository.createQueryBuilder("gs")
                            .leftJoinAndSelect("drivers", "d", "d.user_id=gs.user_id")
                            .leftJoinAndSelect("trucks", "t", "t.id=d.truck_id")
                            .leftJoinAndSelect("users", "u", "u.id=t.truck_owner_id")
                            .select(['gs.*, d.name as driver_name, d.mobile_number as driver_mobile, t.registration_number as vehicle_number, u.name as truck_owner_id'])
                            // .getSql()
                            .orderBy('id', 'DESC')
                            .limit(reqBody.limit)
                            .offset(reqBody.offset)
                            .getRawMany()
        
        for(let session of sessions) {
            let distance = 0
            let no_tours = 0
            let tour_ids = []
            let sDistances = await this.driverSessionDistance.find({where:{session_id: session.id}})
            if(sDistances && sDistances.length) {
                for(let item of sDistances) {
                    let tourData = await this.toursEntity.findOne({where:{id: item.tour_id, status: Not(In(exceptStatus))}})
                    if(!tourData) {
                        distance = distance + parseFloat(item.distance)
                        tour_ids.push(item.tour_id)
                        no_tours++
                    }

                }
                // no_tours = sDistances.length
            }
            // const tours_info = await this.locService.getToursIdsBySessionId(session.id)

            const trips_info = await this.locService.getTripsIdsByTourIdsId(tour_ids)
            let sessionData = {
                ...session,
                total_distance: distance,
                no_tours: no_tours,
                no_trips: trips_info.length
            }
            console.log(sessionData)
            allSessions.push(sessionData)
        }
        return allSessions
    }

    async updateDistance(user_id: number, distance: any) {
        const sessionData = await this.dsRepository.findOne({where: {user_id: user_id, status: true}, order: {id: 'DESC'}})
        if(sessionData) {
            const total_distance: any = parseFloat(sessionData.total_distance) + parseFloat(distance ? distance : 0)
            const updateSession = await this.dsRepository.update({id: sessionData.id}, {total_distance: total_distance, session_end_time: moment(new Date())})
        }
        return sessionData
    }

    async updateSession(id: number, reqBody: any): Promise<any> {
        const sessionData = await this.dsRepository.findOneBy({id});
        const lastFare = sessionData.final_fare;
        const updateSessionData = await this.dsRepository.update(id, reqBody)
        const session_start_time = moment(reqBody.session_start_time ? reqBody.session_start_time : sessionData.session_start_time)
        const session_end_time = moment(reqBody.session_end_time ? reqBody.session_end_time : sessionData.session_end_time)
        if(reqBody.final_fare != lastFare) {
            let driverData = await this.driverRepository.findOne({where:{user_id: sessionData.user_id}})
            await this.addDriverTransaction(driverData, lastFare, 'Debit', 'Edited Fare from Manager Interface for session '+id)
            driverData = await this.driverRepository.findOne({where:{user_id: sessionData.user_id}})
            await this.addDriverTransaction(driverData, parseInt(reqBody.final_fare), 'Credit', 'Edited Fare from Manager Interface for session '+id)
        }
        await this.updateSessionTours(sessionData.id, sessionData.user_id, session_start_time, session_end_time)
        return updateSessionData
    }

    async deleteSession(id: number): Promise<any> {
        const sessionData = await this.dsRepository.delete(id)
        return sessionData;
    }

    async addTruckerRate(reqBody: any): Promise<any> {
        const driverData = await this.driverRepository.findOneBy({user_id: reqBody.driver_id})
        if(driverData) {
            const truckData = await this.truckService.getTruck(driverData.truck_id)
            let truckerRateObj =  {
                "driver_id": reqBody.driver_id,
                "driver_name": driverData.name,
                "truck_id":  driverData.truck_id,
                "vehicle_no": truckData ? truckData.registration_number : '',
                "base_rate": reqBody.base_rate,
                "base_distance": reqBody.base_distance,
                "base_duration": reqBody.base_duration,
                "rate_per_km": reqBody.rate_per_km,
                "rate_per_hr": reqBody.rate_per_hr
            }
            const truckerRateData = await this.truckerRateRepo.save(truckerRateObj)
            return truckerRateData
        } else {

            return false
        }
    }

    async updateTruckerRate(driver_id: number, reqBody: any): Promise<any> {
        const driverData = await this.driverRepository.findOneBy({id: driver_id})
        if(driverData) {
            const truckData = await this.truckService.getTruck(driverData.truck_id)
            let truckerRateObj =  {
                "driver_name": driverData.name,
                "truck_id":  driverData.truck_id,
                "vehicle_no": truckData ? truckData.registration_number : '',
                "base_rate": reqBody.base_rate,
                "base_distance": reqBody.base_distance,
                "base_duration": reqBody.base_duration,
                "rate_per_km": reqBody.rate_per_km,
                "rate_per_hr": reqBody.rate_per_hr
            }
            const truckerRateData = await this.truckerRateRepo.update({driver_id: driver_id}, truckerRateObj)
            return truckerRateData
        } else {
            return false
        }
    }

    async truckersRateList(reqBody): Promise<any> {
        const [items, count] = await this.truckerRateRepo.findAndCount({order:{created_at: 'DESC'}, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) })
        return {items, count}
    }

    async driverPaymentCalculation(reqBody: any): Promise<any> {
        const paymentDate = reqBody.payment_date
        const reportDate = new Date(paymentDate)
        let nextDate = new Date(paymentDate)
        nextDate.setDate(nextDate.getDate() + 1)
        await this.truckerPaymentRepo.delete({payment_date: paymentDate})
        let driversList = await this.dsRepository.find({where: {session_start_time: Between(paymentDate, nextDate)}})
        let driverIds  = []
        for(let driver of driversList) {
            driverIds.push(driver.user_id)
        }
        driverIds = [...new Set(driverIds)]
        for(let driverId of driverIds) {
            let totalDistance = 0
            let totalTime = 0
            let totalPrice  = 0
            let notes = ''
            let sessions = await this.dsRepository.find({where: {user_id: driverId, session_start_time: Between(paymentDate, nextDate)}})
            let pay_start_time = sessions[0].session_start_time
            let pay_end_time = sessions[sessions.length - 1].session_end_time
            for(let sessionData of sessions)  {
                totalDistance = totalDistance + parseInt(sessionData.total_distance)
                let startTime = moment(sessionData.session_start_time)
                let endTime = moment(sessionData.session_end_time)
                let diff = endTime.diff(startTime, 'minutes');
                totalTime = totalTime + diff
            }
            let driverRatedata = await this.truckerRateRepo.findOneBy({driver_id: driverId})
            if(driverRatedata)  {
                totalPrice = driverRatedata.base_rate
                notes = notes + 'base rate ' + driverRatedata.base_rate +' '
                if(totalDistance > driverRatedata.base_distance) {
                    let cal_distance = totalDistance - driverRatedata.base_distance
                    totalPrice = totalPrice + (cal_distance * driverRatedata.rate_per_km)
                    notes = notes + 'distance ' + cal_distance + ', rate='+  driverRatedata.rate_per_km +' '
                }
                if(totalTime > driverRatedata.base_duration) {
                    let cal_time = totalTime - driverRatedata.base_duration
                    let cal_time_in_hrs = Math.ceil(cal_time/60)
                    totalPrice = totalPrice + (cal_time_in_hrs * driverRatedata.rate_per_hr)
                    notes = notes + 'duration ' + cal_time_in_hrs + ', rate='+  driverRatedata.rate_per_hr +' '
                }
            }
            let driverData = await this.driverRepository.findOneBy({id:driverId})
            const truckData = await this.truckService.getTruck(driverData.truck_id)
            let driverPaymentData: any= {
                driver_id: driverId,
                driver_name: driverData.name,
                owner_name: await this.utilsService.getName(driverData.truck_owner_id),
                truck_id: truckData ? truckData.registration_number : '',
                vehicle_no: driverData.name,
                start_time: pay_start_time,
                end_time: pay_end_time,
                payment_date: paymentDate,
                distance: totalDistance,
                duration: totalTime,
                amount: totalPrice,
                status: 'Pending',
                notes: notes
            }
            await this.truckerPaymentRepo.save(driverPaymentData)
        }
        return true
    } 

    async sendInactiveNotification(reqBody: any): Promise<any> {
        let data = []
        const drivers = await this.driverRepository.find()
        for(let driver of drivers) {
            // console.log(driver.user_id)
            let userDetials = await this.utilsService.getUserDetails(driver.user_id)
            if(userDetials && userDetials.is_available) {
                let start_time = moment(driver.last_notification_at)
                let last_captured_time = moment(driver.last_tracked_at)
                let end_time = moment()
                let last_diff = end_time.diff(start_time, 'minutes')
                let track_diff = end_time.diff(last_captured_time, 'minutes')
                // console.log(driver.last_notification_at, last_diff, track_diff)
                data.push({id:driver.user_id, last_time: start_time, last_diff, noe_time: end_time, track_diff})
                if(!driver.last_notification_at || (last_diff > 5 && track_diff > 5)) {
                    const userToken = userDetials.device_token
                    const TITLE = 'Alert!'
                    const BODY = 'We are currently unable to track you. Please ensure that the app is still running in the background.'
                    // await this.utilsService.sendPushNotification(TITLE, BODY, [userToken])
                    // console.log('notification sent to ',driver.name)
                    await this.driverRepository.update({id: driver.id}, {last_notification_at: new Date()})
                }
            }
        }
        return data
    }

    async calculateSessionFareWithScheme1(ratesData: any, distance: any, hours: any): Promise<any> {
        console.log("cal scheme1")
        let notes = ''
        let total_fare = ratesData.base_rate
        notes = notes + "base_rate = " + ratesData.base_rate + ", "
        if(distance > ratesData.base_distance) {
            let diff_distance = distance - ratesData.base_distance;
            total_fare = total_fare + (diff_distance * ratesData.rate_per_km)
            notes = notes + "total distance=" + distance + ", " + "distance diff = " + diff_distance + "*"+ratesData.rate_per_km+", "
        }
        if(hours > ratesData.base_duration) {
            let diff_hours = hours - ratesData.base_duration;
            total_fare = total_fare + (diff_hours * ratesData.rate_per_hr)
            notes = notes + "total hrs=" + hours + ", " + "hrs diff = " + diff_hours + "*"+ratesData.rate_per_hr+", "
        }
        console.log(total_fare)
        console.log(notes)
        total_fare = Math.ceil(total_fare)
        return {total_fare, notes}
    }

    async calculateSessionFareWithScheme2(ratesData: any, distance: any, hours: any): Promise<any> {
        let notes = ''
        let total_distance = distance
        // let total_distance = 20
        let total_fare = ratesData.base_rate
        notes = notes + "base_rate = " + ratesData.base_rate + ", "
        let schemeDistanceData = ratesData.rate_per_km.split(",")
        notes = notes + "total distance=" + distance + ", "
        for(let schemeDistance of schemeDistanceData) {
            if(total_distance > 0) {
                let schemeData = schemeDistance.split(":")
                let nextDistance = schemeData[0]
                let nextRate = schemeData[1]
                let cal_distance = total_distance - nextDistance
                if(total_distance >= nextDistance) {
                    total_fare = total_fare + (nextDistance * nextRate)
                    notes = notes + "dis diff = " + nextDistance + "*"+nextRate+", "
                } else {
                    total_fare = total_fare + (total_distance * nextRate)
                    notes = notes + "dis diff = " + total_distance + "*"+nextRate+", "
                }
                
                total_distance = total_distance - nextDistance
            }
            
        }
        if(total_distance > 0) {
            total_fare = total_fare + total_distance * schemeDistanceData[schemeDistanceData.length - 1].split(":")[1]
            notes = notes + "dis diff = " + total_distance + "*"+schemeDistanceData[schemeDistanceData.length - 1].split(":")[1]+", "
        }
        if(hours > ratesData.base_duration) {
            let diff_hours = hours - ratesData.base_duration;
            total_fare = total_fare + (diff_hours * ratesData.rate_per_hr)
            notes = notes + "total hrs=" + hours + ", " + "hrs diff = " + diff_hours + "*"+ratesData.rate_per_hr+", "
        }
        console.log(total_fare)
        console.log(notes)
        total_fare = Math.ceil(total_fare)
        return {total_fare, notes}
    }

    async calculateSessionFareWithScheme3(ratesData: any, distance: any, hours: any): Promise<any> {
        console.log("cal scheme1")
        let notes = ''
        let total_fare = ratesData.base_rate
        notes = notes + "base_rate = " + ratesData.base_rate + ", "
        if(hours > ratesData.base_duration) {
            let diff_hours = hours - ratesData.base_duration;
            diff_hours = Math.round(diff_hours*100)/100
            total_fare = total_fare + (diff_hours * ratesData.rate_per_hr)
            notes = notes + "total hrs=" + hours + ", " + "hrs diff = " + diff_hours + "*"+ratesData.rate_per_hr+", "
        }
        console.log(total_fare)
        console.log(notes)
        total_fare = Math.ceil(total_fare)
        return {total_fare, notes}
    }

    async addDriverTransaction(driverData: any, amount: number, transaction_type: string, notes: string, ref_file: string = '', trans_date: string = ''): Promise<any> {
        let balance = 0
        if(transaction_type == 'Credit') {
            balance = (driverData.wallet ? driverData.wallet : 0) + (amount ? amount : 0);
        } else {
            balance = (driverData.wallet ? driverData.wallet : 0) - (amount ? amount : 0);
        }
        const transaction_date = trans_date ? trans_date : moment().tz('Asia/Calcutta').format('YYYY-MM-DD')
        const transaction_date_time = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss')
        console.log("transaction date ", transaction_date, trans_date)
        const driverTransaction = {
            driver_id: driverData.id,
            user_id: driverData.user_id,
            driver_name: driverData.name,
            transaction_type,
            amount,
            balance,
            transaction_date,
            transaction_date_time,
            notes,
            ref_file
        }
        await this.driverTransactions.save(driverTransaction)
        await this.driverRepository.update({id: driverData.id}, {wallet: balance})
        return true
    }
    async calculateSessionFare(sessionId: number): Promise<any> {
        let distance = 0;
        let duration = 0;
        let schemeType = 'scheme2';
        let truckType = 'Dost';
        let total_fare = 0
        let notes = ''
        console.log("step 3")
        let sessionData = await this.dsRepository.findOneBy({id: sessionId})
        console.log(sessionData)
        if(sessionData.session_end_time) {
            console.log("step 4")
            let [items] = await this.driverSessionDistance.findAndCount({where:{session_id: sessionData.id}})
            for(let item of items) {
                distance = distance + parseFloat(item.distance)
            }
            let start_time = moment(sessionData.session_start_time)
            let end_time = moment(sessionData.session_end_time)
            let duration_time = moment.duration(end_time.diff(start_time));
            let hours: any = duration_time.asHours();
            let driverData = await this.driverRepository.findOne({where: {user_id: sessionData.user_id}})
            if(driverData && driverData.scheme_name) {
                schemeType = driverData.scheme_name
                console.log("truck id", driverData.truck_id)
                const truckData = await this.truckService.getTruck(driverData.truck_id)
                if(truckData && truckData.vehicle_type) {
                    truckType = truckData.vehicle_type
                }
            }
            distance = Math.ceil(distance);
            // hours = Math.ceil(hours)
            // hours = Math.round(hours*100)/100
            hours = hours.toFixed(2)
            let fareData: any = {
                total_fare: 0,
                notes: 'No distance travelled'
            }
            console.log({scheme_name: schemeType, truck_type: truckType})
            let ratesData = await this.driverRates.findOne({where:{scheme_name: schemeType, truck_type: truckType}})
            console.log(ratesData)
            console.log(distance)
            console.log(hours)
            if(distance > 0) {
                if(schemeType == 'scheme1') {
                    fareData = await this.calculateSessionFareWithScheme1(ratesData, distance, hours)
                } else if(schemeType == 'scheme2') {
                    fareData = await this.calculateSessionFareWithScheme2(ratesData, distance, hours)
                } else if(schemeType == 'scheme3') {
                    fareData = await this.calculateSessionFareWithScheme3(ratesData, distance, hours)
                }
            }
            
            let updSessionData = await this.dsRepository.update({id: sessionId}, {total_distance: distance.toString(), total_time: hours, fare: fareData.total_fare, final_fare: fareData.total_fare, notes: fareData.notes})
            // await this.addDriverTransaction(driverData, fareData.total_fare, 'Credit', 'For Session '+sessionData.id)
            console.log("step 5")
            console.log({total_distance: distance.toString(), total_time: hours, fare: fareData.total_fare, final_fare: fareData.total_fare, notes: fareData.notes})
        }
        
        return true
    }
    async updateSessionFare(reqBody: any): Promise<any> {
        let updSessionData = await this.dsRepository.update({id: reqBody.sessionId}, {final_fare: reqBody.total_fare})
        return updSessionData
    }

    async updateUserLogin(user, is_available): Promise<any> {
        let latestLoc = await this.locationsRepo.findOne({where:{user_id: user.id}, order: {id:'DESC'}})
        if(latestLoc) {
            if(is_available) {
                const rndInt = Math.floor(Math.random() * 5) + 1
                setTimeout(async () => {
                    let userLogData = await this.userLoginRepo.findOne({where:{user_id: user.id}, order: {id: "DESC"}})
                    if(!userLogData || userLogData.loggedout_time) {
                        let reqObj = {
                            user_id: user.id,
                            login_latitude: latestLoc.latitude,
                            login_longitude: latestLoc.longitude,
                            login_location: latestLoc.location,
                            log_date: moment(new Date()).format('YYYY-MM-DD'),
                            loggedin_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                        }
                        await this.userLoginRepo.save(reqObj)
                    }
                }, 1000*rndInt)
                
            } else {
                let userLogData = await this.userLoginRepo.findOne({where:{user_id: user.id}, order: {id: "DESC"}})
                if(userLogData && !userLogData.loggedout_time) {
                    let updObj = {
                        logout_latitude: latestLoc.latitude,
                        logout_longitude: latestLoc.longitude,
                        logout_location: latestLoc.location,
                        loggedout_time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                    }
                    await this.userLoginRepo.update({id: userLogData.id}, updObj)
                }
            }
        }
        return true
    }

    async updateAvailable(mobile: string, is_available: boolean): Promise<any> {
        const userData = await this.usersRepository.findOneBy({mobile: mobile})
        if(userData.status != 'DarkRoom') {
            let user = await this.usersRepository.update({mobile}, {"is_available": is_available})
            await this.updateUserLogin(userData, is_available)
            let TITLE = 'Hello #'
            let BODY = ''
            if(!is_available) {
                console.log("step 1")
                console.log(userData.id)
                BODY= 'Your tours have been completed. Thank you for your co-operation. Have a good day!'
                let sessionData = await this.utilsService.closeSession(userData.id)
                console.log("step 2")
                console.log(sessionData)
                if(sessionData) {
                    await this.calculateSessionFare(sessionData.id)
                }
                await this.driverLastLocRepo.delete({driver_id: userData.id})
            } else {
                BODY = 'You will be assigned tours shortly. Have a good day!';
            }
            if(userData.device_token) {
                TITLE = TITLE + userData.name
                const userToken = userData.device_token ? userData.device_token.split(",") : ''
                await this.utilsService.sendPushNotification(TITLE, BODY, userToken)
                    
            }
            return user;
        } else {
            return false
        }
    }
    async updateAvailableById(user_id: number, is_available: boolean, from_manager: boolean = false): Promise<any> {
        const userData = await this.usersRepository.findOneBy({id: user_id});
        if(userData.status != 'DarkRoom') {
            let user = await this.usersRepository.update({id: user_id}, {"is_available": is_available})
            if(!from_manager) {
                await this.updateUserLogin(userData, is_available)
            }
            
            let TITLE = 'Hello #'
            let BODY = ''
            if(!is_available) {
                BODY= 'Your tours have been completed. Thank you for your co-operation. Have a good day!'
                let sessionData = await this.utilsService.closeSession(user_id, from_manager)
                if(sessionData) {
                    await this.calculateSessionFare(sessionData.id)
                }
                await this.driverLastLocRepo.delete({driver_id: userData.id})
            } else {
                BODY = 'You will be assigned tours shortly. Have a good day!';
                
            }
            if(userData.device_token && !from_manager) {
                TITLE = TITLE + userData.name
                const userToken = userData.device_token ? userData.device_token.split(",") : ''
                await this.utilsService.sendPushNotification(TITLE, BODY, userToken)
            }
            return user;
        } else {
            return false
        }
    }
    async payDriverFare(file: any): Promise<any> {
        const schema = {
          'Driver user id': {
            prop: 'driver_id'
          },	
          'AMOUNT': {
            prop: 'amount'
          }
        }
        let data = await readXlsxFile(file.buffer, {schema})
        // console.log(data)
        if(data.rows.length) {
            const { originalname } = file;
            const bucketS3 = this.configService.get('CUSTOMER_RECEIPTS_BUCKET_NAME');
            const uploadedData: any = await this.uploadS3(file.buffer, bucketS3, originalname);
            const file_location = uploadedData.Location;
            for (let row of data.rows) {
                // console.log(row)
                    
                    console.log(row)
                    const driverId = row['driver_id'] as number
                    let driverData = await this.driverRepository.findOne({where:{id: driverId}})
                    if(driverData) {
                        const amount = row['amount'] as string
                        await this.addDriverTransaction(driverData, parseInt(amount), 'Debit', 'From Manager Interface', file_location)
                    }
                    
                    // console.log(html)
                    
            }
        }
        
        // await fs.unlinkSync(filePath)
        return true
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

    async getDriverTransactions(reqBody: any): Promise<any> {
        let whereCond = {};
        if(reqBody.driver_id) {
            whereCond['user_id'] = reqBody.driver_id
        }
        let [items, count] = await this.driverTransactions.findAndCount({where:whereCond, order:{id: 'DESC'}, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10)})
        return {items, count}
    }

    async getDriverCumulativeEarnings(reqBody: any): Promise<any> {
        let totalEarnings = 0
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const dateStr = moment(firstDay).format('YYYY-MM')
        console.log("dateStr")
        console.log(dateStr)
        let transactions = await this.driverTransactions.find({where: {user_id: reqBody.user_id, transaction_date: Like(`${dateStr}%`)}})
        for(let transaction of transactions) {
            console.log(transaction.amount)
            totalEarnings += transaction.amount
        }
        return totalEarnings
    }

    async getLatestTourCompleteTime(driver_id: number, tourId = 0): Promise<any> {
        let sessionCloseTime = ''
        let whereCond: any = {driver_id: driver_id}
        if(tourId) {
            whereCond['id'] = LessThan(tourId)
        }
        console.log(whereCond)
        let latestTour = await this.toursEntity.findOne({where: whereCond, order: {id: 'DESC'}})
        if(latestTour) {
            if(latestTour.status == 'Rejected') {
                sessionCloseTime = await this.getLatestTourCompleteTime(driver_id, latestTour.id)
            } else {
                sessionCloseTime = latestTour.complete_time
            }
            
        } else {
            console.log(driver_id, ' ********')
        }
        return sessionCloseTime;
    }

    async autoSessionClose(): Promise<any> {
        const exceptStatus = ['Completed', 'Rejected'];
        let notes = ''
        const activeSessions = await this.dsRepository.find({where: {status: true}});
        // const activeSessions = await this.dsRepository.find({where: {id: 218}});
        console.log("active sessions lenght ",activeSessions.length)
        notes = notes + "active sessions lenght " + activeSessions.length + " ==== "
        try {
            for(let activeSession of activeSessions) {
                console.log(activeSession.user_id, activeSession.id)
                let sessionCloseTime = ''
                let activeTours = await this.toursEntity.find({where:{driver_id: activeSession.user_id, status: Not(In(exceptStatus))}})
                if(!activeTours.length) {
                    sessionCloseTime = await this.getLatestTourCompleteTime(activeSession.user_id)
                }
                if(sessionCloseTime) {
                    const finalCloseTime = moment(new Date(sessionCloseTime)).subtract({hours: 5, minutes: 30}).format('YYYY-MM-DD HH:mm:ss')
                    console.log("sess upd ", activeSession.id, finalCloseTime)
                    notes = notes + "sess upd " + activeSession.id + finalCloseTime + " ---- "
                    await this.dsRepository.update({id: activeSession.id}, {session_end_time: finalCloseTime, updated_at: new Date()})
                    await this.updateAvailableById(activeSession.user_id, false, true);
                    // un comment below line to calculate session fare
                    // this.calculateSessionFare(activeSession.id)
                }
            }
            return notes
        } catch(e) {
            return false
        }
        
        // console.log(activeSessions)
    }

    async driverMonthlyFare(): Promise<any> {
        const monthNames = ['Jan', 'Feb', 'March', 'April', 'May', 'June', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let date = new Date();
        let monthNum = date.getMonth();
        let yearNum = date.getFullYear();
        let dateStr = ""
        console.log("monthNum")
        console.log(monthNum)
        let schemeType = 'scheme3';
        if(monthNum == 0) {
            yearNum = yearNum-1
            monthNum = 12
        }
        dateStr = yearNum+"-"+monthNum+"-";
        console.log("monthNum", monthNum, yearNum)
        
        const [items, count] = await this.driverRepository.findAndCount({where: {scheme_name: schemeType}})
        
        if(count) {
            for(let driverData of items) {
                console.log(driverData)
                let driverTravelledDistance = 0;
                let truckType = 'Dost';
                let whereCon = {
                    user_id: driverData.user_id,
                    session_date: Like(`${dateStr}%`)
                }
                let ratesData = await this.driverRates.findOne({where:{scheme_name: schemeType, truck_type: truckType}})
                let sessionsSummary = await this.dssRepo.find({where: whereCon})
                if(sessionsSummary.length) {
                    for(let sess of sessionsSummary) {
                        if(ratesData.base_distance > parseInt(sess.total_distance)) {
                            let dis = ratesData.base_distance - parseInt(sess.total_distance)
                            driverTravelledDistance += dis
                        }
                        
                    }
                }
                if(driverData && driverData.scheme_name && driverTravelledDistance) {
                    schemeType = driverData.scheme_name
                    console.log("truck id", driverData.truck_id)
                    const truckData = await this.truckService.getTruck(driverData.truck_id)
                    if(truckData && truckData.vehicle_type) {
                        // truckType = truckData.vehicle_type
                    }
                    
                    console.log("ratesData")
                    console.log(ratesData)
                    console.log(truckType)
                    if(driverTravelledDistance > 0) {
                        let fare = driverTravelledDistance * parseInt(ratesData.rate_per_km)
                        await this.addDriverTransaction(driverData, fare, 'Credit', 'For Month '+monthNames[monthNum-1]+", year "+yearNum)
                    }
                    // let noDays = new Date(yearNum, monthNum, 0).getDate();
                    // console.log(noDays)
                    // console.log(typeof noDays)
                    // let total_distance_travelled = noDays*ratesData.base_distance
                    // console.log(total_distance_travelled)
                    // if(driverTravelledDistance > total_distance_travelled) {
                    //     let cal_distance = driverTravelledDistance - total_distance_travelled;
                    //     let fare = cal_distance * parseInt(ratesData.rate_per_km)
                    //     await this.addDriverTransaction(driverData, fare, 'Credit', 'For Month '+monthNames[monthNum-1]+", year "+yearNum)
                    // }
                }
                
            }
        } else {
            return false
        }
    }

    async calculateDriverFareById(driverId: number, calc_date): Promise<any> {
        let distance = 0;
        let duration = 0;
        let schemeType = 'scheme2';
        let truckType = 'Dost';
        let revenue = 0
        let additional_fare_comments = ''
        let additional_loading_fare = 0; //bookings loading charges
        let additional_toll_fare = 0; //bookings toll charges
        let session_ids = ''
        let fareData: any = {
            total_fare: 0,
            notes: 'No distance travelled'
        }
        let tourId_notes = ' tour ids = '
        let no_local_trips = 0;
        let no_long_haul_trips = 0;
        let session_date = calc_date
        let created_at_date = new Date(moment(new Date(session_date)).format('YYYY-MM-DD'))
        let nextDay = new Date(created_at_date)
        nextDay.setDate(created_at_date.getDate()+1)
        const whereCond = {
            session_start_time: Between(session_date, nextDay),
            user_id: driverId
        }
        // console.log(whereCond)
        let sessions = await this.dsRepository.find({where: whereCond})
        let driverData = await this.driverRepository.findOne({where: {user_id: driverId}})
        if(driverData && driverData.scheme_name) {
            schemeType = driverData.scheme_name
            console.log("truck id", driverData.truck_id)
            const truckData = await this.truckService.getTruck(driverData.truck_id)
            if(truckData && truckData.vehicle_type) {
                truckType = truckData.vehicle_type
            }
        }
        // console.log("sessions")
        // console.log(sessions)
        if(sessions.length) {
            for(let session of sessions) {
                session_ids += session.id + ", ";
                let sessionData = await this.dsRepository.findOneBy({id: session.id})
                if(sessionData.status) {
                    break;
                }
                if(sessionData.session_end_time) {
                    console.log("step 4")
                    let [items] = await this.driverSessionDistance.findAndCount({where:{session_id: sessionData.id}})
                    let dis = 0;
                    let tourIdsData = {}
                    for(let item of items) {
                        if(!tourIdsData[item.tour_id]) {
                            tourId_notes += ' '+item.tour_id;
                            dis = dis + parseFloat(item.distance)
                            console.log("distance ====", item.distance, sessionData.id, item.id)
                            let tr = await this.tourRouteRepo.find({where: {tour_id: item.tour_id}})
                            let bookingIds = []
                            for(let t of tr) {
                                if(t.booking_id != 1) {
                                    bookingIds.push(t.booking_id)
                                }
                            }
                            let bookings = await this.bookingRepo.find({where: {id: In(bookingIds)}})
                            for(let booking of bookings) {
                                if(typeof booking.fare != 'string' && booking.fare) {
                                    console.log("typeof booking.fare")
                                    console.log(typeof booking.fare)
                                }
                                console.log("typeof booking.fare")
                                console.log(typeof booking.fare)
                                let customer_company_details: any = await this.companyRepo.findOne({where:{users: Like((`%#${booking.customer_id},%`))}})
                        
                                // revenue += (typeof booking.fare != 'string' && booking.fare) ? parseInt(booking.fare) : 0
                                revenue += booking.fare ? parseInt(booking.fare) : 0
                                // revenue += booking.waiting_charge ? parseInt(booking.waiting_charge) : 0
                                revenue += booking.loading_charge ? booking.loading_charge : 0
                                revenue += booking.toll_charges ? booking.toll_charges : 0
                                if(customer_company_details && customer_company_details.discount_on_waiting_charges && booking.waiting_charge) {
                                    let waiting_charge = parseInt(booking.waiting_charge);
                                    const dicounted_waiting_charge = waiting_charge - Math.ceil(((customer_company_details.discount_on_waiting_charges/100) * waiting_charge)) 
                                    revenue += dicounted_waiting_charge
                                } else {
                                    revenue += booking.waiting_charge ? parseInt(booking.waiting_charge) : 0
                                }
                                console.log("revenue ", booking.id, revenue)
                                additional_loading_fare += booking.loading_charge ? booking.loading_charge : 0
                                
                                additional_toll_fare += booking.toll_charges ? booking.toll_charges : 0
                                /*if(parseFloat(booking.total_distance) <= 4) {
                                    no_local_trips += 1
                                } else {
                                    no_long_haul_trips += 1
                                }*/
                            }
                            tourIdsData[item.tour_id] = 1;
                            if(parseFloat(item.distance) <= 4) {
                                no_local_trips += 1
                            } else {
                                no_long_haul_trips += 1
                            }

                        }
                        
                    }
                    let start_time = moment(sessionData.session_start_time)
                    let end_time = moment(sessionData.session_end_time)
                    let duration_time = moment.duration(end_time.diff(start_time));
                    let hours = duration_time.asHours();
                    
                    distance += Math.ceil(dis);
                    duration += Math.round(hours*100)/100
                    
                    // console.log({scheme_name: schemeType, truck_type: truckType})
                    
                }
            }
            let ratesData = await this.driverRates.findOne({where:{scheme_name: schemeType, truck_type: truckType}})
            console.log(ratesData)
            console.log(distance)
            console.log({scheme_name: schemeType, truck_type: truckType})
            // if(distance > 0) {
                if(schemeType == 'scheme1') {
                    fareData = await this.calculateSessionFareWithScheme1(ratesData, distance, duration)
                } else if(schemeType == 'scheme2') {
                    fareData = await this.calculateSessionFareWithScheme2(ratesData, distance, duration)
                } else if(schemeType == 'scheme3') {
                    fareData = await this.calculateSessionFareWithScheme3(ratesData, distance, duration)
                }
            // }
        }
        additional_fare_comments += " additional_loading_fare = " + additional_loading_fare + ", additional_toll_fare = "+additional_toll_fare;
        additional_fare_comments += ", " +tourId_notes
        const totalDriverPayout = fareData.total_fare + additional_loading_fare + additional_toll_fare
        let dssData: any = {
            user_id: driverId,
            driver_name: driverData.name,
            session_date: session_date,
            session_ids: session_ids,
            total_time: Math.ceil(duration),
            total_distance: distance,
            paid: false,
            fare: Math.ceil(totalDriverPayout),
            total_revenue: revenue,
            local_trips: no_local_trips,
            long_haul_trips: no_long_haul_trips,
            notes: fareData.notes + additional_fare_comments
        }
        console.log(dssData)
        await this.dssRepo.delete({session_date: session_date, user_id: driverId})
        await this.dssRepo.save(dssData);
        const summaryNotes = "session ids "+session_ids + ":"+Math.ceil(duration)+":"+distance
        await this.addDriverTransaction(driverData, fareData.total_fare, 'Credit', summaryNotes, '', session_date)
        console.log(fareData.total_fare, 'Credit', summaryNotes, '', session_date)
        return fareData
    }

    async driverSessionSummary(reqBody: any): Promise<any> {
        let session_date = reqBody.calc_date
        let created_at_date = new Date(moment(new Date(session_date)).format('YYYY-MM-DD'))
        let nextDay = new Date(created_at_date)
        nextDay.setDate(created_at_date.getDate()+1)
        const whereCond = {
            session_start_time: Between(session_date, nextDay),
        }
        let sessions = await this.dsRepository.find({where: whereCond})
        let driverIds = {}
        let nonClosedDrivers = []
        console.log("sessions.length")
        console.log(sessions.length)
        if(sessions.length) {
            for(let session of sessions) {
                if(!driverIds[session.user_id]) {
                    driverIds[session.user_id] = []
                }
                if(session.status == true) {
                    nonClosedDrivers.push(session.user_id)
                }
                driverIds[session.user_id].push(session)
            }
            console.log(Object.keys(driverIds))
            console.log(nonClosedDrivers)
            for(let driverId of Object.keys(driverIds)) {
                if(nonClosedDrivers.indexOf(parseInt(driverId)) < 0) {
                    await this.calculateDriverFareById(parseInt(driverId), session_date)
                }
                
            }
            return true
        } 
        return false
    }

    async getDriverSessionSummary(reqBody): Promise<any> {
        let whereCond: any = {}
        if(reqBody.driver_id) {
            whereCond['user_id'] = reqBody.driver_id
        }
        if(reqBody.session_date) {
            whereCond['session_date'] = reqBody.session_date
        }
        const [items, count] = await this.dssRepo.findAndCount({where: whereCond, order:{created_at: 'DESC'}, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) })
        return {items, count}
    }

    async getDriverSummaryReport(reqBody): Promise<any> {
        let summaryDate = reqBody.calc_date
        console.log(reqBody)
        let driverRows = ''
        // let tRow = `<tr style="height:16pt">
        //                     <td style="width:40pt">
        //                         <p class="param-text">{{index}}</p>
        //                     </td>
        //                     <td style="width:40pt">
        //                         <p class="param-text">{{id}}</p>
        //                     </td>
        //                     <td style="width:120pt">
        //                         <p class="param-text">{{driverName}}</p>
        //                     </td>
        //                     <td style="width:50pt">
        //                         <p class="param-text">{{payout}}</p>
        //                     </td>
        //                     <td style="width:60pt">
        //                         <p class="param-text">{{revenue}}</p>
        //                     </td>
        //                     <td style="width:50pt">
        //                         <p class="param-text">{{distance}}</p>
        //                     </td>
        //                     <td style="width:50pt">
        //                         <p class="param-text">{{time}}</p>
        //                     </td>
        //                 </tr>`;
        let tRow = `<tr>
                    <td>{{index}}</td>
                    <td>{{id}}</td>
                    <td>{{driverName}}</td>
                    <td>{{payout}}</td>
                    <td>{{revenue}}</td>
                    <td>{{distance}}</td>
                    <td>{{time}}</td>
                    <td>{{ltrips}}</td>
                    <td>{{lhtrips}}</td>
                </tr>`
        let index = 1;
        let whereCond = {
            session_date: summaryDate
        }
        const driversData = await this.dssRepo.find({where: whereCond, order:{created_at: 'DESC'}})
        console.log(driversData.length)
        if(driversData && driversData.length) {
            for(let driver of driversData) {
                let driverRow = tRow
                driverRow = driverRow.replace("{{index}}", index.toString())
                driverRow = driverRow.replace("{{id}}", driver.user_id.toString())
                driverRow = driverRow.replace("{{driverName}}", driver.driver_name)
                driverRow = driverRow.replace("{{payout}}", driver.fare.toString())
                driverRow = driverRow.replace("{{revenue}}", driver.total_revenue.toString())
                driverRow = driverRow.replace("{{distance}}", parseInt(driver.total_distance).toString())
                driverRow = driverRow.replace("{{time}}", driver.total_time.toString())
                driverRow = driverRow.replace("{{ltrips}}", (driver.local_trips ? driver.local_trips : 0).toString())
                driverRow = driverRow.replace("{{lhtrips}}", (driver.long_haul_trips ? driver.long_haul_trips : 0).toString())
                driverRows += driverRow 
                index++
            }
            
                    
            const pdfOptions: any = {
                childProcessOptions: {
                    env: {
                        OPENSSL_CONF: '/dev/null',
                    },
                },
                // "height": "297mm",        // allowed units: mm, cm, in, px
                // "width": "210mm", 
                // "format": "A4",        // allowed units: A3, A4, A5, Legal, Letter, Tabloid
                // "orientation": "portrait",
                "format": "A4",        // allowed units: A3, A4, A5, Legal, Letter, Tabloid
                "orientation": "landscape", // portrait or landscape
                "border": {
                    "top": "10mm",            // default is 0, units: mm, cm, in, px
                    // "right": "10mm",
                    "bottom": "10mm",
                    // "left": "10mm"
                },
                // "header": {
                //     "height": "10mm",
                //     "contents": {
                //         2: `<table><thead><tr>
                //                 <th style="width: 7%;">S No</th>
                //                 <th style="width: 8%;">ID</th>
                //                 <th style="width: 20%;">Name</th>
                //                 <th style="width: 9%;">Payout</th>
                //                 <th style="width: 10%;">Revenue</th>
                //                 <th style="width: 10%;">Distance</th>
                //                 <th style="width: 7%;">Time</th>
                //                 <th style="width: 12%;">Local Trips</th>
                //                 <th style="width: 17%;">Long Hault trips</th>
                //             </tr></thead></table>`
                //     }
                // },

            }
            let data =[]
            // //console.log(data)
            // for await (let row of data.rows) {
                // //console.log(row)
                    
            var template = './public/dds_new.html'
            var pdf_path = './public/drivers_day_report_'+summaryDate+'.pdf'
            // //console.log(template)
            var html = fs.readFileSync(template, 'utf8');
            
            html = html.replace('{{DRIVERS_DATA}}', driverRows)
            html = html.replace('{{SUMMARY_DATE}}', summaryDate)
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
                        path: pdf_path // stream this file
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
                    fs.unlinkSync(pdf_path);
                    resolve(info)
                });
            })
            await sendMailFun(mailOptions)
        }
        
        return true
    }

    

    async calculateSessionFareManual(): Promise<any> {
        let sessionIds = []
        sessionIds = [6144,
            6143,
            6142,
            6141,
            6140,
            6139,
            6138,
            6137,
            6136,
            6135,
            6134,
            6133,
            6132,
            6131];
        for(let sessionId of sessionIds) {
            console.log("sessionId", sessionId)
            await this.calculateSessionFare(sessionId)
        }
        return true
    }

    async getDriverSummaryMetrix(reqBody): Promise<any> {
        let summaryDate = reqBody.calc_date
        console.log(reqBody)
        
        let index = 1;
        let whereCond = {
            session_date: Between('2025-12-01', '2026-02-28')
        }
        const driversData = await this.dssRepo.find({where: whereCond, order:{created_at: 'ASC'}})
        let bString = "";
        const reportFileName= './public/driver_summary_metrics.csv';
        const headerData = ['Date', 'Driver Name', 'Total Distance', 'Total Time', 'Revenue', 'Fare']
        for(let i=0; i<headerData.length; i++){
            bString += headerData[i] + ","
        }
        bString += '\n'
        if(driversData && driversData.length) {
            for(let bkg of driversData) {
                bString += bkg.session_date + "," + bkg.driver_name + "," + bkg.total_distance + "," + bkg.total_time + "," + bkg.total_revenue + "," + bkg.fare + '\n'
                console.log(bString)
            }
            await fs.writeFileSync(reportFileName, bString, 'utf8')
            
        }
    } 
    
}
