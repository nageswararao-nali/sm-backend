import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from 'aws-sdk';
import * as moment from 'moment';
import { Repository } from 'typeorm';
import { DriversEntity } from '../models/driver.entity';
import { DriverSessionsEntity } from '../models/driverSessions.entity';
import { TrucksEntity } from '../models/truck.entity';

@Injectable()
export class TruckService {
    constructor(
        @InjectRepository(DriverSessionsEntity)
        private driverSessionRepository: Repository<DriverSessionsEntity>,
        @InjectRepository(TrucksEntity)
        private truckRepository: Repository<TrucksEntity>,
        @InjectRepository(DriversEntity)
        private driverRepository: Repository<DriversEntity>

        
    ){}

    async addDriverSession(reqBody): Promise<any> {
        const sessionInput = {
            "driver_id": reqBody.driver_id,
            "start_location": reqBody.start_location
        }
        let activeSession = await this.driverSessionRepository.findOneBy({user_id: reqBody.driver_id, status: true})
        if(!activeSession) {
            let session = await this.driverSessionRepository.save(sessionInput)
            return session
        } else {
            return null
        }
        
    }

    async getDriverSession(reqBody): Promise<any> {
        let activeSession = await this.driverSessionRepository.findOneBy({user_id: reqBody.driver_id, status: true})
        if(activeSession) {
            const nowDate = moment(new Date());
            const startDate = moment(activeSession.session_start_time)
            let diff: any = nowDate.diff(startDate, 'minutes') - 330
            // console.log(diff)
            let sessionData = {
                ...activeSession,
                duration: diff + " Mins",
                distance: '35' + "KM",
                noTours: 2
            }
            return sessionData
        } else {
            return null
        }
        
    }

    async getTruck(truckId: number): Promise<any> {
        let truckDetails = await this.truckRepository.findOneBy({id: truckId})
        return truckDetails
    }

    async truckByOwner(reqBody: any): Promise<any> {
        let truckDetails = await this.truckRepository.findOneBy({truck_owner_id: reqBody.truck_owner_id})
        return truckDetails
    }

    async driverByOwner(reqBody: any): Promise<any> {
        let driverDetails = await this.driverRepository.findOneBy({truck_owner_id: reqBody.truck_owner_id})
        return driverDetails
    }

    async getTruckByTruckNumber(registration_number: string): Promise<any> {
        let truckDetails = await this.truckRepository.findOneBy({registration_number: registration_number})
        return truckDetails
    }

    async addTruck(reqBody): Promise<any> {
        const truckInput = {
            truck_owner_id: reqBody.truck_owner_id,
            registration_number: reqBody.registration_number,
            vehicle_type: reqBody.vehicle_type,
            capacity: reqBody.capacity,
            capacity_unit: reqBody.capacity_unit,
            opened_closed: reqBody.opened_closed,
            status: 'Available',
            soft_delete: 0
        }
        let truckData = await this.truckRepository.save(truckInput)
        return truckData
        
    }
    
    async updateTruck(id: number, reqBody: any): Promise<any> {
        const truckInput = {
            truck_owner_id: reqBody.truck_owner_id,
            registration_number: reqBody.registration_number,
            vehicle_type: reqBody.vehicle_type,
            capacity: reqBody.capacity,
            capacity_unit: reqBody.capacity_unit,
            opened_closed: reqBody.opened_closed,
            status: 'Available',
            soft_delete: 0
        }
        const truckData = await this.truckRepository.update({id}, truckInput)
        return truckData;
    }

    async updateTruckDetails(id: number, reqBody: any): Promise<any> {
        const truckData = await this.truckRepository.update({id}, reqBody)
        return truckData;
    }

    async deleteTruck(id: number): Promise<any> {
        const truckData = await this.truckRepository.delete(id)
        return truckData;
    }
    
    async deleteByOwner(id: number): Promise<any> {
        const truckData = await this.truckRepository.delete({truck_owner_id: id})
        return truckData;
    }
    
    async getTrucks(reqBody: any): Promise<any> {
        const [items, count] = await this.truckRepository.findAndCount({order:{id: 'DESC'}, skip: (reqBody.offset ? reqBody.offset : 0), take: (reqBody.limit ? reqBody.limit : 10) })
        return {items, count}
    }
}
