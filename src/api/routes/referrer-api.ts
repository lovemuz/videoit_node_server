import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import { AdsCount, Donation, Earn, Payment, Rank, User } from '../../models/index'
import sequelize from '../../models/sequelize'
import Sequelize from 'sequelize'
import passport from 'passport'
import axios from 'axios'
import { body, query } from 'express-validator';
import { validatorErrorChecker } from '../middlewares/validator'
import { authJWT, authAdminJWT, authReferrerJWT } from '../middlewares/authJWT'
import { logger } from '../../config/winston'
import RankService from '../../services/rankService'
import { errorLogGet } from '../middlewares/logCombine'
import { COUNTRY_LIST } from '../../constant/country-constant'
import { USER_ATTRIBUTE, USER_ROLE } from '../../constant/user-constant'

const router = express.Router()
const Op = Sequelize.Op

export default (app: any, apiLimiter: any, subdomain: any) => {
    if (process.env.DEV_MODE === 'production')
        app.use(subdomain('api', router))
    app.use('/referrer', router)
    app.use('/referrer', apiLimiter)
    router.use((req, res, next) => {
        /* res.locals 값추가 가능*/
        next()
    })


    router.get('/userLength', [
        validatorErrorChecker
    ], authReferrerJWT, async (req: any, res: any, next: any) => {
        try {
            const UserId: number = req?.id
            const user = await User.findOne({
                where: {
                    id: UserId
                }
            })
            if (!user?.adCode) {
                return res.status(200).json({ userLength: 0 })
            }
            const userLength: any = await User.count({
                where: {
                    adCode: user?.adCode,
                    roles: USER_ROLE.NORMAL_USER,
                },
            })
            return res.status(200).json({ userLength })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.get('/userList', [
        query('pageNum').exists(),
        query('pageSize').exists(),
        validatorErrorChecker
    ], authReferrerJWT, async (req: any, res: any, next: any) => {
        try {
            const UserId: number = req?.id
            const { pageNum, pageSize } = req.query
            const user = await User.findOne({
                where: {
                    id: UserId
                }
            })
            if (!user?.adCode) {
                return res.status(200).json({ userList: [] })
            }
            const userList: any = await User.findAll({
                where: {
                    adCode: user?.adCode,
                    roles: USER_ROLE.NORMAL_USER,
                },
                offset: Number(pageNum * pageSize),
                limit: Number(pageSize),
                order: [['createdAt', 'DESC']],
                attributes: {
                    exclude: USER_ATTRIBUTE.EXCLUDE_MCN_TEST123
                },
                include: [{ model: Payment }]
            })
            userList?.forEach((item: any) => {
                const payments = item?.Payments
                let amount = 0
                payments?.forEach((pay: any) => {
                    amount += pay?.price
                })
                item['dataValues'].amount = amount
            })

            return res.status(200).json({ userList })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.get('/paymentList', [
        query('year').exists(),
        query('month').exists(),
        validatorErrorChecker
    ], authReferrerJWT, async (req: any, res: any, next: any) => {
        try {
            const UserId: number = req?.id
            const { year, month } = req.query

            const earnList: any = await Earn.findAll({
                where: {
                    donationingId: UserId,
                    year,
                    month,
                },
                order: [['createdAt', 'DESC']],
            })
            let earnListSum = 0
            earnList?.forEach((item: any) => {
                earnListSum += item?.amount
            })
            return res.status(200).json({ earnList, earnListSum })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    //authReferrerJWT
    /*
    router.post('/addCount', [
        body('adCode').exists(),
        validatorErrorChecker
    ], async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const adCode = req.body.adCode
            const adsCount: any = await AdsCount.findOne({
                where: {
                    adCode,
                    year: new Date().getFullYear(),
                    month: new Date().getMonth() + 1,
                    day: new Date().getDate()
                }, transaction
            })
            if (adsCount) {
                await AdsCount.update({
                    count: adsCount.count + 1
                }, {
                    where: {
                        adCode,
                        year: new Date().getFullYear(),
                        month: new Date().getMonth() + 1,
                        day: new Date().getDate()
                    }, transaction
                })

            } else {
                await AdsCount.create({
                    count: 1,
                    adCode,
                    year: new Date().getFullYear(),
                    month: new Date().getMonth() + 1,
                    day: new Date().getDate()
                }, { transaction })
            }
            await transaction.commit()
            return res.status(200)
        } catch (err) {
            await transaction.rollback()
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
        */
}
