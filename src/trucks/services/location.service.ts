import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Point } from 'geojson';
import { BookingEntity } from 'src/bookings/models/booking.entity';
import { TripEntity } from 'src/bookings/models/trip.entity';
import { ToursEntity } from 'src/tours/models/tours.entity';
import { UtilsService } from 'src/utils/services/utils.service';
import { Between, In, IsNull, LessThanOrEqual, Like, MoreThan, MoreThanOrEqual, Not, Repository } from 'typeorm';
import { DriversEntity } from '../models/driver.entity';
import { LocationsEntity } from '../models/locations.entity';
import { BaseLocationsEntity } from 'src/admin/models/baseLocations.entity';
import * as moment from 'moment';
import { BookingStatusEntity } from 'src/bookings/models/bookingStatus.entity';
import { DriverSessionsEntity } from '../models/driverSessions.entity';
import { TourRouteEntity } from 'src/tours/models/tourRoute.entity';
import { TruckService } from './truck.service';
import * as pdf from 'html-pdf'
import * as fs from 'fs'
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer'
import { DriverTripFareDetailsEntity } from '../models/driverTripFareDetails';
import { CustomerCompanyEntity } from '../models/cusomerCompanyDetails';
import { RateDetailsEntity } from '../models/gmRates';
import puppeteer from 'puppeteer';
import { ShopService } from './shop.service';
import { DriverSessionDistanceEntity } from '../models/driverSessionDistance.entity';
import { CustomerAddressEntity } from 'src/users/models/customerAddress.entity';
import { VolumeRateDetailsEntity } from '../models/gmVolumeRates';
import { SpecialAddressEntity } from 'src/users/models/specialAddress.entity';
import { CustomerAddressRatesEntity } from '../models/customerAddressRates.entity';
import { DriverLastLocationDetails } from '../models/driverLastLocDetails';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from 'src/common/redis/redis.provider';

// import haversine from 'haversine-distance'
// import HaversineGeolocation from 'haversine-geolocation';
const haversine = require('haversine')

var mail = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});



@Injectable()
export class LocationService {
    baseFareCompanies=""
    deamMilesLimit=0
    defaultRates = {
        id:1,
        company_name: 'Default',
        users: '1,',
        return_percentage: 80,
        return_percentage_value: 0.9,
        min_base_fare: 180,
        extra_charge_percentage: 0,
        additional_pickup_charge: 150,
        is_active: true,
        dead_miles_price: 14,
        waiting_charge_type: 'T1'
    }
    globalTollCharge = 125;
    constructor(
        @InjectRepository(LocationsEntity)
        private locationsRepo: Repository<LocationsEntity>,
        @InjectRepository(ToursEntity)
        private toursEntity: Repository<ToursEntity>,
        @InjectRepository(DriversEntity)
        private driverRepo: Repository<DriversEntity>,
        @InjectRepository(TourRouteEntity)
        private tourRouteRepo: Repository<TourRouteEntity>,
        @InjectRepository(BookingEntity)
        private bookingRepository: Repository<BookingEntity>,
        @InjectRepository(TripEntity)
        private tripRepo: Repository<TripEntity>,
        @InjectRepository(BookingStatusEntity)
        private bsRepo: Repository<BookingStatusEntity>,
        @InjectRepository(DriverSessionsEntity)
        private dsRepository: Repository<DriverSessionsEntity>,
        @InjectRepository(DriverTripFareDetailsEntity)
        private driverTripFareDetails: Repository<DriverTripFareDetailsEntity>,
        @InjectRepository(CustomerCompanyEntity)
        private customerCompanyDetails: Repository<CustomerCompanyEntity>,
        @InjectRepository(RateDetailsEntity)
        private gmRates: Repository<RateDetailsEntity>,
        @InjectRepository(VolumeRateDetailsEntity)
        private gmVolumeRates: Repository<VolumeRateDetailsEntity>,
        @InjectRepository(DriverSessionDistanceEntity)
        private driverSessionDistance: Repository<DriverSessionDistanceEntity>,
        @InjectRepository(CustomerAddressEntity)
        private customerAddressRepo: Repository<CustomerAddressEntity>,
        @InjectRepository(SpecialAddressEntity)
        private splAddressRepo: Repository<SpecialAddressEntity>,
        @InjectRepository(CustomerAddressRatesEntity)
        private splCustRatesRepo: Repository<CustomerAddressRatesEntity>,
        @InjectRepository(BaseLocationsEntity)
        private baseLocationsRepo: Repository<BaseLocationsEntity>,
        @InjectRepository(DriverLastLocationDetails)
        private driverLastLocRepo: Repository<DriverLastLocationDetails>,
        @Inject(REDIS_CLIENT) private redis: Redis,
        private utilsService: UtilsService,
        private truckService: TruckService,
        private configService: ConfigService,
        private shopService: ShopService
    ) {
        
        this.baseFareCompanies = process.env.ENV == 'test' ? this.configService.get('TEST_COMPANIES_BASE_FARE') : this.configService.get('PROD_COMPANIES_BASE_FARE')
        this.deamMilesLimit = this.configService.get('DEAM_MILES_KM_LIMIT');
        this.defaultRates.dead_miles_price = this.configService.get('DEAM_MILES_PRICE_PER_KM');
    }

    public async getAll() {
        return await this.locationsRepo.find();
    }

    public async getGMRates(total_trip_weight, companyId) {
        let rate_data: any = {}
        rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: companyId ? companyId : 0}, order: {quantity: 'ASC'}})
        if(!rate_data) {
            rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: 0}, order: {quantity: 'ASC'}})
        }
        return rate_data
    }
    
    public async create(location: any){
        const pointObject: Point = {
            type: "Point",
            coordinates: [location.longitude, location.latitude]
        };
        location.location = pointObject;
        return await this.locationsRepo.save(location)
    }

    public async getRange(lat:number,long:number,range:number = 1000) {
        let origin = {
          type: "Point",
          coordinates: [long, lat]
        };
       let  locations = await this.locationsRepo
            .createQueryBuilder('go_locations')
            .select(['*','ST_Distance(location, ST_SetSRID(ST_GeomFromGeoJSON(:origin), ST_SRID(location)))/1000 AS distance' ])
            .where("ST_DWithin(location, ST_SetSRID(ST_GeomFromGeoJSON(:origin), ST_SRID(location)) ,:range)")
            .orderBy("distance","ASC")
            .setParameters({
               // stringify GeoJSON
              origin: JSON.stringify(origin),
              range:range*1000 //KM conversion
            })
           .getRawMany();
        return locations;
    }

    getLatestPoint = async (reqBody: any) => {
        const latestPoint = await this.locationsRepo.findOne({where:{tour_id: reqBody.tour_id, session_id: reqBody.session_id}, order:{id: 'DESC'}})
        return latestPoint
    }

    // For each given user_id, sets that user's latest go_locations point to their base_locations lat/long
    updateLatestLocationToBaseLocation = async (reqBody: any): Promise<any> => {
        const userIds: number[] = reqBody.user_ids || []
        const results = []

        for (const userId of userIds) {
            const baseLoc = await this.baseLocationsRepo.findOne({ where: { unique_id: String(userId) } })
            if (!baseLoc) {
                results.push({ user_id: userId, updated: false, message: 'No base location found for this user' })
                continue
            }

            const latestPoint = await this.locationsRepo.findOne({
                where: { user_id: userId },
                order: { id: 'DESC' }
            })
            if (!latestPoint) {
                results.push({ user_id: userId, updated: false, message: 'No location found for this user' })
                continue
            }

            const pointObject: Point = {
                type: "Point",
                coordinates: [Number(baseLoc.longitude), Number(baseLoc.latitude)]
            }

            await this.locationsRepo.update({ id: latestPoint.id }, {
                latitude: baseLoc.latitude,
                longitude: baseLoc.longitude,
                location: pointObject
            })

            results.push({ user_id: userId, updated: true, latitude: baseLoc.latitude, longitude: baseLoc.longitude })
        }

        return results
    }

    getLastPointDistance = async (id: number, loc: any, ): Promise<any> => {
        let origin = {
        type: "Point",
        coordinates: [loc.long, loc.lat]
        };
        let locations = await this.locationsRepo
            .createQueryBuilder('go_locations')
            .select(['*','ST_Distance(location, ST_SetSRID(ST_GeomFromGeoJSON(:origin), ST_SRID(location)))/1000 AS distance'])
            .where("id = :id", {id: id})
            .orderBy("distance","ASC")
            .setParameters({
                // stringify GeoJSON
                origin: JSON.stringify(origin)
            })
            .getRawOne();
        return locations;
    }

    getDriversLocations = async (reqBody: any) => {
        let locs = []
        let ids = []
        const today = moment(new Date()).format('YYYY-MM-DD')
        let latestLocId = await this.locationsRepo
            .createQueryBuilder('go_locations')
            .where('created_at >=:today', {today})
            .select(['max(id) as id'])
            .groupBy("user_id")
            .getRawMany();

        if(latestLocId.length) {
            latestLocId.map((loc) => {
                ids.push(loc.id)
                return
            })
        }
        const [items, count] = await this.locationsRepo.findAndCount({where:{id: In(ids)}, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) })
        if(items && items.length) {
            await Promise.all(items.map(async (item) => {
                let locData : any= {
                    ...item
                }
                if(item.tour_id) {
                    locData.tourData = await this.toursEntity.findOneBy({id: item.tour_id})
                }
                let driverData: any = await this.driverRepo.findOneBy({user_id: item.user_id})
                if(driverData) {
                    driverData.truck_owner_name = await this.utilsService.getName(driverData.truck_owner_id)
                }
                locData.driverData = driverData
                locs.push(locData)
            }))
        }
        return {locs, count};
    }

    getDriverLocations = async (reqBody: any) => {
        let whereCon = {}
        if(reqBody.driver_id) {
            whereCon['user_id'] = reqBody.driver_id
        }
        if(reqBody.loc_time_start) {
            whereCon["loc_time"] = Between(reqBody.loc_time_start, reqBody.loc_time_end)
        }
        // const [items, count] = await this.locationsRepo.findAndCount({where:whereCon, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10), order:{loc_time: 'DESC'} })
        const [items, count] = await this.locationsRepo.findAndCount({where:whereCon, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10), order:{id: 'DESC'} })
        return {items, count};
    }

    getDriverLocationsByDate = async (reqBody: any) => {
        const loc_date = reqBody.loc_date
        const [items, count] = await this.locationsRepo.findAndCount({where:{user_id: reqBody.driver_id, loc_time: Like(`${loc_date}%`)}, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10), order:{id: 'DESC'} })
        return {items, count};
    }

    getDriverLocationsDetails = async (reqBody: any) => {
        let historyQuery = this.locationsRepo.createQueryBuilder('l')
                                .leftJoinAndSelect("users", "u", "u.id=l.user_id")
                                
        if(reqBody.driver_id) {
            historyQuery.where("user_id=:userId",{userId: reqBody.driver_id})
        }   
        if(reqBody.start_date) {
            let start_date = new Date(reqBody.start_date)
            start_date.setDate(start_date.getDate() - 1)
            let end_date = new Date(reqBody.end_date)
            end_date.setDate(end_date.getDate() + 1)
            reqBody.driver_id ? historyQuery.andWhere("loc_time BETWEEN :startDate AND :endDate",{startDate: start_date, endDate: end_date}) : historyQuery.where("loc_time BETWEEN :startDate AND :endDate",{startDate: start_date, endDate: end_date})
        }                      
        historyQuery.select(['l.*', 'u.name as driverName'])
                    .take(reqBody.limit ? reqBody.limit : 10)
                    .skip(reqBody.offset ? reqBody.offset : 0)
        
        const locationsHistory = await historyQuery.getRawMany()
        return locationsHistory;
    }

    getDriverLocation = async (reqBody: any) => {
        const loc = await this.locationsRepo.findOne({where:{user_id: reqBody.driver_id}, order: {id: 'DESC'}})
        return loc;
    }

    showSessionDistances = async (reqBody: any ): Promise<any> => {
        const locs = await this.locationsRepo.find({where: {session_id: reqBody.sessionId}, order: {id: 'ASC'}})
        // const locs = await this.locationsRepo.find({where: {id: In([47594,47601])}, order: {id: 'ASC'}})
        let i =0
        let tot = 0
        let pointsData = {}
        for(let loc of locs) {
            let totalDistance = 0
            if(locs[i+1]) {
                try {
                    const dData = await this.utilsService.getDistanceFromOSM({lat: loc.latitude, long: loc.longitude}, {lat: locs[i+1].latitude, long: locs[i+1].longitude})
                    if(dData.code == 'Ok') {
                        totalDistance = dData.routes[0].distance
                        if(totalDistance) {
                            totalDistance = (totalDistance/1000)
                        }
                        //console.log(loc.id, totalDistance)
                        tot = tot + totalDistance
                        pointsData = JSON.parse(JSON.stringify(pointsData))
                        pointsData[loc.id] = totalDistance
                    } 
                } catch(error) {
                    //console.log("error from osm", error)
                }
            }
            i++
            // await new Promise(resolve => setTimeout(resolve, 500));
        }
        pointsData['total'] = tot
        //console.log(pointsData)
        var mailOptions = {
            from: 'noreplygo.20221@gmail.com',
            to: 'nageswararaonali@gmail.com',
            // to: 'nageswararaonali@gmail.com',
            subject: 'G-O Bookings',
            text: JSON.stringify(pointsData)
        }
        await mail.sendMail(mailOptions);
        return pointsData
    }

    getTourIdsOfSession = async (session_id: any) => {
        let ids = []
        let tour_ids = await this.locationsRepo
            .createQueryBuilder('go_locations')
            .select(['tour_id'])
            .where("session_id = :id and tour_id != :tid", {id: session_id, tid: 0})
            .groupBy("tour_id")
            .getRawMany();
        return tour_ids
    }

    sendCustomerTourNotification = async (seqData) => {
        await this.tripRepo.update({trip_id: seqData.trip_id}, {status: 'Reached ' +seqData.transport_type})
        const bookingDetails = await this.bookingRepository.findOneBy({id: seqData.booking_id})
        if(seqData.transport_type == 'pickup' && (bookingDetails.pickup_location == seqData.location_address)) {
            const userToken = await this.utilsService.getDeviceToken(bookingDetails.customer_id)
            const TITLE = 'Booking id #'+bookingDetails.id
            const BODY = 'Driver has reached the pick up location. Please load the goods immediately to avoid waiting charges.'
            if(userToken) {
                await this.utilsService.sendPushNotification(TITLE, BODY, userToken.split(","))
            }
            
        }

        if(seqData.transport_type == 'drop' && (bookingDetails.dropoff_location == seqData.location_address)) {
            const userToken = await this.utilsService.getDeviceToken(bookingDetails.customer_id)
            const TITLE = 'Booking id #'+bookingDetails.id
            const BODY = 'Driver has reached the drop off location. Please unload the goods immediately to avoid waiting charges.'
            if(userToken) {
                await this.utilsService.sendPushNotification(TITLE, BODY, userToken.split(","))
            }
        }
    }

    async addBookingStatus(reqBody: any): Promise<any> {
        const bsDetails = await this.bsRepo.save(reqBody)
        await this.bookingRepository.update({id: reqBody.booking_id}, {'booking_status': reqBody.status})
        return bsDetails
    }

    async calcDeadDistance(startLoc: any, endLoc: any): Promise<any> {
        let totalDistance = 0;
        // //console.log(startLoc, endLoc)
        // //console.log("*************")
        if(startLoc && endLoc) {
            try {
                let a = {latitude: startLoc.coordinates[1], longitude:startLoc.coordinates[0]}
                let b = {latitude: endLoc.coordinates[1], endLoc:startLoc.coordinates[0]}
                let distance = haversine(a, b)
                /*const dData = await this.utilsService.getDistanceFromOSM({lat: startLoc.coordinates[1], long: startLoc.coordinates[0]}, {lat: endLoc.coordinates[1], long: endLoc.coordinates[0]})
                if(dData.code == 'Ok') {
                    totalDistance = dData.routes[0].distance
                    if(totalDistance) {
                        totalDistance = (totalDistance/1000)
                    }
                    
                }*/
                // const dData = await this.utilsService.getDistance({lat: startLoc.coordinates[1], long: startLoc.coordinates[0]}, {lat: endLoc.coordinates[1], long: endLoc.coordinates[0]})
                const dData = await this.utilsService.getMinDistance({lat: startLoc.coordinates[1], long: startLoc.coordinates[0]}, {lat: endLoc.coordinates[1], long: endLoc.coordinates[0]})
                if(dData.status == 'OK' && dData.routes.length) {
                    totalDistance = (dData.routes[0].legs && dData.routes[0].legs.length) ? dData.routes[0].legs[0].distance.value : 0
                    for(let route of dData.routes) {
                        //console.log(route.legs[0].distance, "----")
                        if(route.legs.length) {
                            totalDistance = (totalDistance > route.legs[0].distance.value) ? route.legs[0].distance.value : totalDistance
                        }
                    }
                    console.log("dis in meters ",totalDistance)
                    if(totalDistance > 0) {
                        // totalDistance = Math.round(totalDistance/1000)
                        totalDistance = totalDistance/1000
                    }
                    //console.log("--------------------------------", totalDistance)
                    /*let d = dData.rows[0]
                    //console.log(d.elements[0].distance.value)
                    if(d.elements[0].distance.value) {
                        totalDistance = (d.elements[0].distance.value/1000)
                    }*/
                }
            } catch (error) {
                //console.log("error in getting distance from osm ", startLoc, endLoc)
                // //console.log(error)
            }
        }
        return totalDistance
    }

    async getDeadWithinDistance(tourId: number, sessionId: number): Promise<any> {
        const tourSeqs = await this.tourRouteRepo.find({where: {tour_id: tourId}, order: {sequence_number: 'ASC'}})
        let havePickup = 0, pickupCount = 0;
        let lastDropPoint: any
        let tourDeadDistance = 0
        for await (let tourSeq of tourSeqs) {
            if(tourSeq.transport_type == 'pickup') {
                pickupCount = pickupCount + 1
                if(pickupCount > 0 && havePickup) {
                    const deadDistance = await this.calcDeadDistance(lastDropPoint, tourSeq.location)
                    tourDeadDistance = tourDeadDistance + deadDistance
                }
                if (!havePickup) {
                    havePickup = 1
                }
            } else if(havePickup && tourSeq.transport_type == 'drop') {
                pickupCount = pickupCount - 1
                lastDropPoint = tourSeq.location
            }

        }
        return Math.round(tourDeadDistance)
    }

    async getDistanceBetweenTours(startTourId: number, endTourId: number, sessionId: number): Promise<any> {
        const startTourSeqs = await this.bsRepo.findOne({where: {tour_id: startTourId, status: 'Tour Completed'}})
        const endTourSeqs = await this.bsRepo.findOne({where: {tour_id: endTourId, status: 'Reached pickup'}})
        const startTourLastPointTime = startTourSeqs ? startTourSeqs.created_at : null
        const endTourFirstPointTime = endTourSeqs ? endTourSeqs.created_at : new Date()
        let tourDeadDistance = 0
        let inbetweenPoints = await this.locationsRepo.find({where: {session_id: sessionId, created_at: Between(startTourLastPointTime, endTourFirstPointTime)}})
        if(inbetweenPoints.length && false) {
            let locIndex = 0
            for await (let inbetweenPoint of inbetweenPoints) {
                //console.log(inbetweenPoint.location, inbetweenPoint.created_at)
                if(inbetweenPoints[locIndex + 1]) {
                   const dis = await this.calcDeadDistance(inbetweenPoint.location, inbetweenPoints[locIndex+1].location)
                   tourDeadDistance = tourDeadDistance + dis
                }
                locIndex = locIndex + 1
            }
        } else {
            //console.log(startTourId, endTourId)
            const startTourSeqsManager = await this.tourRouteRepo.find({where: {tour_id: startTourId}, order: {sequence_number: 'ASC'}})
            const endTourSeqsManager = await this.tourRouteRepo.find({where: {tour_id: endTourId}, order: {sequence_number: 'ASC'}})
            if(startTourSeqsManager.length && endTourSeqsManager.length) {
                const startLoc = startTourSeqsManager[startTourSeqsManager.length -1].location
                const endLoc = endTourSeqsManager[0].location
                const dis = await this.calcDeadDistance(startLoc, endLoc)
                tourDeadDistance = dis
            }
        }
        
        return Math.round(tourDeadDistance)
    }

    async getDistanceBetweenToursWithDriverId(startTourId: number, endTourId: number, driverId: number): Promise<any> {
        const startTourSeqs = await this.bsRepo.findOne({where: {tour_id: startTourId, status: 'Tour Completed'}})
        const endTourSeqs = await this.bsRepo.findOne({where: {tour_id: endTourId, status: 'Reached pickup'}})
        const startTourLastPointTime = startTourSeqs ? startTourSeqs.created_at : null
        const endTourFirstPointTime = endTourSeqs ? endTourSeqs.created_at : new Date()
        let tourDeadDistance = 0
        let inbetweenPoints = await this.locationsRepo.find({where: {user_id: driverId, created_at: Between(startTourLastPointTime, endTourFirstPointTime)}})
        if(inbetweenPoints.length && false) {
            let locIndex = 0
            for await (let inbetweenPoint of inbetweenPoints) {
                //console.log(inbetweenPoint.location, inbetweenPoint.created_at)
                if(inbetweenPoints[locIndex + 1]) {
                   const dis = await this.calcDeadDistance(inbetweenPoint.location, inbetweenPoints[locIndex+1].location)
                   tourDeadDistance = tourDeadDistance + dis
                }
                locIndex = locIndex + 1
            }
        } else {
            //console.log(startTourId, endTourId)
            const startTourSeqsManager = await this.tourRouteRepo.find({where: {tour_id: startTourId}, order: {sequence_number: 'ASC'}})
            const endTourSeqsManager = await this.tourRouteRepo.find({where: {tour_id: endTourId}, order: {sequence_number: 'ASC'}})
            if(startTourSeqsManager.length && endTourSeqsManager.length) {
                const startLoc = startTourSeqsManager[startTourSeqsManager.length -1].location
                const endLoc = endTourSeqsManager[0].location
                const dis = await this.calcDeadDistance(startLoc, endLoc)
                tourDeadDistance = dis
            }
        }
        
        return Math.round(tourDeadDistance)
    }

    async sessionReports(reqBody: any): Promise<any> {
        let sessions: any = []
        let whereCon: any = {}
        if(reqBody.start_date) {
            whereCon['created_at'] =  Between(new Date(reqBody.start_date), new Date(reqBody.end_date))
            // whereCon['id'] =  165
        } 
        const driverSessions = await this.dsRepository.find({where: whereCon, order: {id: 'DESC'}})
        //console.log(driverSessions)
        if(driverSessions.length) {
            for await(let driverSession of driverSessions) {
                const tour_ids = await this.locationsRepo.createQueryBuilder('loc')
                                            .select('DISTINCT(tour_id)')
                                            .where("session_id=:sessionId", {sessionId: driverSession.id})
                                            .orderBy("tour_id", "ASC")
                                            .getRawMany()
                // //console.log(tour_ids)
                let lastTourId = 0
                let totalSessionDeadDistance = 0
                for await (let tourIdData of tour_ids) {
                    if(tourIdData.tour_id == 0) {

                    } else {
                        const distanceWithinTour = await this.getDeadWithinDistance(tourIdData.tour_id, driverSession.id)
                        //console.log("distance with in ..", distanceWithinTour)
                        totalSessionDeadDistance = totalSessionDeadDistance + distanceWithinTour
                        if(lastTourId) {
                            const distanceBTours = await this.getDistanceBetweenTours(lastTourId, tourIdData.tour_id, driverSession.id)
                            //console.log("distance b tours ...........", distanceBTours)
                            totalSessionDeadDistance = totalSessionDeadDistance + distanceBTours
                        }
                        lastTourId = tourIdData.tour_id
                    }

                }
                const tour_idsData = tour_ids.filter((tourD) => {
                    return tourD.tour_id != 0
                })
                const driverNameData = await this.driverRepo.findOneBy({user_id: driverSession.user_id})
                const truckData = await this.truckService.getTruck(driverNameData.truck_id)
                const driverSessionData = {
                    ...driverSession,
                    deadDistance: totalSessionDeadDistance,
                    driverName: driverNameData.name,
                    driverMobile: driverNameData.mobile_number,
                    vehicle_number: truckData.vehicle_number,
                    number_of_tours: tour_idsData.length
                }
                sessions.push(driverSessionData)
            }
        }
        
        return sessions
    }

    /*async driverReports(reqBody: any): Promise<any> {
        let sessions: any = []
        let whereCon: any = {}
        let startDate = new Date()
        startDate.setDate(startDate.getDate() - 3)
        // let startDateValue = moment(startDate).format('YYYY-MM-DD')
        let startDateValue = reqBody.start_date
        //console.log(startDateValue)
        // whereCon['created_at'] =  startDate
        // const driverSessions = await this.dsRepository.find({where: whereCon, order: {id: 'DESC'}})
        // //console.log(driverSessions)

        const tours = await this.toursEntity.createQueryBuilder('t')
                                            .where("tour_date=:createdAt", {createdAt: startDateValue})
                                            .orderBy("id", "ASC")
                                            .getRawMany()
        // //console.log(tours)
        if(tours.length) {
            const tourIds = []
            for(let tour of tours) {
                tourIds.push(parseInt(tour.t_id))
            }


            // //console.log(tourIds)
            const session_ids = await this.locationsRepo.createQueryBuilder('loc')
                                                .select('DISTINCT(session_id)')
                                                .where("loc.tour_id IN (:...tourIds) and session_id != :sessionId", {tourIds: tourIds, sessionId: 0})
                                                .getRawMany()
            //console.log(session_ids)
            if(session_ids.length) {
                let sessionIds = []
                for(let session of session_ids) {
                    sessionIds.push(session.session_id)
                }
                const driverSessions = await this.dsRepository.find({where: {id: In(sessionIds)}, order: {id: 'DESC'}})
                //console.log(driverSessions)
                if(driverSessions.length) {
                    for await(let driverSession of driverSessions) {
                        const tour_ids = await this.locationsRepo.createQueryBuilder('loc')
                                                    .select('DISTINCT(tour_id)')
                                                    .where("session_id=:sessionId and tour_id IN (:...tourIds)", {sessionId: driverSession.id, tourIds: tourIds})
                                                    .orderBy("tour_id", "ASC")
                                                    .getRawMany()
                        // //console.log(tour_ids)
                        let totalTourDistance = 0
                        let lastTourId = 0
                        let totalSessionDeadDistance = 0
                        for await (let tourIdData of tour_ids) {
                            if(tourIdData.tour_id == 0) {
        
                            } else {
                                const tourDistance = await this.calcTourDistance(tourIdData.tour_id);
                                totalTourDistance = totalTourDistance + tourDistance
                                const distanceWithinTour = await this.getDeadWithinDistance(tourIdData.tour_id, driverSession.id)
                                //console.log("distance with in ..", distanceWithinTour)
                                totalSessionDeadDistance = totalSessionDeadDistance + distanceWithinTour
                                if(lastTourId) {
                                    const distanceBTours = await this.getDistanceBetweenTours(lastTourId, tourIdData.tour_id, driverSession.id)
                                    //console.log("distance b tours ...........", distanceBTours)
                                    totalSessionDeadDistance = totalSessionDeadDistance + distanceBTours
                                }
                                lastTourId = tourIdData.tour_id
                            }
        
                        }
                        const tour_idsData = tour_ids.filter((tourD) => {
                            return tourD.tour_id != 0
                        })
                        const driverNameData = await this.driverRepo.findOneBy({user_id: driverSession.user_id})
                        const truckData = await this.truckService.getTruck(driverNameData.truck_id)
                        const driverSessionData = {
                            reportDate: startDateValue,
                            totalTourDistance: totalTourDistance,
                            deadDistance: totalSessionDeadDistance,
                            driverName: driverNameData.name,
                            driverMobile: driverNameData.mobile_number,
                            vehicle_number: truckData.vehicle_number,
                            number_of_tours: tour_idsData.length
                        }
                        sessions.push(driverSessionData)
                    }
                }
                //console.log(driverSessions)
            }
        }
        return sessions
    } */

    async driverReports(reqBody: any): Promise<any> {
        let sessions: any = []
        let whereCon: any = {}
        let startDate = new Date()
        startDate.setDate(startDate.getDate() - 3)
        // let startDateValue = moment(startDate).format('YYYY-MM-DD')
        let startDateValue = reqBody.start_date
        //console.log(startDateValue)
        // whereCon['created_at'] =  startDate
        // const driverSessions = await this.dsRepository.find({where: whereCon, order: {id: 'DESC'}})
        // //console.log(driverSessions)

        const tours = await this.toursEntity.createQueryBuilder('t')
                                            .where("tour_date=:createdAt", {createdAt: startDateValue})
                                            .orderBy("id", "ASC")
                                            .getRawMany()
        // //console.log(tours)
        if(tours.length) {
            let tourIds = []
            let driver_ids = []
            for(let tour of tours) {
                tourIds.push(parseInt(tour.t_id))
                driver_ids.push(parseInt(tour.t_driver_id))
            }
            driver_ids = [... new Set(driver_ids)]


            if(driver_ids.length) {
                for await(let driver_id of driver_ids) {
                    const tour_ids = await this.locationsRepo.createQueryBuilder('loc')
                                                .select('DISTINCT(tour_id)')
                                                .where("user_id=:driverId and tour_id IN (:...tourIds)", {driverId: driver_id, tourIds: tourIds})
                                                .orderBy("tour_id", "ASC")
                                                .getRawMany()
                    // //console.log(tour_ids)
                    let totalTourDistance = 0
                    let lastTourId = 0
                    let totalSessionDeadDistance = 0
                    //console.log(driver_id)
                    //console.log(tour_ids)
                    for await (let tourIdData of tour_ids) {
                        if(tourIdData.tour_id == 0) {
    
                        } else {
                            const tourDistance = await this.calcTourDistance(tourIdData.tour_id);
                            totalTourDistance = totalTourDistance + tourDistance
                            const distanceWithinTour = await this.getDeadWithinDistance(tourIdData.tour_id, driver_id)
                            //console.log("distance with in ..", distanceWithinTour)
                            totalSessionDeadDistance = totalSessionDeadDistance + distanceWithinTour
                            if(lastTourId) {
                                const distanceBTours = await this.getDistanceBetweenToursWithDriverId(lastTourId, tourIdData.tour_id, driver_id)
                                //console.log("distance b tours ...........", distanceBTours)
                                totalSessionDeadDistance = totalSessionDeadDistance + distanceBTours
                            }
                            lastTourId = tourIdData.tour_id
                        }
    
                    }
                    const tour_idsData = tour_ids.filter((tourD) => {
                        return tourD.tour_id != 0
                    })
                    const driverNameData = await this.driverRepo.findOneBy({user_id: driver_id})
                    const truckData = await this.truckService.getTruck(driverNameData.truck_id)
                    //console.log(driverNameData)
                    //console.log(truckData)
                    const driverSessionData = {
                        reportDate: startDateValue,
                        totalTourDistance: totalTourDistance,
                        deadDistance: totalSessionDeadDistance,
                        driverName: driverNameData ? driverNameData.name : '',
                        driverMobile: driverNameData ? driverNameData.mobile_number: '',
                        vehicle_number: truckData ? truckData.registration_number : '',
                        number_of_tours: tour_idsData.length
                    }
                    sessions.push(driverSessionData)
                }
                
                //console.log(sessions)
            }
        }
        return sessions
    } 
    
    async calcTourDistance(tourId: number): Promise<any> {
        let tourDistance = 0
        const tourSequenceses = await this.tourRouteRepo.find({where:{tour_id: tourId}, order: {sequence_number: 'ASC'}})
        let locIndex = 0
        for(let tourSequence of tourSequenceses) {
            if(tourSequenceses[locIndex + 1]) {
                const dis = await this.calcDeadDistance(tourSequence.location, tourSequenceses[locIndex+1].location)
                console.log("dis ", dis)
                tourDistance = tourDistance + dis
            }
            locIndex = locIndex + 1
        }
        return Math.round(tourDistance)
    }

    async htmlToImage(html = ""): Promise<any> {
        const browser = await puppeteer.launch({executablePath: '/usr/bin/chromium-browser'});
        const page = await browser.newPage();
      
        await page.setContent(html);
      
        const content = await page.$("body");
        const imageBuffer = await content.screenshot({ omitBackground: true });
      
        await page.close();
        await browser.close();
      
        return imageBuffer;
      };
    
    async daySummaryReports(reqBody: any): Promise<any> {
        let resFileUrl = ''
        let summaryReport = {
            total_trips: 0,
            total_tours: 0,
            total_vehicles: 0,
            total_km: 0,
            total_wait_time: 0,
            total_revenue: 0,
            avg_km_per_vehicles: 0,
            avg_km_per_trip: 0,
            avg_wait_time_per_trip: 0,
            total_bookings: 0
        }
        let total_time = 0
        let total_distance = 0
        let total_revenue = 0
        const summaryDate = reqBody.report_date
        const reportDate = new Date(summaryDate)
        let nextDate = new Date(summaryDate)
        nextDate.setDate(nextDate.getDate() + 1)
        const bookingsCount = await this.bookingRepository.count({where:{created_at: Between(reportDate, nextDate)}})
        const [items, count] = await this.toursEntity.findAndCount({where: {tour_date: summaryDate}})
        summaryReport.total_trips = bookingsCount
        summaryReport.total_tours = count
        let drivers = []
        let bookings = []
        for(let tourData of items) {
            drivers.push(tourData.driver_id)
            if(tourData.status != 'Assigned') {
                let seqData = await this.tourRouteRepo.createQueryBuilder('t')
                                .select('DISTINCT(booking_id)')
                                .where("tour_id=:tourId", {tourId: tourData.id})
                                .getRawMany()
                // //console.log("seqData")
                // //console.log(seqData)
                for(let seq of seqData) {
                    bookings.push(seq.booking_id)
                }
            }
            
            let tourDistance = await this.calcTourDistance(tourData.id)
            // let tourDistance = 5
            //console.log("tour dis ", tourData.id, tourDistance)
            total_distance = total_distance + tourDistance
            const bookingStatuses = await this.bsRepo.find({where: {tour_id: tourData.id}, order: {id: 'ASC'}})
            let bookingSequence = {}
            bookingStatuses.map((bData) => {
                bookingSequence[bData.status] = bData.created_at
            })
            if(bookingSequence['Reached pickup'] && bookingSequence['Completed pickup']) {
                let date1 = moment(bookingSequence['Completed pickup'])
                let date2 = moment(bookingSequence['Reached pickup'])
                let diff = date1.diff(date2, 'minutes');
                total_time = total_time + diff
            }
            if(bookingSequence['Reached drop'] && bookingSequence['Completed drop']) {
                let date1 = moment(bookingSequence['Completed drop'])
                let date2 = moment(bookingSequence['Reached drop'])
                let diff = date1.diff(date2, 'minutes');
                total_time = total_time + diff
            }
        }
        const total_distance_value = Math.round(total_distance)
        const total_drivers = [...new Set(drivers)]
        const total_bookings = [...new Set(bookings)]
        const bookingsData = await this.bookingRepository.find({where: {id: In(total_bookings)}})
        // //console.log(bookingsData)
        for(let booking of bookingsData) {
            total_revenue = total_revenue + (booking.fare ? parseInt(booking.fare) : 0)
        }
        summaryReport.total_vehicles = total_drivers.length
        summaryReport.total_bookings = bookings.length
        summaryReport.total_wait_time = total_time
        summaryReport.total_km = total_distance_value
        summaryReport.avg_km_per_vehicles = Math.round(total_distance_value/total_drivers.length)
        summaryReport.avg_km_per_trip = Math.round(total_distance_value/bookingsCount)
        summaryReport.avg_wait_time_per_trip = Math.round(total_time/bookingsCount)
        summaryReport.total_revenue = total_revenue
        const pdfOptions: any = {
            childProcessOptions: {
              env: {
                OPENSSL_CONF: '/dev/null',
              },
            }
        }
        var template = './public/summaryReport.html'
        var pdf_path = './public/summaryReport.pdf'
        var image_path = './public/summaryReport.png'
        // //console.log(template)
        var html = fs.readFileSync(template, 'utf8');
        html = html.replace('{{date}}', moment(summaryDate).format('DD-MM-YYYY'))
        for(let key in summaryReport) {
            html = html.replace('{{'+key+"}}", summaryReport[key])
        }

        const htmlImg = await this.htmlToImage(html)
        fs.writeFileSync(image_path, htmlImg);
        const params = {
            Key: 'summaryReport.png',
            Body: fs.createReadStream(image_path),
            Bucket: this.configService.get('REPORTS_BUCKET_NAME'),
            ContentType: 'image/png'
        };
        const fileRes: any = await this.utilsService.uploadS3(params)
        resFileUrl = fileRes.Location
        //console.log(resFileUrl)
        // fs.unlinkSync(image_path);
        /*const puppeteer = { args: [ '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--headless', '--no-zygote', '--disable-gpu' ], headless: true, ignoreHTTPSErrors: true };
        await nodeHtmlToImage({
            output: image_path,
            html: html,
            // puppeteer: puppeteerCore,
            // puppeteerArgs: {
            //     args: chrome.args,
            //     executablePath: await chrome.executablePath,
            // }
          })
            .then(async () => {
                //console.log('The image was created successfully!')
                // const params = {
                //     Key: 'summaryReport.png',
                //     Body: fs.createReadStream(image_path),
                //     Bucket: this.configService.get('REPORTS_BUCKET_NAME'),
                //     ContentType: 'image/png'
                // };
                // const fileRes: any = await this.utilsService.uploadS3(params)
                // resFileUrl = fileRes.Location
                // fs.unlinkSync(image_path);
            }) */
        /*await pdf.create(html, pdfOptions).toStream( async (err, stream) => {
            if (err) return //console.log(err);
            stream.pipe(fs.createWriteStream(pdf_path))
            const params = {
                Key: 'summaryReport.pdf',
                Body: stream,
                Bucket: this.configService.get('REPORTS_BUCKET_NAME'),
                ContentType: 'application/pdf',
            };
            const fileRes: any = await this.utilsService.uploadS3(params)
            resFileUrl = fileRes.Location
            const options = {
                density: 100,
                saveFilename: "summaryReport",
                savePath: "./public",
                format: "png",
                width: 600,
                height: 600
              };
              const storeAsImage = fromPath(pdf_path, options);
              const pageToConvertAsImage = 1;
              
              storeAsImage(pageToConvertAsImage).then((resolve) => {
                //console.log("Page 1 is now converted as image");
              
              });
            fs.unlinkSync(pdf_path);
        }); */

        await new Promise(resolve => setTimeout(resolve, 5000));
        return resFileUrl
    }

    async getTotalWaitingMins(bookingId: number): Promise<any> {
        let totalMins = 0
        let rPickup = '', cPickup = '', rDrop = '', cDrop=''
        // let statusDetails = await this.bsRepo.createQueryBuilder('b')
        //         .select('min(id), *')
        //         .where("booking_id=:bookingId and status IN (:...bookingStatus)", {bookingId: bookingId, bookingStatus: ['Reached pickup','Completed pickup','Reached drop','Completed drop']})
        //         .groupBy("status, id")
        //         .getRawMany()
        // //console.log(statusDetails)
        // let rPickup = '', cPickup = '', rDrop = '', cDrop=''
        // for(let status of statusDetails) {
        //     if(status.status == 'Reached pickup') {
        //         rPickup = status.created_at
        //     }
        //     if(status.status == 'Completed pickup') {
        //         cPickup = status.created_at
        //     }
        //     if(status.status == 'Reached drop') {
        //         rDrop = status.created_at
        //     }
        //     if(status.status == 'Completed drop') {
        //         cDrop = status.created_at
        //     }
        // }
        let bookingDetails  = await this.bookingRepository.findOneBy({id: bookingId})
        // //console.log(bookingDetails)
        rPickup = bookingDetails.reached_pickup, cPickup = bookingDetails.completed_pickup, rDrop = bookingDetails.reached_drop, cDrop=bookingDetails.completed_drop
        if(rPickup != '' && cPickup != '' &&  rDrop != '' && cDrop != '' ) {
            try  {
                let pickupWaiting = moment(cPickup).diff(moment(rPickup), 'minutes')
                let dropWaiting = moment(cDrop).diff(moment(rDrop), 'minutes')
                // //console.log("times ")
                // //console.log(pickupWaiting)
                // //console.log(dropWaiting)
                // rPickup = moment(rPickup).local().format('YYYY-MM-DD HH:mm:ss')
                // cPickup = moment(cPickup).local().format('YYYY-MM-DD HH:mm:ss')
                // rDrop = moment(rDrop).local().format('YYYY-MM-DD HH:mm:ss')
                // cDrop = moment(cDrop).local().format('YYYY-MM-DD HH:mm:ss')
                if(Number.isInteger(pickupWaiting) && Number.isInteger(dropWaiting)) {
                    totalMins = pickupWaiting + dropWaiting
                }
            } catch (e) {

            }
            
            await this.bookingRepository.update({id: bookingId}, {waiting_time: totalMins})
        }
        return totalMins
    }

    async updateWaitingChargeNotes(bookings: any, notes: string): Promise<any> {
        for await (let bookingId of bookings) {
            await this.bookingRepository.update({id:bookingId}, {waiting_charge_notes: notes})
        }
    }

    async caliculateT2WaitingCharge(points_count: number, bookings: any, totalDistance: number, tour_ids = []): Promise<any> {
        let totalMins = 0
        let calculatingMins = 0
        let totalCost = 0
        let notes = ''
        points_count = points_count >= 0 ? points_count : 0
        if(totalDistance <= 15) {
            totalCost = await this.caliculateT1WaitingCharge(points_count, bookings, tour_ids)
        } else {
            for await (let bookingId of bookings) {
                totalMins = totalMins + await this.getTotalWaitingMins(bookingId)
            }
            // totalMins = await this.getTotalWaitingMins(bookingId)
            notes = `T2 - Tour Ids = ${tour_ids.join(" ")}, Total Mins = ${totalMins}, `;
            const totStr = `(${totalMins} - (${points_count} * 30))`
            totalMins = totalMins - (points_count * 30)
            if(totalMins > 60) {
                calculatingMins = totalMins - 60
                if(calculatingMins > 0) {
                    // const noOf15mins = Math.ceil(calculatingMins/30)
                    // totalCost = noOf15mins * 75
                    totalCost = calculatingMins * 3
                    notes = notes+`Waiting Charge = ( ( ${totStr} - 60 ) * 3 ) / ${bookings.length}`
                }
            }
            if(totalCost) {
                await this.updateWaitingChargeNotes(bookings, notes)
            }
        }
        // await this.bookingRepository.update({id: bookingId}, {total_distance: totalDistance.toString()})
         
        return totalCost
        
    }

    async caliculateT1WaitingCharge(points_count: number, bookings: number[], tour_ids = []): Promise<any> {
        let calculatingMins = 0
        let totalCost = 0
        let totalMins = 0
        let notes = ''
        points_count = points_count >= 0 ? points_count : 0
        for await (let bookingId of bookings) {
            totalMins = totalMins + await this.getTotalWaitingMins(bookingId)
        }
        // //console.log("total mis ")
        // //console.log(bookings)
        // //console.log("tot min", totalMins)
        // let totalMins = await this.getTotalWaitingMins(bookingId)
        notes = `T1 - Tour Ids = ${tour_ids.join(" ")}, Total Mins = ${totalMins}, `;
        const totStr = `(${totalMins} - (${points_count} * 30))`
        if(totalMins > 30 && totalMins <= 45) {
            totalMins = totalMins - (points_count * 30)
            calculatingMins = totalMins - 30
            totalCost = calculatingMins > 0 ? (calculatingMins * 2) : 0
            notes = notes+`Waiting Charge = ( ( ${totStr} - 30 ) * 2 ) / ${bookings.length}`
        } else if(totalMins > 45){
            totalMins = totalMins - (points_count * 30)
            calculatingMins = totalMins - 30
            totalCost = calculatingMins > 0 ? (calculatingMins * 3) : 0
            notes = notes+`Waiting Charge = ( ( ${totStr} - 30 ) * 3 ) / ${bookings.length}`
        }
        if(totalCost) {
            await this.updateWaitingChargeNotes(bookings, notes)
        }
        return totalCost
    }

    async findSameTimeBookingsOld(bookings: any): Promise<any> {
        let bs =[]
        let n=0, i=0
        for await (let booking of bookings) {
            let isListed = false
            for(let j=i+1; j<bookings.length; j++) {
                // let booking = bookings[i]
                let nextBooking = bookings[j]
                let isFound = false
                isListed = false
                let b1 = ''
                let b2 = ''
                //console.log(booking.id, nextBooking.id)
                //console.log(booking.reached_pickup, nextBooking.reached_pickup)
                //console.log(booking.completed_pickup, nextBooking.completed_pickup)
                //console.log(booking.reached_drop, nextBooking.reached_drop)
                //console.log(booking.completed_drop, nextBooking.completed_drop)
                //console.log(booking.reached_drop, nextBooking.reached_pickup)
                //console.log(booking.completed_drop, nextBooking.completed_pickup)
                //console.log(booking.reached_pickup, nextBooking.reached_drop)
                //console.log(booking.completed_pickup, nextBooking.completed_drop)
                if(booking.reached_pickup == nextBooking.reached_pickup && booking.completed_pickup == nextBooking.completed_pickup) {
                    isFound = true
                    b1='pickup'
                    b2='pickup'
                }
                if(booking.reached_drop == nextBooking.reached_drop && booking.completed_drop == nextBooking.completed_drop) {
                    isFound = true
                    b1='drop'
                    b2='drop'
                }
                if(booking.reached_drop == nextBooking.reached_pickup && booking.completed_drop == nextBooking.completed_pickup) {
                    isFound = true
                    b1='drop'
                    b2='pickup'
                }
                if(booking.reached_pickup == nextBooking.reached_drop && booking.completed_pickup == nextBooking.completed_drop) {
                    isFound = true
                    b1='pickup'
                    b2='drop'
                }
                //console.log(isFound, b1, b2)
                if(isFound) {
                    if(!bs[n]) {
                        bs[n] = []
                    }

                    for(let b of bs) {
                        //console.log(b)
                        //console.log(JSON.stringify(bs))
                        let el = {id: booking.id, type: b1}
                        //console.log(el)
                        if(b && b.indexOf(el) > -1) {
                            isListed = true
                        }
                    }
                    //console.log(i, n)
                    if(!isListed) {
                        bs[n].push({id: booking.id, type: b1})
                        bs[n].push({id: nextBooking.id, type: b2})
                    }
                }
                
            }
            i++
            n++
        }
        for await (let bookingData of bs) {
            if(bookingData && bookingData.length > 1) {
                let fromTime = ''
                let toTime = ''
                let bId = bookingData[0].id
                let bookingDetials = await this.bookingRepository.findOneBy({id: bId})
                if(bookingData.type == 'pickup') {
                    fromTime = bookingDetials.reached_pickup
                    toTime = bookingDetials.completed_pickup
                } else {
                    fromTime = bookingDetials.reached_drop
                    toTime = bookingDetials.completed_drop
                }
                if(fromTime && toTime) {
                    let diffMins = moment(toTime).diff(moment(fromTime), 'minutes')
                    let avgMins = Math.round(diffMins/bookingData.length)
                    let startTime = fromTime
                    let endTime = ''
                    for(let bookingD of bookingData) {
                        endTime = moment(startTime).add(avgMins, 'minutes').format('YYYY-MM-DD HH:mm:ss')
                        if(bookingD.type == 'pickup') {
                            await this.bookingRepository.update({id: bookingD.id}, {reached_pickup: startTime, completed_pickup: endTime})
                        } else {
                            await this.bookingRepository.update({id: bookingD.id}, {reached_drop: startTime, completed_drop: endTime})
                        }
                        startTime = endTime
                    }
                }
            }
        }
        return bs
    }
    async findSameTimeBookings(tourRoute: any): Promise<any> {
        let samePointBookings =[]
        let n=0, i=0
        // //console.log(tourRoute)
        for await (let tRoute of tourRoute) {
            // if(tourRoute[i-1])
            // //console.log(tourRoute[i-1].location_address +' == '+ tRoute.location_address + " ---" + tRoute.booking_id)
            let dis = 100;
            if(tourRoute[i-1]) {
                dis = await this.euclideanDistance(tourRoute[i-1].location.coordinates[1], tourRoute[i-1].location.coordinates[0], tRoute.location.coordinates[1], tRoute.location.coordinates[0])
            }
            
            // if(tourRoute[i-1] && tourRoute[i-1].location_address == tRoute.location_address) {
            if(tourRoute[i-1] && dis <= 50) {
                samePointBookings[n].push({type: tRoute.transport_type, id: tRoute.booking_id})
            } else {
                n++
                if(!samePointBookings[n]) {
                    samePointBookings[n] = []
                }
                samePointBookings[n].push({type: tRoute.transport_type, id: tRoute.booking_id})
            }
            i++;
        }
        
        //console.log("samePointBookings")
        //console.log(samePointBookings)
        for await (let samePointBooking of samePointBookings) {
            let allBookingTimes = []
            if(samePointBooking && samePointBooking.length > 1) {
                let fromTime = '', toTime = '';
                
                for await (let bookingD of samePointBooking) {
                    let isUpdated = false
                    let bookingDetails = await this.bookingRepository.findOneBy({id: bookingD.id})
                    if(bookingDetails.reached_pickup == '' || bookingDetails.reached_pickup == 'Invalid date') {
                        isUpdated = true
                        let statusDetails = await this.bsRepo.createQueryBuilder('b')
                                .select('min(id), *')
                                .where("booking_id=:bookingId and status IN (:...bookingStatus)", {bookingId: bookingD.id, bookingStatus: ['Reached pickup','Completed pickup','Reached drop','Completed drop']})
                                .groupBy("status, id")
                                .getRawMany()
                        // //console.log(statusDetails)
                        let rPickup = '', cPickup = '', rDrop = '', cDrop=''
                        for(let status of statusDetails) {
                            if(status.status == 'Reached pickup') {
                                rPickup = status.created_at
                            }
                            if(status.status == 'Completed pickup') {
                                cPickup = status.created_at
                            }
                            if(status.status == 'Reached drop') {
                                rDrop = status.created_at
                            }
                            if(status.status == 'Completed drop') {
                                cDrop = status.created_at
                            }
                        }
                        if(rPickup != '' && cPickup != '' && rDrop != '' && cDrop != '') {
                            rPickup = moment(rPickup).local().format('YYYY-MM-DD HH:mm:ss')
                            cPickup = moment(cPickup).local().format('YYYY-MM-DD HH:mm:ss')
                            rDrop = moment(rDrop).local().format('YYYY-MM-DD HH:mm:ss')
                            cDrop = moment(cDrop).local().format('YYYY-MM-DD HH:mm:ss')
                            await this.bookingRepository.update({id: bookingD.id}, {reached_pickup: rPickup, completed_pickup: cPickup, reached_drop: rDrop, completed_drop: cDrop})
                        }
                    }
                    
                    if(isUpdated) {
                        bookingDetails = await this.bookingRepository.findOneBy({id: bookingD.id})
                    }
                    if(bookingD.type == 'pickup') {
                        bookingDetails.reached_pickup ? allBookingTimes.push(bookingDetails.reached_pickup) : null
                        bookingDetails.completed_pickup ? allBookingTimes.push(bookingDetails.completed_pickup) : null
                    } else {
                        bookingDetails.reached_drop ? allBookingTimes.push(bookingDetails.reached_drop) : null
                        bookingDetails.completed_drop ? allBookingTimes.push(bookingDetails.completed_drop) : null
                    }
                }

                await allBookingTimes.sort();
                fromTime = allBookingTimes[0]
                toTime = allBookingTimes[allBookingTimes.length-1]
                if(fromTime && toTime) {
                    let diffMins = moment(toTime).diff(moment(fromTime), 'minutes')
                    let avgMins = Math.round(diffMins/samePointBooking.length)
                    let startTime = fromTime
                    let endTime = ''
                    for(let bookingD of samePointBooking) {
                        endTime = moment(startTime).add(avgMins, 'minutes').format('YYYY-MM-DD HH:mm:ss')
                        
                        if(bookingD.type == 'pickup') {
                            // //console.log({id: bookingD.id}, {reached_pickup: startTime, completed_pickup: endTime})
                            await this.bookingRepository.update({id: bookingD.id}, {reached_pickup: startTime, completed_pickup: endTime})
                        } else {
                            // //console.log({id: bookingD.id}, {reached_drop: startTime, completed_drop: endTime})
                            await this.bookingRepository.update({id: bookingD.id}, {reached_drop: startTime, completed_drop: endTime})
                        }
                        startTime = endTime
                    }
                }
            }
        }

        return samePointBookings
    }
    async findReturnTrip(tourIds: any, bookingIds: any, driver_id = 0): Promise<any> {
        let tourRoute = await this.tourRouteRepo.find({where:{tour_id: In(tourIds), booking_id: In(bookingIds)}, order: {tour_id: 'ASC', sequence_number: 'ASC'}})
        // //console.log(tourRoute)
        let pickups = []
        let pickupCoordinates = []
        let dropoffs = []
        let dropoffCoordinates = []
        let trip_type = 'onward'
        let bookings = []
        let returnCount = 0
        let pickupLoc = ''
        let dropoffLoc = ''
        let betweenFoursFound = false;
        for(let seqData of tourRoute) {
            bookings.push(seqData.booking_id)
            if(seqData.transport_type == 'pickup') {
                pickups.push(seqData.location_address)
                pickupCoordinates.push(seqData.location)
                // if(dropoffs.indexOf(seqData.location_address) > -1) {
                //     returnCount++
                //     pickupLoc = seqData.location_address
                // }
                for(let loc of dropoffCoordinates) {
                    let dis = await this.euclideanDistance(seqData.location.coordinates[1], seqData.location.coordinates[0], loc.coordinates[1], loc.coordinates[0])
                    //console.log(dis, " == dis")
                    if(dis <= 50) {
                        returnCount++
                    }
                }
            } else {
                dropoffs.push(seqData.location_address)
                dropoffCoordinates.push(seqData.location)
                // if(pickups.indexOf(seqData.location_address) > -1) {
                //     returnCount++
                // }
                for(let loc of pickupCoordinates) {
                    let dis = await this.euclideanDistance(seqData.location.coordinates[1], seqData.location.coordinates[0], loc.coordinates[1], loc.coordinates[0])
                    //console.log(dis, " == d dis")
                    if(dis <= 50) {
                        returnCount++
                    }
                }
            }
        }
        bookings = [...new Set(bookings)]
        //console.log("bookings")
        //console.log(bookings)
        //console.log("checking tour ids ---- ", tourIds, returnCount)
        if(tourIds.length > 1) {
            let ids = tourIds.sort()
            let tours = await this.toursEntity.find({where:{id: Between(ids[0], ids[1]), driver_id: driver_id}})
            //console.log(tours.length, "tours length is ........")
            if(tours.length > 2) {
                betweenFoursFound = true
            }
        }
        if(returnCount > 1 && !betweenFoursFound) {
            //console.log(tourIds, 'return ------')
            trip_type = 'return'
        }
        return {trip_type, bookings, tour_ids: tourIds, tourRoute, pickup_count : pickups.length, dropoff_count: dropoffs.length}
    }

    async findSpecialAddress(splAddresses, bookingId): Promise<any> {
        let isFindData = {found: false, amount: 0};
        const bookingData = await this.bookingRepository.findOneBy({id: bookingId});
        for(let splAddres of splAddresses) {
            let dis = await this.euclideanDistance(splAddres.latitude, splAddres.longitude, bookingData.pickup_lat, bookingData.pickup_long)
            // console.log(dis, " == d dis")
            if(dis <= 50) {
                isFindData.found = true
                isFindData.amount = splAddres.amount
            }
            dis = await this.euclideanDistance(splAddres.latitude, splAddres.longitude, bookingData.dropoff_lat, bookingData.dropoff_long)
            // console.log(dis, " == d dis")
            if(dis <= 50) {
                isFindData.found = true
                isFindData.amount = splAddres.amount
            }
        }
        return isFindData
    }
    async checkDailyFareForDriverCustomer(trips) {
        let dayTotalCost = 2900
        let perKmAbove100 = 15
        let totalDistance = 0
        let totalPrice = 0
        let finalBookings = []
        // console.log(trips)
        for(let trip of trips) {
            let booking = await this.bookingRepository.findOneBy({id: trip.bookings[0]})
            totalDistance = totalDistance + parseInt(booking.total_distance)
            finalBookings = finalBookings.concat(trip.bookings)
        }
        let [items, count] = await this.bookingRepository.findAndCount({where: {id: In(finalBookings)}});
        for(let booking of items) {
            totalPrice = totalPrice + parseInt(booking.fare)
        }
       
        console.log(totalPrice + " --- " + dayTotalCost, totalDistance)
        if(totalPrice > dayTotalCost) {
            totalPrice = dayTotalCost
            if(totalDistance > 100) {
                let prc = perKmAbove100 * (totalDistance - 100 )
                totalPrice = totalPrice + prc
            }
            let bookingPrice = Math.ceil(totalPrice / count)
            for(let booking of items) {
                await this.bookingRepository.update({id: booking.id}, {fare: bookingPrice.toString()})
                console.log(booking.id, " rewriting booking fare ", bookingPrice)
            }
        }
        return 

        /*let dayTotalCost = 2900
        let perKmAbove100 = 15
        let totalDistance = 0
        let totalPrice = 0
        let finalBookings = []
        for(let trip of trips) {
            finalBookings.concat(trip.bookings)
        }
        let [items, count] = await this.bookingRepository.findAndCount({where: {id: In(finalBookings)}});
        for(let booking of items) {
            totalPrice = totalPrice + parseInt(booking.fare)
            totalDistance = totalDistance + parseInt(booking.total_distance)
        }
        if(totalPrice > dayTotalCost) {
            if(totalDistance > 100) {
                let prc = perKmAbove100 * (totalDistance - 100 )
                totalPrice = totalPrice + prc
            }
            let bookingPrice = Math.ceil(totalPrice / count)
            for(let booking of items) {
                await this.bookingRepository.update({id: booking.id}, {fare: bookingPrice.toString()})
            }
        }
        return*/
    }
    async findSpecialCompanyAddress(splAddresses, bookingId): Promise<any> {
        let isFindData = {found: false, address_id: []};
        const bookingData = await this.bookingRepository.findOneBy({id: bookingId});
        for(let splAddres of splAddresses) {
            let dis = await this.euclideanDistance(splAddres.latitude, splAddres.longitude, bookingData.pickup_lat, bookingData.pickup_long)
            // console.log(dis, " == p dis")
            if(dis <= 50) {
                isFindData.found = true
                isFindData.address_id.push(splAddres.id)
            }
            dis = await this.euclideanDistance(splAddres.latitude, splAddres.longitude, bookingData.dropoff_lat, bookingData.dropoff_long)
            // console.log(dis, " == d dis")
            if(dis <= 50) {
                isFindData.found = true
                isFindData.address_id.push(splAddres.id)
            }
        }
        return isFindData
    }
    async rCalSpecialCompanies(company, bookingId, trip_type) {
        let fare = 0;
        let cIds = [];
        cIds = company.users.split(",")
        cIds.pop()
        cIds = cIds.map((c)=> {
            return c.replace('#', '')
        })
        let splAddrIds = []
        let splAddressesByCmpy = await this.splCustRatesRepo.find({where: {company_id: company.id}})
        for(let splAdr of splAddressesByCmpy) {
            splAddrIds.push(splAdr.address_id)
        }
        // const custAddress = await this.customerAddressRepo.find({where: {customer_id: In(cIds), id: In(splAddrIds)}})
        const custAddress = await this.customerAddressRepo.find({where: {id: In(splAddrIds)}})
        let foundAddressData = await this.findSpecialCompanyAddress(custAddress, bookingId);
        if(foundAddressData.found) {
            console.log(bookingId)
            console.log(foundAddressData.address_id)
            let splAddRate = await this.splCustRatesRepo.find({where: {address_id: In(foundAddressData.address_id)}})
            for(let splRate of splAddRate) {
                if(trip_type == 'return') {
                    fare = fare > splRate.return_fare ? fare : splRate.return_fare
                } else {
                    fare = fare > splRate.fare ? fare : splRate.fare
                }
                
            }
            
        } 
        return fare
    }
    async revenueCalculation(reqBody: any): Promise<any> {
        let pickupDate = reqBody.calc_date
        let calcStatus = true
        let customers = {}
        let bookingWeights = {}
        let bookingCarges = {}
        let driversTrips = {}
        const loadingCharges = {
            both: 200,
            loading: 100,
            unloading: 100
        }
        const splAddresses = await this.splAddressRepo.find({});
        const splCompanyIds = [4];
        // let customerWiseBookings = {};
        await this.driverTripFareDetails.delete({trip_date: pickupDate})
        const todayCustomersData = await this.bookingRepository.createQueryBuilder('b')
                                            .select('DISTINCT(customer_id)')
                                            .where("reached_pickup like :pickupDate", {pickupDate: `${pickupDate}%`})
                                            .getRawMany()
        // //console.log(todayCustomers)
        const tripInfo = {
            trip_type: 'onward',
            bookings: []
        }
        let finalCustomers = {};
        for(let todayCustomer of todayCustomersData) {
            let customerId = todayCustomer.customer_id
            let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${customerId},%`)), is_regular: true}})
            if(customer_company_details) {
                if(!finalCustomers[customer_company_details.id]) {
                    finalCustomers[customer_company_details.id] = []
                }
                finalCustomers[customer_company_details.id].push(customerId)
            } else {
                if(!finalCustomers[customerId]) {
                    finalCustomers[customerId] = []
                }
                finalCustomers[customerId].push(customerId)
            }
        }
        
        //console.log(finalCustomers);
        let todayCustomers = [];
        for(let cust in finalCustomers) {
            todayCustomers.push(finalCustomers[cust])
        }
        //console.log(todayCustomers)
        for await (let todayCustomer of todayCustomers) {
            const customerId = todayCustomer
            const todayBookings = await this.bookingRepository.find({where: {customer_id: In(customerId), booking_type: IsNull(), reached_pickup: Like(`${pickupDate}%`)}, order: {id: 'ASC'}})
            let bookingIds = []
            for await (let booking of todayBookings) {
                bookingIds.push(booking.id)
                bookingWeights[booking.id] = booking.commodity_weight 
                bookingCarges[booking.id] = {
                    toll: booking.toll_charges,
                    loadingCharge: booking.loading_charge
                }
            }
            // customerWiseBookings[customerId[0]] = bookingIds
            // //console.log("bookingIds", todayBookings.length)
            // //console.log(bookingIds)
            
            if(bookingIds.length) {
                let tourIdsListInfo = await this.tourRouteRepo.createQueryBuilder('t')
                                    .select('DISTINCT(tour_id)')
                                    .where("booking_id IN (:...bookingIds)", {bookingIds: bookingIds})
                                    .orderBy("tour_id", "ASC")
                                    .getRawMany()
                let tourIdsData = []
                for(let tourId of tourIdsListInfo) {
                    tourIdsData.push(tourId.tour_id)
                }
                // let tours = await this.toursEntity.find({where: {id: In(tourIdsData)}, order: {id: 'ASC'}})
                let tours = await this.toursEntity.find({where: {id: In(tourIdsData)}, order: {tour_date: 'ASC', tour_time: 'ASC'}})
                //for( let tourD of tours) {
                //    //console.log(tourD.id)
                //}
                let driverTours = {}
                for(let tourData of tours) {
                    if(!driverTours[tourData.driver_id]) {
                        driverTours[tourData.driver_id] = []
                    }
                    driverTours[tourData.driver_id].push(tourData.id)

                    if(!driversTrips[tourData.driver_id]) {
                        driversTrips[tourData.driver_id] = []
                    }
                    driversTrips[tourData.driver_id].push(tourData.id)
                    
                }
                
                // //console.log("driverTours")
                // //console.log(driverTours)
                for(let driverId in driverTours) {
                    let tourIdsList = driverTours[driverId]
                    let tourIdIndex = 0
                    let firstTourData = {}
                    let customerTrips = []
                    // //console.log(tourIdsList)
                    let isContinue = false
                    for(let tourId of tourIdsList) {
                        if(isContinue) {
                            isContinue = false
                            tourIdIndex++
                            continue
                        }
                        // //console.log("checking for tour id ==== ", tourId)
                        let tourIds = []
                        let tourData = await this.toursEntity.findOneBy({id: tourId})
                        tourIds.push(tourData.id)
                        let firstTourTrip = await this.findReturnTrip(tourIds, bookingIds, parseInt(driverId))
                        // //console.log("first tour trip")
                        // //console.log(firstTourTrip)
                        if(firstTourTrip.trip_type != 'return') {
                            // //console.log("checking next", tourIdIndex)
                            if(tourIdsList[tourIdIndex+1]) {
                                let nexttourData = await this.toursEntity.findOneBy({id: tourIdsList[tourIdIndex + 1]})
                                // //console.log(nexttourData.driver_id + ' == ' + tourData.driver_id)
                                if(nexttourData.driver_id == tourData.driver_id) {
                                    const secondTourTrip = await this.findReturnTrip([nexttourData.id], bookingIds, parseInt(driverId))
                                    // //console.log("second tour trip")
                                    // //console.log(secondTourTrip)
                                    if(secondTourTrip.trip_type != 'return') {
                                        tourIds.push(nexttourData.id)
                                        const nextTourTrip = await this.findReturnTrip(tourIds, bookingIds, parseInt(driverId))
                                        // //console.log("next tour trip")
                                        // //console.log(nextTourTrip.trip_type, tourIds)
                                        if(nextTourTrip.trip_type == 'return') {
                                            customerTrips.push(nextTourTrip)
                                            isContinue = true
                                        }else {
                                            tourIds.pop()
                                            customerTrips.push(firstTourTrip)
                                        }
                                    } else {
                                        customerTrips.push(firstTourTrip)
                                    }
                                } else {
                                    customerTrips.push(firstTourTrip)
                                }
                            } else {
                                customerTrips.push(firstTourTrip)
                            }
                        } else {
                            customerTrips.push(firstTourTrip)
                        }
                        tourIdIndex++
                        // //console.log("----------------------------")
                    }
                    // //console.log(customerId)
                    // //console.log(customerTrips)
                    // //console.log("*****************************************")
                    if(!customers[customerId[0]]) {
                        customers[customerId[0]] = []
                    }
                    customers[customerId[0]].push({driverId: driverId, trips: customerTrips})
                }
            }
            
            // break
            
            
        }
        // //console.log(JSON.stringify(driversTrips))
        /*for(let driverId in driversTrips) {
            let driverBookingIdsData = await this.tourRouteRepo.createQueryBuilder('t')
                                    .select('DISTINCT(booking_id)')
                                    .where("tour_id IN (:...tourIds)", {tourIds: driversTrips[driverId]})
                                    .orderBy("booking_id", "ASC")
                                    .getRawMany()
            // //console.log("driver ", driverId)
            // //console.log(driverBookingIdsData)
            let driverBookingIds = driverBookingIdsData.map((bData) => {
                return bData.booking_id
            })
            let bookings = await this.bookingRepository.find({where: {id: In(driverBookingIds)}, order: {id: 'ASC'}})
            // //console.log(bookings)
            await this.findSameTimeBookings(bookings)
        }*/
        // let csv = `${'Customer'},${'Driver'},${'Tour'},${'Bookings'},${'Tour Type'}\n`;
        console.log(JSON.stringify(customers))
        for(let cust in customers) {
            let custId = cust
            let tours = ''
            let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${custId},%`))}})
            
            for(let driverData of customers[cust]) {
                for(let trips of driverData.trips) {
                    try {
                        let i = 0
                        let tripDistance = 0;
                        let total_fare = 0;
                        let points_count = 0
                        let nodes_visit = 0
                        await this.findSameTimeBookings(trips.tourRoute)
                        //console.log("initial trip distance ", tripDistance)
                        //console.log(trips.tourRoute)
                        let bookingId = trips.bookings[0];
                        let bookingData = await this.bookingRepository.findOneBy({id: bookingId});
                        if(bookingData && bookingData.total_distance) {
                            tripDistance = parseInt(bookingData.total_distance)
                            // //console.log("trip distance got from booking ......", bookingId, tripDistance)
                            for(let seq of trips.tourRoute) {
                                if(i == 0) {
                                    nodes_visit++
                                }
                                if(trips.tourRoute[i-1]) {
                                    let dis = await this.euclideanDistance(seq.location.coordinates[1], seq.location.coordinates[0], trips.tourRoute[i-1].location.coordinates[1], trips.tourRoute[i-1].location.coordinates[0])
                                    if(dis > 50) {
                                        nodes_visit++
                                    }
                                }
                                i++
                            }
                        } else {
                            for(let seq of trips.tourRoute) {
                                if(trips.tourRoute[i+1]) {
                                    const dis = await this.calcDeadDistance(seq.location, trips.tourRoute[i+1].location);
                                    tripDistance = tripDistance + dis
                                }
                                if(i == 0) {
                                    nodes_visit++
                                }
                                if(trips.tourRoute[i-1]) {
                                    let dis = await this.euclideanDistance(seq.location.coordinates[1], seq.location.coordinates[0], trips.tourRoute[i-1].location.coordinates[1], trips.tourRoute[i-1].location.coordinates[0])
                                    if(dis > 50) {
                                        nodes_visit++
                                    }
                                }
                                i++
                            }
                        }
                        
                        //console.log("final trip distance ", tripDistance)
                        
                        // //console.log("customer ", custId)
                        // //console.log(customer_company_details)
                        let base_fare = 0
                        // //console.log("route length === ", trips.tourRoute.length)
                        //const pickDropCount = (trips.pickup_count > trips.dropoff_count) ? trips.pickup_count - trips.dropoff_count : trips.dropoff_count - trips.pickup_count; 
                        //points_count = (pickDropCount) + (Math.min(trips.pickup_count, trips.dropoff_count)) - (trips.trip_type == 'return' ? 2 : 1)
                        // console.log(trips.tour_ids, points_count)
                        // console.log(points_count, " ====== points count ")
                        // console.log(trips.pickup_count - trips.dropoff_count)
                        // console.log(Math.min(trips.pickup_count, trips.dropoff_count))
                        // console.log(trips.trip_type == 'return' ? 2 : 1)
                        let tripNodesCount = nodes_visit
                        nodes_visit = nodes_visit - 2
                        points_count = nodes_visit - (trips.trip_type == 'return' ? 1 : 0)
                        points_count = (points_count >=0) ? (points_count) : 0
                        // trips.tourRoute ? trips.tourRoute.length : 2
                        
                        let trip_notes = ""
                        let total_trip_weight = 0
                        if(trips.trip_type == 'return' && trips.tour_ids.length > 1) {
                            let tourIdBookings = {}
                            tourIdBookings[trips.tour_ids[0]] = []
                            tourIdBookings[trips.tour_ids[1]] = []
                            trips.tourRoute.map((routD) => {
                                tourIdBookings[routD.tour_id].push(routD.booking_id)
                            })
                            tourIdBookings[trips.tour_ids[0]] = [... new Set(tourIdBookings[trips.tour_ids[0]])]
                            tourIdBookings[trips.tour_ids[1]] = [... new Set(tourIdBookings[trips.tour_ids[1]])]
                            let tour1Weight = 0
                            for(let bookingId of tourIdBookings[trips.tour_ids[0]]) {
                                tour1Weight = tour1Weight + bookingWeights[bookingId]
                            }
                            let tour2Weight = 0
                            for(let bookingId of tourIdBookings[trips.tour_ids[1]]) {
                                tour2Weight = tour2Weight + bookingWeights[bookingId]
                            }
                            total_trip_weight = Math.max(tour1Weight, tour2Weight)
                        } else {
                            // //console.log("-----------------------------------")
                            // //console.log(trips.trip_type)
                            // //console.log(trips.bookings)
                            for(let bookingId of trips.bookings) {
                                total_trip_weight = total_trip_weight + bookingWeights[bookingId]
                            }
                            if(trips.trip_type == 'return') {
                                total_trip_weight = Math.ceil(total_trip_weight/2)
                            } 
                            //un comment below for trip weight
                            /*else {
                                total_trip_weight = Math.ceil(total_trip_weight/(tripNodesCount-1))
                            }*/
                        }
                        const rate_data = await this.getGMRates(total_trip_weight, customer_company_details ? customer_company_details.id : 0)
                        // const rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: customer_company_details ? customer_company_details.id : 0}, order: {quantity: 'ASC'}})
                        
                        if(!customer_company_details) {
                            customer_company_details = this.defaultRates
                        }
                        
                        let baseFareCompaniesList = this.baseFareCompanies.split(",")
                        
                        if(baseFareCompaniesList.indexOf(customer_company_details.id.toString()) > -1) {
                            base_fare = customer_company_details.min_base_fare
                        } else {
                            base_fare = rate_data.base_rate
                        }
                        
                        
                        tripDistance = Math.round(tripDistance)
                        if(tripDistance <=4 ) {
                            total_fare =  base_fare
                            trip_notes = "base fare= "+ base_fare + ", points= "+ points_count + ", additional point =" + customer_company_details.additional_pickup_charge
                        } else {
                            total_trip_weight = Math.ceil(total_trip_weight)
                            // const rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: 0}, order: {quantity: 'ASC'}})
                            //console.log("trip weight ", total_trip_weight)
                            total_fare = (base_fare ? base_fare : rate_data.base_rate) + ((tripDistance-4) * rate_data.rate_per_km)
                            trip_notes = "base fare= "+ (base_fare ? base_fare : rate_data.base_rate) + ", trip distance = " + (tripDistance-4) + ", rate per km = " + rate_data.rate_per_km + ", points= "+ points_count + ", additional point =" + customer_company_details.additional_pickup_charge
                        }
                        
                        if(trips.trip_type == 'return') {
                            total_fare = total_fare * customer_company_details.return_percentage_value
                            trip_notes = trip_notes + ", total fare = " + total_fare + ", return val = " + customer_company_details.return_percentage_value
                        } else {
                            if(tripDistance > this.deamMilesLimit) {
                                const dead_miles_price_per_km = customer_company_details.dead_miles_price
                                //console.log(customer_company_details.company_name, customer_company_details.dead_miles_price, dead_miles_price_per_km)
                                const dead_miles_price = tripDistance * dead_miles_price_per_km
                                total_fare = total_fare + dead_miles_price
                                trip_notes = trip_notes + ", dead miles fare = " + dead_miles_price
                            }
                        }
                        total_fare = total_fare + (points_count * customer_company_details.additional_pickup_charge)
                        let final_fare = Math.round(total_fare > customer_company_details.min_base_fare ? total_fare : customer_company_details.min_base_fare)
                        let fareDetails = {
                            driver_id: driverData.driverId,
                            tour_ids: trips.tour_ids.join(","),
                            booking_ids: trips.bookings.join(","),
                            total_distance: tripDistance,
                            trip_date: pickupDate,
                            total_fare: final_fare,
                            trip_type: trips.trip_type,
                            customer_id: parseInt(custId),
                            no_points: points_count,
                            trip_weight: total_trip_weight,
                            trip_notes: trip_notes
                        }
                        // //console.log("customer ", custId)
                        // //console.log(customer_company_details)
                        // //console.log(fareDetails)
                        await this.driverTripFareDetails.save(fareDetails)
                        let bCost = Math.round(final_fare/trips.bookings.length)
                        let bookingCost = bCost > base_fare ? bCost : base_fare
                        
                        let waiting_charge = 0
                        if(customer_company_details.waiting_charge_type == 'T1') {
                            waiting_charge = await this.caliculateT1WaitingCharge(nodes_visit, trips.bookings, trips.tour_ids)
                        } else if(customer_company_details.waiting_charge_type == 'T2') {
                            waiting_charge = await this.caliculateT2WaitingCharge(nodes_visit, trips.bookings, tripDistance, trips.tour_ids)
                        } 
                        let waiting_charge_value = waiting_charge > 0 ? Math.round(waiting_charge/trips.bookings.length) : 0
                        for(let bookingId of trips.bookings) {
                            let bookingFare = bookingCost
                            // add loading/unloading charges
                            // bookingCost = bookingCost + (bookingCarges[bookingId].loadingCharge ? bookingCarges[bookingId].loadingCharge : 0)
                            // bookingCost = bookingCost + loadingCharges['loadingCharge']
                            // if(bookingCarges[bookingId].both_loading_unloading_charge_applicable) {
                            //     bookingCost = bookingCost + loadingCharges['both']
                            // } else {
                            //     if(bookingCarges[bookingId].loading_charge_applicable) {
                            //         bookingCost = bookingCost + loadingCharges['loading']
                            //     }
                            //     if(bookingCarges[bookingId].unloading_charge_applicable) {
                            //         bookingCost = bookingCost + loadingCharges['unloading']
                            //     }
                            // }
                            //end of loading/unloading charges
                            if(customer_company_details && splCompanyIds.indexOf(customer_company_details.id) >= 0) {
                                bookingFare = await this.rCalSpecialCompanies(customer_company_details, bookingId, trips.trip_type);
                            } else {
                                let isFindData = await this.findSpecialAddress(splAddresses, bookingId);
                                if(isFindData.found) {
                                    bookingFare = bookingCost + isFindData.amount
                                }
                            }
                            await this.bookingRepository.update({id: bookingId}, {fare: bookingFare.toString(), waiting_charge: waiting_charge_value.toString(), total_distance: tripDistance.toString()})
                            
                            
                        }
                    } catch(e) {
                        //console.log("problem in cal ", e)
                    }
                    
                    // csv = csv + `${custId},${driverData.driverId},${trips.tour_ids.join("-")},${trips.bookings.join("-")},${trips.trip_type}\n`;
                }
                if(customer_company_details.has_daily_limit) {
                    await this.checkDailyFareForDriverCustomer(driverData.trips)
                }
                
            }
            
            
            
        }
        
        return calcStatus
    } 

    async revenueCalculationManual(reqBody: any): Promise<any> {
        let pickupDate = reqBody.calc_date
        let calcStatus = true
        let customers = {}
        let bookingWeights = {}
        let bookingCarges = {}
        let driversTrips = {}
        const loadingCharges = {
            both: 200,
            loading: 100,
            unloading: 100
        }
        const splAddresses = await this.splAddressRepo.find({});
        const splCompanyIds = [4, 7];
        // let customerWiseBookings = {};
        // await this.driverTripFareDetails.delete({trip_date: pickupDate})
        // const todayCustomersData = await this.bookingRepository.createQueryBuilder('b')
        //                                     .select('DISTINCT(customer_id)')
        //                                     .where("reached_pickup like :pickupDate", {pickupDate: `${pickupDate}%`})
        //                                     .getRawMany()
        //console.log(todayCustomers)
        const tripInfo = {
            trip_type: 'onward',
            bookings: []
        }
        let finalCustomers = {};
        //hard coding for customers
        let todayCustomersData = [];
        
        // let customer_ids = [390, 888, 887, 389, 391, 392, 399, 400, 402, 396, 403, 425, 409, 537, 740, 787, 835, 538, 876, 651, 938, 971];
        let customer_ids = [1604];
        for(let cId of customer_ids) {
            todayCustomersData.push({customer_id: cId})
        }

        for(let todayCustomer of todayCustomersData) {
            let customerId = todayCustomer.customer_id
            let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${customerId},%`)), is_regular: true}})
            if(customer_company_details) {
                if(!finalCustomers[customer_company_details.id]) {
                    finalCustomers[customer_company_details.id] = []
                }
                finalCustomers[customer_company_details.id].push(customerId)
            } else {
                if(!finalCustomers[customerId]) {
                    finalCustomers[customerId] = []
                }
                finalCustomers[customerId].push(customerId)
            }
        }
        
        //console.log(finalCustomers);
        let todayCustomers = [];
        for(let cust in finalCustomers) {
            todayCustomers.push(finalCustomers[cust])
        }
        //console.log(todayCustomers)
        for await (let todayCustomer of todayCustomers) {
            const customerId = todayCustomer
            const todayBookings = await this.bookingRepository.find({where: {customer_id: In(customerId), booking_type: IsNull(), reached_pickup: Like(`${pickupDate}%`)}, order: {id: 'ASC'}})
            let bookingIds = []
            for await (let booking of todayBookings) {
                bookingIds.push(booking.id)
                bookingWeights[booking.id] = booking.commodity_weight 
                bookingCarges[booking.id] = {
                    toll: booking.toll_charges,
                    loadingCharge: booking.loading_charge
                }
            }
            // customerWiseBookings[customerId[0]] = bookingIds
            // //console.log("bookingIds", todayBookings.length)
            // //console.log(bookingIds)
            
            if(bookingIds.length) {
                let tourIdsListInfo = await this.tourRouteRepo.createQueryBuilder('t')
                                    .select('DISTINCT(tour_id)')
                                    .where("booking_id IN (:...bookingIds)", {bookingIds: bookingIds})
                                    .orderBy("tour_id", "ASC")
                                    .getRawMany()
                let tourIdsData = []
                for(let tourId of tourIdsListInfo) {
                    tourIdsData.push(tourId.tour_id)
                }
                // let tours = await this.toursEntity.find({where: {id: In(tourIdsData)}, order: {id: 'ASC'}})
                let tours = await this.toursEntity.find({where: {id: In(tourIdsData)}, order: {tour_date: 'ASC', tour_time: 'ASC'}})
                //for( let tourD of tours) {
                //    //console.log(tourD.id)
                //}
                let driverTours = {}
                for(let tourData of tours) {
                    if(!driverTours[tourData.driver_id]) {
                        driverTours[tourData.driver_id] = []
                    }
                    driverTours[tourData.driver_id].push(tourData.id)

                    if(!driversTrips[tourData.driver_id]) {
                        driversTrips[tourData.driver_id] = []
                    }
                    driversTrips[tourData.driver_id].push(tourData.id)
                    
                }
                
                // //console.log("driverTours")
                // //console.log(driverTours)
                for(let driverId in driverTours) {
                    let tourIdsList = driverTours[driverId]
                    let tourIdIndex = 0
                    let firstTourData = {}
                    let customerTrips = []
                    // //console.log(tourIdsList)
                    let isContinue = false
                    for(let tourId of tourIdsList) {
                        if(isContinue) {
                            isContinue = false
                            tourIdIndex++
                            continue
                        }
                        // //console.log("checking for tour id ==== ", tourId)
                        let tourIds = []
                        let tourData = await this.toursEntity.findOneBy({id: tourId})
                        tourIds.push(tourData.id)
                        let firstTourTrip = await this.findReturnTrip(tourIds, bookingIds, parseInt(driverId))
                        // //console.log("first tour trip")
                        // //console.log(firstTourTrip)
                        if(firstTourTrip.trip_type != 'return') {
                            // //console.log("checking next", tourIdIndex)
                            if(tourIdsList[tourIdIndex+1]) {
                                let nexttourData = await this.toursEntity.findOneBy({id: tourIdsList[tourIdIndex + 1]})
                                // //console.log(nexttourData.driver_id + ' == ' + tourData.driver_id)
                                if(nexttourData.driver_id == tourData.driver_id) {
                                    const secondTourTrip = await this.findReturnTrip([nexttourData.id], bookingIds, parseInt(driverId))
                                    // //console.log("second tour trip")
                                    // //console.log(secondTourTrip)
                                    if(secondTourTrip.trip_type != 'return') {
                                        tourIds.push(nexttourData.id)
                                        const nextTourTrip = await this.findReturnTrip(tourIds, bookingIds, parseInt(driverId))
                                        // //console.log("next tour trip")
                                        // //console.log(nextTourTrip.trip_type, tourIds)
                                        if(nextTourTrip.trip_type == 'return') {
                                            customerTrips.push(nextTourTrip)
                                            isContinue = true
                                        }else {
                                            tourIds.pop()
                                            customerTrips.push(firstTourTrip)
                                        }
                                    } else {
                                        customerTrips.push(firstTourTrip)
                                    }
                                } else {
                                    customerTrips.push(firstTourTrip)
                                }
                            } else {
                                customerTrips.push(firstTourTrip)
                            }
                        } else {
                            customerTrips.push(firstTourTrip)
                        }
                        tourIdIndex++
                        // //console.log("----------------------------")
                    }
                    // //console.log(customerId)
                    // //console.log(customerTrips)
                    // //console.log("*****************************************")
                    if(!customers[customerId[0]]) {
                        customers[customerId[0]] = []
                    }
                    customers[customerId[0]].push({driverId: driverId, trips: customerTrips})
                }
            }
            
            // break
            
            
        }
        // //console.log(JSON.stringify(driversTrips))
        /*for(let driverId in driversTrips) {
            let driverBookingIdsData = await this.tourRouteRepo.createQueryBuilder('t')
                                    .select('DISTINCT(booking_id)')
                                    .where("tour_id IN (:...tourIds)", {tourIds: driversTrips[driverId]})
                                    .orderBy("booking_id", "ASC")
                                    .getRawMany()
            // //console.log("driver ", driverId)
            // //console.log(driverBookingIdsData)
            let driverBookingIds = driverBookingIdsData.map((bData) => {
                return bData.booking_id
            })
            let bookings = await this.bookingRepository.find({where: {id: In(driverBookingIds)}, order: {id: 'ASC'}})
            // //console.log(bookings)
            await this.findSameTimeBookings(bookings)
        }*/
        // let csv = `${'Customer'},${'Driver'},${'Tour'},${'Bookings'},${'Tour Type'}\n`;
        console.log(JSON.stringify(customers))
        for(let cust in customers) {
            let custId = cust
            let tours = ''
            let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${custId},%`))}})
            
            for(let driverData of customers[cust]) {
                for(let trips of driverData.trips) {
                    // console.log(trips.bookings)
                    try {
                        let i = 0
                        let tripDistance = 0;
                        let total_fare = 0;
                        let points_count = 0
                        let nodes_visit = 0
                        // await this.findSameTimeBookings(trips.tourRoute)
                        //console.log("initial trip distance ", tripDistance)
                        //console.log(trips.tourRoute)
                        let bookingId = trips.bookings[0];
                        let bookingData = await this.bookingRepository.findOneBy({id: bookingId});
                        if(bookingData && bookingData.total_distance) {
                            tripDistance = parseInt(bookingData.total_distance)
                            // //console.log("trip distance got from booking ......", bookingId, tripDistance)
                            for(let seq of trips.tourRoute) {
                                if(i == 0) {
                                    nodes_visit++
                                }
                                if(trips.tourRoute[i-1]) {
                                    let dis = await this.euclideanDistance(seq.location.coordinates[1], seq.location.coordinates[0], trips.tourRoute[i-1].location.coordinates[1], trips.tourRoute[i-1].location.coordinates[0])
                                    if(dis > 50) {
                                        nodes_visit++
                                    }
                                }
                                i++
                            }
                            // console.log("existing distance ", bookingData.id)
                        } else {
                            for(let seq of trips.tourRoute) {
                                if(trips.tourRoute[i+1]) {
                                    const dis = await this.calcDeadDistance(seq.location, trips.tourRoute[i+1].location);
                                    console.log("dis === ", dis)
                                    tripDistance = tripDistance + dis
                                }
                                if(i == 0) {
                                    nodes_visit++
                                }
                                if(trips.tourRoute[i-1]) {
                                    let dis = await this.euclideanDistance(seq.location.coordinates[1], seq.location.coordinates[0], trips.tourRoute[i-1].location.coordinates[1], trips.tourRoute[i-1].location.coordinates[0])
                                    if(dis > 50) {
                                        nodes_visit++
                                    }
                                }
                                i++
                            }
                        }
                        
                        //console.log("final trip distance ", tripDistance)
                        
                        // //console.log("customer ", custId)
                        // //console.log(customer_company_details)
                        let base_fare = 0
                        // //console.log("route length === ", trips.tourRoute.length)
                        //const pickDropCount = (trips.pickup_count > trips.dropoff_count) ? trips.pickup_count - trips.dropoff_count : trips.dropoff_count - trips.pickup_count; 
                        //points_count = (pickDropCount) + (Math.min(trips.pickup_count, trips.dropoff_count)) - (trips.trip_type == 'return' ? 2 : 1)
                        // console.log(trips.tour_ids, points_count)
                        // console.log(points_count, " ====== points count ")
                        // console.log(trips.pickup_count - trips.dropoff_count)
                        // console.log(Math.min(trips.pickup_count, trips.dropoff_count))
                        // console.log(trips.trip_type == 'return' ? 2 : 1)
                        let tripNodesCount = nodes_visit
                        nodes_visit = nodes_visit - 2
                        points_count = nodes_visit - (trips.trip_type == 'return' ? 1 : 0)
                        points_count = (points_count >=0) ? (points_count) : 0
                        // trips.tourRoute ? trips.tourRoute.length : 2
                        
                        let trip_notes = ""
                        let total_trip_weight = 0
                        if(trips.trip_type == 'return' && trips.tour_ids.length > 1) {
                            let tourIdBookings = {}
                            tourIdBookings[trips.tour_ids[0]] = []
                            tourIdBookings[trips.tour_ids[1]] = []
                            trips.tourRoute.map((routD) => {
                                tourIdBookings[routD.tour_id].push(routD.booking_id)
                            })
                            tourIdBookings[trips.tour_ids[0]] = [... new Set(tourIdBookings[trips.tour_ids[0]])]
                            tourIdBookings[trips.tour_ids[1]] = [... new Set(tourIdBookings[trips.tour_ids[1]])]
                            let tour1Weight = 0
                            for(let bookingId of tourIdBookings[trips.tour_ids[0]]) {
                                tour1Weight = tour1Weight + bookingWeights[bookingId]
                            }
                            let tour2Weight = 0
                            for(let bookingId of tourIdBookings[trips.tour_ids[1]]) {
                                tour2Weight = tour2Weight + bookingWeights[bookingId]
                            }
                            total_trip_weight = Math.max(tour1Weight, tour2Weight)
                        } else {
                            // //console.log("-----------------------------------")
                            // //console.log(trips.trip_type)
                            // //console.log(trips.bookings)
                            for(let bookingId of trips.bookings) {
                                total_trip_weight = total_trip_weight + bookingWeights[bookingId]
                            }
                            if(trips.trip_type == 'return') {
                                total_trip_weight = Math.ceil(total_trip_weight/2)
                            } 
                            //un comment below for trip weight
                            /*else {
                                total_trip_weight = Math.ceil(total_trip_weight/(tripNodesCount-1))
                            }*/
                        }
                        const rate_data = await this.getGMRates(total_trip_weight, customer_company_details ? customer_company_details.id : 0)
                        // const rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: customer_company_details ? customer_company_details.id : 0}, order: {quantity: 'ASC'}})
                        
                        if(!customer_company_details) {
                            customer_company_details = this.defaultRates
                        }
                        
                        let baseFareCompaniesList = this.baseFareCompanies.split(",")
                        
                        if(baseFareCompaniesList.indexOf(customer_company_details.id.toString()) > -1) {
                            base_fare = customer_company_details.min_base_fare
                        } else {
                            base_fare = rate_data.base_rate
                        }
                        
                        
                        tripDistance = Math.round(tripDistance)
                        if(tripDistance <=4 ) {
                            total_fare =  base_fare
                            trip_notes = "base fare= "+ base_fare + ", points= "+ points_count + ", additional point =" + customer_company_details.additional_pickup_charge
                        } else {
                            total_trip_weight = Math.ceil(total_trip_weight)
                            // const rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: 0}, order: {quantity: 'ASC'}})
                            //console.log("trip weight ", total_trip_weight)
                            total_fare = (base_fare ? base_fare : rate_data.base_rate) + ((tripDistance-4) * rate_data.rate_per_km)
                            trip_notes = "base fare= "+ (base_fare ? base_fare : rate_data.base_rate) + ", trip distance = " + (tripDistance-4) + ", rate per km = " + rate_data.rate_per_km + ", points= "+ points_count + ", additional point =" + customer_company_details.additional_pickup_charge
                        }
                        
                        if(trips.trip_type == 'return') {
                            total_fare = total_fare * customer_company_details.return_percentage_value
                            trip_notes = trip_notes + ", total fare = " + total_fare + ", return val = " + customer_company_details.return_percentage_value
                        } else {
                            if(tripDistance > this.deamMilesLimit) {
                                const dead_miles_price_per_km = customer_company_details.dead_miles_price
                                //console.log(customer_company_details.company_name, customer_company_details.dead_miles_price, dead_miles_price_per_km)
                                const dead_miles_price = tripDistance * dead_miles_price_per_km
                                total_fare = total_fare + dead_miles_price
                                trip_notes = trip_notes + ", dead miles fare = " + dead_miles_price
                            }
                        }
                        total_fare = total_fare + (points_count * customer_company_details.additional_pickup_charge)
                        let final_fare = Math.round(total_fare > customer_company_details.min_base_fare ? total_fare : customer_company_details.min_base_fare)
                        let fareDetails = {
                            driver_id: driverData.driverId,
                            tour_ids: trips.tour_ids.join(","),
                            booking_ids: trips.bookings.join(","),
                            total_distance: tripDistance,
                            trip_date: pickupDate,
                            total_fare: final_fare,
                            trip_type: trips.trip_type,
                            customer_id: parseInt(custId),
                            no_points: points_count,
                            trip_weight: total_trip_weight,
                            trip_notes: trip_notes
                        }
                        // //console.log("customer ", custId)
                        // //console.log(customer_company_details)
                        // console.log(fareDetails)
                        // await this.driverTripFareDetails.save(fareDetails)
                        let bCost = Math.round(final_fare/trips.bookings.length)
                        let bookingCost = bCost > base_fare ? bCost : base_fare
                        
                        let waiting_charge = 0
                        if(customer_company_details.waiting_charge_type == 'T1') {
                            waiting_charge = await this.caliculateT1WaitingCharge(nodes_visit, trips.bookings)
                        } else if(customer_company_details.waiting_charge_type == 'T2') {
                            waiting_charge = await this.caliculateT2WaitingCharge(nodes_visit, trips.bookings, tripDistance)
                        } 
                        let waiting_charge_value = waiting_charge > 0 ? Math.round(waiting_charge/trips.bookings.length) : 0
                        for(let bookingId of trips.bookings) {
                            let bookingFare = bookingCost
                            // add loading/unloading charges
                            // bookingCost = bookingCost + (bookingCarges[bookingId].loadingCharge ? bookingCarges[bookingId].loadingCharge : 0)
                            // bookingCost = bookingCost + loadingCharges['loadingCharge']
                            // if(bookingCarges[bookingId].both_loading_unloading_charge_applicable) {
                            //     bookingCost = bookingCost + loadingCharges['both']
                            // } else {
                            //     if(bookingCarges[bookingId].loading_charge_applicable) {
                            //         bookingCost = bookingCost + loadingCharges['loading']
                            //     }
                            //     if(bookingCarges[bookingId].unloading_charge_applicable) {
                            //         bookingCost = bookingCost + loadingCharges['unloading']
                            //     }
                            // }
                            //end of loading/unloading charges
                            if(customer_company_details && splCompanyIds.indexOf(customer_company_details.id) >= 0) {
                                bookingFare = await this.rCalSpecialCompanies(customer_company_details, bookingId, trips.trip_type);
                            } else {
                                let isFindData = await this.findSpecialAddress(splAddresses, bookingId);
                                if(isFindData.found) {
                                    // console.log("have spl addr ", bookingId,  isFindData.amount, bookingCost)
                                    bookingFare = bookingCost + isFindData.amount
                                }
                            }
                            // 50124, 50051.  
                            // console.log("booking Fares ", trips.trip_type, bookingId, bookingCost, waiting_charge_value, tripDistance, trip_notes)
                            console.log(bookingId, bookingFare, tripDistance, trips.trip_type, trip_notes)
                            // await this.bookingRepository.update({id: bookingId}, {fare: bookingCost.toString(), waiting_charge: waiting_charge_value.toString(), total_distance: tripDistance.toString()})
                            
                            
                        }
                    } catch(e) {
                        //console.log("problem in cal ", e)
                    }
                    
                    // csv = csv + `${custId},${driverData.driverId},${trips.tour_ids.join("-")},${trips.bookings.join("-")},${trips.trip_type}\n`;
                }
                if(customer_company_details.has_daily_limit) {
                    await this.checkDailyFareForDriverCustomer(driverData.trips)
                }
                
            }
            
            
            
        }
        
        return calcStatus
    } 

    async revenueCalculationNew(reqBody: any): Promise<any> {
        let pickupDate = reqBody.calc_date
        let calcStatus = true
        let customers = {}
        let bookingWeights = {}
        let driversTrips = {}
        await this.driverTripFareDetails.delete({trip_date: pickupDate})
        const todayCustomers = await this.bookingRepository.createQueryBuilder('b')
                                            .select('DISTINCT(customer_id)')
                                            .where("pickup_time like :pickupDate", {pickupDate: `${pickupDate}%`})
                                            .getRawMany()
        // //console.log(todayCustomers)
        const tripInfo = {
            trip_type: 'onward',
            bookings: []
        }
        for await (let todayCustomer of todayCustomers) {
            const customerId = todayCustomer.customer_id
            let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like(`%#${todayCustomer.customer_id},%`)}})
            const companyId = customer_company_details ? customer_company_details.id :  customerId
            //console.log(companyId,  "company id")
            let customerIds = []
            if(customer_company_details) {
                customerIds = customer_company_details.users.split(",")
                customerIds.pop()
                customerIds = customerIds.map((c)=> {
                    c=c.trim()
                    return c.replace('#', '')
                })
            }
            let todayBookings = await this.bookingRepository.find({where: {customer_id: In(customerIds), pickup_time: Like(`${pickupDate}%`)}, order: {id: 'ASC'}})
            let bookingIds = []
            for await (let booking of todayBookings) {
                bookingIds.push(booking.id)
                bookingWeights[booking.id] = booking.commodity_weight 
            }
            let tourIdsListInfo = await this.tourRouteRepo.createQueryBuilder('t')
                                    .select('DISTINCT(tour_id)')
                                    .where("booking_id IN (:...bookingIds)", {bookingIds: bookingIds})
                                    .orderBy("tour_id", "ASC")
                                    .getRawMany()
            let tourIdsData = []
            for(let tourId of tourIdsListInfo) {
                tourIdsData.push(tourId.tour_id)
            }
            const trips = await this.tripRepo.find({where:{customer_id:  customerId, tour_id: In(tourIdsData)}})
            let tBIds = []
            for(let tripData of trips) {
                tBIds.push(tripData.booking_id)
            }
            todayBookings = await this.bookingRepository.find({where: {customer_id: customerId, id:  In(tBIds)}, order: {id: 'ASC'}})
            let tours = await this.toursEntity.find({where: {id: In(tourIdsData)}, order: {id: 'ASC'}})
            let driverTours = {}
            for(let tourData of tours) {
                if(!driverTours[tourData.driver_id]) {
                    driverTours[tourData.driver_id] = []
                }
                driverTours[tourData.driver_id].push(tourData.id)

                if(!driversTrips[tourData.driver_id]) {
                    driversTrips[tourData.driver_id] = []
                }
                driversTrips[tourData.driver_id].push(tourData.id)
                
            }
            
            // //console.log("driverTours")
            // //console.log(driverTours)
            for(let driverId in driverTours) {
                let tourIdsList = driverTours[driverId]
                let tourIdIndex = 0
                let firstTourData = {}
                let customerTrips = []
                // //console.log(tourIdsList)
                let isContinue = false
                for(let tourId of tourIdsList) {
                    if(isContinue) {
                        isContinue = false
                        tourIdIndex++
                        continue
                    }
                    // //console.log("checking for tour id ==== ", tourId)
                    let tourIds = []
                    let tourData = await this.toursEntity.findOneBy({id: tourId})
                    tourIds.push(tourData.id)
                    let firstTourTrip = await this.findReturnTrip(tourIds, bookingIds, parseInt(driverId))
                    // //console.log("first tour trip")
                    // //console.log(firstTourTrip)
                    if(firstTourTrip.trip_type != 'return') {
                        // //console.log("checking next", tourIdIndex)
                        if(tourIdsList[tourIdIndex+1]) {
                            let nexttourData = await this.toursEntity.findOneBy({id: tourIdsList[tourIdIndex + 1]})
                            //console.log(nexttourData.driver_id + ' == ' + tourData.driver_id)
                            if(nexttourData.driver_id == tourData.driver_id) {
                                const secondTourTrip = await this.findReturnTrip([nexttourData.id], bookingIds, parseInt(driverId))
                                // //console.log("second tour trip")
                                // //console.log(secondTourTrip)
                                if(secondTourTrip.trip_type != 'return') {
                                    tourIds.push(nexttourData.id)
                                    const nextTourTrip = await this.findReturnTrip(tourIds, bookingIds, parseInt(driverId))
                                    // //console.log("next tour trip")
                                    // //console.log(nextTourTrip)
                                    if(nextTourTrip.trip_type == 'return') {
                                        customerTrips.push(nextTourTrip)
                                        isContinue = true
                                    }else {
                                        tourIds.pop()
                                        customerTrips.push(firstTourTrip)
                                    }
                                } else {
                                    customerTrips.push(firstTourTrip)
                                }
                            } else {
                                customerTrips.push(firstTourTrip)
                            }
                        } else {
                            customerTrips.push(firstTourTrip)
                        }
                    } else {
                        customerTrips.push(firstTourTrip)
                    }
                    tourIdIndex++
                    // //console.log("----------------------------")
                }
                // //console.log(customerId)
                // //console.log(customerTrips)
                // //console.log("*****************************************")
                if(!customers[companyId]) {
                    customers[companyId] = []
                }
                let existingDriver = false
                for(let driver of  customers[companyId]) {
                    if(driver.driverId == driverId)  {
                        driver.trips = driver.trips.concat(customerTrips)
                        existingDriver = true
                    }
                }
                if(!existingDriver) {
                    customers[companyId].push({driverId: driverId, trips: customerTrips})
                }
                
            }
            // break
            
            
        }
        // //console.log(JSON.stringify(driversTrips))
        /*for(let driverId in driversTrips) {
            let driverBookingIdsData = await this.tourRouteRepo.createQueryBuilder('t')
                                    .select('DISTINCT(booking_id)')
                                    .where("tour_id IN (:...tourIds)", {tourIds: driversTrips[driverId]})
                                    .orderBy("booking_id", "ASC")
                                    .getRawMany()
            // //console.log("driver ", driverId)
            // //console.log(driverBookingIdsData)
            let driverBookingIds = driverBookingIdsData.map((bData) => {
                return bData.booking_id
            })
            let bookings = await this.bookingRepository.find({where: {id: In(driverBookingIds)}, order: {id: 'ASC'}})
            // //console.log(bookings)
            await this.findSameTimeBookings(bookings)
        }*/
        //console.log(JSON.stringify(customers))
        // let csv = `${'Customer'},${'Driver'},${'Tour'},${'Bookings'},${'Tour Type'}\n`;
        let csv = `${'Booking Id'},${'Fare'}\n`;
        for(let cust in customers) {
            let custId = cust
            let tours = ''
            for(let driverData of customers[cust]) {
                for(let trips of driverData.trips) {
                    try {
                        let i = 0
                        let tripDistance = 0;
                        let total_fare = 0;
                        let points_count = 0
                        let nodes_visit = 0
                        await this.findSameTimeBookings(trips.tourRoute)
                        for(let seq of trips.tourRoute) {
                            if(trips.tourRoute[i+1]) {
                                const dis = await this.calcDeadDistance(seq.location, trips.tourRoute[i+1].location);
                                // const dis = 5
                                tripDistance = tripDistance + dis
                            }
                            if(i == 0) {
                                nodes_visit++
                            }
                            if(trips.tourRoute[i-1] && seq.location_address != trips.tourRoute[i-1].location_address) {
                                // //console.log("node count ++", seq.location_address, "---", trips.tourRoute[i-1].location_address)
                                nodes_visit++
                            }
                            i++
                        }

                        let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{id: parseInt(custId)}})
                        // //console.log("customer ", custId)
                        // //console.log(customer_company_details)
                        let base_fare = 0
                        // //console.log("route length === ", trips.tourRoute.length)
                        //const pickDropCount = (trips.pickup_count > trips.dropoff_count) ? trips.pickup_count - trips.dropoff_count : trips.dropoff_count - trips.pickup_count; 
                        //points_count = (pickDropCount) + (Math.min(trips.pickup_count, trips.dropoff_count)) - (trips.trip_type == 'return' ? 2 : 1)
                        // //console.log(trips.tour_ids, points_count)
                        // //console.log(points_count, " ====== points count ")
                        // //console.log(trips.pickup_count - trips.dropoff_count)
                        // //console.log(Math.min(trips.pickup_count, trips.dropoff_count))
                        // //console.log(trips.trip_type == 'return' ? 2 : 1)
                        nodes_visit = nodes_visit - 2
                        points_count = nodes_visit - (trips.trip_type == 'return' ? 1 : 0)
                        points_count = (points_count >=0) ? (points_count) : 0
                        // trips.tourRoute ? trips.tourRoute.length : 2
                        if(!customer_company_details) {
                            customer_company_details = this.defaultRates
                        }
                        base_fare = customer_company_details.min_base_fare
                        let trip_notes = ""
                        let total_trip_weight = 0
                        if(trips.trip_type == 'return' && trips.tour_ids.length > 1) {
                            let tourIdBookings = {}
                            tourIdBookings[trips.tour_ids[0]] = []
                            tourIdBookings[trips.tour_ids[1]] = []
                            trips.tourRoute.map((routD) => {
                                tourIdBookings[routD.tour_id].push(routD.booking_id)
                            })
                            tourIdBookings[trips.tour_ids[0]] = [... new Set(tourIdBookings[trips.tour_ids[0]])]
                            tourIdBookings[trips.tour_ids[1]] = [... new Set(tourIdBookings[trips.tour_ids[1]])]
                            let tour1Weight = 0
                            for(let bookingId of tourIdBookings[trips.tour_ids[0]]) {
                                tour1Weight = tour1Weight + bookingWeights[bookingId]
                            }
                            let tour2Weight = 0
                            for(let bookingId of tourIdBookings[trips.tour_ids[1]]) {
                                tour2Weight = tour2Weight + bookingWeights[bookingId]
                            }
                            total_trip_weight = Math.max(tour1Weight, tour2Weight)
                            //console.log("taking max weight ", total_trip_weight,  tour1Weight, tour2Weight)
                        } else {
                            for(let bookingId of trips.bookings) {
                                total_trip_weight = total_trip_weight + bookingWeights[bookingId]
                            }
                        }
                        
                        tripDistance = Math.round(tripDistance)
                        if(tripDistance <=4 ) {
                            total_fare =  base_fare
                            trip_notes = "base fare= "+ base_fare + ", points= "+ points_count + ", additional point =" + customer_company_details.additional_pickup_charge
                        } else {
                            const rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: 0}, order: {quantity: 'ASC'}})
                            // //console.log("trip weight ", total_trip_weight)
                            total_fare = (base_fare ? base_fare : rate_data.base_rate) + ((tripDistance-4) * rate_data.rate_per_km)
                            trip_notes = "base fare= "+ (base_fare ? base_fare : rate_data.base_rate) + ", trip distance = " + (tripDistance-4) + ", rate per km = " + rate_data.rate_per_km + ", points= "+ points_count + ", additional point =" + customer_company_details.additional_pickup_charge
                        }
                        
                        if(trips.trip_type == 'return') {
                            total_fare = total_fare * customer_company_details.return_percentage_value
                            trip_notes = trip_notes + ", total fare = " + total_fare + ", return val = " + customer_company_details.return_percentage_value
                        }
                        total_fare = total_fare + (points_count * customer_company_details.additional_pickup_charge)
                        let final_fare = Math.round(total_fare > customer_company_details.min_base_fare ? total_fare : customer_company_details.min_base_fare)
                        let fareDetails = {
                            driver_id: driverData.driverId,
                            tour_ids: trips.tour_ids.join(","),
                            booking_ids: trips.bookings.join(","),
                            total_distance: tripDistance,
                            trip_date: pickupDate,
                            total_fare: final_fare,
                            trip_type: trips.trip_type,
                            customer_id: parseInt(custId),
                            no_points: points_count,
                            trip_weight: total_trip_weight,
                            trip_notes: trip_notes
                        }
                        // //console.log("customer ", custId)
                        // //console.log(customer_company_details)
                        // //console.log(fareDetails)
                        // await this.driverTripFareDetails.save(fareDetails)
                        let bCost = Math.round(final_fare/trips.bookings.length)
                        let bookingCost = bCost > base_fare ? bCost : base_fare
                        let waiting_charge = 0
                        if(customer_company_details.waiting_charge_type == 'T1') {
                            waiting_charge = await this.caliculateT1WaitingCharge(nodes_visit, trips.bookings)
                        } else if(customer_company_details.waiting_charge_type == 'T2') {
                            waiting_charge = await this.caliculateT2WaitingCharge(nodes_visit, trips.bookings, tripDistance)
                        } 
                        let waiting_charge_value = waiting_charge > 0 ? Math.round(waiting_charge/trips.bookings.length) : 0
                        for(let bookingId of trips.bookings) {
                            // await this.bookingRepository.update({id: bookingId}, {fare: bookingCost.toString(), waiting_charge: waiting_charge_value.toString(), total_distance: tripDistance.toString()})
                            //console.log(bookingId, bookingCost, waiting_charge_value, tripDistance)
                            //console.log(bookingId,  trip_notes)
                            csv = csv + `${bookingId},\t${bookingCost}\n`;
                        }
                    } catch(e) {
                        //console.log("problem in cal ", e)
                    }
                    
                    // csv = csv + `${custId},${driverData.driverId},${trips.tour_ids.join("-")},${trips.bookings.join("-")},${trips.trip_type}\n`;
                }
            }
            
        }
        //console.log(csv)
        return calcStatus
    } 

    

   /* async haversine(pt1, pt2){
        Number.prototype.toRad = function() {
          return (this * Math.PI) / 180;
        };
      
        var lat1 = pt1[0];
        var lon1 = pt1[1];
      
        var lat2 = pt2[0];
        var lon2 = pt2[1];
      
        var R = 6371; // km
        //has a problem with the .toRad() method below.
        var x1 = lat2 - lat1;
        var dLat = x1.toRad();
        var x2 = lon2 - lon1;
        var dLon = x2.toRad();
        var a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1.toRad()) *
            Math.cos(lat2.toRad()) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
      
        return d;
        // return d / 1.6;
      }*/

    async driverGPSSummary(reqBody: any): Promise<any> {
        const driverId = reqBody.driver_id
        let startDate = reqBody.start_date
        const endDate = reqBody.end_date
        let total_distance = 0
        let total_time = 0
        let no_points = 0
        const gpsDataTimes = await this.locationsRepo.createQueryBuilder('l')
                                    .select('max(loc_time) as end_time, min(loc_time) as start_time')
                                    .where('user_id = :driverId and loc_time > :startDate and loc_time < :endDate and tour_id != 0', {driverId: driverId, startDate: startDate, endDate:endDate })
                                    .getRawMany()
        //console.log(gpsDataTimes)
        
        const gpsData = await this.locationsRepo.createQueryBuilder('l')
                                    .where('user_id = :driverId and loc_time > :startDate and loc_time < :endDate', {driverId: driverId, startDate: gpsDataTimes[0].start_time, endDate: gpsDataTimes[0].end_time})
                                    .orderBy('loc_time', 'ASC')
                                    .getRawMany()                           
        // //console.log(JSON.stringify(gpsData))
        //console.log(gpsData.length)
        no_points = gpsData.length
        if(no_points) {
            let i = 0
            if(moment(startDate) < moment(gpsData[0].l_loc_time)) {
                startDate = gpsData[0].l_loc_time
            }
            let state_date_str = moment(startDate)
            let next_date_str = moment(state_date_str).add(1, 'days')
            let dayStart, dayEnd
            for await (let gpsPoint of gpsData) {
                if(gpsPoint.l_loc_time) {
                    if (!dayStart) {
                        dayStart = moment(gpsPoint.l_loc_time)
                        i++
                        continue
                    }
                    if(moment(gpsPoint.l_loc_time).format('YYYY-MM-DD') >= next_date_str.format('YYYY-MM-DD')) {
                        next_date_str = moment(gpsPoint.l_loc_time).add(1, 'days')
                        if(gpsData[i-1]) {
                            dayEnd = moment(gpsData[i-1].l_loc_time)
                            //console.log(dayStart, dayEnd)
                            let mins = dayEnd.diff(dayStart, 'minutes')
                            total_time = total_time + mins
                            //console.log(gpsPoint.l_id, " mins = ", mins)
                            dayStart = moment(gpsPoint.l_loc_time)
                        }
                    }
                    if(!gpsData[i+1]) {
                        //console.log("in last point")
                        dayEnd = moment(gpsPoint.l_loc_time)
                        //console.log(dayStart, dayEnd, "last day ....")
                        let mins = dayEnd.diff(dayStart, 'minutes')
                        total_time = total_time + mins
                        //console.log(gpsPoint.l_id, " mins = ", mins)
                    }
                }
                
                if(gpsData[i+1]) {
                    //console.log(gpsPoint.l_location)
                    //console.log(gpsData[i+1].l_location)
                    let dis = await this.calcDeadDistance(gpsPoint.l_location, gpsData[i+1].l_location);
                    // let dis = 5
                    //console.log("dis --- ", dis)
                    if(dis > 1) {
                        const firstPointTime = moment(gpsPoint.l_loc_time)
                        const secondPointTime = moment(gpsData[i+1].l_loc_time)
                        let dismins = secondPointTime.diff(firstPointTime, 'minutes')
                        //console.log("calculating haversine distance ", dismins)
                        if(dismins <= 2) {
                            let a = {latitude: gpsPoint.l_location.coordinates[1],  longitude: gpsPoint.l_location.coordinates[0]}
                            let b = {latitude: gpsData[i+1].l_location.coordinates[1], longitude: gpsData[i+1].l_location.coordinates[0]}
                            //console.log(gpsPoint.l_loc_time)
                            //console.log(gpsData[i+1].l_loc_time)
                            // let distance = await this.haversine(a, b)
                            // let distance = HaversineGeolocation.getDistanceBetween(a, b);
                            let distance = haversine(a, b)
                            // distance = distance/1000
                            dis = distance
                        }
                        //console.log("haversine distance ===", dis)
                    }
                    total_distance = total_distance + dis
                }
                
                i++
            }
        }
        //console.log(total_distance)
        total_distance = Math.round(total_distance)
        const mainDiff = moment(gpsDataTimes[0].start_time).diff(moment(gpsDataTimes[0].end_time), 'minutes')
        const response = {total_distance, total_time, no_points, mainDiff}
        //console.log("response .....")
        //console.log(response)
        return response
    }

    async getToursIdsBySessionId(sessionId: number): Promise<any> {
        let tourIds = []
        let tourIdsListInfo = await this.locationsRepo.createQueryBuilder('l')
                                    .select('DISTINCT(tour_id)')
                                    .where("session_id = :sessionId and tour_id != 0", {sessionId: sessionId})
                                    .getRawMany()
        for(let tourIdData of tourIdsListInfo) {
            tourIds.push(tourIdData.tour_id)
        }
        return tourIds
    }
    async getTripsIdsByTourIdsId(tourIds: number[]): Promise<any> {
        let tripIds = []
        //console.log(tourIds)
        if(tourIds.length) {
            let tourIdsListInfo = await this.tourRouteRepo.createQueryBuilder('t')
                                    .select('DISTINCT(booking_id)')
                                    .where("tour_id In (:...tourIds)", {tourIds: tourIds})
                                    .getRawMany()
            for(let tourIdData of tourIdsListInfo) {
                tripIds.push(tourIdData.booking_id)
            }
        }
        
        return tripIds
    }
    async updatePointAsCalculated(locsData: any[]): Promise<any> {
        for(let loc of locsData) {
            await this.locationsRepo.update({id: loc.id}, {is_distance_calculated: true})
        }
    }
    async calcDriverSessionDistance(driverId: number, tourId: number): Promise<any> {
        const tourDistance = await this.driverSessionDistance.findOneBy({tour_id: tourId})
        if(!tourDistance) {
            let tourData = await this.toursEntity.findOneBy({id: tourId})
            let driverSession = await this.dsRepository.findOne({where: {user_id: driverId, status: true}, order: {id: 'DESC'}})
            if(!driverSession) {
                let tourRoute = await this.tourRouteRepo.find({where: {tour_id: tourId}, order: {sequence_number: 'ASC'}})
                const seesionInput: any = {
                    "start_location": tourRoute[0].id,
                    "user_id": tourData.driver_id,
                    "status": true,
                    "total_time": 0, // minutes
                    "total_distance": 0, // meters
                    "start_odometer_reading": 1050 ,// this should remove and come from trucker upload
                    "end_odometer_reading": 1050 ,// this should remove and come from trucker upload
                    "session_start_time": moment(new Date())
                }
                driverSession = await this.dsRepository.save(seesionInput)
            }
            let totalSessionDistance: any = await this.calcTourDistance(tourId)
            
            if(driverSession && driverSession.id) {
                let sessionDistanceData = {
                    session_id: driverSession.id,
                    tour_id: tourId,
                    distance: totalSessionDistance,
                    tour_type: tourData.tour_type
                }
                const existingTourDistance = await this.driverSessionDistance.findOneBy({tour_id: tourId})
                if(existingTourDistance && existingTourDistance.id) {
                    await this.driverSessionDistance.update({id: existingTourDistance.id}, sessionDistanceData)
                } else {
                    await this.driverSessionDistance.save(sessionDistanceData)
                }
            }
        }
        
        return true
        
    } 
    async calcDriverSessionDistanceOld1(driverId: number, tourId: number): Promise<any> {
        let tourData = await this.toursEntity.findOneBy({id: tourId})
        const tourDateTime = new Date(tourData.tour_date + " " + tourData.tour_time)
        let driverSession = await this.dsRepository.findOne({where: {session_start_time: LessThanOrEqual(tourDateTime), user_id: driverId, status: true}, order: {id: 'DESC'}})
        // console.log(tourDateTime, "tour date time")
        // console.log(driverSession)

        if(!driverSession) {
            driverSession = await this.dsRepository.findOne({where: [{session_start_time: LessThanOrEqual(tourDateTime), session_end_time: MoreThanOrEqual(tourDateTime), user_id: driverId}], order: {id: 'DESC'}})
            // console.log("in 2")
            // console.log(driverSession)
            if(!driverSession) {
                driverSession = await this.dsRepository.findOne({where: {session_start_time: MoreThanOrEqual(tourDateTime), user_id: driverId}, order: {id: 'ASC'}})
                // console.log("in 3")
                // console.log(driverSession)
            } 
            if(driverSession){
                let tourRoute = await this.tourRouteRepo.find({where: {tour_id: tourId}, order: {sequence_number: 'ASC'}})
                if(tourRoute.length) {
                    // console.log("check and update session end time")
                    const bookingId = tourRoute[tourRoute.length -1].booking_id
                    const booking = await this.bookingRepository.findOneBy({id: bookingId})
                    // console.log(driverSession.session_end_time , "<", new Date(booking.dropoff_time))
                    if(driverSession.session_end_time && driverSession.session_end_time < new Date(booking.dropoff_time)) {
                        // console.log("in if state")
                        const updateSession = await this.dsRepository.update({id: driverSession.id}, {session_end_time: new Date()})
                    }
                }
            } else {
                // console.log("creating new session")
                let tourRoute = await this.tourRouteRepo.find({where: {tour_id: tourId}, order: {sequence_number: 'ASC'}})
                if(tourRoute.length) {
                    //console.log("")
                    const bookingId = tourRoute[tourRoute.length -1].booking_id
                    const booking = await this.bookingRepository.findOneBy({id: bookingId})
                    // console.log("in else st")
                    const firstBookingData = await this.bookingRepository.findOneBy({id: tourRoute[0].booking_id})
                    // console.log(firstBookingData)
                    const seesionInput: any = {
                        "start_location": tourRoute[0].id,
                        "user_id": tourData.driver_id,
                        "status": false,
                        "total_time": 0, // minutes
                        "total_distance": 0, // meters
                        "start_odometer_reading": 1050 ,// this should remove and come from trucker upload
                        "end_odometer_reading": 1050 ,// this should remove and come from trucker upload
                        // "created_at": reqBody.created_at ? reqBody.created_at : new Date(),
                        "session_start_time": firstBookingData.reached_pickup ? firstBookingData.reached_pickup : moment(new Date()),
                        "session_end_time": booking.completed_drop,
                        "is_closed_session": true
                    }
                    driverSession = await this.dsRepository.save(seesionInput)
                    // console.log("created d session")
                    // console.log(driverSession)
                    

                }
            }
        }
        let totalSessionDistance: any = await this.calcTourDistance(tourId)
        // console.log("totalSessionDistance")
        // console.log(totalSessionDistance)
        let sessionData: any = {}
        if (driverSession.id) {
            sessionData = await this.dsRepository.findOneBy({id: driverSession.id})
        }
        if(sessionData && sessionData.id) {
            // const total_distance: any = parseFloat(sessionData.total_distance) + parseFloat(totalSessionDistance ? totalSessionDistance : 0)
            // const updateSession = await this.dsRepository.update({id: sessionData.id}, {total_distance: total_distance, session_end_time: new Date()})
            let sessionDistanceData = {
                session_id: sessionData.id,
                tour_id: tourId,
                distance: totalSessionDistance,
                tour_type: tourData.tour_type
            }
            const existingTourDistance = await this.driverSessionDistance.findOneBy({tour_id: tourId})
            if(existingTourDistance && existingTourDistance.id) {
                await this.driverSessionDistance.update({id: existingTourDistance.id}, sessionDistanceData)
            } else {
                await this.driverSessionDistance.save(sessionDistanceData)
            }
            
        }
        return true
        
    } 
    async calcDriverSessionDistanceOld(driverId: number): Promise<any> {
        const no_points = 30
        const radius = 20
        let driverSession = await this.dsRepository.findOne({where: {user_id: driverId, status: true}, order: {id: 'DESC'}})
        if(driverSession) {
            let whereCon = {
                session_id: driverSession.id,
                user_id: driverId,
                is_distance_calculated: false
            }
            const [items, count] = await this.locationsRepo.findAndCount({where: whereCon, order:{loc_time: 'ASC'} })
            let i = 0
            let totalSessionDistance: any = 0
            let locsData = []
            for(let loc of items) {
                let totalDistance = 0
                try {
                    loc['timestamp'] = moment(loc.loc_time).unix()
                    locsData.push(loc)
                    if(i != 0 && i % no_points == 0) {
                        const dData = await this.utilsService.getDistanceFromGOOSMMapMatch(locsData, radius)
                        if(dData.code == 'Ok') {
                            totalDistance = dData.matchings[0].distance
                            if(totalDistance) {
                                totalDistance = (totalDistance/1000)
                            }
                            //console.log(loc.id, totalDistance)
                            totalSessionDistance = totalSessionDistance + totalDistance
                            this.updatePointAsCalculated(locsData)
                        }
                        locsData = []
                    }
                } catch(error) {
                    locsData = []
                }
                i++
            }
            if(locsData.length) {
                let totalDistance = 0
                const dData = await this.utilsService.getDistanceFromGOOSMMapMatch(locsData, radius)
                if(dData.code == 'Ok') {
                    totalDistance = dData.matchings[0].distance
                    if(totalDistance) {
                        totalDistance = (totalDistance/1000)
                    }
                    totalSessionDistance = totalSessionDistance + totalDistance
                    this.updatePointAsCalculated(locsData)
                } else {
                    //console.log(dData)
                }
            }
            const sessionData = await this.dsRepository.findOneBy({id: driverSession.id})
            if(sessionData) {
                const total_distance: any = parseFloat(sessionData.total_distance) + parseFloat(totalSessionDistance ? totalSessionDistance : 0)
                const updateSession = await this.dsRepository.update({id: sessionData.id}, {total_distance: total_distance, session_end_time: new Date()})
            }
             
            return true
        } else {
            return false
        }
        
    } 
    async calcDriverDistanceFromToTimesOld(reqBody: any): Promise<any> {
        let whereCon = {
            user_id: reqBody.driver_id,  
            created_at : Between(new Date(reqBody.start_date), new Date(reqBody.end_date))
        }
        //console.log(whereCon)
        const [items, count] = await this.locationsRepo.findAndCount({where: whereCon, order:{id: 'DESC'} })
        //console.log(items.length)
        let i =0
        let tot = 0
        let pointsData = {}
        for(let loc of items) {
            let totalDistance = 0
            if(items[i+1]) {
                try {
                    /*const dData = await this.utilsService.getDistanceFromGOOSM({lat: loc.latitude, long: loc.longitude}, {lat: items[i+1].latitude, long: items[i+1].longitude})
                    if(dData.code == 'Ok') {
                        totalDistance = dData.routes[0].distance
                        if(totalDistance) {
                            totalDistance = (totalDistance/1000)
                        }
                        if(totalDistance > 1) {
                            const firstPointTime = moment(loc.loc_time)
                            const secondPointTime = moment(items[i+1].loc_time)
                            let dismins = secondPointTime.diff(firstPointTime, 'minutes')
                            //console.log("calculating haversine distance ", dismins)
                            if(dismins <= 2) {
                                let a = {latitude: loc.location.coordinates[1],  longitude: loc.location.coordinates[0]}
                                let b = {latitude: items[i+1].location.coordinates[1], longitude: items[i+1].location.coordinates[0]}
                                //console.log(loc.loc_time)
                                //console.log(items[i+1].loc_time)
                                // let distance = await this.haversine(a, b)
                                // let distance = HaversineGeolocation.getDistanceBetween(a, b);
                                let distance = haversine(a, b)
                                // distance = distance/1000
                                // dis = distance
                                // distance = distance/1000
                                totalDistance = distance
                            }
                            //console.log("haversine distance ===", totalDistance)
                        }
                        //console.log(loc.id, totalDistance)
                        tot = tot + totalDistance
                        pointsData = JSON.parse(JSON.stringify(pointsData))
                        pointsData[loc.id] = totalDistance
                    } */
                    let a = {latitude: loc.location.coordinates[1],  longitude: loc.location.coordinates[0]}
                    let b = {latitude: items[i+1].location.coordinates[1], longitude: items[i+1].location.coordinates[0]}
                    // //console.log(loc.loc_time)
                    // //console.log(items[i+1].loc_time)
                    // let distance = await this.haversine(a, b)
                    // let distance = HaversineGeolocation.getDistanceBetween(a, b);
                    let distance = haversine(a, b)
                    //console.log(loc.id, distance)
                    tot = tot + distance
                    pointsData = JSON.parse(JSON.stringify(pointsData))
                    pointsData[loc.id] = totalDistance
                } catch(error) {
                    //console.log("error from osm", error)
                }
            }
            i++
            // await new Promise(resolve => setTimeout(resolve, 500));
        }
        pointsData['total'] = tot
        //console.log(pointsData)
        var mailOptions = {
            from: 'noreplygo.20221@gmail.com',
            to: 'nageswararaonali@gmail.com',
            // to: 'nageswararaonali@gmail.com',
            subject: 'Driver Distance',
            text: JSON.stringify(pointsData)
        }
        // await mail.sendMail(mailOptions);
        return pointsData
        // return true
    } 

    async calcDriverDistanceFromToTimes(reqBody: any): Promise<any> {
        let whereCon = {
            user_id: reqBody.driver_id,  
            created_at : Between(new Date(reqBody.start_date), new Date(reqBody.end_date))
        }
        // //console.log(whereCon)
        const [items, count] = await this.locationsRepo.findAndCount({where: whereCon, order:{id: 'ASC'} })
        // //console.log(items.length)
        let i =0
        let tot = 0
        let htot = 0
        let pointsData = {}
        let points = []
        let timeGap = reqBody.timeGap
        let isFound = false
        points = items
        // points.push(items[0])
        // let firstPointTime = moment(items[0].loc_time)
        // for(let itm of items) {
        //     if(isFound) {
        //         firstPointTime = moment(itm.loc_time)
        //         isFound = false
        //     }
            
        //     const secondPointTime = moment(itm.loc_time)
        //     let dismins = secondPointTime.diff(firstPointTime, 'minutes')
        //     //console.log(dismins)
        //     if(dismins >= timeGap) {
        //         isFound = true
        //         points.push(itm)
        //     }
            
            
        // }
        // //console.log(points)
        // for(let p of points) {
        //     //console.log(p.loc_time)
        // }
        for(let loc of points) {
            let totalDistance = 0
            if(points[i+1]) {
                try {
                    /*const dData = await this.utilsService.getDistanceFromGOOSM({lat: loc.latitude, long: loc.longitude}, {lat: points[i+1].latitude, long: points[i+1].longitude})
                    if(dData.code == 'Ok') {
                        totalDistance = dData.routes[0].distance
                        if(totalDistance) {
                            totalDistance = (totalDistance/1000)
                        }
                        if(totalDistance > 1) {
                            const firstPointTime = moment(loc.loc_time)
                            const secondPointTime = moment(points[i+1].loc_time)
                            let dismins = secondPointTime.diff(firstPointTime, 'minutes')
                            //console.log("calculating haversine distance ", dismins)
                            if(dismins <= 2) {
                                let a = {latitude: loc.location.coordinates[1],  longitude: loc.location.coordinates[0]}
                                let b = {latitude: points[i+1].location.coordinates[1], longitude: points[i+1].location.coordinates[0]}
                                // //console.log(loc.loc_time)
                                // //console.log(items[i+1].loc_time)
                                // let distance = await this.haversine(a, b)
                                // let distance = HaversineGeolocation.getDistanceBetween(a, b);
                                let distance = haversine(a, b)
                                // distance = distance/1000
                                // dis = distance
                                // distance = distance/1000
                                totalDistance = distance
                            }
                            //console.log("haversine distance ===", totalDistance)
                        }
                        //console.log(loc.id, totalDistance)
                        tot = tot + totalDistance
                        pointsData = JSON.parse(JSON.stringify(pointsData))
                        pointsData[loc.id] = totalDistance
                    } */
                    let a = {latitude: loc.location.coordinates[1],  longitude: loc.location.coordinates[0]}
                    let b = {latitude: points[i+1].location.coordinates[1], longitude: points[i+1].location.coordinates[0]}
                    // //console.log(loc.loc_time)
                    // //console.log(items[i+1].loc_time)
                    // let distance = await this.haversine(a, b)
                    // let distance = HaversineGeolocation.getDistanceBetween(a, b);
                    let hdis = haversine(a, b)
                    pointsData = JSON.parse(JSON.stringify(pointsData))
                    pointsData[loc.id] = hdis
                    htot = htot + hdis
                    
                } catch(error) {
                    //console.log("error from osm", error)
                }
            }
            i++
            // await new Promise(resolve => setTimeout(resolve, 500));
        }
        pointsData['total'] = tot
        pointsData['htotal'] = htot
        pointsData['timeGap'] = reqBody.timeGap
        //console.log(pointsData)
        var mailOptions = {
            from: 'noreplygo.20221@gmail.com',
            to: 'nageswararaonali@gmail.com',
            // to: 'nageswararaonali@gmail.com',
            subject: 'Driver Distance',
            text: JSON.stringify(pointsData)
        }
        // await mail.sendMail(mailOptions);
        return pointsData
        // return true
    } 
    async calcDriverDistanceFromToTimesWithTimeDiff(reqBody: any): Promise<any> {
        let whereCon = {
            user_id: reqBody.driver_id,  
            created_at : Between(new Date(reqBody.start_date), new Date(reqBody.end_date))
        }
        // //console.log(whereCon)
        const [items, count] = await this.locationsRepo.findAndCount({where: whereCon, order:{id: 'ASC'} })
        // //console.log(items.length)
        let i =0
        let tot = 0
        let htot = 0
        let pointsData = {}
        let points = []
        let timeGap = reqBody.timeGap
        let isFound = false
        points.push(items[0])
        let firstPointTime = moment(items[0].loc_time)
        for(let itm of items) {
            if(isFound) {
                firstPointTime = moment(itm.loc_time)
                isFound = false
            }
            
            const secondPointTime = moment(itm.loc_time)
            let dismins = secondPointTime.diff(firstPointTime, 'minutes')
            //console.log(dismins)
            if(dismins >= timeGap) {
                isFound = true
                points.push(itm)
            }
            
            
        }
        // //console.log(points)
        for(let p of points) {
            //console.log(p.loc_time)
        }
        for(let loc of points) {
            let totalDistance = 0
            if(points[i+1]) {
                try {
                    /*const dData = await this.utilsService.getDistanceFromGOOSM({lat: loc.latitude, long: loc.longitude}, {lat: points[i+1].latitude, long: points[i+1].longitude})
                    if(dData.code == 'Ok') {
                        totalDistance = dData.routes[0].distance
                        if(totalDistance) {
                            totalDistance = (totalDistance/1000)
                        }
                        if(totalDistance > 1) {
                            const firstPointTime = moment(loc.loc_time)
                            const secondPointTime = moment(points[i+1].loc_time)
                            let dismins = secondPointTime.diff(firstPointTime, 'minutes')
                            //console.log("calculating haversine distance ", dismins)
                            if(dismins <= 2) {
                                let a = {latitude: loc.location.coordinates[1],  longitude: loc.location.coordinates[0]}
                                let b = {latitude: points[i+1].location.coordinates[1], longitude: points[i+1].location.coordinates[0]}
                                // //console.log(loc.loc_time)
                                // //console.log(items[i+1].loc_time)
                                // let distance = await this.haversine(a, b)
                                // let distance = HaversineGeolocation.getDistanceBetween(a, b);
                                let distance = haversine(a, b)
                                // distance = distance/1000
                                // dis = distance
                                // distance = distance/1000
                                totalDistance = distance
                            }
                            //console.log("haversine distance ===", totalDistance)
                        }
                        //console.log(loc.id, totalDistance)
                        tot = tot + totalDistance
                        // pointsData = JSON.parse(JSON.stringify(pointsData))
                        // pointsData[loc.id] = totalDistance
                    } */
                    let a = {latitude: loc.location.coordinates[1],  longitude: loc.location.coordinates[0]}
                    let b = {latitude: points[i+1].location.coordinates[1], longitude: points[i+1].location.coordinates[0]}
                    // //console.log(loc.loc_time)
                    // //console.log(items[i+1].loc_time)
                    // let distance = await this.haversine(a, b)
                    // let distance = HaversineGeolocation.getDistanceBetween(a, b);
                    let hdis = haversine(a, b)
                    pointsData = JSON.parse(JSON.stringify(pointsData))
                    pointsData[loc.id] = hdis
                    htot = htot + hdis
                    
                } catch(error) {
                    //console.log("error from osm", error)
                }
            }
            i++
            // await new Promise(resolve => setTimeout(resolve, 500));
        }
        pointsData['total'] = tot
        pointsData['htotal'] = htot
        pointsData['timeGap'] = reqBody.timeGap
        //console.log(pointsData)
        var mailOptions = {
            from: 'noreplygo.20221@gmail.com',
            to: 'nageswararaonali@gmail.com',
            // to: 'nageswararaonali@gmail.com',
            subject: 'Driver Distance',
            text: JSON.stringify(pointsData)
        }
        // await mail.sendMail(mailOptions);
        return pointsData
        // return true
    } 

    async calcOSMTwoPoints(reqBody: any): Promise<any> {
        let whereCon = {
            id: In(reqBody.points)
        }
        // //console.log(whereCon)
        const [items, count] = await this.locationsRepo.findAndCount({where: whereCon, order:{id: 'ASC'} })
        // //console.log(items.length)
        let i =0
        let tot = 0
        let htot = 0
        let pointsData = {}
        let points = []
        let timeGap = reqBody.timeGap
        let isFound = false
        points = items
        // //console.log(points)
        for(let p of points) {
            //console.log(p.loc_time)
        }
        for(let loc of points) {
            let totalDistance = 0
            if(points[i+1]) {
                try {
                    //console.log({lat: loc.latitude, long: loc.longitude}, {lat: points[i+1].latitude, long: points[i+1].longitude})
                    const dData = await this.utilsService.getDistanceFromOSM({lat: loc.latitude, long: loc.longitude}, {lat: points[i+1].latitude, long: points[i+1].longitude})
                    if(dData.code == 'Ok') {
                        //console.log(dData)
                        totalDistance = dData.routes[0].distance
                        if(totalDistance) {
                            totalDistance = (totalDistance/1000)
                        }
                        /*if(totalDistance > 1) {
                            const firstPointTime = moment(loc.loc_time)
                            const secondPointTime = moment(points[i+1].loc_time)
                            let dismins = secondPointTime.diff(firstPointTime, 'minutes')
                            //console.log("calculating haversine distance ", dismins)
                            if(dismins <= 2) {
                                let a = {latitude: loc.location.coordinates[1],  longitude: loc.location.coordinates[0]}
                                let b = {latitude: points[i+1].location.coordinates[1], longitude: points[i+1].location.coordinates[0]}
                                // //console.log(loc.loc_time)
                                // //console.log(items[i+1].loc_time)
                                // let distance = await this.haversine(a, b)
                                // let distance = HaversineGeolocation.getDistanceBetween(a, b);
                                let distance = haversine(a, b)
                                // distance = distance/1000
                                // dis = distance
                                // distance = distance/1000
                                totalDistance = distance
                            }
                            //console.log("haversine distance ===", totalDistance)
                        }*/
                        //console.log(loc.id, totalDistance)
                        tot = tot + totalDistance
                        // pointsData = JSON.parse(JSON.stringify(pointsData))
                        // pointsData[loc.id] = totalDistance
                    }
                    let a = {latitude: loc.location.coordinates[1],  longitude: loc.location.coordinates[0]}
                    let b = {latitude: points[i+1].location.coordinates[1], longitude: points[i+1].location.coordinates[0]}
                    // //console.log(loc.loc_time)
                    // //console.log(items[i+1].loc_time)
                    // let distance = await this.haversine(a, b)
                    // let distance = HaversineGeolocation.getDistanceBetween(a, b);
                    let hdis = haversine(a, b)
                    pointsData = JSON.parse(JSON.stringify(pointsData))
                    
                } catch(error) {
                    //console.log("error from osm", error)
                }
            }
            i++
            // await new Promise(resolve => setTimeout(resolve, 500));
        }
        pointsData['total'] = tot
        pointsData['htotal'] = htot
        pointsData['timeGap'] = reqBody.timeGap
        //console.log(pointsData)
        var mailOptions = {
            from: 'noreplygo.20221@gmail.com',
            to: 'nageswararaonali@gmail.com',
            // to: 'nageswararaonali@gmail.com',
            subject: 'Driver Distance',
            text: JSON.stringify(pointsData)
        }
        // await mail.sendMail(mailOptions);
        return pointsData
        // return true
    } 
    
    async updateBookingTime(bookingId: number, timeType: string): Promise<any> {
        let updateValues = {}
        const nDate = new Date().toLocaleString('en-US', {timeZone: 'Asia/Calcutta'});
        updateValues[timeType] = moment(nDate).format('YYYY-MM-DD HH:mm:ss')
        let bookingUpdate = this.bookingRepository.update({id: bookingId}, updateValues)
        return bookingUpdate
    }
    
    async calcOSMMapMatching(reqBody: any): Promise<any> {
        let whereCon = {
            // id: Between(98174, 99024),
            loc_time: Between(reqBody.start_at, reqBody.end_at),
            user_id: reqBody.user_id
        }
        // //console.log(whereCon)
        const [items, count] = await this.locationsRepo.findAndCount({where: whereCon, order:{loc_time: 'ASC'} })
        // //console.log(items.length)
        let i =0
        let tot = 0
        let htot = 0
        let rtot = 0
        let pointsData = {}
        let points = []
        let timeGap = reqBody.timeGap
        let isFound = false
        points = items
        // //console.log(points)
        for(let p of points) {
            //console.log(p.loc_time)
        }
        let llss = 'http://3.110.41.208:5000/match/v1/driving/'
        let lls = ''
        let locsData = []
        for(let loc of points) {
            let totalDistance = 0
            let htotdi = 0
            if(points[i+1]) {
                try {
                    lls = lls + loc.longitude + ","+loc.latitude+";";
                    loc['timestamp'] = moment(loc.loc_time).unix()
                    locsData.push(loc)
                    if(i != 0 && i % reqBody.no_points == 0) {
                        // //console.log(llss+lls)
                        lls = ''
                        // //console.log({lat: loc.latitude, long: loc.longitude}, {lat: points[i+1].latitude, long: points[i+1].longitude})
                        const dData = await this.utilsService.getDistanceFromGOOSMMapMatch(locsData, reqBody.radius)
                        if(dData.code == 'Ok') {
                            // //console.log(dData)
                            totalDistance = dData.matchings[0].distance
                            if(totalDistance) {
                                totalDistance = (totalDistance/1000)
                            }
                            
                            //console.log(loc.id, totalDistance)
                            tot = tot + totalDistance
                            // pointsData = JSON.parse(JSON.stringify(pointsData))
                            // pointsData[loc.id] = totalDistance
                        }
                        locsData = []
                        // pointsData = JSON.parse(JSON.stringify(pointsData))
                        // pointsData[loc.id] = totalDistance
                    }
                    /*//console.log({lat: loc.latitude, long: loc.longitude}, {lat: points[i+1].latitude, long: points[i+1].longitude})
                    let p1T = moment(loc.loc_time).unix()
                    let p2T = moment(points[i+1].loc_time).unix()
                    const dData = await this.utilsService.getDistanceFromGOOSMMatch({lat: loc.latitude, long: loc.longitude}, {lat: points[i+1].latitude, long: points[i+1].longitude}, p1T, p2T)
                    if(dData.code == 'Ok') {
                        ////console.log(dData)
                        htotdi = dData.matchings[0].distance
                        if(htotdi) {
                            htotdi = (htotdi/1000)
                        }
                        
                        // //console.log(loc.id, htotdi)
                        htot = htot + htotdi
                        pointsData = JSON.parse(JSON.stringify(pointsData))
                        pointsData[loc.id] = htotdi
                    }*/
                    /*const rData = await this.utilsService.getDistanceFromGOOSM({lat: loc.latitude, long: loc.longitude}, {lat: points[i+1].latitude, long: points[i+1].longitude})
                    if(dData.code == 'Ok') {
                        ////console.log(dData)
                        let rdistance = dData.matchings[0].distance
                        if(rdistance) {
                            rdistance = (rdistance/1000)
                        }
                        
                        // //console.log(loc.id, htotdi)
                        rtot = rtot + rdistance
                        // pointsData = JSON.parse(JSON.stringify(pointsData))
                        // pointsData[loc.id] = totalDistance
                    }*/
                    // pointsData = JSON.parse(JSON.stringify(pointsData))
                    // pointsData[loc.id] = totalDistance
                } catch(error) {
                    // //console.log("error from osm", error)
                    pointsData = JSON.parse(JSON.stringify(pointsData))
                    pointsData[loc.id] = 'notmatch'
                    // //console.log(loc.id, totalDistance)
                    //console.log(loc.latitude, loc.longitude, points[i+1].latitude,points[i+1].longitude)
                    //console.log(error)
                    locsData = []
                }
            }
            i++
            // await new Promise(resolve => setTimeout(resolve, 500));
        }
        //console.log(lls)
        //console.log(points.length)
        pointsData['total'] = tot
        pointsData['thotal'] = htot
        pointsData['rtotal'] = rtot
        pointsData['points'] = points.length
        // pointsData['timeGap'] = reqBody.timeGap
        //console.log(pointsData)
        var mailOptions = {
            from: 'noreplygo.20221@gmail.com',
            to: 'nageswararaonali@gmail.com',
            // to: 'nageswararaonali@gmail.com',
            subject: 'Driver Distance',
            text: JSON.stringify(pointsData)
        }
        // await mail.sendMail(mailOptions);
        return pointsData
        // return true
    } 

    async updateBookingTimes(reqBody: any): Promise<any> {
        let bookings = await this.bookingRepository.find({where: {created_at: Between(reqBody.from_date, reqBody.to_date)}})
        for(let bookingData of bookings) {
            let statusDetails = await this.bsRepo.find({where: {booking_id: bookingData.id}})
            let rPickup:any = '', cPickup: any = '', rDrop: any = '', cDrop: any =''
            for (let status of statusDetails) {
                if(status.status == 'Reached pickup') {
                    rPickup = status.created_at
                }
                if(status.status == 'Completed pickup') {
                    cPickup = status.created_at
                }
                if(status.status == 'Reached drop') {
                    rDrop = status.created_at
                }
                if(status.status == 'Completed drop') {
                    cDrop = status.created_at
                }
            }
            // if(rPickup != '' && cPickup != '' && rDrop != '' && cDrop != '') {
                rPickup = rPickup ?  moment(rPickup).local().format('YYYY-MM-DD HH:mm:ss') : ''
                cPickup = cPickup ? moment(cPickup).local().format('YYYY-MM-DD HH:mm:ss') : ''
                rDrop = rDrop ?  moment(rDrop).local().format('YYYY-MM-DD HH:mm:ss') : ''
                cDrop = cDrop ? moment(cDrop).local().format('YYYY-MM-DD HH:mm:ss') : ''
                // await this.bookingRepository.update({id: bookingData.id}, {reached_pickup: rPickup, completed_pickup: cPickup, reached_drop: rDrop, completed_drop: cDrop})
            // }
            //console.log({reached_pickup: rPickup, completed_pickup: cPickup, reached_drop: rDrop, completed_drop: cDrop})
            await this.bookingRepository.update({id: bookingData.id}, {reached_pickup: rPickup, completed_pickup: cPickup, reached_drop: rDrop, completed_drop: cDrop})
        }
        
    }

    async updateTourStatus(reqBody: any): Promise<any> {
        let tours = await this.toursEntity.find({})

        for(let tour of tours) {
            let tourRoutes = await this.tourRouteRepo.find({where:{tour_id: tour.id}})
            let bookings = []
            for(let tRoute of tourRoutes) {
                bookings.push(tRoute.booking_id)
            }
            bookings = [...new Set(bookings)]
            //console.log(bookings)
            for(let bId of bookings) {
                let bookingDetails = await this.bookingRepository.findOneBy({id: bId})
                // //console.log(bookingDetails)
                //console.log(tour.id, {tour_status: bookingDetails.booking_status})
                await this.toursEntity.update({id: tour.id}, {tour_status: bookingDetails.booking_status})
            }
        }
        
    }

    async calcDriverSessionDistanceManual(reqBody: any): Promise<any> {
        const no_points = 30
        const radius = 20
        let driverId = reqBody.driver_id
        let loc_date =  reqBody.calc_date
        let driverSession = await this.dsRepository.findOneBy({id:reqBody.session_id})
        if(driverSession) {
            let whereCon: any = {
                // session_id: driverSession.id,
                user_id: driverId,
                // is_distance_calculated: false,
                loc_time: Like(`${loc_date}%`)
            }
            let locTimes = []
            let locs = await this.locationsRepo.createQueryBuilder('l').select("distinct(loc_time)")
            // .where("loc_time like :loctime and user_id=:userId and is_distance_calculated=:isCal",{loctime: `%${loc_date}%`, userId: driverId, isCal:false})
            .where("loc_time like :loctime and user_id=:userId",{loctime: `%${loc_date}%`, userId: driverId})
            .groupBy('loc_time')
            .getRawMany()
            for(let l of locs) {
                locTimes.push(l.loc_time)
            }
            // whereCon['loc_time'] = In(locTimes)
            let [items, count] = await this.locationsRepo.findAndCount({where: whereCon, order:{loc_time: 'ASC'} })
            // let items = []
            // let points = []
            const points = items.filter((obj, index) => {
                return index === items.findIndex(o => obj.loc_time === o.loc_time);
              });
            // //console.log(items)
            let i = 0
            let totalSessionDistance: any = 0
            let locsData = []
            for(let loc of points) {
                //console.log(loc.loc_time)
                let totalDistance = 0
                try {
                    loc['timestamp'] = moment(loc.loc_time).unix()
                    locsData.push(loc)
                    if(i != 0 && i % no_points == 0) {
                        const dData = await this.utilsService.getDistanceFromGOOSMMapMatch(locsData, radius)
                        if(dData.code == 'Ok') {
                            totalDistance = dData.matchings[0].distance
                            if(totalDistance) {
                                totalDistance = (totalDistance/1000)
                            }
                            //console.log(loc.id, totalDistance)
                            totalSessionDistance = totalSessionDistance + totalDistance
                            //console.log("totalSessionDistance --", totalSessionDistance)
                            this.updatePointAsCalculated(locsData)
                        } else {
                            //console.log("getting wrong")
                        }
                        locsData = []
                    }
                } catch(error) {
                    locsData = []
                }
                i++
            }
            if(locsData.length) {
                let totalDistance = 0
                const dData = await this.utilsService.getDistanceFromGOOSMMapMatch(locsData, radius)
                if(dData.code == 'Ok') {
                    totalDistance = dData.matchings[0].distance
                    if(totalDistance) {
                        totalDistance = (totalDistance/1000)
                    }
                    totalSessionDistance = totalSessionDistance + totalDistance
                    this.updatePointAsCalculated(locsData)
                } else {
                    //console.log(dData)
                }
            }
            //console.log("totalSessionDistance", totalSessionDistance)
            //console.log("count",  points.length)
            const sessionData = await this.dsRepository.findOneBy({id: driverSession.id})
            if(sessionData) {
                const total_distance: any = parseFloat(sessionData.total_distance) + parseFloat(totalSessionDistance ? totalSessionDistance : 0)
                // const updateSession = await this.dsRepository.update({id: sessionData.id}, {total_distance: total_distance, session_end_time: new Date()})
            }
             
            return {distance: totalSessionDistance, count: points.length}
        } else {
            return false
        }
        
    } 

    async getDistanceFromPoint(reqBody: any): Promise<any> {
        let tourId= reqBody.tour_id
        let sourceLocation = reqBody.location
        let whereCon = {}
        whereCon['tour_id'] = tourId
        // whereCon['loc_time'] = In(locTimes)
        let [items, count] = await this.locationsRepo.findAndCount({where: whereCon, order:{loc_time: 'ASC'} })
        // let items = []
        // let points = []
        for(let loc of items) {
            let totalDistance = 0
            try {
                // //console.log(loc)
                let dLoc = {lat: loc.latitude, long: loc.longitude}
                const dData = await this.utilsService.getDistanceFromOSM(sourceLocation, dLoc)
                // //console.log(dData)
                if(dData.code == 'Ok') {
                    totalDistance = dData.routes[0].distance
                    if(totalDistance) {
                        totalDistance = (totalDistance/1000)
                    }
                    //console.log(loc.id, totalDistance)
                    
                } else {
                    //console.log("getting wrong")
                }
                    
            } catch(error) {
                //console.log("error while calling distance")
                //console.log(error)
            }
            
        }
        
    } 

    async calcDriverGoogleDistance(reqBody: any): Promise<any> {
        let whereCon = {
            user_id: reqBody.driverId,
                // is_distance_calculated: false,
            loc_time: Like(`${reqBody.loc_date}%`)
        }
        // //console.log(whereCon)
        // const [items, count] = await this.locationsRepo.findAndCount({where: whereCon, order:{loc_time: 'ASC'} })
        // //console.log(items.length)
        let items = []
        let i =0
        let tot = 0
        let htot = 0
        let pointsData = {}
        let points = []
        points = items
        // //console.log(points)
        for(let p of points) {
            //console.log(p.loc_time)
        }
        for(let loc of points) {
            let totalDistance = 0
            if(points[i+1]) {
                try {
                    //console.log({lat: loc.latitude, long: loc.longitude}, {lat: points[i+1].latitude, long: points[i+1].longitude})
                    const dData = await this.utilsService.getDistance({lat: loc.latitude, long: loc.longitude}, {lat: points[i+1].latitude, long: points[i+1].longitude})
                    //console.log(dData)
                    if(dData.status == 'OK') {
                        //console.log(dData.rows)
                        let d = dData.rows[0]
                        //console.log(d.elements[0].distance.value)
                        if(d.elements[0].distance.value) {
                            totalDistance = (d.elements[0].distance.value/1000)
                        }
                        /*if(totalDistance > 1) {
                            const firstPointTime = moment(loc.loc_time)
                            const secondPointTime = moment(points[i+1].loc_time)
                            let dismins = secondPointTime.diff(firstPointTime, 'minutes')
                            //console.log("calculating haversine distance ", dismins)
                            if(dismins <= 2) {
                                let a = {latitude: loc.location.coordinates[1],  longitude: loc.location.coordinates[0]}
                                let b = {latitude: points[i+1].location.coordinates[1], longitude: points[i+1].location.coordinates[0]}
                                // //console.log(loc.loc_time)
                                // //console.log(items[i+1].loc_time)
                                // let distance = await this.haversine(a, b)
                                // let distance = HaversineGeolocation.getDistanceBetween(a, b);
                                let distance = haversine(a, b)
                                // distance = distance/1000
                                // dis = distance
                                // distance = distance/1000
                                totalDistance = distance
                            }
                            //console.log("haversine distance ===", totalDistance)
                        }*/
                        //console.log(loc.id, totalDistance)
                        tot = tot + totalDistance
                        // pointsData = JSON.parse(JSON.stringify(pointsData))
                        // pointsData[loc.id] = totalDistance
                    }
                    pointsData = JSON.parse(JSON.stringify(pointsData))
                    
                } catch(error) {
                    //console.log("error from google", error)
                }
            }
            i++
            // await new Promise(resolve => setTimeout(resolve, 500));
        }
        pointsData['total'] = tot
        //console.log(pointsData)
        return pointsData
        // return true
    } 

    async calcDriverGoogleMapMatchDistance(reqBody: any): Promise<any> {
        /*let whereCon = {
            user_id: reqBody.driverId,
                // is_distance_calculated: false,
            loc_time: Like(`${reqBody.loc_date}%`)
        }*/
        let whereCon = {
            tour_id: reqBody.tourId,
            loc_time: Between(reqBody.start_time, reqBody.end_time)
        }
        // //console.log(whereCon)
        const [items, count] = await this.locationsRepo.findAndCount({where: whereCon, order:{loc_time: 'ASC'} })
        // //console.log(items.length)
        let i =0,j=0;
        let tot = 0
        let htot = 0
        let pointsData = {}
        let points = []
        points = items
        // //console.log(points)
        for(let p of points) {
            //console.log(p.loc_time)
        }
        let str = ''
        let snapPoints = []
        for(let loc of points) {
            str = str + (i > 0 ? '|': '') + loc.latitude +","+loc.longitude;
            i++
            if(i == 50) {
                //console.log(str)
                const dData = await this.utilsService.getGoogleSnappedPoints(str)
                //console.log(dData)
                if(dData.snappedPoints) {
                    for(let sPoint of dData.snappedPoints) {
                        //console.log(sPoint)
                        snapPoints.push({loc:sPoint.location, index: sPoint.originalIndex ? (j*50) + sPoint.originalIndex : ''})
                    }
                }
                str = ''
                i=0
                j++
                // break
            }
            // await new Promise(resolve => setTimeout(resolve, 500));
        }
        if(str) {
            const dData = await this.utilsService.getGoogleSnappedPoints(str)
            //console.log(dData)
            if(dData.snappedPoints) {
                for(let sPoint of dData.snappedPoints) {
                    //console.log(sPoint)
                    snapPoints.push({loc:sPoint.location, index: sPoint.originalIndex ? (j*50) + sPoint.originalIndex : ''})
                }
            }
        }
        //console.log("total points ", points.length)
        //console.log("total snap points ", snapPoints.length)
        i=0
        for(let locD of snapPoints) {
            let loc = locD.loc
            let totalDistance = 0
            if(snapPoints[i+1]) {
                try {
                    const dData = await this.utilsService.getDistance({lat: loc.latitude, long: loc.longitude}, {lat: snapPoints[i+1].loc.latitude, long: snapPoints[i+1].loc.longitude})
                    // //console.log(dData)
                    if(dData.status == 'OK') {
                        // //console.log(dData.rows)
                        let d = dData.rows[0]
                        // //console.log(d.elements[0].distance.value)
                        if(d.elements[0].distance.value) {
                            totalDistance = (d.elements[0].distance.value/1000)
                        }
                        // //console.log(loc)
                        //console.log(points[locD.index] ? points[locD.index].id : ' ', points[locD.index] ? points[locD.index].loc_time : ' ',loc.latitude, loc.longitude, points[snapPoints[i+1].index] ? points[snapPoints[i+1].index].id :  ' ',points[snapPoints[i+1].index] ? points[snapPoints[i+1].index].loc_time :  ' ', snapPoints[i+1].loc.latitude, snapPoints[i+1].loc.longitude, totalDistance)
                        tot = tot + totalDistance
                    }
                    pointsData = JSON.parse(JSON.stringify(pointsData))
                    
                } catch(error) {
                    //console.log("error from google", error)
                }
            }
            i++
            // await new Promise(resolve => setTimeout(resolve, 500));
        }
        pointsData['total'] = tot
        //console.log(pointsData)
        return pointsData
        // return true
    } 

    async calcDriverGoogleMapMatchDistanceNew(reqBody: any): Promise<any> {
        /*const dData = await this.utilsService.getDistance({lat: 12.95151873, long: 	80.08773669}, {lat: 13.0499465, long: 80.06613572})
        // //console.log(dData)
        if(dData.status == 'OK') {
            // //console.log(dData.rows)
            let d = dData.rows[0]
            // //console.log(d.elements[0].distance.value)
            if(d.elements[0].distance.value) {
                 //console.log(d.elements[0].distance.value/1000)
            }
            // //console.log(loc)
            // //console.log(points[locD.index] ? points[locD.index].id : ' ', points[locD.index] ? points[locD.index].loc_time : ' ',loc.latitude, loc.longitude, points[finalSnapPoints[i+1].index] ? points[finalSnapPoints[i+1].index].id :  ' ',points[snapPoints[i+1].index] ? points[snapPoints[i+1].index].loc_time :  ' ', snapPoints[i+1].loc.latitude, snapPoints[i+1].loc.longitude, totalDistance)
        }*/
        let whereCon = {
            user_id: reqBody.driverId,
                // is_distance_calculated: false,
            // loc_time: Like(`${reqBody.loc_date}%`)
            loc_time: Between(reqBody.start_time, reqBody.end_time)
        }
        /*let whereCon = {
            tour_id: reqBody.tourId,
            loc_time: Between(reqBody.start_time, reqBody.end_time)
        }*/
        //console.log(whereCon)
        const [items, count] = await this.locationsRepo.findAndCount({where: whereCon, order:{loc_time: 'ASC'} })
        // //console.log(items.length)
        let i =0,j=0;
        let tot = 0
        let htot = 0
        let pointsData = {}
        let points = []
        points = items
        // //console.log(points)
        for(let p of points) {
            //console.log(p.loc_time)
        }
        let str = ''
        let snapPoints = []
        let beforePoints = ''
        for(let loc of points) {
            str = str + (str != "" ? '|': '') + loc.latitude +","+loc.longitude;
            i++
            if(i == 40) {
                // //console.log(str)
                const dData = await this.utilsService.getGoogleSnappedPoints(str)
                // //console.log(dData)
                // //console.log(j, "j value")
                let isFind = false
                if(dData.snappedPoints) {
                    for(let sPoint of dData.snappedPoints) {
                        // //console.log(sPoint)
                        if(isFind == false) {
                            isFind = sPoint.originalIndex == 10 ? true : false
                        }
                        if(j > 0 && isFind) {
                            snapPoints.push({loc:sPoint.location, index: sPoint.originalIndex ? ((j*40) + sPoint.originalIndex - 10): ''})
                        } else if(j == 0){
                            snapPoints.push({loc:sPoint.location, index: sPoint.originalIndex ? (j*40) + sPoint.originalIndex : ''})
                        }
                        // //console.log(sPoint)
                        
                    }
                }
                str = ''
                i=0
                j++
                let lPoints = dData.snappedPoints.slice(-10)
                let k=0
                for(let lc of lPoints) {
                    str = str + (k > 0 ? '|': '') + lc.location.latitude +","+lc.location.longitude;
                    k++
                }
                // i++                
                
                // break
            }
            // await new Promise(resolve => setTimeout(resolve, 500));
        }
        // //console.log(i, "i value")
        if(str) {
            // //console.log(str)
            const dData = await this.utilsService.getGoogleSnappedPoints(str)
            // //console.log(dData)
            let isFind = false
            // //console.log(j, "j value --")
            if(dData.snappedPoints) {
                for(let sPoint of dData.snappedPoints) {
                    // //console.log(sPoint)
                    if(isFind == false) {
                        isFind = sPoint.originalIndex == 10 ? true : false
                    }
                    if(isFind) {
                        // //console.log({loc:sPoint.location, index: sPoint.originalIndex ? ((j*40) + sPoint.originalIndex - 10) : ''})
                        snapPoints.push({loc:sPoint.location, index: sPoint.originalIndex ? ((j*40) + sPoint.originalIndex - 10) : ''})
                    }
                    
                }
            }
        }
        //console.log("total points ", points.length)
        //console.log("total snap points ", snapPoints.length)
        // //console.log(snapPoints)
        let finalSnapPoints = []
        let n=0
        for(let sPoint of snapPoints) {
            if(snapPoints[n+1]) {
                if(sPoint.loc.latitude != snapPoints[n+1].loc.latitude && sPoint.loc.longitude != snapPoints[n+1].loc.longitude) {
                    finalSnapPoints.push(sPoint)
                }
                n++
            }
            
        }
        //console.log(finalSnapPoints.length)
        i=0
        for(let locD of finalSnapPoints) {
            let loc = locD.loc
            let totalDistance = 0
            if(finalSnapPoints[i+1]) {
                try {
                    const dData = await this.utilsService.getDistance({lat: loc.latitude, long: loc.longitude}, {lat: finalSnapPoints[i+1].loc.latitude, long: finalSnapPoints[i+1].loc.longitude})
                    // //console.log(dData)
                    if(dData.status == 'OK') {
                        // //console.log(dData.rows)
                        let d = dData.rows[0]
                        // //console.log(d.elements[0].distance.value)
                        if(d.elements[0].distance.value) {
                            totalDistance = (d.elements[0].distance.value/1000)
                        }
                        // //console.log(loc)
                        //console.log(points[locD.index] ? points[locD.index].id : ' ', points[locD.index] ? points[locD.index].loc_time : ' ',loc.latitude, loc.longitude, points[finalSnapPoints[i+1].index] ? points[finalSnapPoints[i+1].index].id :  ' ',points[finalSnapPoints[i+1].index] ? points[finalSnapPoints[i+1].index].loc_time :  ' ', finalSnapPoints[i+1].loc.latitude, finalSnapPoints[i+1].loc.longitude, totalDistance)
                        tot = tot + totalDistance
                    }
                    pointsData = JSON.parse(JSON.stringify(pointsData))
                    
                } catch(error) {
                    //console.log("error from google", error)
                }
            }
            i++
            // await new Promise(resolve => setTimeout(resolve, 500));
        }
        pointsData['total'] = tot
        //console.log(pointsData)
        return pointsData
        // return true
    } 

    async calcDriverGoogleMapMatchDistanceWithSpeed(reqBody: any): Promise<any> {
        /*let whereCon = {
            user_id: reqBody.driverId,
                // is_distance_calculated: false,
            loc_time: Like(`${reqBody.loc_date}%`)
        }*/
        let whereCon = {
            tour_id: reqBody.tourId,
            loc_time: Between(reqBody.start_time, reqBody.end_time)
        }
        // //console.log(whereCon)
        const [items, count] = await this.locationsRepo.findAndCount({where: whereCon, order:{loc_time: 'ASC'} })
        // //console.log(items.length)
        let i =0,j=0;
        let tot = 0
        let sTot = 0
        let htot = 0
        let finalDistance = 0
        let pointsData = {}
        let points = []
        points = items
        // //console.log(points)
        for(let p of points) {
            //console.log(p.loc_time)
        }
        let str = ''
        let snapPoints = []
        let beforePoints = ''
        for(let loc of points) {
            let totalDistance = 0
            if(points[i+1]) {
                const dData = await this.utilsService.getDistance({lat: loc.latitude, long: loc.longitude}, {lat: points[i+1].latitude, long: points[i+1].longitude})
                if(dData.status == 'OK') {
                    let d = dData.rows[0]
                    if(d.elements[0].distance.value) {
                        totalDistance = (d.elements[0].distance.value/1000)
                    }
                    
                    let date1 = moment(loc.loc_time)
                    let date2 = moment(points[i+1].loc_time)
                    let diff = date2.diff(date1, 'seconds');
                    
                    let distance = (((40*1000)/3600) * diff)/1000;
                    
                    tot = tot + totalDistance
                    sTot = sTot + (distance)
                    let a = {latitude: loc.latitude,  longitude: loc.longitude}
                    let b = {latitude: points[i+1].latitude, longitude: points[i+1].longitude}
                    
                    let hdistance = await haversine(a, b)
                    
                    htot = htot + hdistance
                    let fD = (totalDistance > distance ? hdistance : totalDistance)
                    finalDistance = finalDistance + fD
                    //console.log(loc.loc_time, loc.latitude, loc.longitude, points[i+1].loc_time,  points[i+1].latitude,  points[i+1].longitude, totalDistance, distance, hdistance, fD)
                }
            }
            i++
        }
       
        pointsData['total'] = tot
        pointsData['sTot'] = sTot
        pointsData['htot'] = htot
        pointsData['final'] = finalDistance
        //console.log(pointsData)
        return pointsData
        // return true
    } 

    async calcDriverGoogleMapMatchDistanceWithSpeedTime(reqBody: any): Promise<any> {
        /*const dData = await this.utilsService.getDistance({lat: 12.95151873, long: 	80.08773669}, {lat: 13.0499465, long: 80.06613572})
        // //console.log(dData)
        if(dData.status == 'OK') {
            // //console.log(dData.rows)
            let d = dData.rows[0]
            // //console.log(d.elements[0].distance.value)
            if(d.elements[0].distance.value) {
                 //console.log(d.elements[0].distance.value/1000)
            }
            // //console.log(loc)
            // //console.log(points[locD.index] ? points[locD.index].id : ' ', points[locD.index] ? points[locD.index].loc_time : ' ',loc.latitude, loc.longitude, points[finalSnapPoints[i+1].index] ? points[finalSnapPoints[i+1].index].id :  ' ',points[snapPoints[i+1].index] ? points[snapPoints[i+1].index].loc_time :  ' ', snapPoints[i+1].loc.latitude, snapPoints[i+1].loc.longitude, totalDistance)
        }*/
        let whereCon = {
            user_id: reqBody.driverId,
                // is_distance_calculated: false,
            // loc_time: Like(`${reqBody.loc_date}%`)
            loc_time: Between(reqBody.start_time, reqBody.end_time)
        }
        /*let whereCon = {
            tour_id: reqBody.tourId,
            loc_time: Between(reqBody.start_time, reqBody.end_time)
        }*/
        //console.log(whereCon)
        const [items, count] = await this.locationsRepo.findAndCount({where: whereCon, order:{loc_time: 'ASC'} })
        // //console.log(items.length)
        let i =0,j=0;
        let tot = 0
        let htot = 0
        let pointsData = {}
        let points = []
        points = items
        // //console.log(points)
        for(let p of points) {
            //console.log(p.loc_time)
        }
        let str = ''
        let snapPoints = []
        let beforePoints = ''
        let indexPoints = []
        for(let loc of points) {
            str = str + (str != "" ? '|': '') + loc.latitude +","+loc.longitude;
            i++
            indexPoints.push(loc)
            if(i == 90) {
                // //console.log(str)
                const dData = await this.utilsService.getGoogleSnappedPoints(str)
                // //console.log(dData)
                // //console.log(j, "j value")
                let isFind = false
                if(dData.snappedPoints) {
                    for(let sPoint of dData.snappedPoints) {
                        // //console.log(sPoint)
                        if(isFind == false) {
                            isFind = sPoint.originalIndex == 10 ? true : false
                        }
                        if(j > 0 && isFind) {
                            snapPoints.push({loc:sPoint.location, originalPoint: indexPoints[sPoint.originalIndex]})
                        } else if(j == 0){
                            snapPoints.push({loc:sPoint.location, originalPoint: indexPoints[sPoint.originalIndex]})
                        }
                        // //console.log(sPoint)
                        
                    }
                }
                str = ''
                indexPoints = []
                i=0
                j++
                let lPoints = dData.snappedPoints.slice(-10)
                let k=0
                for(let lc of lPoints) {
                    str = str + (k > 0 ? '|': '') + lc.location.latitude +","+lc.location.longitude;
                    k++
                }
                // i++                
                
                // break
            }
            // await new Promise(resolve => setTimeout(resolve, 500));
        }
        // //console.log(i, "i value")
        if(str) {
            // //console.log(str)
            const dData = await this.utilsService.getGoogleSnappedPoints(str)
            // //console.log(dData)
            let isFind = false
            // //console.log(j, "j value --")
            if(dData.snappedPoints) {
                for(let sPoint of dData.snappedPoints) {
                    // //console.log(sPoint)
                    if(isFind == false) {
                        isFind = sPoint.originalIndex == 10 ? true : false
                    }
                    if(isFind) {
                        // //console.log({loc:sPoint.location, index: sPoint.originalIndex ? ((j*40) + sPoint.originalIndex - 10) : ''})
                        snapPoints.push({loc:sPoint.location, originalPoint: indexPoints[sPoint.originalIndex]})
                    }
                    
                }
            }
        }
        //console.log("total points ", points.length)
        //console.log("total snap points ", snapPoints.length)
        // //console.log(snapPoints)
        let finalSnapPoints = []
        let n=0
        for(let sPoint of snapPoints) {
            if(snapPoints[n+1]) {
                if(sPoint.loc.latitude != snapPoints[n+1].loc.latitude && sPoint.loc.longitude != snapPoints[n+1].loc.longitude) {
                    finalSnapPoints.push(sPoint)
                }
                n++
            }
            
        }
        //console.log(finalSnapPoints.length)
        // //console.log(finalSnapPoints)
        i=0
        for(let locD of finalSnapPoints) {
            let loc = locD.loc
            let totalDistance = 0
            if(finalSnapPoints[i+1]) {
                try {
                    const dData = await this.utilsService.getDistance({lat: loc.latitude, long: loc.longitude}, {lat: finalSnapPoints[i+1].loc.latitude, long: finalSnapPoints[i+1].loc.longitude})
                    // //console.log(dData)
                    if(dData.status == 'OK') {
                        // //console.log(dData.rows)
                        let d = dData.rows[0]
                        // //console.log(d.elements[0].distance.value)
                        if(d.elements[0].distance.value) {
                            totalDistance = (d.elements[0].distance.value/1000)
                        }
                        if(locD.originalPoint && finalSnapPoints[i+1].originalPoint) {
                            let date1 = moment(locD.originalPoint.loc_time)
                            let date2 = moment(finalSnapPoints[i+1].originalPoint.loc_time)
                            let diff = date2.diff(date1, 'seconds');
                            
                            let distance = (((40*1000)/3600) * diff)/1000;
                            if(totalDistance > distance) {
                                let a = {latitude: loc.latitude,  longitude: loc.longitude}
                                let b = {latitude: finalSnapPoints[i+1].loc.latitude, longitude: finalSnapPoints[i+1].loc.longitude}
                                // //console.log(a)
                                // //console.log(b)
                                totalDistance = await haversine(a, b)
                                // //console.log("haversine", totalDistance)
                            }   
                        }
                        tot = tot + totalDistance
                        // //console.log(loc)
                        // //console.log(locD.originalPoint ? locD.originalPoint.id : ' ', locD.originalPoint ? locD.originalPoint.loc_time : ' ',loc.latitude, loc.longitude, finalSnapPoints[i+1].originalPoint ? finalSnapPoints[i+1].originalPoint.id :  ' ',finalSnapPoints[i+1].originalPoint ? finalSnapPoints[i+1].originalPoint.loc_time :  ' ', finalSnapPoints[i+1].loc.latitude, finalSnapPoints[i+1].loc.longitude, totalDistance)
                        //console.log(loc.latitude, loc.longitude)
                    }
                    pointsData = JSON.parse(JSON.stringify(pointsData))
                    
                } catch(error) {
                    //console.log("error from google", error)
                }
            }
            i++
            // await new Promise(resolve => setTimeout(resolve, 500));
        }
        pointsData['total'] = tot
        //console.log(pointsData)
        return pointsData
        // return true
    } 

    async getMinlBookingFare(reqBody: any): Promise<any> {
        const distanceByVehicle = {
            "2wheeler": 50,
            "3wheeler": 500,
            "4wheeler": 750
        }
        let booking_status = [
            'Reached pickup',
            'Completed pickup',
            'Reached drop',
            'Completed drop',
            'Tour Completed',
            'Canceled By Manager'
        ]
        const rangeVehicles = ['2wheeler', '3wheeler']
        let v_rates = {
            1: 50,
            2: 40,
            3: 30,
            4: 25
        }
        const peek_time_percentage = 10 
        const wheeler_percentage_2 = 30 
        const wheeler_percentage_other = 20 
        const km_check = reqBody.vehicle_type == '2wheeler' ? 3 : 4
        const discount_percentage = 50;
        const min_no_of_pickups_to_discount = 1
        const max_no_of_pickups_to_discount = 4
        let tripDistance = 0
        let base_fare = 0
        let total_fare = 0;

        const dData = await this.utilsService.getDistanceFromOSM(reqBody.source_address, reqBody.destination_address)
        // //console.log(dData)
        if(dData.code == 'Ok') {
            let totalDistance = dData.routes[0].distance
            if(totalDistance) {
                tripDistance = (totalDistance/1000)
            }
        } else {
            //console.log("getting wrong")
        }
        tripDistance = Math.round(tripDistance)
        if(tripDistance > 50 && rangeVehicles.indexOf(reqBody.vehicle_type) > -1) {
            return false
        }
        //console.log(tripDistance, "trip distance")
        const total_trip_weight = distanceByVehicle[reqBody.vehicle_type]
        //console.log("total_trip_weight", total_trip_weight)
        const rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: 0}, order: {id: 'ASC'}})
        //console.log(rate_data)
        base_fare = rate_data.base_rate
        const user = await this.utilsService.getCustomerByMobile(reqBody.customer_mobile);
        if(user && reqBody.is_vivegam) {
            let today = moment().format('YYYY-MM-DD')
            let whereCon = [
                {customer_id: In([user.id]), pickup_time: Like(`${today}%`), booking_status: Not(In(booking_status)), dropoff_lat: reqBody.destination_address.lat, dropoff_long: reqBody.destination_address.long, is_vivegam: true, vehicle_type: reqBody.vehicle_type },
                // {customer_id: In([user.id]), pickup_time: Like(`${today}%`), booking_status: Not(In(booking_status)), pickup_lat: reqBody.destination_address.lat, pickup_long: reqBody.destination_address.long, is_vivegam: true, vehicle_type: reqBody.vehicle_type }
            ]
            let bookings = await this.bookingRepository.find({where: whereCon}) 
            //console.log(bookings.length, " b l")
            for(let b of bookings) {
                //console.log(b.id)
            }
            //console.log(tripDistance, km_check)
            if(tripDistance <= km_check ) {
                if(!bookings.length) { 
                    total_fare =  base_fare
                } else {
                    if(reqBody.vehicle_type == '2wheeler') {
                        let no_bookings = bookings.length + 1
                        no_bookings = no_bookings > 4 ? 4 : no_bookings 
                        total_fare = v_rates[no_bookings]
                    } else {
                        total_fare = base_fare
                    }
                }
            } else {
                if(!bookings.length) {
                    // normal calculation
                    //console.log("e")
                    total_fare = base_fare + ((tripDistance - km_check) * rate_data.rate_per_km)
                } else {
                    if(reqBody.vehicle_type == '2wheeler') {
                        let no_bookings = bookings.length + 1
                        no_bookings = no_bookings > 4 ? 4 : no_bookings 
                        total_fare = v_rates[no_bookings]
                    } else {
                        total_fare = base_fare
                    }
                }
            }
        } else {
            if(tripDistance <= km_check) {
                total_fare =  base_fare
            } else {
                //console.log("trip weight ", total_trip_weight)
                //console.log(base_fare, tripDistance, rate_data.rate_per_km)
                total_fare = base_fare + ((tripDistance - km_check) * rate_data.rate_per_km)
            }
        }
        //console.log(reqBody.is_vivegam)
        if(reqBody.is_vivegam) {
            if(reqBody.vehicle_type == '2wheeler') {
                total_fare = total_fare - Math.ceil((wheeler_percentage_2/100) * total_fare)
            } else {
                total_fare = total_fare - Math.ceil((wheeler_percentage_other/100) * total_fare)
            }
        } else {
            
            const format = 'HH:mm:ss';
            const now_time = moment(moment().tz('Asia/Calcutta').format('HH:mm:ss'), format)
            const morning_start_time = moment('08:00:00', format);
            const morning_end_time = moment('11:00:00', format);
            const evening_start_time = moment('16:00:00', format);
            const evening_end_time = moment('20:00:00', format);
            //console.log(now_time, "now time")
            if(now_time.isBetween(morning_start_time, morning_end_time) || now_time.isBetween(evening_start_time, evening_end_time)) {
                //console.log("in peek time ")
                total_fare = total_fare + Math.ceil((peek_time_percentage/100) * total_fare)
            }
        }
        total_fare = Math.ceil(total_fare)
        return {total_fare: total_fare, distance: tripDistance}
    }

    async getHomeDeliveryFare(reqBody: any): Promise<any> {
        let destination = reqBody.customer_address;
        let shopId = reqBody.shop_id
        let shopDetails = await this.shopService.getShopDetailsById(shopId);
        let source_address = {
            lat: shopDetails.latitude,
            long: shopDetails.longitude
        }
        const fareReq = {
            source_address,
            destination_address: destination,
            customer_mobile: reqBody.customer_mobile,
            vehicle_type: reqBody.vehicle_type,
            is_vivegam: reqBody.is_vivegam
        }
        return await this.getMinlBookingFare(fareReq)
    }
    async getHomeDeliveryFareByAddresses(reqBody: any): Promise<any> {
        let destination = reqBody.drop_address;
        let source_address = reqBody.pickup_address
        const fareReq = {
            source_address,
            destination_address: destination,
            customer_mobile: reqBody.customer_mobile,
            vehicle_type: reqBody.vehicle_type,
            is_vivegam: reqBody.is_vivegam
        }
        return await this.getMinlBookingFare(fareReq)
    }

    async getDelhiHomeDeliveryFareByAddresses(reqBody: any): Promise<any> {
        let response = {};
        let destination = reqBody.drop_address;
        let source_address = reqBody.pickup_address
        const user = await this.utilsService.getCustomerByMobile(reqBody.customer_mobile);
        
        const fareReq = {
            source_address,
            destination_address: destination,
            customer_mobile: reqBody.customer_mobile,
            vehicle_type: reqBody.vehicle_type,
            is_vivegam: reqBody.is_vivegam
        }
        let fareData = await this.getMinlBookingFare(fareReq)
        // delhi bookings fare * 1.5
        fareData.total_fare = fareData.total_fare * 1.5
        response = fareData
        if(reqBody.is_vivegam) {
            let whereCon: any = {}
            let todayDate = moment().tz('Asia/Calcutta').format('YYYY-MM-DD')
            const format = 'HH:mm:ss';
            const now_time = moment(moment().tz('Asia/Calcutta').format('HH:mm:ss'), format)
            const morning_start_time = moment('07:00:00', format);
            if(now_time >= morning_start_time) {
                whereCon['pickup_time'] = Like(`${todayDate}%`)
                // whereCon["customer_id"] = user.id
                /*whereCon["estimated_fare"] = 0
                const [items, count] = await this.bookingRepository.findAndCount({where: whereCon, order:{id: 'DESC'}})
                if(count < 3) {
                    whereCon["customer_id"] = user.id
                    const [items, count] = await this.bookingRepository.findAndCount({where: whereCon, order:{id: 'DESC'}})
                    if(count == 0) {
                        response = {
                            'total_fare': 0,
                            'distance': fareData.distance,
                            'original_fare': fareData.total_fare
                        }
                    }
                    
                } else {*/
                    whereCon["customer_id"] = user.id
                    whereCon["estimated_fare"] = 0
                    const [items, count] = await this.bookingRepository.findAndCount({where: whereCon, order:{id: 'DESC'}})
                    if(count < 10) {
                        whereCon['pickup_time'] = Like(`${todayDate}%`)
                        const [items, count] = await this.bookingRepository.findAndCount({where: whereCon, order:{id: 'DESC'}})
                        if(count == 0) {
                            response = {
                                'total_fare': 0,
                                'distance': fareData.distance,
                                'original_fare': fareData.total_fare
                            }
                        }
                    }
                // }
            } else {
                whereCon["customer_id"] = user.id
                whereCon["estimated_fare"] = 0
                const [items, count] = await this.bookingRepository.findAndCount({where: whereCon, order:{id: 'DESC'}})
                if(count < 10) {
                    whereCon['pickup_time'] = Like(`${todayDate}%`)
                    const [items, count] = await this.bookingRepository.findAndCount({where: whereCon, order:{id: 'DESC'}})
                    if(count == 0) {
                        response = {
                            'total_fare': 0,
                            'distance': fareData.distance,
                            'original_fare': fareData.total_fare
                        }
                    }
                }
            }
        }
        
        return response
    }

    async getDelhiHomeDeliveryFreeFare(reqBody: any): Promise<any> {
        let response = {
            isFreeRide: false 
        };
        const user = await this.utilsService.getCustomerByMobile(reqBody.customer_mobile);
        
        let whereCon: any = {}
        let todayDate = moment().tz('Asia/Calcutta').format('YYYY-MM-DD')
        const format = 'HH:mm:ss';
        const now_time = moment(moment().tz('Asia/Calcutta').format('HH:mm:ss'), format)
        const morning_start_time = moment('07:00:00', format);
        if(now_time >= morning_start_time) {
            
            if(!user) {
                response.isFreeRide = true;
                return response
            } else {
                whereCon['pickup_time'] = Like(`${todayDate}%`)
                // whereCon["customer_id"] = user.id
                whereCon["estimated_fare"] = 0
                // const [items, count] = await this.bookingRepository.findAndCount({where: whereCon, order:{id: 'DESC'}})
                // if(count < 3) {
                //     whereCon["customer_id"] = user.id
                //     const [items, count] = await this.bookingRepository.findAndCount({where: whereCon, order:{id: 'DESC'}})
                //     if(count == 0) {
                //         response.isFreeRide = true;
                //         return response
                //     }
                // } else {
                    whereCon["customer_id"] = user.id
                    whereCon["estimated_fare"] = 0
                    const [items, count] = await this.bookingRepository.findAndCount({where: whereCon, order:{id: 'DESC'}})
                    if(count < 10) {
                        whereCon['pickup_time'] = Like(`${todayDate}%`)
                        const [items, count] = await this.bookingRepository.findAndCount({where: whereCon, order:{id: 'DESC'}})
                        if(count == 0) {
                            response.isFreeRide = true
                        }
                    }
               // }
            }
            
        } else {
            if(!user) {
                response.isFreeRide = true;
                return response
            } else {
                whereCon["customer_id"] = user.id
                whereCon["estimated_fare"] = 0
                const [items, count] = await this.bookingRepository.findAndCount({where: whereCon, order:{id: 'DESC'}})
                if(count < 10) {
                    whereCon['pickup_time'] = Like(`${todayDate}%`)
                    const [items, count] = await this.bookingRepository.findAndCount({where: whereCon, order:{id: 'DESC'}})
                    if(count == 0) {
                        response.isFreeRide = true
                        return response
                    }
                }
            }
            
        }
        return response
    }

    async getHomeDeliveryFareByAddressesTest(reqBody: any): Promise<any> {
        const distanceByVehicle = {
            "2wheeler": 50,
            "3wheeler": 500,
            "4wheeler": 750
        }
        let tripDistance = 0
        let base_fare = 0
        let total_fare = 0;
        let destination = reqBody.drop_address;
        let shopId = reqBody.shop_id
        // let shopDetails = await this.shopService.getShopDetailsById(shopId);
        let source_address = reqBody.pickup_address
        // //console.log(shopDetails)
        const dData = await this.utilsService.getDistanceFromOSM(source_address, destination)
        // //console.log(dData)
        if(dData.code == 'Ok') {
            let totalDistance = dData.routes[0].distance
            if(totalDistance) {
                tripDistance = (totalDistance/1000)
            }
        } else {
            //console.log("getting wrong")
        }
        tripDistance = Math.round(tripDistance)
        //console.log(tripDistance, "trip distance")
        
        const total_trip_weight = distanceByVehicle[reqBody.vehicle_type]
        const rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: 0}, order: {id: 'ASC'}})
        //console.log(rate_data)
        if(tripDistance <=4 ) {
            total_fare =  rate_data.base_rate
        } else {
            //console.log("trip weight ", total_trip_weight)
            //console.log(base_fare, tripDistance, rate_data.rate_per_km)
            total_fare = (rate_data.base_rate) + ((tripDistance-4) * rate_data.rate_per_km)
        }
        return {total_fare: total_fare}
    }
    
    async getBookingFare(reqBody: any): Promise<any> {
        let tripDistance = 0
        let base_fare = 0
        let full_fare = 0;
        let total_fare = 0;
        let message = '';
        const wheeler_percentage_2 = 30 
        const wheeler_percentage_other = 20 
        let source = reqBody.pickup_address;
        let destination = reqBody.drop_address;
        let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${reqBody.customer_id},%`))}})
        if(customer_company_details && customer_company_details.is_discount_applicable) {
            message = 'Discount applicable on this Booking'
        }
        const dData = await this.utilsService.getDistanceFromOSM(source, destination)
        // //console.log(dData)
        if(dData.code == 'Ok') {
            let totalDistance = dData.routes[0].distance
            if(totalDistance) {
                tripDistance = (totalDistance/1000)
            }
        } else {
            //console.log("getting wrong")
        }
        tripDistance = Math.round(tripDistance)
        //console.log(tripDistance, "trip distance")
        const total_trip_weight = reqBody.weight
        const rate_data = await this.getGMRates(total_trip_weight, customer_company_details ? customer_company_details.id : 0)
        // const rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: customer_company_details ? customer_company_details.id : 0}, order: {quantity: 'ASC'}})
        base_fare = rate_data.base_rate
        if(tripDistance <=4 ) {
            total_fare =  base_fare
        } else {
            //console.log("trip weight ", total_trip_weight)
            //console.log(base_fare, tripDistance, rate_data.rate_per_km)
            total_fare = (base_fare ? base_fare : rate_data.base_rate) + ((tripDistance-4) * rate_data.rate_per_km)
            //console.log("fare", total_fare)
            if(reqBody.is_vivegam) {
                if(reqBody.vehicle_type == '2wheeler') {
                    total_fare = total_fare - Math.ceil((wheeler_percentage_2/100) * total_fare)
                } else {
                    total_fare = total_fare - Math.ceil((wheeler_percentage_other/100) * total_fare)
                }
            }
            total_fare = total_fare > base_fare ? total_fare : base_fare
            //console.log(total_fare)
        }
        full_fare = total_fare
        if(reqBody.booking_for == 'Both') {
            tripDistance = 0
            base_fare = 0
            total_fare = 0;
            destination = reqBody.pickup_address;
            source = reqBody.drop_address;
            const dData = await this.utilsService.getDistanceFromOSM(source, destination)
            // //console.log(dData)
            if(dData.code == 'Ok') {
                let totalDistance = dData.routes[0].distance
                if(totalDistance) {
                    tripDistance = (totalDistance/1000)
                }
            } else {
                //console.log("getting wrong")
            }
            tripDistance = Math.round(tripDistance)
            //console.log(tripDistance, "trip distance")
            const total_trip_weight = reqBody.weight
            const rate_data = await this.getGMRates(total_trip_weight, customer_company_details ? customer_company_details.id : 0)
            // const rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: customer_company_details ? customer_company_details : 0}, order: {quantity: 'ASC'}})
            base_fare = rate_data.base_rate
            if(tripDistance <=4 ) {
                total_fare =  base_fare
            } else {
                //console.log("trip weight ", total_trip_weight)
                //console.log(base_fare, tripDistance, rate_data.rate_per_km)
                total_fare = (base_fare ? base_fare : rate_data.base_rate) + ((tripDistance-4) * rate_data.rate_per_km)
                //console.log("fare", total_fare)
                if(reqBody.is_vivegam) {
                    if(reqBody.vehicle_type == '2wheeler') {
                        total_fare = total_fare - Math.ceil((wheeler_percentage_2/100) * total_fare)
                    } else {
                        total_fare = total_fare - Math.ceil((wheeler_percentage_other/100) * total_fare)
                    }
                }
                total_fare = total_fare > base_fare ? total_fare : base_fare
                //console.log(total_fare)
            }
            //console.log("return fare ", total_fare)
            total_fare = Math.ceil((80/100) * total_fare)
            //console.log(full_fare, total_fare)
            full_fare = full_fare + total_fare
            //console.log(full_fare)
        }
        
        
        return {total_fare: full_fare, message}
    }

    async getMultiBookingTotalDistance(sourceData, destinationData) : Promise<any> {
        let totalTripDistance = 0;
        let toll_charge = 0;
        // let source = sourceData.pickup_address;
        // let destination = destinationData.drop_address;
        sourceData.push(...destinationData)
        let i = 0;
        for(let loc of sourceData) {
            if(sourceData[i+1]) {
                let tripDistance = 0;
                /*const dData = await this.utilsService.getDistanceFromOSM(loc, sourceData[i+1])
                if(dData.code == 'Ok') {
                    let totalDistance = dData.routes[0].distance
                    if(totalDistance) {
                        tripDistance = (totalDistance/1000)
                    }
                } else {
                    //console.log("getting wrong")
                }*/
                const dData = await this.utilsService.getMinDistance(loc, sourceData[i+1])
                if(dData.status == 'OK' && dData.routes.length) {
                    let totalDistance = (dData.routes[0].legs && dData.routes[0].legs.length) ? dData.routes[0].legs[0].distance.value : 0
                    for(let route of dData.routes) {
                        //console.log(route.legs[0].distance, "----")
                        if(route.legs.length) {
                            totalDistance = (totalDistance > route.legs[0].distance.value) ? route.legs[0].distance.value : totalDistance
                        }
                    }
                    if(totalDistance > 0) {
                        tripDistance = (totalDistance/1000)
                    }
                }
                console.log(loc, sourceData[i+1])
                console.log(tripDistance)
                
                tripDistance = Math.round(tripDistance)
                totalTripDistance = totalTripDistance + tripDistance
                const rtollRes = await this.utilsService.getTollCharges({lat: loc.lat, long:loc.long}, {lat: sourceData[i+1].lat, long:sourceData[i+1].long})
                if(rtollRes.routes && rtollRes.routes.length && rtollRes.routes[0].legs && rtollRes.routes[0].legs.length) {
                    if(rtollRes.routes[0].legs[0].travelAdvisory?.tollInfo?.estimatedPrice) {
                        toll_charge = toll_charge + (parseInt(rtollRes.routes[0].legs[0].travelAdvisory.tollInfo.estimatedPrice[0]?.units) > 0 ? this.globalTollCharge : 0)
                    }
                }
            }
            i++
        }
        return {totalTripDistance, toll_charge}
    }

    async getMultiBookingFare(reqBody: any): Promise<any> {
        //console.log(reqBody)
        let tripDistance = 0
        let base_fare = 0
        let full_fare = 0;
        let total_fare = 0;
        let message = '';
        let loading_charge = 0;
        let final_toll_charge = 0;
        let additionalPickupCharge = 150;
        const wheeler_percentage_2 = 30;
        const wheeler_percentage_other = 20;
        let estimate_fare_info = '';
        let additional_fare = 0;
        let additional_fare_comments = '';
        let nodes_visit = reqBody.pickup_address.length + reqBody.drop_address.length - 2;
        if(reqBody.trip_type && reqBody.trip_type.toLowerCase() == 'round') {
            nodes_visit = 0
        }
        let distanceData = await this.getMultiBookingTotalDistance(reqBody.pickup_address, reqBody.drop_address)
        console.log(tripDistance, "trip distance")
        tripDistance = distanceData.totalTripDistance
        final_toll_charge = final_toll_charge + distanceData.toll_charge
        estimate_fare_info = estimate_fare_info + "distance: "+tripDistance + ", toll:"+final_toll_charge;
        let total_trip_weight = reqBody.weight
        let rate_data: any = {}
        const customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${reqBody.customer_id},%`))}})
        if(customer_company_details) {
            additionalPickupCharge = customer_company_details.additional_pickup_charge
        }
        if(reqBody.weight_unit && reqBody.weight_unit != 12) {
            rate_data = await this.gmVolumeRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight)}, order: {quantity: 'ASC'}})
        } else {
            rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: customer_company_details ? customer_company_details.id : 0}, order: {quantity: 'ASC'}})
            if(!rate_data) {
                rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: 0}, order: {quantity: 'ASC'}})
            }
        }
        if(!rate_data) {
            console.log("getMultiBookingFare: no rate configured for weight "+total_trip_weight+" (weight_unit: "+reqBody.weight_unit+", customer_id: "+reqBody.customer_id+")")
            return null
        }
        base_fare = rate_data.base_rate
        estimate_fare_info = estimate_fare_info + ", base: " + base_fare
        const points_count = nodes_visit > 0 ? nodes_visit : 0
        
        estimate_fare_info = estimate_fare_info + ", adition pick crg: " + additionalPickupCharge + ", points: " + points_count
        if(tripDistance <=4 ) {
            total_fare =  base_fare
            total_fare = total_fare + (points_count * additionalPickupCharge)
        } else {
            //console.log("trip weight ", total_trip_weight)
            //console.log(base_fare, tripDistance, rate_data.rate_per_km)
            total_fare = base_fare + ((tripDistance-4) * rate_data.rate_per_km)
            total_fare = total_fare + (points_count * additionalPickupCharge)
            //console.log("fare", total_fare)
            
            if(reqBody.is_vivegam) {
                if(reqBody.vehicle_type == '2wheeler') {
                    total_fare = total_fare - Math.ceil((wheeler_percentage_2/100) * total_fare)
                } else {
                    total_fare = total_fare - Math.ceil((wheeler_percentage_other/100) * total_fare)
                }
            }
            total_fare = total_fare > base_fare ? total_fare : base_fare
            //console.log(total_fare)
        }
        full_fare = total_fare
        estimate_fare_info = estimate_fare_info + ", fare: " + full_fare + ", rate per km: " + rate_data.rate_per_km
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
        estimate_fare_info = estimate_fare_info + ", loading: " + loading_charge
        if(reqBody.trip_type && reqBody.trip_type.toLowerCase() == 'round') {
            estimate_fare_info = estimate_fare_info + ", return =====> "
            tripDistance = 0
            base_fare = 0
            total_fare = 0;
            let destination = reqBody.pickup_address[0];
            let source = reqBody.drop_address[0];
            /*const dData = await this.utilsService.getDistanceFromOSM(source, destination)
            // //console.log(dData)
            if(dData.code == 'Ok') {
                let totalDistance = dData.routes[0].distance
                if(totalDistance) {
                    tripDistance = (totalDistance/1000)
                }
            } else {
                //console.log("getting wrong")
            }*/
            const dData = await this.utilsService.getMinDistance(source, destination)
            if(dData.status == 'OK' && dData.routes.length) {
                let totalDistance = (dData.routes[0].legs && dData.routes[0].legs.length) ? dData.routes[0].legs[0].distance.value : 0
                for(let route of dData.routes) {
                    //console.log(route.legs[0].distance, "----")
                    if(route.legs.length) {
                        totalDistance = (totalDistance > route.legs[0].distance.value) ? route.legs[0].distance.value : totalDistance
                    }
                }
                if(totalDistance > 0) {
                    tripDistance = (totalDistance/1000)
                }
            }
            tripDistance = Math.round(tripDistance)
            //console.log(tripDistance, "trip distance")
            estimate_fare_info = estimate_fare_info + ", distance: " + tripDistance
            const rtollRes = await this.utilsService.getTollCharges({lat: source.lat, long:source.long}, {lat: destination.lat, long:destination.long})
            if(rtollRes.routes && rtollRes.routes.length && rtollRes.routes[0].legs && rtollRes.routes[0].legs.length) {
                if(rtollRes.routes[0].legs[0].travelAdvisory?.tollInfo?.estimatedPrice) {
                    final_toll_charge = final_toll_charge + (parseInt(rtollRes.routes[0].legs[0].travelAdvisory.tollInfo.estimatedPrice[0]?.units) > 0 ? this.globalTollCharge : 0)
                }
            }
            estimate_fare_info = estimate_fare_info + ", toll: " + final_toll_charge
            total_trip_weight = reqBody.return_weight ? reqBody.return_weight : reqBody.weight
            let return_rate_data: any = {}
            if(reqBody.weight_unit && reqBody.weight_unit != 12) {
                return_rate_data = await this.gmVolumeRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight)}, order: {quantity: 'ASC'}})
            } else {
                return_rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: customer_company_details ? customer_company_details.id :0}, order: {quantity: 'ASC'}})
            }
            base_fare = return_rate_data.base_rate
            estimate_fare_info = estimate_fare_info + ", basefare: " + base_fare
            if(tripDistance <=4 ) {
                total_fare =  base_fare
            } else {
                //console.log("trip weight ", total_trip_weight)
                //console.log(base_fare, tripDistance, return_rate_data.rate_per_km)
                total_fare = base_fare + ((tripDistance-4) * return_rate_data.rate_per_km)
                //console.log("fare", total_fare)
                if(reqBody.is_vivegam) {
                    if(reqBody.vehicle_type == '2wheeler') {
                        total_fare = total_fare - Math.ceil((wheeler_percentage_2/100) * total_fare)
                    } else {
                        total_fare = total_fare - Math.ceil((wheeler_percentage_other/100) * total_fare)
                    }
                }
                total_fare = total_fare > base_fare ? total_fare : base_fare
                //console.log(total_fare)
            }
            
            if(reqBody.both_loading_unloading_charge_applicable) {
                loading_charge = loading_charge + return_rate_data.loading_unloading
            } else {
                if(reqBody.loading_charge_applicable) {
                    loading_charge = loading_charge + return_rate_data.loading
                }
                if(reqBody.unloading_charge_applicable) {
                    loading_charge = loading_charge + return_rate_data.unloading
                }
            }
            estimate_fare_info = estimate_fare_info + ", loading: " + loading_charge + ", rate per km: " + return_rate_data.rate_per_km
            //console.log("return fare ", total_fare)
            total_fare = Math.ceil((80/100) * total_fare)
            total_fare = total_fare > base_fare ? total_fare : base_fare
            estimate_fare_info = estimate_fare_info + ", fare: " + total_fare
            //console.log(full_fare, total_fare)
            full_fare = full_fare + total_fare
            //console.log(full_fare)
        } else {
            if(tripDistance > this.deamMilesLimit) {
                const dead_miles_price_per_km = customer_company_details ? customer_company_details.dead_miles_price : 14
                // //console.log(customer_company_details.company_name, customer_company_details.dead_miles_price, dead_miles_price_per_km)
                const dead_miles_price = tripDistance * dead_miles_price_per_km
                full_fare = full_fare + dead_miles_price
                estimate_fare_info = estimate_fare_info + ", dead miles fare = " + dead_miles_price
            }
        }
        estimate_fare_info = estimate_fare_info + ", final obj: " + JSON.stringify({total_fare: full_fare, message, loading_charge, toll_charge: final_toll_charge})
        // let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${reqBody.customer_id},%`))}})
        if(customer_company_details && customer_company_details.is_discount_applicable) {
            message = 'Discount applicable on this Booking'
        }
        if((customer_company_details && !customer_company_details.is_regular) || !customer_company_details) {
            //console.log(customer_company_details)
            let customerIds = []
            if(!customer_company_details) {
                customerIds.push(reqBody.customer_id)
            } else {
                let cCustomers = customer_company_details.users.split(",")
                cCustomers.pop()
                for(let cId of cCustomers) {
                    cId = cId.trim()
                    customerIds.push(parseInt(cId.substring(1, cId.length)))
                }
            }
            
            const previousBooking = await this.bookingRepository.findOne({where:{customer_id: In(customerIds)}, order: {id: 'DESC'}});
            if(previousBooking && !previousBooking.is_full_payment && previousBooking.waiting_charge) {
                const previousBookings = await this.bookingRepository.find({where:{multi_booking_id: previousBooking.multi_booking_id}});
                for(let booking of previousBookings) {
                    additional_fare += parseInt(booking.waiting_charge != null ? booking.waiting_charge: '0')
                    additional_fare_comments = 'Waiting Charge for Booking: '+booking.id
                }
                
            }
        }
        
        return {total_fare: full_fare, message, loading_charge, toll_charge: final_toll_charge, estimate_fare_info, is_regular: (customer_company_details ? customer_company_details.is_regular : false), additional_fare, additional_fare_comments}
    }

    async getLoadingFare(reqBody: any): Promise<any> {
        let loading_charge = 0;
        let total_trip_weight = reqBody.weight
        let rate_data: any = {}
        const customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${reqBody.customer_id},%`))}})
        if(reqBody.weight_unit && reqBody.weight_unit != 12) {
            rate_data = await this.gmVolumeRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight)}, order: {quantity: 'ASC'}})
        } else {
            rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: customer_company_details ? customer_company_details.id : 0}, order: {quantity: 'ASC'}})
            if(!rate_data) {
                rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: 0}, order: {quantity: 'ASC'}})
            }
        }
        
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
        if(reqBody.trip_type && reqBody.trip_type.toLowerCase() == 'round') {
            
            let return_rate_data: any = {}
            if(reqBody.weight_unit && reqBody.weight_unit != 12) {
                return_rate_data = await this.gmVolumeRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight)}, order: {quantity: 'ASC'}})
            } else {
                return_rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: customer_company_details ? customer_company_details.id :0}, order: {quantity: 'ASC'}})
            }
            if(reqBody.both_loading_unloading_charge_applicable) {
                loading_charge = loading_charge + return_rate_data.loading_unloading
            } else {
                if(reqBody.loading_charge_applicable) {
                    loading_charge = loading_charge + return_rate_data.loading
                }
                if(reqBody.unloading_charge_applicable) {
                    loading_charge = loading_charge + return_rate_data.unloading
                }
            }
            
        }
        
        return { loading_charge }
    }

    async calcGoogleTourDistance(reqBody:  any): Promise<any> {
        let tourDistance = 0
        const tourSequenceses = await this.tourRouteRepo.find({where:{tour_id: reqBody.tourId}, order: {sequence_number: 'ASC'}})
        let locIndex = 0
        for(let tourSequence of tourSequenceses) {
            if(tourSequenceses[locIndex + 1]) {
                const dData = await this.utilsService.getDistance({lat:tourSequence.location.coordinates[1], long: tourSequence.location.coordinates[0]}, {lat:tourSequenceses[locIndex+1].location.coordinates[1], long: tourSequenceses[locIndex+1].location.coordinates[0]})
                let d = dData.rows[0]
                let totalDistance=0
                //console.log(d.elements)
                //console.log(d.elements[0].distance.value)
                if(d.elements[0].distance.value) {
                    totalDistance = (d.elements[0].distance.value/1000)
                }
                //console.log({lat:tourSequence.location.coordinates[1], long: tourSequence.location.coordinates[0]}, {lat:tourSequenceses[locIndex+1].location.coordinates[1], long: tourSequenceses[locIndex+1].location.coordinates[0]})
                //console.log(totalDistance)
                tourDistance = tourDistance + totalDistance
            }
            locIndex = locIndex + 1
        }
        return tourDistance
    }

    async getCustomerCompanyDetails(reqBody: any): Promise<any> {
        let companyDetails = {}
        let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${reqBody.user_id},%`))}})
        if(customer_company_details && customer_company_details.address_id) {
            let address = await this.customerAddressRepo.findOneBy({id:customer_company_details.address_id})
            companyDetails['address'] = address
        }
        companyDetails['company'] = customer_company_details
        return companyDetails
    }

    getDriverLatestLocation = async (driverId: any) => {
        let latestPointDetails: any = {}
        const latestPoint = await this.locationsRepo.findOne({where:{user_id: driverId}, order:{id: 'DESC'}})
        if(latestPoint) {
            latestPointDetails.latitude = latestPoint.latitude
            latestPointDetails.longitude = latestPoint.longitude
            const addressData = await this.utilsService.getGoogleAddressByLatLong({lat: latestPoint.latitude, long: latestPoint.longitude})
            // //console.log(addressData)
            if(addressData.results && addressData.results[0]) {
                latestPointDetails.address = addressData.results[0].formatted_address
            }
        }
        return latestPointDetails
    }
    async getCustomerAddressEditList(reqBody: any): Promise<any> {
        let addresses = await this.customerAddressRepo.find({})
        // //console.log(addresses)
        for(let address of addresses) {
            //console.log(address.latitude, address.longitude)
            //console.log(address.address)
            // let add = await this.utilsService.getGoogleAddressByLatLong({lat: address.latitude, long: address.longitude})
            let add = await this.utilsService.getGoogleAddressByLatLong({lat: 13.016976222358169, long: 79.9638636134932})
            //console.log(add.results[0])
            let addr = await this.utilsService.getGoogleAddressByPlaceId(add.results[0].place_id)
            //console.log(addr.results[0])
            break;
        }
        return true
    }

    async reCalculateHomeDeliveryFareByDate(reqBody: any): Promise<any> {
        const distanceByVehicle = {
            "2wheeler": 50,
            "3wheeler": 500,
            "4wheeler": 750
        }

        const bookings = await this.bookingRepository.find({where: {booking_type: 'Home Delivery', pickup_time: Like(`${reqBody.calc_date}%`)}})
        //console.log("bookings")
        for(let booking of bookings) {
            //console.log(booking.id)
            let tripDistance = 0
            let base_fare = 0
            let total_fare = 0;

            let destination = {lat: booking.dropoff_lat, long: booking.dropoff_long};
            // let shopDetails = await this.shopService.getShopDetailsById(shopId);
            let source_address = {lat: booking.pickup_lat, long: booking.pickup_long};
            // //console.log(shopDetails)
            const dData = await this.utilsService.getDistanceFromOSM(source_address, destination)
            // //console.log(dData)
            if(dData.code == 'Ok') {
                let totalDistance = dData.routes[0].distance
                if(totalDistance) {
                    tripDistance = (totalDistance/1000)
                }
            } else {
                //console.log("getting wrong")
            }
            tripDistance = Math.round(tripDistance)
            //console.log(tripDistance, "trip distance")
            
            const total_trip_weight = distanceByVehicle['4wheeler']
            const rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: 0}, order: {id: 'ASC'}})
            //console.log(rate_data)
            if(tripDistance <=4 ) {
                total_fare =  rate_data.base_rate
            } else {
                //console.log("trip weight ", total_trip_weight)
                //console.log(base_fare, tripDistance, rate_data.rate_per_km)
                total_fare = (rate_data.base_rate) + ((tripDistance-4) * rate_data.rate_per_km)
            }
            //console.log(total_fare)
            await this.bookingRepository.update({id: booking.id}, {fare: total_fare.toString()})
        }
        
    }
    async checkSourceLocation(reqBody: any): Promise<any> {
        const allowedPincodes = ["600017"]
        let customer_pincode = reqBody.pincode
        if(allowedPincodes.indexOf(customer_pincode) < 0 ) {
            return false
        }
        return true
    }

    async getBookingDistance(reqBody: any): Promise<any> {
        let vehicle_types = ['2wheeler', '3wheeler']
        let distanceLimit = 50;
        let source_address: any = {}
        let tripDistance = 0
        if(reqBody.shop_id) {
            let shopId = reqBody.shop_id
            let shopDetails = await this.shopService.getShopDetailsById(shopId);
            source_address = {
                lat: shopDetails.latitude,
                long: shopDetails.longitude
            }
        } else {
            source_address = reqBody.source_address
        }
        if(reqBody.city.toLowerCase() == 'delhi') {
            distanceLimit = 80;
            vehicle_types.push('4wheeler')
        }
        let destination_address = reqBody.destination_address
        const dData = await this.utilsService.getDistanceFromOSM(source_address, destination_address)
        if(dData.code == 'Ok') {
            let totalDistance = dData.routes[0].distance
            if(totalDistance) {
                tripDistance = (totalDistance/1000)
            }
        } else {
            //console.log("getting wrong")
        }
        tripDistance = Math.round(tripDistance)
        if(tripDistance > distanceLimit && vehicle_types.indexOf(reqBody.vehicle_type) > -1) {
            return false
        }
        return true
    }

    async calcGoogleMapDistanceWithLatlongs(reqBody: any): Promise<any> {
        const dData = await this.utilsService.getDistance({lat: 13.097920071842182, long: 	80.17408865653441}, {lat: 13.127315261521796, long: 79.93773472692665})
        // //console.log(dData)
        if(dData.status == 'OK') {
            // //console.log(dData.rows)
            let d = dData.rows[0]
            //console.log(d.elements)
            // //console.log(d.elements[0].distance.value)
            if(d.elements[0].distance.value) {
                 //console.log(d.elements[0].distance.value/1000)
            }
            // //console.log(loc)
            // //console.log(points[locD.index] ? points[locD.index].id : ' ', points[locD.index] ? points[locD.index].loc_time : ' ',loc.latitude, loc.longitude, points[finalSnapPoints[i+1].index] ? points[finalSnapPoints[i+1].index].id :  ' ',points[snapPoints[i+1].index] ? points[snapPoints[i+1].index].loc_time :  ' ', snapPoints[i+1].loc.latitude, snapPoints[i+1].loc.longitude, totalDistance)
        }
        
    } 

    async euclideanDistance(lat1: any, long1: any, lat2: any, long2: any): Promise<any> {
        const earthRadius = 6371;
        const pi = 3.14;
        const p1Lat = (lat1 / 180) * pi;
        const p1Long = (long1 / 180) * pi;
        const p2Lat = (lat2 / 180) * pi;
        const p2Long = (long2 / 180) * pi;
        const x1 = earthRadius * Math.cos(p1Lat) * Math.cos(p1Long);
        const x2 = earthRadius * Math.cos(p2Lat) * Math.cos(p2Long);
        const y1 = earthRadius * Math.cos(p1Lat) * Math.sin(p1Long);
        const y2 = earthRadius * Math.cos(p2Lat) * Math.sin(p2Long);
        const z1 = earthRadius * Math.sin(p1Lat);
        const z2 = earthRadius * Math.sin(p2Lat);
        const distance = Math.sqrt(
          Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) + Math.pow(z1 - z2, 2)
        );
        return Math.floor(distance*1000);
      };

    async compareDriverLocationWhenTourUpdate(reqBody: any): Promise<any> {
        const reportFileName= './public/compare_locs.csv';
        const headerData = ['Booking id', 'Type', 'Original Time', 'Previous Time', 'Distance', 'Next Time', 'Distance']
        let allBookings = ""
        for(let i=0; i<headerData.length; i++){
            allBookings += headerData[i] + ","
        }
        allBookings += '\n'
        let bookings =  await this.bookingRepository.find({where:{is_manager_entered: true, pickup_time: Like(`${reqBody.pickupTime}%`)}, order:{id: 'ASC'} })
        let bookingStatusValues = ['Reached pickup', 'Reached drop']
        for(let booking of bookings) {
            for(let bStatusValue of bookingStatusValues) {
                let bookingString = ""
                let bStatus = await this.bsRepo.findOne({where:{booking_id: booking.id, status: bStatusValue}})
                if(bStatus) {
                    let tourId = bStatus.tour_id
                    let tourData = await this.toursEntity.findOneBy({id: tourId})
                    if(tourData) {
                        let driverId = tourData.driver_id
                        let lLocData = await this.locationsRepo.find({where: {user_id: driverId, created_at: LessThanOrEqual(bStatus.created_at)}, order: {id: 'DESC'}})
                        let lDistance = 0
                        // let lData = await this.utilsService.getDistance({lat: bStatusValue == 'Reached pickup' ? booking.pickup_lat : booking.dropoff_lat, long: bStatusValue == 'Reached pickup' ? booking.pickup_long : booking.dropoff_long}, {lat: lLocData[0].latitude, long: lLocData[0].longitude})
                        // if(lData.status == 'OK') {
                        //     lDistance = lData.rows[0].elements[0].distance ? (lData.rows[0].elements[0].distance.value) : 0
                        // } 
                        lDistance = await this.euclideanDistance(bStatusValue == 'Reached pickup' ? booking.pickup_lat : booking.dropoff_lat, bStatusValue == 'Reached pickup' ? booking.pickup_long : booking.dropoff_long, lLocData[0].latitude, lLocData[0].longitude)
                        let gLocData = await this.locationsRepo.find({where: {user_id: driverId, created_at: MoreThanOrEqual(bStatus.created_at)}, order: {id: 'ASC'}})
                        let gDistance = 0
                        gDistance = await this.euclideanDistance(bStatusValue == 'Reached pickup' ? booking.pickup_lat : booking.dropoff_lat, bStatusValue == 'Reached pickup' ? booking.pickup_long : booking.dropoff_long, gLocData[0].latitude, gLocData[0].longitude)
                        // let gData = await this.utilsService.getDistance({lat: bStatusValue == 'Reached pickup' ? booking.pickup_lat : booking.dropoff_lat, long: bStatusValue == 'Reached pickup' ? booking.pickup_long : booking.dropoff_long}, {lat: gLocData[0].latitude, long: gLocData[0].longitude})
                        // if(gData.status == 'OK') {
                        //     gDistance = gData.rows[0].elements[0].distance ? (gData.rows[0].elements[0].distance.value) : 0
                        // } 
                        bookingString = booking.id + "," + bStatusValue + "," + moment(bStatus.created_at).tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss') + "," + moment(lLocData[0].created_at).tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss') + "," + lDistance + "," + moment(gLocData[0].created_at).tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss') + "," + gDistance + "\n"
                        //console.log(bookingString)
                    }
                }
                allBookings = allBookings + bookingString
                await fs.writeFileSync(reportFileName, allBookings, 'utf8')
            }
            
            
        }
        return true
    } 

    async updateMultiBookingFare(reqBody: any): Promise<any> {
        const bookingId = reqBody.bookingId;
        const is_vivegam = reqBody.is_vivegam;
        const bookingData = await this.bookingRepository.findOneBy({id: bookingId});
        if(!bookingData) {
            return false
        }
        const multiBookingId = bookingData.multi_booking_id;
        const bookings = await this.bookingRepository.find({where: {multi_booking_id: multiBookingId}});
        let pickups = [], dropoffs = [];
        let pickup_addresses = [], dropoff_addresses = [];
        for(let booking of bookings) {
            pickup_addresses.push({lat: booking.pickup_lat, long: booking.pickup_long})
            dropoff_addresses.push({lat: booking.dropoff_lat, long: booking.dropoff_long})
        }   
        //console.log(dropoff_addresses)
        // pickup_addresses = [...new Set(pickup_addresses)]
        let dropoff_addresses_data = [];
        let pickup_addresses_data = [];
        for(let i=0; i<pickup_addresses.length; i++) {
            let found = false
            for(let j=0; j<pickup_addresses_data.length; j++) {
                if(pickup_addresses[i].lat == pickup_addresses_data[j].lat && pickup_addresses[i].long == pickup_addresses_data[j].long) {
                    found = true
                }
            }
            if(!found) {
                pickup_addresses_data.push(pickup_addresses[i])
            }
        }
        for(let i=0; i<dropoff_addresses.length; i++) {
            let found = false
            for(let j=0; j<dropoff_addresses_data.length; j++) {
                if(dropoff_addresses[i].lat == dropoff_addresses_data[j].lat && dropoff_addresses[i].long == dropoff_addresses_data[j].long) {
                    found = true
                }
            }
            if(!found) {
                dropoff_addresses_data.push(dropoff_addresses[i])
            }
        }
        //console.log(dropoff_addresses_data)
        let reqObj: any = {
            "trip_type": bookingData.trip_type,
            "customer_id": bookingData.customer_id,
            "drop_address":  dropoff_addresses_data,
            "is_vivegam": is_vivegam,
            "pickup_address":  pickup_addresses_data,
            "vehicle_type": "4wheeler",
            "weight": parseInt(bookingData.commodity_weight),
            "weight_unit": 12
        }
        let return_fare = 0
        if(bookingData.trip_type.toLocaleLowerCase() == 'round') {

            for(let booking of bookings) {
                if(booking.id != bookingData.id) {
                    return_fare = parseInt(booking.commodity_weight)
                }
            }
        }
        reqObj['return_weight'] = return_fare
        //console.log(reqObj)
        const fareDetails = await this.getMultiBookingFare(reqObj);
        let dropoff_time = bookingData.dropoff_time
        if(is_vivegam) {
            dropoff_time = moment(bookingData.pickup_time).add(6, 'hours').format('YYYY-MM-DD HH:mm:ii')
        }   
        // {total_fare: full_fare, message, loading_charge, toll_charge: final_toll_charge, estimate_fare_info, is_regular: (customer_company_details ? customer_company_details.is_regular : false), additional_fare, additional_fare_comments}
        const total_fare = fareDetails.loading_charge + fareDetails.toll_charge + fareDetails.total_fare + fareDetails.additional_fare;
        const updateData = {
            estimated_fare: Math.ceil(fareDetails.total_fare/bookings.length).toString(),
            estimated_fare_info: fareDetails.estimated_fare_info,
            is_vivegam: is_vivegam,
            dropoff_time: dropoff_time,
            total_fare: total_fare,
            additional_fare: fareDetails.additional_fare, 
            additional_fare_comments: fareDetails.additional_fare_comments
        }
        await this.bookingRepository.update({multi_booking_id: multiBookingId}, updateData)
        return fareDetails
    }
    
    async deliverBooking(reqBody: any): Promise<any> {
        let weightChargesCalculated = false;
        let bookingIds = [];
        let filledBookings = [];
        let booking = await this.bookingRepository.findOneBy({id: reqBody.booking_id});
        if(!booking.is_regular) {
            let bookings = await this.bookingRepository.find({where: {multi_booking_id: booking.multi_booking_id}});
            for(let booking of bookings) {
                if(booking.waiting_charge) {
                    weightChargesCalculated = true
                }
                bookingIds.push(booking.id)
                if(booking.reached_pickup && booking.completed_pickup && booking.reached_drop) {
                    filledBookings.push(booking.id)
                    let updateValues = {}
                    const nDate = new Date(new Date().toLocaleString('en-US', {timeZone: 'Asia/Calcutta'}));
                    updateValues['completed_drop'] = moment(nDate).format('YYYY-MM-DD HH:mm:ss')
                    if(!booking.completed_drop && booking.id) {
                        await this.bookingRepository.update({id: booking.id}, updateValues)
                    }
                }
            }
            if(!weightChargesCalculated && bookings.length >= 1 && bookings.length == filledBookings.length) {
                let trip_type = bookings[0].trip_type
                if(trip_type != 'round') {
                    for(let booking of bookings) {
                        let updateValues = {}
                        const nDate = new Date().toLocaleString('en-US', {timeZone: 'Asia/Calcutta'});
                        updateValues['completed_drop'] = moment(nDate).format('YYYY-MM-DD HH:mm:ss')
                        await this.bookingRepository.update({id: booking.id}, updateValues)
                    }
                }
                if(trip_type == 'multipickup') {
                    let fromTime = bookings[0].reached_drop
                    let toTime = bookings[0].completed_drop
                    let diffMins = moment(toTime).diff(moment(fromTime), 'minutes')
                    let avgMins = Math.round(diffMins/bookings.length)
                    let startTime = fromTime
                    let endTime = ''
                    for(let bookingD of bookings) {
                        endTime = moment(startTime).add(avgMins, 'minutes').format('YYYY-MM-DD HH:mm:ss')
                        await this.bookingRepository.update({id: bookingD.id}, {reached_drop: startTime, completed_drop: endTime})
                        startTime = endTime
                    }
                } else if(trip_type == 'multidrop') {
                    let fromTime = bookings[0].reached_pickup
                    let toTime = bookings[0].completed_pickup
                    let diffMins = moment(toTime).diff(moment(fromTime), 'minutes')
                    let avgMins = Math.round(diffMins/bookings.length)
                    let startTime = fromTime
                    let endTime = ''
                    for(let bookingD of bookings) {
                        endTime = moment(startTime).add(avgMins, 'minutes').format('YYYY-MM-DD HH:mm:ss')
                        await this.bookingRepository.update({id: bookingD.id}, {reached_pickup: startTime, completed_pickup: endTime})
                        startTime = endTime
                    }
                }
                let tourRoute = await this.tourRouteRepo.find({where: {booking_id: In(bookingIds)}, order: {sequence_number: 'ASC'}})
                let i=0;
                let tripDistance = 0;
                for(let seq of tourRoute) {
                    if(tourRoute[i+1]) {
                        const dis = await this.calcDeadDistance(seq.location, tourRoute[i+1].location);
                        // const dis = 5
                        tripDistance = tripDistance + dis
                    }
                    i++
                }
                tripDistance = Math.round(tripDistance)
                let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${bookings[0].customer_id},%`))}})
                if(!customer_company_details) {
                    customer_company_details = this.defaultRates
                }
                let nodes_visit = bookings.length - 1;
                let total_waiting_charge = 0
                if(customer_company_details.waiting_charge_type == 'T1') {
                    total_waiting_charge = await this.caliculateT1WaitingCharge(nodes_visit, bookingIds)
                } else if(customer_company_details.waiting_charge_type == 'T2') {
                    total_waiting_charge = await this.caliculateT2WaitingCharge(nodes_visit, bookingIds, tripDistance)
                } 
                let waiting_charge_value = total_waiting_charge > 0 ? Math.round(total_waiting_charge/bookings.length) : 0
                for(let booking of bookings) {
                    let total_booking_fare: any = 0
                    let total_fare = parseInt(booking.total_fare)
                    let estimate_fare_info = booking.estimate_fare_info
                    // let amount_collected = booking.amount_collected
                    estimate_fare_info += ", waiting charge " + total_waiting_charge
                    if(booking.payment_status.toLowerCase() != 'completed') {
                        
                        total_fare = parseInt(booking.total_fare) + total_waiting_charge;
                        // amount_collected = total_fare.toString();
                        if (typeof booking.estimated_fare === 'string') {
                            total_booking_fare += parseInt(booking.estimated_fare)
                        } else {
                            total_booking_fare += booking.estimated_fare
                        }
                        if (typeof booking.loading_charge === 'string') {
                            total_booking_fare += parseInt(booking.loading_charge)
                        } else {
                            total_booking_fare += booking.loading_charge
                        }
                        if (typeof booking.additional_fare === 'string') {
                            total_booking_fare += parseInt(booking.additional_fare)
                        } else {
                            total_booking_fare += booking.additional_fare
                        }
                        if (typeof booking.toll_charges === 'string') {
                            total_booking_fare += parseInt(booking.toll_charges)
                        } else {
                            total_booking_fare += booking.toll_charges
                        }
                        total_booking_fare += waiting_charge_value
                    } else {
                        total_booking_fare = parseInt(booking.total_booking_fare)
                    }
                    await this.bookingRepository.update({id: booking.id}, {waiting_charge: waiting_charge_value.toString(), total_distance: tripDistance.toString(), total_fare: total_fare.toString(), estimate_fare_info: estimate_fare_info, total_booking_fare: total_booking_fare.toString()})
                }
                return true
            } else {
                return false
            }
        } else {
            return false
        }
        
    }

    async feedCompanyRates(reqBody: any): Promise<any> {
        let gmRates = await this.gmRates.find();
        let companies = await this.customerCompanyDetails.find({where:{id: 102}})
        console.log(companies[0].id)
        for(let company of companies) {
            for(let gmRate of gmRates) {
                let gmRateData = {
                    quantity: gmRate.quantity,
                    base_rate: gmRate.base_rate,
                    rate_per_km: gmRate.rate_per_km,
                    loading: gmRate.loading,
                    unloading: gmRate.unloading,
                    loading_unloading: gmRate.loading_unloading,
                    company_id: company.id
                }
                await this.gmRates.save(gmRateData);
                //console.log(gmRateData)
            }
        }
    }

    async revenueCalculationDateRange(reqBody: any): Promise<any> {
        let fromDate = new Date(reqBody.from_date);
        let toDate = new Date(reqBody.to_date);
        
        for (let day = fromDate; day <= toDate; day.setDate(day.getDate() + 1)) {
            // //console.log(day)
            let calc_date = moment(day).format('YYYY-MM-DD')
            //console.log(calc_date)
            let res = await this.revenueCalculation({calc_date})
            //console.log(res)
        }
        return true

    }

    async checkToll(reqBody: any) : Promise<any> {
        const rtollRes = await this.utilsService.getTollCharges({lat: reqBody.lat, long:reqBody.long}, {lat: reqBody.dlat, long:reqBody.dlong})
        //console.log(JSON.stringify(rtollRes))
        return rtollRes
    }

    async getMultiBookingFareNew(reqBody: any): Promise<any> {
        // //console.log(reqBody)
        let tripDistance = 0
        let base_fare = 0
        let full_fare = 0;
        let total_fare = 0;
        let message = '';
        let loading_charge = 0;
        let final_toll_charge = 0;
        let additionalPickupCharge = 150;
        const wheeler_percentage_2 = 30;
        const wheeler_percentage_other = 20;
        let estimate_fare_info = '';
        let additional_fare = 0;
        let additional_fare_comments = '';
        let nodes_visit = reqBody.pickup_address.length + reqBody.drop_address.length - 2;
        if(reqBody.trip_type && reqBody.trip_type.toLowerCase() == 'round') {
            nodes_visit = 0
        }
        let distanceData = await this.getMultiBookingTotalDistance(reqBody.pickup_address, reqBody.drop_address)
        //console.log(tripDistance, "trip distance")
        tripDistance = distanceData.totalTripDistance
        final_toll_charge = final_toll_charge + distanceData.toll_charge
        estimate_fare_info = estimate_fare_info + "distance: "+tripDistance + ", toll:"+final_toll_charge;
        let total_trip_weight = reqBody.weight
        let rate_data: any = {}
        const customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${reqBody.customer_id},%`))}})
        if(customer_company_details) {
            additionalPickupCharge = customer_company_details.additional_pickup_charge
        }
        if(reqBody.weight_unit && reqBody.weight_unit != 12) {
            rate_data = await this.gmVolumeRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight)}, order: {quantity: 'ASC'}})
        } else {
            rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: customer_company_details ? customer_company_details.id : 0}, order: {quantity: 'ASC'}})
        }
        base_fare = rate_data.base_rate
        estimate_fare_info = estimate_fare_info + ", base: " + base_fare
        const points_count = nodes_visit > 0 ? nodes_visit : 0
        
        estimate_fare_info = estimate_fare_info + ", adition pick crg: " + additionalPickupCharge + ", points: " + points_count
        if(tripDistance <=4 ) {
            total_fare =  base_fare
            total_fare = total_fare + (points_count * additionalPickupCharge)
        } else {
            // //console.log("trip weight ", total_trip_weight)
            // //console.log(base_fare, tripDistance, rate_data.rate_per_km)
            total_fare = base_fare + ((tripDistance-4) * rate_data.rate_per_km)
            total_fare = total_fare + (points_count * additionalPickupCharge)
            // //console.log("fare", total_fare)
            
            if(reqBody.is_vivegam) {
                if(reqBody.vehicle_type == '2wheeler') {
                    total_fare = total_fare - Math.ceil((wheeler_percentage_2/100) * total_fare)
                } else {
                    total_fare = total_fare - Math.ceil((wheeler_percentage_other/100) * total_fare)
                }
            }
            total_fare = total_fare > base_fare ? total_fare : base_fare
            // //console.log(total_fare)
        }
        full_fare = total_fare
        //console.log("full_fare", full_fare)
        estimate_fare_info = estimate_fare_info + ", fare: " + full_fare + ", rate per km: " + rate_data.rate_per_km
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
        estimate_fare_info = estimate_fare_info + ", loading: " + loading_charge
        if(reqBody.trip_type && reqBody.trip_type.toLowerCase() == 'round') {
            estimate_fare_info = estimate_fare_info + ", return =====> "
            tripDistance = 0
            base_fare = 0
            total_fare = 0;
            let destination = reqBody.pickup_address[0];
            let source = reqBody.drop_address[0];
            /*const dData = await this.utilsService.getDistanceFromOSM(source, destination)
            // //console.log(dData)
            if(dData.code == 'Ok') {
                let totalDistance = dData.routes[0].distance
                if(totalDistance) {
                    tripDistance = (totalDistance/1000)
                }
            } else {
                //console.log("getting wrong")
            }*/
            const dData = await this.utilsService.getMinDistance(source, destination)
            if(dData.status == 'OK' && dData.routes.length) {
                let totalDistance = (dData.routes[0].legs && dData.routes[0].legs.length) ? dData.routes[0].legs[0].distance.value : 0
                for(let route of dData.routes) {
                    //console.log(route.legs[0].distance, "----")
                    if(route.legs.length) {
                        totalDistance = (totalDistance > route.legs[0].distance.value) ? route.legs[0].distance.value : totalDistance
                    }
                }
                if(totalDistance > 0) {
                    tripDistance = (totalDistance/1000)
                }
            }
            tripDistance = Math.round(tripDistance)
            //console.log(tripDistance, "trip distance")
            estimate_fare_info = estimate_fare_info + ", distance: " + tripDistance
            const rtollRes = await this.utilsService.getTollCharges({lat: source.lat, long:source.long}, {lat: destination.lat, long:destination.long})
            if(rtollRes.routes && rtollRes.routes.length && rtollRes.routes[0].legs && rtollRes.routes[0].legs.length) {
                if(rtollRes.routes[0].legs[0].travelAdvisory?.tollInfo?.estimatedPrice) {
                    final_toll_charge = final_toll_charge + (parseInt(rtollRes.routes[0].legs[0].travelAdvisory.tollInfo.estimatedPrice[0]?.units) > 0 ? this.globalTollCharge : 0)
                }
            }
            estimate_fare_info = estimate_fare_info + ", toll: " + final_toll_charge
            total_trip_weight = reqBody.return_weight ? reqBody.return_weight : reqBody.weight
            let return_rate_data: any = {}
            if(reqBody.weight_unit && reqBody.weight_unit != 12) {
                return_rate_data = await this.gmVolumeRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight)}, order: {quantity: 'ASC'}})
            } else {
                return_rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: customer_company_details ? customer_company_details.id :0}, order: {quantity: 'ASC'}})
            }
            base_fare = return_rate_data.base_rate
            estimate_fare_info = estimate_fare_info + ", basefare: " + base_fare
            if(tripDistance <=4 ) {
                total_fare =  base_fare
            } else {
                // //console.log("trip weight ", total_trip_weight)
                // //console.log(base_fare, tripDistance, return_rate_data.rate_per_km)
                total_fare = base_fare + ((tripDistance-4) * return_rate_data.rate_per_km)
                // //console.log("fare", total_fare)
                if(reqBody.is_vivegam) {
                    if(reqBody.vehicle_type == '2wheeler') {
                        total_fare = total_fare - Math.ceil((wheeler_percentage_2/100) * total_fare)
                    } else {
                        total_fare = total_fare - Math.ceil((wheeler_percentage_other/100) * total_fare)
                    }
                }
                total_fare = total_fare > base_fare ? total_fare : base_fare
                // //console.log(total_fare)
            }
            
            if(reqBody.both_loading_unloading_charge_applicable) {
                loading_charge = loading_charge + return_rate_data.loading_unloading
            } else {
                if(reqBody.loading_charge_applicable) {
                    loading_charge = loading_charge + return_rate_data.loading
                }
                if(reqBody.unloading_charge_applicable) {
                    loading_charge = loading_charge + return_rate_data.unloading
                }
            }
            estimate_fare_info = estimate_fare_info + ", loading: " + loading_charge + ", rate per km: " + return_rate_data.rate_per_km
            //console.log("return fare ", total_fare)
            total_fare = Math.ceil((80/100) * total_fare)
            total_fare = total_fare > base_fare ? total_fare : base_fare
            estimate_fare_info = estimate_fare_info + ", fare: " + total_fare
            //console.log(full_fare, total_fare)
            full_fare = full_fare + total_fare
            // //console.log(full_fare)
        } else {
            if(tripDistance > this.deamMilesLimit) {
                const dead_miles_price_per_km = customer_company_details ? customer_company_details.dead_miles_price : 14
                // //console.log(customer_company_details.company_name, customer_company_details.dead_miles_price, dead_miles_price_per_km)
                const dead_miles_price = tripDistance * dead_miles_price_per_km
                full_fare = full_fare + dead_miles_price
                estimate_fare_info = estimate_fare_info + ", dead miles fare = " + dead_miles_price
            }
        }
        estimate_fare_info = estimate_fare_info + ", final obj: " + JSON.stringify({total_fare: full_fare, message, loading_charge, toll_charge: final_toll_charge})
        // let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${reqBody.customer_id},%`))}})
        if(customer_company_details && customer_company_details.is_discount_applicable) {
            message = 'Discount applicable on this Booking'
        }
        //console.log("estimate_fare_info")
        //console.log(estimate_fare_info)
        /*if((customer_company_details && !customer_company_details.is_regular) || !customer_company_details) {
            let customerIds = []
            if(!customer_company_details) {
                customerIds.push(reqBody.customer_id)
            } else {
                let cCustomers = customer_company_details.users.split(",")
                cCustomers.pop()
                for(let cId of cCustomers) {
                    customerIds.push(parseInt(cId.substring(1, cId.length)))
                }
            }
            
            const previousBooking = await this.bookingRepository.findOne({where:{customer_id: In(customerIds)}, order: {id: 'DESC'}});
            if(!previousBooking.is_full_payment && previousBooking.waiting_charge) {
                const previousBookings = await this.bookingRepository.find({where:{multi_booking_id: previousBooking.multi_booking_id}});
                for(let booking of previousBookings) {
                    additional_fare += parseInt(booking.waiting_charge != null ? booking.waiting_charge: '0')
                    additional_fare_comments = 'Waiting Charge for Booking: '+booking.id
                }
                
            }
        }*/
        
        return {total_fare: full_fare, message, loading_charge, toll_charge: final_toll_charge, estimate_fare_info, is_regular: (customer_company_details ? customer_company_details.is_regular : false), additional_fare, additional_fare_comments}
    }

    async prepareBookingREqObj(multiBookingId: string): Promise<any> {
        const bookings = await this.bookingRepository.find({where: {multi_booking_id: multiBookingId}});
        let pickups = [], dropoffs = [];
        let pickup_addresses = [], dropoff_addresses = [];
        for(let booking of bookings) {
            if(booking.trip_type && booking.trip_type.toLowerCase() == 'round' && !pickup_addresses.length) {
                pickup_addresses.push({lat: booking.pickup_lat, long: booking.pickup_long})
                dropoff_addresses.push({lat: booking.dropoff_lat, long: booking.dropoff_long})
            }
        }   
        //console.log(dropoff_addresses)
        // pickup_addresses = [...new Set(pickup_addresses)]
        let dropoff_addresses_data = [];
        let pickup_addresses_data = [];
        for(let i=0; i<pickup_addresses.length; i++) {
            let found = false
            for(let j=0; j<pickup_addresses_data.length; j++) {
                if(pickup_addresses[i].lat == pickup_addresses_data[j].lat && pickup_addresses[i].long == pickup_addresses_data[j].long) {
                    found = true
                }
            }
            if(!found) {
                pickup_addresses_data.push(pickup_addresses[i])
            }
        }
        for(let i=0; i<dropoff_addresses.length; i++) {
            let found = false
            for(let j=0; j<dropoff_addresses_data.length; j++) {
                if(dropoff_addresses[i].lat == dropoff_addresses_data[j].lat && dropoff_addresses[i].long == dropoff_addresses_data[j].long) {
                    found = true
                }
            }
            if(!found) {
                dropoff_addresses_data.push(dropoff_addresses[i])
            }
        }
        //console.log(dropoff_addresses_data)
        let reqObj: any = {
            "trip_type": bookings[0].trip_type,
            "customer_id": 1,
            "drop_address":  dropoff_addresses_data,
            "is_vivegam": true,
            "pickup_address":  pickup_addresses_data,
            "vehicle_type": "4wheeler",
            "weight": parseInt(bookings[0].commodity_weight),
            "weight_unit": 12
        }
        let return_fare = 0
        if(bookings[0].trip_type && bookings[0].trip_type.toLocaleLowerCase() == 'round') {

            for(let booking of bookings) {
                if(booking.id != bookings[0].id) {
                    return_fare = parseInt(booking.commodity_weight)
                }
            }
        }
        reqObj['return_weight'] = return_fare
        //console.log(reqObj)
        const fareDetails = await this.getMultiBookingFareNew(reqObj);
        return fareDetails
    }

    async calGenFare(reqBody: any) : Promise<any> {
        let finalData = [];
        let bookingsByMultiId = {}
        let multiBookingIds = [];
        let pickupDate = '2024-06';
        let bookings = await this.bookingRepository.find({where: {reached_pickup: Like(`${pickupDate}%`), trip_type: 'round'}, order:{id: 'ASC'}})
        // let bookings = await this.bookingRepository.find({where: {multi_booking_id: 'lwvkn49a'}, order:{id: 'ASC'}})
        for(let booking of bookings) {
            // //console.log(booking.reached_pickup)
            if(!bookingsByMultiId[booking.multi_booking_id]) {
                bookingsByMultiId[booking.multi_booking_id] = []
                multiBookingIds.push(booking.multi_booking_id)
            }
            bookingsByMultiId[booking.multi_booking_id].push(booking)
        }
        for(let mId of multiBookingIds) {
            //console.log("mId ======= ", mId)
            let fareData = await this.prepareBookingREqObj(mId)
            // //console.log(fareData)
            let estimated_fare = fareData.total_fare ? Math.ceil(fareData.total_fare/bookingsByMultiId[mId].length) : 0
            for(let bkng of bookingsByMultiId[mId]) {
                let b = {bookingId: bkng.id, estimated_fare: estimated_fare}
                //console.log(b)
                finalData.push(b)
            }

        }
        for(let fData of finalData) {
            //console.log(fData)
        }
        return
    }

    /*async standaredRevenueCalculation(reqBody: any): Promise<any> {
        let finalBookings = []
        let pickupDate = reqBody.calc_date
        let calcStatus = true
        let customers = {}
        let bookingWeights = {}
        let bookingCarges = {}
        let driversTrips = {}
        const loadingCharges = {
            both: 200,
            loading: 100,
            unloading: 100
        }
        const splAddresses = await this.splAddressRepo.find({});
        await this.driverTripFareDetails.delete({trip_date: pickupDate})
        const todayCustomersData = await this.bookingRepository.createQueryBuilder('b')
                                            .select('DISTINCT(customer_id)')
                                            .where("reached_pickup like :pickupDate", {pickupDate: `${pickupDate}%`})
                                            .getRawMany()
        // //console.log(todayCustomers)
        const tripInfo = {
            trip_type: 'onward',
            bookings: []
        }
        let finalCustomers = {};
        for(let todayCustomer of todayCustomersData) {
            let customerId = todayCustomer.customer_id
            let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${customerId},%`)), is_regular: true}})
            if(customer_company_details) {
                if(!finalCustomers[customer_company_details.id]) {
                    finalCustomers[customer_company_details.id] = []
                }
                finalCustomers[customer_company_details.id].push(customerId)
            } else {
                if(!finalCustomers[customerId]) {
                    finalCustomers[customerId] = []
                }
                finalCustomers[customerId].push(customerId)
            }
        }
        
        //console.log(finalCustomers);
        let todayCustomers = [];
        for(let cust in finalCustomers) {
            todayCustomers.push(finalCustomers[cust])
        }
        //console.log(todayCustomers)
        for await (let todayCustomer of todayCustomers) {
            const customerId = todayCustomer
            const todayBookings = await this.bookingRepository.find({where: {customer_id: In(customerId), booking_type: IsNull(), reached_pickup: Like(`${pickupDate}%`)}, order: {id: 'ASC'}})
            let bookingIds = []
            for await (let booking of todayBookings) {
                bookingIds.push(booking.id)
                bookingWeights[booking.id] = booking.commodity_weight 
                bookingCarges[booking.id] = {
                    toll: booking.toll_charges,
                    loadingCharge: booking.loading_charge
                }
            }
            // //console.log("bookingIds", todayBookings.length)
            // //console.log(bookingIds)
            if(bookingIds.length) {
                let tourIdsListInfo = await this.tourRouteRepo.createQueryBuilder('t')
                                    .select('DISTINCT(tour_id)')
                                    .where("booking_id IN (:...bookingIds)", {bookingIds: bookingIds})
                                    .orderBy("tour_id", "ASC")
                                    .getRawMany()
                let tourIdsData = []
                for(let tourId of tourIdsListInfo) {
                    tourIdsData.push(tourId.tour_id)
                }
                // let tours = await this.toursEntity.find({where: {id: In(tourIdsData)}, order: {id: 'ASC'}})
                let tours = await this.toursEntity.find({where: {id: In(tourIdsData)}, order: {tour_date: 'ASC', tour_time: 'ASC'}})
                //for( let tourD of tours) {
                //    //console.log(tourD.id)
                //}
                let driverTours = {}
                for(let tourData of tours) {
                    if(!driverTours[tourData.driver_id]) {
                        driverTours[tourData.driver_id] = []
                    }
                    driverTours[tourData.driver_id].push(tourData.id)

                    if(!driversTrips[tourData.driver_id]) {
                        driversTrips[tourData.driver_id] = []
                    }
                    driversTrips[tourData.driver_id].push(tourData.id)
                    
                }
                
                // //console.log("driverTours")
                // //console.log(driverTours)
                for(let driverId in driverTours) {
                    let tourIdsList = driverTours[driverId]
                    let tourIdIndex = 0
                    let firstTourData = {}
                    let customerTrips = []
                    // //console.log(tourIdsList)
                    let isContinue = false
                    for(let tourId of tourIdsList) {
                        if(isContinue) {
                            isContinue = false
                            tourIdIndex++
                            continue
                        }
                        // //console.log("checking for tour id ==== ", tourId)
                        let tourIds = []
                        let tourData = await this.toursEntity.findOneBy({id: tourId})
                        tourIds.push(tourData.id)
                        let firstTourTrip = await this.findReturnTrip(tourIds, bookingIds, parseInt(driverId))
                        // //console.log("first tour trip")
                        // //console.log(firstTourTrip)
                        if(firstTourTrip.trip_type != 'return') {
                            // //console.log("checking next", tourIdIndex)
                            if(tourIdsList[tourIdIndex+1]) {
                                let nexttourData = await this.toursEntity.findOneBy({id: tourIdsList[tourIdIndex + 1]})
                                // //console.log(nexttourData.driver_id + ' == ' + tourData.driver_id)
                                if(nexttourData.driver_id == tourData.driver_id) {
                                    const secondTourTrip = await this.findReturnTrip([nexttourData.id], bookingIds, parseInt(driverId))
                                    // //console.log("second tour trip")
                                    // //console.log(secondTourTrip)
                                    if(secondTourTrip.trip_type != 'return') {
                                        tourIds.push(nexttourData.id)
                                        const nextTourTrip = await this.findReturnTrip(tourIds, bookingIds, parseInt(driverId))
                                        // //console.log("next tour trip")
                                        // //console.log(nextTourTrip.trip_type, tourIds)
                                        if(nextTourTrip.trip_type == 'return') {
                                            customerTrips.push(nextTourTrip)
                                            isContinue = true
                                        }else {
                                            tourIds.pop()
                                            customerTrips.push(firstTourTrip)
                                        }
                                    } else {
                                        customerTrips.push(firstTourTrip)
                                    }
                                } else {
                                    customerTrips.push(firstTourTrip)
                                }
                            } else {
                                customerTrips.push(firstTourTrip)
                            }
                        } else {
                            customerTrips.push(firstTourTrip)
                        }
                        tourIdIndex++
                        // //console.log("----------------------------")
                    }
                    // //console.log(customerId)
                    // //console.log(customerTrips)
                    // //console.log("*****************************************")
                    if(!customers[customerId[0]]) {
                        customers[customerId[0]] = []
                    }
                    customers[customerId[0]].push({driverId: driverId, trips: customerTrips})
                }
            }
            
            // break
            
            
        }
        
        for(let cust in customers) {
            let custId = cust
            let tours = ''
            for(let driverData of customers[cust]) {
                for(let trips of driverData.trips) {
                    try {
                        let i = 0
                        let tripDistance = 0;
                        let total_fare = 0;
                        let points_count = 0
                        let nodes_visit = 0
                        await this.findSameTimeBookings(trips.tourRoute)
                        //console.log("initial trip distance ", tripDistance)
                        //console.log(trips.tourRoute)
                        let bookingId = trips.bookings[0];
                        let bookingData = await this.bookingRepository.findOneBy({id: bookingId});
                        if(bookingData && bookingData.total_distance) {
                            tripDistance = parseInt(bookingData.total_distance)
                            // //console.log("trip distance got from booking ......", bookingId, tripDistance)
                            for(let seq of trips.tourRoute) {
                                if(i == 0) {
                                    nodes_visit++
                                }
                                if(trips.tourRoute[i-1]) {
                                    let dis = await this.euclideanDistance(seq.location.coordinates[1], seq.location.coordinates[0], trips.tourRoute[i-1].location.coordinates[1], trips.tourRoute[i-1].location.coordinates[0])
                                    if(dis > 50) {
                                        nodes_visit++
                                    }
                                }
                                i++
                            }
                        } else {
                            for(let seq of trips.tourRoute) {
                                if(trips.tourRoute[i+1]) {
                                    const dis = await this.calcDeadDistance(seq.location, trips.tourRoute[i+1].location);
                                    tripDistance = tripDistance + dis
                                }
                                if(i == 0) {
                                    nodes_visit++
                                }
                                if(trips.tourRoute[i-1]) {
                                    let dis = await this.euclideanDistance(seq.location.coordinates[1], seq.location.coordinates[0], trips.tourRoute[i-1].location.coordinates[1], trips.tourRoute[i-1].location.coordinates[0])
                                    if(dis > 50) {
                                        nodes_visit++
                                    }
                                }
                                i++
                            }
                        }
                        
                        //console.log("final trip distance ", tripDistance)
                        // let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${custId},%`))}})
                        let customer_company_details = this.defaultRates
                        // //console.log("customer ", custId)
                        // //console.log(customer_company_details)
                        let base_fare = 0
                        // //console.log("route length === ", trips.tourRoute.length)
                        //const pickDropCount = (trips.pickup_count > trips.dropoff_count) ? trips.pickup_count - trips.dropoff_count : trips.dropoff_count - trips.pickup_count; 
                        //points_count = (pickDropCount) + (Math.min(trips.pickup_count, trips.dropoff_count)) - (trips.trip_type == 'return' ? 2 : 1)
                        // //console.log(trips.tour_ids, points_count)
                        // //console.log(points_count, " ====== points count ")
                        // //console.log(trips.pickup_count - trips.dropoff_count)
                        // //console.log(Math.min(trips.pickup_count, trips.dropoff_count))
                        // //console.log(trips.trip_type == 'return' ? 2 : 1)
                        nodes_visit = nodes_visit - 2
                        points_count = nodes_visit - (trips.trip_type == 'return' ? 1 : 0)
                        points_count = (points_count >=0) ? (points_count) : 0
                        // trips.tourRoute ? trips.tourRoute.length : 2
                        
                        let trip_notes = ""
                        let total_trip_weight = 0
                        if(trips.trip_type == 'return' && trips.tour_ids.length > 1) {
                            let tourIdBookings = {}
                            tourIdBookings[trips.tour_ids[0]] = []
                            tourIdBookings[trips.tour_ids[1]] = []
                            trips.tourRoute.map((routD) => {
                                tourIdBookings[routD.tour_id].push(routD.booking_id)
                            })
                            tourIdBookings[trips.tour_ids[0]] = [... new Set(tourIdBookings[trips.tour_ids[0]])]
                            tourIdBookings[trips.tour_ids[1]] = [... new Set(tourIdBookings[trips.tour_ids[1]])]
                            let tour1Weight = 0
                            for(let bookingId of tourIdBookings[trips.tour_ids[0]]) {
                                tour1Weight = tour1Weight + bookingWeights[bookingId]
                            }
                            let tour2Weight = 0
                            for(let bookingId of tourIdBookings[trips.tour_ids[1]]) {
                                tour2Weight = tour2Weight + bookingWeights[bookingId]
                            }
                            total_trip_weight = Math.max(tour1Weight, tour2Weight)
                        } else {
                            // //console.log("-----------------------------------")
                            // //console.log(trips.trip_type)
                            // //console.log(trips.bookings)
                            for(let bookingId of trips.bookings) {
                                total_trip_weight = total_trip_weight + bookingWeights[bookingId]
                            }
                            if(trips.trip_type == 'return') {
                                total_trip_weight = Math.ceil(total_trip_weight/2)
                            }
                        }
                        const rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: 0}, order: {quantity: 'ASC'}})
                        base_fare = rate_data.base_rate
                       
                        
                        tripDistance = Math.round(tripDistance)
                        if(tripDistance <=4 ) {
                            total_fare =  base_fare
                            trip_notes = "base fare= "+ base_fare + ", points= "+ points_count + ", additional point =" + customer_company_details.additional_pickup_charge
                        } else {
                            total_trip_weight = Math.ceil(total_trip_weight)
                            // const rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: 0}, order: {quantity: 'ASC'}})
                            //console.log("trip weight ", total_trip_weight)
                            total_fare = (base_fare ? base_fare : rate_data.base_rate) + ((tripDistance-4) * rate_data.rate_per_km)
                            trip_notes = "base fare= "+ (base_fare ? base_fare : rate_data.base_rate) + ", trip distance = " + (tripDistance-4) + ", rate per km = " + rate_data.rate_per_km + ", points= "+ points_count + ", additional point =" + customer_company_details.additional_pickup_charge
                        }
                        
                        if(trips.trip_type == 'return') {
                            total_fare = total_fare * customer_company_details.return_percentage_value
                            trip_notes = trip_notes + ", total fare = " + total_fare + ", return val = " + customer_company_details.return_percentage_value
                        } else {
                            if(tripDistance > this.deamMilesLimit) {
                                const dead_miles_price_per_km = customer_company_details.dead_miles_price
                                //console.log(customer_company_details.company_name, customer_company_details.dead_miles_price, dead_miles_price_per_km)
                                const dead_miles_price = tripDistance * dead_miles_price_per_km
                                total_fare = total_fare + dead_miles_price
                                trip_notes = trip_notes + ", dead miles fare = " + dead_miles_price
                            }
                        }
                        total_fare = total_fare + (points_count * customer_company_details.additional_pickup_charge)
                        let final_fare = Math.round(total_fare > customer_company_details.min_base_fare ? total_fare : customer_company_details.min_base_fare)
                        let fareDetails = {
                            driver_id: driverData.driverId,
                            tour_ids: trips.tour_ids.join(","),
                            booking_ids: trips.bookings.join(","),
                            total_distance: tripDistance,
                            trip_date: pickupDate,
                            total_fare: final_fare,
                            trip_type: trips.trip_type,
                            customer_id: parseInt(custId),
                            no_points: points_count,
                            trip_weight: total_trip_weight,
                            trip_notes: trip_notes
                        }
                        // //console.log("customer ", custId)
                        // //console.log(customer_company_details)
                        // //console.log(fareDetails)
                        // await this.driverTripFareDetails.save(fareDetails)
                        let bCost = Math.round(final_fare/trips.bookings.length)
                        let bookingCost = bCost > base_fare ? bCost : base_fare
                        
                        let waiting_charge = 0
                        if(customer_company_details.waiting_charge_type == 'T1') {
                            waiting_charge = await this.caliculateT1WaitingCharge(nodes_visit, trips.bookings)
                        } else if(customer_company_details.waiting_charge_type == 'T2') {
                            waiting_charge = await this.caliculateT2WaitingCharge(nodes_visit, trips.bookings, tripDistance)
                        } 
                        let waiting_charge_value = waiting_charge > 0 ? Math.round(waiting_charge/trips.bookings.length) : 0
                        for(let bookingId of trips.bookings) {
                            
                            let isFindData = await this.findSpecialAddress(splAddresses, bookingId);
                            if(isFindData.found) {
                                let bookingCostUpd = bookingCost + isFindData.amount
                                finalBookings.push({bookingId: bookingId, fare: bookingCostUpd})
                            } else {
                                finalBookings.push({bookingId: bookingId, fare: bookingCost})
                            }
                            
                        }
                    } catch(e) {
                        //console.log("problem in cal ", e)
                    }
                    
                    // csv = csv + `${custId},${driverData.driverId},${trips.tour_ids.join("-")},${trips.bookings.join("-")},${trips.trip_type}\n`;
                }
            }
            
        }
        
        return finalBookings
    } */

    async standaredRevenueCalculation(reqBody: any): Promise<any> {
        let finalBookings = []
        let finalNewBookings = []
        let pickupDate = reqBody.calc_date
        let calcStatus = true
        let customers = {}
        let bookingWeights = {}
        let bookingCarges = {}
        let driversTrips = {}
        const loadingCharges = {
            both: 200,
            loading: 100,
            unloading: 100
        }
        const splAddresses = await this.splAddressRepo.find({});
        // await this.driverTripFareDetails.delete({trip_date: pickupDate})
        // const todayCustomersData = await this.bookingRepository.createQueryBuilder('b')
        //                                     .select('DISTINCT(customer_id)')
        //                                     .where("reached_pickup like :pickupDate", {pickupDate: `${pickupDate}%`})
        //                                     .getRawMany()
        // //console.log(todayCustomers)
        const tripInfo = {
            trip_type: 'onward',
            bookings: []
        }
        let todayCustomersData = []
        // let customer_ids = [887,390,389,391,392,399,400,402,425,651,403,409,396,538,537,740,835,876,888]
        let customer_ids = [449, 705]
        for(let cId of customer_ids) {
            todayCustomersData.push({customer_id: cId})
        }
        // const todayCustomersData = []
        let finalCustomers = {};
        for(let todayCustomer of todayCustomersData) {
            let customerId = todayCustomer.customer_id
            let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${customerId},%`)), is_regular: true}})
            if(customer_company_details) {
                if(!finalCustomers[customer_company_details.id]) {
                    finalCustomers[customer_company_details.id] = []
                }
                finalCustomers[customer_company_details.id].push(customerId)
            } else {
                if(!finalCustomers[customerId]) {
                    finalCustomers[customerId] = []
                }
                finalCustomers[customerId].push(customerId)
            }
        }
        
        //console.log(finalCustomers);
        let todayCustomers = [];
        for(let cust in finalCustomers) {
            todayCustomers.push(finalCustomers[cust])
        }
        
        //console.log(todayCustomers)
        for await (let todayCustomer of todayCustomers) {
            const customerId = todayCustomer
            const todayBookings = await this.bookingRepository.find({where: {customer_id: In(customerId), booking_type: IsNull(), reached_pickup: Like(`${pickupDate}%`)}, order: {id: 'ASC'}})
            let bookingIds = []
            for await (let booking of todayBookings) {
                bookingIds.push(booking.id)
                bookingWeights[booking.id] = booking.commodity_weight 
                bookingCarges[booking.id] = {
                    toll: booking.toll_charges,
                    loadingCharge: booking.loading_charge
                }
            }
            // //console.log("bookingIds", todayBookings.length)
            // //console.log(bookingIds)
            if(bookingIds.length) {
                let tourIdsListInfo = await this.tourRouteRepo.createQueryBuilder('t')
                                    .select('DISTINCT(tour_id)')
                                    .where("booking_id IN (:...bookingIds)", {bookingIds: bookingIds})
                                    .orderBy("tour_id", "ASC")
                                    .getRawMany()
                let tourIdsData = []
                for(let tourId of tourIdsListInfo) {
                    tourIdsData.push(tourId.tour_id)
                }
                // let tours = await this.toursEntity.find({where: {id: In(tourIdsData)}, order: {id: 'ASC'}})
                let tours = await this.toursEntity.find({where: {id: In(tourIdsData)}, order: {tour_date: 'ASC', tour_time: 'ASC'}})
                //for( let tourD of tours) {
                //    //console.log(tourD.id)
                //}
                let driverTours = {}
                for(let tourData of tours) {
                    if(!driverTours[tourData.driver_id]) {
                        driverTours[tourData.driver_id] = []
                    }
                    driverTours[tourData.driver_id].push(tourData.id)

                    if(!driversTrips[tourData.driver_id]) {
                        driversTrips[tourData.driver_id] = []
                    }
                    driversTrips[tourData.driver_id].push(tourData.id)
                    
                }
                
                // //console.log("driverTours")
                // //console.log(driverTours)
                for(let driverId in driverTours) {
                    let tourIdsList = driverTours[driverId]
                    let tourIdIndex = 0
                    let firstTourData = {}
                    let customerTrips = []
                    // //console.log(tourIdsList)
                    let isContinue = false
                    for(let tourId of tourIdsList) {
                        if(isContinue) {
                            isContinue = false
                            tourIdIndex++
                            continue
                        }
                        // //console.log("checking for tour id ==== ", tourId)
                        let tourIds = []
                        let tourData = await this.toursEntity.findOneBy({id: tourId})
                        tourIds.push(tourData.id)
                        let firstTourTrip = await this.findReturnTrip(tourIds, bookingIds, parseInt(driverId))
                        // //console.log("first tour trip")
                        // //console.log(firstTourTrip)
                        if(firstTourTrip.trip_type != 'return') {
                            // //console.log("checking next", tourIdIndex)
                            if(tourIdsList[tourIdIndex+1]) {
                                let nexttourData = await this.toursEntity.findOneBy({id: tourIdsList[tourIdIndex + 1]})
                                // //console.log(nexttourData.driver_id + ' == ' + tourData.driver_id)
                                if(nexttourData.driver_id == tourData.driver_id) {
                                    const secondTourTrip = await this.findReturnTrip([nexttourData.id], bookingIds, parseInt(driverId))
                                    // //console.log("second tour trip")
                                    // //console.log(secondTourTrip)
                                    if(secondTourTrip.trip_type != 'return') {
                                        tourIds.push(nexttourData.id)
                                        const nextTourTrip = await this.findReturnTrip(tourIds, bookingIds, parseInt(driverId))
                                        // //console.log("next tour trip")
                                        // //console.log(nextTourTrip.trip_type, tourIds)
                                        if(nextTourTrip.trip_type == 'return') {
                                            customerTrips.push(nextTourTrip)
                                            isContinue = true
                                        }else {
                                            tourIds.pop()
                                            customerTrips.push(firstTourTrip)
                                        }
                                    } else {
                                        customerTrips.push(firstTourTrip)
                                    }
                                } else {
                                    customerTrips.push(firstTourTrip)
                                }
                            } else {
                                customerTrips.push(firstTourTrip)
                            }
                        } else {
                            customerTrips.push(firstTourTrip)
                        }
                        tourIdIndex++
                        // //console.log("----------------------------")
                    }
                    // //console.log(customerId)
                    // //console.log(customerTrips)
                    // //console.log("*****************************************")
                    if(!customers[customerId[0]]) {
                        customers[customerId[0]] = []
                    }
                    customers[customerId[0]].push({driverId: driverId, trips: customerTrips})
                }
            }
            
            // break
            
            
        }
        
        for(let cust in customers) {
            let custId = cust
            let tours = ''
            for(let driverData of customers[cust]) {
                for(let trips of driverData.trips) {
                    try {
                        let i = 0
                        let tripDistance = 0;
                        let total_fare = 0;
                        let points_count = 0
                        let nodes_visit = 0
                        await this.findSameTimeBookings(trips.tourRoute)
                        //console.log("initial trip distance ", tripDistance)
                        //console.log(trips.tourRoute)
                        let bookingId = trips.bookings[0];
                        let bookingData = await this.bookingRepository.findOneBy({id: bookingId});
                        if(bookingData && bookingData.total_distance) {
                            tripDistance = parseInt(bookingData.total_distance)
                            // //console.log("trip distance got from booking ......", bookingId, tripDistance)
                            for(let seq of trips.tourRoute) {
                                if(i == 0) {
                                    nodes_visit++
                                }
                                if(trips.tourRoute[i-1]) {
                                    let dis = await this.euclideanDistance(seq.location.coordinates[1], seq.location.coordinates[0], trips.tourRoute[i-1].location.coordinates[1], trips.tourRoute[i-1].location.coordinates[0])
                                    if(dis > 50) {
                                        nodes_visit++
                                    }
                                }
                                i++
                            }
                        } else {
                            for(let seq of trips.tourRoute) {
                                if(trips.tourRoute[i+1]) {
                                    const dis = await this.calcDeadDistance(seq.location, trips.tourRoute[i+1].location);
                                    tripDistance = tripDistance + dis
                                }
                                if(i == 0) {
                                    nodes_visit++
                                }
                                if(trips.tourRoute[i-1]) {
                                    let dis = await this.euclideanDistance(seq.location.coordinates[1], seq.location.coordinates[0], trips.tourRoute[i-1].location.coordinates[1], trips.tourRoute[i-1].location.coordinates[0])
                                    if(dis > 50) {
                                        nodes_visit++
                                    }
                                }
                                i++
                            }
                        }
                        
                        //console.log("final trip distance ", tripDistance)
                        let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${custId},%`))}})
                        // //console.log("customer ", custId)
                        // //console.log(customer_company_details)
                        let base_fare = 0
                        nodes_visit = nodes_visit - 2
                        points_count = nodes_visit - (trips.trip_type == 'return' ? 1 : 0)
                        points_count = (points_count >=0) ? (points_count) : 0
                        // trips.tourRoute ? trips.tourRoute.length : 2
                        
                        let trip_notes = ""
                        let total_trip_weight = 0
                        if(trips.trip_type == 'return' && trips.tour_ids.length > 1) {
                            let tourIdBookings = {}
                            tourIdBookings[trips.tour_ids[0]] = []
                            tourIdBookings[trips.tour_ids[1]] = []
                            trips.tourRoute.map((routD) => {
                                tourIdBookings[routD.tour_id].push(routD.booking_id)
                            })
                            tourIdBookings[trips.tour_ids[0]] = [... new Set(tourIdBookings[trips.tour_ids[0]])]
                            tourIdBookings[trips.tour_ids[1]] = [... new Set(tourIdBookings[trips.tour_ids[1]])]
                            let tour1Weight = 0
                            for(let bookingId of tourIdBookings[trips.tour_ids[0]]) {
                                tour1Weight = tour1Weight + bookingWeights[bookingId]
                            }
                            let tour2Weight = 0
                            for(let bookingId of tourIdBookings[trips.tour_ids[1]]) {
                                tour2Weight = tour2Weight + bookingWeights[bookingId]
                            }
                            total_trip_weight = Math.max(tour1Weight, tour2Weight)
                        } else {
                            // //console.log("-----------------------------------")
                            // //console.log(trips.trip_type)
                            // //console.log(trips.bookings)
                            for(let bookingId of trips.bookings) {
                                total_trip_weight = total_trip_weight + bookingWeights[bookingId]
                            }
                            if(trips.trip_type == 'return') {
                                total_trip_weight = Math.ceil(total_trip_weight/2)
                            }
                        }
                        const rate_data = await this.getGMRates(total_trip_weight, customer_company_details ? customer_company_details.id : 0)
                        // const rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: customer_company_details ? customer_company_details.id : 0}, order: {quantity: 'ASC'}})
                        
                        if(!customer_company_details) {
                            customer_company_details = this.defaultRates
                        }
                        
                        let baseFareCompaniesList = this.baseFareCompanies.split(",")
                        
                        if(baseFareCompaniesList.indexOf(customer_company_details.id.toString()) > -1) {
                            base_fare = customer_company_details.min_base_fare
                        } else {
                            base_fare = rate_data.base_rate
                        }
                        
                        
                        tripDistance = Math.round(tripDistance)
                        if(tripDistance <=4 ) {
                            total_fare =  base_fare
                            trip_notes = "base fare= "+ base_fare + ", points= "+ points_count + ", additional point =" + customer_company_details.additional_pickup_charge
                        } else {
                            total_trip_weight = Math.ceil(total_trip_weight)
                            // const rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: 0}, order: {quantity: 'ASC'}})
                            //console.log("trip weight ", total_trip_weight)
                            total_fare = (base_fare ? base_fare : rate_data.base_rate) + ((tripDistance-4) * rate_data.rate_per_km)
                            trip_notes = "base fare= "+ (base_fare ? base_fare : rate_data.base_rate) + ", trip distance = " + (tripDistance-4) + ", rate per km = " + rate_data.rate_per_km + ", points= "+ points_count + ", additional point =" + customer_company_details.additional_pickup_charge
                        }
                        
                        if(trips.trip_type == 'return') {
                            total_fare = total_fare * customer_company_details.return_percentage_value
                            trip_notes = trip_notes + ", total fare = " + total_fare + ", return val = " + customer_company_details.return_percentage_value
                        } else {
                            if(tripDistance > this.deamMilesLimit) {
                                const dead_miles_price_per_km = customer_company_details.dead_miles_price
                                //console.log(customer_company_details.company_name, customer_company_details.dead_miles_price, dead_miles_price_per_km)
                                const dead_miles_price = tripDistance * dead_miles_price_per_km
                                total_fare = total_fare + dead_miles_price
                                trip_notes = trip_notes + ", dead miles fare = " + dead_miles_price
                            }
                        }
                        total_fare = total_fare + (points_count * customer_company_details.additional_pickup_charge)
                        let final_fare = Math.round(total_fare > customer_company_details.min_base_fare ? total_fare : customer_company_details.min_base_fare)
                        let fareDetails = {
                            driver_id: driverData.driverId,
                            tour_ids: trips.tour_ids.join(","),
                            booking_ids: trips.bookings.join(","),
                            total_distance: tripDistance,
                            trip_date: pickupDate,
                            total_fare: final_fare,
                            trip_type: trips.trip_type,
                            customer_id: parseInt(custId),
                            no_points: points_count,
                            trip_weight: total_trip_weight,
                            trip_notes: trip_notes
                        }
                        // //console.log("customer ", custId)
                        // //console.log(customer_company_details)
                        //console.log("fareDetails")
                        // console.log(fareDetails)
                        // await this.driverTripFareDetails.save(fareDetails)
                        let bCost = Math.round(final_fare/trips.bookings.length)
                        let bookingCost = bCost > base_fare ? bCost : base_fare
                        
                        let waiting_charge = 0
                        if(customer_company_details.waiting_charge_type == 'T1') {
                            waiting_charge = await this.caliculateT1WaitingCharge(nodes_visit, trips.bookings)
                        } else if(customer_company_details.waiting_charge_type == 'T2') {
                            waiting_charge = await this.caliculateT2WaitingCharge(nodes_visit, trips.bookings, tripDistance)
                        } 
                        let waiting_charge_value = waiting_charge > 0 ? Math.round(waiting_charge/trips.bookings.length) : 0
                        for(let bookingId of trips.bookings) {
                            let isFindData = await this.findSpecialAddress(splAddresses, bookingId);
                            // console.log(isFindData)
                            // console.log(bookingId)
                            if(isFindData.found) {
                                let bookingCostUpd = bookingCost + isFindData.amount
                                //console.log(bookingId)
                                finalBookings.push({bookingId: bookingId, estimated_fare: bookingCostUpd})
                                // await this.bookingRepository.update({id: bookingId}, {fare: bookingCostUpd.toString(), waiting_charge: waiting_charge_value.toString(), total_distance: tripDistance.toString()})
                            } else {
                                finalBookings.push({bookingId: bookingId, estimated_fare: bookingCost})
                                // await this.bookingRepository.update({id: bookingId}, {fare: bookingCost.toString(), waiting_charge: waiting_charge_value.toString(), total_distance: tripDistance.toString()})
                            }
                            
                        }
                    } catch(e) {
                        //console.log("problem in cal ", e)
                    }
                    
                }
                let b = await this.checkDailyFareForDriverCustomerStandared(driverData.trips, finalBookings)
                if(b) {
                    // console.log("updated booking values .......")
                    // console.log(b)
                    for (let item1 of finalBookings) {
                        let matchingItem = b.find(item2 => item2.id === item1.bookingId);
                        item1.new_fare = matchingItem.fare;
                    }
                }
            }
            
        }
        return finalBookings
        
    } 

    async checkDailyFareForDriverCustomerStandared(trips, finalBookingsData) {
        // console.log("trips")
        // console.log(trips)
        let newFare = []
        let dayTotalCost = 2900
        let perKmAbove100 = 15
        let totalDistance = 0
        let totalPrice = 0
        let finalBookings = []
        // console.log(trips)
        for(let trip of trips) {
            let booking = await this.bookingRepository.findOneBy({id: trip.bookings[0]})
            totalDistance = totalDistance + parseInt(booking.total_distance)
            finalBookings = finalBookings.concat(trip.bookings)
        }
        let [items, count] = await this.bookingRepository.findAndCount({where: {id: In(finalBookings)}});
        for(let booking of items) {
            // totalPrice = totalPrice + parseInt(booking.fare)
            let matchingItem = finalBookingsData.find(item2 => item2.bookingId === booking.id);
            totalPrice = totalPrice + parseInt(matchingItem.estimated_fare)
            // console.log(booking.id, booking.fare, matchingItem.estimated_fare)
        }
       
        // console.log(totalPrice + " --- " + dayTotalCost, totalDistance)
        if(totalPrice > dayTotalCost) {
            totalPrice = dayTotalCost
            if(totalDistance > 100) {
                let prc = perKmAbove100 * (totalDistance - 100 )
                totalPrice = totalPrice + prc
            }
            // console.log("totalPrice")
            // console.log(totalPrice)
            let bookingPrice = Math.ceil(totalPrice / count)
            for(let booking of items) {
                // await this.bookingRepository.update({id: booking.id}, {fare: bookingPrice.toString()})
                newFare.push({id: booking.id, fare: bookingPrice})
            }
            return newFare
        }
        return false
    }
    
    async standaredRevenueCalculationDateRange(reqBody: any): Promise<any> {
        let finalBookings = []
        let dates = []
        let fromDate = new Date(reqBody.from_date);
        let toDate = new Date(reqBody.to_date);
        for (let day = fromDate; day <= toDate; day.setDate(day.getDate() + 1)) {
            let calc_date = moment(day).format('YYYY-MM-DD')
            dates.push(calc_date)
        }
        for (let calc_date of dates) {
            let bookings = await this.standaredRevenueCalculation({calc_date})
            console.log(calc_date)
            console.log(bookings)
            finalBookings = [...finalBookings, bookings]
        }
        //console.log("final bookings are ")
        for(let booking of finalBookings) {
            // console.log(booking)
        }
        console.log("job done!")
        return true

    }

    async waitingChargeNotesUpdatesManual(reqBody: any): Promise<any> {
        let pickupDate = reqBody.calc_date
        let calcStatus = true
        let customers = {}
        let bookingWeights = {}
        let bookingCarges = {}
        let driversTrips = {}
        const loadingCharges = {
            both: 200,
            loading: 100,
            unloading: 100
        }
        const splAddresses = await this.splAddressRepo.find({});
        const splCompanyIds = [4];
        // let customerWiseBookings = {};
        const todayCustomersData = await this.bookingRepository.createQueryBuilder('b')
                                            .select('DISTINCT(customer_id)')
                                            .where("reached_pickup like :pickupDate", {pickupDate: `${pickupDate}%`})
                                            .getRawMany()
        // //console.log(todayCustomers)
        const tripInfo = {
            trip_type: 'onward',
            bookings: []
        }
        let finalCustomers = {};
        for(let todayCustomer of todayCustomersData) {
            let customerId = todayCustomer.customer_id
            let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${customerId},%`)), is_regular: true}})
            if(customer_company_details) {
                if(!finalCustomers[customer_company_details.id]) {
                    finalCustomers[customer_company_details.id] = []
                }
                finalCustomers[customer_company_details.id].push(customerId)
            } else {
                if(!finalCustomers[customerId]) {
                    finalCustomers[customerId] = []
                }
                finalCustomers[customerId].push(customerId)
            }
        }
        
        //console.log(finalCustomers);
        let todayCustomers = [];
        for(let cust in finalCustomers) {
            todayCustomers.push(finalCustomers[cust])
        }
        //console.log(todayCustomers)
        for await (let todayCustomer of todayCustomers) {
            const customerId = todayCustomer
            const todayBookings = await this.bookingRepository.find({where: {customer_id: In(customerId), booking_type: IsNull(), reached_pickup: Like(`${pickupDate}%`)}, order: {id: 'ASC'}})
            let bookingIds = []
            for await (let booking of todayBookings) {
                bookingIds.push(booking.id)
                bookingWeights[booking.id] = booking.commodity_weight 
                bookingCarges[booking.id] = {
                    toll: booking.toll_charges,
                    loadingCharge: booking.loading_charge
                }
            }
            // customerWiseBookings[customerId[0]] = bookingIds
            // //console.log("bookingIds", todayBookings.length)
            // //console.log(bookingIds)
            
            if(bookingIds.length) {
                let tourIdsListInfo = await this.tourRouteRepo.createQueryBuilder('t')
                                    .select('DISTINCT(tour_id)')
                                    .where("booking_id IN (:...bookingIds)", {bookingIds: bookingIds})
                                    .orderBy("tour_id", "ASC")
                                    .getRawMany()
                let tourIdsData = []
                for(let tourId of tourIdsListInfo) {
                    tourIdsData.push(tourId.tour_id)
                }
                // let tours = await this.toursEntity.find({where: {id: In(tourIdsData)}, order: {id: 'ASC'}})
                let tours = await this.toursEntity.find({where: {id: In(tourIdsData)}, order: {tour_date: 'ASC', tour_time: 'ASC'}})
                //for( let tourD of tours) {
                //    //console.log(tourD.id)
                //}
                let driverTours = {}
                for(let tourData of tours) {
                    if(!driverTours[tourData.driver_id]) {
                        driverTours[tourData.driver_id] = []
                    }
                    driverTours[tourData.driver_id].push(tourData.id)

                    if(!driversTrips[tourData.driver_id]) {
                        driversTrips[tourData.driver_id] = []
                    }
                    driversTrips[tourData.driver_id].push(tourData.id)
                    
                }
                
                // //console.log("driverTours")
                // //console.log(driverTours)
                for(let driverId in driverTours) {
                    let tourIdsList = driverTours[driverId]
                    let tourIdIndex = 0
                    let firstTourData = {}
                    let customerTrips = []
                    // //console.log(tourIdsList)
                    let isContinue = false
                    for(let tourId of tourIdsList) {
                        if(isContinue) {
                            isContinue = false
                            tourIdIndex++
                            continue
                        }
                        // //console.log("checking for tour id ==== ", tourId)
                        let tourIds = []
                        let tourData = await this.toursEntity.findOneBy({id: tourId})
                        tourIds.push(tourData.id)
                        let firstTourTrip = await this.findReturnTrip(tourIds, bookingIds, parseInt(driverId))
                        // //console.log("first tour trip")
                        // //console.log(firstTourTrip)
                        if(firstTourTrip.trip_type != 'return') {
                            // //console.log("checking next", tourIdIndex)
                            if(tourIdsList[tourIdIndex+1]) {
                                let nexttourData = await this.toursEntity.findOneBy({id: tourIdsList[tourIdIndex + 1]})
                                // //console.log(nexttourData.driver_id + ' == ' + tourData.driver_id)
                                if(nexttourData.driver_id == tourData.driver_id) {
                                    const secondTourTrip = await this.findReturnTrip([nexttourData.id], bookingIds, parseInt(driverId))
                                    // //console.log("second tour trip")
                                    // //console.log(secondTourTrip)
                                    if(secondTourTrip.trip_type != 'return') {
                                        tourIds.push(nexttourData.id)
                                        const nextTourTrip = await this.findReturnTrip(tourIds, bookingIds, parseInt(driverId))
                                        // //console.log("next tour trip")
                                        // //console.log(nextTourTrip.trip_type, tourIds)
                                        if(nextTourTrip.trip_type == 'return') {
                                            customerTrips.push(nextTourTrip)
                                            isContinue = true
                                        }else {
                                            tourIds.pop()
                                            customerTrips.push(firstTourTrip)
                                        }
                                    } else {
                                        customerTrips.push(firstTourTrip)
                                    }
                                } else {
                                    customerTrips.push(firstTourTrip)
                                }
                            } else {
                                customerTrips.push(firstTourTrip)
                            }
                        } else {
                            customerTrips.push(firstTourTrip)
                        }
                        tourIdIndex++
                        // //console.log("----------------------------")
                    }
                    if(!customers[customerId[0]]) {
                        customers[customerId[0]] = []
                    }
                    customers[customerId[0]].push({driverId: driverId, trips: customerTrips})
                }
            }
            
            // break
            
            
        }
        
        for(let cust in customers) {
            let custId = cust
            let tours = ''
            let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${custId},%`))}})
            
            for(let driverData of customers[cust]) {
                for(let trips of driverData.trips) {
                    try {
                        let i = 0
                        let tripDistance = 0;
                        let total_fare = 0;
                        let points_count = 0
                        let nodes_visit = 0
                        let bookingId = trips.bookings[0];
                        let bookingData = await this.bookingRepository.findOneBy({id: bookingId});
                        if(bookingData && bookingData.total_distance) {
                            tripDistance = parseInt(bookingData.total_distance)
                            for(let seq of trips.tourRoute) {
                                if(i == 0) {
                                    nodes_visit++
                                }
                                if(trips.tourRoute[i-1]) {
                                    let dis = await this.euclideanDistance(seq.location.coordinates[1], seq.location.coordinates[0], trips.tourRoute[i-1].location.coordinates[1], trips.tourRoute[i-1].location.coordinates[0])
                                    if(dis > 50) {
                                        nodes_visit++
                                    }
                                }
                                i++
                            }
                        } else {
                            for(let seq of trips.tourRoute) {
                                if(trips.tourRoute[i+1]) {
                                    const dis = await this.calcDeadDistance(seq.location, trips.tourRoute[i+1].location);
                                    tripDistance = tripDistance + dis
                                }
                                if(i == 0) {
                                    nodes_visit++
                                }
                                if(trips.tourRoute[i-1]) {
                                    let dis = await this.euclideanDistance(seq.location.coordinates[1], seq.location.coordinates[0], trips.tourRoute[i-1].location.coordinates[1], trips.tourRoute[i-1].location.coordinates[0])
                                    if(dis > 50) {
                                        nodes_visit++
                                    }
                                }
                                i++
                            }
                        }
                        
                        let base_fare = 0
                        let tripNodesCount = nodes_visit
                        nodes_visit = nodes_visit - 2
                        points_count = nodes_visit - (trips.trip_type == 'return' ? 1 : 0)
                        points_count = (points_count >=0) ? (points_count) : 0
                        
                        
                        if(!customer_company_details) {
                            customer_company_details = this.defaultRates
                        }
                        
                        
                        
                        let waiting_charge = 0
                        console.log(trips.bookings)
                        console.log(trips.tour_ids)
                        console.log("------------------")
                        if(customer_company_details.waiting_charge_type == 'T1') {
                            console.log("calling ", trips.bookings)
                            waiting_charge = await this.caliculateT1WaitingCharge(nodes_visit, trips.bookings, trips.tour_ids)
                        } else if(customer_company_details.waiting_charge_type == 'T2') {
                            console.log("calling T2 ", trips.bookings)
                            waiting_charge = await this.caliculateT2WaitingCharge(nodes_visit, trips.bookings, tripDistance, trips.tour_ids)
                        } 
                        
                    } catch(e) {
                        //console.log("problem in cal ", e)
                    }
                    
                }
                
            }
            
            
            
        }
        
        return calcStatus
    } 

    async compareBookingDistance(): Promise<any> {
        const reportFileName= './public/compare_distances_1.csv';
        const headerData = ['Booking id', 'Google Distance', 'OSRM Disstance']
        let allBookings = ""
        for(let i=0; i<headerData.length; i++){
            allBookings += headerData[i] + ","
        }
        allBookings += '\n'
        
        const mIds = ["mfxyubcz","mfxygcme","mfxyg4vu","mfxxxusy","mfxxmk8a","mfxxg2ij","mfxxf0et","mfxx2mgu","mfxx2mgu","mfxwqv6m","mfxwl9n0","mfxwfwjt","mfxwezby","mfxweuma","mfxwdssp","mfxw63xb","mfxw2f7y","mfxvgy1z","mfxvd3oi","mfxv7zeh","mfxv7ln5","mfxv4gjp","mfxv0kkj","mfxu8scz","mfxu7luc","mfxtheke","mfxt0tji","mfxsnvbf","mfxsm2zm","mfxs295a","mfxs0x07","mfxs0x07","mfxryjt5","mfxruelz","mfxrauot","mfxr4ep5","mfxr4ep5","mfxr4ep5","mfxr4ep5","mfxqup7j","mfxqqpwf","mfxqix3j","mfxqix3j","mfxqig49","mfxqe8ls","mfxq5g4l","mfxq5g4l","mfxq36ly","mfxpuar4","mfxps0gh","mfxpb79a","mfxpb79a","mfxpb79a","mfxpb79a","mfxp3mks","mfxp2idc","mfxmtu8t","mfxmjjda","mfxmi8lm","mfxmhk8z","mfxmfiu9","mfxlxt8x","mfxlxt8x","mfxlp22h","mfxldshg","mfxkpg3u","mfxkpee9","mfxkfayl","mfxkaa4r","mfxk4eho","mfxk0yus","mfxjy2u8","mfxjkygu","mfxjgcc7","mfxj5yzy","mfxj5yzy","mfxj5yzy","mfxj4itl","mfxj3jx1","mfxj3jx1","mfxj3jx1","mfxj3jx1","mfxj3jx1","mfxj3jx1","mfxj229j","mfximdtd","mfximdtd","mfximb1x","mfxil8t1","mfxh387w","mfxh07x0","mfxgxyxr","mfxgxyxr","mfxgxhw8","mfxgvfcn","mfxgliu0","mfxgbwvu","mfxgbwvu","mfxfvwe3","mfxfvexf","mfxfu7xy","mfxfszzr","mfwk6b1d","mfwhr3zx","mfwha6rc","mfwh99xo","mfwgt3hr","mfwgt3hr","mfwgjbxp","mfwg02hb","mfwfu5vn","mfwfl1o8","mfwf1h51","mfweem2a","mfwednit","mfwe2p11","mfwe1d6n","mfwdomil","mfwdomil","mfwdomil","mfwczz6v","mfwcu3hf","mfwcapby","mfwbp0xb","mfwblv4s","mfwblv4s","mfwb69cf","mfwb0m05","mfwb0m05","mfwaemcq","mfwa4icj","mfw9m9hz","mfw9hkwu","mfw9gfyx","mfw914ok","mfw8munm","mfw8m72y","mfw8fljx","mfw85y6b","mfw75akv","mfw73mif","mfw6u4to","mfw6tsqy","mfw5uvm2","mfw5n8zi","mfw56q0i","mfw4sjgf","mfw4sjgf","mfw4rvlf","mfw4idm6","mfw4hanj","mfw4dj80","mfw3yqbd","mfw3rzs8","mfw3p507","mfw3dkb3","mfw3dkb3","mfw2gt60","mfw2cepu","mfw28blp","mfw262xq","mfw2513s","mfw237tr","mfw1sl7h","mfw1q340","mfw1q340","mfw1lhox","mfw1lhox","mfw1lhox","mfw1lhox","mfw1guhy","mfw1guhy","mfw1guhy","mfw1guhy","mfw1guhy","mfw1ff1f","mfw1852u","mfw0uqh9","mfw01ncg","mfvzztpl","mfv54rv2","mfv3p8q4","mfv3ihsp","mfv3hi4r","mfv2uf30","mfv26paf","mfv24a80","mfv1vo6n","mfv1vo6n","mfv1vo6n","mfv1nbv3","mfv1i7gb","mfv17vkr","mfv06qaz","mfuzzr49","mfuzyzug","mfuzy8gc","mfuzxgh3","mfuzg4er","mfuxwamd"];
        // const mIds = ["mfw28blp"]
        for(let mId of mIds) {
            let bookingString = ""
            let booking = await this.bookingRepository.findOneBy({multi_booking_id: mId})

            let gtripDistance = 0;
            const gdData = await this.utilsService.getMinDistance({lat: booking.pickup_lat, long: booking.pickup_long}, {lat: booking.dropoff_lat, long: booking.dropoff_long})
            if(gdData.status == 'OK' && gdData.routes.length) {
                let gtotalDistance = (gdData.routes[0].legs && gdData.routes[0].legs.length) ? gdData.routes[0].legs[0].distance.value : 0
                for(let route of gdData.routes) {
                    //console.log(route.legs[0].distance, "----")
                    if(route.legs.length) {
                        gtotalDistance = (gtotalDistance > route.legs[0].distance.value) ? route.legs[0].distance.value : gtotalDistance
                    }
                }
                if(gtotalDistance > 0) {
                    gtripDistance = (gtotalDistance/1000)
                }
            }
            // console.log({lat: booking.pickup_lat, long: booking.pickup_long}, {lat: booking.dropoff_lat, long: booking.dropoff_long})
            const dData = await this.utilsService.getDistanceFromGOOSM({lat: booking.pickup_lat, long: booking.pickup_long}, {lat: booking.dropoff_lat, long: booking.dropoff_long})
            // console.log(dData)
            let tripDistance = 0
            if(dData.code == 'Ok') {
                let totalDistance = dData.routes[0].distance
                if(totalDistance) {
                    tripDistance = (totalDistance/1000)
                }
            } else {
                //console.log("getting wrong")
            }
            // const wData = await this.utilsService.getWaypointsFromGOOSRM({lat: booking.pickup_lat, long: booking.pickup_long}, {lat: booking.dropoff_lat, long: booking.dropoff_long})
            // console.log(JSON.stringify(wData))
            
            console.log(booking.multi_booking_id, booking.id, gtripDistance, tripDistance)
            bookingString = booking.id + "," + gtripDistance + "," + tripDistance + "\n"
            allBookings = allBookings + bookingString
        }
        
        await fs.writeFileSync(reportFileName, allBookings, 'utf8')
        return true
    }

    async getDriverLatestLoc(driver_id: number): Promise<any> {
        let latestLocId = await this.locationsRepo
            .createQueryBuilder('go_locations')
            .where('user_id =:user_id', {user_id: driver_id})
            .select(['max(id) as id'])
            .groupBy("user_id")
            .getRawMany();
        if(latestLocId.length) {
            let locData = await this.locationsRepo.findOneBy({id: latestLocId[0].id})
            return locData
        } else {
            return null
        }
    }

    async getDriverLocByTime(driver_id: number, driverTime: string): Promise<any> {
        let latestLoc = await this.locationsRepo.findOne({where:{user_id: driver_id, loc_time: MoreThanOrEqual(driverTime)}, order: {loc_time: 'ASC'}});
       return latestLoc
    }
    
    async findTourDistancesByTourIds(): Promise<any> {
        let TourIds = [
            122056,
            122310,
            122425,
            122344,
            122315,
            122573,
            122575,
            122444,
            122706,
            122635,
            122744,
            122627,
            122725,
            122751,
            122790,
            122794,
            122917,
            122763,
            122806,
            123085,
            123019,
            123023,
            122953,
            123097,
            122969,
            123048,
            123170,
            123187,
            123445,
            123560,
            123771,
            123683,
            123759,
            123767,
            123693,
            123784,
            123812,
            123802,
            123834,
            123836,
            123824,
            123905,
            123977,
            123982,
            123976,
            124066,
            124090,
            124149,
            124153,
            124214,
            124394,
            124503,
            124477,
            124491
        ]
        for(let tourId of TourIds) {
            let distance = await this.calcTourDistance(tourId)
            // console.log(tourId, distance)
            const tourData = await this.toursEntity.findOneBy({id: tourId})
            // console.log(tourData.tour_date)
            const tomorrow = new Date(tourData.tour_date); // Gets today's date and time
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tmr = moment(tomorrow).format('YYYY-MM-DD')
            
            const qry_str = `select * from go_sessions gs where gs.user_id = ${tourData.driver_id} and session_start_time > '${tourData.tour_date}' and session_end_time < '${tmr}'`
            console.log(qry_str)
            const results = await this.dsRepository
                .createQueryBuilder('gs')
                .where('gs.user_id = :userId', { userId: tourData.driver_id })
                .andWhere('gs.session_start_time > :startTime', { startTime: tourData.tour_date })
                .andWhere('gs.session_end_time < :endTime', { endTime: tmr })
                .orderBy('id', 'DESC')
                .getMany();
            // console.log(results)
            const session: any = results.length ? results[results.length -1] : {}
            if(session?.id) {
                // console.log(session.id, distance, tourId, tourData.tour_type)
                let sessionDistanceData = {
                    session_id: session.id,
                    tour_id: tourId,
                    distance: distance,
                    tour_type: tourData.tour_type
                }
                console.log(sessionDistanceData)
                await this.driverSessionDistance.save(sessionDistanceData)
                
            }
        }
        
    }

    async getMetrics(): Promise<any> {
        const duration = 90 //days
        let whereCon = {}
        let from_date = new Date('2025-12-01').toISOString().substring(0, 10);
        let to_date = new Date('2026-02-27')
        let nextDay = new Date(to_date)
        nextDay.setDate(to_date.getDate()+1)
        const nextDayData = new Date(nextDay).toISOString().substring(0, 10);
        whereCon["reached_pickup"] = Between(from_date, nextDayData)
        let bookings = await this.bookingRepository.find({where: whereCon});
        let bookingIds = []
        let tourIds = []
        let total_bookings_distance = 0
        let total_tours_distance = 0
        let total_bookings_estimate = 0
        let total_bookings_fare = 0
        let total_bookings_total_fare = 0
        for(let booking of bookings) {
            bookingIds.push(booking.id)
            // total_bookings_estimate += parseInt(booking.estimated_fare)
            // total_bookings_fare += booking.fare ? parseInt(booking.fare) : 0
            // total_bookings_total_fare += booking.total_fare ? parseInt(booking.total_fare) : 0
            // const dData = await this.utilsService.getDistanceFromGOOSM({lat: booking.pickup_lat, long: booking.pickup_long}, {lat: booking.dropoff_lat, long: booking.dropoff_long})
            // if (dData.code == 'Ok') {
            //     // console.log(dData)
            //     let totalDistance = dData.routes ? dData.routes[0].distance : 0;
            //     if (totalDistance) {
            //         totalDistance = (totalDistance / 1000);
            //     }
            //     total_bookings_distance = total_bookings_distance + totalDistance;
            // }
        }
        // console.log(bookingIds.length, total_bookings_distance, total_bookings_estimate, total_bookings_fare, total_bookings_total_fare)
        let tour_routes = await this.tourRouteRepo.find({where: {booking_id: In(bookingIds)}})
        for(let tour_r of tour_routes) {
            tourIds.push(tour_r.tour_id)
        }
        tourIds = [...new Set(tourIds)];
        for(let tourId of tourIds) {
            let tourSeq = await this.tourRouteRepo.find({where: {tour_id: tourId}, order: {sequence_number: 1}})
            let i=0
            let b = bookings.find(bk => bk.id === tourSeq[0].booking_id)
            
            const dist = b ? parseInt(b.total_distance) : NaN;
            total_tours_distance += !isNaN(dist) ? dist : 0;
            // for(let seq of tourSeq) {
            //     if(tourSeq[i+1]) {
            //         let dData = await this.utilsService.getDistanceFromGOOSM({lat: seq.location.coordinates[1], long: seq.location.coordinates[0]}, {lat: tourSeq[i+1].location.coordinates[1], long: tourSeq[i+1].location.coordinates[0]})
            //         if (dData.code == 'Ok') {
            //             let totalDistance = dData.routes ? dData.routes[0].distance : 0;
            //             if (totalDistance) {
            //                 totalDistance = (totalDistance / 1000);
            //             }
            //             total_tours_distance += totalDistance;
            //         }
            //     }
            //     i++
            // }
        }
        console.log(tourIds.length, total_tours_distance)
    }

    async revenueCalculationForMetrics(reqBody: any): Promise<any> {
        let total_booking_fare = 0
        let total_booking_efare = 0
        let pickupDate = reqBody.calc_date
        let calcStatus = true
        let customers = {}
        let bookingWeights = {}
        let bookingCarges = {}
        let driversTrips = {}
        const loadingCharges = {
            both: 200,
            loading: 100,
            unloading: 100
        }
        const splAddresses = await this.splAddressRepo.find({});
        const splCompanyIds = [4];
        // let customerWiseBookings = {};
        await this.driverTripFareDetails.delete({trip_date: pickupDate})
        const todayCustomersData = await this.bookingRepository.createQueryBuilder('b')
                                            .select('DISTINCT(customer_id)')
                                            .where("reached_pickup like :pickupDate", {pickupDate: `${pickupDate}%`})
                                            .getRawMany()
        // //console.log(todayCustomers)
        const tripInfo = {
            trip_type: 'onward',
            bookings: []
        }
        let finalCustomers = {};
        for(let todayCustomer of todayCustomersData) {
            let customerId = todayCustomer.customer_id
            let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${customerId},%`)), is_regular: true}})
            if(customer_company_details) {
                if(!finalCustomers[customer_company_details.id]) {
                    finalCustomers[customer_company_details.id] = []
                }
                finalCustomers[customer_company_details.id].push(customerId)
            } else {
                if(!finalCustomers[customerId]) {
                    finalCustomers[customerId] = []
                }
                finalCustomers[customerId].push(customerId)
            }
        }
        
        //console.log(finalCustomers);
        let todayCustomers = [];
        for(let cust in finalCustomers) {
            todayCustomers.push(finalCustomers[cust])
        }
        //console.log(todayCustomers)
        for await (let todayCustomer of todayCustomers) {
            const customerId = todayCustomer
            const todayBookings = await this.bookingRepository.find({where: {customer_id: In(customerId), booking_type: IsNull(), reached_pickup: Like(`${pickupDate}%`)}, order: {id: 'ASC'}})
            let bookingIds = []
            for await (let booking of todayBookings) {
                bookingIds.push(booking.id)
                bookingWeights[booking.id] = booking.commodity_weight 
                bookingCarges[booking.id] = {
                    toll: booking.toll_charges,
                    loadingCharge: booking.loading_charge
                }
            }
            // customerWiseBookings[customerId[0]] = bookingIds
            // //console.log("bookingIds", todayBookings.length)
            // //console.log(bookingIds)
            
            if(bookingIds.length) {
                let tourIdsListInfo = await this.tourRouteRepo.createQueryBuilder('t')
                                    .select('DISTINCT(tour_id)')
                                    .where("booking_id IN (:...bookingIds)", {bookingIds: bookingIds})
                                    .orderBy("tour_id", "ASC")
                                    .getRawMany()
                let tourIdsData = []
                for(let tourId of tourIdsListInfo) {
                    tourIdsData.push(tourId.tour_id)
                }
                // let tours = await this.toursEntity.find({where: {id: In(tourIdsData)}, order: {id: 'ASC'}})
                let tours = await this.toursEntity.find({where: {id: In(tourIdsData)}, order: {tour_date: 'ASC', tour_time: 'ASC'}})
                //for( let tourD of tours) {
                //    //console.log(tourD.id)
                //}
                let driverTours = {}
                for(let tourData of tours) {
                    if(!driverTours[tourData.driver_id]) {
                        driverTours[tourData.driver_id] = []
                    }
                    driverTours[tourData.driver_id].push(tourData.id)

                    if(!driversTrips[tourData.driver_id]) {
                        driversTrips[tourData.driver_id] = []
                    }
                    driversTrips[tourData.driver_id].push(tourData.id)
                    
                }
                
                // //console.log("driverTours")
                // //console.log(driverTours)
                for(let driverId in driverTours) {
                    let tourIdsList = driverTours[driverId]
                    let tourIdIndex = 0
                    let firstTourData = {}
                    let customerTrips = []
                    // //console.log(tourIdsList)
                    let isContinue = false
                    for(let tourId of tourIdsList) {
                        if(isContinue) {
                            isContinue = false
                            tourIdIndex++
                            continue
                        }
                        // //console.log("checking for tour id ==== ", tourId)
                        let tourIds = []
                        let tourData = await this.toursEntity.findOneBy({id: tourId})
                        tourIds.push(tourData.id)
                        let firstTourTrip = await this.findReturnTrip(tourIds, bookingIds, parseInt(driverId))
                        // //console.log("first tour trip")
                        // //console.log(firstTourTrip)
                        if(firstTourTrip.trip_type != 'return') {
                            // //console.log("checking next", tourIdIndex)
                            if(tourIdsList[tourIdIndex+1]) {
                                let nexttourData = await this.toursEntity.findOneBy({id: tourIdsList[tourIdIndex + 1]})
                                // //console.log(nexttourData.driver_id + ' == ' + tourData.driver_id)
                                if(nexttourData.driver_id == tourData.driver_id) {
                                    const secondTourTrip = await this.findReturnTrip([nexttourData.id], bookingIds, parseInt(driverId))
                                    // //console.log("second tour trip")
                                    // //console.log(secondTourTrip)
                                    if(secondTourTrip.trip_type != 'return') {
                                        tourIds.push(nexttourData.id)
                                        const nextTourTrip = await this.findReturnTrip(tourIds, bookingIds, parseInt(driverId))
                                        // //console.log("next tour trip")
                                        // //console.log(nextTourTrip.trip_type, tourIds)
                                        if(nextTourTrip.trip_type == 'return') {
                                            customerTrips.push(nextTourTrip)
                                            isContinue = true
                                        }else {
                                            tourIds.pop()
                                            customerTrips.push(firstTourTrip)
                                        }
                                    } else {
                                        customerTrips.push(firstTourTrip)
                                    }
                                } else {
                                    customerTrips.push(firstTourTrip)
                                }
                            } else {
                                customerTrips.push(firstTourTrip)
                            }
                        } else {
                            customerTrips.push(firstTourTrip)
                        }
                        tourIdIndex++
                        // //console.log("----------------------------")
                    }
                    // //console.log(customerId)
                    // //console.log(customerTrips)
                    // //console.log("*****************************************")
                    if(!customers[customerId[0]]) {
                        customers[customerId[0]] = []
                    }
                    customers[customerId[0]].push({driverId: driverId, trips: customerTrips})
                }
            }
            
            // break
            
            
        }
        // //console.log(JSON.stringify(driversTrips))
        /*for(let driverId in driversTrips) {
            let driverBookingIdsData = await this.tourRouteRepo.createQueryBuilder('t')
                                    .select('DISTINCT(booking_id)')
                                    .where("tour_id IN (:...tourIds)", {tourIds: driversTrips[driverId]})
                                    .orderBy("booking_id", "ASC")
                                    .getRawMany()
            // //console.log("driver ", driverId)
            // //console.log(driverBookingIdsData)
            let driverBookingIds = driverBookingIdsData.map((bData) => {
                return bData.booking_id
            })
            let bookings = await this.bookingRepository.find({where: {id: In(driverBookingIds)}, order: {id: 'ASC'}})
            // //console.log(bookings)
            await this.findSameTimeBookings(bookings)
        }*/
        // let csv = `${'Customer'},${'Driver'},${'Tour'},${'Bookings'},${'Tour Type'}\n`;
        // console.log(JSON.stringify(customers))
        for(let cust in customers) {
            let custId = cust
            let tours = ''
            let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${custId},%`))}})
            //this line to take all the bookings with default rates
            // let customer_company_details: any = null
            
            for(let driverData of customers[cust]) {
                for(let trips of driverData.trips) {
                    try {
                        let i = 0
                        let tripDistance = 0;
                        let total_fare = 0;
                        let points_count = 0
                        let nodes_visit = 0
                        let bookingId = trips.bookings[0];
                        let bookingData = await this.bookingRepository.findOneBy({id: bookingId});
                        if(bookingData && bookingData.total_distance) {
                            tripDistance = parseInt(bookingData.total_distance)
                            for(let seq of trips.tourRoute) {
                                if(i == 0) {
                                    nodes_visit++
                                }
                                if(trips.tourRoute[i-1]) {
                                    let dis = await this.euclideanDistance(seq.location.coordinates[1], seq.location.coordinates[0], trips.tourRoute[i-1].location.coordinates[1], trips.tourRoute[i-1].location.coordinates[0])
                                    if(dis > 50) {
                                        nodes_visit++
                                    }
                                }
                                i++
                            }
                        } else {
                            for(let seq of trips.tourRoute) {
                                if(trips.tourRoute[i+1]) {
                                    const dis = await this.calcDeadDistance(seq.location, trips.tourRoute[i+1].location);
                                    tripDistance = tripDistance + dis
                                }
                                if(i == 0) {
                                    nodes_visit++
                                }
                                if(trips.tourRoute[i-1]) {
                                    let dis = await this.euclideanDistance(seq.location.coordinates[1], seq.location.coordinates[0], trips.tourRoute[i-1].location.coordinates[1], trips.tourRoute[i-1].location.coordinates[0])
                                    if(dis > 50) {
                                        nodes_visit++
                                    }
                                }
                                i++
                            }
                        }
                        
                        let base_fare = 0
                        nodes_visit = nodes_visit - 2
                        points_count = nodes_visit - (trips.trip_type == 'return' ? 1 : 0)
                        points_count = (points_count >=0) ? (points_count) : 0
                        
                        let trip_notes = ""
                        let total_trip_weight = 0
                        if(trips.trip_type == 'return' && trips.tour_ids.length > 1) {
                            let tourIdBookings = {}
                            tourIdBookings[trips.tour_ids[0]] = []
                            tourIdBookings[trips.tour_ids[1]] = []
                            trips.tourRoute.map((routD) => {
                                tourIdBookings[routD.tour_id].push(routD.booking_id)
                            })
                            tourIdBookings[trips.tour_ids[0]] = [... new Set(tourIdBookings[trips.tour_ids[0]])]
                            tourIdBookings[trips.tour_ids[1]] = [... new Set(tourIdBookings[trips.tour_ids[1]])]
                            let tour1Weight = 0
                            for(let bookingId of tourIdBookings[trips.tour_ids[0]]) {
                                tour1Weight = tour1Weight + bookingWeights[bookingId]
                            }
                            let tour2Weight = 0
                            for(let bookingId of tourIdBookings[trips.tour_ids[1]]) {
                                tour2Weight = tour2Weight + bookingWeights[bookingId]
                            }
                            total_trip_weight = Math.max(tour1Weight, tour2Weight)
                        } else {
                            for(let bookingId of trips.bookings) {
                                total_trip_weight = total_trip_weight + bookingWeights[bookingId]
                            }
                            if(trips.trip_type == 'return') {
                                total_trip_weight = Math.ceil(total_trip_weight/2)
                            } 
                            //un comment below for trip weight
                            /*else {
                                total_trip_weight = Math.ceil(total_trip_weight/(tripNodesCount-1))
                            }*/
                        }
                        // const rate_data = await this.getGMRates(total_trip_weight, customer_company_details ? customer_company_details.id : 0)
                        // all the bookings get default rates
                        // const rate_data = await this.getGMRates(total_trip_weight, 0)
                        const rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: customer_company_details ? customer_company_details.id : 0}, order: {quantity: 'ASC'}})
                        
                        if(!customer_company_details) {
                            customer_company_details = this.defaultRates
                        }
                        
                        let baseFareCompaniesList = this.baseFareCompanies.split(",")
                        
                        // if(baseFareCompaniesList.indexOf(customer_company_details.id.toString()) > -1) {
                        //     base_fare = customer_company_details.min_base_fare
                        // } else {
                        //     base_fare = rate_data.base_rate
                        // }
                        base_fare = rate_data.base_rate
                        
                        
                        tripDistance = Math.round(tripDistance)
                        if(tripDistance <=4 ) {
                            total_fare =  base_fare
                            trip_notes = "base fare= "+ base_fare + ", points= "+ points_count + ", additional point =" + customer_company_details.additional_pickup_charge
                        } else {
                            total_trip_weight = Math.ceil(total_trip_weight)
                            // const rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: 0}, order: {quantity: 'ASC'}})
                            //console.log("trip weight ", total_trip_weight)
                            total_fare = (base_fare ? base_fare : rate_data.base_rate) + ((tripDistance-4) * rate_data.rate_per_km)
                            trip_notes = "base fare= "+ (base_fare ? base_fare : rate_data.base_rate) + ", trip distance = " + (tripDistance-4) + ", rate per km = " + rate_data.rate_per_km + ", points= "+ points_count + ", additional point =" + customer_company_details.additional_pickup_charge
                        }
                        
                        if(trips.trip_type == 'return') {
                            total_fare = total_fare * customer_company_details.return_percentage_value
                            trip_notes = trip_notes + ", total fare = " + total_fare + ", return val = " + customer_company_details.return_percentage_value
                        } else {
                            if(tripDistance > this.deamMilesLimit) {
                                const dead_miles_price_per_km = customer_company_details.dead_miles_price
                                //console.log(customer_company_details.company_name, customer_company_details.dead_miles_price, dead_miles_price_per_km)
                                const dead_miles_price = tripDistance * dead_miles_price_per_km
                                total_fare = total_fare + dead_miles_price
                                trip_notes = trip_notes + ", dead miles fare = " + dead_miles_price
                            }
                        }
                        total_fare = total_fare + (points_count * customer_company_details.additional_pickup_charge)
                        let final_fare = Math.round(total_fare > customer_company_details.min_base_fare ? total_fare : customer_company_details.min_base_fare)
                        let fareDetails = {
                            driver_id: driverData.driverId,
                            tour_ids: trips.tour_ids.join(","),
                            booking_ids: trips.bookings.join(","),
                            total_distance: tripDistance,
                            trip_date: pickupDate,
                            total_fare: final_fare,
                            trip_type: trips.trip_type,
                            customer_id: parseInt(custId),
                            no_points: points_count,
                            trip_weight: total_trip_weight,
                            trip_notes: trip_notes
                        }
                        let bCost = Math.round(final_fare/trips.bookings.length)
                        let bookingCost = bCost > base_fare ? bCost : base_fare
                        
                        let waiting_charge = 0
                        if(customer_company_details.waiting_charge_type == 'T1') {
                            waiting_charge = await this.caliculateT1WaitingCharge(nodes_visit, trips.bookings, trips.tour_ids)
                        } else if(customer_company_details.waiting_charge_type == 'T2') {
                            waiting_charge = await this.caliculateT2WaitingCharge(nodes_visit, trips.bookings, tripDistance, trips.tour_ids)
                        } 
                        let waiting_charge_value = waiting_charge > 0 ? Math.round(waiting_charge/trips.bookings.length) : 0
                        for(let bookingId of trips.bookings) {
                            let bookingFare = bookingCost
                            // add loading/unloading charges
                            // bookingCost = bookingCost + (bookingCarges[bookingId].loadingCharge ? bookingCarges[bookingId].loadingCharge : 0)
                            // bookingCost = bookingCost + loadingCharges['loadingCharge']
                            // if(bookingCarges[bookingId].both_loading_unloading_charge_applicable) {
                            //     bookingCost = bookingCost + loadingCharges['both']
                            // } else {
                            //     if(bookingCarges[bookingId].loading_charge_applicable) {
                            //         bookingCost = bookingCost + loadingCharges['loading']
                            //     }
                            //     if(bookingCarges[bookingId].unloading_charge_applicable) {
                            //         bookingCost = bookingCost + loadingCharges['unloading']
                            //     }
                            // }
                            //end of loading/unloading charges
                            // if(customer_company_details && splCompanyIds.indexOf(customer_company_details.id) >= 0) {
                            //     bookingFare = await this.rCalSpecialCompanies(customer_company_details, bookingId, trips.trip_type);
                            // } else {
                            //     let isFindData = await this.findSpecialAddress(splAddresses, bookingId);
                            //     if(isFindData.found) {
                            //         bookingFare = bookingCost + isFindData.amount
                            //     }
                            // }
                            // await this.bookingRepository.update({id: bookingId}, {fare: bookingFare.toString(), waiting_charge: waiting_charge_value.toString(), total_distance: tripDistance.toString()})
                            
                            // console.log(bookingId, bookingFare)
                            total_booking_fare += bookingFare
                            
                        }
                    } catch(e) {
                        //console.log("problem in cal ", e)
                    }
                    
                    // csv = csv + `${custId},${driverData.driverId},${trips.tour_ids.join("-")},${trips.bookings.join("-")},${trips.trip_type}\n`;
                }
                
                
            }
            
            
            
        }
        
        return total_booking_fare
    } 

    async revenueCalculationDateRangeMetrics(reqBody: any): Promise<any> {
        let total_booking_fare = 0
        let fromDate = new Date(reqBody.from_date);
        let toDate = new Date(reqBody.to_date);
        
        for (let day = fromDate; day <= toDate; day.setDate(day.getDate() + 1)) {
            // //console.log(day)
            let calc_date = moment(day).format('YYYY-MM-DD')
            //console.log(calc_date)
            let res = await this.revenueCalculationForMetrics({calc_date})
            //console.log(res)
            console.log(calc_date, res)
            total_booking_fare += res
        }
        console.log("total_booking_fare", total_booking_fare)
        return true

    }

    async revenueCalculationTocompareFares(reqBody: any): Promise<any> {
        let pickupDate = reqBody.calc_date
        let companyIds: number[] = reqBody.company_ids || [3]
        let bookingResults: any[] = []
        let customers = {}
        let bookingWeights = {}
        let bookingFares = {}
        let bookingCarges = {}
        let driversTrips = {}
        const loadingCharges = {
            both: 200,
            loading: 100,
            unloading: 100
        }
        const splAddresses = await this.splAddressRepo.find({});
        const splCompanyIds = [4];
        // await this.driverTripFareDetails.delete({trip_date: pickupDate})
        const todayCustomersData = await this.bookingRepository.createQueryBuilder('b')
                                            .select('DISTINCT(customer_id)')
                                            .where("reached_pickup like :pickupDate", {pickupDate: `${pickupDate}%`})
                                            .getRawMany()
        let finalCustomers = {};
        for(let todayCustomer of todayCustomersData) {
            let customerId = todayCustomer.customer_id
            let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${customerId},%`)), is_regular: true}})
            if(customer_company_details) {
                if(companyIds.length > 0 && companyIds.indexOf(customer_company_details.id) === -1) continue
                if(!finalCustomers[customer_company_details.id]) {
                    finalCustomers[customer_company_details.id] = []
                }
                finalCustomers[customer_company_details.id].push(customerId)
            } else {
                if(companyIds.length > 0) continue
                if(!finalCustomers[customerId]) {
                    finalCustomers[customerId] = []
                }
                finalCustomers[customerId].push(customerId)
            }
        }

        let todayCustomers = [];
        for(let cust in finalCustomers) {
            todayCustomers.push(finalCustomers[cust])
        }
        for await (let todayCustomer of todayCustomers) {
            const customerId = todayCustomer
            const todayBookings = await this.bookingRepository.find({where: {customer_id: In(customerId), booking_type: IsNull(), reached_pickup: Like(`${pickupDate}%`)}, order: {id: 'ASC'}})
            let bookingIds = []
            for await (let booking of todayBookings) {
                bookingIds.push(booking.id)
                bookingWeights[booking.id] = booking.commodity_weight
                bookingFares[booking.id] = booking.fare
                bookingCarges[booking.id] = {
                    toll: booking.toll_charges,
                    loadingCharge: booking.loading_charge
                }
            }
            // customerWiseBookings[customerId[0]] = bookingIds
            // //console.log("bookingIds", todayBookings.length)
            // //console.log(bookingIds)
            
            if(bookingIds.length) {
                let tourIdsListInfo = await this.tourRouteRepo.createQueryBuilder('t')
                                    .select('DISTINCT(tour_id)')
                                    .where("booking_id IN (:...bookingIds)", {bookingIds: bookingIds})
                                    .orderBy("tour_id", "ASC")
                                    .getRawMany()
                let tourIdsData = []
                for(let tourId of tourIdsListInfo) {
                    tourIdsData.push(tourId.tour_id)
                }
                // let tours = await this.toursEntity.find({where: {id: In(tourIdsData)}, order: {id: 'ASC'}})
                let tours = await this.toursEntity.find({where: {id: In(tourIdsData)}, order: {tour_date: 'ASC', tour_time: 'ASC'}})
                //for( let tourD of tours) {
                //    //console.log(tourD.id)
                //}
                let driverTours = {}
                for(let tourData of tours) {
                    if(!driverTours[tourData.driver_id]) {
                        driverTours[tourData.driver_id] = []
                    }
                    driverTours[tourData.driver_id].push(tourData.id)

                    if(!driversTrips[tourData.driver_id]) {
                        driversTrips[tourData.driver_id] = []
                    }
                    driversTrips[tourData.driver_id].push(tourData.id)
                    
                }
                
                // //console.log("driverTours")
                // //console.log(driverTours)
                for(let driverId in driverTours) {
                    let tourIdsList = driverTours[driverId]
                    let tourIdIndex = 0
                    let firstTourData = {}
                    let customerTrips = []
                    // //console.log(tourIdsList)
                    let isContinue = false
                    for(let tourId of tourIdsList) {
                        if(isContinue) {
                            isContinue = false
                            tourIdIndex++
                            continue
                        }
                        // //console.log("checking for tour id ==== ", tourId)
                        let tourIds = []
                        let tourData = await this.toursEntity.findOneBy({id: tourId})
                        tourIds.push(tourData.id)
                        let firstTourTrip = await this.findReturnTrip(tourIds, bookingIds, parseInt(driverId))
                        // //console.log("first tour trip")
                        // //console.log(firstTourTrip)
                        if(firstTourTrip.trip_type != 'return') {
                            // //console.log("checking next", tourIdIndex)
                            if(tourIdsList[tourIdIndex+1]) {
                                let nexttourData = await this.toursEntity.findOneBy({id: tourIdsList[tourIdIndex + 1]})
                                // //console.log(nexttourData.driver_id + ' == ' + tourData.driver_id)
                                if(nexttourData.driver_id == tourData.driver_id) {
                                    const secondTourTrip = await this.findReturnTrip([nexttourData.id], bookingIds, parseInt(driverId))
                                    // //console.log("second tour trip")
                                    // //console.log(secondTourTrip)
                                    if(secondTourTrip.trip_type != 'return') {
                                        tourIds.push(nexttourData.id)
                                        const nextTourTrip = await this.findReturnTrip(tourIds, bookingIds, parseInt(driverId))
                                        // //console.log("next tour trip")
                                        // //console.log(nextTourTrip.trip_type, tourIds)
                                        if(nextTourTrip.trip_type == 'return') {
                                            customerTrips.push(nextTourTrip)
                                            isContinue = true
                                        }else {
                                            tourIds.pop()
                                            customerTrips.push(firstTourTrip)
                                        }
                                    } else {
                                        customerTrips.push(firstTourTrip)
                                    }
                                } else {
                                    customerTrips.push(firstTourTrip)
                                }
                            } else {
                                customerTrips.push(firstTourTrip)
                            }
                        } else {
                            customerTrips.push(firstTourTrip)
                        }
                        tourIdIndex++
                        // //console.log("----------------------------")
                    }
                    // //console.log(customerId)
                    // //console.log(customerTrips)
                    // //console.log("*****************************************")
                    if(!customers[customerId[0]]) {
                        customers[customerId[0]] = []
                    }
                    customers[customerId[0]].push({driverId: driverId, trips: customerTrips})
                }
            }
            
            // break
            
            
        }
        
        console.log(JSON.stringify(customers))
        for(let cust in customers) {
            let custId = cust
            let tours = ''
            let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${custId},%`))}})
            
            for(let driverData of customers[cust]) {
                for(let trips of driverData.trips) {
                    try {
                        let i = 0
                        let tripDistance = 0;
                        let total_fare = 0;
                        let points_count = 0
                        let nodes_visit = 0
                        await this.findSameTimeBookings(trips.tourRoute)
                        //console.log("initial trip distance ", tripDistance)
                        //console.log(trips.tourRoute)
                        let bookingId = trips.bookings[0];
                        let bookingData = await this.bookingRepository.findOneBy({id: bookingId});
                        if(bookingData && bookingData.total_distance) {
                            tripDistance = parseInt(bookingData.total_distance)
                            // //console.log("trip distance got from booking ......", bookingId, tripDistance)
                            for(let seq of trips.tourRoute) {
                                if(i == 0) {
                                    nodes_visit++
                                }
                                if(trips.tourRoute[i-1]) {
                                    let dis = await this.euclideanDistance(seq.location.coordinates[1], seq.location.coordinates[0], trips.tourRoute[i-1].location.coordinates[1], trips.tourRoute[i-1].location.coordinates[0])
                                    if(dis > 50) {
                                        nodes_visit++
                                    }
                                }
                                i++
                            }
                        } else {
                            for(let seq of trips.tourRoute) {
                                if(trips.tourRoute[i+1]) {
                                    const dis = await this.calcDeadDistance(seq.location, trips.tourRoute[i+1].location);
                                    tripDistance = tripDistance + dis
                                }
                                if(i == 0) {
                                    nodes_visit++
                                }
                                if(trips.tourRoute[i-1]) {
                                    let dis = await this.euclideanDistance(seq.location.coordinates[1], seq.location.coordinates[0], trips.tourRoute[i-1].location.coordinates[1], trips.tourRoute[i-1].location.coordinates[0])
                                    if(dis > 50) {
                                        nodes_visit++
                                    }
                                }
                                i++
                            }
                        }
                        
                        //console.log("final trip distance ", tripDistance)
                        
                        // //console.log("customer ", custId)
                        // //console.log(customer_company_details)
                        let base_fare = 0
                        // //console.log("route length === ", trips.tourRoute.length)
                        //const pickDropCount = (trips.pickup_count > trips.dropoff_count) ? trips.pickup_count - trips.dropoff_count : trips.dropoff_count - trips.pickup_count; 
                        //points_count = (pickDropCount) + (Math.min(trips.pickup_count, trips.dropoff_count)) - (trips.trip_type == 'return' ? 2 : 1)
                        // console.log(trips.tour_ids, points_count)
                        // console.log(points_count, " ====== points count ")
                        // console.log(trips.pickup_count - trips.dropoff_count)
                        // console.log(Math.min(trips.pickup_count, trips.dropoff_count))
                        // console.log(trips.trip_type == 'return' ? 2 : 1)
                        let tripNodesCount = nodes_visit
                        nodes_visit = nodes_visit - 2
                        points_count = nodes_visit - (trips.trip_type == 'return' ? 1 : 0)
                        points_count = (points_count >=0) ? (points_count) : 0
                        // trips.tourRoute ? trips.tourRoute.length : 2
                        
                        let trip_notes = ""
                        let total_trip_weight = 0
                        if(trips.trip_type == 'return' && trips.tour_ids.length > 1) {
                            let tourIdBookings = {}
                            tourIdBookings[trips.tour_ids[0]] = []
                            tourIdBookings[trips.tour_ids[1]] = []
                            trips.tourRoute.map((routD) => {
                                tourIdBookings[routD.tour_id].push(routD.booking_id)
                            })
                            tourIdBookings[trips.tour_ids[0]] = [... new Set(tourIdBookings[trips.tour_ids[0]])]
                            tourIdBookings[trips.tour_ids[1]] = [... new Set(tourIdBookings[trips.tour_ids[1]])]
                            let tour1Weight = 0
                            for(let bookingId of tourIdBookings[trips.tour_ids[0]]) {
                                tour1Weight = tour1Weight + bookingWeights[bookingId]
                            }
                            let tour2Weight = 0
                            for(let bookingId of tourIdBookings[trips.tour_ids[1]]) {
                                tour2Weight = tour2Weight + bookingWeights[bookingId]
                            }
                            total_trip_weight = Math.max(tour1Weight, tour2Weight)
                        } else {
                            // //console.log("-----------------------------------")
                            // //console.log(trips.trip_type)
                            // //console.log(trips.bookings)
                            for(let bookingId of trips.bookings) {
                                total_trip_weight = total_trip_weight + bookingWeights[bookingId]
                            }
                            if(trips.trip_type == 'return') {
                                total_trip_weight = Math.ceil(total_trip_weight/2)
                            } 
                            //un comment below for trip weight
                            /*else {
                                total_trip_weight = Math.ceil(total_trip_weight/(tripNodesCount-1))
                            }*/
                        }
                        const rate_data = await this.getGMRates(total_trip_weight, customer_company_details ? customer_company_details.id : 0)
                        // const rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: customer_company_details ? customer_company_details.id : 0}, order: {quantity: 'ASC'}})
                        
                        if(!customer_company_details) {
                            customer_company_details = this.defaultRates
                        }
                        
                        let baseFareCompaniesList = this.baseFareCompanies.split(",")
                        
                        // if(baseFareCompaniesList.indexOf(customer_company_details.id.toString()) > -1) {
                        //     base_fare = customer_company_details.min_base_fare
                        // } else {
                        //     base_fare = rate_data.base_rate
                        // }
                        base_fare = 180
                        
                        tripDistance = Math.round(tripDistance)
                        if(tripDistance <=4 ) {
                            total_fare =  base_fare
                            trip_notes = "base fare= "+ base_fare + ", points= "+ points_count + ", additional point =" + customer_company_details.additional_pickup_charge
                        } else {
                            total_trip_weight = Math.ceil(total_trip_weight)
                            // const rate_data = await this.gmRates.findOne({where: {quantity: MoreThanOrEqual(total_trip_weight), company_id: 0}, order: {quantity: 'ASC'}})
                            //console.log("trip weight ", total_trip_weight)
                            total_fare = (base_fare ? base_fare : rate_data.base_rate) + ((tripDistance-4) * rate_data.rate_per_km)
                            trip_notes = "base fare= "+ (base_fare ? base_fare : rate_data.base_rate) + ", trip distance = " + (tripDistance-4) + ", rate per km = " + rate_data.rate_per_km + ", points= "+ points_count + ", additional point =" + customer_company_details.additional_pickup_charge
                        }
                        
                        if(trips.trip_type == 'return') {
                            total_fare = total_fare * customer_company_details.return_percentage_value
                            trip_notes = trip_notes + ", total fare = " + total_fare + ", return val = " + customer_company_details.return_percentage_value
                        } else {
                            if(tripDistance > this.deamMilesLimit) {
                                const dead_miles_price_per_km = customer_company_details.dead_miles_price
                                //console.log(customer_company_details.company_name, customer_company_details.dead_miles_price, dead_miles_price_per_km)
                                const dead_miles_price = tripDistance * dead_miles_price_per_km
                                total_fare = total_fare + dead_miles_price
                                trip_notes = trip_notes + ", dead miles fare = " + dead_miles_price
                            }
                        }
                        total_fare = total_fare + (points_count * customer_company_details.additional_pickup_charge)
                        let final_fare = Math.round(total_fare > customer_company_details.min_base_fare ? total_fare : customer_company_details.min_base_fare)
                        // // const fareDetails = {
                        // //     driver_id: driverData.driverId,
                        // //     tour_ids: trips.tour_ids.join(","),
                        // //     booking_ids: trips.bookings.join(","),
                        // //     total_distance: tripDistance,
                        // //     trip_date: pickupDate,
                        // //     total_fare: final_fare,
                        // //     trip_type: trips.trip_type,
                        // //     customer_id: parseInt(custId),
                        // //     no_points: points_count,
                        // //     trip_weight: total_trip_weight,
                        // //     trip_notes: trip_notes
                        // // }
                        // // await this.driverTripFareDetails.save(fareDetails)
                        let bCost = Math.round(final_fare/trips.bookings.length)
                        let bookingCost = bCost > base_fare ? bCost : base_fare

                        let waiting_charge = 0
                        if(customer_company_details.waiting_charge_type == 'T1') {
                            waiting_charge = await this.caliculateT1WaitingCharge(nodes_visit, trips.bookings, trips.tour_ids)
                        } else if(customer_company_details.waiting_charge_type == 'T2') {
                            waiting_charge = await this.caliculateT2WaitingCharge(nodes_visit, trips.bookings, tripDistance, trips.tour_ids)
                        }
                        let waiting_charge_value = waiting_charge > 0 ? Math.round(waiting_charge/trips.bookings.length) : 0
                        for(let bookingId of trips.bookings) {
                            let bookingFare = bookingCost
                            if(customer_company_details && splCompanyIds.indexOf(customer_company_details.id) >= 0) {
                                bookingFare = await this.rCalSpecialCompanies(customer_company_details, bookingId, trips.trip_type);
                            } else {
                                let isFindData = await this.findSpecialAddress(splAddresses, bookingId);
                                if(isFindData.found) {
                                    bookingFare = bookingCost + isFindData.amount
                                }
                            }
                            // // await this.bookingRepository.update({id: bookingId}, {fare: bookingFare.toString(), waiting_charge: waiting_charge_value.toString(), total_distance: tripDistance.toString()})
                            bookingResults.push({
                                booking_id: bookingId,
                                existing_fare: parseInt(bookingFares[bookingId] || '0'),
                                new_fare: bookingFare
                            })
                        }
                    } catch(e) {
                        //console.log("problem in cal ", e)
                    }
                }
                // // if(customer_company_details.has_daily_limit) {
                // //     await this.checkDailyFareForDriverCustomer(driverData.trips)
                // // }
            }
        }

        return bookingResults
    }

    async revenueCalculationTocompareFaresDateRange(reqBody: any): Promise<any> {
        let fromDate = new Date(reqBody.from_date);
        let toDate = new Date(reqBody.to_date);
        let companyIds: number[] = reqBody.company_ids || [3]

        let csv = `date,booking_id,existing_fare,new_fare\n`

        for (let day = fromDate; day <= toDate; day.setDate(day.getDate() + 1)) {
            let calc_date = moment(day).format('YYYY-MM-DD')
            let results: any[] = await this.revenueCalculationTocompareFares({ calc_date, company_ids: companyIds })
            for (let row of results) {
                csv += `${calc_date},${row.booking_id},${row.existing_fare},${row.new_fare}\n`
            }
            console.log(calc_date, results.length, 'bookings')
        }

        const filePath = './public/compare_fares.csv'
        fs.writeFileSync(filePath, csv, 'utf8')
        console.log('CSV saved to', filePath)
        return filePath
    }
}
