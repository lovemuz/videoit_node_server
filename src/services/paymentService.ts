import { User, Container, sequelize, Payment } from '../models/index'
import bcrypt from 'bcrypt'
import { logger } from '../config/winston'
//import { PAYMENT_STATE } from '../constant/payment-constant'
import Sequelize from 'sequelize'
const Op = Sequelize.Op

class PaymentService {
    constructor() { }
    static async getPaymentList(req: any) {
        try {
            const pageNum: number = req.query.pageNum
            const pageSize: number = req.query.pageSize
            const paymentList: Payment[] = await Payment.findAll({
                order: [['createdAt', 'DESC']],
                offset: Number(pageNum * pageSize),
                limit: Number(pageSize),
            })
            return paymentList
        } catch (err) {
            logger.error('getPaymentList')
            logger.error(err)
            return []
        }
    }


    static async getPaymentSum(req: any) {
        try {
            const date = new Date();
            const currentFirstDay = new Date(date.getFullYear(), date.getMonth(), 1);
            const currentLastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);


            const beforeDate = new Date();
            const beforeFirstDay = new Date(beforeDate.getFullYear(), beforeDate.getMonth() - 1, 1);
            const befotreLastDay = new Date(beforeDate.getFullYear(), beforeDate.getMonth(), 0);


            const currentPayment = await Payment.findAll({
                where: {
                    refund: 0,//환불 아닌것만
                    createdAt: {
                        [Op.gte]: currentFirstDay,
                    }
                },
            })

            const beforePayment = await Payment.findAll({
                where: {
                    refund: 0,//환불 아닌것만
                    createdAt: {
                        [Op.and]: [
                            {
                                [Op.gte]: beforeFirstDay
                            },
                            {
                                [Op.lte]: befotreLastDay
                            },
                        ],
                    }
                },
            })
            return { currentPayment, beforePayment }
        } catch (err) {
            logger.error('getPaymentSum')
            logger.error(err)
            return null
        }
    }


    static async createPaymentSubscribeWeb(req: any, amount: number, transaction: any) {
        try {
            const UserId: number = req.id
            await Payment.create({
                price: amount,
                platform: 'WEB',
                type: 2,
                refund: false,
                UserId,
            }, { transaction })
            return true
        } catch (err) {
            logger.error('createPaymentSubscribeWeb')
            logger.error(err)
            return null
        }
    }
    static async createPaymentPointWeb(req: any, amount: number, transaction: any) {
        try {
            const UserId: number = req.id
            await Payment.create({
                price: amount,
                platform: 'WEB',
                type: 1,
                refund: false,
                UserId,
            }, { transaction })
            return true
        } catch (err) {
            logger.error('createPaymentPointWeb')
            logger.error(err)
            return null
        }
    }
    static async createPaymentSubscribeWebPayPal(req: any, amount: number, imp_uid: string, merchant_uid: string, transaction: any) {
        try {
            const UserId: number = req.id
            await Payment.create({
                price: amount,
                platform: 'WEB',
                type: 2,
                refund: false,
                UserId,
                imp_uid,
                merchant_uid,
            }, { transaction })
            return true
        } catch (err) {
            logger.error('createPaymentSubscribeWeb')
            logger.error(err)
            return null
        }
    }
    static async createPaymentPointWebPayPal(req: any, amount: number, transaction: any) {
        try {
            const UserId: number = req.id
            const imp_uid: string = req.body.imp_uid
            const merchant_uid: string = req.body.merchant_uid
            await Payment.create({
                price: amount,
                platform: 'WEB',
                type: 1,
                refund: false,
                UserId,
                imp_uid,
                merchant_uid
            }, { transaction })
            return true
        } catch (err) {
            logger.error('createPaymentPointWeb')
            logger.error(err)
            return null
        }
    }
    static async createPaymentPointApp(req: any, amount: number, imp_uid: string, transaction: any) {
        try {
            const UserId: number = req.id
            await Payment.create({
                price: amount,
                platform: 'APP',
                type: 1,
                refund: false,
                UserId,
                imp_uid,
            }, { transaction })
            return true
        } catch (err) {
            logger.error('createPaymentPointApp')
            logger.error(err)
            return null
        }
    }
}
export default PaymentService
