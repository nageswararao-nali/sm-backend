import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { TruckService } from '../services/truck.service';

@Controller('trucks')
export class TruckController {
    constructor(private truckService: TruckService){}

    @Get('')
    async getTruckDetails(@Param() truckId: number) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const truckDetails = await this.truckService.getTruck(truckId)
        if (!truckDetails) {
            response.success = false;
            response.message = "Truck with "+truckId+" not found";
        } else {
            response.data = truckDetails
        }
        return response
    }

    @Post('')
    async getTruck(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const truckDetails = await this.truckService.getTruck(reqBody.truckId)
        if (!truckDetails) {
            response.success = false;
            response.message = "Truck with "+reqBody.truckId+" not found";
        } else {
            response.data = truckDetails
        }
        return response
    }

    @Post('addSession')
    async addSession(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const session = await this.truckService.addDriverSession(reqBody)
        if (!session) {
            response.success = false;
            response.message = "Session with driver "+reqBody.driver_id+" already in active";
        } else {
            response.data = session
        }
        return response
    }

    @Post('getSession')
    async getSession(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const session = await this.truckService.getDriverSession(reqBody)
        if (!session) {
            response.success = false;
            response.message = "No active Session for driver "+reqBody.driver_id;
        } else {
            response.data = session
        }
        return response
    }

    @Post('truckByOwner')
    async truckByOwner(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const truckDetails = await this.truckService.truckByOwner(reqBody)
        if (!truckDetails) {
            response.success = false;
            response.message = "Session with driver "+reqBody.driver_id+" already in active";
        } else {
            response.data = truckDetails
        }
        return response
    }

    @Post('driverByOwner')
    async driverByOwner(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const driverDetails = await this.truckService.driverByOwner(reqBody)
        if (!driverDetails) {
            response.success = false;
            response.message = "Session with driver "+reqBody.driver_id+" already in active";
        } else {
            response.data = driverDetails
        }
        return response
    }

    @Post('addTruck')
    async addTruck(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const truckDetails = await this.truckService.getTruckByTruckNumber(reqBody.registration_number)
        if (!truckDetails) {
            const truckD = await this.truckService.addTruck(reqBody)
            if (!truckD) {
                response.success = false;
                response.message = "Problem in saving "+reqBody.registration_number;
            } else {
                response.data = truckD
            }
        } else {
            response.success = false;
            response.message = "Vehicle with registration number "+reqBody.registration_number+" already exists";
        }
        return response
    }

    @Post('updateTruck/:id')
    async updateTruck(@Param('id', ParseIntPipe) id: number, @Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const truckDetails = await this.truckService.updateTruck(id, reqBody)
        if (!truckDetails) {
            response.success = false;
            response.message = "Problem in updating Truck";
        } else {
            response.data = truckDetails
        }
        return response
        
    }

    @Post('deleteTruck/:id')
    async deleteTruck(@Param('id', ParseIntPipe) id: number) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const truckDetails = await this.truckService.deleteTruck(id)
        if (!truckDetails) {
            response.success = false;
            response.message = "Problem in deleting Truck";
        } else {
            response.data = truckDetails
        }
        return response
        
    }
    

    @Post('getTrucks')
    async getTrucks(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const { items, count } = await this.truckService.getTrucks(reqBody)
        if (!items) {
            response.success = false;
            response.message = "Trucks not found";
        } else {
            response.data = {trucks: items, count}
        }
        return response
        
    }
    
}
