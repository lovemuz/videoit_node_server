import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import { FanStep, Rank, Subscribe, User } from '../../models/index'
import sequelize from '../../models/sequelize'
import Sequelize from 'sequelize'
import passport from 'passport'
import axios from 'axios'
import { body, query } from 'express-validator';
import { validatorErrorChecker } from '../middlewares/validator'
import { authJWT, authAdminJWT } from '../middlewares/authJWT'
import { logger } from '../../config/winston'
import RankService from '../../services/rankService'
import SubscribeService from '../../services/subscribeService'
import { errorLogGet, errorLogPost } from '../middlewares/logCombine'

const router = express.Router()
const Op = Sequelize.Op

export default (app: any, apiLimiter: any, subdomain: any) => {
    if (process.env.DEV_MODE === 'production')
        app.use(subdomain('api', router))
    app.use('/subscribe', router)
    app.use('/subscribe', apiLimiter)
    router.use((req, res, next) => {
        /* res.locals 값추가 가능*/
        next()
    })


    router.get('/getProfileFanStepNotLogin', [
        query('YouId').optional(),
        query('link').optional(),
        query('platform').optional(),
        validatorErrorChecker
    ], async (req: any, res: any, next: any) => {
        try {
            const fanStepList = await SubscribeService.getProfileFanStep(req)
            return res.status(200).json({ status: 'true', fanStepList })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


    router.get('/getProfileFanStep', [
        query('YouId').optional(),
        query('link').optional(),
        query('platform').optional(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const fanStepList = await SubscribeService.getProfileFanStep(req)
            return res.status(200).json({ status: 'true', fanStepList })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.get('/getMyFanStep', [
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const [fanStepList, possibleStep]: any = await SubscribeService.getMyFanStep(req)
            return res.status(200).json({ status: 'true', fanStepList, possibleStep })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.get('/getSubscribeStateNotLogin', [
        query('YouId').optional(),
        query('link').optional(),
        query('platform').optional(),
        validatorErrorChecker
    ], async (req: any, res: any, next: any) => {
        try {
            const subscribe = await SubscribeService.getSubscribeState(req)
            return res.status(200).json({ status: 'true', subscribe })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.get('/getSubscribeState', [
        query('YouId').optional(),
        query('link').optional(),
        query('platform').optional(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const subscribe = await SubscribeService.getSubscribeState(req)
            return res.status(200).json({ status: 'true', subscribe })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    //구독한사람 가져오기
    router.get('/getMySubscribing', [
        query('pageNum').exists(),
        query('pageSize').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const subscribing = await SubscribeService.getMySubscribing(req)
            return res.status(200).json({ status: 'true', subscribing })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.get('/getFanStepExistsStep', [
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const possibleStep = await SubscribeService.getFanStepExistsStep(req)
            return res.status(200).json({ status: 'true', possibleStep })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    //구독자 가져오기
    router.get('/getMySubscriber', [
        query('pageNum').exists(),
        query('pageSize').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const subscriber = await SubscribeService.getMySubscriber(req)
            return res.status(200).json({ status: 'true', subscriber })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    //구독취소 신청 넣기
    router.put('/cancelSubscribing', [
        body('YouId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const subscriber = await SubscribeService.cancelSubscribing(req, transaction)
            await transaction.commit()
            return res.status(200).json({ status: 'true', subscriber })
        } catch (err) {
            errorLogPost(req, err)
            await transaction.rollback()
            return res.status(400).json({ status: 'error' })
        }
    })

    router.put('/reSubscribing', [
        body('YouId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const subscriber = await SubscribeService.reSubscribing(req, transaction)
            await transaction.commit()
            return res.status(200).json({ status: 'true', subscriber })
        } catch (err) {
            errorLogPost(req, err)
            await transaction.rollback()
            return res.status(400).json({ status: 'error' })
        }
    })



    //updateFanStep
    router.post('/updateFanStep', [
        body('FanStepId').exists(),
        body('title').exists().isString(),
        body('step').exists().isInt(),
        //body('duration').exists().isInt(),
        body('price').exists().isInt(),
        body('benifits').optional(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {


            const user = await User.findOne({
                where: {
                    id: req.id
                }, transaction
            })
            if (user?.withdrawState) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }

            if ([49648, 41521, 41014, 41017, 41252, 1733, 4266, 22222, 8833, 15842, 1823, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 7661].includes(Number(req?.id))) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }


            const step: number = req.body.step
            const price: number = req.body.price

            let left = -1
            let right = 11

            const fanstep: FanStep[] = await FanStep.findAll({
                where: {
                    UserId: req.id
                }, transaction
            })

            fanstep.forEach((item: any) => {
                if (item.step < step) {
                    left = Math.max(left, item.step)
                } else if (item.step > step) {
                    right = Math.min(right, item.step)
                }
            })
            if (left !== -1) {
                const leftFanStep: FanStep | null = await FanStep.findOne({
                    where: {
                        step: left,
                        UserId: req.id,
                    }, transaction
                })
                if (Number(leftFanStep?.price) >= price) {
                    await transaction.commit()
                    return res.status(200).json({ status: 'price' })
                }
            }
            if (right !== 11) {
                const rightFanStep: FanStep | null = await FanStep.findOne({
                    where: {
                        step: right,
                        UserId: req.id,
                    }, transaction
                })
                if (price >= Number(rightFanStep?.price)) {
                    await transaction.commit()
                    return res.status(200).json({ status: 'price' })
                }
            }

            await SubscribeService.updateFanStep(req, transaction)
            await transaction.commit()
            const [fanStepList, possibleStep]: any = await SubscribeService.getMyFanStep(req)
            return res.status(200).json({ status: 'true', fanStepList, possibleStep })
        } catch (err) {
            errorLogPost(req, err)
            await transaction.rollback()
            return res.status(400).json({ status: 'error' })
        }
    })


    router.get('/getFanStep', [
        query('FanStepId').exists(),
        validatorErrorChecker
    ], async (req: any, res: any, next: any) => {
        try {
            const fanStep = await SubscribeService.getFanStepByIdQuery(req)
            return res.status(200).json({ status: 'true', fanStep })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.post('/createFanStep', [
        body('title').exists().isString(),
        body('step').exists().isInt(),
        //body('duration').exists().isInt(),
        body('price').exists().isInt(),
        body('benifits').optional(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {

            const user = await User.findOne({
                where: {
                    id: req.id
                }, transaction
            })
            if (user?.withdrawState) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }

            const step: number = req.body.step
            const price: number = req.body.price

            let left = -1
            let right = 11


            const fanstep: any = await FanStep.findAll({
                where: {
                    UserId: req.id
                }, transaction
            })

            fanstep.forEach((item: any) => {
                if (item.step < step) {
                    left = Math.max(left, item.step)
                } else if (item.step > step) {
                    right = Math.min(right, item.step)
                }
            })
            if (left !== -1) {
                const leftFanStep: any = await FanStep.findOne({
                    where: {
                        step: left,
                        UserId: req.id,
                    }, transaction
                })
                if (leftFanStep?.price >= price) {
                    await transaction.commit()
                    return res.status(200).json({ status: 'price' })
                }
            }
            if (right !== 11) {
                const rightFanStep: any = await FanStep.findOne({
                    where: {
                        step: right,
                        UserId: req.id,
                    }, transaction
                })
                if (price >= rightFanStep?.price) {
                    await transaction.commit()
                    return res.status(200).json({ status: 'price' })
                }
            }
            await SubscribeService.createFanStep(req, transaction)
            const [fanStepList, possibleStep]: any = await SubscribeService.getMyFanStepTransaction(req, transaction)
            await transaction.commit()
            return res.status(200).json({ status: 'true', fanStepList, possibleStep })
        } catch (err) {
            errorLogPost(req, err)
            await transaction.rollback()
            return res.status(400).json({ status: 'error' })
        }
    })
    router.delete('/removeFanStep', [
        body('FanStepId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const user = await User.findOne({
                where: {
                    id: req.id
                }, transaction
            })
            if (user?.withdrawState) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }

            if ([49648, 41521, 41014, 41017, 41252, 1733, 4266, 22222, 39949, 8833, 15842, 1823, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 7661].includes(Number(req?.id))) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }
            await SubscribeService.removeFanStep(req, transaction)
            await transaction.commit()
            const [fanStepList, possibleStep]: any = await SubscribeService.getMyFanStep(req)
            return res.status(200).json({ status: 'true', fanStepList, possibleStep })
        } catch (err) {
            errorLogPost(req, err)
            await transaction.rollback()
            return res.status(400).json({ status: 'error' })
        }
    })

}
