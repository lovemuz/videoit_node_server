import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import { Exchange, SocialLogin, User } from '../../models/index'
import sequelize from '../../models/sequelize'
import Sequelize from 'sequelize'
import passport from 'passport'
import axios from 'axios'
import { body, query } from 'express-validator';
import { validatorErrorChecker } from '../middlewares/validator'
import { authJWT, authAdminJWT } from '../middlewares/authJWT'
import { logger } from '../../config/winston'
import PaymentService from '../../services/paymentService'
import { errorLogGet } from '../middlewares/logCombine'
import ExcelJS from 'exceljs'
import ExchangeService from '../../services/exchageService'


const router = express.Router()
const Op = Sequelize.Op

export default (app: any, apiLimiter: any, subdomain: any) => {
    if (process.env.DEV_MODE === 'production')
        app.use(subdomain('api', router))
    app.use('/admin', router)
    app.use('/admin', apiLimiter)
    router.use((req, res, next) => {
        /* res.locals 값추가 가능*/
        next()
    })
    router.get('/paymentList', [
        query('pageNum').exists(),
        query('pageSize').exists(),
        validatorErrorChecker
    ], authAdminJWT, async (req: any, res: any, next: any) => {
        try {
            const payment = await PaymentService.getPaymentList(req)
            return res.status(200).json({ status: 'true', payment })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.get('/countAllUser', [
        validatorErrorChecker
    ], authAdminJWT, async (req: any, res: any, next: any) => {
        try {
            const user = await User.count({})

            const google = await SocialLogin.count({
                where: {
                    sns: 'google'
                }
            })
            const apple = await SocialLogin.count({
                where: {
                    sns: 'apple'
                }
            })
            const local = Math.floor(user - google - apple)
            return res.status(200).json({ status: 'true', user, google, apple, local })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    //이번달 , 저번달 결제대금
    router.get('/countMoney', [
        validatorErrorChecker
    ], authAdminJWT, async (req: any, res: any, next: any) => {
        try {
            const { currentPayment, beforePayment }: any = await PaymentService.getPaymentSum(req)
            let currentPrice = 0, beforePrice = 0
            currentPayment?.forEach((item: any) => {
                currentPrice = Math.floor(currentPrice + item?.price)
            })
            beforePayment?.forEach((item: any) => {
                beforePrice = Math.floor(beforePrice + item?.price)
            })
            return res.status(200).json({ status: 'true', currentPrice, beforePrice })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.get('/paymentToExcel', [
        validatorErrorChecker
    ], authAdminJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const exchangeList = await ExchangeService.getExchageListByBeforeMonth(req)
            const user = new Map()
            //registrationNumber 같은걸로 sum
            exchangeList?.forEach((list: any, idx) => {
                const registrationNumber = list?.registrationNumber?.replace(/-/g, "").toString()
                if (!registrationNumber) return
                if (!user.get(registrationNumber)) {
                    user.set(registrationNumber, [Math.floor(list.money / 0.967), list])
                } else {
                    user.set(registrationNumber, [
                        Math.floor(Math.floor(list.money / 0.967) + user.get(registrationNumber)[0]), list])
                }
            })
            const rawData: any = [
                ['사업자 여부', '사업자등록번호', '상호명', '주민등록번호', '이름', '정산 금액']

            ]
            user.forEach((list: any, index: any) => {
                if (list[1].typeBusiness === 0) {//주번
                    rawData.push(['X', '', '', list[1].registrationNumber, list[1].registrationName, list[0]])
                } else {//사업자
                    rawData.push(['O', list[1].registrationNumber, list[1].registrationName, '', '', list[0]])
                }
            })
            return res.status(200).json({ status: 'true', rawData })
        } catch (err) {
            await transaction.rollback()
            //errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

}
