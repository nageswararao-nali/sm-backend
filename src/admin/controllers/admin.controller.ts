import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from '../services/admin.service';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('admin')
export class AdminController {
    constructor(private adminService: AdminService){}

    @Post('addConsolidationCenter')
    async addConsolidationCenter(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const userDetails = await this.adminService.addConsolidationCenter(reqBody)
        if (!userDetails) {
            response.success = false;
            response.message = "Problem in creating Consolidation";
        } else {
            response.data = userDetails
        }
        return response
    }

    @Post('getConsolidationCenters')
    async getConsolidationCenters(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const { items, count } = await this.adminService.getConsolidationCenters(reqBody)
        if (!items) {
            response.success = false;
            response.message = "Consolidation Centers not found";
        } else {
            response.data = {consolidationCenters: items, count}
        }
        return response
        
    }
    @Post('getCategories')
    async getCategories(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const catData = await this.adminService.getCategories(reqBody)
        if (!catData) {
            response.success = false;
            response.message = "Categories not found";
        } else {
            response.data = catData
        }
        return response
        
    }

    @Post('sendNotification')
    async sendNotification(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Notification sent'
        }
        await this.adminService.sendPushNotification("Test", "Test notification", [reqBody.token])
        return response
        
    }

    @Post('invoice')
    @UseInterceptors(FileInterceptor('file'))
    async sendSingleInvoice(@UploadedFile() file: Express.Multer.File) {
        let response = {
            success: true,
            data: {},
            message: 'Email Sent'
        }
        await this.adminService.sendSingleInvoice(file.path)
        return response
    }

    @Post('bulk-invoice')
    @UseInterceptors(FileInterceptor('file'))
    async sendBulkInvoice(@UploadedFile() file: Express.Multer.File) {
        let response = {
            success: true,
            data: {},
            message: 'Email Sent'
        }
        await this.adminService.sendBulkInvoice(file.path)
        return response
    }

    @Post('flp-bulk-invoice')
    @UseInterceptors(FileInterceptor('file'))
    async sendFlipkartBulkInvoice(@UploadedFile() file: Express.Multer.File) {
        let response = {
            success: true,
            data: {},
            message: 'Email Sent'
        }
        await this.adminService.sendFlipkartBulkInvoice(file.path)
        return response
    }

    @Post('sendCustomerNotifications')
    async sendCustomerNotifications(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Notification sent'
        }
        await this.adminService.sendCustomerNotifications()
        return response
        
    }
    @Post('addBaseLocation')
    async addBaseLocation(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const userDetails = await this.adminService.addBaseLocation(reqBody)
        if (!userDetails.id) {
            response.success = false;
            response.message = userDetails.message;
        } else {
            response.data = userDetails
        }
        return response
    }

    @Post('getBaseLocations')
    async getBaseLocations(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const { items, count } = await this.adminService.getBaseLocations(reqBody)
        if (!items) {
            response.success = false;
            response.message = "Base Locations not found";
        } else {
            response.data = {baseLocations: items, count}
        }
        return response
        
    }

    @Post('editBaseLocation')
    async editBaseLocation(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const userDetails = await this.adminService.editBaseLocation(reqBody)
        if (!userDetails) {
            response.success = false;
            response.message = "Problem in editing BaseLocation";
        } else {
            response.data = userDetails
        }
        return response
    }

    @Post('sendNotificationToUsers')
    async sendNotificationToUsers(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Notification sent'
        }
        await this.adminService.sendNotificationToUsers(reqBody)
        return response
        
    }

    @Post('sendNotificationToAll')
    async sendNotificationToAll(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Notification sent'
        }
        await this.adminService.sendNotificationToAll(reqBody)
        return response

    }

    @Post('getPortalSettings')
    async getPortalSettings(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const { items, count } = await this.adminService.getPortalSettings(reqBody)
        if (!items) {
            response.success = false;
            response.message = "Portal Settings not found";
        } else {
            response.data = {portalSettings: items, count}
        }
        return response
    }

    @Post('addPortalSetting')
    async addPortalSetting(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const settingData = await this.adminService.addPortalSetting(reqBody)
        if (!settingData.id) {
            response.success = false;
            response.message = settingData.message;
        } else {
            response.data = settingData
        }
        return response
    }

    @Post('editPortalSetting')
    async editPortalSetting(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const settingData = await this.adminService.editPortalSetting(reqBody)
        if (!settingData) {
            response.success = false;
            response.message = "Problem in editing Portal Setting";
        } else {
            response.data = settingData
        }
        return response
    }

    @Public()
    @Post('bookDemo')
    async bookDemo(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        if (!reqBody.name || !reqBody.mobile || !reqBody.email) {
            response.success = false;
            response.message = "Name, mobile and email are required";
            return response
        }
        const sent = await this.adminService.bookDemo(reqBody)
        if (!sent) {
            response.success = false;
            response.message = "Problem in sending demo request";
        } else {
            response.message = "Demo request sent"
        }
        return response
    }

}
