import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { from, Observable } from 'rxjs';
import { Users } from '../models/users.interface';
import { UsersService } from '../services/users.service';
import { Public } from 'src/common/decorators/public.decorator';

// Test/admin numbers that skip the real MSG91 send+verify round trip - sendOtp returns
// success without actually sending an SMS, and verifyOtp accepts the fixed '1234' OTP
// instead of checking against MSG91, so these numbers can be used for testing without
// burning SMS credits or needing a real device to receive the OTP.
const OTP_BYPASS_MOBILES = ['6300359889', '9030935373', '8179730725', '8778620133', '7010020749']

@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService, private jwtService: JwtService){}

    @Get()
    getUsers(): Promise<Observable<Users[]>> {
        return this.usersService.getUsers()
    }

    @Public()
    @Post('sendOtp')
    sendOtp(@Body() reqBody: any): Promise<Observable<any>> | any {
        if(OTP_BYPASS_MOBILES.indexOf(reqBody.mobile) > -1) {
            return {type: 'success', message: 'OTP bypassed for test number'}
        }
        return this.usersService.sendOtp(reqBody.mobile)
    }

    @Public()
    @Post('verifyOtp')
    verifyOtp(@Body() reqBody: any) {
        if(reqBody.isAdmin) {
            return {type: 'success'}
        }
        // console.log(reqBody)
        if(OTP_BYPASS_MOBILES.indexOf(reqBody.mobile) > -1 && reqBody.otp == '1234') {
            return {type: 'success'}
        }
        return this.usersService.verifyOtp(reqBody.mobile, reqBody.otp)
    }

    @Public()
    @Post('checkUser')
    async checkUser(@Body() reqBody: any) {
        let response: any = {
            success: true,
            message: 'User Found'
        }
        const user: Users = await this.usersService.checkUser(reqBody.mobile, reqBody.user_type)
        if (!user) {
            response.success = false;
            response.message = "User with mobile "+reqBody.mobile+" not found";
        } else {
            response.data = user
            response.token = this.jwtService.sign({ id: (user as any).id })
        }
        return response
    }

    @Public()
    @Post('register')
    async register(@Body() reqBody: any) {
        let response: any = {
            success: true,
            message: 'User Registered'
        }
        const user: Users = await this.usersService.checkUser(reqBody.mobile_number)
        if (user) {
            response.success = false;
            response.message = "User with mobile "+reqBody.mobile_number+" already exists";
        } else {
            const userData = await this.usersService.register(reqBody)
            if (!userData) {
                response.success = false;
                response.message = "Problem in registering the user";
            } else {
                response.data = userData
                response.token = this.jwtService.sign({ id: (userData as any).id })
            }
        }
        return response
    }

    @Post('profileUpdate')
    async profileUpdate(@Body() reqBody: any) {
        let response = {
            success: true,
            message: 'User Profile Updated Successfully'
        }
        const user: Users = await this.usersService.checkUser(reqBody.mobile_number)
        if (!user) {
            response.success = false;
            response.message = "User with mobile "+reqBody.mobile_number+" not exists";
        } else {
            const userData = await this.usersService.profileUpdate(reqBody)
            if (!userData) {
                response.success = false;
                response.message = "Problem in updating profile of the user";
            }
        }
        return response
    }

    @Post('getAllCustomers')
    async getAllCustomers(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'User Found'
        }
        const {items, count} = await this.usersService.getAllCustomers(reqBody)
        if (!items) {
            response.success = false;
            response.message = "Customers not found";
        } else {
            response.data = {customers: items, count}
        }
        return response
    }

    @Post('getRegularCustomers')
    async getRegularCustomers(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'User Found'
        }
        const {items, count} = await this.usersService.getRegularCustomers(reqBody)
        if (!items) {
            response.success = false;
            response.message = "Customers not found";
        } else {
            response.data = {customers: items, count}
        }
        return response
    }

    @Post('userDetails')
    async userDetails(@Body() reqBody: any) {
        let response = {
            success: true,
            message: '',
            data: {}
        }
        const user: Users = await this.usersService.checkUser(reqBody.mobile)
        if (!user) {
            response.success = false;
            response.message = "User with mobile "+reqBody.mobile+" not found";
        } else {
            response.data = user
        }
        return response
    }
    
    @Post('updateStatus')
    async updateStatus(@Body() reqBody: any) {
        let response = {
            success: true,
            message: 'User Status Changed'
        }
        const user = await this.usersService.updateStatus(reqBody.mobile, reqBody.status)
        if (!user.affected) {
            response.success = false;
            response.message = "Problem in updating status ";
        }
        return response
    }

    @Post('updateAvailable')
    async updateAvailable(@Body() reqBody: any) {
        let response = {
            success: true,
            message: 'User Availability Changed'
        }
        const user = await this.usersService.updateAvailable(reqBody.mobile, reqBody.is_available)
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
        const user = await this.usersService.updateAvailableById(reqBody.user_id, reqBody.is_available)
        if (!user.affected) {
            response.success = false;
            response.message = "Problem in updating Availability";
        }
        return response
    }

    @Post('addAddress')
    async addAddress(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const addr: any = await this.usersService.addAddress(reqBody)
        if (!addr) {
            response.success = false;
            response.message = "Address saved successfully";
        } else {
            response.data = addr
        }
        return response
    }

    @Post('updateAddress/:id')
    async updateAddress(@Param('id', ParseIntPipe) id: number, @Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const addr: any = await this.usersService.updateAddress(id, reqBody)
        if (!addr) {
            response.success = false;
            response.message = "Address Edited successfully";
        } else {
            response.data = addr
        }
        return response
    }

    @Post('deleteAddress/:id')
    async deleteAddress(@Param('id', ParseIntPipe) id: number) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const addr: any = await this.usersService.deleteAddress(id)
        if (!addr) {
            response.success = false;
            response.message = "Address Delete Fails";
        } else {
            response.data = addr
        }
        return response
    }

    
    @Post('deleteAddresses')
    async deleteAddresses(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const adsData = await this.usersService.deleteAddresses(reqBody)
        if (!adsData) {
            response.success = false;
            response.message = "Addresses not found";
        } else {
            response.data = adsData
        }
        return response
        
    }

    @Post('getAddress')
    async getAddress(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const adsData = await this.usersService.getAddress(reqBody)
        if (!adsData) {
            response.success = false;
            response.message = "Addresses not found";
        } else {
            response.data = adsData
        }
        return response
        
    }

    @Post('getAddressById')
    async getAddressById(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const getAddressData = await this.usersService.getAddressById(reqBody)
        if (!getAddressData) {
            response.success = false;
            response.message = "Addresses not found";
        } else {
            response.data = getAddressData
        }
        return response
        
    }

    @Post('getCustomerAddress')
    async getCustomerAddress(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const adsData = await this.usersService.getCustomerAddress(reqBody)
        if (!adsData) {
            response.success = false;
            response.message = "Addresses not found";
        } else {
            response.data = adsData
        }
        return response
        
    }
    
    @Post('updateDeviceToken')
    async updateDeviceToken(@Body() reqBody: any) {
        let response = {
            success: true,
            message: 'User token Changed'
        }
        const user = await this.usersService.updateDeviceToken(reqBody)
        if (!user.affected) {
            response.success = false;
            response.message = "Problem in updating token ";
        }
        return response
    }

    @Post('getNotifications')
    async getNotifications(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'User Found'
        }
        const {items, count} = await this.usersService.getNotifications(reqBody)
        if (!items) {
            response.success = false;
            response.message = "Notifications not found";
        } else {
            response.data = {notifications: items, count}
        }
        return response
    }

    @Post('viewNotification')
    async viewNotification(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Notification viewed'
        }
        const noti = await this.usersService.viewNotification(reqBody)
        if (!noti) {
            response.success = false;
            response.message = "Notification not updated";
        } else {
            response.data = noti
        }
        return response
    }

    @Post('getAllCompanies')
    async getAllCompanies(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Companies List'
        }
        const companies = await this.usersService.getAllCompanies(reqBody)
        if (!companies) {
            response.success = false;
            response.message = "Companies not found";
        } else {
            response.data = companies
        }
        return response
    }

    @Post('tagCutomerToCompany')
    async tagCutomerToCompany(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Companies List'
        }
        const companies = await this.usersService.tagCutomerToCompany(reqBody)
        if (!companies) {
            response.success = false;
            response.message = "Companies not found";
        } else {
            response.data = companies
        }
        return response
    }
    
    @Post('getUnassignedCustomers')
    async getUnassignedCustomers(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Customers List'
        }
        const customers = await this.usersService.getUnassignedCustomers(reqBody)
        if (!customers) {
            response.success = false;
            response.message = "Companies not found";
        } else {
            response.data = customers
        }
        return response
    }

    @Post('addCustomerCompany')
    async addCustomerCompany(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Customers List'
        }
        const customers = await this.usersService.addCustomerCompany(reqBody)
        if (!customers) {
            response.success = false;
            response.message = "User Company Failed";
        } else {
            response.data = customers
        }
        return response
    }

    
    @Post('getCustomersByIds')
    async getCustomersByIds(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Customers List'
        }
        const customers = await this.usersService.getCustomersByIds(reqBody)
        if (!customers) {
            response.success = false;
            response.message = "User Company Failed";
        } else {
            response.data = customers
        }
        return response
    }

    @Post('sendNotificationToAll')
    async sendNotificationToAll(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Customers List'
        }
        const customers = await this.usersService.sendNotificationToAll(reqBody)
        if (!customers) {
            response.success = false;
            response.message = "User Company Failed";
        } else {
            response.data = customers
        }
        return response
    }
    
    @Post('addSpecialAddress')
    async addSpecialAddress(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const addr: any = await this.usersService.addSpecialAddress(reqBody)
        if (!addr) {
            response.success = false;
            response.message = "Spl Address saved successfully";
        } else {
            response.data = addr
        }
        return response
    }
    
    @Post('checkLiveAddress')
    async checkLiveAddress(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Customers List'
        }
        const liveAddress = await this.usersService.checkLiveAddress(reqBody)
        if (!liveAddress) {
            response.success = false;
            response.message = "No match found!";
        } else {
            response.data = liveAddress
        }
        return response
    }
}
