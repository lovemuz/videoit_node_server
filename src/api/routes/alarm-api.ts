import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import { Alarm, AlarmSetting, User } from '../../models/index'
import sequelize from '../../models/sequelize'
import Sequelize from 'sequelize'
import passport from 'passport'
import axios from 'axios'
import { body, query } from 'express-validator';
import { validatorErrorChecker } from '../middlewares/validator'
import { authJWT, authAdminJWT } from '../middlewares/authJWT'
import { logger } from '../../config/winston'
import AlarmService from '../../services/alarmService'
import { errorLogGet, errorLogPost } from '../middlewares/logCombine'

const router = express.Router()
const Op = Sequelize.Op

export default (app: any, apiLimiter: any, subdomain: any) => {
    if (process.env.DEV_MODE === 'production')
        app.use(subdomain('api', router))
    app.use('/alarm', router)
    app.use('/alarm', apiLimiter)
    router.use((req: Request, res: Response, next: NextFunction) => {
        /* res.locals 값추가 가능*/
        next()
    })
    router.get('/getMyAlarm', [
        query('pageNum').exists().toInt(),
        query('pageSize').exists().toInt(),
        validatorErrorChecker
    ], authJWT, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const alarmList: Alarm[] = await AlarmService.getMyAlarm(req)
            return res.status(200).json({ alarmList })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.get('/getMyAlarmSetting', [
        validatorErrorChecker
    ], authJWT, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const alarmSetting: AlarmSetting | null = await AlarmService.getMyAlarmSetting(req)
            return res.status(200).json({ alarmSetting })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.put('/readAlarm', [
        body('AlarmId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            await AlarmService.readAlarm(req, transaction)
            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    //backgroundApnsOn

    router.post('/backgroundApnsOn', [
        body('backgroundApnsOn').exists().toBoolean(),
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const UserId: number = req.id
            const backgroundApnsOn: boolean = req.body.backgroundApnsOn
            await User.update({
                backgroundApnsOn: false,
            }, {
                where: {
                    id: UserId
                }, transaction
            })
            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


    router.post('/updateAlarmSetting', [
        body('news').exists().toBoolean(),
        body('comment').exists().toBoolean(),
        body('gift').exists().toBoolean(),
        body('call').exists().toBoolean(),
        body('chat').exists().toBoolean(),
        body('follow').exists().toBoolean(),
        body('post').exists().toBoolean(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            await AlarmService.updateAlarmSetting(req, transaction)
            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


    router.post('/updateAlarmSetting/v2', [
        body('news').exists().toBoolean(),
        body('comment').exists().toBoolean(),
        body('gift').exists().toBoolean(),
        body('call').exists().toBoolean(),
        body('chat').exists().toBoolean(),
        body('follow').exists().toBoolean(),
        body('post').exists().toBoolean(),
        body('creatorPush').optional().toBoolean(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            await AlarmService.updateAlarmSettingV2(req, transaction)
            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.post('/updateAlarmSettingSoundOn', [
        body('soundOn').exists().toBoolean(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const UserId: number = req.id
            const soundOn: Boolean = req.body.soundOn
            await User.update({
                soundOn
            }, {
                where: {
                    id: UserId
                }, transaction
            })
            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


    router.post('/updateAlarmSetting/v3', [
        body('news').exists().toBoolean(),
        body('comment').exists().toBoolean(),
        body('gift').exists().toBoolean(),
        body('call').exists().toBoolean(),
        body('chat').exists().toBoolean(),
        body('follow').exists().toBoolean(),
        body('post').exists().toBoolean(),
        body('creatorPush').exists().toBoolean(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            await AlarmService.updateAlarmSettingV3(req, transaction)
            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

}
