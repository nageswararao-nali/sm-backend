import { ConsoleLogger, Injectable,  Inject, forwardRef } from '@nestjs/common';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { S3 } from 'aws-sdk';
import { Point } from 'geojson';
import * as moment from 'moment';
import { BookingEntity } from 'src/bookings/models/booking.entity';
import { BookingConsolidationCentersEntity } from 'src/bookings/models/bookingConsolidationCenters.entity';
import { TripEntity } from 'src/bookings/models/trip.entity';
import { BookingService } from 'src/bookings/services/booking.service';
import { DriversEntity } from 'src/trucks/models/driver.entity';
import { TrucksEntity } from 'src/trucks/models/truck.entity';
import { DriverService } from 'src/trucks/services/driver.service';
import { LocationService } from 'src/trucks/services/location.service';
import { UtilsService } from 'src/utils/services/utils.service';
import { Between, In, LessThan, LessThanOrEqual, MoreThan, MoreThanOrEqual, Not, Repository, Like, IsNull } from 'typeorm';
import { TourAssignTruckDriversEntity } from '../models/tourAssignTruckDrivers.entity';
import { TourBookingDetailsEntity } from '../models/tourBookingDetails.entity';
import { TourBookingDetails } from '../models/tourBookingDetails.interface';
import { TourRouteEntity } from '../models/tourRoute.entity';
import { ToursEntity } from '../models/tours.entity';
import axios from 'axios';
import fetch from 'node-fetch';
import { DriverSessionDistanceEntity } from 'src/trucks/models/driverSessionDistance.entity';
import { BaseLocationsEntity } from 'src/admin/models/baseLocations.entity';
import { AdminService } from 'src/admin/services/admin.service';
import { SeqTrackEntity } from '../models/seqTrack';
import { CustomerCompanyEntity } from 'src/trucks/models/cusomerCompanyDetails';
import { DriverSessionsEntity } from 'src/trucks/models/driverSessions.entity';
import { VehicleLiveDataEntity } from '../models/vehicleLiveData.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from 'src/common/redis/redis.provider';
import { CallLogsEntity } from '../models/callLogs.entity';
import { DeliveryProofEntity } from '../models/deliveryProof.entity';
import { Jimp, loadFont } from 'jimp';
const DISTANCE_VAR = 0.050

@Injectable()
export class TourService {
    constructor(
        @InjectRepository(ToursEntity)
        private toursRepository: Repository<ToursEntity>,
        @InjectRepository(TourBookingDetailsEntity)
        private tourBookingDetails: Repository<TourBookingDetailsEntity>,
        @InjectRepository(BookingEntity)
        private bookingRepository: Repository<BookingEntity>,
        @InjectRepository(TripEntity)
        private tripRepo: Repository<TripEntity>,
        @InjectRepository(BookingConsolidationCentersEntity)
        private bookingConsolidationCentersRepository: Repository<BookingConsolidationCentersEntity>,
        @InjectRepository(TourAssignTruckDriversEntity)
        private tourAssignTruckDriverRepository: Repository<TourAssignTruckDriversEntity>,
        @InjectRepository(TrucksEntity)
        private trucksRepository: Repository<TrucksEntity>,
        @InjectRepository(DriversEntity)
        private driversRepository: Repository<DriversEntity>,
        @InjectRepository(TourRouteEntity)
        private tourRouteRepository: Repository<TourRouteEntity>,
        @InjectRepository(DriverSessionDistanceEntity)
        private driverSessionDistance: Repository<DriverSessionDistanceEntity>,
        @InjectRepository(BaseLocationsEntity)
        private baseLocationRepo: Repository<BaseLocationsEntity>,
        @InjectRepository(SeqTrackEntity)
        private seqTrackRepo: Repository<SeqTrackEntity>,
        @InjectRepository(CustomerCompanyEntity)
        private customerCompanyDetails: Repository<CustomerCompanyEntity>,
        @InjectRepository(DriverSessionsEntity)
        private dsRepo: Repository<DriverSessionsEntity>,
        @InjectRepository(VehicleLiveDataEntity)
        private vehicleLiveDataRepo: Repository<VehicleLiveDataEntity>,
        @InjectRepository(CallLogsEntity)
        private callLogRepo: Repository<CallLogsEntity>,
        @InjectRepository(DeliveryProofEntity)
        private deliveryProofRepo: Repository<DeliveryProofEntity>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        @Inject(REDIS_CLIENT) private redis: Redis,
        private utilsService: UtilsService,
        private configService: ConfigService,
        private driverService: DriverService,
        @Inject(forwardRef(() => BookingService))
        private bookingService: BookingService,
        private locService: LocationService,
        private adminService: AdminService
    ){}

    async tourDetails(tourId: number): Promise<any> {
        let resObj: any = {tour: {}, tourItems: [], tourPoints: {}}
        let tour = await this.toursRepository.findOneBy({id: tourId})
        // //console.log(tour)
        // //console.log(tour.id)
        let tourRoute = await this.tourRouteRepository.find({ where: {tour_id: tour.id}, order: {sequence_number : 'ASC'}})

        // let tourDetails = await this.tourBookingDetails.findBy({tour_id: tour.id})
        // //console.log(tourRoute)
        for await (const tourDetail of tourRoute) {
            // let booking: any = {}
            let pickuptime_flexiblity_status = ''
            let pickup_flexible_time = ''
            let dropofftime_flexiblity_status = ''
            let dropoff_flexible_time = ''
            let bookingDetails: any = {}
            {
                const booking = await this.bookingRepository.findOneBy({id: tourDetail.booking_id})
                const tripData = await this.tripRepo.findOneBy({trip_id: tourDetail.trip_id})
                const commodity_type = await this.utilsService.getCatName(booking.commodity_type)
                const callLog = await this.callLogRepo.findOneBy({booking_id: booking.id})
                const customerCompany = await this.customerCompanyDetails.findOne({ where: { users: Like(`%#${booking.customer_id},%`) } })
                bookingDetails = {
                    "id": tripData.id,
                    "trip_id": tripData.trip_id,
                    "main_booking_id": booking.id,
                    "customer_name": await this.utilsService.getName(booking.customer_id),
                    "customer_device_token": await this.utilsService.getDeviceToken(booking.customer_id),
                    "engaged_consolidation_manager": await this.utilsService.getName(booking.engaged_consolidation_manager),
                    "pickup_location": tripData.pickup_location,
                    "pickup_date": moment(tripData.pickup_time).format('d-m-Y'),
                    "pickup_time": moment(tripData.pickup_time).format('hh:mm A'),
                    "pickuptime_flexiblity_status": pickuptime_flexiblity_status,
                    "pickup_flexible_time": pickup_flexible_time,
                    "dropoff_location": tripData.dropoff_location,
                    "dropoff_date": moment(tripData.dropoff_time).format('d-m-Y'),
                    "dropoff_time": moment(tripData.dropoff_time).format('hh:mm A'),
                    "dropofftime_flexiblity_status": dropofftime_flexiblity_status,
                    "dropoff_flexible_time": dropoff_flexible_time,
                    "commodity_type": commodity_type == 'Others' ? booking.other_commodity_name :  commodity_type,
                    // "truck_owner_status": tripData.truck_owner_status,
                    "commodity_weight": booking.commodity_weight,
                    "weight_unit": booking.weight_unit,
                    "commodity_whole_volume": booking.commodity_whole_volume,
                    "volume_unit":  await this.utilsService.getCatName(booking.volume_unit),
                    "commodity_length": booking.commodity_length,
                    "length_unit":  await this.utilsService.getCatName(booking.length_unit),
                    "commodity_breadth": booking.commodity_breadth,
                    "breadth_unit":  await this.utilsService.getCatName(booking.breadth_unit),
                    "commodity_height": booking.commodity_height,
                    "height_unit":  await this.utilsService.getCatName(booking.height_unit),
                    "packaging_type":  await this.utilsService.getCatName(booking.packaging_type),
                    "consignment_image":  booking.consignment_image,
                    "receiver_name": booking.receiver_name,
                    "receiver_contact": booking.receiver_contact,
                    "pickup_receiver_name": booking.pickup_receiver_name,
                    "pickup_receiver_contact": booking.pickup_receiver_contact,
                    "dropoff_receiver_name": booking.dropoff_receiver_name,
                    "dropoff_receiver_contact": booking.dropoff_receiver_contact,
                    "quotation_status": booking.quotation_status,
                    "quotation_payment_status": booking.quotation_payment_status,
                    "booking_confirm_status": booking.booking_confirm_status,
                    "instruction": booking.instruction,
                    "status": booking.status,
                    "tour_status": booking.tour_status,
                    "booking_type": booking.booking_type,
                    "payment_type": booking.payment_type,
                    "payment_status": booking.payment_status,
                    "booking_at_consolidation_center_tour_status_flag": 0,
                    "booking_at_consolidation_center_tour_status": '',
                    "assign_tour_status": booking.assign_tour_status,
                    "created_date": moment(booking.created_at).format('d-m-Y'),
                    "created_time": moment(booking.created_at).format('hh:mm A'),
                    "fare": booking.fare,
                    "is_regular": customerCompany ? customerCompany.is_regular : false,
                    "payment_at": booking.payment_at,
                    "is_full_payment": booking.is_full_payment,
                    "estimated_fare": booking.estimated_fare,
                    "waiting_charge": booking.waiting_charge,
                    "loading_charge": booking.loading_charge,
                    "toll_charges": booking.toll_charges,
                    "additional_fare": booking.additional_fare,
                    "total_fare": booking.total_fare,
                    "tdcNumber": booking.tdcNumber,
                    "booking_for": booking.booking_for,
                    "requestInfo": booking.requestInfo,
                    "calls_count": callLog ? callLog.calls_count : 0,
                    "is_otp_enabled": customerCompany ? customerCompany.is_otp_enabled : 'No',
                    "is_delivery_proof_enabled": customerCompany ? customerCompany.is_delivery_proof_enabled : 'No'
                }
            }

            // //console.log(bookingDetails)
            let tourData = {
                ...tourDetail,
                tour_item: bookingDetails 
            }
            // resObj.tourItems.push(tourData)
            resObj.tourPoints["tb_"+tourDetail.id] = tourData
        }
        const driverData = await this.driversRepository.findOneBy({user_id: tour.driver_id})
        // const truckData = await this.trucksRepository.findOneBy({id: driverData.truck_id})
        let tourTruckData: any = {}
        tourTruckData['driver_name'] = driverData ? driverData.name : '';
        tourTruckData['driver_mobile'] = driverData ? driverData.mobile_number : '';
        // tourTruckData['driver_mobile'] = driverData.mobile_number;
        
        // tourTruckData['driver_name'] = getDriverName($tour_data->driver_id);
        // tourTruckData['driver_mobile'] = getDriverMobile($tour_data->driver_id);
        // tourTruckData['truck_no'] = getTruckRegistrationNumber($tour_data->truck_id);
        // tourTruckData['truck_modal'] = getTruckmodal($tour_data->truck_id);
        // $data['tours'] = $tours;
        resObj.truck = tourTruckData;
        // resObj.sequence = newSequenceArray;
        resObj.sequenceData = tourRoute
        resObj.tour = tour
        return resObj;
    }

    // Simplified counterpart to tourDetails(): batches the per-leg lookups (instead of
    // one booking/trip/call-log query per stop) and does the pickup/dropoff consolidation
    // that the driver app used to do on-device, so clients get an already-grouped,
    // already-trimmed `stops` array instead of raw tourPoints/sequenceData to reassemble.
    async tourFullDetails(tourId: number): Promise<any> {
        const tour = await this.toursRepository.findOneBy({ id: tourId })
        if (!tour) {
            return null
        }
        const tourRoute = await this.tourRouteRepository.find({ where: { tour_id: tour.id }, order: { sequence_number: 'ASC' } })
        const driverData = await this.driversRepository.findOneBy({ user_id: tour.driver_id })
        // Per-leg data needed to decide grouping (pickup_location/dropoff_location) and to
        // fill a stop once it's created. Same order as tourRoute so legs[i] <-> tourRoute[i].
        const legs: any[] = []
        // Booking-level data (fare, payment, receiver info, requestInfo, ...) keyed by
        // booking_id - a pickup + dropoff pair share one entry here instead of two copies.
        const bookings: Record<number, any> = {}

        {
            const bookingIds = [...new Set(tourRoute.map(r => r.booking_id))]
            const tripIds = [...new Set(tourRoute.map(r => r.trip_id))]

            const [bookingRows, trips, callLogs]: [BookingEntity[], TripEntity[], CallLogsEntity[]] = await Promise.all([
                bookingIds.length ? this.bookingRepository.find({ where: { id: In(bookingIds) } }) : [],
                tripIds.length ? this.tripRepo.find({ where: { trip_id: In(tripIds) } }) : [],
                bookingIds.length ? this.callLogRepo.find({ where: { booking_id: In(bookingIds) } }) : [],
            ])
            const bookingById = new Map<number, BookingEntity>(bookingRows.map(b => [b.id, b]))
            const tripByTripId = new Map<string, TripEntity>(trips.map(t => [t.trip_id, t]))
            const callLogByBookingId = new Map<number, CallLogsEntity>(callLogs.map(c => [c.booking_id, c]))
            // customer_company is a small, admin-managed table - one unfiltered fetch beats
            // one `LIKE` query per stop.
            const customerCompanies = await this.customerCompanyDetails.find()
            const companyForCustomer = (customerId: number) =>
                customerCompanies.find(cc => cc.users?.includes(`#${customerId},`))

            for (const booking of bookingRows) {
                const callLog = callLogByBookingId.get(booking.id)
                const customerCompany = companyForCustomer(booking.customer_id)
                bookings[booking.id] = {
                    weight_unit: booking.weight_unit,
                    receiver_name: booking.receiver_name,
                    receiver_contact: booking.receiver_contact,
                    pickup_receiver_name: booking.pickup_receiver_name,
                    pickup_receiver_contact: booking.pickup_receiver_contact,
                    dropoff_receiver_name: booking.dropoff_receiver_name,
                    dropoff_receiver_contact: booking.dropoff_receiver_contact,
                    booking_type: booking.booking_type,
                    payment_type: booking.payment_type,
                    payment_status: booking.payment_status,
                    payment_at: booking.payment_at,
                    fare: booking.fare,
                    estimated_fare: booking.estimated_fare,
                    waiting_charge: booking.waiting_charge,
                    loading_charge: booking.loading_charge,
                    toll_charges: booking.toll_charges,
                    additional_fare: booking.additional_fare,
                    total_fare: booking.total_fare,
                    is_full_payment: booking.is_full_payment,
                    is_regular: customerCompany ? customerCompany.is_regular : false,
                    is_otp_enabled: customerCompany ? customerCompany.is_otp_enabled : 'No',
                    is_delivery_proof_enabled: customerCompany ? customerCompany.is_delivery_proof_enabled : 'No',
                    tdcNumber: booking.tdcNumber,
                    booking_for: booking.booking_for,
                    requestInfo: booking.requestInfo,
                    calls_count: callLog ? callLog.calls_count : 0,
                    consignment_image: booking.consignment_image,
                }
            }

            for (const tourDetail of tourRoute) {
                const booking = bookingById.get(tourDetail.booking_id)
                const tripData = tripByTripId.get(tourDetail.trip_id)
                legs.push({
                    booking_id: booking?.id,
                    pickup_location: tripData?.pickup_location,
                    pickup_time: tripData?.pickup_time,
                    dropoff_location: tripData?.dropoff_location,
                    dropoff_time: tripData?.dropoff_time,
                    weight: booking?.commodity_weight,
                })
            }
        }

        // Consolidate consecutive legs of the same type (pickup/dropoff) at the same
        // location into a single stop - this used to happen client-side in tour.ts.
        const stops: any[] = []
        for (let i = 0; i < tourRoute.length; i++) {
            const routeLeg = tourRoute[i]
            const leg = legs[i]
            const currentSeqLoc = routeLeg.transport_type == 'pickup' ? leg.pickup_location : leg.dropoff_location

            const lastStop = stops[stops.length - 1]
            const isSamePoint = !!lastStop && lastStop.pType == routeLeg.transport_type && currentSeqLoc == lastStop.location

            if (!isSamePoint) {
                stops.push({
                    id: [routeLeg.id],
                    booking_ids: [leg.booking_id],
                    booking_id: leg.booking_id,
                    seqNum: routeLeg.sequence_number,
                    pType: routeLeg.transport_type,
                    is_to_base: routeLeg.is_to_base,
                    status: routeLeg.status,
                    location: routeLeg.location_address,
                    seq_location: routeLeg.location,
                    time: routeLeg.transport_type == 'pickup' ? leg.pickup_time : leg.dropoff_time,
                    weight: leg.weight,
                    estimated_time: routeLeg.estimated_time,
                    completed_time: routeLeg.completed_time,
                })
            } else {
                lastStop.id.push(routeLeg.id)
                lastStop.booking_ids.push(leg.booking_id)
                lastStop.weight = (lastStop.weight || 0) + (leg.weight || 0)
                lastStop.status = routeLeg.status
            }
        }

        const startingLeg = legs[0]
        const endingLeg = legs[legs.length - 1]

        return {
            tour: {
                id: tour.id,
                status: tour.status,
                tour_type: tour.tour_type,
                is_delay: tour.is_delay,
                tour_date: tour.tour_date,
                tour_time: tour.tour_time,
                driver_id: tour.driver_id,
            },
            truck: {
                driver_name: driverData ? driverData.name : '',
                driver_mobile: driverData ? driverData.mobile_number : '',
            },
            tourMetrics: {
                numPoints: tourRoute.length - 2,
                startingLocation: startingLeg?.pickup_location,
                endingLocation: endingLeg?.dropoff_location,
            },
            bookings,
            stops,
        }
    }

    async tourDetailsOld(tourId: number): Promise<any> {
        let resObj: any = {tour: {}, tourItems: [], tourPoints: {}}
        let tour = await this.toursRepository.findOneBy({id: tourId})
        // //console.log(tour)
        // //console.log(tour.id)
        let newSequenceArray: any = []
        if(tour.sequence != null) {
            let sequence = JSON.parse(tour.sequence);
            for await (const sData of sequence) {
                const key = Object.keys(sData)[0]
                const keyData = key.split(".")
                const bookingId = await this.utilsService.getBookingId(keyData[0]);
                newSequenceArray[sData[key]] =bookingId + " "+keyData[1];
           }
           newSequenceArray = Object.keys(newSequenceArray).reduce((a, c) => (a[c] = newSequenceArray[c], a), {})
         } 

        let tourDetails = await this.tourBookingDetails.findBy({tour_id: tour.id})
        // //console.log(tourDetails)
        for await (const tourDetail of tourDetails) {
            let booking: any = {}
            let pickuptime_flexiblity_status = ''
            let pickup_flexible_time = ''
            let dropofftime_flexiblity_status = ''
            let dropoff_flexible_time = ''
            if(tourDetail.booking_id != null) {
                booking = await this.bookingRepository.findOneBy({id: tourDetail.booking_id})
                // resObj.bookings.push(booking)
                pickuptime_flexiblity_status = booking.pickuptime_flexiblity_status
                pickup_flexible_time = booking.pickup_flexible_time;
                dropofftime_flexiblity_status = booking.dropofftime_flexiblity_status;
                dropoff_flexible_time = booking.dropoff_flexible_time;
            } else {
                let centerDetails = await this.bookingConsolidationCentersRepository.findOneBy({id: tourDetail.booking_at_center_id})
                booking = await this.bookingRepository.findOneBy({id: centerDetails.booking_id})
                // resObj.bookings.push(booking)
                
                if(centerDetails.drop_at == 'consolidation_center') {
                    pickuptime_flexiblity_status = booking.pickuptime_flexiblity_status
                    pickup_flexible_time = booking.pickup_flexible_time;
                    dropofftime_flexiblity_status = 'Fixed';
                    dropoff_flexible_time = null;
                }else{
                    pickuptime_flexiblity_status = 'Fixed';
                    pickup_flexible_time = null;
                    dropofftime_flexiblity_status = booking.dropofftime_flexiblity_status;
                    dropoff_flexible_time = booking.dropoff_flexible_time;
                }
            }
            let commodity_type = await this.utilsService.getCatName(booking.commodity_type)
            // //console.log(booking.pickup_time)
            let bookingDetails = {
                "id": booking.id,
                "main_booking_id": booking.id,
                "customer_name": await this.utilsService.getName(booking.customer_id),
                "customer_device_token": await this.utilsService.getDeviceToken(booking.customer_id),
                "engaged_consolidation_manager": await this.utilsService.getName(booking.engaged_consolidation_manager),
                "pickup_location": booking.pickup_location,
                "pickup_date": moment(booking.pickup_time).format('d-m-Y'),
                "pickup_time": moment(booking.pickup_time).format('hh:mm A'),
                "pickuptime_flexiblity_status": pickuptime_flexiblity_status,
                "pickup_flexible_time": pickup_flexible_time,
                "dropoff_location": booking.dropoff_location,
                "dropoff_date": moment(booking.dropoff_time).format('d-m-Y'),
                "dropoff_time": moment(booking.dropoff_time).format('hh:mm A'),
                "dropofftime_flexiblity_status": dropofftime_flexiblity_status,
                "dropoff_flexible_time": dropoff_flexible_time,
                "commodity_type": commodity_type == 'Others' ? booking.other_commodity_name :  commodity_type,
                "truck_owner_status": booking.truck_owner_status,
                "commodity_weight": booking.commodity_weight,
                "weight_unit": await this.utilsService.getCatName(booking.weight_unit),
                "commodity_whole_volume": booking.commodity_whole_volume,
                "volume_unit":  await this.utilsService.getCatName(booking.volume_unit),
                "commodity_length": booking.commodity_length,
                "length_unit":  await this.utilsService.getCatName(booking.length_unit),
                "commodity_breadth": booking.commodity_breadth,
                "breadth_unit":  await this.utilsService.getCatName(booking.breadth_unit),
                "commodity_height": booking.commodity_height,
                "height_unit":  await this.utilsService.getCatName(booking.height_unit),
                "packaging_type":  await this.utilsService.getCatName(booking.packaging_type),
                "consignment_image":  booking.consignment_image,
                "receiver_name": booking.receiver_name,
                "receiver_contact": booking.receiver_contact,
                "quotation_status": booking.quotation_status,
                "quotation_payment_status": booking.quotation_payment_status,
                "booking_confirm_status": booking.booking_confirm_status,
                "instruction": booking.instruction,
                "status": booking.status,
                "tour_status": booking.tour_status,
                "booking_at_consolidation_center_tour_status_flag": 0,
                "booking_at_consolidation_center_tour_status": '',
                "assign_tour_status": booking.assign_tour_status,
                "created_date": moment(booking.created_at).format('d-m-Y'),
                "created_time": moment(booking.created_at).format('hh:mm A')
            }
            // //console.log(bookingDetails)
            let tourData = {
                ...tourDetail,
                tour_item: bookingDetails 
            }
            // resObj.tourItems.push(tourData)
            resObj.tourPoints["tb_"+booking.id] = tourData
        }
        const driverData = await this.driversRepository.findOneBy({user_id: tour.driver_id})
        // const truckData = await this.trucksRepository.findOneBy({id: driverData.truck_id})
        let tourTruckData: any = {}
        tourTruckData['driver_name'] = driverData.name;
        tourTruckData['driver_mobile'] = driverData.mobile_number;
        
        // tourTruckData['driver_name'] = getDriverName($tour_data->driver_id);
        // tourTruckData['driver_mobile'] = getDriverMobile($tour_data->driver_id);
        // tourTruckData['truck_no'] = getTruckRegistrationNumber($tour_data->truck_id);
        // tourTruckData['truck_modal'] = getTruckmodal($tour_data->truck_id);
        // $data['tours'] = $tours;
        resObj.truck = tourTruckData;
        resObj.sequence = newSequenceArray;
        resObj.sequenceData = await this.tourRouteRepository.find({ where: {tour_id: tour.id}, order: {sequence_number : 'ASC'}})
        resObj.tour = tour
        return resObj;
    }

    async toursList(reqBody: any): Promise<any> {
        let responseObject = {tours: [], count: 0}
        let whereCon = {}
        if(reqBody.start_date) {
            whereCon['created_at'] = Between(new Date(reqBody.start_date), new Date(reqBody.end_date))
        }
        if(reqBody.driver_id) {
            whereCon['driver_id'] = reqBody.driver_id
        }
        if(reqBody.id) {
            whereCon['id'] = reqBody.id
        }
        if(reqBody.status) {
            whereCon['status'] = reqBody.status
        }
        if(reqBody.tour_date) {
            whereCon['tour_date'] = reqBody.tour_date
        }

        if(reqBody.tour_status) {
            whereCon['tour_status'] = reqBody.tour_status
        }

        if(reqBody.booking_type) {
            whereCon['tour_for'] = reqBody.booking_type
        }
        //console.log(whereCon)
        let [items, count] = await this.toursRepository.findAndCount({where: whereCon, order:{current_status: 'ASC', id: 'DESC'}, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) })
        // //console.log(items)
        responseObject.count = count
        for await (const tourD of items) {
            console.log(tourD)
            let resObj: any = {tour: {}, tourItems: [], tourPoints: {}}
            const bsData = await this.bookingService.getBSByTourId(tourD.id)
            let tour: any = { ...tourD, tour_status: bsData ? bsData.status : ''}
            let tourRoute = await this.tourRouteRepository.find({ where: {tour_id: tour.id}, order: {sequence_number : 'ASC'}})

            // let tourDetails = await this.tourBookingDetails.findBy({tour_id: tour.id})
            // //console.log("tourRoute")
            // //console.log(tourRoute)
            for await (const tourDetail of tourRoute) {
                // let booking: any = {}
                let pickuptime_flexiblity_status = ''
                let pickup_flexible_time = ''
                let dropofftime_flexiblity_status = ''
                let dropoff_flexible_time = ''
                //console.log(tourDetail)
                
                let booking = await this.bookingRepository.findOneBy({id: tourDetail.booking_id})
                let tripData = await this.tripRepo.findOneBy({trip_id: tourDetail.trip_id})
                // //console.log(tripData)
                // //console.log(tourDetail.trip_id)
                /*if(tourDetail.booking_id != null) {
                    booking = await this.bookingRepository.findOneBy({id: tourDetail.booking_id})
                    // resObj.bookings.push(booking)
                    pickuptime_flexiblity_status = booking.pickuptime_flexiblity_status
                    pickup_flexible_time = booking.pickup_flexible_time;
                    dropofftime_flexiblity_status = booking.dropofftime_flexiblity_status;
                    dropoff_flexible_time = booking.dropoff_flexible_time;
                } else {
                    let centerDetails = await this.bookingConsolidationCentersRepository.findOneBy({id: tourDetail.booking_at_center_id})
                    booking = await this.bookingRepository.findOneBy({id: centerDetails.booking_id})
                    // resObj.bookings.push(booking)
                    
                    if(centerDetails.drop_at == 'consolidation_center') {
                        pickuptime_flexiblity_status = booking.pickuptime_flexiblity_status
                        pickup_flexible_time = booking.pickup_flexible_time;
                        dropofftime_flexiblity_status = 'Fixed';
                        dropoff_flexible_time = null;
                    }else{
                        pickuptime_flexiblity_status = 'Fixed';
                        pickup_flexible_time = null;
                        dropofftime_flexiblity_status = booking.dropofftime_flexiblity_status;
                        dropoff_flexible_time = booking.dropoff_flexible_time;
                    }
                } */
                //console.log(booking.id)
                let commodity_type = await this.utilsService.getCatName(booking.commodity_type)
                // //console.log(booking.pickup_time)
                //console.log(tripData.pickup_time)
                let bookingDetails = {
                    "id": tripData ? tripData.id : '',
                    "trip_id": tripData ? tripData.trip_id : '',
                    "main_booking_id": booking.id,
                    "customer_name": await this.utilsService.getName(booking.customer_id),
                    "customer_device_token": await this.utilsService.getDeviceToken(booking.customer_id),
                    "engaged_consolidation_manager": await this.utilsService.getName(booking.engaged_consolidation_manager),
                    "pickup_location": tripData ? tripData.pickup_location : '',
                    "pickup_date": tripData ? moment(tripData.pickup_time).format('d-m-Y') : '',
                    "pickup_time":tripData ?  moment(tripData.pickup_time).format('hh:mm A') : '',
                    "pickuptime_flexiblity_status": pickuptime_flexiblity_status,
                    "pickup_flexible_time": pickup_flexible_time,
                    "dropoff_location": tripData ? tripData.dropoff_location : '',
                    "dropoff_date": tripData ? moment(tripData.dropoff_time).format('d-m-Y') : '',
                    "dropoff_time": tripData ? moment(tripData.dropoff_time).format('hh:mm A'): '',
                    "dropofftime_flexiblity_status": dropofftime_flexiblity_status,
                    "dropoff_flexible_time": dropoff_flexible_time,
                    "commodity_type": commodity_type == 'Others' ? booking.other_commodity_name :  commodity_type,
                    // "truck_owner_status": tripData.truck_owner_status,
                    "commodity_weight": booking.commodity_weight,
                    "weight_unit": await this.utilsService.getCatName(booking.weight_unit),
                    "commodity_whole_volume": booking.commodity_whole_volume,
                    "volume_unit":  await this.utilsService.getCatName(booking.volume_unit),
                    "commodity_length": booking.commodity_length,
                    "length_unit":  await this.utilsService.getCatName(booking.length_unit),
                    "commodity_breadth": booking.commodity_breadth,
                    "breadth_unit":  await this.utilsService.getCatName(booking.breadth_unit),
                    "commodity_height": booking.commodity_height,
                    "height_unit":  await this.utilsService.getCatName(booking.height_unit),
                    "packaging_type":  await this.utilsService.getCatName(booking.packaging_type),
                    "consignment_image":  booking.consignment_image,
                    "receiver_name": booking.receiver_name,
                    "receiver_contact": booking.receiver_contact,
                    "quotation_status": booking.quotation_status,
                    "quotation_payment_status": booking.quotation_payment_status,
                    "booking_confirm_status": booking.booking_confirm_status,
                    "instruction": booking.instruction,
                    "status": booking.status,
                    "tour_status": booking.tour_status,
                    "booking_at_consolidation_center_tour_status_flag": 0,
                    "booking_at_consolidation_center_tour_status": '',
                    "assign_tour_status": booking.assign_tour_status,
                    "created_date": moment(booking.created_at).format('d-m-Y'),
                    "created_time": moment(booking.created_at).format('hh:mm A')
                }
                // //console.log(bookingDetails)
                let tourData = {
                    ...tourDetail,
                    tour_item: bookingDetails 
                }
                // resObj.tourItems.push(tourData)
                resObj.tourPoints["tb_"+tourDetail.id] = tourData
            }
            const driverData = await this.driversRepository.findOneBy({user_id: tour.driver_id})
            // const truckData = await this.trucksRepository.findOneBy({id: driverData.truck_id})
            let tourTruckData: any = {}
            tourTruckData['driver_name'] = driverData ? driverData.name : '';
            tourTruckData['driver_mobile'] = driverData ? driverData.mobile_number : '';
            
            // tourTruckData['driver_name'] = getDriverName($tour_data->driver_id);
            // tourTruckData['driver_mobile'] = getDriverMobile($tour_data->driver_id);
            // tourTruckData['truck_no'] = getTruckRegistrationNumber($tour_data->truck_id);
            // tourTruckData['truck_modal'] = getTruckmodal($tour_data->truck_id);
            // $data['tours'] = $tours;
            resObj.truck = tourTruckData;
            // resObj.sequence = newSequenceArray;
            resObj.sequenceData = tourRoute
            resObj.tour = tour
            responseObject.tours.push(resObj)
        }
        return responseObject
    }

    async estimateTimeByLatLong(fromLoc: any, toLoc: any) {
        let duration = 0
        const dData = await this.utilsService.getTimeFromGoogle(fromLoc, toLoc);
        if(dData.status == 'OK' && dData.rows.length) {
            duration = (dData.rows[0].elements && dData.rows[0].elements.length) ? dData.rows[0].elements[0].duration.value : 0
            if(duration > 0) {
                duration = Math.round(duration/60)
            }
        }
        return duration
    }

    async acceptTour(reqBody: any): Promise<any> {
        let estimateTime = '';
        await this.driversRepository.update({user_id: reqBody.driver_id}, {'status': "Engaged"})
        await this.trucksRepository.update({id: reqBody.truck_id}, {'status': "Engaged"})
        const acceptTime = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss')
        await this.toursRepository.update({id: reqBody.tour_id}, {'truck_owner_id': reqBody.truck_owner_id, 'truck_owner_status': 'Accepted', 'status': 'Accepted', current_status: 2, accept_time: acceptTime})
        const tourData = await this.toursRepository.findOneBy({id: reqBody.tour_id})
        // const driverName = await this.utilsService.getName(tourData.driver_id)
        const driverDetails = await this.driversRepository.findOneBy({user_id: tourData.driver_id})
        const driverName = driverDetails.name
        const truckDetails = await this.trucksRepository.findOneBy({id: driverDetails.truck_id})
        const tourBookingDetailsData = await this.tourBookingDetails.find({where:{tour_id: reqBody.tour_id}})
        if(reqBody.latitude && reqBody.longitude) {
            let tourRoute = await this.tourRouteRepository.find({where: {tour_id: reqBody.tour_id}, order: {sequence_number: 'ASC'}})
            const seqData = tourRoute[0];
            const time = await this.estimateTimeByLatLong({latitude: reqBody.latitude, longitude: reqBody.longitude}, {latitude: seqData.location.coordinates[1], longitude: seqData.location.coordinates[0]})
            estimateTime = moment().add(time, "minutes").tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss')
            console.log("estimateTime")
            console.log(estimateTime)
            await this.tourRouteRepository.update({id: seqData.id}, {estimated_time: estimateTime})
        }
        for(let bDetails of tourBookingDetailsData) {
            await this.bookingRepository.update({id: bDetails.booking_id}, {'driver_name': driverName, 'driver_mobile': driverDetails.mobile_number, 'vehicle_number': truckDetails.registration_number})
            const bookingDetails = await this.bookingRepository.findOneBy({id: bDetails.booking_id})
            if(bookingDetails.status == 'Tour Created') {
                const driverToken = await this.utilsService.getDeviceToken(bookingDetails.customer_id)
                const TITLE = 'Vehicle and driver details for booking id #'+bookingDetails.id
                const BODY = 'Mr. '+driverName+' will arrive at the pickup location soon. Your vehicle no is '+truckDetails.registration_number+'.'
                if(driverToken) {
                    await this.utilsService.sendPushNotification(TITLE, BODY, driverToken.split(","))
                }
                
            }
            const bsReq = {
                booking_id: bookingDetails.id,
                status: 'Accepted',
                created_by: bookingDetails.customer_id,
                created_at: new Date(),
                updated_at: new Date()
            }
            this.bookingService.addBookingStatus(bsReq)
            
        }
        await this.locService.calcDriverSessionDistance(tourData.driver_id, tourData.id)
        return {tour_id: reqBody.tour_id, driver_name: driverName}
    }

    async startTour(reqBody: any): Promise<any> {
        await this.toursRepository.update({id: reqBody.tour_id}, {'status': 'In Progress'})
        const tourData = this.toursRepository.findOneBy({id: reqBody.tour_id})
        return {tour_id: reqBody.tour_id}
        
    }

    async uploadOdometer(file: any, tour_id: number) {
        const { originalname } = file;
        const bucketS3 = this.configService.get('ODOMETER_BUCKET_NAME');
        const uploadedData: any = await this.uploadS3(file.buffer, bucketS3, originalname);
        return uploadedData.Location
    }

    async tourDocuments(file: any, tour_id: number) {
        const { originalname } = file;
        const bucketS3 = this.configService.get('TOUR_DOCUMENTS_BUCKET_NAME');
        const uploadedData: any = await this.uploadS3(file.buffer, bucketS3, originalname);
        return uploadedData.Location
    }

    async uploadDeliveryProof(file: any, seqNum: number, lat?: number, lng?: number): Promise<any> {
        const timestamp = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss')
        const latText = lat != null ? `Lat: ${lat}` : 'Lat: N/A';
        const lngText = lng != null ? `Lng: ${lng}` : 'Lng: N/A';

        const image = await Jimp.read(file.buffer);
        const imgW = image.width;
        const imgH = image.height;

        const fontPath = path.join(
            process.cwd(), 'node_modules', '@jimp', 'plugin-print',
            'fonts', 'open-sans', 'open-sans-32-white', 'open-sans-32-white.fnt'
        );
        const font = await loadFont(fontPath);

        const padding = 12;
        const lineHeight = 38;
        const lines = [latText, lngText, timestamp];
        const boxH = lineHeight * lines.length + padding * 2;
        const boxY = imgH - boxH - 12;

        // draw semi-transparent black background strip
        const overlay = new Jimp({ width: imgW, height: boxH, color: 0x00000099 });
        image.composite(overlay, 0, boxY);

        // print each line of text
        lines.forEach((line, i) => {
            image.print({ font, x: padding, y: boxY + padding + i * lineHeight, text: line });
        });

        const stampedBuffer = await image.getBuffer('image/jpeg', { quality: 85 });

        const bucketS3 = this.configService.get('DELIVERY_PROOF_BUCKET_NAME');
        const fileName = `delivery_proof_seq${seqNum}_${Date.now()}.jpg`;
        const uploadedData: any = await this.uploadS3(stampedBuffer, bucketS3, fileName);
        const imageUrl = uploadedData.Location;

        const tourRoute = await this.tourRouteRepository.findOne({ where: { id: seqNum } });

        const proof = this.deliveryProofRepo.create({
            seq_num: seqNum,
            booking_id: tourRoute?.booking_id ?? null,
            image_url: imageUrl,
            lat: lat ?? null,
            lng: lng ?? null,
        });
        await this.deliveryProofRepo.save(proof);
        return proof;
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

    async sendTourOtp(mobile: string[]) {
        try {
            for await (let mobileNumber of mobile) {
                await this.utilsService.sendOtp(mobileNumber)
            }
            return true
        } catch (error) {
            return false
        }
    }

    async verifyTourOtp(mobile: string, otp: number) {
        try {
            return await this.utilsService.verifyOtp(mobile, otp)
        } catch (error) {
            return false
        }
    }
    
    async truckerTour(reqBody: any): Promise<any> {
        const exceptStatus = ['Completed', 'Rejected']
        const tourDetails = await this.toursRepository.findOne({where: {driver_id: reqBody.truck_owner_id, status: Not(In(exceptStatus))}, order: {id: "ASC"}})
        if(tourDetails) {
            return {tour_id: tourDetails.id}
        }  else {
            return null
        }
    }
    
    async rejectTour(reqBody: any): Promise<any> {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tourData = await this.toursRepository.findOneBy({id: reqBody.tour_id})
        if(tourData.status == 'Assigned') {
            await this.driversRepository.update({user_id: reqBody.driver_id}, {'status': "Available"})
            await this.trucksRepository.update({id: reqBody.truck_id}, {'status': "Available"})
            await this.toursRepository.update({id: reqBody.tour_id}, {'truck_owner_id': reqBody.truck_owner_id, 'truck_owner_status': 'Rejected', 'status': 'Rejected',  current_status:  4})
            await this.driverSessionDistance.delete({tour_id: reqBody.tour_id})
            response.data = {tour_id: reqBody.tour_id, driver_name: await this.utilsService.getDriverName(reqBody.driver_id)}
        } else {
            response.success = false
            response.message = 'Tour already accepted, Please contact the Manager!'
        }
        return response
    }

    async updateSessionDetails(tourData: any, tourSeqData: any): Promise<any> {
        // const tourDistance = await this.locService.calcTourDistance(tourData.id)
        const firstBookingData = await this.bookingRepository.findOneBy({id: tourSeqData[0].booking_id})
        const lastBookingData = await this.bookingRepository.findOneBy({id: tourSeqData[tourSeqData.length - 1].booking_id})
        let firstBookingTime = moment(firstBookingData.reached_pickup)
        let lastBookingTime = moment(lastBookingData.completed_drop)
        // let total_time = lastBookingTime.diff(firstBookingTime, 'minutes');
        let sessionData = await this.driverService.getClosedSession(tourData.driver_id, firstBookingTime.format('YYYY-MM-DD'))
        //console.log("sessionData")
        //console.log(sessionData)
        if(!sessionData) {
            const seesionInput = {
                "start_location": tourSeqData[0].id,
                "user_id": tourData.driver_id,
                "status": true,
                "total_time": 0, // minutes
                "total_distance": 0, // meters
                "start_odometer_reading": 1050 ,// this should remove and come from trucker upload
                "end_odometer_reading": 1050 ,// this should remove and come from trucker upload
                // "created_at": reqBody.created_at ? reqBody.created_at : new Date(),
                "session_start_time": firstBookingData.reached_pickup,
                "session_end_time": lastBookingData.completed_drop,
                "is_closed_session": true
            }
            sessionData = await this.driverService.createTourSession(seesionInput)
        }
        //console.log(tourSeqData)
        /*for (let seqData of tourSeqData) {
            let bsData = await this.bookingService.getBookingStatusByFilter({booking_id: seqData.booking_id, tour_id: tourData.id, status: (seqData.transport_type == 'pickup' ? 'Reached pickup' : 'Completed drop')})
            //console.log("bsData")
            //console.log(bsData)
            let location = {
                "latitude": seqData.location.coordinates[1],
                "loc_time": bsData.created_at,
                "longitude": seqData.location.coordinates[0],
                "sequence_number": [seqData.id],
                "session_id": sessionData.id,
                "tour_id": tourData.id,
                "user_id": tourData.driver_id
            }
            await this.locService.create(location)
        }*/
        return true
    }

    async updateTourAsCompleted(tourId: number): Promise<any> {
        await this.tourRouteRepository.update({tour_id: tourId}, {status: 'Completed'});
        await this.toursRepository.update({id: tourId}, {status: 'Completed', 'current_status': 3})
        return
    }
    async addTour(reqBody: any): Promise<any> {
        let statusData = []
        let bookingDate: any = ''
        let bData = await this.bookingRepository.findOneBy({id: reqBody.booking_id[0]})
        bookingDate = bData.pickup_time
        for (let bId of reqBody.booking_id) {
            bData = await this.bookingRepository.findOneBy({id: bId})
            bookingDate = bData.pickup_time
            if (bData.is_closed_booking) {
                reqBody['is_closed_tour'] = true
                reqBody['created_at'] = bData.pickup_time
            }
        }
        const tourInput: any = {
            "tour_date": moment(reqBody.is_closed_tour ? bookingDate : new Date()).tz('Asia/Calcutta').format('YYYY-MM-DD'),
            "tour_time": moment(reqBody.is_closed_tour ? bookingDate : new Date()).tz('Asia/Calcutta').format('HH:mm:ss'),
            "manager_status": reqBody.is_closed_tour ? 'Accepted' : 'Pending',
            "truck_owner_status": reqBody.is_closed_tour ? 'Accepted' : 'Pending',
            "created_by": 1,
            "tour_fare": reqBody.tour_fare,
            "engaged_consolidation_manager": reqBody.engaged_consolidation_manager,
            "driver_id": reqBody.driver_id,
            "status": reqBody.is_closed_tour ? 'Completed' : "Assigned",
            "current_status": reqBody.is_closed_tour ? 3 : 1,
            "created_at": reqBody.is_closed_tour ? reqBody.created_at : new Date(),
            "is_closed_tour": reqBody.is_closed_tour ? reqBody.is_closed_tour : false,
            
        }
        if(bData.booking_type) {
            tourInput['tour_for'] = bData.booking_type
        } else {
            tourInput['tour_for'] = 'GoodMove'
        }
        const tourData = await this.toursRepository.save(tourInput)
        // //console.log(tourData)
        for(let tRoute of reqBody.sequence) {
            const lat = tRoute.transport_type == 'pickup' ? tRoute.pickup_lat : tRoute.dropoff_lat;
            const long = tRoute.transport_type == 'pickup' ? tRoute.pickup_long : tRoute.dropoff_long;
            const pointObject: Point = {
                type: "Point",
                coordinates: [long,lat]
            };
            let tRouteInput = {
                tour_id: tourData.id,
                booking_id: tRoute.booking_id,
                trip_id: tRoute.trip_id,
                transport_type: tRoute.transport_type,
                consolidation_center_id: tRoute.consolidation_center_id,
                sequence_number: tRoute.sequence_number,
                location: pointObject,
                created_by: 1,
                location_address: tRoute.location_address,
                status: reqBody.is_closed_tour ? 'Completed' : ''
            }
            const statusObj = {
                tour_id: tourData.id,
                booking_id: tRoute.booking_id,
                trip_id: tRoute.trip_id
            }
            statusData.push(statusObj)
            // //console.log(tRouteInput)
            const existingSeqData = await this.tourRouteRepository.find({where: {booking_id: tRoute.booking_id, trip_id: tRoute.trip_id, transport_type: tRoute.transport_type}})
            if(existingSeqData && existingSeqData.length) {
                let updData = {tour_id: tourData.id, sequence_number: tRoute.sequence_number}
                if(existingSeqData[0].status == '' || existingSeqData[0].status == null) {
                    updData['estimated_time'] = null;
                    updData['completed_time'] = null;
                }
                const seqData = await this.tourRouteRepository.update({booking_id: tRoute.booking_id, trip_id: tRoute.trip_id, transport_type: tRoute.transport_type}, updData)
            } else {
                const seqData = await this.tourRouteRepository.save(tRouteInput);
            }
            
            await this.tripRepo.update({trip_id: tRoute.trip_id}, {tour_id: tourData.id})
        }
        let driverData = await this.driversRepository.findOneBy({user_id: reqBody.driver_id})
        for (let bId of reqBody.booking_id) {
            let updBooking = {}
            updBooking["assign_tour_status"] = 1 
            updBooking["assign_tour_status_graph"] = 1
            // if(reqBody.is_closed_tour) {
                updBooking['driver_name'] = driverData.name
                updBooking['driver_mobile'] = driverData.mobile_number
                const truckData = await this.trucksRepository.findOneBy({id: driverData.truck_id})
                updBooking['vehicle_number'] = truckData.registration_number
            // }
            const bUpdateData = await this.bookingRepository.update(bId, updBooking)
            const tourBookingIput: any = {
                "tour_id": tourData.id,
                "booking_id": bId,
                "booking_fare": 100
            }
            const tourBookingDetailsData = await this.tourBookingDetails.save(tourBookingIput)
            
        }
        const statusBookings = statusData.filter((v,i,a)=>a.findIndex(v2=>['tour_id','booking_id', 'trip_id'].every(k=>v2[k] ===v[k]))===i)
        
        for(let statusB of statusBookings) {
            let bs = await this.bookingService.getBSByBookingTourId(statusB.booking_id, 0)
            if(!bs) {
                const bsReq = {
                    booking_id: statusB.booking_id,
                    status: 'Tour Created',
                    created_by: 1,
                    trip_id: statusB.trip_id,
                    tour_id: statusB.tour_id,
                    created_at: reqBody.is_closed_tour ? reqBody.created_at : new Date(),
                    updated_at: reqBody.is_closed_tour ? reqBody.created_at : new Date()
                }
                await this.bookingService.addBookingStatus(bsReq)
            } 
            await this.bookingService.updateBookingStatus({booking_id: statusB.booking_id, tour_id: 0}, {tour_id: statusB.tour_id})
            if(reqBody.is_closed_tour) {
                let tourStatus = {
                    'reached_pickup': 'Reached pickup',
                    'completed_pickup': 'Completed pickup',
                    'reached_drop': 'Reached drop',
                    'completed_drop': 'Completed drop',
                    'tour_completed': 'Tour Completed'
                }
                let tourStatusSeq = [
                    'reached_pickup',
                    'completed_pickup',
                    'reached_drop',
                    'completed_drop',
                    'tour_completed'
                ]
                for(const status of tourStatusSeq) {
                    const bsReq = {
                        booking_id: statusB.booking_id,
                        status: tourStatus[status],
                        created_by: 1,
                        trip_id: statusB.trip_id,
                        tour_id: statusB.tour_id,
                        created_at: reqBody[status],
                        updated_at: new Date()
                    }
                    await this.bookingService.addBookingStatus(bsReq)
                }

            }
        }
        // let driverData = await this.driversRepository.findOneBy({user_id: reqBody.driver_id})
        //console.log(driverData)
        if(driverData) {
            let tData = {
                "tour_id": tourData.id,
                "truck_owner_id": driverData.truck_owner_id,
                "driver_id": driverData.id,
                "truck_id": driverData.truck_id
            }
            const tourAssignDetails = await this.tourAssignTruckDriverRepository.findOneBy({tour_id: tourData.id})
            //console.log(tourAssignDetails)
            if(tourAssignDetails) {
                await this.tourAssignTruckDriverRepository.update({tour_id: tourData.id}, tData)
            }  else {
                //console.log(tData)
                await this.tourAssignTruckDriverRepository.save(tData)
            }
            // await this.toursRepository.update({id: tourData.id}, {'truck_owner_id': driverData.truck_owner_id, 'driver_id': driverData.user_id, 'truck_owner_status': 'Assigned', 'status': 'Assigned', current_status: 1})
            if(!reqBody.is_closed_tour) {
                const driverToken = await this.utilsService.getDeviceToken(reqBody.driver_id)
                const TITLE = 'Tour #'+tourData.id
                const BODY = 'A new tour has been assigned to you. Please accept the tour.'
                if(driverToken) {
                    await this.utilsService.sendPushNotification(TITLE, BODY, driverToken.split(","))
                }
                
            }
            
        }
        if(reqBody.is_closed_tour) {
            // let tourSeqData = await this.tourRouteRepository.find({where:{tour_id: tourData.id}})
            // await this.updateSessionDetails(tourData, tourSeqData)
            await this.locService.calcDriverSessionDistance(reqBody.driver_id, tourData.id)
        } else {
            // await this.locService.calcDriverSessionDistance(reqBody.driver_id)
        }

        await this.updateVehicleLiveData(tourData.id, {isNew: true})
        return tourData
    }

    async updateVehicleLiveData(tourId: number, updateData: any = {}): Promise<any> {
        const tourStatus = ['Completed']
        let tourAssignData = await this.tourAssignTruckDriverRepository.findOne({where: {tour_id: tourId}})
        if(tourAssignData) {
            const tourData = await this.toursRepository.findOneBy({id: tourId})
            let isPreviousToursExist = false
            const beforeTours = await this.toursRepository.find({where:{driver_id: tourAssignData.driver_id, id: LessThan(tourId)}, order: {tour_date: 'DESC', tour_time: 'DESC'}})
            if(beforeTours.length) {
                if(beforeTours[0].status != 'Complete') {
                    isPreviousToursExist = true
                }
            }
            if(!isPreviousToursExist) {
                let vLiveData = await this.vehicleLiveDataRepo.findOne({where: {driver_id: tourData.driver_id}})
                if(vLiveData) {
                    // update live data with new tour
                    if(updateData.isNew) {
                        await this.vehicleLiveDataRepo.update({driver_id: tourData.driver_id}, {tour_id: tourId, volume: '0', weight: '0'})
                    } else {
                        let volume = parseFloat(vLiveData.volume)
                        let weight = parseFloat(vLiveData.volume)
                        const booking = await this.bookingRepository.findOneBy({id: updateData.booking_id})
                        if(updateData.pickup) {
                            volume += parseInt(booking.commodity_whole_volume) == 1 ? 0 : parseInt(booking.commodity_whole_volume)
                            weight += parseInt(booking.commodity_weight) 
                        } else {
                            volume -= parseInt(booking.commodity_whole_volume) == 1 ? 0 : parseInt(booking.commodity_whole_volume)
                            weight -= parseInt(booking.commodity_weight) 
                        }
                        await this.vehicleLiveDataRepo.update({driver_id: tourData.driver_id}, {tour_id: tourId, volume: volume.toString(), weight: weight.toString()})
                    }
                    
                } else {
                    await this.vehicleLiveDataRepo.save({driver_id: tourData.driver_id, tour_id: tourId, volume: '0', weight: '0', vehicle_id: tourAssignData.truck_id})
                }
            }
            
        }
        
    }

    async updateTourDriver(reqBody: any): Promise<any> {
        let driverData = await this.driversRepository.findOneBy({user_id: reqBody.driver_id})
        if(driverData) {
            let tData = {
                "tour_id": reqBody.tour_id,
                "truck_owner_id": driverData.truck_owner_id,
                "driver_id": driverData.id,
                "truck_id": driverData.truck_id
            }
            const tourAssignDetails = await this.tourAssignTruckDriverRepository.findOneBy({tour_id: reqBody.tour_id})
            if(tourAssignDetails) {
                await this.tourAssignTruckDriverRepository.update({tour_id: reqBody.tour_id}, tData)
            }  else {
                await this.tourAssignTruckDriverRepository.create(tData)
            }
            await this.toursRepository.update({id: reqBody.tour_id}, {'truck_owner_id': driverData.truck_owner_id, 'driver_id': driverData.user_id, 'truck_owner_status': 'Assigned', 'status': 'Assigned', current_status: 1})
        }
        return driverData
    }

    async updateTripStatus(trip_id: string, status: string): Promise<any> {
        const upds = await this.tripRepo.update({trip_id: trip_id}, {status: status})
        return upds
    }

    async completeTourRoute(seqNum: number): Promise<any> {
        const seqData = await this.tourRouteRepository.findOneBy({id: seqNum})
        const upds = await this.tourRouteRepository.update({id: seqNum}, {status: 'Completed'})
        await this.updateTripStatus(seqData.trip_id, 'Completed '+seqData.transport_type)
        const bsReq = {
            booking_id: seqData.booking_id,
            status: 'Completed'+ ' ' +seqData.transport_type,
            created_by: 1,
            trip_id: seqData.trip_id,
            tour_id: seqData.tour_id,
            created_at: new Date(),
            updated_at: new Date()
        }
        await this.bookingService.addBookingStatus(bsReq)
        const tourData = await this.toursRepository.findOneBy({id: seqData.tour_id})
        const bookingDetails = await this.bookingRepository.findOneBy({id: seqData.booking_id})
        if(seqData.transport_type == 'pickup' && (bookingDetails.pickup_location == seqData.location_address)) {
            const driverDetails = await this.driversRepository.findOneBy({user_id: tourData.driver_id})
            const dName = driverDetails.name
            const userToken = await this.utilsService.getDeviceToken(bookingDetails.customer_id)
            const TITLE = 'Booking id #'+bookingDetails.id
            const BODY = 'Your consignment has been picked up by Mr. #'+dName+' on time!'
            if(userToken) {
                await this.utilsService.sendPushNotification(TITLE, BODY, userToken.split(","))
            }
            
        }

        if(seqData.transport_type == 'drop' && (bookingDetails.dropoff_location == seqData.location_address)) {
            const driverDetails = await this.driversRepository.findOneBy({user_id: tourData.driver_id})
            const dName = driverDetails.name
            const userToken = await this.utilsService.getDeviceToken(bookingDetails.customer_id)
            const TITLE = 'Booking id #'+bookingDetails.id
            const BODY = 'Your consignment has been delivered by Mr. #'+dName+'. Thank you for shipping with us!'
            if(userToken) {
                await this.utilsService.sendPushNotification(TITLE, BODY, userToken.split(","))
            }
        }
        return upds
    }

    async reachedTourRoute(seqNum: number): Promise<any> {
        const seqData = await this.tourRouteRepository.findOneBy({id: seqNum})
        const upds = await this.tourRouteRepository.update({id: seqNum}, {status: 'Reached'})
        await this.updateTripStatus(seqData.trip_id, 'Reached ' + seqData.transport_type)
        return upds
    }

    async checkAndUpdateTourComplete(tourData: any): Promise<any> {
        let seqOrder = await this.tourRouteRepository.find({where:{tour_id: tourData.id}, order: {sequence_number: 'DESC'}})
        if(seqOrder && !seqOrder.length) {
            if(seqOrder[0].status == 'Completed') {
                const completeTime = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss')
                await this.toursRepository.update({id: tourData.id}, {status: 'Completed', tour_status: 'Tour Completed', current_status: 3, complete_time: completeTime})
                await this.redis.del(`veh:tour:${tourData.driver_id}`);
                console.log(`[tourComplete] deleted Redis key veh:tour:${tourData.driver_id} for completed tour ${tourData.id}`);
            }
        }
    }

    async estimateNextSequence(seqData: any): Promise<any> {
        let estimateTime = ''
        let nextSeqData = await this.tourRouteRepository.findOne({where:{tour_id: seqData.tour_id, status: Not('Reached'), id: MoreThan(seqData.id)}, order:{id: 'ASC'}})
        if(nextSeqData) {
            const time = await this.estimateTimeByLatLong({latitude: seqData.location.coordinates[1], longitude: seqData.location.coordinates[0]}, {latitude: nextSeqData.location.coordinates[1], longitude: nextSeqData.location.coordinates[0]})
            estimateTime = moment().add(time, "minutes").tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss')
            await this.tourRouteRepository.update({id: nextSeqData.id}, {estimated_time: estimateTime})
        }
    }

    async updateSequence(reqBody: any): Promise<any> {
        const response = {updated: true}
        const seqIds = reqBody.seqNum
        let notes = '';
        
        for (let seqNum of seqIds) {
            let timeType = ''
            const seqData = await this.tourRouteRepository.findOneBy({id: seqNum})
            const upds = await this.tourRouteRepository.update({id: seqNum}, {status: reqBody.status, updated_at: new Date()})
            await this.updateTripStatus(seqData.trip_id, reqBody.status+ ' ' +seqData.transport_type)
            const tourData = await this.toursRepository.findOneBy({id: seqData.tour_id})
            if(tourData.truck_owner_status != 'Accepted') {
                const acceptTime = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss')
                await this.toursRepository.update({id: seqData.tour_id}, {'truck_owner_status': 'Accepted', status: 'Accepted', current_status: 2, accept_time: acceptTime, is_delay: false})
                const driverDetails = await this.driversRepository.findOneBy({user_id: tourData.driver_id})
                const truckData = await this.trucksRepository.findOneBy({id: driverDetails.truck_id})
                await this.bookingRepository.update({id: seqData.booking_id}, {'driver_name': driverDetails.name, 'driver_mobile': driverDetails.mobile_number, 'vehicle_number': truckData.registration_number})
                await this.tourRouteRepository.update({id: seqNum}, {estimated_time: acceptTime, completed_time: acceptTime})
                await this.locService.calcDriverSessionDistance(tourData.driver_id, tourData.id)
            }
            if(reqBody.is_from_manager) {
                await this.bookingRepository.update({id:seqData.booking_id}, {'is_manager_entered': true, is_manager_updated_tour: true})
            }
            const bookingDetails = await this.bookingRepository.findOneBy({id: seqData.booking_id})

            /*let activeSession = await this.driverService.getLatestSession(tourData.driver_id)
            console.log(activeSession.id)
            if(!activeSession.id) {
                isNewSession = true;
                const rndInt = Math.floor(Math.random() * 10) + 1
                setTimeout(async () => {
                    let activeSession = await this.driverService.getLatestSession(tourData.driver_id)
                    if(!activeSession.id) {
                        await this.driverService.createSession({id: seqData.id}, {user_id: tourData.driver_id})
                    }
                }, 1000*rndInt)
                // await this.driverService.createSession({id: seqData.id}, {user_id: tourData.driver_id})
            }*/
            if(reqBody.status == 'Reached') {
                
                timeType = 'reached_'
                const driverToken = await this.utilsService.getDeviceToken(tourData.driver_id)
                const TITLE = 'Tour Id #'+tourData.id
                const baseLoc = await this.baseLocationRepo.findOneBy({address: seqData.location_address})
                let BODY = 'You have reached the ';
                if(baseLoc) {
                    BODY = BODY + baseLoc.unique_id +' Base location.'
                } else {
                    BODY = BODY + seqData.transport_type +' location.'
                }
                if(driverToken && driverToken != "") {
                    await this.utilsService.sendPushNotification(TITLE, BODY, driverToken.split(","))
                }
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

                const completedTime = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss')
                await this.tourRouteRepository.update({id: seqNum}, {completed_time: completedTime})
                await this.updateTourStopStatus(tourData.driver_id, seqData.booking_id, seqData.transport_type, completedTime);
            }
            if(reqBody.status == 'Completed') {
                timeType = 'completed_'
                if(seqData.transport_type == 'pickup' && (bookingDetails.pickup_location == seqData.location_address)) {
                    const driverDetails = await this.driversRepository.findOneBy({user_id: tourData.driver_id})
                    await this.locService.calcDriverSessionDistance(tourData.driver_id, tourData.id)

                    const dName = driverDetails.name
                    const userToken = await this.utilsService.getDeviceToken(bookingDetails.customer_id)
                    const TITLE = 'Booking id #'+bookingDetails.id
                    const BODY = 'Your consignment has been picked up by Mr. '+dName+' on time!'
                    if(userToken) {
                        await this.utilsService.sendPushNotification(TITLE, BODY, userToken.split(","))
                    }
                }

                if(seqData.transport_type == 'drop' && (bookingDetails.dropoff_location == seqData.location_address)) {
                    const driverDetails = await this.driversRepository.findOneBy({user_id: tourData.driver_id})
                    const dName = driverDetails.name
                    await this.checkAndUpdateTourComplete(tourData)
                    //console.log(tourData.driver_id)
                    //console.log(dName)
                    const userToken = await this.utilsService.getDeviceToken(bookingDetails.customer_id)
                    const TITLE = 'Booking id #'+bookingDetails.id
                    const BODY = 'Your consignment has been delivered by Mr. '+dName+'. Thank you for shipping with us!'
                    if(userToken) {
                        await this.utilsService.sendPushNotification(TITLE, BODY, userToken.split(","))
                    }
                }
                await this.estimateNextSequence(seqData)
                await this.toursRepository.update({id: seqData.tour_id}, {'is_delay': false})
                this.updateVehicleLiveData(seqData.tour_id, {pickup: seqData.transport_type == 'pickup' ? true : false, booking_id: seqData.booking_id})
                const completedTime = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss')
                await this.updateTourStopStatus(tourData.driver_id, seqData.booking_id, seqData.transport_type, completedTime);
            }
            timeType = timeType + seqData.transport_type
            if(seqData.booking_id.toString() == seqData.trip_id) {
                notes = notes + seqData.booking_id + ":if-" + timeType+','
                this.bookingService.updateBookingStatusTime(seqData.booking_id, timeType)
            } else {
                let trips = await this.tripRepo.find({where:{booking_id: seqData.booking_id}, order: {trip_id: 'ASC'}})
                if(trips.length) {
                    //console.log(trips[0].trip_id,seqData.trip_id,seqData.transport_type,'pickup')
                    if(trips[0].trip_id == seqData.trip_id && seqData.transport_type == 'pickup') {
                        notes = notes + seqData.booking_id + ":el-" + timeType+','
                        this.bookingService.updateBookingStatusTime(seqData.booking_id, timeType)
                    }
                    //console.log(trips[trips.length - 1].trip_id,seqData.trip_id,seqData.transport_type,'pickup')
                    if(trips[trips.length - 1].trip_id == seqData.trip_id && seqData.transport_type == 'drop') {
                        notes = notes + seqData.booking_id + ":eld-" + timeType+','
                        this.bookingService.updateBookingStatusTime(seqData.booking_id, timeType)
                    }
                }
            }
            
            const bsReq = {
                booking_id: seqData.booking_id,
                status: reqBody.status+ ' ' +seqData.transport_type,
                created_by: 1,
                trip_id: seqData.trip_id,
                tour_id: seqData.tour_id,
                created_at: new Date(),
                updated_at: new Date()
            }
            await this.bookingService.addBookingStatus(bsReq)
        }
        const seq_track = {
            seqNumbers: seqIds,
            reqBody: JSON.stringify({status: reqBody.status, is_from_manager: reqBody.is_from_manager}),
            notes: notes
        }
        await this.seqTrackRepo.save(seq_track)
        return response
    }

    async updatePaySequence(reqBody: any): Promise<any> {
        let response = await this.updateSequence(reqBody);
        const seqIds = reqBody.seqNum
        let is_full_payment = false;
        for (let seqNum of seqIds) {
            const seqData = await this.tourRouteRepository.findOneBy({id: seqNum})
            if(seqData.transport_type == 'drop') {
                is_full_payment = true
            }
            const bookingDetails = await this.bookingRepository.findOneBy({id: seqData.booking_id})
            let amount_collected = bookingDetails.requestInfo ? bookingDetails.requestInfo['collection_amount'] : bookingDetails.total_fare

            const updateData = {
                payment_status: 'Completed', 
                payment_type: 'COD', 
                amount_collected: amount_collected.toString(), 
                is_full_payment
            }
            let whereCond = {
                multi_booking_id: bookingDetails.multi_booking_id
            }
            if(!bookingDetails.multi_booking_id || bookingDetails.multi_booking_id == '') {
                whereCond['id'] = bookingDetails.id
            }
            await this.bookingRepository.update({multi_booking_id: bookingDetails.multi_booking_id}, updateData)
            
            
        }
        return response;
    }
    
    async completeTour(reqBody: any): Promise<any> {
        if(reqBody.tour_id) {
            const tourData = await this.toursRepository.findOneBy({id: reqBody.tour_id})
            this.updateVehicleLiveData(tourData.id, {isNew: true})
            if(tourData && tourData.status != 'Completed') {
                const completeTime = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss')
                const tourUpdData = await this.toursRepository.update({id: reqBody.tour_id}, {status: 'Completed', current_status: 3, complete_time: completeTime})
                await this.driversRepository.update({user_id: tourData.driver_id}, {'status': "Available"})
                const seqData = await this.tourRouteRepository.find({where: {tour_id: reqBody.tour_id}})
                let bookingIds  = []
                for (let sData of seqData) {
                    if(!(bookingIds.indexOf(sData.booking_id) > -1)) {
                        const bsReq = {
                            booking_id: sData.booking_id,
                            status: 'Tour Completed',
                            created_by: 1,
                            trip_id: sData.trip_id,
                            tour_id: sData.tour_id,
                            created_at: new Date(),
                            updated_at: new Date()
                        }
                        await this.bookingService.addBookingStatus(bsReq)
                        await this.bookingService.checkAndUpdateBookingPaymentStatus({booking_id: sData.booking_id, status: 'Completed'})
                    }
                    bookingIds.push(sData.booking_id)
                }
                await this.redis.del(`veh:tour:${tourData.driver_id}`);
                console.log(`[tourComplete] deleted Redis key veh:tour:${tourData.driver_id} for completed tour ${tourData.id}`);
                await this.locService.calcDriverSessionDistance(tourData.driver_id, tourData.id)

            }
            
            // await this.locService.calcDriverSessionDistance(tourData.driver_id, reqBody.tour_id)
            
            return tourData
        } else {
            return null
        }
        
    }

    async test(req): Promise<any> {
        let dis = await this.euclideanDistance(12.99105, 80.2429354, 12.990554, 80.24298)
        console.log(dis)
        if(dis <= 50) {
            console.log("s 6")
        }
    }

    async tourInfo(tourId: number): Promise<any> {
        let resObj: any = {}
        let tour = await this.toursRepository.findOneBy({id: tourId})
        
        const driverData = await this.driversRepository.findOneBy({user_id: tour.driver_id})
        // const truckData = await this.trucksRepository.findOneBy({id: driverData.truck_id})
        resObj.tour = tour
        resObj.driverData = driverData
        return resObj;
    }

    async deleteTour(id: number): Promise<any> {
        try {
            let tourSeqData = await this.tourRouteRepository.find({where: {tour_id: id}})
            for(let seqData of tourSeqData) {
                await this.tripRepo.update({trip_id: seqData.trip_id}, {tour_id: null})
                await this.bookingRepository.update(seqData.booking_id, {assign_tour_status: 0, assign_tour_status_graph: 0, reached_pickup: null, completed_pickup: null, reached_drop: null, completed_drop: null, driver_name: null, driver_mobile: null})
                await this.bookingService.cancelByManager(seqData.booking_id)
                // booking is cancelled, not reallocated, so it must not sit in the allocation pool
                await this.removeBookingRedisPoolEntry(seqData.booking_id)
            }
            await this.driverSessionDistance.delete({tour_id: id})
            await this.tourBookingDetails.delete({tour_id: id})
            await this.tourRouteRepository.delete({tour_id: id})
            await this.bookingService.deleteBookingStatus({tour_id: id})
            await this.tourAssignTruckDriverRepository.delete({tour_id: id})
            const currentTourData = await this.toursRepository.findOneBy({id:id})
            const tourData = await this.toursRepository.delete(id)
            await this.clearDriverTourRedis(currentTourData.driver_id)
            if(!currentTourData.is_closed_tour && currentTourData.status != 'Completed') {
                const nextTours = await this.toursRepository.find({where:{driver_id: currentTourData.driver_id, id: MoreThan(currentTourData.id)}})
                if(nextTours.length) {
                    for(let tour of nextTours) {
                        await this.revertTourTrips(tour.id)
                        await this.toursRepository.delete(tour.id)
                        await this.driverSessionDistance.delete({tour_id: tour.id})
                    }
                }
            }
            console.log(currentTourData.status)
            if(currentTourData.status == 'Accepted') {
                console.log("calling to driver ....")
                await this.callDriverWhenTourEdit({driver_id: currentTourData.driver_id})
            }
            return tourData
        } catch(e) {
            console.log("error ", e)
            return {}
        }
        
        
        
        
    }

    async revertTourTrips(tour_id: number, requeueBookings: boolean = true): Promise<any> {
        if(tour_id) {
            let id = tour_id;
            const tourForRedis = await this.toursRepository.findOneBy({id: tour_id})
            const driverId = tourForRedis?.driver_id
            let tourSeqData = await this.tourRouteRepository.find({where: {tour_id: id}})
            const requeueBookingIds = new Set<number>()
            for(let seqData of tourSeqData) {
                await this.tripRepo.update({trip_id: seqData.trip_id}, {tour_id: null})
                await this.bookingRepository.update(seqData.booking_id, {assign_tour_status: 0, assign_tour_status_graph: 0, driver_name: '', driver_mobile: '', vehicle_number: ''})
                await this.tourRouteRepository.update({id: seqData.id}, {tour_id: 0})
                // const bsReq = {
                //     booking_id: seqData.booking_id,
                //     status: 'Tour Edited',
                //     created_by: 1,
                //     created_at: new Date(),
                //     updated_at: new Date()
                // }
                // this.bookingService.addBookingStatus(bsReq)

                if(requeueBookings) {
                    // unassigned from this driver's tour; queue for reallocation to another driver
                    requeueBookingIds.add(seqData.booking_id)
                }
            }
            await this.tourBookingDetails.delete({tour_id: id})
            // await this.tourRouteRepository.delete({tour_id: id})
            await this.bookingService.updateBookingStatus({tour_id: id}, {tour_id: 0})
            await this.tourAssignTruckDriverRepository.delete({tour_id: id})
            await this.driverSessionDistance.delete({tour_id: id})

            if(requeueBookings) {
                await this.requeueBookingsToRedisPool([...requeueBookingIds])
            }
            await this.clearDriverTourRedis(driverId)

            return true
        } else {
            return false
        }
    }

    async updateTourTrips(reqBody: any): Promise<any> {
        if(reqBody.tour_id) {
            const currentTourData = await this.toursRepository.findOneBy({id: reqBody.tour_id})
            await this.revertTourTrips(reqBody.tour_id, false)
            const tourData = await this.toursRepository.delete(reqBody.tour_id)
            if(!currentTourData.is_closed_tour && currentTourData.status != 'Completed') {
                const nextTours = await this.toursRepository.find({where:{driver_id: currentTourData.driver_id, id: MoreThan(currentTourData.id)}})
                if(nextTours.length) {
                    for(let tour of nextTours) {
                        await this.revertTourTrips(tour.id)
                        await this.toursRepository.delete(tour.id)
                        await this.driverSessionDistance.delete({tour_id: tour.id})
                    }
                }
            }
            if(currentTourData.status == 'Accepted') {
                await this.callDriverWhenTourEdit({driver_id: currentTourData.driver_id})
            }
            return tourData
        } else {
            return false
        }
    }

    async addClosedTour(reqBody: any): Promise<any> {
        reqBody['pickup_time'] = reqBody.reached_pickup
        reqBody['dropoff_time'] = reqBody.completed_drop
        reqBody['is_closed_booking'] = true
        let driverData = await this.driversRepository.findOneBy({user_id: reqBody.driver_id})
        const truckData = await this.trucksRepository.findOneBy({id: driverData.truck_id})
        reqBody['driver_name'] = driverData.name
        reqBody['driver_mobile'] = driverData.mobile_number
        reqBody['vehicle_number'] = truckData.registration_number
        // if(reqBody.booking_type == 'single') {
        //     reqBody['is_closed_booking'] = true
        // }
        let bookingDetails = await this.bookingService.addClosedBooking(reqBody)
        let tripReqData = {
            ...bookingDetails,
            booking_id: bookingDetails.id,
            trip_id: bookingDetails.id
        }
        let tripData = await this.bookingService.addTrip(tripReqData)
        if(reqBody.booking_type == 'single') {
            let tourReqData = {
                "tour_fare": 100,
                "booking_id": [bookingDetails.id],
                "engaged_consolidation_manager": bookingDetails.consolidation_center_id,
                "sequence": [
                    {
                        "sequence_number": 1,
                        "consolidation_center_id": null,
                        "booking_id": bookingDetails.id,
                        "trip_id": bookingDetails.id,
                        "transport_type": "pickup",
                        "pickup_lat": bookingDetails.pickup_lat,
                        "pickup_long": bookingDetails.pickup_long,
                        "location_address": bookingDetails.pickup_location
                    },
                    {
                        "sequence_number": 2,
                        "consolidation_center_id": null,
                        "booking_id": bookingDetails.id,
                        "trip_id": bookingDetails.id,
                        "transport_type": "drop",
                        "dropoff_lat": bookingDetails.dropoff_lat,
                        "dropoff_long": bookingDetails.dropoff_long,
                        "location_address": bookingDetails.dropoff_location
                    }
                ],
                "driver_id": reqBody.driver_id,
                "created_at": bookingDetails.pickup_time,
                "is_closed_tour": true,
                'reached_pickup': reqBody.reached_pickup,
                'completed_pickup': reqBody.completed_pickup,
                'reached_drop': reqBody.reached_drop,
                'completed_drop': reqBody.completed_drop,
                'tour_completed': moment(reqBody.completed_drop).add(1, 'minutes')
            }
            let tourData = await this.addTour(tourReqData)
            //console.log(tourData)
            await this.locService.calcDriverSessionDistance(reqBody.driver_id, tourData.id)
            /*let tourStatus = {
                'reached_pickup': 'Reached pickup',
                'completed_pickup': 'Completed pickup',
                'reached_drop': 'Reached drop',
                'completed_drop': 'Completed drop'
            }
            for (let status in tourStatus) {
                const bsReq = {
                    booking_id: bookingDetails.id,
                    status: tourStatus[status],
                    created_by: 1,
                    trip_id: bookingDetails.id,
                    tour_id: tourData.id,
                    created_at: reqBody[status],
                    updated_at: new Date()
                }
                this.bookingService.addBookingStatus(bsReq)
            }*/
        }
        
        return bookingDetails
    }

    async updateCallLog(reqBody: any): Promise<any> {
        if(!reqBody.is_call_to_shop) {
            let logData = await this.callLogRepo.findOne({where: {driver_id: reqBody.driver_id, booking_id: reqBody.booking_id}})
            if(!logData) {
                const logData = {
                    booking_id: reqBody.booking_id,
                    driver_id: reqBody.driver_id,
                    calls_count: 1,
                    last_call_time : moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss')
                }
                await this.callLogRepo.save(logData)
            } else {
                let count = logData.calls_count + 1
                await this.callLogRepo.update({id: logData.id}, {calls_count: count})
            }
        }
    }

    async callToCustomer(reqBody: any): Promise<any> {
        if(reqBody.driver_id && reqBody.booking_id) {
            let receiverMobile = '';
            // let id = reqBody.tour_id;
            let bookingData = await this.bookingRepository.findOneBy({id: reqBody.booking_id})
            if(reqBody.is_call_to_shop) {
                receiverMobile = await bookingData.pickup_receiver_contact
            } else {
                // let customer = await this.utilsService.getUserDetails(bookingData.customer_id)
                // if(customer && customer.mobile) {
                //     receiverMobile = customer.mobile
                // }
                receiverMobile = bookingData.dropoff_receiver_contact ? bookingData.dropoff_receiver_contact : bookingData.receiver_contact
            }
            receiverMobile = receiverMobile.split(",")[0]
            let driver = await this.utilsService.getUserDetails(reqBody.driver_id)
            if(driver && driver.mobile) {
                try {
                    // let url = "https://<your_api_key>:<your_api_token><subdomain>/v1/Accounts/<your_sid>/Calls/connect"
                    let url = "https://4f3365eadef570b30d87b1b1bc149bbfb5a52b6742386ab1:1b6674ecf922cd31c0e64fe1ca247698606425e936269152@api.exotel.com/v1/Accounts/gogoodmove1/Calls/connect"
                    let dataString = 'From='+driver.mobile+'&To='+receiverMobile+'&CallerId=09513886363&Record=false';
                    let headers = {accept: 'application/json'}
                    let res = await axios.post(url, dataString, {headers: headers})
                    //console.log(res)
                    //console.log(res.data)
                    console.log(url)
                    console.log(dataString)
                    await this.updateCallLog(reqBody)
                    
                    return true
                } catch(e) {
                    //console.log(e)
                    return false
                }
                
            }
        } else {
            return false
        }
    }

    async callToDriver(reqBody: any): Promise<any> {
        if(reqBody.driver_id && reqBody.booking_id) {
            // let id = reqBody.tour_id;
            let bookingData = await this.bookingRepository.findOneBy({id: reqBody.booking_id})
            let customer = await this.utilsService.getUserDetails(bookingData.customer_id)
            let driver = await this.utilsService.getUserDetails(reqBody.driver_id)
            if(customer && customer.mobile && driver && driver.mobile) {
                try {
                    // let url = "https://<your_api_key>:<your_api_token><subdomain>/v1/Accounts/<your_sid>/Calls/connect"
                    let url = "https://4f3365eadef570b30d87b1b1bc149bbfb5a52b6742386ab1:1b6674ecf922cd31c0e64fe1ca247698606425e936269152@api.exotel.com/v1/Accounts/gogoodmove1/Calls/connect"
                    let dataString = 'From='+customer.mobile+'&To='+driver.mobile+'&CallerId=09513886363&Record=false';
                    let headers = {accept: 'application/json'}
                    //console.log(dataString)
                    let res = await axios.post(url, dataString, {headers: headers})
                    //console.log(res)
                    //console.log(res.data)
                    return true
                } catch(e) {
                    //console.log(e)
                    return false
                }
            }
        } else {
            return false
        }
    }

    async testExotel(reqBody: any): Promise<any> {
        
        try {
            // let url = "https://<your_api_key>:<your_api_token><subdomain>/v1/Accounts/<your_sid>/Calls/connect"
            let url = "https://4f3365eadef570b30d87b1b1bc149bbfb5a52b6742386ab1:1b6674ecf922cd31c0e64fe1ca247698606425e936269152@api.exotel.com/v1/Accounts/gogoodmove1/Calls/connect"
            let dataString = 'From=6300359889&CallerId=09513886363&Record=false&Url=http://my.exotel.com/Exotel/exoml/start_voice/673388';
            let headers = {accept: 'application/json'}
            let res = await axios.post(url, dataString, {headers: headers})
            //console.log(res)
            //console.log(res.data)
            return true
        } catch(e) {
            //console.log(e)
            return false
        }
    }

    async testExotelByNumbers(reqBody: any): Promise<any> {
        
        try {
            // let url = "https://<your_api_key>:<your_api_token><subdomain>/v1/Accounts/<your_sid>/Calls/connect"
            let url = "https://4f3365eadef570b30d87b1b1bc149bbfb5a52b6742386ab1:1b6674ecf922cd31c0e64fe1ca247698606425e936269152@api.exotel.com/v1/Accounts/gogoodmove1/Calls/connect"
            let dataString = 'From='+reqBody.from+'&To='+reqBody.to+'&CallerId=09513886363';
            let headers = {accept: 'application/json'}
            let res = await axios.post(url, dataString, {headers: headers})
            //console.log(res)
            //console.log(res.data)
            return true
        } catch(e) {
            //console.log(e)
            return false
        }
    }

    async updateBookingTime(reqBody: any): Promise<any> {
        let booking = await this.bookingService.updateBookingTime(reqBody)
        const bookingId = reqBody.booking_id;
        const tourRoute = await this.tourRouteRepository.findOne({where:{booking_id: bookingId}});
        if(tourRoute) {
            let tourSeq = await this.tourRouteRepository.find({where: {tour_id: tourRoute.tour_id}, order: {sequence_number: 'ASC'}})
            if(tourSeq[0].booking_id == reqBody.booking_id) {
                await this.driverSessionDistance.delete({tour_id: tourSeq[0].tour_id})
                const tourData = await this.toursRepository.findOneBy({id: reqBody.tour_id})
                if(tourData) {
                    let pickup_time = new Date(reqBody.reached_pickup)
                    let tour_date = moment(pickup_time).format('YYYY-MM-DD')
                    let tour_time = moment(pickup_time).format('HH:mm:ss')
                    const tourUpdData = await this.toursRepository.update({id: reqBody.tour_id}, {tour_date: tour_date, tour_time: tour_time})
                }
                await this.locService.calcDriverSessionDistance(tourData.driver_id, tourData.id)
                return tourData
            }
        }
        return booking
    }

    async getTourDistance(reqBody: any): Promise<any> {
        const tourDistance = await this.locService.calcTourDistance(reqBody.tour_id)
        return tourDistance
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

    async callDriverWhenTourEdit(reqBody: any): Promise<any> {
        if(reqBody.driver_id) {
            console.log("welcome ", reqBody.driver_id)
            let driver = await this.driversRepository.findOne({where: {user_id: reqBody.driver_id}})
            try {
                // let url = "https://<your_api_key>:<your_api_token><subdomain>/v1/Accounts/<your_sid>/Calls/connect"
                let url = "https://4f3365eadef570b30d87b1b1bc149bbfb5a52b6742386ab1:1b6674ecf922cd31c0e64fe1ca247698606425e936269152@api.exotel.com/v1/Accounts/gogoodmove1/Calls/connect"
                let dataString = 'From='+driver.mobile_number+'&CallerId=09513886363&Url=http://my.exotel.com/gogoodmove1/exoml/start_voice/720461';
                let headers = {accept: 'application/json'}
                let res = await axios.post(url, dataString, {headers: headers})
                console.log(res)
                console.log(res.data)
                return true
            } catch(e) {
                console.log(e)
                return false
            }
            
        } else {
            console.log("reqBody")
            console.log(reqBody)
            return false
        }
    }

    async tourDetailsData(tourId: number): Promise<any> {
        let resObj: any = {tour: {}, tourSequence: []}
        let tour = await this.toursRepository.findOneBy({id: tourId})
        // //console.log(tour)
        // //console.log(tour.id)
        let tourRoute = await this.tourRouteRepository.find({ where: {tour_id: tour.id}, order: {sequence_number : 'ASC'}})
        resObj.tour = tour
        resObj.tourSequence = tourRoute
        //console.log(resObj)
        
        return resObj
    }
    
    async notificationToCustomerAboutDriverWaiting(): Promise<any> {
        let tours = await this.toursRepository.find({where: {status: Not(In(['Completed', 'Rejected', 'Assigned']))}})
        if(tours && tours.length) {
            for(let tour of tours) {
                //console.log(tour.id, tour.status)
                let tourRoute = await this.tourRouteRepository.find({where:{tour_id: tour.id, status: 'Reached'}, order: {id: 'ASC'}})
                if(tourRoute && tourRoute.length) {
                    let reachedTime = moment(tourRoute[0].updated_at)
                    let lastBookingTime = moment(new Date())
                    let total_time = lastBookingTime.diff(reachedTime, 'minutes');
                    //console.log("sent noti to customer ", tourRoute[0].booking_id, total_time)
                    if(total_time > 5) {
                        let bookingData = await this.bookingRepository.findOneBy({id: tourRoute[0].booking_id})
                        if(bookingData) {
                            // const driverToken = await this.utilsService.getDeviceToken(bookingData.customer_id)
                            const driverToken = await this.utilsService.getDeviceToken(245)
                            const driverDetails = await this.driversRepository.findOneBy({user_id: tour.driver_id})
                            const driverName = driverDetails.name
                            const TITLE = 'Driver Reached Location to Booking id #'+bookingData.id
                            const BODY = 'Mr. '+driverName+' waiting for Goods to '+tourRoute[0].transport_type+'.'
                            if(driverToken) {
                                await this.utilsService.sendPushNotification(TITLE, BODY, driverToken.split(","))
                            }
                        }
                    }
                }
            }
        }
    }
    
    async driverToursList(reqBody: any): Promise<any> {
        let tours = [];
        let tourDate = moment(new Date()).add(-60, 'days').format('YYYY-MM-DD')
        //console.log("topour date", tourDate)
        let [items, count] = await this.toursRepository.findAndCount({where: {status: Not('Assigned'), driver_id: reqBody.driver_id, tour_date: MoreThanOrEqual(tourDate)}, order:{current_status: 'ASC', id: 'DESC'}})
        // //console.log(items)
        for await (const tourD of items) {
            //console.log(tourD.id, tourD.tour_date)
            let tourData = {
                id: tourD.id,
                status: tourD.status,
                bookingsData: [],
                tourDate: tourD.tour_date,
                company_name: ''
            }
            let tourRouteBookings = await this.tourRouteRepository.createQueryBuilder('tr')
                                    .select('DISTINCT(booking_id)')
                                    .where("tour_id = :tourID", {tourID: tourD.id})
                                    .getRawMany()
            if(tourRouteBookings && tourRouteBookings.length) {
                //console.log(tourRouteBookings)
                let customerIds = []
                for(let bookingData of tourRouteBookings) {
                    let bookingInfo = {}
                    let booking = await this.bookingRepository.findOneBy({id: bookingData.booking_id})
                    customerIds.push(booking.customer_id)

                    if(booking) {
                        bookingInfo['id'] = booking.id
                        bookingInfo['pickup'] = booking.pickup_location
                        bookingInfo['dropoff'] = booking.dropoff_location
                        bookingInfo['tdcNumber'] = booking.tdcNumber
                        bookingInfo['reached_pickup'] = booking.reached_pickup ? booking.reached_pickup : booking.pickup_time
                    }
                    tourData.bookingsData.push(bookingInfo)

                }
                let custIds = [...new Set(customerIds)];
                for(let custId of custIds) {
                    let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${custId},%`))}})
                    tourData.company_name += (customer_company_details ? customer_company_details.company_name : '') + ","
                }

                tourData.company_name = tourData.company_name.replace(/,+$/, '');
            }
            tours.push(tourData)
        }
        return tours

    }

    async driverBookingsList(reqBody: any): Promise<any> {
        let bookings = []
        let tourDate = moment(new Date()).add(-60, 'days').format('YYYY-MM-DD')
        //console.log("topour date", tourDate)
        let [items, count] = await this.toursRepository.findAndCount({where: {status: Not('Assigned'), driver_id: reqBody.driver_id, tour_date: MoreThanOrEqual(tourDate)}, order:{current_status: 'ASC', id: 'DESC'}})
        for await (const tourD of items) {
            //console.log(tourD.id, tourD.tour_date)
            let tourRouteBookings = await this.tourRouteRepository.createQueryBuilder('tr')
                                    .select('DISTINCT(booking_id)')
                                    .where("tour_id = :tourID", {tourID: tourD.id})
                                    .getRawMany()
            if(tourRouteBookings && tourRouteBookings.length) {
                //console.log(tourRouteBookings)
                let customerIds = []
                for(let bookingData of tourRouteBookings) {
                    let bookingInfo = {}
                    let booking = await this.bookingRepository.findOneBy({id: bookingData.booking_id})

                    if(booking) {
                        bookingInfo['tour_id'] = tourD.id
                        bookingInfo['id'] = booking.id
                        bookingInfo['pickup'] = booking.pickup_location
                        bookingInfo['dropoff'] = booking.dropoff_location
                        bookingInfo['tdcNumber'] = booking.tdcNumber
                        bookingInfo['reached_pickup'] = booking.reached_pickup ? booking.reached_pickup : booking.pickup_time
                    }
                    let customer_company_details: any = await this.customerCompanyDetails.findOne({where:{users: Like((`%#${booking.customer_id},%`))}})
                    bookingInfo['company_name'] = (customer_company_details ? customer_company_details.company_name : '') + ","
                    bookings.push(bookingInfo)
                }
            }
        }
        return bookings

    }
    async checkDelayTours(reqBody: any): Promise<any> {
        let tourIds = [];
        let tourDriverMap = {}
        let tours = await this.toursRepository.find({where: {status: 'Accepted'}})
        for(let tour of tours) {
            tourIds.push(tour.id)
            tourDriverMap[tour.id] = tour.driver_id
        }
        const tourRoutes = await this.tourRouteRepository.find({where: {tour_id: In(tourIds), estimated_time: Not(IsNull()), completed_time: IsNull()}})
        for(let tourRoute of tourRoutes) {
            // console.log(tourRoute)
            let now = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss')
            // console.log(tourRoute.estimated_time, now)
            if(tourRoute.estimated_time < now) {
                console.log("send notification to driver ...", tourDriverMap[tourRoute.tour_id])
                const driverToken = await this.utilsService.getDeviceToken(tourDriverMap[tourRoute.tour_id])
                const TITLE = 'Delay Alert!!'
                const BODY = 'Your current pace is behind the expected schedule. Please reach the location within the expected time window.';
                // console.log(driverToken)
                if(driverToken) {
                    await this.utilsService.sendPushNotification(TITLE, BODY, driverToken.split(","))
                }
                await this.toursRepository.update({id: tourRoute.tour_id}, {is_delay: true})
            }
        }
        return true
    }

    async tagMissingTour(tours:any, tourType: string, tourId: number): Promise<any> {
        for(let tour of tours) {
            let sessD = await this.driverSessionDistance.find({where: {tour_id: tour.id}});
            if(sessD && sessD.length) {
                let sessionId = sessD[0].session_id;
                let totalSessionDistance: any = await this.locService.calcTourDistance(tourId)
                let sessionDistanceData = {
                    session_id: sessionId,
                    tour_id: tourId,
                    distance: totalSessionDistance,
                    tour_type: tourType
                }
                await this.driverSessionDistance.save(sessionDistanceData)
                let distance = 0;
                let [items] = await this.driverSessionDistance.findAndCount({where:{session_id: sessionId}})
                for(let item of items) {
                    distance = distance + parseFloat(item.distance)
                }
                distance = Math.ceil(distance);
                await this.dsRepo.update({id: sessionId}, {total_distance: distance.toString()})
                break;
            }
        }
    }

    async checkTourSessionTagging(reqBody: any): Promise<any> {
        const tourDate= reqBody.cal_date;
        let driverIds = [];
        let drivers = await this.toursRepository.createQueryBuilder('t')
            .select('DISTINCT(driver_id)')
            .where("tour_date = :tourDate", {tourDate: tourDate})
            .orderBy('driver_id')
            .getRawMany()
        for(let driver of drivers) {
            driverIds.push(driver.driver_id)
        }
        for(let driverId of driverIds) {
            let tours = await this.toursRepository.find({where: {driver_id: driverId, tour_date: tourDate}, order: {id: 'ASC'}});
            let i=0;
            for(let tour of tours) {

                if(tour.status != 'Rejected' && tour.status != 'Assigned') {
                    let sessionDistance = await this.driverSessionDistance.find({where: {tour_id: tour.id}});
                    console.log(tour.id)
                    // console.log(sessionDistance)
                    // break
                    if(!sessionDistance || !sessionDistance.length) {
                        await this.tagMissingTour(tours, tour.tour_type, tour.id)
                    } else {
                        // console.log("tagging ...", tour.id)
                        // await this.tagMissingTour(tours, tour.tour_type, tour.id)
                    }
                }
                i++
            }
        }
        return true

    }

    async cleanDoubleTagged(reqBody: any): Promise<any> {
        const tourDate= reqBody.cal_date;
        let tours = await this.driverSessionDistance.createQueryBuilder('t')
            .select('tour_id, count(tour_id) as count')
            .groupBy("tour_id")
            .having('count(tour_id) > 1')
            .getRawMany()
        for(let tour of tours) {
            // console.log(tour.tour_id)
            let i=0;
            let sessionDistances = await this.driverSessionDistance.find({where: {tour_id: tour.tour_id}});
            for(let sd of sessionDistances) {
                i++
                if(i == 1) {
                    continue
                } else {
                    console.log("deleting ", sd.tour_id)
                    await this.driverSessionDistance.delete({id: sd.id});
                }
                
            }
        }
        // console.log(tours)
        return true

    }

    async deleteBookingTour(bookingId):Promise<any> {
        let tourSeqData = await this.tourRouteRepository.find({where: {booking_id: bookingId}})
        if(tourSeqData.length) {
            const tourId = tourSeqData[0].tour_id
            const tourForRedis = await this.toursRepository.findOneBy({id: tourId})
            const driverId = tourForRedis?.driver_id
            for(let seqData of tourSeqData) {
                await this.tripRepo.delete({booking_id: bookingId})
                await this.tourRouteRepository.delete({id: seqData.id})
            }
            // await this.driverSessionDistance.delete({tour_id: tourId})
            // await this.tourBookingDetails.delete({tour_id: tourId})
            // await this.tourRouteRepository.delete({tour_id: tourId})
            await this.tourAssignTruckDriverRepository.delete({tour_id: tourId})
            let remainingSeqData = await this.tourRouteRepository.find({where: {tour_id: tourId}, order: {sequence_number: 'ASC'}})
            if(remainingSeqData.length) {
                let seqNo = 1
                for(let seqData of remainingSeqData) {
                    await this.tourRouteRepository.update({id: seqData.id}, {sequence_number: seqNo})
                    seqNo++
                }
                await this.removeBookingStopFromRedisTour(driverId, bookingId)
            } else {
                await this.clearDriverTourRedis(driverId)
                const currentTourData = await this.toursRepository.findOneBy({id:tourId})
                const tourData = await this.toursRepository.delete(tourId)
                const nextTours = await this.toursRepository.find({where:{driver_id: currentTourData.driver_id, id: MoreThan(currentTourData.id)}, order: {id: 'ASC'}})
                if(nextTours.length) {
                    for(let tour of nextTours) {
                        await this.revertTourTrips(tour.id)
                        await this.toursRepository.delete(tour.id)
                        await this.driverSessionDistance.delete({tour_id: tour.id})
                    }
                }

                await this.callDriverWhenTourEdit({driver_id: currentTourData.driver_id})
            }
            await this.removeBookingRedisPoolEntry(bookingId)
        }

        return
    }

    async vehicleLiveDataList(reqBody: any): Promise<any> {
        let vehiclesRes = []
        let liveData = await this.vehicleLiveDataRepo.find()
        for(let vehicleData of liveData) {
            console.log(vehicleData)
            let tourData = await this.toursRepository.findOneBy({id: vehicleData.tour_id})
            let loc = await this.locService.getDriverLatestLoc(tourData.driver_id)
            console.log(loc)
            if(loc)  {
                vehiclesRes.push({...vehicleData, latitude: loc.latitude, longitude: loc.longitude})
            } else {
                vehiclesRes.push(vehicleData)
            }
            
        }
        return vehiclesRes
    }

    decodePolyline(encoded) {
        let points = [];
        let index = 0, lat = 0, lng = 0;
      
        while (index < encoded.length) {
          let b, shift = 0, result = 0;
          do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
          } while (b >= 0x20);
          let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
          lat += dlat;
      
          shift = 0;
          result = 0;
          do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
          } while (b >= 0x20);
          let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
          lng += dlng;
      
          points.push([lat / 1e5, lng / 1e5]);
        }
        return points;
      }
      
      // Linear interpolation between two points p1 and p2 by fraction t (0 <= t <= 1)
    async interpolateCoord(p1, p2, t) {
        return [
          p1[0] + (p2[0] - p1[0]) * t,
          p1[1] + (p2[1] - p1[1]) * t,
        ];
    }
      
    async getWaypointsEveryFewMinutes(lon1, lat1, lon2, lat2, tourTime): Promise<any> {
        // const url = `http://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&steps=true`;
        // const res = await fetch(url);
        // const data = await res.json();
        const noMins = 2

        const data = await this.utilsService.getWaypointsWithTimeFromGOOSRM({lat: lat1, long: lon1}, {lat: lat2, long: lon2})
      
        
        if (!data.routes || !data.routes.length) {
          throw new Error('No route found');
        }
      
        const route = data.routes[0];
        const steps = route.legs[0].steps;
      
        // console.log(steps)
        // Flatten steps into segments with duration per segment
        let polylineWithDurations = [];
        steps.forEach(step => {
          const coords = this.decodePolyline(step.geometry);
          const segmentDuration = step.duration / (coords.length - 1);
          for (let i = 0; i < coords.length - 1; i++) {
            polylineWithDurations.push({
              start: coords[i],
              end: coords[i + 1],
              duration: segmentDuration,
            });
          }
        });
      
        let waypoints = [];
        let timeCounter = 0;
        const timeInterval = noMins * 60
        let nextWaypointTime = noMins * 60; // 5 minutes in seconds
      
        let tourTimeMins = 0
        for (let segment of polylineWithDurations) {
            // console.log(segment)
            // console.log(timeCounter, segment.duration, nextWaypointTime)
          if (timeCounter + segment.duration >= nextWaypointTime) {
            // Find fraction along segment to interpolate waypoint
            const remain = nextWaypointTime - timeCounter;
            const frac = remain / segment.duration;
      
            console.log(frac, remain, segment.duration)
            const interpolated = await this.interpolateCoord(segment.start, segment.end, frac);
            
      
            nextWaypointTime += timeInterval;
            const mins = Math.round(tourTimeMins ? tourTimeMins/timeInterval : 0) * noMins
            
            tourTime.add(mins, 'minutes');
            // console.log(tourTime.format("YYYY-MM-DD HH:mm:ss"), mins)
            waypoints.push({lat: interpolated[0]/10, long: interpolated[1]/10, estimateTime: tourTime.format("YYYY-MM-DD HH:mm:ss")});
            // console.log(tourTimeMins, tourTime)
            tourTimeMins = 0
          }
          timeCounter += segment.duration;
          tourTimeMins += segment.duration
        }
      
        return {waypoints, tourTime};
    }
      
    async estimateLiveVehicleData(reqBody: any): Promise<any> {
        let vehiclesRes = []
        const noMins = 2
        let liveData = await this.vehicleLiveDataRepo.find()
        // for(let vehicleData of liveData) {
        //     console.log(vehicleData)
        //     let tourData = await this.toursRepository.findOneBy({id: vehicleData.tour_id})
        //     let loc = await this.locService.getDriverLatestLoc(tourData.driver_id)
        //     console.log(loc)
        //     if(loc)  {
        //         vehiclesRes.push({...vehicleData, latitude: loc.latitude, longitude: loc.longitude})
        //     } else {
        //         vehiclesRes.push(vehicleData)
        //     }
            
        // }
        // const source = {
        //     lat: 15.5175866549316, long: 80.04038714960309
        // }
        // const destination = {
        //     lat: 15.425431479396606, long: 80.0396262439739
        //     // lat: 15.510515687732342, long: 80.04527308550186
        // }
        // let tourTime = moment();
        

        // Add 5 minutes to the current time
        // let futureTime = tourTime.add(5, 'minutes');

        // You can also use the shorthand 'm' for minutes
        // let futureTime = now.add(5, 'm');

        // Format the resulting time for display (optional)
        // console.log(futureTime.format("YYYY-MM-DD HH:mm:ss"));

        // console.log(liveData)

        // const coords = await this.getWaypointsEveryFewMinutes(source.long, source.lat, destination.long, destination.lat, tourTime)
        // console.log("co ordi nates ")
        // console.log(coords)
        // await this.cacheManager.set('tourData', JSON.stringify(liveData))
        for(let vehicleData of liveData) {
            console.log(vehicleData.tour_id)
            let tourData = await this.toursRepository.findOneBy({id: vehicleData.tour_id})
            if(tourData) {
                let tourTime = moment(tourData.tour_date +" "+tourData.tour_time);
                // let finalTime = moment(tourData.tour_date +" "+tourData.tour_time);
                let finalTime = moment(tourData.tour_date +" "+tourData.tour_time);
                finalTime.add(3, 'hours')
                let tourRoute = await this.tourRouteRepository.findBy({tour_id: vehicleData.tour_id})
                let i = 0
                let waypoints = []
                for(let seq of tourRoute) {
                    if(tourRoute[i+1]) {
                        let source = {lat: seq.location.coordinates[1], long: seq.location.coordinates[0]}
                        let destination = {lat: tourRoute[i+1].location.coordinates[1], long: tourRoute[i+1].location.coordinates[0]}
                        const coordsData = await this.getWaypointsEveryFewMinutes(source.long, source.lat, destination.long, destination.lat, tourTime)
                        tourTime = coordsData.tourTime.add(15, 'minutes') 

                        // console.log("co ordi nates ", tourTime)
                        // console.log(coordsData.waypoints)
                        waypoints = waypoints.concat(coordsData.waypoints)
                        // console.log(waypoints)
                    }
                    i++
                }
                // console.log(waypoints)
                
                let lastPoint = waypoints[waypoints.length -1]
                if(finalTime.diff(lastPoint['tourTime'], 'minutes') > 0) {
                    for(let tt = tourTime; finalTime.diff(tt, 'minutes') > 0; tt.add(noMins, 'minutes')) {
                        waypoints.push({lat: lastPoint.lat, long: lastPoint.long, tourTime: tt.format("YYYY-MM-DD HH:mm:ss")}) 
                    }
                    
                }
                vehicleData['estimatedPoints'] = waypoints
            }
            
            
            // console.log(vehicleData)
        }
        await this.cacheManager.set('tourData', JSON.stringify(liveData))
        return liveData
    }

    async getEstimatedLiveVehicleData(reqBody: any): Promise<any> {
        let vehiclesRes = []
        // let liveData = await this.vehicleLiveDataRepo.find()
        // for(let vehicleData of liveData) {
        //     console.log(vehicleData)
        //     let tourData = await this.toursRepository.findOneBy({id: vehicleData.tour_id})
        //     let loc = await this.locService.getDriverLatestLoc(tourData.driver_id)
        //     console.log(loc)
        //     if(loc)  {
        //         vehiclesRes.push({...vehicleData, latitude: loc.latitude, longitude: loc.longitude})
        //     } else {
        //         vehiclesRes.push(vehicleData)
        //     }
            
        // }
        const tourData = await this.cacheManager.get<string>('tourData')
        return JSON.parse(tourData)
    }

    async simulateVehicleLiveDataList(reqBody: any): Promise<any> {
        let vehiclesRes = []
        let tours = await this.toursRepository.find({where:{tour_date: '2025-10-13'}, order:{tour_date: 'ASC', tour_time: 'ASC'}})
        let i=1;
        for(let tour of tours) {
            const driver_id = tour.driver_id
            let tourAssignData = await this.tourAssignTruckDriverRepository.findOne({where: {tour_id: tour.id}})
            let vehicleData = {
                "id": i,
                "driver_id": driver_id,
                "vehicle_id": tourAssignData?.truck_id,
                "tour_id": tour.id,
                "volume": 0,
                "weight": 0,
                "created_at": new Date(tour.tour_date+" "+tour.tour_time),
                "latitude": 12.9900,
                "longitude": 80.2439
            }
            let loc = await this.locService.getDriverLocByTime(tour.driver_id, tour.tour_date+" "+tour.tour_time)
            console.log(loc)
            if(loc)  {
                vehiclesRes.push({...vehicleData, latitude: loc.latitude, longitude: loc.longitude})
            } else {
                vehiclesRes.push(vehicleData)
            }
            i++
        }
        // let liveData = await this.vehicleLiveDataRepo.find()
        // for(let vehicleData of liveData) {
        //     console.log(vehicleData)
        //     let tourData = await this.toursRepository.findOneBy({id: vehicleData.tour_id})
        //     let loc = await this.locService.getDriverLatestLoc(tourData.driver_id)
        //     console.log(loc)
        //     if(loc)  {
        //         vehiclesRes.push({...vehicleData, latitude: loc.latitude, longitude: loc.longitude})
        //     } else {
        //         vehiclesRes.push(vehicleData)
        //     }
            
        // }
        return vehiclesRes
    }

    async initiateReturn(reqBody: any): Promise<any> {
        console.log("reqBody *********************")
        console.log(reqBody)
        const response = {updated: true}
        const seqIds = reqBody.seqNum
        let notes = '';
        
        for (let seqNum of seqIds) {
            let timeType = ''
            const seqData = await this.tourRouteRepository.findOneBy({id: seqNum})
            const upds = await this.tourRouteRepository.update({id: seqNum}, {status: reqBody.status, updated_at: new Date()})
            await this.updateTripStatus(seqData.trip_id, reqBody.status+ ' ' +seqData.transport_type)
            const tourData = await this.toursRepository.findOneBy({id: seqData.tour_id})
            if(tourData.truck_owner_status != 'Accepted') {
                const acceptTime = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss')
                await this.toursRepository.update({id: seqData.tour_id}, {'truck_owner_status': 'Accepted', status: 'Accepted', current_status: 2, accept_time: acceptTime, is_delay: false})
                const driverDetails = await this.driversRepository.findOneBy({user_id: tourData.driver_id})
                const truckData = await this.trucksRepository.findOneBy({id: driverDetails.truck_id})
                await this.bookingRepository.update({id: seqData.booking_id}, {'driver_name': driverDetails.name, 'driver_mobile': driverDetails.mobile_number, 'vehicle_number': truckData.registration_number})
                await this.tourRouteRepository.update({id: seqNum}, {estimated_time: acceptTime, completed_time: acceptTime})
                await this.locService.calcDriverSessionDistance(tourData.driver_id, tourData.id)
            }
            if(reqBody.is_from_manager) {
                await this.bookingRepository.update({id:seqData.booking_id}, {'is_manager_entered': true, is_manager_updated_tour: true})
            }
            const bookingDetails = await this.bookingRepository.findOneBy({id: seqData.booking_id})
            let isNewSession = false;
            
            if(reqBody.status == 'Completed') {
                timeType = 'completed_'
                if(seqData.transport_type == 'drop' && (bookingDetails.dropoff_location == seqData.location_address)) {
                    const driverDetails = await this.driversRepository.findOneBy({user_id: tourData.driver_id})
                    const dName = driverDetails.name
                    await this.checkAndUpdateTourComplete(tourData)
                    //console.log(tourData.driver_id)
                    //console.log(dName)
                    
                }
                await this.estimateNextSequence(seqData)
                const completeTime = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss')
                await this.toursRepository.update({id: seqData.tour_id}, {'is_delay': false, status: 'Completed', current_status: 3, complete_time: completeTime, tour_status: 'Tour Completed'})
                this.updateVehicleLiveData(seqData.tour_id, {pickup: seqData.transport_type == 'pickup' ? true : false, booking_id: seqData.booking_id})
            }
            timeType = timeType + seqData.transport_type
            if(seqData.booking_id.toString() == seqData.trip_id) {
                notes = notes + seqData.booking_id + ":if-" + timeType+','
                this.bookingService.updateBookingStatusTime(seqData.booking_id, timeType)
            } else {
                let trips = await this.tripRepo.find({where:{booking_id: seqData.booking_id}, order: {trip_id: 'ASC'}})
                if(trips.length) {
                    //console.log(trips[0].trip_id,seqData.trip_id,seqData.transport_type,'pickup')
                    if(trips[0].trip_id == seqData.trip_id && seqData.transport_type == 'pickup') {
                        notes = notes + seqData.booking_id + ":el-" + timeType+','
                        this.bookingService.updateBookingStatusTime(seqData.booking_id, timeType)
                    }
                    //console.log(trips[trips.length - 1].trip_id,seqData.trip_id,seqData.transport_type,'pickup')
                    if(trips[trips.length - 1].trip_id == seqData.trip_id && seqData.transport_type == 'drop') {
                        notes = notes + seqData.booking_id + ":eld-" + timeType+','
                        this.bookingService.updateBookingStatusTime(seqData.booking_id, timeType)
                    }
                }
            }
            
            const newBooking = await this.bookingService.createReturnBooking(bookingDetails)
            // console.log("new booking ...")
            // console.log(newBooking)
            const tripData = {
                ...newBooking, trip_id: newBooking.id, booking_id: newBooking.id
            }
            await this.bookingService.addTrip(tripData)
            if(reqBody.noReturn === false) {
                let newTourData = {
                    ...tourData
                }
                delete newTourData.id
                newTourData.tour_time = moment(new Date()).tz('Asia/Calcutta').format('HH:mm:ss')
                newTourData.status = "Assigned"
                newTourData.tour_status = "Completed pickup"
                const newTour = await this.toursRepository.save(newTourData)
                // console.log("new tour .....")
                // console.log(newTour)
                let tourRoute = await this.tourRouteRepository.find({where:{booking_id: bookingDetails.id}, order: {sequence_number: 'ASC'}})
                if(tourRoute.length) {
                    let tourRouteObj = {
                        ... tourRoute[0],
                        tour_id: newTour.id,
                        booking_id: newBooking.id,
                        trip_id: newBooking.id,
                        sequence_number: tourRoute[1].sequence_number,
                        status: '',
                        transport_type: tourRoute[1].transport_type
                    } 
                    delete tourRouteObj.id
                    await this.tourRouteRepository.save(tourRouteObj)
                    console.log("tr created 1")
                    tourRouteObj = {
                        ... tourRoute[1],
                        tour_id: newTour.id,
                        booking_id: newBooking.id,
                        trip_id: newBooking.id,
                        sequence_number: tourRoute[0].sequence_number,
                        status: 'Completed',
                        transport_type: tourRoute[0].transport_type
                    } 
                    delete tourRouteObj.id
                    await this.tourRouteRepository.save(tourRouteObj)
                    console.log("tr created 2")
                }
                await this.bookingService.recordReturnBookingStatus(newBooking)
            } else {
                await this.bookingService.recordReturnDisposeBookingStatus(newBooking)
            }
        }
        const seq_track = {
            seqNumbers: seqIds,
            reqBody: JSON.stringify({status: reqBody.status, is_from_manager: reqBody.is_from_manager}),
            notes: notes
        }
        await this.seqTrackRepo.save(seq_track)
        return response
    }

    
    async getDriverToursByDate(reqBody):Promise<any> {
        let session_date = reqBody.calc_date
        let driver_id = reqBody.driver_id
        const tours = await this.toursRepository.find({where: {tour_date: session_date, driver_id: driver_id}})
        return tours
    }

    // Removes a single booking's stop(s) from the driver's Redis tour snapshot and renumbers
    // the remaining sequence, mirroring the tour_route resequencing done in the DB.
    private async removeBookingStopFromRedisTour(driverId: any, bookingId: number): Promise<void> {
        if (!driverId) return;
        const key = `veh:tour:${driverId}`;
        const existing = await this.redis.get(key);
        if (!existing) return;

        const payload = JSON.parse(existing);
        const remainingStops = (payload.updated_tour ?? []).filter((stop: any) => stop.booking_id !== bookingId);

        if (!remainingStops.length) {
            await this.redis.del(key);
            console.log(`[tourRoute] cleared Redis key=${key} after removing last booking=${bookingId}`);
            return;
        }

        payload.updated_tour = remainingStops.map((stop: any, index: number) => ({ ...stop, sequence: index + 1 }));
        payload.tour_version = (payload.tour_version ?? 0) + 1;
        payload.updated_at = new Date().toISOString();
        await this.redis.set(key, JSON.stringify(payload), 'EX', 36000);
        console.log(`[tourRoute] removed booking=${bookingId} stops from Redis key=${key} version=${payload.tour_version}`);
    }

    // Wipes the driver's Redis tour snapshot entirely, used when the whole tour it describes is gone.
    private async clearDriverTourRedis(driverId: any): Promise<void> {
        if (!driverId) return;
        const key = `veh:tour:${driverId}`;
        await this.redis.del(key);
        console.log(`[tourRoute] deleted Redis key=${key}`);
    }

    // Drops a booking from the `booking:{id}` allocation pool key (booking is gone / cancelled).
    private async removeBookingRedisPoolEntry(bookingId: number): Promise<void> {
        if (!bookingId) return;
        await this.redis.del(`booking:${bookingId}`);
        console.log(`[tourRoute] removed Redis pool entry booking:${bookingId}`);
    }

    // Pushes bookings back into the `booking:{id}` allocation pool, same shape as at booking
    // creation, so the auto-allocation algorithm can reallocate them to another driver.
    private async requeueBookingsToRedisPool(bookingIds: number[]): Promise<void> {
        if (!bookingIds.length) return;
        for (const bookingId of bookingIds) {
            const booking = await this.bookingRepository.findOneBy({ id: bookingId });
            if (!booking) continue;
            await this.redis.set(`booking:${bookingId}`, JSON.stringify(booking), 'EX', 36000);
        }
        console.log(`[tourRoute] requeued bookings to Redis pool:`, bookingIds);
    }

    private async updateTourStopStatus(driverId: number, bookingId: number, transportType: string, completedAt: string): Promise<void> {
        const key = `veh:tour:${driverId}`;
        const existing = await this.redis.get(key);
        if (!existing) return;

        const payload = JSON.parse(existing);
        let updated = false;
        for (const stop of payload.updated_tour) {
            if (stop.booking_id === bookingId && stop.type === transportType && stop.status != 'completed') {
                stop.status = 'completed';
                stop.completed_at = completedAt;
                updated = true;
                break;
            }
        }

        if (updated) {
            payload.tour_version = (payload.tour_version ?? 0) + 1;
            payload.updated_at = new Date().toISOString();
            await this.redis.set(key, JSON.stringify(payload), 'EX', 36000);
            console.log(`[tourRoute] updated stop status in Redis key=${key} booking=${bookingId} type=${transportType} version=${payload.tour_version}`);
        }
    }

    async checkActiveTour(driverId): Promise<any> {
        const activeTour = await this.toursRepository.findOne({
            where: { driver_id: driverId },
            order: { id: 'DESC' },
        });

        const isActiveTour = activeTour && !['Completed', 'Rejected'].includes(activeTour.status);
        console.log(isActiveTour)
    }
}
