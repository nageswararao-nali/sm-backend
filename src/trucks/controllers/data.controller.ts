import { Body, ConsoleLogger, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { DataService } from '../services/data.service';

@Controller('data')
export class DataController {
    constructor(
        private dataService: DataService
    ){}

    @Post('updateGMRates')
    async updateGMRates(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const driverData = await this.dataService.updateGMRates(reqBody)
        if (!driverData) {
            response.success = false;
            response.message = "Problem in saving shop "+reqBody.mobile_number;
        } else {
            response.data = driverData
        }
        return response
    }

    @Post('updateCompanyData')
    async updateCompanyData(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const driverData = await this.dataService.updateCompanyData(reqBody)
        if (!driverData) {
            response.success = false;
            response.message = "Problem in saving shop "+reqBody.mobile_number;
        } else {
            response.data = driverData
        }
        return response
    }

    @Post('feedSpecialAddress')
    async feedSpecialAddress(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const driverData = await this.dataService.feedSpecialAddress(reqBody)
        if (!driverData) {
            response.success = false;
            response.message = "Problem in saving shop "+reqBody.mobile_number;
        } else {
            response.data = driverData
        }
        return response
    }
    
    @Post('updateMultiBookingId')
    async updateMultiBookingId(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const driverData = await this.dataService.updateMultiBookingId(reqBody)
        if (!driverData) {
            response.success = false;
            response.message = "Problem in saving shop "+reqBody.mobile_number;
        } else {
            response.data = driverData
        }
        return response
    }

    @Post('cTimeUpdates')
    async cTimeUpdates(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const driverData = await this.dataService.cTimeUpdates(reqBody)
        if (!driverData) {
            response.success = false;
            response.message = "Problem in saving shop "+reqBody.mobile_number;
        } else {
            response.data = driverData
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
        const driverData = await this.dataService.updateBookingTimes(reqBody)
        if (!driverData) {
            response.success = false;
            response.message = "Problem in saving shop "+reqBody.mobile_number;
        } else {
            response.data = driverData
        }
        return response
    }

    @Post('formBookingData')
    async formBookingData(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const driverData = await this.dataService.formBookingData(reqBody)
        if (!driverData) {
            response.success = false;
            response.message = "Problem in saving shop "+reqBody.mobile_number;
        } else {
            response.data = driverData
        }
        return response
    }

    @Post('feedCompanyAddressRates')
    async feedCompanyAddressRates(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const driverData = await this.dataService.feedCompanyAddressRates(reqBody)
        if (!driverData) {
            response.success = false;
            response.message = "Problem in saving shop "+reqBody.mobile_number;
        } else {
            response.data = driverData
        }
        return response
    }

    
}
