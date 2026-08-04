import { Repository } from 'typeorm';
import { DriversEntity } from '../models/driver.entity';
import { DriverSessionsEntity } from '../models/driverSessions.entity';
import { TrucksEntity } from '../models/truck.entity';
export declare class TruckService {
    private driverSessionRepository;
    private truckRepository;
    private driverRepository;
    constructor(driverSessionRepository: Repository<DriverSessionsEntity>, truckRepository: Repository<TrucksEntity>, driverRepository: Repository<DriversEntity>);
    addDriverSession(reqBody: any): Promise<any>;
    getDriverSession(reqBody: any): Promise<any>;
    getTruck(truckId: number): Promise<any>;
    truckByOwner(reqBody: any): Promise<any>;
    driverByOwner(reqBody: any): Promise<any>;
    getTruckByTruckNumber(registration_number: string): Promise<any>;
    addTruck(reqBody: any): Promise<any>;
    updateTruck(id: number, reqBody: any): Promise<any>;
    updateTruckDetails(id: number, reqBody: any): Promise<any>;
    deleteTruck(id: number): Promise<any>;
    deleteByOwner(id: number): Promise<any>;
    getTrucks(reqBody: any): Promise<any>;
}
