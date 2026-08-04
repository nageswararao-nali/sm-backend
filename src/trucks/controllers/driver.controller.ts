import { Body, ConsoleLogger, Controller, Param, ParseIntPipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { UsersService } from 'src/users/services/users.service';
import { DriverService } from '../services/driver.service';
import { TruckService } from '../services/truck.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('driver')
export class DriverController {
    constructor(
        private driverService: DriverService,
        private usersService:  UsersService,
        private truckService: TruckService
    ){}

    @Public()
    @Post('addDriver')
    async addDriver(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const user = await this.usersService.checkUser(reqBody.mobile_number)
        const driver = await this.driverService.getDriver({mobile_number: reqBody.mobile_number})
        if(driver || (user && user.user_type == 'Driver')) {
            response.success = false;
            response.message = "Driver with "+reqBody.mobile_number+" already exists";
            return response
        } else {
            if(user && user.user_type != 'Driver'){
                // reqBody['truck_owner_id'] = user.id
                reqBody['user_id'] = user.id
            } else {
                reqBody['user_type'] = 'Driver'
                const userData = await this.usersService.addUser(reqBody);
                // reqBody['truck_owner_id'] = userData.id
                reqBody['user_id'] = userData.id
            }
            // console.log("adding driver")
            // console.log(reqBody)
            const driverData = await this.driverService.addDriver(reqBody)
            if (!driverData) {
                response.success = false;
                response.message = "Problem in saving driver "+reqBody.mobile_number;
            } else {
                response.data = driverData
            }
            return response
        } 
        
    }

    @Public()
    @Post('addOwner')
    async addOwner(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const user = await this.usersService.checkUser(reqBody.mobile_number)
        if(user) {
            response.success = false;
            response.message = "Owner with "+reqBody.mobile_number+" already exists";
            return response
        } else {
            
            reqBody['user_type'] = 'Owner'
            const userData = await this.usersService.addUser(reqBody);
            if (!userData) {
                response.success = false;
                response.message = "Problem in saving owner "+reqBody.mobile_number;
            } else {
                response.data = userData
            }
            return response
        } 
        
    }

    @Post('updateOwner/:id')
    async updateOwner(@Param('id', ParseIntPipe) id: number, @Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        reqBody['user_type'] = 'Owner'
        const userData = await this.usersService.updateOwner(id, reqBody);
        if (!userData) {
            response.success = false;
            response.message = "Problem in updating owner "+reqBody.mobile_number;
        } else {
            response.data = userData
        }
        return response
        
    }

    @Post('deleteOwner/:id')
    async deleteOwner(@Param('id', ParseIntPipe) id: number) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const userData = await this.usersService.deleteOwner(id);
        const driverData = await this.driverService.deleteByOwner(id);
        const truckData = await this.truckService.deleteByOwner(id);
        if (!userData) {
            response.success = false;
            response.message = "Problem in updating owner "+id;
        } else {
            response.data = userData
        }
        return response
        
    }

    @Post('getOwners')
    async getOwners(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const { items, count } = await this.usersService.getUsersByType(reqBody, 'Owner')
        if (!items) {
            response.success = false;
            response.message = "Owners not found";
        } else {
            response.data = {owners: items, count}
        }
        return response
        
    }

    @Post('getDriver')
    async getDriver(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const driverDetails = await this.driverService.getDriver(reqBody)
        if (!driverDetails) {
            response.success = false;
            response.message = "Driver not found";
        } else {
            response.data = driverDetails
        }
        return response
        
    }

    @Post('getOwner')
    async getOwner(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const userDetails = await this.usersService.checkUser(reqBody.mobile_number)
        if (!userDetails) {
            response.success = false;
            response.message = "Owner not found";
        } else {
            response.data = userDetails
        }
        return response
        
    }

    @Post('updateDriver/:id')
    async updateDriver(@Param('id', ParseIntPipe) id: number, @Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const driverDetails = await this.driverService.updateDriver(id, reqBody)
        if (!driverDetails) {
            response.success = false;
            response.message = "Driver not found";
        } else {
            response.data = driverDetails
        }
        return response
        
    }

    @Post('deleteDriver/:id')
    async deleteDriver(@Param('id', ParseIntPipe) id: number) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const driverDetails = await this.driverService.deleteDriver(id)
        if (!driverDetails) {
            response.success = false;
            response.message = "Driver not found";
        } else {
            response.data = driverDetails
        }
        return response
        
    }

    @Post('getDrivers')
    async getDrivers(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const { drivers, count } = await this.driverService.getDrivers(reqBody)
        if (!drivers) {
            response.success = false;
            response.message = "Drivers not found";
        } else {
            response.data = {drivers: drivers, count}
        }
        return response
        
    }

    @Post('driverDetails')
    async driverDetails(@Body() reqBody: any) {
        let response = {
            success: true,
            message: '',
            data: {}
        }
        const user: any = await this.driverService.driverDetails(reqBody.mobile)
        if (!user) {
            response.success = false;
            response.message = "User with mobile "+reqBody.mobile+" not found";
        } else {
            response.data = user
        }
        return response
    }

    @Post('getDriverSession')
    async getDriverSession(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const driverSession: any = await this.driverService.getLatestSession(reqBody.user_id)
        if (!driverSession) {
            response.success = false;
            response.message = "Driver Session not found";
        } else {
            response.data = driverSession
        }
        return response
        
    }   
    
    @Post('updateDriverSession')
    async updateDriverSession(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const driverSession: any = await this.driverService.updateDriverSession(reqBody.user_id)
        if (!driverSession) {
            response.success = false;
            response.message = "Driver Session not found";
        } else {
            response.data = driverSession
        }
        return response
        
    } 
    
    @Post('getDriverSessions')
    async getDriverSessions(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const {sessions, count} = await this.driverService.getLatestSessions(reqBody)
        if (!sessions) {
            response.success = false;
            response.message = "Driver Sessions not found";
        } else {
            response.data = {sessionList: sessions, count}
        }
        return response
    }  

    @Post('getAllSessions')
    async getAllSessions(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const sessions = await this.driverService.getAllSessions(reqBody)
        if (!sessions) {
            response.success = false;
            response.message = "Driver Sessions not found";
        } else {
            response.data = {sessionList: sessions}
        }
        return response
    }  
    
    @Post('createSession')
    async createSession(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const sessionDetails = await this.driverService.createSessionByManager({id: reqBody.start_location}, reqBody)
        if (!sessionDetails) {
            response.success = false;
            response.message = "Session not found";
        } else {
            response.data = sessionDetails
        }
        return response
        
    }

    @Post('updateSession/:id')
    async updateSession(@Param('id', ParseIntPipe) id: number, @Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const sessionDetails = await this.driverService.updateSession(id, reqBody)
        if (!sessionDetails) {
            response.success = false;
            response.message = "Session not found";
        } else {
            response.data = sessionDetails
        }
        return response
        
    }

    @Post('deleteSession/:id')
    async deleteSession(@Param('id', ParseIntPipe) id: number) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const driverDetails = await this.driverService.deleteSession(id)
        if (!driverDetails) {
            response.success = false;
            response.message = "Session not found";
        } else {
            response.data = driverDetails
        }
        return response
        
    }

    @Post('addTruckerRate')
    async addTruckerRate(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const truckerRateDetails = await this.driverService.addTruckerRate(reqBody)
        if (!truckerRateDetails) {
            response.success = false;
            response.message = "Trucker Rate not saved!";
        } else {
            response.data = truckerRateDetails
        }
        return response
    }

    @Post('updateTruckerRate/:id')
    async updateTruckerRate(@Param('id', ParseIntPipe) id: number, @Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const truckerRateDetails = await this.driverService.updateTruckerRate(id, reqBody)
        if (!truckerRateDetails) {
            response.success = false;
            response.message = "Trucker Rate not found";
        } else {
            response.data = truckerRateDetails
        }
        return response
        
    }

    @Post('truckersRateList')
    async truckersRateList(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const truckerRates = await this.driverService.truckersRateList(reqBody)
        if (!truckerRates) {
            response.success = false;
            response.message = "Trucker Rates not found";
        } else {
            response.data = {truckerRates: truckerRates}
        }
        return response
    } 

    @Post('driverPaymentCalculation')
    async driverPaymentCalculation(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const truckerRates = await this.driverService.driverPaymentCalculation(reqBody)
        if (!truckerRates) {
            response.success = false;
            response.message = "Trucker Payment not added";
        } else {
            response.data = {truckerRates: truckerRates}
        }
        return response
    } 

    @Post('sendInactiveNotification')
    async sendInactiveNotification(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const notificationData = await this.driverService.sendInactiveNotification(reqBody)
        if (!notificationData) {
            response.success = false;
            response.message = "Problem in sending notification";
        } else {
            response.data = {notificationData: notificationData}
        }
        return response
    } 

    @Post('updateAvailable')
    async updateAvailable(@Body() reqBody: any) {
        let response = {
            success: true,
            message: 'User Availability Changed'
        }
        const user = await this.driverService.updateAvailable(reqBody.mobile, reqBody.is_available)
        if (!user.affected) {
            response.success = false;
            response.message = "Problem in updating Availability";
        }
        return response
    }
    
    @Post('updateAvailableById')
    async updateAvailableById(@Body() reqBody: any) {
        let response = {
            success: true,
            message: 'User Availability Changed'
        }
        const user = await this.driverService.updateAvailableById(reqBody.user_id, reqBody.is_available)
        if (!user.affected) {
            response.success = false;
            response.message = "Problem in updating Availability";
        }
        return response
    }

    @Post('calculateSessionFare')
    async calculateSessionFare(@Body() reqBody: any) {
        let response = {
            success: true,
            message: 'User Availability Changed'
        }
        const user = await this.driverService.calculateSessionFare(reqBody.session_id)
        if (!user) {
            response.success = false;
            response.message = "Problem in updating Availability";
        }
        return response
    }

    @Post('updateSessionFare')
    async updateSessionFare(@Body() reqBody: any) {
        let response = {
            success: true,
            message: 'Session Fare Updated'
        }
        const updFare = await this.driverService.updateSessionFare(reqBody.session_id)
        if (!updFare) {
            response.success = false;
            response.message = "Problem in updating Session Fare";
        }
        return response
    }
    
    @Post('payDriverFare')
    @UseInterceptors(FileInterceptor('file'))
    async payDriverFare(@UploadedFile() file: Express.Multer.File) {
        let response = {
            success: true,
            data: {},
            message: 'Email Sent'
        }
        console.log(file)
        await this.driverService.payDriverFare(file)
        return response
    }

    @Post('getDriverTransactions')
    async getDriverTransactions(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Session Fare Updated'
        }
        const {items, count} = await this.driverService.getDriverTransactions(reqBody)
        if (!items) {
            response.success = false;
            response.message = "Problem in getting driver transactions";
        } else {
            response.data = {transactions: items, count}
        }
        return response
    }

    @Post('getDriverCumulativeEarnings')
    async getDriverCumulativeEarnings(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'getting driver Fare'
        }
        const cFare = await this.driverService.getDriverCumulativeEarnings(reqBody)
        if (!cFare) {
            response.success = false;
            response.message = "Problem in getting driver total earnings of current month";
        } else {
            response.data = {cumulativeEarning: cFare}
        }
        return response
    }

    

    @Post('autoSessionClose')
    async autoSessionClose(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Session Fare Updated'
        }
        const updateSes = await this.driverService.autoSessionClose()
        if (!updateSes) {
            response.success = false;
            response.message = "Problem in updating driver sessions";
        } else {
            response.data = updateSes
        }
        return response
    }

    @Post('driverMonthlyFare')
    async driverMonthlyFare(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Driver Monthly Fare Updated'
        }
        const updateSes = await this.driverService.driverMonthlyFare()
        if (!updateSes) {
            response.success = false;
            response.message = "Problem in updating driver sessions";
        } else {
            response.data = updateSes
        }
        return response
    }

    @Post('driverSessionSummary')
    async driverSessionSummary(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Session Fare Updated'
        }
        const updateSes = await this.driverService.driverSessionSummary(reqBody)
        if (!updateSes) {
            response.success = false;
            response.message = "Problem in updating driver sessions";
        } else {
            response.data = updateSes
        }
        return response
    }
    

    @Post('calculateSessionFareManual')
    async calculateSessionFareManual(@Body() reqBody: any) {
        let response = {
            success: true,
            message: 'User Availability Changed'
        }
        const user = await this.driverService.calculateSessionFareManual()
        if (!user) {
            response.success = false;
            response.message = "Problem in updating Availability";
        }
        return response
    }

    @Post('getDriverSessionSummary')
    async getDriverSessionSummary(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Session Fare Updated'
        }
        const {items, count} = await this.driverService.getDriverSessionSummary(reqBody)
        if (!items) {
            response.success = false;
            response.message = "Problem in getting driver sesstion summary";
        } else {
            response.data = {summary: items, count}
        }
        return response
    }

    @Post('calculateDriverFareById')
    async calculateDriverFareById(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Session Fare Updated'
        }
        const {items, count} = await this.driverService.calculateDriverFareById(reqBody.driver_id, reqBody.calc_date)
        if (!items) {
            response.success = false;
            response.message = "Problem in getting driver sesstion summary";
        } else {
            response.data = {summary: items, count}
        }
        return response
    }

    @Post('getDriverSummaryReport')
    async getDriverSummaryReport(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Session Fare Updated'
        }
        const updateSes = await this.driverService.getDriverSummaryReport(reqBody)
        if (!updateSes) {
            response.success = false;
            response.message = "Problem in sending driver summary report";
        } else {
            response.data = updateSes
        }
        return response
    }

    @Post('getDriverSummaryMetrix')
    async getDriverSummaryMetrix(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const driverData = await this.driverService.getDriverSummaryMetrix(reqBody)
        if (!driverData) {
            response.success = false;
            response.message = "Driver not found";
        } else {
            response.data = driverData
        }
        return response
        
    }
    
}
