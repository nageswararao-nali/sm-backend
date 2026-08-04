import { Body, Controller, Param, ParseIntPipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Tours } from '../models/tours.interface';
import { TourService } from '../services/tour.service';

@Controller('tours')
export class TourController {
    constructor(private tourService: TourService){}

    @Post('tourDetails')
    async tourDetails(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.tourDetails(reqBody.tourId)
        if (!tour) {
            response.success = false;
            response.message = "Tour with id "+reqBody.tourId+" not found";
        } else {
            response.data = tour
        }
        return response
    }

    @Post('tourFullDetails')
    async tourFullDetails(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour = await this.tourService.tourFullDetails(reqBody.tourId)
        if (!tour) {
            response.success = false;
            response.message = "Tour with id "+reqBody.tourId+" not found";
        } else {
            response.data = tour
        }
        return response
    }

    @Post('toursList')
    async toursList(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.toursList(reqBody)
        if (!tour) {
            response.success = false;
            response.message = "Tours list empty";
        } else {
            response.data = tour
        }
        return response
    }

    @Post('assignTour')
    async assignTour(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.acceptTour(reqBody)
        if (!tour) {
            response.success = false;
            response.message = "Tour with id "+reqBody.tourId+" not found";
        } else {
            response.data = tour
        }
        return response
    }

    @Post('startTour')
    async startTour(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.startTour(reqBody)
        if (!tour) {
            response.success = false;
            response.message = "Tour with id "+reqBody.tourId+" not found";
        } else {
            response.data = tour
        }
        return response
    }

    @Post('uploadOdometer')
    @UseInterceptors(FileInterceptor('file'))
    async uploadOdometer(@Body() reqBody: any, @UploadedFile() file: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const odometerUpload = await this.tourService.uploadOdometer(file, reqBody.tour_id)
        if (!odometerUpload) {
            response.success = false;
            response.message = "Odometer with tour id "+reqBody.tour_id+" not found";
        } else {
            response.data = odometerUpload
        }
        return response
    }

    @Post('tourDocuments')
    @UseInterceptors(FileInterceptor('file'))
    async tourDocuments(@Body() reqBody: any, @UploadedFile() file: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const odometerUpload = await this.tourService.tourDocuments(file, reqBody.tour_id)
        if (!odometerUpload) {
            response.success = false;
            response.message = "Tour Documents with tour id "+reqBody.tour_id+" not found";
        } else {
            response.data = odometerUpload
        }
        return response
    }

    @Post('sendTourOtp')
    async sendTourOtp(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const odometerUpload = await this.tourService.sendTourOtp(reqBody.mobile)
        if (!odometerUpload) {
            response.success = false;
            response.message = "Tour Documents with tour id "+reqBody.tour_id+" not found";
        } else {
            response.data = {message: 'OTP sent successfully'}
        }
        return response
    }

    @Post('verifyTourOtp')
    async verifyTourOtp(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const odometerUpload = await this.tourService.verifyTourOtp(reqBody.mobile, reqBody.otp)
        if (!odometerUpload) {
            response.success = false;
            response.message = "Tour Documents with tour id "+reqBody.tour_id+" not found";
        } else {
            response.data = {message: 'OTP Verified Successfully'}
        }
        return response
    }

    @Post('truckerTour')
    async truckerTour(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour = await this.tourService.truckerTour(reqBody)
        // console.log(tour)
        if (!tour) {
            response.success = false;
            response.message = "Tours not found with trucker id "+reqBody.truck_owner_id;
        } else {
            response.data = tour
        }
        return response
    }
    
    @Post('rejectTour')
    async rejectTour(@Body() reqBody: any) {
        const res = await this.tourService.rejectTour(reqBody)
        return res
    }

    @Post('addTour')
    async addTour(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.addTour(reqBody)
        if (!tour) {
            response.success = false;
            response.message = "Tour saved successfully";
        } else {
            response.data = tour
        }
        return response
    }

    @Post('updateTourDriver')
    async updateTourDriver(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.updateTourDriver(reqBody)
        if (!tour) {
            response.success = false;
            response.message = "Problem in updating Tour Driver";
        } else {
            response.data = tour
        }
        return response
    }

    @Post('sendDeliveryOtp')
    async sendDeliveryOtp(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.updateTourDriver(reqBody)
        if (!tour) {
            response.success = false;
            response.message = "Problem in sending Delivery Otp";
        } else {
            response.data = tour
        }
        return response
    }

    @Post('completeTourRoute')
    async completeTourRoute(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.completeTourRoute(reqBody.seq)
        if (!tour) {
            response.success = false;
            response.message = "Problem in completing tour";
        } else {
            response.data = tour
        }
        return response
    }

    @Post('updateSequence')
    async updateSequence(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.updateSequence(reqBody)
        if (!tour) {
            response.success = false;
            response.message = "Tour Sequence updated successfully";
        } else {
            response.data = tour
        }
        return response
    }

    @Post('updatePaySequence')
    async updatePaySequence(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.updatePaySequence(reqBody)
        if (!tour) {
            response.success = false;
            response.message = "Tour Sequence updated successfully";
        } else {
            response.data = tour
        }
        return response
    }
    
    @Post('completeTour')
    async completeTour(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.completeTour(reqBody)
        if (!tour) {
            response.success = false;
            response.message = "Tour completed successfully";
        } else {
            response.data = tour
        }
        return response
    }

    @Post('tourInfo')
    async tourInfo(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.tourInfo(reqBody.tourId)
        if (!tour) {
            response.success = false;
            response.message = "Tour with id "+reqBody.tourId+" not found";
        } else {
            response.data = tour
        }
        return response
    }

    @Post('deleteTour/:id')
    async deleteSession(@Param('id', ParseIntPipe) id: number) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tourDetails = await this.tourService.deleteTour(id)
        if (!tourDetails) {
            response.success = false;
            response.message = "Tour not found";
        } else {
            response.data = tourDetails
        }
        return response
        
    }
    
    @Post('updateTourTrips')
    async updateTourTrips(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.updateTourTrips(reqBody)
        if (!tour) {
            response.success = false;
            response.message = "Problem in updating Tour Trips";
        } else {
            response.data = tour
        }
        return response
    }

    @Post('addClosedTour')
    async addClosedTour(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.addClosedTour(reqBody)
        if (!tour) {
            response.success = false;
            response.message = "Tour saved successfully";
        } else {
            response.data = tour
        }
        return response
    }

    @Post('callToCustomer')
    async callToCustomer(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.callToCustomer(reqBody)
        if (!tour) {
            response.success = false;
            response.message = "Called successfully";
        } else {
            response.data = tour
        }
        return response
    }

    @Post('callToDriver')
    async callToDriver(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.callToDriver(reqBody)
        if (!tour) {
            response.success = false;
            response.message = "Called successfully";
        } else {
            response.data = tour
        }
        return response
    }

    @Post('testExotel')
    async testExotel(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.testExotel(reqBody)
        if (!tour) {
            response.success = false;
            response.message = "Called successfully";
        } else {
            response.data = tour
        }
        return response
    }
    
    @Post('testExotelByNumbers')
    async testExotelByNumbers(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.testExotelByNumbers(reqBody)
        if (!tour) {
            response.success = false;
            response.message = "Called successfully";
        } else {
            response.data = tour
        }
        return response
    }

    @Post('updateBookingTime')
    async updateBookingTime(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        }
        const bookingData = await this.tourService.updateBookingTime(reqBody)
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    @Post('getTourDistance')
    async getTourDistance(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        }
        const bookingData = await this.tourService.getTourDistance(reqBody)
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    @Post('callDriverWhenTourEdit')
    async callDriverWhenTourEdit(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Called To Driver'
        }
        const bookingData = await this.tourService.callDriverWhenTourEdit(reqBody)
        if (!bookingData) {
            response.success = false;
            response.message = "Driver not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    @Post('tourDetailsData')
    async tourDetailsData(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Called To Driver'
        }
        const bookingData = await this.tourService.tourDetailsData(reqBody.tourId)
        if (!bookingData) {
            response.success = false;
            response.message = "Driver not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    @Post('notificationToCustomerAboutDriverWaiting')
    async notificationToCustomerAboutDriverWaiting(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Called To Driver'
        }
        const bookingData = await this.tourService.notificationToCustomerAboutDriverWaiting()
        if (!bookingData) {
            response.success = false;
            response.message = "Driver not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    @Post('driverToursList')
    async driverToursList(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.driverToursList(reqBody)
        if (!tour) {
            response.success = false;
            response.message = "Tours list empty";
        } else {
            response.data = tour
        }
        return response
    }

    @Post('driverBookingsList')
    async driverBookingsList(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.driverBookingsList(reqBody)
        if (!tour) {
            response.success = false;
            response.message = "Tours list empty";
        } else {
            response.data = tour
        }
        return response
    }

    @Post('checkDelayTours')
    async checkDelayTours(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.checkDelayTours(reqBody)
        if (!tour) {
            response.success = false;
            response.message = "Tours list empty";
        } else {
            response.data = tour
        }
        return response
    }

    @Post('test')
    async test(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.test(reqBody)
        if (!tour) {
            response.success = false;
            response.message = "Tours list empty";
        } else {
            response.data = tour
        }
        return response
    }
    
    @Post('checkTourSessionTagging')
    async checkTourSessionTagging(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Session Fare Updated'
        }
        const updateSes = await this.tourService.checkTourSessionTagging(reqBody)
        if (!updateSes) {
            response.success = false;
            response.message = "Problem in checking driver session tour tagging";
        } else {
            response.data = updateSes
        }
        return response
    }

    @Post('cleanDoubleTagged')
    async cleanDoubleTagged(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Session Fare Updated'
        }
        const updateSes = await this.tourService.cleanDoubleTagged(reqBody)
        if (!updateSes) {
            response.success = false;
            response.message = "Problem in checking driver session tour tagging";
        } else {
            response.data = updateSes
        }
        return response
    }
    
    @Post('uploadDeliveryProof')
    @UseInterceptors(FileInterceptor('proof_image'))
    async uploadDeliveryProof(@Body() reqBody: any, @UploadedFile() file: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const proof = await this.tourService.uploadDeliveryProof(
            file,
            Number(reqBody.seq_num),
            reqBody.lat ? Number(reqBody.lat) : undefined,
            reqBody.lng ? Number(reqBody.lng) : undefined,
        )
        if (!proof) {
            response.success = false;
            response.message = 'Failed to upload delivery proof';
        } else {
            response.data = proof
        }
        return response
    }

    @Post('vehicleLiveDataList')
    async vehicleLiveDataList(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const vhecleList = await this.tourService.vehicleLiveDataList(reqBody)
        if (!vhecleList) {
            response.success = false;
            response.message = "vehicle list empty";
        } else {
            response.data = vhecleList
        }
        return response
    }

    @Post('estimateLiveVehicleData')
    async estimateLiveVehicleData(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const vhecleList = await this.tourService.estimateLiveVehicleData(reqBody)
        if (!vhecleList) {
            response.success = false;
            response.message = "vehicle list empty";
        } else {
            response.data = vhecleList
        }
        return response
    }

    @Post('getEstimatedLiveVehicleData')
    async getEstimatedLiveVehicleData(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const vhecleList = await this.tourService.getEstimatedLiveVehicleData(reqBody)
        if (!vhecleList) {
            response.success = false;
            response.message = "vehicle list empty";
        } else {
            response.data = vhecleList
        }
        return response
    }

    @Post('simulateVehicleLiveDataList')
    async simulateVehicleLiveDataList(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const vhecleList = await this.tourService.simulateVehicleLiveDataList(reqBody)
        if (!vhecleList) {
            response.success = false;
            response.message = "vehicle list empty";
        } else {
            response.data = vhecleList
        }
        return response
    }

    
    @Post('initiateReturn')
    async initiateReturn(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.initiateReturn(reqBody)
        if (!tour) {
            response.success = false;
            response.message = "Tour Sequence updated successfully";
        } else {
            response.data = tour
        }
        return response
    }

    @Post('getDriverToursByDate')
    async getDriverToursByDate(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tours: Tours[] = await this.tourService.getDriverToursByDate(reqBody)
        if (!tours && tours.length) {
            response.success = false;
            response.message = "Tours not found";
        } else {
            response.data = tours
        }
        return response
    }
    
    @Post('checkActiveTour')
    async checkActiveTour(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const tour: Tours = await this.tourService.checkActiveTour(reqBody.driver_id)
        if (!tour) {
            response.success = false;
            response.message = "Tour Save has issue!";
        } else {
            response.data = tour
        }
        return response
    }

    
}
