import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getCipherInfo } from 'crypto';
import { Point } from 'geojson';
import { from, Observable } from 'rxjs';
import { UtilsService } from 'src/utils/services/utils.service';
import { In, Repository } from 'typeorm';
import { CustomerAddressEntity } from '../models/customerAddress.entity';
import { NotificationsEntity } from '../models/notifications.entity';
import { UsersEntity } from '../models/users.entity';
import { Users } from '../models/users.interface';
import { SpecialAddressEntity } from '../models/specialAddress.entity';
import { DriverLastLocationDetails } from 'src/trucks/models/driverLastLocDetails';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UsersEntity)
        private usersRepository: Repository<UsersEntity>,
        @InjectRepository(CustomerAddressEntity)
        private cAddrRepository: Repository<CustomerAddressEntity>,
        @InjectRepository(SpecialAddressEntity)
        private splAddrRepository: Repository<SpecialAddressEntity>,
        @InjectRepository(NotificationsEntity)
        private notiRepository: Repository<NotificationsEntity>,
        @InjectRepository(DriverLastLocationDetails)
        private driverLastLocRepo: Repository<DriverLastLocationDetails>,
        
        private utilsService: UtilsService
        ) {}
    async getUsers(): Promise<Observable<Users[]>> {
        let users = from(this.usersRepository.find())
        return users;
    }

    async sendOtp(mobile: string): Promise<Observable<any>> {
        return from(this.utilsService.sendOtp(mobile));
    }

    async verifyOtp(mobile: string, otp: number): Promise<any> {
        return await this.utilsService.verifyOtp(mobile, otp);
    }

    async checkUser(mobile: string, userType: string = ''): Promise<any> {
        let qureyObj: any = []
        if(userType == 'Driver') {
            qureyObj.push({mobile: mobile, user_type: 'Driver', status: 'Active'})
            qureyObj.push({mobile: mobile, user_type: 'Driver', status: 'DarkRoom'})
            qureyObj.push({mobile: mobile, user_type: 'Owner', status: 'Active'})
        } else if(userType){
            qureyObj.push({mobile: mobile, user_type: userType, status: 'Active'})
        } else {
            qureyObj.push({mobile: mobile, status: 'Active'})
        }
        let user = await this.usersRepository.findOne({where: qureyObj})
        return user;
    }

    async updateStatus(mobile: string, status: string): Promise<any> {
        let user = await this.usersRepository.update({mobile}, {"status": status})
        let userData = await this.usersRepository.findOneBy({mobile: mobile})
        const driver = this.utilsService.isUserWithDriver(userData.id)
        if(driver) {
            const dStatus = status == 'Active' ? false : true
            this.utilsService.driverDarkroom(userData.id, dStatus)
            
        }
        return user;
    }
    
    async updateAvailable(mobile: string, is_available: boolean): Promise<any> {
        const userData = await this.usersRepository.findOneBy({mobile: mobile})
        if(userData.status != 'DarkRoom') {
            let user = await this.usersRepository.update({mobile}, {"is_available": is_available})
            let TITLE = 'Hello #'
            let BODY = ''
            if(!is_available) {
                BODY= 'Your tours have been completed. Thank you for your co-operation. Have a good day!'
                await this.utilsService.closeSession(userData.id)
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

    async updateAvailableById(user_id: number, is_available: boolean): Promise<any> {
        const userData = await this.usersRepository.findOneBy({id: user_id});
        if(userData.status != 'DarkRoom') {
            let user = await this.usersRepository.update({id: user_id}, {"is_available": is_available})
            let TITLE = 'Hello #'
            let BODY = ''
            if(!is_available) {
                BODY= 'Your tours have been completed. Thank you for your co-operation. Have a good day!'
                await this.utilsService.closeSession(user_id)
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

    async addUser(reqBody: any): Promise<any> {
        let userInput = {
            name: reqBody.name,
            mobile: reqBody.mobile_number,
            user_type: reqBody.user_type,
            status: 'Active',
            is_available: false
        }
        let user = await this.usersRepository.save(userInput)
        return user;
    }

    async register(reqBody: any): Promise<any> {
        let userInput = {
            name: reqBody.name,
            mobile: reqBody.mobile_number,
            user_type: reqBody.user_type,
            status: 'Active',
            is_available: false,
            company_name: reqBody.company_name,
            company_type: reqBody.company_type
        }
        let user = await this.usersRepository.save(userInput)
        return user;
    }
    
    async profileUpdate(reqBody: any): Promise<any> {
        let userInput: any = {}
        if(reqBody.name) {
            userInput['name'] = reqBody.name
        }
        if(reqBody.company_name) {
            userInput['company_name'] = reqBody.company_name
        }
        if(reqBody.company_type) {
            userInput['company_type'] = reqBody.company_type
        }
        let user = await this.usersRepository.update({mobile: reqBody.mobile_number}, userInput)
        return user;
    }

    async updateOwner(id: number, reqBody: any): Promise<any> {
        let userInput = {
            name: reqBody.name,
            mobile: reqBody.mobile_number,
            user_type: reqBody.user_type,
            status: 'Active',
            is_available: false
        }
        let user = await this.usersRepository.update({id}, userInput)
        return user;
    }

    async deleteOwner(id: number): Promise<any> {
        let user = await this.usersRepository.delete(id)
        return user;
    }

    async getUsersByType(reqBody: any, userType: string): Promise<any> {
        const [items, count] = await this.usersRepository.findAndCount({where: {user_type: userType}, order:{id: 'DESC'}, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) })
        return {items, count}
    }

    async addAddress(reqBody: any): Promise<any> {
        const locPoint: Point = {
            type: 'Point',
            coordinates: [reqBody.longitude, reqBody.latitude]
        }
        const addrInput = {
            "address": reqBody.address,
            "address_type": reqBody.address_type,
            "city": reqBody.city,
            "country": reqBody.country,
            "customer_id": reqBody.customer_id,
            "latitude": reqBody.latitude,
            "longitude": reqBody.longitude,
            "mobile": reqBody.mobile,
            "pincode": reqBody.pincode,
            "receiver_contact": reqBody.receiver_contact,
            "receiver_name": reqBody.receiver_name,
            "state": reqBody.state,
            "created_by": reqBody.customer_id,
            "is_live": ('is_live' in reqBody) ? reqBody.is_live : false,
            "location": locPoint
        }
        // console.log(tripInput)
        const addrDetails = await this.cAddrRepository.save(addrInput)
        return addrDetails
    }
    
    async updateAddress(id: number, reqBody: any): Promise<any> {
        const locPoint: Point = {
            type: 'Point',
            coordinates: [reqBody.longitude, reqBody.latitude]
        }
        const addrInput = {
            "address": reqBody.address,
            "address_type": reqBody.address_type,
            "city": reqBody.city,
            "country": reqBody.country,
            "customer_id": reqBody.customer_id,
            "latitude": reqBody.latitude,
            "longitude": reqBody.longitude,
            "mobile": reqBody.mobile,
            "pincode": reqBody.pincode,
            "receiver_contact": reqBody.receiver_contact,
            "receiver_name": reqBody.receiver_name,
            "state": reqBody.state,
            "created_by": reqBody.customer_id,
            "location": locPoint
        }
        // console.log(tripInput)
        const addrDetails = await this.cAddrRepository.update({id}, addrInput)
        return addrDetails
    }

    
    async deleteAddress(id: number): Promise<any> {
        const addData = await this.cAddrRepository.delete(id)
        return addData;
    }

    async deleteAddresses(reqBody: any): Promise<any> {
        if(reqBody.address_ids) {
            for(let addId of reqBody.address_ids) {
                await this.cAddrRepository.delete({id: addId})
            }
        }
        return true;
    }

    async getAddress(reqBody: any): Promise<any> {
        // console.log({customer_id: reqBody.customer_id, address_type: 'Pickup'})
        const company = await this.utilsService.companyUsers(reqBody.customer_id)
        // console.log(company)
        let cIds = []
        if(company) {
            cIds = company.users.split(",")
            cIds.pop()
            cIds = cIds.map((c)=> {
                return c.replace('#', '')
            })
        } else {
            cIds.push(reqBody.customer_id)
        }
        // console.log(cIds)
        const pickupAdds = await this.cAddrRepository.find({where:{customer_id: In(cIds), address_type: 'Pickup'}, order:{id: 'DESC'} })
        const dropOffAdds = await this.cAddrRepository.find({where:{customer_id: In(cIds), address_type: 'Drop-off'}, order:{id: 'DESC'} })
        let pAddress = []
        let pics = pickupAdds.filter((item) => {
            if(pAddress.indexOf(item.address) < 0) {
                pAddress.push(item.address)
                return item
            }
        })
        let dAddress = []
        let drops = dropOffAdds.filter((item) => {
            if(dAddress.indexOf(item.address) < 0) {
                dAddress.push(item.address)
                return item
            }
        })
        return {
            Pickup_address: pics, 
            Dropoff_address: drops
        }
    }

    async getCustomerAddress(reqBody: any): Promise<any> {
        let addresses = []
        const user = await this.usersRepository.findOneBy({mobile: reqBody.customer_mobile});
        if(user) {
            addresses = await this.cAddrRepository.find({where:{customer_id: user.id}, order:{id: 'DESC'} })
        }
        return addresses
    }
    
    async getAddressById(reqBody: any): Promise<any> {
        const pickupAdds = await this.cAddrRepository.findOneBy({id: reqBody.address_id})
        return pickupAdds
    }

    async getUserById(user_id: number): Promise<any> {
        const user = await this.usersRepository.findOneBy({id: user_id});
        return user
    }

    async getAllCustomers(reqBody: any): Promise<any> {
        const customers = []
        const [items, count] = await this.usersRepository.findAndCount({where: {user_type: 'Customer'}, order:{id: 'DESC'}, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) })
        for(let customer of items) {
            let customerData = {
                ...customer,
                company: await this.utilsService.companyUsers(customer.id)
            }
            customers.push(customerData)
        }
        return {items: customers, count}
    }

    async getRegularCustomers(reqBody: any): Promise<any> {
        let customers = [];
        let companies = await this.utilsService.getAllCompanies(reqBody)
        for(let company of companies) {
            let cIds = company.users.split(",")
            cIds.pop()
            cIds = cIds.map((c)=> {
                return c.replace('#', '')
            })
            const [items, count] = await this.usersRepository.findAndCount({where: {user_type: 'Customer', id : In(cIds)}, order:{id: 'DESC'}, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) })
            for(let customer of items) {
                let customerData = {
                    ...customer,
                    company: company
                }
                customers.push(customerData)
            }
        }
        return {items: customers}
    }

    async updateDeviceToken(reqBody: any): Promise<any> {
        let userData = await this.usersRepository.findOneBy({id: reqBody.userId});
        let previousTokens = userData.device_token ? userData.device_token.split(",") : []
        let user = {}
        if(previousTokens.indexOf(reqBody.token) > -1) {
            let device_token = userData.device_token
            user = await this.usersRepository.update({id:reqBody.userId}, {"device_token": device_token})
        } else {
            let device_token = userData.device_token + (userData.device_token ? "," : "") + reqBody.token
            user = await this.usersRepository.update({id:reqBody.userId}, {"device_token": device_token})
        }
        
        return user;
    }

    async getNotifications(reqBody: any): Promise<any> {
        const [items, count] = await this.notiRepository.findAndCount({where: {status: 0}, order:{id: 'DESC'}, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) })
        return {items, count}
    }
    
    async viewNotification(reqBody: any): Promise<any> {
        const noti = await this.notiRepository.update({id: reqBody.id}, {status: 0, viewed_by: reqBody.user_id, viewed_at: new Date()})
        return noti
    }

    async getAllCompanies(reqBody: any): Promise<any> {
        return await this.utilsService.getAllCompanies(reqBody)
    }

    async tagCutomerToCompany(reqBody: any): Promise<any> {
        return await this.utilsService.tagCutomerToCompany(reqBody)
    }

    async getUnassignedCustomers(reqBody: any): Promise<any> {
        return await this.utilsService.getUnassignedCustomers()
    }

    async addCustomerCompany(reqBody: any): Promise<any> {
        return await this.utilsService.addCustomerCompany(reqBody)
    }
    
    async getCustomersByIds(reqBody: any): Promise<any> {
        return await this.usersRepository.find({where: {id : In(reqBody.customerIds)}})
    }

    async sendNotificationToAll(reqBody: any): Promise<any> {
        const TITLE = 'Version Update.'
        const BODY = `Hello! We wanted to let you know that we've just released a new update for our app. This update includes some great new features and improvements, so we highly recommend you update to the latest version as soon as possible. Thanks, and we hope you enjoy the new update!`
        let users =  await this.usersRepository.find({where:{mobile: '9382066611'}})
        // let users =  await this.usersRepository.find({where:{user_type: 'Customer'}})
        
        for(let user of users) {
            if(user.device_token) {
                console.log(user.name, user.id, user.device_token)
                await this.utilsService.sendPushNotification(TITLE, BODY, user.device_token.split(","))
            }
        }
        return true
    }

    async addSpecialAddress(reqBody: any): Promise<any> {
        const locPoint: Point = {
            type: 'Point',
            coordinates: [reqBody.longitude, reqBody.latitude]
        }
        const addrInput = {
            "address": reqBody.address,
            "city": reqBody.city,
            "country": reqBody.country,
            "latitude": reqBody.latitude,
            "longitude": reqBody.longitude,
            "pincode": reqBody.pincode,
            "location": locPoint
        }
        // console.log(tripInput)
        const addrDetails = await this.splAddrRepository.save(addrInput)
        return addrDetails
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

    async checkLiveAddress(reqBody: any): Promise<any> {
        let liveAddressResp: any = "";
        if(!reqBody.customer_id || reqBody.customer_id === undefined) {
            return false;
        }
        // console.log({customer_id: reqBody.customer_id, address_type: 'Pickup'})
        const company = await this.utilsService.companyUsers(reqBody.customer_id)
        // console.log(company)
        let cIds = []
        if(company) {
            cIds = company.users.split(",")
            cIds.pop()
            cIds = cIds.map((c)=> {
                return c.replace('#', '')
            })
        } else {
            cIds.push(reqBody.customer_id)
        }
        // console.log(cIds)
        const liveAddresses = await this.cAddrRepository.find({where:{customer_id: In(cIds), is_live: true}, order:{id: 'DESC'} })
        for(let liveAddress of liveAddresses) {
            let dis = await this.euclideanDistance(reqBody.latitude, reqBody.longitude, liveAddress.latitude, liveAddress.longitude)
            if(dis <= 50) {
                // console.log(dis)
                liveAddressResp = liveAddress
            }
        }
        return liveAddressResp
    }
    
}
