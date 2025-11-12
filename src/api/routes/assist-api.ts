import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import { AlarmSetting, Donation, Earn, Mcn, Money, Payment, Post, User } from '../../models/index'
import sequelize from '../../models/sequelize'
import Sequelize from 'sequelize'
import passport from 'passport'
import axios from 'axios'
import { body, query } from 'express-validator';
import { validatorErrorChecker } from '../middlewares/validator'
import { authJWT, authAdminJWT, authAssistJWT } from '../middlewares/authJWT'
import { logger } from '../../config/winston'
import PostService from '../../services/postService'
import WishService from '../../services/wishService'
import PointService from '../../services/pointService'
import { errorLogGet, errorLogPost } from '../middlewares/logCombine'
import UserService from '../../services/userService'
import { FCMPushNotification } from '../middlewares/fcm-notification'
import { ALARM_TYPE } from '../../constant/alarm-constant'
import AlarmService from '../../services/alarmService'
import { awsSimpleEmailService, getSeucreObjectImageS3, getSeucreObjectImageS3NoWaterMark, mailgunSimpleEmailService } from '../middlewares/aws'
import { COUNTRY_LIST } from '../../constant/country-constant'
import { slackPostMessage } from '../middlewares/slack'
import { SLACK_CHANNEL } from '../../constant/slack-constant'

const router = express.Router()
const Op = Sequelize.Op

export default (app: any, apiLimiter: any, subdomain: any) => {
    if (process.env.DEV_MODE === 'production')
        app.use(subdomain('api', router))
    app.use('/assist', router)
    app.use('/assist', apiLimiter)
    router.use((req, res, next) => {
        /* res.locals 값추가 가능*/
        next()
    })

    //downloadPost
    router.get('/downloadPost', [
        query('PostId').exists(),
        validatorErrorChecker
    ], authAssistJWT, async (req: any, res: any, next: any) => {
        try {
            const { PostId } = req.query
            const post: any = await Post.findOne({
                where: {
                    id: PostId,
                },
            })
            getSeucreObjectImageS3NoWaterMark(post?.url, res)

        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


    router.get('/postList', [
        query('pageNum').exists(),
        query('pageSize').exists(),
        query('country').optional(),
        query('platform').optional(),
        validatorErrorChecker
    ], authAssistJWT, async (req: any, res: any, next: any) => {
        try {
            const { country, platform } = req.query

            const postList: Post[] = await PostService.postListByAssist(req)
            return res.status(200).json({ postList })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })



}
