"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TourService = void 0;
const common_1 = require("@nestjs/common");
const path = require("path");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const aws_sdk_1 = require("aws-sdk");
const moment = require("moment");
const booking_entity_1 = require("../../bookings/models/booking.entity");
const bookingConsolidationCenters_entity_1 = require("../../bookings/models/bookingConsolidationCenters.entity");
const trip_entity_1 = require("../../bookings/models/trip.entity");
const booking_service_1 = require("../../bookings/services/booking.service");
const driver_entity_1 = require("../../trucks/models/driver.entity");
const truck_entity_1 = require("../../trucks/models/truck.entity");
const driver_service_1 = require("../../trucks/services/driver.service");
const location_service_1 = require("../../trucks/services/location.service");
const utils_service_1 = require("../../utils/services/utils.service");
const typeorm_2 = require("typeorm");
const tourAssignTruckDrivers_entity_1 = require("../models/tourAssignTruckDrivers.entity");
const tourBookingDetails_entity_1 = require("../models/tourBookingDetails.entity");
const tourRoute_entity_1 = require("../models/tourRoute.entity");
const tours_entity_1 = require("../models/tours.entity");
const axios_1 = require("axios");
const driverSessionDistance_entity_1 = require("../../trucks/models/driverSessionDistance.entity");
const baseLocations_entity_1 = require("../../admin/models/baseLocations.entity");
const admin_service_1 = require("../../admin/services/admin.service");
const seqTrack_1 = require("../models/seqTrack");
const cusomerCompanyDetails_1 = require("../../trucks/models/cusomerCompanyDetails");
const driverSessions_entity_1 = require("../../trucks/models/driverSessions.entity");
const vehicleLiveData_entity_1 = require("../models/vehicleLiveData.entity");
const cache_manager_1 = require("@nestjs/cache-manager");
const ioredis_1 = require("ioredis");
const redis_provider_1 = require("../../common/redis/redis.provider");
const callLogs_entity_1 = require("../models/callLogs.entity");
const deliveryProof_entity_1 = require("../models/deliveryProof.entity");
const jimp_1 = require("jimp");
const DISTANCE_VAR = 0.050;
let TourService = class TourService {
    constructor(toursRepository, tourBookingDetails, bookingRepository, tripRepo, bookingConsolidationCentersRepository, tourAssignTruckDriverRepository, trucksRepository, driversRepository, tourRouteRepository, driverSessionDistance, baseLocationRepo, seqTrackRepo, customerCompanyDetails, dsRepo, vehicleLiveDataRepo, callLogRepo, deliveryProofRepo, cacheManager, redis, utilsService, configService, driverService, bookingService, locService, adminService) {
        this.toursRepository = toursRepository;
        this.tourBookingDetails = tourBookingDetails;
        this.bookingRepository = bookingRepository;
        this.tripRepo = tripRepo;
        this.bookingConsolidationCentersRepository = bookingConsolidationCentersRepository;
        this.tourAssignTruckDriverRepository = tourAssignTruckDriverRepository;
        this.trucksRepository = trucksRepository;
        this.driversRepository = driversRepository;
        this.tourRouteRepository = tourRouteRepository;
        this.driverSessionDistance = driverSessionDistance;
        this.baseLocationRepo = baseLocationRepo;
        this.seqTrackRepo = seqTrackRepo;
        this.customerCompanyDetails = customerCompanyDetails;
        this.dsRepo = dsRepo;
        this.vehicleLiveDataRepo = vehicleLiveDataRepo;
        this.callLogRepo = callLogRepo;
        this.deliveryProofRepo = deliveryProofRepo;
        this.cacheManager = cacheManager;
        this.redis = redis;
        this.utilsService = utilsService;
        this.configService = configService;
        this.driverService = driverService;
        this.bookingService = bookingService;
        this.locService = locService;
        this.adminService = adminService;
    }
    async tourDetails(tourId) {
        var _a, e_1, _b, _c;
        let resObj = { tour: {}, tourItems: [], tourPoints: {} };
        let tour = await this.toursRepository.findOneBy({ id: tourId });
        let tourRoute = await this.tourRouteRepository.find({ where: { tour_id: tour.id }, order: { sequence_number: 'ASC' } });
        try {
            for (var _d = true, tourRoute_1 = __asyncValues(tourRoute), tourRoute_1_1; tourRoute_1_1 = await tourRoute_1.next(), _a = tourRoute_1_1.done, !_a;) {
                _c = tourRoute_1_1.value;
                _d = false;
                try {
                    const tourDetail = _c;
                    let pickuptime_flexiblity_status = '';
                    let pickup_flexible_time = '';
                    let dropofftime_flexiblity_status = '';
                    let dropoff_flexible_time = '';
                    let bookingDetails = {};
                    {
                        const booking = await this.bookingRepository.findOneBy({ id: tourDetail.booking_id });
                        const tripData = await this.tripRepo.findOneBy({ trip_id: tourDetail.trip_id });
                        const callLog = await this.callLogRepo.findOneBy({ booking_id: booking.id });
                        const customerCompany = await this.customerCompanyDetails.findOne({ where: { users: (0, typeorm_2.Like)(`%#${booking.customer_id},%`) } });
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
                            "commodity_weight": booking.commodity_weight,
                            "consignment_image": booking.consignment_image,
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
                            "assign_tour_status": booking.assign_tour_status_graph,
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
                            "requestInfo": booking.requestInfo,
                            "calls_count": callLog ? callLog.calls_count : 0,
                            "is_otp_enabled": customerCompany ? customerCompany.is_otp_enabled : 'No',
                            "is_delivery_proof_enabled": customerCompany ? customerCompany.is_delivery_proof_enabled : 'No'
                        };
                    }
                    let tourData = Object.assign(Object.assign({}, tourDetail), { tour_item: bookingDetails });
                    resObj.tourPoints["tb_" + tourDetail.id] = tourData;
                }
                finally {
                    _d = true;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = tourRoute_1.return)) await _b.call(tourRoute_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        const driverData = await this.driversRepository.findOneBy({ user_id: tour.driver_id });
        let tourTruckData = {};
        tourTruckData['driver_name'] = driverData ? driverData.name : '';
        tourTruckData['driver_mobile'] = driverData ? driverData.mobile_number : '';
        resObj.truck = tourTruckData;
        resObj.sequenceData = tourRoute;
        resObj.tour = tour;
        return resObj;
    }
    async tourFullDetails(tourId) {
        const tour = await this.toursRepository.findOneBy({ id: tourId });
        if (!tour) {
            return null;
        }
        const tourRoute = await this.tourRouteRepository.find({ where: { tour_id: tour.id }, order: { sequence_number: 'ASC' } });
        const driverData = await this.driversRepository.findOneBy({ user_id: tour.driver_id });
        const legs = [];
        const bookings = {};
        {
            const bookingIds = [...new Set(tourRoute.map(r => r.booking_id))];
            const tripIds = [...new Set(tourRoute.map(r => r.trip_id))];
            const [bookingRows, trips, callLogs] = await Promise.all([
                bookingIds.length ? this.bookingRepository.find({ where: { id: (0, typeorm_2.In)(bookingIds) } }) : [],
                tripIds.length ? this.tripRepo.find({ where: { trip_id: (0, typeorm_2.In)(tripIds) } }) : [],
                bookingIds.length ? this.callLogRepo.find({ where: { booking_id: (0, typeorm_2.In)(bookingIds) } }) : [],
            ]);
            const bookingById = new Map(bookingRows.map(b => [b.id, b]));
            const tripByTripId = new Map(trips.map(t => [t.trip_id, t]));
            const callLogByBookingId = new Map(callLogs.map(c => [c.booking_id, c]));
            const customerCompanies = await this.customerCompanyDetails.find();
            const companyForCustomer = (customerId) => customerCompanies.find(cc => { var _a; return (_a = cc.users) === null || _a === void 0 ? void 0 : _a.includes(`#${customerId},`); });
            for (const booking of bookingRows) {
                const callLog = callLogByBookingId.get(booking.id);
                const customerCompany = companyForCustomer(booking.customer_id);
                bookings[booking.id] = {
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
                    requestInfo: booking.requestInfo,
                    calls_count: callLog ? callLog.calls_count : 0,
                    consignment_image: booking.consignment_image,
                };
            }
            for (const tourDetail of tourRoute) {
                const booking = bookingById.get(tourDetail.booking_id);
                const tripData = tripByTripId.get(tourDetail.trip_id);
                legs.push({
                    booking_id: booking === null || booking === void 0 ? void 0 : booking.id,
                    pickup_location: tripData === null || tripData === void 0 ? void 0 : tripData.pickup_location,
                    pickup_time: tripData === null || tripData === void 0 ? void 0 : tripData.pickup_time,
                    dropoff_location: tripData === null || tripData === void 0 ? void 0 : tripData.dropoff_location,
                    dropoff_time: tripData === null || tripData === void 0 ? void 0 : tripData.dropoff_time,
                    weight: booking === null || booking === void 0 ? void 0 : booking.commodity_weight,
                });
            }
        }
        const stops = [];
        for (let i = 0; i < tourRoute.length; i++) {
            const routeLeg = tourRoute[i];
            const leg = legs[i];
            const currentSeqLoc = routeLeg.transport_type == 'pickup' ? leg.pickup_location : leg.dropoff_location;
            const lastStop = stops[stops.length - 1];
            const isSamePoint = !!lastStop && lastStop.pType == routeLeg.transport_type && currentSeqLoc == lastStop.location;
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
                });
            }
            else {
                lastStop.id.push(routeLeg.id);
                lastStop.booking_ids.push(leg.booking_id);
                lastStop.weight = (lastStop.weight || 0) + (leg.weight || 0);
                lastStop.status = routeLeg.status;
            }
        }
        const startingLeg = legs[0];
        const endingLeg = legs[legs.length - 1];
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
                startingLocation: startingLeg === null || startingLeg === void 0 ? void 0 : startingLeg.pickup_location,
                endingLocation: endingLeg === null || endingLeg === void 0 ? void 0 : endingLeg.dropoff_location,
            },
            bookings,
            stops,
        };
    }
    async tourDetailsOld(tourId) {
        var _a, e_2, _b, _c, _d, e_3, _e, _f;
        let resObj = { tour: {}, tourItems: [], tourPoints: {} };
        let tour = await this.toursRepository.findOneBy({ id: tourId });
        let newSequenceArray = [];
        if (tour.sequence != null) {
            let sequence = JSON.parse(tour.sequence);
            try {
                for (var _g = true, sequence_1 = __asyncValues(sequence), sequence_1_1; sequence_1_1 = await sequence_1.next(), _a = sequence_1_1.done, !_a;) {
                    _c = sequence_1_1.value;
                    _g = false;
                    try {
                        const sData = _c;
                        const key = Object.keys(sData)[0];
                        const keyData = key.split(".");
                        const bookingId = await this.utilsService.getBookingId(keyData[0]);
                        newSequenceArray[sData[key]] = bookingId + " " + keyData[1];
                    }
                    finally {
                        _g = true;
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (!_g && !_a && (_b = sequence_1.return)) await _b.call(sequence_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
            newSequenceArray = Object.keys(newSequenceArray).reduce((a, c) => (a[c] = newSequenceArray[c], a), {});
        }
        let tourDetails = await this.tourBookingDetails.findBy({ tour_id: tour.id });
        try {
            for (var _h = true, tourDetails_1 = __asyncValues(tourDetails), tourDetails_1_1; tourDetails_1_1 = await tourDetails_1.next(), _d = tourDetails_1_1.done, !_d;) {
                _f = tourDetails_1_1.value;
                _h = false;
                try {
                    const tourDetail = _f;
                    let booking = {};
                    let pickuptime_flexiblity_status = '';
                    let pickup_flexible_time = '';
                    let dropofftime_flexiblity_status = '';
                    let dropoff_flexible_time = '';
                    if (tourDetail.booking_id != null) {
                        booking = await this.bookingRepository.findOneBy({ id: tourDetail.booking_id });
                        pickuptime_flexiblity_status = booking.pickuptime_flexiblity_status;
                        pickup_flexible_time = booking.pickup_flexible_time;
                        dropofftime_flexiblity_status = booking.dropofftime_flexiblity_status;
                        dropoff_flexible_time = booking.dropoff_flexible_time;
                    }
                    else {
                        let centerDetails = await this.bookingConsolidationCentersRepository.findOneBy({ id: tourDetail.booking_at_center_id });
                        booking = await this.bookingRepository.findOneBy({ id: centerDetails.booking_id });
                        if (centerDetails.drop_at == 'consolidation_center') {
                            pickuptime_flexiblity_status = booking.pickuptime_flexiblity_status;
                            pickup_flexible_time = booking.pickup_flexible_time;
                            dropofftime_flexiblity_status = 'Fixed';
                            dropoff_flexible_time = null;
                        }
                        else {
                            pickuptime_flexiblity_status = 'Fixed';
                            pickup_flexible_time = null;
                            dropofftime_flexiblity_status = booking.dropofftime_flexiblity_status;
                            dropoff_flexible_time = booking.dropoff_flexible_time;
                        }
                    }
                    let commodity_type = await this.utilsService.getCatName(booking.commodity_type);
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
                        "commodity_type": commodity_type == 'Others' ? booking.other_commodity_name : commodity_type,
                        "truck_owner_status": booking.truck_owner_status,
                        "commodity_weight": booking.commodity_weight,
                        "weight_unit": await this.utilsService.getCatName(booking.weight_unit),
                        "commodity_whole_volume": booking.commodity_whole_volume,
                        "volume_unit": await this.utilsService.getCatName(booking.volume_unit),
                        "commodity_length": booking.commodity_length,
                        "length_unit": await this.utilsService.getCatName(booking.length_unit),
                        "commodity_breadth": booking.commodity_breadth,
                        "breadth_unit": await this.utilsService.getCatName(booking.breadth_unit),
                        "commodity_height": booking.commodity_height,
                        "height_unit": await this.utilsService.getCatName(booking.height_unit),
                        "packaging_type": await this.utilsService.getCatName(booking.packaging_type),
                        "consignment_image": booking.consignment_image,
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
                    };
                    let tourData = Object.assign(Object.assign({}, tourDetail), { tour_item: bookingDetails });
                    resObj.tourPoints["tb_" + booking.id] = tourData;
                }
                finally {
                    _h = true;
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (!_h && !_d && (_e = tourDetails_1.return)) await _e.call(tourDetails_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        const driverData = await this.driversRepository.findOneBy({ user_id: tour.driver_id });
        let tourTruckData = {};
        tourTruckData['driver_name'] = driverData.name;
        tourTruckData['driver_mobile'] = driverData.mobile_number;
        resObj.truck = tourTruckData;
        resObj.sequence = newSequenceArray;
        resObj.sequenceData = await this.tourRouteRepository.find({ where: { tour_id: tour.id }, order: { sequence_number: 'ASC' } });
        resObj.tour = tour;
        return resObj;
    }
    async toursList(reqBody) {
        var _a, e_4, _b, _c, _d, e_5, _e, _f;
        let responseObject = { tours: [], count: 0 };
        let whereCon = {};
        if (reqBody.start_date) {
            whereCon['created_at'] = (0, typeorm_2.Between)(new Date(reqBody.start_date), new Date(reqBody.end_date));
        }
        if (reqBody.driver_id) {
            whereCon['driver_id'] = reqBody.driver_id;
        }
        if (reqBody.id) {
            whereCon['id'] = reqBody.id;
        }
        if (reqBody.status) {
            whereCon['status'] = reqBody.status;
        }
        if (reqBody.tour_date) {
            whereCon['tour_date'] = reqBody.tour_date;
        }
        if (reqBody.tour_status) {
            whereCon['tour_status'] = reqBody.tour_status;
        }
        if (reqBody.booking_type) {
            whereCon['tour_for'] = reqBody.booking_type;
        }
        let [items, count] = await this.toursRepository.findAndCount({ where: whereCon, order: { current_status: 'ASC', id: 'DESC' }, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) });
        responseObject.count = count;
        try {
            for (var _g = true, items_1 = __asyncValues(items), items_1_1; items_1_1 = await items_1.next(), _a = items_1_1.done, !_a;) {
                _c = items_1_1.value;
                _g = false;
                try {
                    const tourD = _c;
                    console.log(tourD);
                    let resObj = { tour: {}, tourItems: [], tourPoints: {} };
                    const bsData = await this.bookingService.getBSByTourId(tourD.id);
                    let tour = Object.assign(Object.assign({}, tourD), { tour_status: bsData ? bsData.status : '' });
                    let tourRoute = await this.tourRouteRepository.find({ where: { tour_id: tour.id }, order: { sequence_number: 'ASC' } });
                    try {
                        for (var _h = true, tourRoute_2 = (e_5 = void 0, __asyncValues(tourRoute)), tourRoute_2_1; tourRoute_2_1 = await tourRoute_2.next(), _d = tourRoute_2_1.done, !_d;) {
                            _f = tourRoute_2_1.value;
                            _h = false;
                            try {
                                const tourDetail = _f;
                                let pickuptime_flexiblity_status = '';
                                let pickup_flexible_time = '';
                                let dropofftime_flexiblity_status = '';
                                let dropoff_flexible_time = '';
                                let booking = await this.bookingRepository.findOneBy({ id: tourDetail.booking_id });
                                let tripData = await this.tripRepo.findOneBy({ trip_id: tourDetail.trip_id });
                                let bookingDetails = {
                                    "id": tripData ? tripData.id : '',
                                    "trip_id": tripData ? tripData.trip_id : '',
                                    "main_booking_id": booking.id,
                                    "customer_name": await this.utilsService.getName(booking.customer_id),
                                    "customer_device_token": await this.utilsService.getDeviceToken(booking.customer_id),
                                    "engaged_consolidation_manager": await this.utilsService.getName(booking.engaged_consolidation_manager),
                                    "pickup_location": tripData ? tripData.pickup_location : '',
                                    "pickup_date": tripData ? moment(tripData.pickup_time).format('d-m-Y') : '',
                                    "pickup_time": tripData ? moment(tripData.pickup_time).format('hh:mm A') : '',
                                    "pickuptime_flexiblity_status": pickuptime_flexiblity_status,
                                    "pickup_flexible_time": pickup_flexible_time,
                                    "dropoff_location": tripData ? tripData.dropoff_location : '',
                                    "dropoff_date": tripData ? moment(tripData.dropoff_time).format('d-m-Y') : '',
                                    "dropoff_time": tripData ? moment(tripData.dropoff_time).format('hh:mm A') : '',
                                    "dropofftime_flexiblity_status": dropofftime_flexiblity_status,
                                    "dropoff_flexible_time": dropoff_flexible_time,
                                    "commodity_weight": booking.commodity_weight,
                                    "consignment_image": booking.consignment_image,
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
                                    "assign_tour_status": booking.assign_tour_status_graph,
                                    "created_date": moment(booking.created_at).format('d-m-Y'),
                                    "created_time": moment(booking.created_at).format('hh:mm A')
                                };
                                let tourData = Object.assign(Object.assign({}, tourDetail), { tour_item: bookingDetails });
                                resObj.tourPoints["tb_" + tourDetail.id] = tourData;
                            }
                            finally {
                                _h = true;
                            }
                        }
                    }
                    catch (e_5_1) { e_5 = { error: e_5_1 }; }
                    finally {
                        try {
                            if (!_h && !_d && (_e = tourRoute_2.return)) await _e.call(tourRoute_2);
                        }
                        finally { if (e_5) throw e_5.error; }
                    }
                    const driverData = await this.driversRepository.findOneBy({ user_id: tour.driver_id });
                    let tourTruckData = {};
                    tourTruckData['driver_name'] = driverData ? driverData.name : '';
                    tourTruckData['driver_mobile'] = driverData ? driverData.mobile_number : '';
                    resObj.truck = tourTruckData;
                    resObj.sequenceData = tourRoute;
                    resObj.tour = tour;
                    responseObject.tours.push(resObj);
                }
                finally {
                    _g = true;
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (!_g && !_a && (_b = items_1.return)) await _b.call(items_1);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return responseObject;
    }
    async estimateTimeByLatLong(fromLoc, toLoc) {
        let duration = 0;
        const dData = await this.utilsService.getTimeFromGoogle(fromLoc, toLoc);
        if (dData.status == 'OK' && dData.rows.length) {
            duration = (dData.rows[0].elements && dData.rows[0].elements.length) ? dData.rows[0].elements[0].duration.value : 0;
            if (duration > 0) {
                duration = Math.round(duration / 60);
            }
        }
        return duration;
    }
    async acceptTour(reqBody) {
        let estimateTime = '';
        await this.driversRepository.update({ user_id: reqBody.driver_id }, { 'status': "Engaged" });
        await this.trucksRepository.update({ id: reqBody.truck_id }, { 'status': "Engaged" });
        const acceptTime = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss');
        await this.toursRepository.update({ id: reqBody.tour_id }, { 'truck_owner_id': reqBody.truck_owner_id, 'truck_owner_status': 'Accepted', 'status': 'Accepted', current_status: 2, accept_time: acceptTime });
        const tourData = await this.toursRepository.findOneBy({ id: reqBody.tour_id });
        const driverDetails = await this.driversRepository.findOneBy({ user_id: tourData.driver_id });
        const driverName = driverDetails.name;
        const truckDetails = await this.trucksRepository.findOneBy({ id: driverDetails.truck_id });
        const tourBookingDetailsData = await this.tourBookingDetails.find({ where: { tour_id: reqBody.tour_id } });
        if (reqBody.latitude && reqBody.longitude) {
            let tourRoute = await this.tourRouteRepository.find({ where: { tour_id: reqBody.tour_id }, order: { sequence_number: 'ASC' } });
            const seqData = tourRoute[0];
            const time = await this.estimateTimeByLatLong({ latitude: reqBody.latitude, longitude: reqBody.longitude }, { latitude: seqData.location.coordinates[1], longitude: seqData.location.coordinates[0] });
            estimateTime = moment().add(time, "minutes").tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss');
            console.log("estimateTime");
            console.log(estimateTime);
            await this.tourRouteRepository.update({ id: seqData.id }, { estimated_time: estimateTime });
        }
        for (let bDetails of tourBookingDetailsData) {
            await this.bookingRepository.update({ id: bDetails.booking_id }, { 'driver_name': driverName, 'driver_mobile': driverDetails.mobile_number, 'vehicle_number': truckDetails.registration_number });
            const bookingDetails = await this.bookingRepository.findOneBy({ id: bDetails.booking_id });
            if (bookingDetails.status == 'Tour Created') {
                const driverToken = await this.utilsService.getDeviceToken(bookingDetails.customer_id);
                const TITLE = 'Vehicle and driver details for booking id #' + bookingDetails.id;
                const BODY = 'Mr. ' + driverName + ' will arrive at the pickup location soon. Your vehicle no is ' + truckDetails.registration_number + '.';
                if (driverToken) {
                    await this.utilsService.sendPushNotification(TITLE, BODY, driverToken.split(","));
                }
            }
            const bsReq = {
                booking_id: bookingDetails.id,
                status: 'Accepted',
                created_by: bookingDetails.customer_id,
                created_at: new Date(),
                updated_at: new Date()
            };
            this.bookingService.addBookingStatus(bsReq);
        }
        await this.locService.calcDriverSessionDistance(tourData.driver_id, tourData.id);
        return { tour_id: reqBody.tour_id, driver_name: driverName };
    }
    async startTour(reqBody) {
        await this.toursRepository.update({ id: reqBody.tour_id }, { 'status': 'In Progress' });
        const tourData = this.toursRepository.findOneBy({ id: reqBody.tour_id });
        return { tour_id: reqBody.tour_id };
    }
    async uploadOdometer(file, tour_id) {
        const { originalname } = file;
        const bucketS3 = this.configService.get('ODOMETER_BUCKET_NAME');
        const uploadedData = await this.uploadS3(file.buffer, bucketS3, originalname);
        return uploadedData.Location;
    }
    async tourDocuments(file, tour_id) {
        const { originalname } = file;
        const bucketS3 = this.configService.get('TOUR_DOCUMENTS_BUCKET_NAME');
        const uploadedData = await this.uploadS3(file.buffer, bucketS3, originalname);
        return uploadedData.Location;
    }
    async uploadDeliveryProof(file, seqNum, lat, lng) {
        var _a;
        const timestamp = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss');
        const latText = lat != null ? `Lat: ${lat}` : 'Lat: N/A';
        const lngText = lng != null ? `Lng: ${lng}` : 'Lng: N/A';
        const image = await jimp_1.Jimp.read(file.buffer);
        const imgW = image.width;
        const imgH = image.height;
        const fontPath = path.join(process.cwd(), 'node_modules', '@jimp', 'plugin-print', 'fonts', 'open-sans', 'open-sans-32-white', 'open-sans-32-white.fnt');
        const font = await (0, jimp_1.loadFont)(fontPath);
        const padding = 12;
        const lineHeight = 38;
        const lines = [latText, lngText, timestamp];
        const boxH = lineHeight * lines.length + padding * 2;
        const boxY = imgH - boxH - 12;
        const overlay = new jimp_1.Jimp({ width: imgW, height: boxH, color: 0x00000099 });
        image.composite(overlay, 0, boxY);
        lines.forEach((line, i) => {
            image.print({ font, x: padding, y: boxY + padding + i * lineHeight, text: line });
        });
        const stampedBuffer = await image.getBuffer('image/jpeg', { quality: 85 });
        const bucketS3 = this.configService.get('DELIVERY_PROOF_BUCKET_NAME');
        const fileName = `delivery_proof_seq${seqNum}_${Date.now()}.jpg`;
        const uploadedData = await this.uploadS3(stampedBuffer, bucketS3, fileName);
        const imageUrl = uploadedData.Location;
        const tourRoute = await this.tourRouteRepository.findOne({ where: { id: seqNum } });
        const proof = this.deliveryProofRepo.create({
            seq_num: seqNum,
            booking_id: (_a = tourRoute === null || tourRoute === void 0 ? void 0 : tourRoute.booking_id) !== null && _a !== void 0 ? _a : null,
            image_url: imageUrl,
            lat: lat !== null && lat !== void 0 ? lat : null,
            lng: lng !== null && lng !== void 0 ? lng : null,
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
        return new aws_sdk_1.S3({
            accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY')
        });
    }
    async sendTourOtp(mobile) {
        var _a, e_6, _b, _c;
        try {
            try {
                for (var _d = true, mobile_1 = __asyncValues(mobile), mobile_1_1; mobile_1_1 = await mobile_1.next(), _a = mobile_1_1.done, !_a;) {
                    _c = mobile_1_1.value;
                    _d = false;
                    try {
                        let mobileNumber = _c;
                        await this.utilsService.sendOtp(mobileNumber);
                    }
                    finally {
                        _d = true;
                    }
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = mobile_1.return)) await _b.call(mobile_1);
                }
                finally { if (e_6) throw e_6.error; }
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async verifyTourOtp(mobile, otp) {
        try {
            return await this.utilsService.verifyOtp(mobile, otp);
        }
        catch (error) {
            return false;
        }
    }
    async truckerTour(reqBody) {
        const exceptStatus = ['Completed', 'Rejected'];
        const tourDetails = await this.toursRepository.findOne({ where: { driver_id: reqBody.truck_owner_id, status: (0, typeorm_2.Not)((0, typeorm_2.In)(exceptStatus)) }, order: { id: "ASC" } });
        if (tourDetails) {
            return { tour_id: tourDetails.id };
        }
        else {
            return null;
        }
    }
    async rejectTour(reqBody) {
        let response = {
            success: true,
            data: {},
            message: ''
        };
        const tourData = await this.toursRepository.findOneBy({ id: reqBody.tour_id });
        if (tourData.status == 'Assigned') {
            await this.driversRepository.update({ user_id: reqBody.driver_id }, { 'status': "Available" });
            await this.trucksRepository.update({ id: reqBody.truck_id }, { 'status': "Available" });
            await this.toursRepository.update({ id: reqBody.tour_id }, { 'truck_owner_id': reqBody.truck_owner_id, 'truck_owner_status': 'Rejected', 'status': 'Rejected', current_status: 4 });
            await this.driverSessionDistance.delete({ tour_id: reqBody.tour_id });
            response.data = { tour_id: reqBody.tour_id, driver_name: await this.utilsService.getDriverName(reqBody.driver_id) };
        }
        else {
            response.success = false;
            response.message = 'Tour already accepted, Please contact the Manager!';
        }
        return response;
    }
    async updateSessionDetails(tourData, tourSeqData) {
        const firstBookingData = await this.bookingRepository.findOneBy({ id: tourSeqData[0].booking_id });
        const lastBookingData = await this.bookingRepository.findOneBy({ id: tourSeqData[tourSeqData.length - 1].booking_id });
        let firstBookingTime = moment(firstBookingData.reached_pickup);
        let lastBookingTime = moment(lastBookingData.completed_drop);
        let sessionData = await this.driverService.getClosedSession(tourData.driver_id, firstBookingTime.format('YYYY-MM-DD'));
        if (!sessionData) {
            const seesionInput = {
                "start_location": tourSeqData[0].id,
                "user_id": tourData.driver_id,
                "status": true,
                "total_time": 0,
                "total_distance": 0,
                "start_odometer_reading": 1050,
                "end_odometer_reading": 1050,
                "session_start_time": firstBookingData.reached_pickup,
                "session_end_time": lastBookingData.completed_drop,
                "is_closed_session": true
            };
            sessionData = await this.driverService.createTourSession(seesionInput);
        }
        return true;
    }
    async updateTourAsCompleted(tourId) {
        await this.tourRouteRepository.update({ tour_id: tourId }, { status: 'Completed' });
        await this.toursRepository.update({ id: tourId }, { status: 'Completed', 'current_status': 3 });
        return;
    }
    async addTour(reqBody) {
        let statusData = [];
        let bookingDate = '';
        let bData = await this.bookingRepository.findOneBy({ id: reqBody.booking_id[0] });
        bookingDate = bData.pickup_time;
        for (let bId of reqBody.booking_id) {
            bData = await this.bookingRepository.findOneBy({ id: bId });
            bookingDate = bData.pickup_time;
            if (bData.is_closed_booking) {
                reqBody['is_closed_tour'] = true;
                reqBody['created_at'] = bData.pickup_time;
            }
        }
        const tourInput = {
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
        };
        if (bData.booking_type) {
            tourInput['tour_for'] = bData.booking_type;
        }
        else {
            tourInput['tour_for'] = 'GoodMove';
        }
        const tourData = await this.toursRepository.save(tourInput);
        for (let tRoute of reqBody.sequence) {
            const lat = tRoute.transport_type == 'pickup' ? tRoute.pickup_lat : tRoute.dropoff_lat;
            const long = tRoute.transport_type == 'pickup' ? tRoute.pickup_long : tRoute.dropoff_long;
            const pointObject = {
                type: "Point",
                coordinates: [long, lat]
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
            };
            const statusObj = {
                tour_id: tourData.id,
                booking_id: tRoute.booking_id,
                trip_id: tRoute.trip_id
            };
            statusData.push(statusObj);
            const existingSeqData = await this.tourRouteRepository.find({ where: { booking_id: tRoute.booking_id, trip_id: tRoute.trip_id, transport_type: tRoute.transport_type } });
            if (existingSeqData && existingSeqData.length) {
                let updData = { tour_id: tourData.id, sequence_number: tRoute.sequence_number };
                if (existingSeqData[0].status == '' || existingSeqData[0].status == null) {
                    updData['estimated_time'] = null;
                    updData['completed_time'] = null;
                }
                const seqData = await this.tourRouteRepository.update({ booking_id: tRoute.booking_id, trip_id: tRoute.trip_id, transport_type: tRoute.transport_type }, updData);
            }
            else {
                const seqData = await this.tourRouteRepository.save(tRouteInput);
            }
            await this.tripRepo.update({ trip_id: tRoute.trip_id }, { tour_id: tourData.id });
        }
        let driverData = await this.driversRepository.findOneBy({ user_id: reqBody.driver_id });
        for (let bId of reqBody.booking_id) {
            let updBooking = {};
            updBooking["assign_tour_status_graph"] = 1;
            updBooking['driver_name'] = driverData.name;
            updBooking['driver_mobile'] = driverData.mobile_number;
            const truckData = await this.trucksRepository.findOneBy({ id: driverData.truck_id });
            updBooking['vehicle_number'] = truckData.registration_number;
            const bUpdateData = await this.bookingRepository.update(bId, updBooking);
            const tourBookingIput = {
                "tour_id": tourData.id,
                "booking_id": bId,
                "booking_fare": 100
            };
            const tourBookingDetailsData = await this.tourBookingDetails.save(tourBookingIput);
        }
        const statusBookings = statusData.filter((v, i, a) => a.findIndex(v2 => ['tour_id', 'booking_id', 'trip_id'].every(k => v2[k] === v[k])) === i);
        for (let statusB of statusBookings) {
            let bs = await this.bookingService.getBSByBookingTourId(statusB.booking_id, 0);
            if (!bs) {
                const bsReq = {
                    booking_id: statusB.booking_id,
                    status: 'Tour Created',
                    created_by: 1,
                    trip_id: statusB.trip_id,
                    tour_id: statusB.tour_id,
                    created_at: reqBody.is_closed_tour ? reqBody.created_at : new Date(),
                    updated_at: reqBody.is_closed_tour ? reqBody.created_at : new Date()
                };
                await this.bookingService.addBookingStatus(bsReq);
            }
            await this.bookingService.updateBookingStatus({ booking_id: statusB.booking_id, tour_id: 0 }, { tour_id: statusB.tour_id });
            if (reqBody.is_closed_tour) {
                let tourStatus = {
                    'reached_pickup': 'Reached pickup',
                    'completed_pickup': 'Completed pickup',
                    'reached_drop': 'Reached drop',
                    'completed_drop': 'Completed drop',
                    'tour_completed': 'Tour Completed'
                };
                let tourStatusSeq = [
                    'reached_pickup',
                    'completed_pickup',
                    'reached_drop',
                    'completed_drop',
                    'tour_completed'
                ];
                for (const status of tourStatusSeq) {
                    const bsReq = {
                        booking_id: statusB.booking_id,
                        status: tourStatus[status],
                        created_by: 1,
                        trip_id: statusB.trip_id,
                        tour_id: statusB.tour_id,
                        created_at: reqBody[status],
                        updated_at: new Date()
                    };
                    await this.bookingService.addBookingStatus(bsReq);
                }
            }
        }
        if (driverData) {
            let tData = {
                "tour_id": tourData.id,
                "truck_owner_id": driverData.truck_owner_id,
                "driver_id": driverData.id,
                "truck_id": driverData.truck_id
            };
            const tourAssignDetails = await this.tourAssignTruckDriverRepository.findOneBy({ tour_id: tourData.id });
            if (tourAssignDetails) {
                await this.tourAssignTruckDriverRepository.update({ tour_id: tourData.id }, tData);
            }
            else {
                await this.tourAssignTruckDriverRepository.save(tData);
            }
            if (!reqBody.is_closed_tour) {
                const driverToken = await this.utilsService.getDeviceToken(reqBody.driver_id);
                const TITLE = 'Tour #' + tourData.id;
                const BODY = 'A new tour has been assigned to you. Please accept the tour.';
                if (driverToken) {
                    await this.utilsService.sendPushNotification(TITLE, BODY, driverToken.split(","));
                }
            }
        }
        if (reqBody.is_closed_tour) {
            await this.locService.calcDriverSessionDistance(reqBody.driver_id, tourData.id);
        }
        else {
        }
        await this.updateVehicleLiveData(tourData.id, { isNew: true });
        return tourData;
    }
    async updateVehicleLiveData(tourId, updateData = {}) {
        const tourStatus = ['Completed'];
        let tourAssignData = await this.tourAssignTruckDriverRepository.findOne({ where: { tour_id: tourId } });
        if (tourAssignData) {
            const tourData = await this.toursRepository.findOneBy({ id: tourId });
            let isPreviousToursExist = false;
            const beforeTours = await this.toursRepository.find({ where: { driver_id: tourAssignData.driver_id, id: (0, typeorm_2.LessThan)(tourId) }, order: { tour_date: 'DESC', tour_time: 'DESC' } });
            if (beforeTours.length) {
                if (beforeTours[0].status != 'Complete') {
                    isPreviousToursExist = true;
                }
            }
            if (!isPreviousToursExist) {
                let vLiveData = await this.vehicleLiveDataRepo.findOne({ where: { driver_id: tourData.driver_id } });
                if (vLiveData) {
                    if (updateData.isNew) {
                        await this.vehicleLiveDataRepo.update({ driver_id: tourData.driver_id }, { tour_id: tourId, weight: '0' });
                    }
                    else {
                        let weight = parseFloat(vLiveData.volume);
                        const booking = await this.bookingRepository.findOneBy({ id: updateData.booking_id });
                        if (updateData.pickup) {
                            weight += parseInt(booking.commodity_weight);
                        }
                        else {
                            weight -= parseInt(booking.commodity_weight);
                        }
                        await this.vehicleLiveDataRepo.update({ driver_id: tourData.driver_id }, { tour_id: tourId, weight: weight.toString() });
                    }
                }
                else {
                    await this.vehicleLiveDataRepo.save({ driver_id: tourData.driver_id, tour_id: tourId, volume: '0', weight: '0', vehicle_id: tourAssignData.truck_id });
                }
            }
        }
    }
    async updateTourDriver(reqBody) {
        let driverData = await this.driversRepository.findOneBy({ user_id: reqBody.driver_id });
        if (driverData) {
            let tData = {
                "tour_id": reqBody.tour_id,
                "truck_owner_id": driverData.truck_owner_id,
                "driver_id": driverData.id,
                "truck_id": driverData.truck_id
            };
            const tourAssignDetails = await this.tourAssignTruckDriverRepository.findOneBy({ tour_id: reqBody.tour_id });
            if (tourAssignDetails) {
                await this.tourAssignTruckDriverRepository.update({ tour_id: reqBody.tour_id }, tData);
            }
            else {
                await this.tourAssignTruckDriverRepository.create(tData);
            }
            await this.toursRepository.update({ id: reqBody.tour_id }, { 'truck_owner_id': driverData.truck_owner_id, 'driver_id': driverData.user_id, 'truck_owner_status': 'Assigned', 'status': 'Assigned', current_status: 1 });
        }
        return driverData;
    }
    async updateTripStatus(trip_id, status) {
        const upds = await this.tripRepo.update({ trip_id: trip_id }, { status: status });
        return upds;
    }
    async completeTourRoute(seqNum) {
        const seqData = await this.tourRouteRepository.findOneBy({ id: seqNum });
        const upds = await this.tourRouteRepository.update({ id: seqNum }, { status: 'Completed' });
        await this.updateTripStatus(seqData.trip_id, 'Completed ' + seqData.transport_type);
        const bsReq = {
            booking_id: seqData.booking_id,
            status: 'Completed' + ' ' + seqData.transport_type,
            created_by: 1,
            trip_id: seqData.trip_id,
            tour_id: seqData.tour_id,
            created_at: new Date(),
            updated_at: new Date()
        };
        await this.bookingService.addBookingStatus(bsReq);
        const tourData = await this.toursRepository.findOneBy({ id: seqData.tour_id });
        const bookingDetails = await this.bookingRepository.findOneBy({ id: seqData.booking_id });
        if (seqData.transport_type == 'pickup' && (bookingDetails.pickup_location == seqData.location_address)) {
            const driverDetails = await this.driversRepository.findOneBy({ user_id: tourData.driver_id });
            const dName = driverDetails.name;
            const userToken = await this.utilsService.getDeviceToken(bookingDetails.customer_id);
            const TITLE = 'Booking id #' + bookingDetails.id;
            const BODY = 'Your consignment has been picked up by Mr. #' + dName + ' on time!';
            if (userToken) {
                await this.utilsService.sendPushNotification(TITLE, BODY, userToken.split(","));
            }
        }
        if (seqData.transport_type == 'drop' && (bookingDetails.dropoff_location == seqData.location_address)) {
            const driverDetails = await this.driversRepository.findOneBy({ user_id: tourData.driver_id });
            const dName = driverDetails.name;
            const userToken = await this.utilsService.getDeviceToken(bookingDetails.customer_id);
            const TITLE = 'Booking id #' + bookingDetails.id;
            const BODY = 'Your consignment has been delivered by Mr. #' + dName + '. Thank you for shipping with us!';
            if (userToken) {
                await this.utilsService.sendPushNotification(TITLE, BODY, userToken.split(","));
            }
        }
        return upds;
    }
    async reachedTourRoute(seqNum) {
        const seqData = await this.tourRouteRepository.findOneBy({ id: seqNum });
        const upds = await this.tourRouteRepository.update({ id: seqNum }, { status: 'Reached' });
        await this.updateTripStatus(seqData.trip_id, 'Reached ' + seqData.transport_type);
        return upds;
    }
    async checkAndUpdateTourComplete(tourData) {
        let seqOrder = await this.tourRouteRepository.find({ where: { tour_id: tourData.id }, order: { sequence_number: 'DESC' } });
        if (seqOrder && !seqOrder.length) {
            if (seqOrder[0].status == 'Completed') {
                const completeTime = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss');
                await this.toursRepository.update({ id: tourData.id }, { status: 'Completed', tour_status: 'Tour Completed', current_status: 3, complete_time: completeTime });
                await this.redis.del(`veh:tour:${tourData.driver_id}`);
                console.log(`[tourComplete] deleted Redis key veh:tour:${tourData.driver_id} for completed tour ${tourData.id}`);
            }
        }
    }
    async estimateNextSequence(seqData) {
        let estimateTime = '';
        let nextSeqData = await this.tourRouteRepository.findOne({ where: { tour_id: seqData.tour_id, status: (0, typeorm_2.Not)('Reached'), id: (0, typeorm_2.MoreThan)(seqData.id) }, order: { id: 'ASC' } });
        if (nextSeqData) {
            const time = await this.estimateTimeByLatLong({ latitude: seqData.location.coordinates[1], longitude: seqData.location.coordinates[0] }, { latitude: nextSeqData.location.coordinates[1], longitude: nextSeqData.location.coordinates[0] });
            estimateTime = moment().add(time, "minutes").tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss');
            await this.tourRouteRepository.update({ id: nextSeqData.id }, { estimated_time: estimateTime });
        }
    }
    async updateSequence(reqBody) {
        const response = { updated: true };
        const seqIds = reqBody.seqNum;
        let notes = '';
        for (let seqNum of seqIds) {
            let timeType = '';
            const seqData = await this.tourRouteRepository.findOneBy({ id: seqNum });
            const upds = await this.tourRouteRepository.update({ id: seqNum }, { status: reqBody.status, updated_at: new Date() });
            await this.updateTripStatus(seqData.trip_id, reqBody.status + ' ' + seqData.transport_type);
            const tourData = await this.toursRepository.findOneBy({ id: seqData.tour_id });
            if (tourData.truck_owner_status != 'Accepted') {
                const acceptTime = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss');
                await this.toursRepository.update({ id: seqData.tour_id }, { 'truck_owner_status': 'Accepted', status: 'Accepted', current_status: 2, accept_time: acceptTime, is_delay: false });
                const driverDetails = await this.driversRepository.findOneBy({ user_id: tourData.driver_id });
                const truckData = await this.trucksRepository.findOneBy({ id: driverDetails.truck_id });
                await this.bookingRepository.update({ id: seqData.booking_id }, { 'driver_name': driverDetails.name, 'driver_mobile': driverDetails.mobile_number, 'vehicle_number': truckData.registration_number });
                await this.tourRouteRepository.update({ id: seqNum }, { estimated_time: acceptTime, completed_time: acceptTime });
                await this.locService.calcDriverSessionDistance(tourData.driver_id, tourData.id);
            }
            if (reqBody.is_from_manager) {
                await this.bookingRepository.update({ id: seqData.booking_id }, { 'is_manager_entered': true, is_manager_updated_tour: true });
            }
            const bookingDetails = await this.bookingRepository.findOneBy({ id: seqData.booking_id });
            if (reqBody.status == 'Reached') {
                timeType = 'reached_';
                const driverToken = await this.utilsService.getDeviceToken(tourData.driver_id);
                const TITLE = 'Tour Id #' + tourData.id;
                const baseLoc = await this.baseLocationRepo.findOneBy({ address: seqData.location_address });
                let BODY = 'You have reached the ';
                if (baseLoc) {
                    BODY = BODY + baseLoc.unique_id + ' Base location.';
                }
                else {
                    BODY = BODY + seqData.transport_type + ' location.';
                }
                if (driverToken && driverToken != "") {
                    await this.utilsService.sendPushNotification(TITLE, BODY, driverToken.split(","));
                }
                if (seqData.transport_type == 'pickup' && (bookingDetails.pickup_location == seqData.location_address)) {
                    const userToken = await this.utilsService.getDeviceToken(bookingDetails.customer_id);
                    const TITLE = 'Booking id #' + bookingDetails.id;
                    const BODY = 'Driver has reached the pick up location. Please load the goods immediately to avoid waiting charges.';
                    if (userToken) {
                        await this.utilsService.sendPushNotification(TITLE, BODY, userToken.split(","));
                    }
                }
                if (seqData.transport_type == 'drop' && (bookingDetails.dropoff_location == seqData.location_address)) {
                    const userToken = await this.utilsService.getDeviceToken(bookingDetails.customer_id);
                    const TITLE = 'Booking id #' + bookingDetails.id;
                    const BODY = 'Driver has reached the drop off location. Please unload the goods immediately to avoid waiting charges.';
                    if (userToken) {
                        await this.utilsService.sendPushNotification(TITLE, BODY, userToken.split(","));
                    }
                }
                const completedTime = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss');
                await this.tourRouteRepository.update({ id: seqNum }, { completed_time: completedTime });
                await this.updateTourStopStatus(tourData.driver_id, seqData.booking_id, seqData.transport_type, completedTime);
            }
            if (reqBody.status == 'Completed') {
                timeType = 'completed_';
                if (seqData.transport_type == 'pickup' && (bookingDetails.pickup_location == seqData.location_address)) {
                    const driverDetails = await this.driversRepository.findOneBy({ user_id: tourData.driver_id });
                    await this.locService.calcDriverSessionDistance(tourData.driver_id, tourData.id);
                    const dName = driverDetails.name;
                    const userToken = await this.utilsService.getDeviceToken(bookingDetails.customer_id);
                    const TITLE = 'Booking id #' + bookingDetails.id;
                    const BODY = 'Your consignment has been picked up by Mr. ' + dName + ' on time!';
                    if (userToken) {
                        await this.utilsService.sendPushNotification(TITLE, BODY, userToken.split(","));
                    }
                }
                if (seqData.transport_type == 'drop' && (bookingDetails.dropoff_location == seqData.location_address)) {
                    const driverDetails = await this.driversRepository.findOneBy({ user_id: tourData.driver_id });
                    const dName = driverDetails.name;
                    await this.checkAndUpdateTourComplete(tourData);
                    const userToken = await this.utilsService.getDeviceToken(bookingDetails.customer_id);
                    const TITLE = 'Booking id #' + bookingDetails.id;
                    const BODY = 'Your consignment has been delivered by Mr. ' + dName + '. Thank you for shipping with us!';
                    if (userToken) {
                        await this.utilsService.sendPushNotification(TITLE, BODY, userToken.split(","));
                    }
                }
                await this.estimateNextSequence(seqData);
                await this.toursRepository.update({ id: seqData.tour_id }, { 'is_delay': false });
                this.updateVehicleLiveData(seqData.tour_id, { pickup: seqData.transport_type == 'pickup' ? true : false, booking_id: seqData.booking_id });
                const completedTime = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss');
                await this.updateTourStopStatus(tourData.driver_id, seqData.booking_id, seqData.transport_type, completedTime);
            }
            timeType = timeType + seqData.transport_type;
            if (seqData.booking_id.toString() == seqData.trip_id) {
                notes = notes + seqData.booking_id + ":if-" + timeType + ',';
                this.bookingService.updateBookingStatusTime(seqData.booking_id, timeType);
            }
            else {
                let trips = await this.tripRepo.find({ where: { booking_id: seqData.booking_id }, order: { trip_id: 'ASC' } });
                if (trips.length) {
                    if (trips[0].trip_id == seqData.trip_id && seqData.transport_type == 'pickup') {
                        notes = notes + seqData.booking_id + ":el-" + timeType + ',';
                        this.bookingService.updateBookingStatusTime(seqData.booking_id, timeType);
                    }
                    if (trips[trips.length - 1].trip_id == seqData.trip_id && seqData.transport_type == 'drop') {
                        notes = notes + seqData.booking_id + ":eld-" + timeType + ',';
                        this.bookingService.updateBookingStatusTime(seqData.booking_id, timeType);
                    }
                }
            }
            const bsReq = {
                booking_id: seqData.booking_id,
                status: reqBody.status + ' ' + seqData.transport_type,
                created_by: 1,
                trip_id: seqData.trip_id,
                tour_id: seqData.tour_id,
                created_at: new Date(),
                updated_at: new Date()
            };
            await this.bookingService.addBookingStatus(bsReq);
        }
        const seq_track = {
            seqNumbers: seqIds,
            reqBody: JSON.stringify({ status: reqBody.status, is_from_manager: reqBody.is_from_manager }),
            notes: notes
        };
        await this.seqTrackRepo.save(seq_track);
        return response;
    }
    async updatePaySequence(reqBody) {
        let response = await this.updateSequence(reqBody);
        const seqIds = reqBody.seqNum;
        let is_full_payment = false;
        for (let seqNum of seqIds) {
            const seqData = await this.tourRouteRepository.findOneBy({ id: seqNum });
            if (seqData.transport_type == 'drop') {
                is_full_payment = true;
            }
            const bookingDetails = await this.bookingRepository.findOneBy({ id: seqData.booking_id });
            let amount_collected = bookingDetails.requestInfo ? bookingDetails.requestInfo['collection_amount'] : bookingDetails.total_fare;
            const updateData = {
                payment_status: 'Completed',
                payment_type: 'COD',
                amount_collected: amount_collected.toString(),
                is_full_payment
            };
            let whereCond = {
                multi_booking_id: bookingDetails.multi_booking_id
            };
            if (!bookingDetails.multi_booking_id || bookingDetails.multi_booking_id == '') {
                whereCond['id'] = bookingDetails.id;
            }
            await this.bookingRepository.update({ multi_booking_id: bookingDetails.multi_booking_id }, updateData);
        }
        return response;
    }
    async completeTour(reqBody) {
        if (reqBody.tour_id) {
            const tourData = await this.toursRepository.findOneBy({ id: reqBody.tour_id });
            this.updateVehicleLiveData(tourData.id, { isNew: true });
            if (tourData && tourData.status != 'Completed') {
                const completeTime = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss');
                const tourUpdData = await this.toursRepository.update({ id: reqBody.tour_id }, { status: 'Completed', current_status: 3, complete_time: completeTime });
                await this.driversRepository.update({ user_id: tourData.driver_id }, { 'status': "Available" });
                const seqData = await this.tourRouteRepository.find({ where: { tour_id: reqBody.tour_id } });
                let bookingIds = [];
                for (let sData of seqData) {
                    if (!(bookingIds.indexOf(sData.booking_id) > -1)) {
                        const bsReq = {
                            booking_id: sData.booking_id,
                            status: 'Tour Completed',
                            created_by: 1,
                            trip_id: sData.trip_id,
                            tour_id: sData.tour_id,
                            created_at: new Date(),
                            updated_at: new Date()
                        };
                        await this.bookingService.addBookingStatus(bsReq);
                        await this.bookingService.checkAndUpdateBookingPaymentStatus({ booking_id: sData.booking_id, status: 'Completed' });
                    }
                    bookingIds.push(sData.booking_id);
                }
                await this.redis.del(`veh:tour:${tourData.driver_id}`);
                console.log(`[tourComplete] deleted Redis key veh:tour:${tourData.driver_id} for completed tour ${tourData.id}`);
                await this.locService.calcDriverSessionDistance(tourData.driver_id, tourData.id);
            }
            return tourData;
        }
        else {
            return null;
        }
    }
    async test(req) {
        let dis = await this.euclideanDistance(12.99105, 80.2429354, 12.990554, 80.24298);
        console.log(dis);
        if (dis <= 50) {
            console.log("s 6");
        }
    }
    async tourInfo(tourId) {
        let resObj = {};
        let tour = await this.toursRepository.findOneBy({ id: tourId });
        const driverData = await this.driversRepository.findOneBy({ user_id: tour.driver_id });
        resObj.tour = tour;
        resObj.driverData = driverData;
        return resObj;
    }
    async deleteTour(id) {
        try {
            let tourSeqData = await this.tourRouteRepository.find({ where: { tour_id: id } });
            for (let seqData of tourSeqData) {
                await this.tripRepo.update({ trip_id: seqData.trip_id }, { tour_id: null });
                await this.bookingRepository.update(seqData.booking_id, { assign_tour_status_graph: 0, reached_pickup: null, completed_pickup: null, reached_drop: null, completed_drop: null, driver_name: null, driver_mobile: null });
                await this.bookingService.cancelByManager(seqData.booking_id);
                await this.removeBookingRedisPoolEntry(seqData.booking_id);
            }
            await this.driverSessionDistance.delete({ tour_id: id });
            await this.tourBookingDetails.delete({ tour_id: id });
            await this.tourRouteRepository.delete({ tour_id: id });
            await this.bookingService.deleteBookingStatus({ tour_id: id });
            await this.tourAssignTruckDriverRepository.delete({ tour_id: id });
            const currentTourData = await this.toursRepository.findOneBy({ id: id });
            const tourData = await this.toursRepository.delete(id);
            await this.clearDriverTourRedis(currentTourData.driver_id);
            if (!currentTourData.is_closed_tour && currentTourData.status != 'Completed') {
                const nextTours = await this.toursRepository.find({ where: { driver_id: currentTourData.driver_id, id: (0, typeorm_2.MoreThan)(currentTourData.id) } });
                if (nextTours.length) {
                    for (let tour of nextTours) {
                        await this.revertTourTrips(tour.id);
                        await this.toursRepository.delete(tour.id);
                        await this.driverSessionDistance.delete({ tour_id: tour.id });
                    }
                }
            }
            console.log(currentTourData.status);
            if (currentTourData.status == 'Accepted') {
                console.log("calling to driver ....");
                await this.callDriverWhenTourEdit({ driver_id: currentTourData.driver_id });
            }
            return tourData;
        }
        catch (e) {
            console.log("error ", e);
            return {};
        }
    }
    async revertTourTrips(tour_id, requeueBookings = true) {
        if (tour_id) {
            let id = tour_id;
            const tourForRedis = await this.toursRepository.findOneBy({ id: tour_id });
            const driverId = tourForRedis === null || tourForRedis === void 0 ? void 0 : tourForRedis.driver_id;
            let tourSeqData = await this.tourRouteRepository.find({ where: { tour_id: id } });
            const requeueBookingIds = new Set();
            for (let seqData of tourSeqData) {
                await this.tripRepo.update({ trip_id: seqData.trip_id }, { tour_id: null });
                await this.bookingRepository.update(seqData.booking_id, { assign_tour_status_graph: 0, driver_name: '', driver_mobile: '', vehicle_number: '' });
                await this.tourRouteRepository.update({ id: seqData.id }, { tour_id: 0 });
                if (requeueBookings) {
                    requeueBookingIds.add(seqData.booking_id);
                }
            }
            await this.tourBookingDetails.delete({ tour_id: id });
            await this.bookingService.updateBookingStatus({ tour_id: id }, { tour_id: 0 });
            await this.tourAssignTruckDriverRepository.delete({ tour_id: id });
            await this.driverSessionDistance.delete({ tour_id: id });
            if (requeueBookings) {
                await this.requeueBookingsToRedisPool([...requeueBookingIds]);
            }
            await this.clearDriverTourRedis(driverId);
            return true;
        }
        else {
            return false;
        }
    }
    async updateTourTrips(reqBody) {
        if (reqBody.tour_id) {
            const currentTourData = await this.toursRepository.findOneBy({ id: reqBody.tour_id });
            await this.revertTourTrips(reqBody.tour_id, false);
            const tourData = await this.toursRepository.delete(reqBody.tour_id);
            if (!currentTourData.is_closed_tour && currentTourData.status != 'Completed') {
                const nextTours = await this.toursRepository.find({ where: { driver_id: currentTourData.driver_id, id: (0, typeorm_2.MoreThan)(currentTourData.id) } });
                if (nextTours.length) {
                    for (let tour of nextTours) {
                        await this.revertTourTrips(tour.id);
                        await this.toursRepository.delete(tour.id);
                        await this.driverSessionDistance.delete({ tour_id: tour.id });
                    }
                }
            }
            if (currentTourData.status == 'Accepted') {
                await this.callDriverWhenTourEdit({ driver_id: currentTourData.driver_id });
            }
            return tourData;
        }
        else {
            return false;
        }
    }
    async addClosedTour(reqBody) {
        reqBody['pickup_time'] = reqBody.reached_pickup;
        reqBody['dropoff_time'] = reqBody.completed_drop;
        reqBody['is_closed_booking'] = true;
        let driverData = await this.driversRepository.findOneBy({ user_id: reqBody.driver_id });
        const truckData = await this.trucksRepository.findOneBy({ id: driverData.truck_id });
        reqBody['driver_name'] = driverData.name;
        reqBody['driver_mobile'] = driverData.mobile_number;
        reqBody['vehicle_number'] = truckData.registration_number;
        let bookingDetails = await this.bookingService.addClosedBooking(reqBody);
        let tripReqData = Object.assign(Object.assign({}, bookingDetails), { booking_id: bookingDetails.id, trip_id: bookingDetails.id });
        let tripData = await this.bookingService.addTrip(tripReqData);
        if (reqBody.booking_type == 'single') {
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
            };
            let tourData = await this.addTour(tourReqData);
            await this.locService.calcDriverSessionDistance(reqBody.driver_id, tourData.id);
        }
        return bookingDetails;
    }
    async updateCallLog(reqBody) {
        if (!reqBody.is_call_to_shop) {
            let logData = await this.callLogRepo.findOne({ where: { driver_id: reqBody.driver_id, booking_id: reqBody.booking_id } });
            if (!logData) {
                const logData = {
                    booking_id: reqBody.booking_id,
                    driver_id: reqBody.driver_id,
                    calls_count: 1,
                    last_call_time: moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss')
                };
                await this.callLogRepo.save(logData);
            }
            else {
                let count = logData.calls_count + 1;
                await this.callLogRepo.update({ id: logData.id }, { calls_count: count });
            }
        }
    }
    async callToCustomer(reqBody) {
        if (reqBody.driver_id && reqBody.booking_id) {
            let receiverMobile = '';
            let bookingData = await this.bookingRepository.findOneBy({ id: reqBody.booking_id });
            if (reqBody.is_call_to_shop) {
                receiverMobile = await bookingData.pickup_receiver_contact;
            }
            else {
                receiverMobile = bookingData.dropoff_receiver_contact ? bookingData.dropoff_receiver_contact : bookingData.receiver_contact;
            }
            receiverMobile = receiverMobile.split(",")[0];
            let driver = await this.utilsService.getUserDetails(reqBody.driver_id);
            if (driver && driver.mobile) {
                try {
                    let url = "https://4f3365eadef570b30d87b1b1bc149bbfb5a52b6742386ab1:1b6674ecf922cd31c0e64fe1ca247698606425e936269152@api.exotel.com/v1/Accounts/gogoodmove1/Calls/connect";
                    let dataString = 'From=' + driver.mobile + '&To=' + receiverMobile + '&CallerId=09513886363&Record=false';
                    let headers = { accept: 'application/json' };
                    let res = await axios_1.default.post(url, dataString, { headers: headers });
                    console.log(url);
                    console.log(dataString);
                    await this.updateCallLog(reqBody);
                    return true;
                }
                catch (e) {
                    return false;
                }
            }
        }
        else {
            return false;
        }
    }
    async callToDriver(reqBody) {
        if (reqBody.driver_id && reqBody.booking_id) {
            let bookingData = await this.bookingRepository.findOneBy({ id: reqBody.booking_id });
            let customer = await this.utilsService.getUserDetails(bookingData.customer_id);
            let driver = await this.utilsService.getUserDetails(reqBody.driver_id);
            if (customer && customer.mobile && driver && driver.mobile) {
                try {
                    let url = "https://4f3365eadef570b30d87b1b1bc149bbfb5a52b6742386ab1:1b6674ecf922cd31c0e64fe1ca247698606425e936269152@api.exotel.com/v1/Accounts/gogoodmove1/Calls/connect";
                    let dataString = 'From=' + customer.mobile + '&To=' + driver.mobile + '&CallerId=09513886363&Record=false';
                    let headers = { accept: 'application/json' };
                    let res = await axios_1.default.post(url, dataString, { headers: headers });
                    return true;
                }
                catch (e) {
                    return false;
                }
            }
        }
        else {
            return false;
        }
    }
    async testExotel(reqBody) {
        try {
            let url = "https://4f3365eadef570b30d87b1b1bc149bbfb5a52b6742386ab1:1b6674ecf922cd31c0e64fe1ca247698606425e936269152@api.exotel.com/v1/Accounts/gogoodmove1/Calls/connect";
            let dataString = 'From=6300359889&CallerId=09513886363&Record=false&Url=http://my.exotel.com/Exotel/exoml/start_voice/673388';
            let headers = { accept: 'application/json' };
            let res = await axios_1.default.post(url, dataString, { headers: headers });
            return true;
        }
        catch (e) {
            return false;
        }
    }
    async testExotelByNumbers(reqBody) {
        try {
            let url = "https://4f3365eadef570b30d87b1b1bc149bbfb5a52b6742386ab1:1b6674ecf922cd31c0e64fe1ca247698606425e936269152@api.exotel.com/v1/Accounts/gogoodmove1/Calls/connect";
            let dataString = 'From=' + reqBody.from + '&To=' + reqBody.to + '&CallerId=09513886363';
            let headers = { accept: 'application/json' };
            let res = await axios_1.default.post(url, dataString, { headers: headers });
            return true;
        }
        catch (e) {
            return false;
        }
    }
    async updateBookingTime(reqBody) {
        let booking = await this.bookingService.updateBookingTime(reqBody);
        const bookingId = reqBody.booking_id;
        const tourRoute = await this.tourRouteRepository.findOne({ where: { booking_id: bookingId } });
        if (tourRoute) {
            let tourSeq = await this.tourRouteRepository.find({ where: { tour_id: tourRoute.tour_id }, order: { sequence_number: 'ASC' } });
            if (tourSeq[0].booking_id == reqBody.booking_id) {
                await this.driverSessionDistance.delete({ tour_id: tourSeq[0].tour_id });
                const tourData = await this.toursRepository.findOneBy({ id: reqBody.tour_id });
                if (tourData) {
                    let pickup_time = new Date(reqBody.reached_pickup);
                    let tour_date = moment(pickup_time).format('YYYY-MM-DD');
                    let tour_time = moment(pickup_time).format('HH:mm:ss');
                    const tourUpdData = await this.toursRepository.update({ id: reqBody.tour_id }, { tour_date: tour_date, tour_time: tour_time });
                }
                await this.locService.calcDriverSessionDistance(tourData.driver_id, tourData.id);
                return tourData;
            }
        }
        return booking;
    }
    async getTourDistance(reqBody) {
        const tourDistance = await this.locService.calcTourDistance(reqBody.tour_id);
        return tourDistance;
    }
    async euclideanDistance(lat1, long1, lat2, long2) {
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
        const distance = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2) + Math.pow(z1 - z2, 2));
        return Math.floor(distance * 1000);
    }
    ;
    async callDriverWhenTourEdit(reqBody) {
        if (reqBody.driver_id) {
            console.log("welcome ", reqBody.driver_id);
            let driver = await this.driversRepository.findOne({ where: { user_id: reqBody.driver_id } });
            try {
                let url = "https://4f3365eadef570b30d87b1b1bc149bbfb5a52b6742386ab1:1b6674ecf922cd31c0e64fe1ca247698606425e936269152@api.exotel.com/v1/Accounts/gogoodmove1/Calls/connect";
                let dataString = 'From=' + driver.mobile_number + '&CallerId=09513886363&Url=http://my.exotel.com/gogoodmove1/exoml/start_voice/720461';
                let headers = { accept: 'application/json' };
                let res = await axios_1.default.post(url, dataString, { headers: headers });
                console.log(res);
                console.log(res.data);
                return true;
            }
            catch (e) {
                console.log(e);
                return false;
            }
        }
        else {
            console.log("reqBody");
            console.log(reqBody);
            return false;
        }
    }
    async tourDetailsData(tourId) {
        let resObj = { tour: {}, tourSequence: [] };
        let tour = await this.toursRepository.findOneBy({ id: tourId });
        let tourRoute = await this.tourRouteRepository.find({ where: { tour_id: tour.id }, order: { sequence_number: 'ASC' } });
        resObj.tour = tour;
        resObj.tourSequence = tourRoute;
        return resObj;
    }
    async notificationToCustomerAboutDriverWaiting() {
        let tours = await this.toursRepository.find({ where: { status: (0, typeorm_2.Not)((0, typeorm_2.In)(['Completed', 'Rejected', 'Assigned'])) } });
        if (tours && tours.length) {
            for (let tour of tours) {
                let tourRoute = await this.tourRouteRepository.find({ where: { tour_id: tour.id, status: 'Reached' }, order: { id: 'ASC' } });
                if (tourRoute && tourRoute.length) {
                    let reachedTime = moment(tourRoute[0].updated_at);
                    let lastBookingTime = moment(new Date());
                    let total_time = lastBookingTime.diff(reachedTime, 'minutes');
                    if (total_time > 5) {
                        let bookingData = await this.bookingRepository.findOneBy({ id: tourRoute[0].booking_id });
                        if (bookingData) {
                            const driverToken = await this.utilsService.getDeviceToken(245);
                            const driverDetails = await this.driversRepository.findOneBy({ user_id: tour.driver_id });
                            const driverName = driverDetails.name;
                            const TITLE = 'Driver Reached Location to Booking id #' + bookingData.id;
                            const BODY = 'Mr. ' + driverName + ' waiting for Goods to ' + tourRoute[0].transport_type + '.';
                            if (driverToken) {
                                await this.utilsService.sendPushNotification(TITLE, BODY, driverToken.split(","));
                            }
                        }
                    }
                }
            }
        }
    }
    async driverToursList(reqBody) {
        var _a, e_7, _b, _c;
        let tours = [];
        let tourDate = moment(new Date()).add(-60, 'days').format('YYYY-MM-DD');
        let [items, count] = await this.toursRepository.findAndCount({ where: { status: (0, typeorm_2.Not)('Assigned'), driver_id: reqBody.driver_id, tour_date: (0, typeorm_2.MoreThanOrEqual)(tourDate) }, order: { current_status: 'ASC', id: 'DESC' } });
        try {
            for (var _d = true, items_2 = __asyncValues(items), items_2_1; items_2_1 = await items_2.next(), _a = items_2_1.done, !_a;) {
                _c = items_2_1.value;
                _d = false;
                try {
                    const tourD = _c;
                    let tourData = {
                        id: tourD.id,
                        status: tourD.status,
                        bookingsData: [],
                        tourDate: tourD.tour_date,
                        company_name: ''
                    };
                    let tourRouteBookings = await this.tourRouteRepository.createQueryBuilder('tr')
                        .select('DISTINCT(booking_id)')
                        .where("tour_id = :tourID", { tourID: tourD.id })
                        .getRawMany();
                    if (tourRouteBookings && tourRouteBookings.length) {
                        let customerIds = [];
                        for (let bookingData of tourRouteBookings) {
                            let bookingInfo = {};
                            let booking = await this.bookingRepository.findOneBy({ id: bookingData.booking_id });
                            customerIds.push(booking.customer_id);
                            if (booking) {
                                bookingInfo['id'] = booking.id;
                                bookingInfo['pickup'] = booking.pickup_location;
                                bookingInfo['dropoff'] = booking.dropoff_location;
                                bookingInfo['tdcNumber'] = booking.tdcNumber;
                                bookingInfo['reached_pickup'] = booking.reached_pickup ? booking.reached_pickup : booking.pickup_time;
                            }
                            tourData.bookingsData.push(bookingInfo);
                        }
                        let custIds = [...new Set(customerIds)];
                        for (let custId of custIds) {
                            let customer_company_details = await this.customerCompanyDetails.findOne({ where: { users: (0, typeorm_2.Like)((`%#${custId},%`)) } });
                            tourData.company_name += (customer_company_details ? customer_company_details.company_name : '') + ",";
                        }
                        tourData.company_name = tourData.company_name.replace(/,+$/, '');
                    }
                    tours.push(tourData);
                }
                finally {
                    _d = true;
                }
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = items_2.return)) await _b.call(items_2);
            }
            finally { if (e_7) throw e_7.error; }
        }
        return tours;
    }
    async driverBookingsList(reqBody) {
        var _a, e_8, _b, _c;
        let bookings = [];
        let tourDate = moment(new Date()).add(-60, 'days').format('YYYY-MM-DD');
        let [items, count] = await this.toursRepository.findAndCount({ where: { status: (0, typeorm_2.Not)('Assigned'), driver_id: reqBody.driver_id, tour_date: (0, typeorm_2.MoreThanOrEqual)(tourDate) }, order: { current_status: 'ASC', id: 'DESC' } });
        try {
            for (var _d = true, items_3 = __asyncValues(items), items_3_1; items_3_1 = await items_3.next(), _a = items_3_1.done, !_a;) {
                _c = items_3_1.value;
                _d = false;
                try {
                    const tourD = _c;
                    let tourRouteBookings = await this.tourRouteRepository.createQueryBuilder('tr')
                        .select('DISTINCT(booking_id)')
                        .where("tour_id = :tourID", { tourID: tourD.id })
                        .getRawMany();
                    if (tourRouteBookings && tourRouteBookings.length) {
                        let customerIds = [];
                        for (let bookingData of tourRouteBookings) {
                            let bookingInfo = {};
                            let booking = await this.bookingRepository.findOneBy({ id: bookingData.booking_id });
                            if (booking) {
                                bookingInfo['tour_id'] = tourD.id;
                                bookingInfo['id'] = booking.id;
                                bookingInfo['pickup'] = booking.pickup_location;
                                bookingInfo['dropoff'] = booking.dropoff_location;
                                bookingInfo['tdcNumber'] = booking.tdcNumber;
                                bookingInfo['reached_pickup'] = booking.reached_pickup ? booking.reached_pickup : booking.pickup_time;
                            }
                            let customer_company_details = await this.customerCompanyDetails.findOne({ where: { users: (0, typeorm_2.Like)((`%#${booking.customer_id},%`)) } });
                            bookingInfo['company_name'] = (customer_company_details ? customer_company_details.company_name : '') + ",";
                            bookings.push(bookingInfo);
                        }
                    }
                }
                finally {
                    _d = true;
                }
            }
        }
        catch (e_8_1) { e_8 = { error: e_8_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = items_3.return)) await _b.call(items_3);
            }
            finally { if (e_8) throw e_8.error; }
        }
        return bookings;
    }
    async checkDelayTours(reqBody) {
        let tourIds = [];
        let tourDriverMap = {};
        let tours = await this.toursRepository.find({ where: { status: 'Accepted' } });
        for (let tour of tours) {
            tourIds.push(tour.id);
            tourDriverMap[tour.id] = tour.driver_id;
        }
        const tourRoutes = await this.tourRouteRepository.find({ where: { tour_id: (0, typeorm_2.In)(tourIds), estimated_time: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()), completed_time: (0, typeorm_2.IsNull)() } });
        for (let tourRoute of tourRoutes) {
            let now = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss');
            if (tourRoute.estimated_time < now) {
                console.log("send notification to driver ...", tourDriverMap[tourRoute.tour_id]);
                const driverToken = await this.utilsService.getDeviceToken(tourDriverMap[tourRoute.tour_id]);
                const TITLE = 'Delay Alert!!';
                const BODY = 'Your current pace is behind the expected schedule. Please reach the location within the expected time window.';
                if (driverToken) {
                    await this.utilsService.sendPushNotification(TITLE, BODY, driverToken.split(","));
                }
                await this.toursRepository.update({ id: tourRoute.tour_id }, { is_delay: true });
            }
        }
        return true;
    }
    async tagMissingTour(tours, tourType, tourId) {
        for (let tour of tours) {
            let sessD = await this.driverSessionDistance.find({ where: { tour_id: tour.id } });
            if (sessD && sessD.length) {
                let sessionId = sessD[0].session_id;
                let totalSessionDistance = await this.locService.calcTourDistance(tourId);
                let sessionDistanceData = {
                    session_id: sessionId,
                    tour_id: tourId,
                    distance: totalSessionDistance,
                    tour_type: tourType
                };
                await this.driverSessionDistance.save(sessionDistanceData);
                let distance = 0;
                let [items] = await this.driverSessionDistance.findAndCount({ where: { session_id: sessionId } });
                for (let item of items) {
                    distance = distance + parseFloat(item.distance);
                }
                distance = Math.ceil(distance);
                await this.dsRepo.update({ id: sessionId }, { total_distance: distance.toString() });
                break;
            }
        }
    }
    async checkTourSessionTagging(reqBody) {
        const tourDate = reqBody.cal_date;
        let driverIds = [];
        let drivers = await this.toursRepository.createQueryBuilder('t')
            .select('DISTINCT(driver_id)')
            .where("tour_date = :tourDate", { tourDate: tourDate })
            .orderBy('driver_id')
            .getRawMany();
        for (let driver of drivers) {
            driverIds.push(driver.driver_id);
        }
        for (let driverId of driverIds) {
            let tours = await this.toursRepository.find({ where: { driver_id: driverId, tour_date: tourDate }, order: { id: 'ASC' } });
            let i = 0;
            for (let tour of tours) {
                if (tour.status != 'Rejected' && tour.status != 'Assigned') {
                    let sessionDistance = await this.driverSessionDistance.find({ where: { tour_id: tour.id } });
                    console.log(tour.id);
                    if (!sessionDistance || !sessionDistance.length) {
                        await this.tagMissingTour(tours, tour.tour_type, tour.id);
                    }
                    else {
                    }
                }
                i++;
            }
        }
        return true;
    }
    async cleanDoubleTagged(reqBody) {
        const tourDate = reqBody.cal_date;
        let tours = await this.driverSessionDistance.createQueryBuilder('t')
            .select('tour_id, count(tour_id) as count')
            .groupBy("tour_id")
            .having('count(tour_id) > 1')
            .getRawMany();
        for (let tour of tours) {
            let i = 0;
            let sessionDistances = await this.driverSessionDistance.find({ where: { tour_id: tour.tour_id } });
            for (let sd of sessionDistances) {
                i++;
                if (i == 1) {
                    continue;
                }
                else {
                    console.log("deleting ", sd.tour_id);
                    await this.driverSessionDistance.delete({ id: sd.id });
                }
            }
        }
        return true;
    }
    async deleteBookingTour(bookingId) {
        let tourSeqData = await this.tourRouteRepository.find({ where: { booking_id: bookingId } });
        if (tourSeqData.length) {
            const tourId = tourSeqData[0].tour_id;
            const tourForRedis = await this.toursRepository.findOneBy({ id: tourId });
            const driverId = tourForRedis === null || tourForRedis === void 0 ? void 0 : tourForRedis.driver_id;
            for (let seqData of tourSeqData) {
                await this.tripRepo.delete({ booking_id: bookingId });
                await this.tourRouteRepository.delete({ id: seqData.id });
            }
            await this.tourAssignTruckDriverRepository.delete({ tour_id: tourId });
            let remainingSeqData = await this.tourRouteRepository.find({ where: { tour_id: tourId }, order: { sequence_number: 'ASC' } });
            if (remainingSeqData.length) {
                let seqNo = 1;
                for (let seqData of remainingSeqData) {
                    await this.tourRouteRepository.update({ id: seqData.id }, { sequence_number: seqNo });
                    seqNo++;
                }
                await this.removeBookingStopFromRedisTour(driverId, bookingId);
            }
            else {
                await this.clearDriverTourRedis(driverId);
                const currentTourData = await this.toursRepository.findOneBy({ id: tourId });
                const tourData = await this.toursRepository.delete(tourId);
                const nextTours = await this.toursRepository.find({ where: { driver_id: currentTourData.driver_id, id: (0, typeorm_2.MoreThan)(currentTourData.id) }, order: { id: 'ASC' } });
                if (nextTours.length) {
                    for (let tour of nextTours) {
                        await this.revertTourTrips(tour.id);
                        await this.toursRepository.delete(tour.id);
                        await this.driverSessionDistance.delete({ tour_id: tour.id });
                    }
                }
                await this.callDriverWhenTourEdit({ driver_id: currentTourData.driver_id });
            }
            await this.removeBookingRedisPoolEntry(bookingId);
        }
        return;
    }
    async vehicleLiveDataList(reqBody) {
        let vehiclesRes = [];
        let liveData = await this.vehicleLiveDataRepo.find();
        for (let vehicleData of liveData) {
            console.log(vehicleData);
            let tourData = await this.toursRepository.findOneBy({ id: vehicleData.tour_id });
            let loc = await this.locService.getDriverLatestLoc(tourData.driver_id);
            console.log(loc);
            if (loc) {
                vehiclesRes.push(Object.assign(Object.assign({}, vehicleData), { latitude: loc.latitude, longitude: loc.longitude }));
            }
            else {
                vehiclesRes.push(vehicleData);
            }
        }
        return vehiclesRes;
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
    async interpolateCoord(p1, p2, t) {
        return [
            p1[0] + (p2[0] - p1[0]) * t,
            p1[1] + (p2[1] - p1[1]) * t,
        ];
    }
    async getWaypointsEveryFewMinutes(lon1, lat1, lon2, lat2, tourTime) {
        const noMins = 2;
        const data = await this.utilsService.getWaypointsWithTimeFromGOOSRM({ lat: lat1, long: lon1 }, { lat: lat2, long: lon2 });
        if (!data.routes || !data.routes.length) {
            throw new Error('No route found');
        }
        const route = data.routes[0];
        const steps = route.legs[0].steps;
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
        const timeInterval = noMins * 60;
        let nextWaypointTime = noMins * 60;
        let tourTimeMins = 0;
        for (let segment of polylineWithDurations) {
            if (timeCounter + segment.duration >= nextWaypointTime) {
                const remain = nextWaypointTime - timeCounter;
                const frac = remain / segment.duration;
                console.log(frac, remain, segment.duration);
                const interpolated = await this.interpolateCoord(segment.start, segment.end, frac);
                nextWaypointTime += timeInterval;
                const mins = Math.round(tourTimeMins ? tourTimeMins / timeInterval : 0) * noMins;
                tourTime.add(mins, 'minutes');
                waypoints.push({ lat: interpolated[0] / 10, long: interpolated[1] / 10, estimateTime: tourTime.format("YYYY-MM-DD HH:mm:ss") });
                tourTimeMins = 0;
            }
            timeCounter += segment.duration;
            tourTimeMins += segment.duration;
        }
        return { waypoints, tourTime };
    }
    async estimateLiveVehicleData(reqBody) {
        let vehiclesRes = [];
        const noMins = 2;
        let liveData = await this.vehicleLiveDataRepo.find();
        for (let vehicleData of liveData) {
            console.log(vehicleData.tour_id);
            let tourData = await this.toursRepository.findOneBy({ id: vehicleData.tour_id });
            if (tourData) {
                let tourTime = moment(tourData.tour_date + " " + tourData.tour_time);
                let finalTime = moment(tourData.tour_date + " " + tourData.tour_time);
                finalTime.add(3, 'hours');
                let tourRoute = await this.tourRouteRepository.findBy({ tour_id: vehicleData.tour_id });
                let i = 0;
                let waypoints = [];
                for (let seq of tourRoute) {
                    if (tourRoute[i + 1]) {
                        let source = { lat: seq.location.coordinates[1], long: seq.location.coordinates[0] };
                        let destination = { lat: tourRoute[i + 1].location.coordinates[1], long: tourRoute[i + 1].location.coordinates[0] };
                        const coordsData = await this.getWaypointsEveryFewMinutes(source.long, source.lat, destination.long, destination.lat, tourTime);
                        tourTime = coordsData.tourTime.add(15, 'minutes');
                        waypoints = waypoints.concat(coordsData.waypoints);
                    }
                    i++;
                }
                let lastPoint = waypoints[waypoints.length - 1];
                if (finalTime.diff(lastPoint['tourTime'], 'minutes') > 0) {
                    for (let tt = tourTime; finalTime.diff(tt, 'minutes') > 0; tt.add(noMins, 'minutes')) {
                        waypoints.push({ lat: lastPoint.lat, long: lastPoint.long, tourTime: tt.format("YYYY-MM-DD HH:mm:ss") });
                    }
                }
                vehicleData['estimatedPoints'] = waypoints;
            }
        }
        await this.cacheManager.set('tourData', JSON.stringify(liveData));
        return liveData;
    }
    async getEstimatedLiveVehicleData(reqBody) {
        let vehiclesRes = [];
        const tourData = await this.cacheManager.get('tourData');
        return JSON.parse(tourData);
    }
    async simulateVehicleLiveDataList(reqBody) {
        let vehiclesRes = [];
        let tours = await this.toursRepository.find({ where: { tour_date: '2025-10-13' }, order: { tour_date: 'ASC', tour_time: 'ASC' } });
        let i = 1;
        for (let tour of tours) {
            const driver_id = tour.driver_id;
            let tourAssignData = await this.tourAssignTruckDriverRepository.findOne({ where: { tour_id: tour.id } });
            let vehicleData = {
                "id": i,
                "driver_id": driver_id,
                "vehicle_id": tourAssignData === null || tourAssignData === void 0 ? void 0 : tourAssignData.truck_id,
                "tour_id": tour.id,
                "volume": 0,
                "weight": 0,
                "created_at": new Date(tour.tour_date + " " + tour.tour_time),
                "latitude": 12.9900,
                "longitude": 80.2439
            };
            let loc = await this.locService.getDriverLocByTime(tour.driver_id, tour.tour_date + " " + tour.tour_time);
            console.log(loc);
            if (loc) {
                vehiclesRes.push(Object.assign(Object.assign({}, vehicleData), { latitude: loc.latitude, longitude: loc.longitude }));
            }
            else {
                vehiclesRes.push(vehicleData);
            }
            i++;
        }
        return vehiclesRes;
    }
    async initiateReturn(reqBody) {
        console.log("reqBody *********************");
        console.log(reqBody);
        const response = { updated: true };
        const seqIds = reqBody.seqNum;
        let notes = '';
        for (let seqNum of seqIds) {
            let timeType = '';
            const seqData = await this.tourRouteRepository.findOneBy({ id: seqNum });
            const upds = await this.tourRouteRepository.update({ id: seqNum }, { status: reqBody.status, updated_at: new Date() });
            await this.updateTripStatus(seqData.trip_id, reqBody.status + ' ' + seqData.transport_type);
            const tourData = await this.toursRepository.findOneBy({ id: seqData.tour_id });
            if (tourData.truck_owner_status != 'Accepted') {
                const acceptTime = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss');
                await this.toursRepository.update({ id: seqData.tour_id }, { 'truck_owner_status': 'Accepted', status: 'Accepted', current_status: 2, accept_time: acceptTime, is_delay: false });
                const driverDetails = await this.driversRepository.findOneBy({ user_id: tourData.driver_id });
                const truckData = await this.trucksRepository.findOneBy({ id: driverDetails.truck_id });
                await this.bookingRepository.update({ id: seqData.booking_id }, { 'driver_name': driverDetails.name, 'driver_mobile': driverDetails.mobile_number, 'vehicle_number': truckData.registration_number });
                await this.tourRouteRepository.update({ id: seqNum }, { estimated_time: acceptTime, completed_time: acceptTime });
                await this.locService.calcDriverSessionDistance(tourData.driver_id, tourData.id);
            }
            if (reqBody.is_from_manager) {
                await this.bookingRepository.update({ id: seqData.booking_id }, { 'is_manager_entered': true, is_manager_updated_tour: true });
            }
            const bookingDetails = await this.bookingRepository.findOneBy({ id: seqData.booking_id });
            let isNewSession = false;
            if (reqBody.status == 'Completed') {
                timeType = 'completed_';
                if (seqData.transport_type == 'drop' && (bookingDetails.dropoff_location == seqData.location_address)) {
                    const driverDetails = await this.driversRepository.findOneBy({ user_id: tourData.driver_id });
                    const dName = driverDetails.name;
                    await this.checkAndUpdateTourComplete(tourData);
                }
                await this.estimateNextSequence(seqData);
                const completeTime = moment().tz('Asia/Calcutta').format('YYYY-MM-DD HH:mm:ss');
                await this.toursRepository.update({ id: seqData.tour_id }, { 'is_delay': false, status: 'Completed', current_status: 3, complete_time: completeTime, tour_status: 'Tour Completed' });
                this.updateVehicleLiveData(seqData.tour_id, { pickup: seqData.transport_type == 'pickup' ? true : false, booking_id: seqData.booking_id });
            }
            timeType = timeType + seqData.transport_type;
            if (seqData.booking_id.toString() == seqData.trip_id) {
                notes = notes + seqData.booking_id + ":if-" + timeType + ',';
                this.bookingService.updateBookingStatusTime(seqData.booking_id, timeType);
            }
            else {
                let trips = await this.tripRepo.find({ where: { booking_id: seqData.booking_id }, order: { trip_id: 'ASC' } });
                if (trips.length) {
                    if (trips[0].trip_id == seqData.trip_id && seqData.transport_type == 'pickup') {
                        notes = notes + seqData.booking_id + ":el-" + timeType + ',';
                        this.bookingService.updateBookingStatusTime(seqData.booking_id, timeType);
                    }
                    if (trips[trips.length - 1].trip_id == seqData.trip_id && seqData.transport_type == 'drop') {
                        notes = notes + seqData.booking_id + ":eld-" + timeType + ',';
                        this.bookingService.updateBookingStatusTime(seqData.booking_id, timeType);
                    }
                }
            }
            const newBooking = await this.bookingService.createReturnBooking(bookingDetails);
            const tripData = Object.assign(Object.assign({}, newBooking), { trip_id: newBooking.id, booking_id: newBooking.id });
            await this.bookingService.addTrip(tripData);
            if (reqBody.noReturn === false) {
                let newTourData = Object.assign({}, tourData);
                delete newTourData.id;
                newTourData.tour_time = moment(new Date()).tz('Asia/Calcutta').format('HH:mm:ss');
                newTourData.status = "Assigned";
                newTourData.tour_status = "Completed pickup";
                const newTour = await this.toursRepository.save(newTourData);
                let tourRoute = await this.tourRouteRepository.find({ where: { booking_id: bookingDetails.id }, order: { sequence_number: 'ASC' } });
                if (tourRoute.length) {
                    let tourRouteObj = Object.assign(Object.assign({}, tourRoute[0]), { tour_id: newTour.id, booking_id: newBooking.id, trip_id: newBooking.id, sequence_number: tourRoute[1].sequence_number, status: '', transport_type: tourRoute[1].transport_type });
                    delete tourRouteObj.id;
                    await this.tourRouteRepository.save(tourRouteObj);
                    console.log("tr created 1");
                    tourRouteObj = Object.assign(Object.assign({}, tourRoute[1]), { tour_id: newTour.id, booking_id: newBooking.id, trip_id: newBooking.id, sequence_number: tourRoute[0].sequence_number, status: 'Completed', transport_type: tourRoute[0].transport_type });
                    delete tourRouteObj.id;
                    await this.tourRouteRepository.save(tourRouteObj);
                    console.log("tr created 2");
                }
                await this.bookingService.recordReturnBookingStatus(newBooking);
            }
            else {
                await this.bookingService.recordReturnDisposeBookingStatus(newBooking);
            }
        }
        const seq_track = {
            seqNumbers: seqIds,
            reqBody: JSON.stringify({ status: reqBody.status, is_from_manager: reqBody.is_from_manager }),
            notes: notes
        };
        await this.seqTrackRepo.save(seq_track);
        return response;
    }
    async getDriverToursByDate(reqBody) {
        let session_date = reqBody.calc_date;
        let driver_id = reqBody.driver_id;
        const tours = await this.toursRepository.find({ where: { tour_date: session_date, driver_id: driver_id } });
        return tours;
    }
    async removeBookingStopFromRedisTour(driverId, bookingId) {
        var _a, _b;
        if (!driverId)
            return;
        const key = `veh:tour:${driverId}`;
        const existing = await this.redis.get(key);
        if (!existing)
            return;
        const payload = JSON.parse(existing);
        const remainingStops = ((_a = payload.updated_tour) !== null && _a !== void 0 ? _a : []).filter((stop) => stop.booking_id !== bookingId);
        if (!remainingStops.length) {
            await this.redis.del(key);
            console.log(`[tourRoute] cleared Redis key=${key} after removing last booking=${bookingId}`);
            return;
        }
        payload.updated_tour = remainingStops.map((stop, index) => (Object.assign(Object.assign({}, stop), { sequence: index + 1 })));
        payload.tour_version = ((_b = payload.tour_version) !== null && _b !== void 0 ? _b : 0) + 1;
        payload.updated_at = new Date().toISOString();
        await this.redis.set(key, JSON.stringify(payload), 'EX', 36000);
        console.log(`[tourRoute] removed booking=${bookingId} stops from Redis key=${key} version=${payload.tour_version}`);
    }
    async clearDriverTourRedis(driverId) {
        if (!driverId)
            return;
        const key = `veh:tour:${driverId}`;
        await this.redis.del(key);
        console.log(`[tourRoute] deleted Redis key=${key}`);
    }
    async removeBookingRedisPoolEntry(bookingId) {
        if (!bookingId)
            return;
        await this.redis.del(`booking:${bookingId}`);
        console.log(`[tourRoute] removed Redis pool entry booking:${bookingId}`);
    }
    async requeueBookingsToRedisPool(bookingIds) {
        if (!bookingIds.length)
            return;
        for (const bookingId of bookingIds) {
            const booking = await this.bookingRepository.findOneBy({ id: bookingId });
            if (!booking)
                continue;
            await this.redis.set(`booking:${bookingId}`, JSON.stringify(booking), 'EX', 36000);
        }
        console.log(`[tourRoute] requeued bookings to Redis pool:`, bookingIds);
    }
    async updateTourStopStatus(driverId, bookingId, transportType, completedAt) {
        var _a;
        const key = `veh:tour:${driverId}`;
        const existing = await this.redis.get(key);
        if (!existing)
            return;
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
            payload.tour_version = ((_a = payload.tour_version) !== null && _a !== void 0 ? _a : 0) + 1;
            payload.updated_at = new Date().toISOString();
            await this.redis.set(key, JSON.stringify(payload), 'EX', 36000);
            console.log(`[tourRoute] updated stop status in Redis key=${key} booking=${bookingId} type=${transportType} version=${payload.tour_version}`);
        }
    }
    async checkActiveTour(driverId) {
        const activeTour = await this.toursRepository.findOne({
            where: { driver_id: driverId },
            order: { id: 'DESC' },
        });
        const isActiveTour = activeTour && !['Completed', 'Rejected'].includes(activeTour.status);
        console.log(isActiveTour);
    }
};
TourService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tours_entity_1.ToursEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(tourBookingDetails_entity_1.TourBookingDetailsEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(booking_entity_1.BookingEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(trip_entity_1.TripEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(bookingConsolidationCenters_entity_1.BookingConsolidationCentersEntity)),
    __param(5, (0, typeorm_1.InjectRepository)(tourAssignTruckDrivers_entity_1.TourAssignTruckDriversEntity)),
    __param(6, (0, typeorm_1.InjectRepository)(truck_entity_1.TrucksEntity)),
    __param(7, (0, typeorm_1.InjectRepository)(driver_entity_1.DriversEntity)),
    __param(8, (0, typeorm_1.InjectRepository)(tourRoute_entity_1.TourRouteEntity)),
    __param(9, (0, typeorm_1.InjectRepository)(driverSessionDistance_entity_1.DriverSessionDistanceEntity)),
    __param(10, (0, typeorm_1.InjectRepository)(baseLocations_entity_1.BaseLocationsEntity)),
    __param(11, (0, typeorm_1.InjectRepository)(seqTrack_1.SeqTrackEntity)),
    __param(12, (0, typeorm_1.InjectRepository)(cusomerCompanyDetails_1.CustomerCompanyEntity)),
    __param(13, (0, typeorm_1.InjectRepository)(driverSessions_entity_1.DriverSessionsEntity)),
    __param(14, (0, typeorm_1.InjectRepository)(vehicleLiveData_entity_1.VehicleLiveDataEntity)),
    __param(15, (0, typeorm_1.InjectRepository)(callLogs_entity_1.CallLogsEntity)),
    __param(16, (0, typeorm_1.InjectRepository)(deliveryProof_entity_1.DeliveryProofEntity)),
    __param(17, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __param(18, (0, common_1.Inject)(redis_provider_1.REDIS_CLIENT)),
    __param(22, (0, common_1.Inject)((0, common_1.forwardRef)(() => booking_service_1.BookingService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository, Object, ioredis_1.Redis,
        utils_service_1.UtilsService,
        config_1.ConfigService,
        driver_service_1.DriverService,
        booking_service_1.BookingService,
        location_service_1.LocationService,
        admin_service_1.AdminService])
], TourService);
exports.TourService = TourService;
//# sourceMappingURL=tour.service.js.map