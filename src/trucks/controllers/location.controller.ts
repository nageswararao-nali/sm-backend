import { Body, Controller, Get, Post } from '@nestjs/common';
import * as moment from 'moment';
import { last } from 'rxjs';
import { UtilsService } from 'src/utils/services/utils.service';
import { LocationsEntity } from '../models/locations.entity';
import { DriverService } from '../services/driver.service';
import { LocationService } from '../services/location.service';
const haversine = require('haversine')
const DISTANCE_VAR = 0.050  // 50 meters
@Controller('location')
export class LocationController {
    constructor(
        private locService: LocationService,
        private utilSerive: UtilsService,
        private driverSerive: DriverService
    ){}

    @Get()
    public async getAll() {
        return await this.locService.getAll();
    }
    @Post()
    createLocation(@Body() location : LocationsEntity): void{
        this.locService.create(location);
    }

    @Post('addDriverLocation')
    async addDriverLocation(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        let driverSeeData = {}
        let otherData: any = {}
        //console.log(reqBody)
        if(reqBody.user_id) {
            const driverLastTrack: any = await this.driverSerive.updateDriver(reqBody.user_id, {last_tracked_at: new Date()})
            await this.driverSerive.updateDriverLastLocDetails(reqBody)
            if(reqBody.tour_id && !reqBody.session_id) {
                // check driver reached to 1st sequence pickup location
                const disData: any = await this.utilSerive.getTourPickupDistance({lat: reqBody.latitude, long: reqBody.longitude}, reqBody.sequence_number[0])
                //console.log("distance data")
                //console.log(disData)
                // if(disData && disData.distance < 0.100) {
                if(disData && disData.distance < DISTANCE_VAR) {
                    
                    const driverSession: any = await this.driverSerive.getLatestSession(reqBody.user_id)
                    if(!driverSession) {
                        driverSeeData = await this.driverSerive.createSession(disData, reqBody)
                    } else {
                        driverSeeData = driverSession
                    }
                    //console.log(driverSession)
                    if(driverSession && !driverSession.status){
                        const nowD = moment(new Date())
                        const startS = moment(driverSession.session_end_time)
                        var duration = moment.duration(nowD.diff(startS));
                        var hours = duration.asHours();
                        // if(hours >= 6)
                        // disData['parent_session_id'] = disData.id
                        driverSeeData = await this.driverSerive.createSession(disData, reqBody)
                    }
                    for(let seqNum of reqBody.sequence_number) {
                        let statusValue = 'Reached';
                        let bstatusValue = 'copleted';

                        await this.utilSerive.updateSeq(seqNum, {status: statusValue})
                        const seqData: any = await this.utilSerive.getSeq(seqNum)
                        const bsReq = {
                            booking_id: seqData.booking_id,
                            status: 'Reached ' +seqData.transport_type,
                            created_by: 1,
                            trip_id: seqData.trip_id,
                            tour_id: seqData.tour_id,
                            created_at: new Date(),
                            updated_at: new Date()
                        }
                        await this.locService.addBookingStatus(bsReq)
                        await this.locService.updateBookingTime(seqData.booking_id, bstatusValue+'_'+seqData.transport_type)
                    }
                    
                    const driverToken = await this.utilSerive.getDeviceToken(reqBody.user_id)
                    const TITLE = 'Pick up'
                    const BODY = 'You have reached the pickup location.'
                    //console.log("sending notification ")
                    //console.log([driverToken])
                    if(driverToken) {
                        await this.utilSerive.sendPushNotification(TITLE, BODY, driverToken.split(","))
                    }
                    
                    this.locService.sendCustomerTourNotification(disData)
                    
                    otherData.reached = true
                }
            } else if(reqBody.tour_id && reqBody.session_id) {
                const disData: any = await this.utilSerive.getTourPickupDistance({lat: reqBody.latitude, long: reqBody.longitude}, reqBody.sequence_number[0])
                //console.log("distance data")
                //console.log(disData)
                if(disData && disData.distance < DISTANCE_VAR) {
                    for(let seqNum of reqBody.sequence_number) {
                        let statusValue = 'Reached';
                        let bstatusValue = 'reached';
                        await this.utilSerive.updateSeq(seqNum, {status: statusValue})
                        const seqData: any = await this.utilSerive.getSeq(seqNum)
                        const bsReq = {
                            booking_id: seqData.booking_id,
                            status: 'Reached ' +seqData.transport_type,
                            created_by: 1,
                            trip_id: seqData.trip_id,
                            tour_id: seqData.tour_id,
                            created_at: new Date(),
                            updated_at: new Date()
                        }
                        await this.locService.addBookingStatus(bsReq)
                        await this.locService.updateBookingTime(seqData.booking_id, bstatusValue+'_'+seqData.transport_type)
                    }
                    
                    const driverToken = await this.utilSerive.getDeviceToken(reqBody.user_id)
                    const TITLE = disData.transport_type
                    const BODY = 'You have reached the '+disData.transport_type+' location.'
                    //console.log("sending notification ")
                    //console.log([driverToken])
                    //console.log(TITLE)
                    if(driverToken) {
                        await this.utilSerive.sendPushNotification(TITLE, BODY, driverToken.split(","))
                    }
                    
                    this.locService.sendCustomerTourNotification(disData)
                    
                }
                
                const lastPoint = await this.locService.getLatestPoint(reqBody)
                //console.log("latest point")
                //console.log(lastPoint)
                if(lastPoint) {
                    const dData = await this.utilSerive.getDistanceFromGOOSM({lat: lastPoint.latitude, long: lastPoint.longitude}, {lat: reqBody.latitude, long: reqBody.longitude})
                    // //console.log("dData")
                    // //console.log(dData)
                    if(dData.code == 'Ok') {
                        let distance = dData.routes[0].distance
                        if(distance) {
                            distance = (distance/1000)
                            if(distance > 1) {
                                const firstPointTime = moment(lastPoint.loc_time)
                                const secondPointTime = moment(reqBody.loc_time)
                                let dismins = secondPointTime.diff(firstPointTime, 'minutes')
                                //console.log("calculating haversine distance ", dismins)
                                if(dismins <= 2) {
                                    let a = {latitude: lastPoint.latitude,  longitude: lastPoint.longitude}
                                    let b = {latitude: reqBody.latitude, longitude: reqBody.longitude}
                                    let hdistance = haversine(a, b)
                                    // distance = distance/1000
                                    distance = hdistance
                                }
                                //console.log("haversine distance ===", distance)
                            }
                            await this.driverSerive.updateDistance(reqBody.user_id, distance)
                        }
                    }
                    // const distanceData: any = await this.locService.getLastPointDistance(lastPoint.id, {lat: reqBody.latitude, long: reqBody.longitude})
                    // //console.log("last point dis")
                    // //console.log(distanceData)
                    // if(distanceData) {
                    //     await this.driverSerive.updateDistance(reqBody.user_id, distanceData.distance)
                    // }
                }
            }
            const locData = await this.locService.create(reqBody)
            if (!locData) {
                response.success = false;
                response.message = "Problem in saving driver location";
            } else {
                response.data = {location: locData, sessionData: driverSeeData, otherData: otherData}
            }
            
        } else {
            response.success = false
            response.message = 'There is no user id'
        }
        return response
        
    }

    @Post('saveDriverLocation')
    async saveDriverLocation(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        let driverSeeData = {}
        let otherData: any = {}
        if(reqBody.user_id) {
            const driverLastTrack: any = await this.driverSerive.updateDriver(reqBody.user_id, {last_tracked_at: new Date()})
            await this.driverSerive.updateDriverLastLocDetails(reqBody)
            /*if(reqBody.tour_id && !reqBody.session_id) {
                // check driver reached to 1st sequence pickup location
                const disData: any = await this.utilSerive.getTourPickupDistance({lat: reqBody.latitude, long: reqBody.longitude}, reqBody.sequence_number[0])
                //console.log("distance data")
                //console.log(disData)
                // if(disData && disData.distance < 0.100) {
                if(disData && disData.distance < DISTANCE_VAR) {
                    
                    const driverSession: any = await this.driverSerive.getLatestSession(reqBody.user_id)
                    if(!driverSession) {
                        driverSeeData = await this.driverSerive.createSession(disData, reqBody)
                    } else {
                        driverSeeData = driverSession
                    }
                    //console.log(driverSession)
                    if(driverSession && !driverSession.status){
                        const nowD = moment(new Date())
                        const startS = moment(driverSession.session_end_time)
                        var duration = moment.duration(nowD.diff(startS));
                        var hours = duration.asHours();
                        // if(hours >= 6)
                        // disData['parent_session_id'] = disData.id
                        driverSeeData = await this.driverSerive.createSession(disData, reqBody)
                    }
                    
                    otherData.reached = true
                }
            }*/
            const locData = await this.locService.create(reqBody)
            if (!locData) {
                response.success = false;
                response.message = "Problem in saving driver location";
            } else {
                response.data = {location: locData, sessionData: driverSeeData, otherData: otherData}
            }
            
        } else {
            response.success = false
            response.message = 'There is no user id'
        }
        return response
        
    }

    @Post('updateLatestLocationToBaseLocation')
    async updateLatestLocationToBaseLocation(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const results = await this.locService.updateLatestLocationToBaseLocation(reqBody)
        if (!results) {
            response.success = false;
            response.message = "Problem updating latest location";
        } else {
            response.data = { results }
        }
        return response
    }

    @Post('range')
    public async getRange(@Body() location : {
        lat:number,
        long:number,
        range:number
    }){
        return await this.locService.getRange(location.lat,location.long,location.range);
    }

    @Post('getDriversLocations')
    async getDriversLocations(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const {locs, count} = await this.locService.getDriversLocations(reqBody)
        if (!locs) {
            response.success = false;
            response.message = "Driver Locations not found";
        } else {
            response.data = {locations: locs, count}
        }
        return response
    } 
    
    @Post('getDriverLocation')
    async getDriverLocation(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const location = await this.locService.getDriverLocation(reqBody)
        if (!location) {
            response.success = false;
            response.message = "Driver Location not found";
        } else {
            response.data = location
        }
        return response
    } 

    @Post('getDriverLocations')
    async getDriverLocations(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const {items, count} = await this.locService.getDriverLocations(reqBody)
        if (!items) {
            response.success = false;
            response.message = "Driver Locations not found";
        } else {
            response.data = {locations: items, count}
        }
        return response
    } 
    @Post('getDriverLocationsByDate')
    async getDriverLocationsByDate(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const {items, count} = await this.locService.getDriverLocationsByDate(reqBody)
        if (!items) {
            response.success = false;
            response.message = "Driver Locations not found";
        } else {
            response.data = {locations: items, count}
        }
        return response
    } 
    

    @Post('getDriverLocationsDetails')
    async getDriverLocationsDetails(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const locations = await this.locService.getDriverLocationsDetails(reqBody)
        if (!locations.length) {
            response.success = false;
            response.message = "Driver Locations not found";
        } else {
            response.data = {locations: locations}
        }
        return response
    } 
    
    @Post('sessionReports')
    async sessionReports(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const locations = await this.locService.sessionReports(reqBody)
        if (!locations.length) {
            response.success = false;
            response.message = "Sessions not found";
        } else {
            response.data = {locations: locations}
        }
        return response
    } 

    @Post('driverReports')
    async driverReports(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const locations = await this.locService.driverReports(reqBody)
        if (!locations.length) {
            response.success = false;
            response.message = "Sessions not found";
        } else {
            response.data = {locations: locations}
        }
        return response
    } 

    @Post('daySummaryReports')
    async daySummaryReports(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const summaryReport = await this.locService.daySummaryReports(reqBody)
        if (!summaryReport) {
            response.success = false;
            response.message = "Report not found";
        } else {
            response.data = {'report': summaryReport}
        }
        return response
    } 

    @Post('revenueCalculation')
    async revenueCalculation(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.revenueCalculation(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    } 

    @Post('waitingChargeNotesUpdatesManual')
    async waitingChargeNotesUpdatesManual(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.waitingChargeNotesUpdatesManual(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    } 

    

    @Post('revenueCalculationNew')
    async revenueCalculationNew(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.revenueCalculationNew(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    } 

    @Post('revenueCalculationManual')
    async revenueCalculationManual(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.revenueCalculationManual(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    } 

    @Post('revenueCalculationDateRange')
    async revenueCalculationDateRange(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.revenueCalculationDateRange(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    } 

    @Post('showSessionDistances')
    async showSessionDistances(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.showSessionDistances(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    } 

    @Post('driverGPSSummary')
    async driverGPSSummary(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.driverGPSSummary(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    } 

    @Post('calcWaitingChargeTest')
    async calcWaitingChargeTest(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.caliculateT2WaitingCharge(1335, 1, 12)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    } 

    @Post('calcDriverDistanceFromToTimes')
    async calcDriverDistanceFromToTimes(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.calcDriverDistanceFromToTimes(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    } 

    @Post('calcOSMTwoPoints')
    async calcOSMTwoPoints(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.calcOSMTwoPoints(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    } 

    @Post('calcOSMMapMatching')
    async calcOSMMapMatching(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.calcOSMMapMatching(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    } 

    @Post('updateBookingTimes')
    async updateBookingTimes(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.updateBookingTimes(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    } 
    
    @Post('updateTourStatus')
    async updateTourStatus(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.updateTourStatus(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    } 
    @Post('calcDriverSessionDistanceManual')
    async calcDriverSessionDistanceManual(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.calcDriverSessionDistanceManual(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    } 
    @Post('getDistanceFromPoint')
    async getDistanceFromPoint(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.getDistanceFromPoint(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    } 

    @Post('calcDriverGoogleDistance')
    async calcDriverGoogleDistance(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.calcDriverGoogleDistance(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    } 
    @Post('calcDriverGoogleMapMatchDistance')
    async calcDriverGoogleMapMatchDistance(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.calcDriverGoogleMapMatchDistance(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    } 
    @Post('getHomeDeliveryFare')
    async getHomeDeliveryFare(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.getHomeDeliveryFare(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        } else {
            response.data = revCal
        }
        return response
    } 

    @Post('getHomeDeliveryFareByAddresses')
    async getHomeDeliveryFareByAddresses(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.getHomeDeliveryFareByAddresses(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        } else {
            response.data = revCal
        }
        return response
    } 

    @Post('getDelhiHomeDeliveryFareByAddresses')
    async getDelhiHomeDeliveryFareByAddresses(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.getDelhiHomeDeliveryFareByAddresses(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        } else {
            response.data = revCal
        }
        return response
    } 

    @Post('getHomeDeliveryFareByAddressesTest')
    async getHomeDeliveryFareByAddressesTest(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.getHomeDeliveryFareByAddressesTest(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculating Fare";
        } else {
            response.data = revCal
        }
        return response
    } 
    

    @Post('getBookingFare')
    async getBookingFare(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.getBookingFare(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculating Fare";
        } else {
            response.data = revCal
        }
        return response
    } 

    @Post('getMultiBookingFare')
    async getMultiBookingFare(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.getMultiBookingFare(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculating Fare";
        } else {
            response.data = revCal
        }
        return response
    } 

    @Post('getLoadingFare')
    async getLoadingFare(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.getLoadingFare(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculating loading Fare";
        } else {
            response.data = revCal
        }
        return response
    } 
    
    @Post('calcDriverGoogleMapMatchDistanceNew')
    async calcDriverGoogleMapMatchDistanceNew(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.calcDriverGoogleMapMatchDistanceNew(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    } 

    
    @Post('calcDriverGoogleMapMatchDistanceWithSpeedTime')
    async calcDriverGoogleMapMatchDistanceWithSpeedTime(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.calcDriverGoogleMapMatchDistanceWithSpeedTime(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    }

    @Post('calcDriverGoogleMapMatchDistanceWithSpeed')
    async calcDriverGoogleMapMatchDistanceWithSpeed(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.calcDriverGoogleMapMatchDistanceWithSpeed(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    }

    @Post('calcGoogleTourDistance')
    async calcGoogleTourDistance(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.calcGoogleTourDistance(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    } 

    @Post('getCustomerCompanyDetails')
    async getCustomerCompanyDetails(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const cDetails = await this.locService.getCustomerCompanyDetails(reqBody)
        if (!cDetails) {
            response.success = false;
            response.message = "Problem in getting company details";
        } else {
            response.data = cDetails
        }
        return response
    }
    @Post('getCustomerAddressEditList')
    async getCustomerAddressEditList(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const cDetails = await this.locService.getCustomerAddressEditList(reqBody)
        if (!cDetails) {
            response.success = false;
            response.message = "Problem in getting company details";
        } else {
            response.data = cDetails
        }
        return response
    }

    @Post('reCalculateHomeDeliveryFareByDate')
    async reCalculateHomeDeliveryFareByDate(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const cDetails = await this.locService.reCalculateHomeDeliveryFareByDate(reqBody)
        if (!cDetails) {
            response.success = false;
            response.message = "Problem in getting company details";
        } else {
            response.data = cDetails
        }
        return response
    }

    @Post('checkSourceLocation')
    async checkSourceLocation(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const cDetails = await this.locService.checkSourceLocation(reqBody)
        if (!cDetails) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        } else {
            response.data = cDetails
        }
        return response
    }

    @Post('getBookingDistance')
    async getBookingDistance(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const cDetails = await this.locService.getBookingDistance(reqBody)
        if (!cDetails) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        } else {
            response.data = cDetails
        }
        return response
    }

    @Post('calcGoogleMapDistanceWithLatlongs')
    async calcGoogleMapDistanceWithLatlongs(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const cDetails = await this.locService.calcGoogleMapDistanceWithLatlongs(reqBody)
        if (!cDetails) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        } else {
            response.data = cDetails
        }
        return response
    }

    @Post('compareDriverLocationWhenTourUpdate')
    async compareDriverLocationWhenTourUpdate(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const cDetails = await this.locService.compareDriverLocationWhenTourUpdate(reqBody)
        if (!cDetails) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        } else {
            response.data = cDetails
        }
        return response
    }

    @Post('updateMultiBookingFare')
    async updateMultiBookingFare(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.updateMultiBookingFare(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculating Fare";
        } else {
            response.data = revCal
        }
        return response
    } 

    @Post('deliverBooking')
    async deliverBooking(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.deliverBooking(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculating Fare";
        } else {
            response.data = revCal
        }
        return response
    } 

    @Post('getDelhiHomeDeliveryFreeFare')
    async getDelhiHomeDeliveryFreeFare(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.getDelhiHomeDeliveryFreeFare(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        } else {
            response.data = revCal
        }
        return response
    } 

    @Post('feedCompanyRates')
    async feedCompanyRates(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.feedCompanyRates(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        } else {
            response.data = revCal
        }
        return response
    } 

    @Post('checkToll')
    async checkToll(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.checkToll(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        } else {
            response.data = revCal
        }
        return response
    } 

    @Post('calGenFare')
    async calGenFare(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.calGenFare(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        } else {
            response.data = revCal
        }
        return response
    } 
    
    @Post('standaredRevenueCalculationDateRange')
    async standaredRevenueCalculationDateRange(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.standaredRevenueCalculationDateRange(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        } else {
            response.data = revCal
        }
        return response
    } 

    @Post('calcTourDistance')
    async calcTourDistance(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.calcTourDistance(reqBody.tour_id)
        console.log("tour distance ", revCal)
        if (!revCal) {
            response.success = false;
            response.message = "Apologies! Currently we do not serve this location.";
        } else {
            response.data = revCal
        }
        return response
    } 
    
    @Post('compareBookingDistance')
    async compareBookingDistance(@Body() reqBody: any) {
        const response = await this.locService.compareBookingDistance()
        return response
    } 
    
    @Post('findTourDistancesByTourIds')
    async findTourDistancesByTourIds(@Body() reqBody: any) {
        const response = await this.locService.findTourDistancesByTourIds()
        return response
    } 
    @Post('getMetrics')
    async getMetrics(@Body() reqBody: any) {
        const response = await this.locService.getMetrics()
        return response
    } 
    @Post('revenueCalculationDateRangeMetrics')
    async revenueCalculationDateRangeMetrics(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.revenueCalculationDateRangeMetrics(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    } 

    @Post('revenueCalculationTocompareFaresDateRange')
    async revenueCalculationTocompareFaresDateRange(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const revCal = await this.locService.revenueCalculationTocompareFaresDateRange(reqBody)
        if (!revCal) {
            response.success = false;
            response.message = "Problem in Calculation";
        } else {
            response.data = {'report': revCal}
        }
        return response
    } 
    
}
