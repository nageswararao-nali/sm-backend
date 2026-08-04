"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const moment = require("moment");
const shop_entity_1 = require("../models/shop.entity");
const utils_service_1 = require("../../utils/services/utils.service");
const config_1 = require("@nestjs/config");
const gmRates_1 = require("../models/gmRates");
const csv_parse_1 = require("csv-parse");
const cusomerCompanyDetails_1 = require("../models/cusomerCompanyDetails");
const specialAddress_entity_1 = require("../../users/models/specialAddress.entity");
const booking_entity_1 = require("../../bookings/models/booking.entity");
const bookingStatus_entity_1 = require("../../bookings/models/bookingStatus.entity");
const customerAddressRates_entity_1 = require("../models/customerAddressRates.entity");
var QRCode = require('qrcode');
var fs = require("fs");
let DataService = class DataService {
    constructor(shopsRepo, gmRates, customerCompany, splAddressRepo, bookingRepository, bsRepo, carRepo, utilsService, configService) {
        this.shopsRepo = shopsRepo;
        this.gmRates = gmRates;
        this.customerCompany = customerCompany;
        this.splAddressRepo = splAddressRepo;
        this.bookingRepository = bookingRepository;
        this.bsRepo = bsRepo;
        this.carRepo = carRepo;
        this.utilsService = utilsService;
        this.configService = configService;
        this.updateGMRates = async (reqBody) => {
            let csvData = [];
            const that = this;
            fs.createReadStream('./public/data/rates_data.csv')
                .pipe((0, csv_parse_1.parse)({ delimiter: ',' }))
                .on('data', function (csvrow) {
                console.log(csvrow);
                csvData.push(csvrow);
            })
                .on('end', async function () {
                let i = 0;
                for (let rate of csvData) {
                    if (i != 0) {
                        let reqObj = {
                            base_rate: rate[2],
                            rate_per_km: rate[3],
                            loading: rate[4],
                            unloading: rate[5],
                            loading_unloading: rate[6]
                        };
                        let whereCon = {
                            id: rate[0],
                            quantity: rate[1],
                            company_id: rate[7]
                        };
                        console.log(whereCon);
                        console.log(reqObj);
                        let upd = await that.gmRates.update(whereCon, reqObj);
                        console.log(upd);
                    }
                    i++;
                }
            });
            return csvData;
        };
        this.updateCompanyData = async (reqBody) => {
            let csvData = [];
            const that = this;
            fs.createReadStream('./public/data/companies_data.csv')
                .pipe((0, csv_parse_1.parse)({ delimiter: ',' }))
                .on('data', function (csvrow) {
                csvData.push(csvrow);
            })
                .on('end', async function () {
                let i = 0;
                for (let cpy of csvData) {
                    if (i != 0) {
                        let reqObj = {
                            company_name: cpy[1],
                            users: cpy[2],
                            return_percentage: cpy[3],
                            min_base_fare: cpy[4],
                            extra_charge_percentage: cpy[5],
                            additional_pickup_charge: cpy[6],
                            return_percentage_value: cpy[7],
                            name: cpy[9],
                            mobile: cpy[10],
                            email: cpy[11],
                            address: cpy[12],
                            gst: cpy[13],
                            billing_cycle: cpy[14],
                            waiting_charge_type: cpy[15],
                            loading_charge: cpy[16],
                            address_id: cpy[17] ? cpy[17] : 0,
                            discount_on_waiting_charges: cpy[19],
                            dead_miles_price: cpy[20]
                        };
                        let whereCon = {
                            id: cpy[0]
                        };
                        console.log(whereCon);
                        console.log(reqObj);
                        await that.customerCompany.update(whereCon, reqObj);
                    }
                    i++;
                }
            });
            return csvData;
        };
        this.feedSpecialAddress = async (reqBody) => {
            const pointObject = {
                type: "Point",
                coordinates: [reqBody.longitude, reqBody.latitude]
            };
            let reqObj = {
                latitude: reqBody.latitude,
                longitude: reqBody.longitude,
                location: pointObject,
                amount: reqBody.amount
            };
            return await this.splAddressRepo.save(reqObj);
        };
        this.updateMultiBookingId = async (reqBody) => {
            let bookings = await this.bookingRepository.find({ where: { multi_booking_id: '' }, take: 10000 });
            for (let booking of bookings) {
                let multi_booking_id = (new Date(booking.pickup_time).getTime()).toString(36);
                console.log(booking.id, booking.multi_booking_id, multi_booking_id);
                await this.bookingRepository.update({ id: booking.id }, { multi_booking_id: multi_booking_id });
            }
            return true;
        };
        this.cTimeUpdatesOld = async (reqBody) => {
            let csvData = [];
            const that = this;
            fs.createReadStream('./public/time_updates.csv')
                .pipe((0, csv_parse_1.parse)({ delimiter: ',' }))
                .on('data', function (csvrow) {
                csvData.push(csvrow);
            })
                .on('end', async function () {
                let i = 0;
                for (let cpy of csvData) {
                    if (i != 0) {
                        console.log("id ", cpy[0], cpy[8]);
                        let prdFormat = cpy[2].split(" ")[0];
                        let prdts = prdFormat.split("-");
                        let prtimed = prdts[2] + "-" + prdts[1] + "-" + prdts[0] + " " + cpy[2].split(" ")[1];
                        let prtime = moment(prtimed).format('YYYY-MM-DD HH:mm:ss');
                        let pddFormat = cpy[3].split(" ")[0];
                        let pddts = pddFormat.split("-");
                        let pdtimed = pddts[2] + "-" + pddts[1] + "-" + pddts[0] + " " + cpy[3].split(" ")[1];
                        let pdtime = moment(pdtimed).format('YYYY-MM-DD HH:mm:ss');
                        let crdFormat = cpy[4].split(" ")[0];
                        let crdts = crdFormat.split("-");
                        let crtimed = crdts[2] + "-" + crdts[1] + "-" + crdts[0] + " " + cpy[4].split(" ")[1];
                        let crtime = moment(crtimed).format('YYYY-MM-DD HH:mm:ss');
                        let cddFormat = cpy[5].split(" ")[0];
                        let cddts = cddFormat.split("-");
                        let cdtimed = cddts[2] + "-" + cddts[1] + "-" + cddts[0] + " " + cpy[5].split(" ")[1];
                        let cdtime = moment(cdtimed).format('YYYY-MM-DD HH:mm:ss');
                        let upd = {
                            reached_pickup: cpy[2],
                            completed_pickup: cpy[3],
                            reached_drop: cpy[4],
                            completed_drop: cpy[5],
                        };
                        console.log(upd);
                        await that.bookingRepository.update({ id: cpy[0] }, upd);
                    }
                    i++;
                }
            });
            return csvData;
        };
        this.cTimeUpdates = async (reqBody) => {
            let csvData = [];
            const that = this;
            fs.createReadStream('./public/may_21.csv')
                .pipe((0, csv_parse_1.parse)({ delimiter: ',' }))
                .on('data', function (csvrow) {
                csvData.push(csvrow);
            })
                .on('end', async function () {
                let i = 0;
                for (let cpy of csvData) {
                    if (i != 0) {
                        console.log("id ", cpy[0], cpy[9]);
                        let cTime = moment(cpy[9]).add(330, 'minutes').format('YYYY-MM-DD HH:mm:ss');
                        let upd = {
                            completed_drop: cTime,
                        };
                        console.log(upd);
                        await that.bookingRepository.update({ id: cpy[0] }, upd);
                    }
                    i++;
                }
            });
            return csvData;
        };
        this.updateBookingTimes = async (reqBody) => {
            const bookings = await this.bookingRepository.createQueryBuilder('b')
                .select('id, customer_id, reached_pickup')
                .where("reached_pickup > :fpickupDate and reached_pickup < :epickupDate", { fpickupDate: '2024-06-01', epickupDate: '2024-06-07' })
                .orderBy('reached_pickup')
                .getRawMany();
            let bIds = '';
            let nids = '';
            if (bookings && bookings.length) {
                for (let booking of bookings) {
                    let bTimes = {};
                    let bookingStatus = await this.bsRepo.find({ where: { booking_id: booking.id, status: (0, typeorm_2.In)(['Reached pickup', 'Completed pickup', 'Reached drop', 'Completed drop']) } });
                    if (bookingStatus.length) {
                        let i = 0;
                        for (let bStatus of bookingStatus) {
                            let cTime = moment(bStatus['updated_at']).add(330, 'minutes').format('YYYY-MM-DD HH:mm:ss');
                            if (bStatus['status'] == 'Reached pickup') {
                                bTimes['reached_pickup'] = cTime;
                                i++;
                            }
                            if (bStatus['status'] == 'Completed pickup') {
                                bTimes['completed_pickup'] = cTime;
                                i++;
                            }
                            if (bStatus['status'] == 'Reached drop') {
                                bTimes['reached_drop'] = cTime;
                                i++;
                            }
                            if (bStatus['status'] == 'Completed drop') {
                                bTimes['completed_drop'] = cTime;
                                i++;
                            }
                        }
                        await this.bookingRepository.update({ id: booking.id }, bTimes);
                    }
                    else {
                        console.log("no times ----------------------");
                    }
                    console.log(booking.id, booking.customer_id, booking.reached_pickup);
                    console.log(bTimes);
                    bIds = bIds + booking.id + ',';
                }
            }
            console.log(bookings.length);
            console.log(bIds);
            console.log("--------------");
            console.log(nids);
            return true;
        };
        this.formBookingData = async (reqBody) => {
            let bData = [
                [46585, "2024-11-18 02:59:55.320"],
                [46586, "2024-11-18 02:59:59.472"],
                [46589, "2024-11-18 03:36:53.784"]
            ];
            let bString = "";
            const reportFileName = './public/bks_17_28_bks.csv';
            const headerData = ['Booking id', 'Date'];
            for (let i = 0; i < headerData.length; i++) {
                bString += headerData[i] + ",";
            }
            bString += '\n';
            for (let bkg of bData) {
                console.log(bkg[0] + ',\t' + moment(bkg[1]).add(330, 'minutes').format('YYYY-MM-DD HH:mm:ss'));
                bString += bkg[0] + "," + moment(bkg[1]).add(330, 'minutes').format('YYYY-MM-DD HH:mm:ss') + '\n';
            }
            await fs.writeFileSync(reportFileName, bString, 'utf8');
        };
        this.feedCompanyAddressRates = async (reqBody) => {
            console.log("code running ...");
            let csvData = [];
            const that = this;
            fs.createReadStream('./public/BalajiRatesFile.csv')
                .pipe((0, csv_parse_1.parse)({ delimiter: ',' }))
                .on('data', function (csvrow) {
                console.log("data on ");
                csvData.push(csvrow);
            })
                .on('end', async function () {
                let i = 0;
                console.log("loading .....");
                for (let addrData of csvData) {
                    if (i != 0) {
                        console.log("addr ", addrData[0], 4, addrData[19], addrData[20]);
                        if (addrData[19] && addrData[20]) {
                            let objd = {
                                company_id: 4,
                                address_id: addrData[0],
                                fare: parseFloat(addrData[19]),
                                return_fare: parseFloat(addrData[20])
                            };
                            console.log(objd);
                            await that.carRepo.save(objd);
                        }
                    }
                    i++;
                }
            });
            return csvData;
        };
    }
};
DataService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(shop_entity_1.ShopsEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(gmRates_1.RateDetailsEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(cusomerCompanyDetails_1.CustomerCompanyEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(specialAddress_entity_1.SpecialAddressEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(booking_entity_1.BookingEntity)),
    __param(5, (0, typeorm_1.InjectRepository)(bookingStatus_entity_1.BookingStatusEntity)),
    __param(6, (0, typeorm_1.InjectRepository)(customerAddressRates_entity_1.CustomerAddressRatesEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        utils_service_1.UtilsService,
        config_1.ConfigService])
], DataService);
exports.DataService = DataService;
//# sourceMappingURL=data.service.js.map