import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import { Exchange, Mcn, Point, User } from '../../models/index'
import sequelize from '../../models/sequelize'
import Sequelize from 'sequelize'
import passport from 'passport'
import axios from 'axios'
import { body, query } from 'express-validator';
import { validatorErrorChecker } from '../middlewares/validator'
import { authJWT, authAdminJWT } from '../middlewares/authJWT'
import { logger } from '../../config/winston'
import ExchangeService from '../../services/exchageService'
import PostService from '../../services/postService'
import PointService from '../../services/pointService'
import { Account } from 'aws-sdk'
import { errorLogGet, errorLogPost } from '../middlewares/logCombine'
import { EXCHANGE_TYPE } from '../../constant/exchange-constant'

const router = express.Router()
const Op = Sequelize.Op

export default (app: any, apiLimiter: any, subdomain: any) => {
    if (process.env.DEV_MODE === 'production')
        app.use(subdomain('api', router))
    app.use('/exchange', router)
    app.use('/exchange', apiLimiter)
    router.use((req, res, next) => {
        /* res.locals 값추가 가능*/
        next()
    })


    router.get('/getMyAccount', authJWT, async (req: any, res: any, next: any) => {
        try {
            const account = await ExchangeService.getMyAccount(req)
            return res.status(200).json({ status: 'true', account })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.post('/apply', [
        body('typeBusiness').exists(),
        body('type').exists(),
        body('point').exists(),
        body('accountName').optional(),
        body('accountNumber').exists(),
        body('accountCode').exists(),
        body('registrationName').optional(),
        body('registrationNumber').optional(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const type: number = req.body.type
            const point: number = req.body.point


            //만약 유저의 nextMonthExchange 가 true 라면 
            const user = await User.findOne({
                where: {
                    id: req.id
                }, transaction
            })
            if (user?.nextMonthExchange && new Date().getDate() >= 1 && new Date().getDate() <= 15) {
                //1~15일은 환전 안되도록
                await transaction.commit()
                return res.status(200).json({ status: 'nextMonthExchange' })
            }

            //회사 에이전시가 대금을 전부 받는다면 skip
            /*
            const mcn = await Mcn.findOne({
                where: {
                    mcnerId: req.id,
                    mcningId: 22275
                }
            })
            if (mcn) {
                await transaction.rollback()
                return res.status(200).json({ status: 'mcn' })
            }*/

            if (type === EXCHANGE_TYPE.EXCHANGE_POINT) {
                const myPoint: any = await PointService.getMyPoint(req, transaction)
                if (myPoint?.amount < point || point < 10000) {
                    await transaction.commit()
                    return res.status(200).json({ status: 'false', message: '포인트 부족' })
                }
                const exchange = await ExchangeService.applyExchange(req, transaction)
                await transaction.commit()
                return res.status(200).json({ status: 'true', exchange })
            } else if (type === EXCHANGE_TYPE.EXCHANGE_MONEY) {
                const myMoney: any = await PointService.getMyMoney(req, transaction)
                if (myMoney?.amount < point || point < 10000) {
                    await transaction.commit()
                    return res.status(200).json({ status: 'false', message: '포인트 부족' })
                }
                const exchange = await ExchangeService.applyExchange(req, transaction)
                await transaction.commit()
                return res.status(200).json({ status: 'true', exchange })
            } else {
                await transaction.commit()
                return res.status(200).json({ status: 'false', message: '타입 에러' })
            }
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    /*
    router.put('/cancle', [
        body('ExchangeId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            await ExchangeService.cancleExchange(req, transaction)
            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    */
    router.get('/exchageList', [
        query('pageNum').exists(),
        query('pageSize').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const exchageList = await ExchangeService.getExchageList(req)
            return res.status(200).json({ exchageList })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

}
