import { Body, Controller, Param, ParseIntPipe, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AdminService } from 'src/admin/services/admin.service';
import { UtilsService } from 'src/utils/services/utils.service';
import { BookingService } from '../services/booking.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('booking')
export class BookingController {
    constructor(private bookingService: BookingService, private adminService: AdminService, private utilService: UtilsService){}

    @Post('addBooking')
    async addBooking(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Added Successfully'
        }
        const cData = await this.adminService.getNearestCC({lat: reqBody.pickup_lat, long: reqBody.pickup_long})
        //console.log(cData)
        if(cData) {
            const ccManagerId = await this.utilService.getCCManagerByccId(cData.id)
            //console.log(ccManagerId)
            reqBody['engaged_consolidation_manager'] = ccManagerId
            const booking = await this.bookingService.addBooking(reqBody)
            if (!booking) {
                response.success = false;
                response.message = "Problem in saving booking";
            } else {
                response.data = booking
            }
        } else {
            response.success = false;
            response.message = "Problem in adding consolidation manager booking";
        }
        return response
        
    }

    @Post('addMultiBooking')
    async addMultiBooking(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Added Successfully'
        }
        const cData = await this.adminService.getNearestCC({lat: reqBody.pickup[0].pickup_lat, long: reqBody.pickup[0].pickup_long})
        //console.log(cData)
        if(cData) {
            const ccManagerId = await this.utilService.getCCManagerByccId(cData.id)
            //console.log(ccManagerId)
            reqBody['engaged_consolidation_manager'] = ccManagerId
            const booking = await this.bookingService.addMultiBooking(reqBody)
            if (!booking.length) {
                response.success = false;
                response.message = "Problem in saving booking";
            } else {
                response.data = booking
            }
        } else {
            response.success = false;
            response.message = "Problem in adding consolidation manager booking";
        }
        return response
        
    }

    @Post('updateBooking/:id')
    async updateBooking(@Param('id', ParseIntPipe) id: number, @Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Updated Successfully'
        }
        const cData = await this.adminService.getNearestCC({lat: reqBody.pickup_lat, long: reqBody.pickup_long})
        // //console.log(cData)
        if(cData) {
            const ccManagerId = await this.utilService.getCCManagerByccId(cData.id)
            reqBody['engaged_consolidation_manager'] = ccManagerId
            const booking = await this.bookingService.updateBooking(id, reqBody)
            if (!booking) {
                response.success = false;
                response.message = "Problem in updating booking";
            } else {
                response.data = booking
            }
        } else {
            response.success = false;
            response.message = "Problem in updating consolidation manager booking";
        }
        return response
        
    }

    @Post('deleteBooking/:id')
    async deleteBooking(@Param('id', ParseIntPipe) id: number, @Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Deleted Successfully'
        }
        const booking = await this.bookingService.deleteBooking(id)
        if (!booking) {
            response.success = false;
            response.message = "Problem in updating booking";
        } else {
            response.data = booking
        }
        
        return response
        
    }

    @Post('deleteMultiBooking/:id')
    async deleteMultiBooking(@Param('id') id: string, @Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Deleted Successfully'
        }
        const booking = await this.bookingService.deleteMultiBooking(id)
        if (!booking) {
            response.success = false;
            response.message = "Problem in updating booking";
        } else {
            response.data = booking
        }
        
        return response
        
    }

    @Post('getBookings')
    async getBookings(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Loaded bookings successfully'
        }
        const { items, count } = await this.bookingService.getBookings(reqBody)
        if (!items) {
            response.success = false;
            response.message = "Bookings not found";
        } else {
            response.data = {bookings: items, count}
        }
        return response
        
    }
    
    @Post('getLiveBookings')
    async getLiveBookings(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Loaded bookings successfully'
        }
        const { items, count } = await this.bookingService.getLiveBookings(reqBody)
        if (!items) {
            response.success = false;
            response.message = "Bookings not found";
        } else {
            response.data = {bookings: items, count}
        }
        return response
        
    }

    @Post('getTodayBookings')
    async getTodayBookings(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Loaded bookings successfully'
        }
        const { items, count } = await this.bookingService.getTodayBookings(reqBody)
        if (!items) {
            response.success = false;
            response.message = "Bookings not found";
        } else {
            response.data = {bookings: items, count}
        }
        return response
        
    }

    @Post('getBookingsDetails')
    async getBookingsDetails(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Details'
        }
        const bookings = await this.bookingService.getBookingsDetails(reqBody)
        if (!bookings.length) {
            response.success = false;
            response.message = "Bookings not found";
        } else {
            response.data = {bookings: bookings}
        }
        return response
        
    }

    @Post('getBookingDetails')
    async getBookingDetails(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking found'
        }
        const bookingData = await this.bookingService.getBookingById(reqBody.booking_id)
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    // accept by Consolidation Manager means CM sent fare
    @Post('acceptBooking')
    async acceptBooking(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        }
        const bookingData = await this.bookingService.acceptBooking(reqBody.booking_id, reqBody.fare)
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            response.data = bookingData
        }
        return response
    }
    // confirm from customer
    @Post('confirmBooking')
    async confirmBooking(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Confirmed Successfully'
        }
        const bookingData = await this.bookingService.confirmBooking(reqBody.booking_id)
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    // accept and confirm with TBE fare by Consolidation Manager
    @Post('tbeBooking')
    async tbeBooking(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const bookingData = await this.bookingService.tbeBooking(reqBody.booking_id)
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    @Post('cancelByManager')
    async tbeBocancelByManageroking(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Canceled Successfully'
        }
        const bookingData = await this.bookingService.cancelByManager(reqBody.booking_id)
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    @Post('cancelByCustomer')
    async cancelByCustomer(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Canceled by Customer'
        }
        const bookingData = await this.bookingService.cancelByCustomer(reqBody.booking_id)
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    @Post('rejectFare')
    async rejectFare(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Canceled by Customer'
        }
        const bookingData = await this.bookingService.cancelByCustomer(reqBody.booking_id)
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    @Post('markTrip')
    async markTrip(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking marked as Trip'
        }
        const bookingData = await this.bookingService.getBookingById(reqBody.booking_id)
        if (!bookingData) {
            response.success = false;
            response.message = "Invalid booking Id";
        } else {
            bookingData['booking_id'] = bookingData.id
            bookingData['trip_id'] = bookingData.id
            const tripData = await this.bookingService.addTrip(bookingData)
            if (!tripData) {
                response.success = false;
                response.message = "Problem in marking as trip";
            } else {
                response.data = tripData
            }
        }
        return response
        
    }

    @Post('getDistanceToCC')
    async getDistanceToCC(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const cData = await this.adminService.getDistanceToCC({lat: reqBody.lat, long: reqBody.long, ccId: reqBody.ccId})
        // //console.log(cData)
        if (!cData) {
            response.success = false;
            response.message = "Problem in finding distance";
        } else {
            response.data = cData
        }
        return response
        
    }

    @Post('getDistanceToCCBygoogle')
    async getDistanceToCCByGoogle(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const distanceData = await this.utilService.getDistance({lat: reqBody.pickup_lat, long: reqBody.pickup_long}, {lat: reqBody.dropoff_lat, long: reqBody.dropoff_long})
        // //console.log(distanceData)
        if(distanceData.status == 'OK') {
            const data = distanceData.rows[0] ? distanceData.rows[0].elements[0] : null
            response.data = data;
        } else {
            response.success = false;
            response.message = distanceData.status;
        }
        return response
    }
    
    @Post('addTrip')
    async addTrip(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Trip Added Successfully'
        }
        const tripData = await this.bookingService.addTrip(reqBody)
        if (!tripData) {
            response.success = false;
            response.message = "Problem in adding trip";
        } else {
            response.data = tripData
        }
        return response
        
    }

    @Post('getTrips')
    async getTrips(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Trips Found'
        }
        const { items, count } = await this.bookingService.getTrips(reqBody)
        if (!items) {
            response.success = false;
            response.message = "Trips not found";
        } else {
            response.data = {trips: items, count}
        }
        return response
        
    }

    @Post('getPendingTrips')
    async getPendingTrips(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Trips Found'
        }
        const { items, count } = await this.bookingService.getPendingTrips(reqBody)
        if (!items) {
            response.success = false;
            response.message = "Trips not found";
        } else {
            response.data = {trips: items, count}
        }
        return response
        
    }

    @Post('deleteTrip/:id')
    async deleteTrip(@Param('id') id: any) {
        let response = {
            success: true,
            data: {},
            message: 'Trip Deleted Successfully'
        }
        const tripData = await this.bookingService.deleteTrip(id)
        if (!tripData) {
            response.success = false;
            response.message = "Problem in deleting trip";
        } else {
            response.data = tripData
        }
        return response
    }

    @Post('getBookingsReport')
    async getBookingsReport(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Details'
        }
        const bookings = await this.bookingService.getBookingsReport(reqBody)
        if (!bookings.length) {
            response.success = false;
            response.message = "Bookings not found";
        } else {
            response.data = {bookings: bookings}
        }
        return response
        
    }

    @Post('updateBookingFare')
    async updateBookingFare(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const bookingData = await this.bookingService.updateBookingFare(reqBody)
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    @Post('updateBookingDCNumber')
    async updateBookingDCNumber(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const bookingData = await this.bookingService.updateBookingDCNumber(reqBody)
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    @Post('updateBookingDCNumberFromManager')
    async updateBookingDCNumberFromManager(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const bookingData = await this.bookingService.updateBookingDCNumberFromManager(reqBody)
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    @Post('updateBookingWaitingCharge')
    async updateBookingWaitingCharge(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const bookingData = await this.bookingService.updateBookingWaitingCharge(reqBody)
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            response.data = bookingData
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
        const bookingData = await this.bookingService.updateBookingTime(reqBody)
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    @Post('uploadreceipt')
    @UseInterceptors(FileInterceptor('file'))
    async uploadOdometer(@Body() reqBody: any, @UploadedFile() file: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const odometerUpload = await this.bookingService.uploadReceipt(file, reqBody.customer_mobile)
        if (!odometerUpload) {
            response.success = false;
            response.message = "Receipt with customer id "+reqBody.customer_mobile+" not found";
        } else {
            response.data = odometerUpload
        }
        return response
    }
    @Post('addShopBooking')
    async addShopBooking(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Added Successfully'
        }
        const cData = await this.adminService.getNearestCC({lat: reqBody.pickup_lat, long: reqBody.pickup_long})
        //console.log(cData)
        if(cData) {
            const ccManagerId = await this.utilService.getCCManagerByccId(cData.id)
            //console.log(ccManagerId)
            reqBody['engaged_consolidation_manager'] = ccManagerId
            const booking = await this.bookingService.addShopBooking(reqBody)
            if (!booking) {
                response.success = false;
                response.message = "Problem in saving shop booking";
            } else {
                response.data = booking
            }
        } else {
            response.success = false;
            response.message = "Problem in adding consolidation manager booking";
        }
        return response
        
    }

    @Post('getCCavenueSession')
    async getCCavenueSession(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        }
        const bookingData = await this.bookingService.getCCavenueSession(reqBody)
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            response.data = bookingData
        }
        return response
    }
    @Post('getCCavenueResponse')
    async getCCavenueResponse(@Body() reqBody: any, @Res() res: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        }
        const bookingData = await this.bookingService.getCCavenueResponse(reqBody)
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            res.redirect(bookingData)
        }
        return response
    }

    @Post('updateBookingPaymentStatus')
    async updateBookingPaymentStatus(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        }
        const bookingData = await this.bookingService.updateBookingPaymentStatus(reqBody)
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    @Post('exportInvoiceBookingsCsv')
    async exportInvoiceBookingsCsv(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        }
        const bookingData = await this.bookingService.exportInvoiceBookingsCsv(reqBody)
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    @Post('exportInvoiceHomeDeliveryBookingsCsv')
    async exportInvoiceHomeDeliveryBookingsCsv(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        }
        const bookingData = await this.bookingService.exportInvoiceHomeDeliveryBookingsCsv(reqBody)
        if (!bookingData) {
            response.success = false;
            response.message = "Bookings not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    @Post('getMinlBookingsByCustomer')
    async getMinlBookingsByCustomer(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Loaded bookings successfully'
        }
        const { items, count } = await this.bookingService.getMinlBookingsByCustomer(reqBody)
        if (!items) {
            response.success = false;
            response.message = "Bookings not found";
        } else {
            response.data = {bookings: items, count}
        }
        return response
    }

    @Post('getInvoiceBookingsByCompanyId')
    async getInvoiceBookingsByCompanyId(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Loaded bookings successfully'
        }
        const { items, count } = await this.bookingService.getInvoiceBookingsByCompanyId(reqBody)
        if (!items) {
            response.success = false;
            response.message = "Bookings not found";
        } else {
            response.data = {bookings: items, count}
        }
        return response
    }

    @Post('generateInvoiceByCompanyId')
    async generateInvoiceByCompanyId(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Loaded bookings successfully'
        }
        const res = await this.bookingService.generateInvoiceByCompanyId(reqBody)
        if (!res) {
            response.success = false;
            response.message = "";
        } else {
            response.data = {}
        }
        return response
    }

    @Post('getInvoices')
    async getInvoices(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Loaded invoices successfully'
        }
        const { items, count } = await this.bookingService.getInvoices(reqBody)
        if (!items) {
            response.success = false;
            response.message = count;
        } else {
            response.data = {invoices: items, count}
        }
        return response
    }
    
    @Post('updateInvoiceData')
    async updateInvoiceData(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const bookingData = await this.bookingService.updateInvoiceData(reqBody)
        if (!bookingData) {
            response.success = false;
            response.message = "Invoice not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    @Post('regenerateInvoiceById')
    async regenerateInvoiceById(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const bookingData = await this.bookingService.regenerateInvoiceById(reqBody)
        if (!bookingData) {
            response.success = false;
            response.message = "Invoice not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    @Post('downloadInvoiceFiles')
    async downloadInvoiceFiles(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: ''
        }
        const bookingData = await this.bookingService.downloadInvoiceFiles(reqBody)
        if (!bookingData) {
            response.success = false;
            response.message = "Invoice not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    @Post('generateCompanyInvoiceByTour')
    async generateCompanyInvoiceByTour(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Loaded bookings successfully'
        }
        const res = await this.bookingService.generateCompanyInvoiceByTour(reqBody)
        if (!res) {
            response.success = false;
            response.message = '';
        } else {
            response.data = {}
        }
        return response
    }
    
      // accept by Consolidation Manager means CM sent fare
      @Post('declineBooking')
      async declineBooking(@Body() reqBody: any) {
          let response = {
              success: true,
              data: {},
              message: 'Booking Accepted Successfully'
          }
          const bookingData = await this.bookingService.declineBooking(reqBody)
          if (!bookingData) {
              response.success = false;
              response.message = "Booking not found";
          } else {
              response.data = bookingData
          }
          return response
      }

      // get minl booking details with payment details
      @Post('getMinlBookingPayDetails')
      async getMinlBookingPayDetails(@Body() reqBody: any) {
          let response = {
              success: true,
              data: {},
              message: 'Booking Accepted Successfully'
          }
          const bookingData = await this.bookingService.getMinlBookingPayDetails(reqBody)
          if (!bookingData) {
              response.success = false;
              response.message = "Booking not found";
          } else {
              response.data = bookingData
          }
          return response
      }

      // get booking details with payment details
      @Post('getBookingPayDetails')
      async getBookingPayDetails(@Body() reqBody: any) {
          let response = {
              success: true,
              data: {},
              message: 'Booking Accepted Successfully'
          }
          const bookingData = await this.bookingService.getBookingPayDetails(reqBody)
          if (!bookingData) {
              response.success = false;
              response.message = "Booking not found";
          } else {
              response.data = bookingData
          }
          return response
      }

      

      // get booking details with payment details
      @Post('getBookingPayDetailsByMultiId')
      async getBookingPayDetailsByMultiId(@Body() reqBody: any) {
          let response = {
              success: true,
              data: {},
              message: 'Booking Accepted Successfully'
          }
          const bookingData = await this.bookingService.getBookingPayDetailsByMultiId(reqBody)
          if (!bookingData) {
              response.success = false;
              response.message = "Booking not found";
          } else {
              response.data = bookingData
          }
          return response
      }

      // get booking details with payment details
      @Post('customerBookingLog')
      async customerBookingLog(@Body() reqBody: any) {
          let response = {
              success: true,
              data: {},
              message: 'Booking Accepted Successfully'
          }
          const bookingData = await this.bookingService.customerBookingLog(reqBody)
          if (!bookingData) {
              response.success = false;
              response.message = "Booking not found";
          } else {
              response.data = bookingData
          }
          return response
      }

    @Post('getGMCCavenueResponse')
    async getGMCCavenueResponse(@Body() reqBody: any, @Res() res: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        }
        const bookingData = await this.bookingService.getGMCCavenueResponse(reqBody)
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            res.redirect(bookingData)
        }
        return response
    }

    @Post('bookingTimesBackup')
    async bookingTimesBackup(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        }
        const bookingData = await this.bookingService.bookingTimesBackup(reqBody)
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    @Post('genCSV')
    async genCSV(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Booking Accepted Successfully'
        }
        const bookingData = await this.bookingService.genCSV()
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    @Post('driverDaySummary')
    async driverDaySummary(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Drivers Day Summary sent Successfully'
        }
        const bookingData = await this.bookingService.driverDaySummary(reqBody)
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            response.data = bookingData
        }
        return response
    }

    @Post('driverDaySummaryManuel')
    async driverDaySummaryManuel(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Drivers Day Summary sent Successfully'
        }
        const bookingData = await this.bookingService.driverDaySummaryManuel(reqBody)
        if (!bookingData) {
            response.success = false;
            response.message = "Booking not found";
        } else {
            response.data = bookingData
        }
        return response
    }
    
    @Post('testPaymentLinkSMS')
    async testPaymentLinkSMS(@Body() reqBody: any) {
        const response = await this.bookingService.testPaymentLinkSMS()
        
        return response
    }

    @Post('getBookingsByDate')
    async getBookingsByDate(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Loaded bookings successfully'
        }
        const bookings = await this.bookingService.getBookingsByDate(reqBody)
        if (!bookings.length) {
            response.success = false;
            response.message = "Bookings not found";
        } else {
            response.data = {bookings: bookings}
        }
        return response
    }
    
    @Post('checkDrivers')
    async checkDrivers(@Body() reqBody: any) {
        let response = {
            success: true,
            data: {},
            message: 'Loaded bookings successfully'
        }
        const bookings = await this.bookingService.checkDrivers(reqBody)
        if (!bookings.length) {
            response.success = false;
            response.message = "Bookings not found";
        } else {
            response.data = {bookings: bookings}
        }
        return response
    }
    
}
