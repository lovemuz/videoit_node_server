import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import { Donation, Earn, Mcn, Money, User } from '../../models/index'
import sequelize from '../../models/sequelize'
import Sequelize from 'sequelize'
import passport from 'passport'
import axios from 'axios'
import { body, query } from 'express-validator';
import { validatorErrorChecker } from '../middlewares/validator'
import { authJWT, authAdminJWT } from '../middlewares/authJWT'
import { logger } from '../../config/winston'
import ItemService from '../../services/ItemService'
import PointService from '../../services/pointService'
import { errorLogGet, errorLogPost } from '../middlewares/logCombine'
import ChatService from '../../services/chatService'
import { CHAT_TYPE } from '../../constant/chat-constant'
import { ITEM_LIST } from '../../constant/item-constant'
import BanService from '../../services/banService'
import UserService from '../../services/userService'
import { FCMPushNotification } from '../middlewares/fcm-notification'
import AlarmService from '../../services/alarmService'
import { ALARM_TYPE } from '../../constant/alarm-constant'
import { awsSimpleEmailService, mailgunSimpleEmailService } from '../middlewares/aws'
import { slackPostMessage } from '../middlewares/slack'
import { SLACK_CHANNEL } from '../../constant/slack-constant'

const router = express.Router()
const Op = Sequelize.Op

export default (app: any, apiLimiter: any, subdomain: any) => {
    if (process.env.DEV_MODE === 'production')
        app.use(subdomain('api', router))
    app.use('/point', router)
    app.use('/point', apiLimiter)
    router.use((req, res, next) => {
        /* res.locals 값추가 가능*/
        next()
    })


    router.get('/getMyMoney', [
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const money = await PointService.getMyMoney(req)
            return res.status(200).json({ money })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.get('/getMyPoint', [
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const point: any = await PointService.getMyPoint(req)
            const ch01Chk = await Mcn.findOne({
                where: {
                    mcnerId: req?.id,
                    code: 'ch01'
                },
            })
            if (ch01Chk) {
                point.amount = Math.floor(point.amount * 0.3)
            }
            return res.status(200).json({ point })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.get('/getMyItem', [
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const item = await ItemService.getMyItem(req)
            return res.status(200).json({ item })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/reverseItem', [
        body('code').exists(),
        body('count').exists().isInt(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            if (req.body.count <= 0) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }
            const item = await ItemService.reverseItem(req, transaction)
            if (item) {
                await transaction.commit()
                return res.status(200).json({ status: 'true', item })
            } else {
                await transaction.rollback()
                return res.status(200).json({ status: 'false' })
            }
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/purchaseItem', [
        body('code').exists(),
        body('count').exists().isInt(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {

            const mcn = await Mcn.findOne({
                where: {
                    mcnerId: req.id,
                    mcningId: 22275
                }
            })

            const ch01Chk = await Mcn.findOne({
                where: {
                    mcnerId: req.id,
                    code: 'ch01'
                }
            })
            if (mcn || ch01Chk) {
                await transaction.commit()
                return res.status(200).json({ status: 'mcn' })
            }


            if (req.body.count <= 0) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }
            const point: any = await PointService.getMyPoint(req, transaction)
            const item = await ItemService.purchaseItem(req, point, transaction)
            if (item) {
                await transaction.commit()
                return res.status(200).json({ status: 'true', item })
            } else {
                await transaction.rollback()
                return res.status(200).json({ status: 'false' })
            }
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


    router.post('/giftItem', [
        body('code').exists(),
        body('count').exists().isInt(),
        body('YouId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {


            const mcn = await Mcn.findOne({
                where: {
                    mcnerId: req.id,
                }
            })
            if (mcn) {
                await transaction.commit()
                return res.status(200).json({ status: 'mcn' })
            }

            if (req.body.count <= 0) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }


            const point: any = await PointService.getMyPoint(req, transaction)
            const [item, amount]: any = await ItemService.giftItem(req, point, transaction)
            if (item) {
                //createChat 보내야함
                const YouId: number = req.body.YouId;
                const count: number = req.body.count;
                const code: number = req.body.code;
                const content = `${count}개를 선물하였습니다.`
                const banCheck = await BanService.checkBan(req, YouId, transaction);
                if (banCheck) {
                    await transaction.commit()
                    return res.status(200).json({ status: 'ban', message: 'ban' })
                }
                const chat = await ChatService.createChatFromParams(req, YouId, CHAT_TYPE.CHAT_GIFT, content, transaction, `${code}`)
                const user: any = await UserService.findUserOne(req.id)
                const you: any = await UserService.findUserOne(YouId)

                const donation = await Donation.findOne({
                    where: {
                        donationerId: user?.id,
                        donationingId: you?.id,
                    }, transaction
                })
                if (donation) {
                    await Donation.increment({
                        amount,
                    }, {
                        where: {
                            donationerId: user?.id,
                            donationingId: you?.id,
                        },
                        transaction
                    })
                } else {
                    await Donation.create({
                        amount,
                        donationerId: user?.id,
                        donationingId: you?.id,
                    }, { transaction })
                }

                await Earn.create({
                    year: new Date().getFullYear(),
                    month: new Date().getMonth() + 1,
                    amount,
                    donationerId: user?.id,
                    donationingId: you?.id,
                }, { transaction })


                if (you?.AlarmSetting.gift) {
                    FCMPushNotification(
                        user?.nick.toString(),
                        `${code} ${content}`,
                        you?.pushToken.toString(),
                        user?.profile.toString(),
                        {
                            screen: 'Chat',
                            RoomId: chat.RoomId.toString(),
                        }
                    )
                }
                await AlarmService.createAlarm(ALARM_TYPE.ALARM_GIFT, `${code} ${content}`, you.id, user.id, undefined, chat.RoomId, undefined, transaction)
                if (you.email) {
                    if (you?.email?.split('@')[1] !== 'privaterelay.appleid.com')
                        awsSimpleEmailService('traveltofindlife@gmail.com', `${you?.email}`, 'Item Gift!', `Congratulation! you earn ${amount} Point `)
                }
                slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
                    `Item Gift!
                    Congratulation! you earn ${amount} Price
                    ${user?.nick} -> ${you?.nick}
                    UserId:${user?.id}
                    link:${user?.link}
                    회원가입 날짜:${user?.createdAt?.toLocaleDateString()}

                    `
                )
                // awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Item Gift!', `Congratulation! you earn ${amount} Price , ${user?.nick} -> ${you?.nick}`)
                // awsSimpleEmailService('traveltofindlife@gmail.com', `kakabal@naver.com`, 'Item Gift!', `Congratulation! you earn ${amount} Price , ${user?.nick} -> ${you?.nick}`)

                const mcnChk = await Mcn.findAll({
                    where: {
                        mcnerId: YouId,
                    }, transaction
                })
                if (mcnChk) {
                    await Promise.all(mcnChk?.map(async (list: any, idx: number) => {
                        const mcnUser = await User.findOne({
                            where: {
                                id: list?.mcningId
                            }, transaction
                        })
                        const amountAfter = amount * list?.creatorCharge * 0.01
                        await Money.increment({
                            amount: amountAfter,
                        }, {
                            where: {
                                UserId: mcnUser?.id
                            }, transaction
                        })
                        if (mcnUser?.email?.split('@')[1] !== 'privaterelay.appleid.com')
                            awsSimpleEmailService('traveltofindlife@gmail.com', `${mcnUser?.email}`, 'Item Gift!', `Congratulation! you earn ${amountAfter} Point By ${you?.nick}`)
                    }))
                }

                await transaction.commit()
                return res.status(200).json({ status: 'true', item, chat })
            } else {
                await transaction.rollback()
                return res.status(200).json({ status: 'false' })
            }
        } catch (err) {
            await transaction.rollback()
            logger.error('point-api')
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.post('/giftItemByCall', [
        body('code').exists(),
        body('count').exists().isInt(),
        body('YouId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {

            const mcn = await Mcn.findOne({
                where: {
                    mcnerId: req.id,
                }
            })
            if (mcn) {
                await transaction.commit()
                return res.status(200).json({ status: 'mcn' })
            }

            if (req.body.count <= 0) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }
            const point: any = await PointService.getMyPoint(req, transaction)
            const [item, amount]: any = await ItemService.giftItem(req, point, transaction)
            if (item) {
                //createChat 보내야함
                const YouId: number = req.body.YouId;
                const count: number = req.body.count;
                const code: number = req.body.code;
                const content = `${count}개를 선물하였습니다.`
                const banCheck = await BanService.checkBan(req, YouId, transaction);
                if (banCheck) {
                    await transaction.commit()
                    return res.status(200).json({ status: 'ban', message: 'ban' })
                }
                const chat = await ChatService.createChatFromParams(req, YouId, CHAT_TYPE.CHAT_GIFT, content, transaction, `${code}`)
                const user: any = await UserService.findUserOne(req.id)
                const you: any = await UserService.findUserOne(YouId)

                const donation = await Donation.findOne({
                    where: {
                        donationerId: user?.id,
                        donationingId: you?.id,
                    }, transaction
                })
                if (donation) {
                    await Donation.increment({
                        amount,
                    }, {
                        where: {
                            donationerId: user?.id,
                            donationingId: you?.id,
                        },
                        transaction
                    })
                } else {
                    await Donation.create({
                        amount,
                        donationerId: user?.id,
                        donationingId: you?.id,
                    }, { transaction })
                }
                await Earn.create({
                    year: new Date().getFullYear(),
                    month: new Date().getMonth() + 1,
                    amount,
                    donationerId: user?.id,
                    donationingId: you?.id,
                }, { transaction })

                const mcnChk = await Mcn.findAll({
                    where: {
                        mcnerId: YouId,
                    }, transaction
                })
                if (mcnChk) {
                    await Promise.all(mcnChk?.map(async (list: any, idx: number) => {
                        const mcnUser = await User.findOne({
                            where: {
                                id: list?.mcningId
                            }, transaction
                        })
                        const amountAfter = amount * list?.creatorCharge * 0.01
                        await Money.increment({
                            amount: amountAfter,
                        }, {
                            where: {
                                UserId: mcnUser?.id
                            }, transaction
                        })
                        if (mcnUser?.email?.split('@')[1] !== 'privaterelay.appleid.com')
                            awsSimpleEmailService('traveltofindlife@gmail.com', `${mcnUser?.email}`, 'Item Gift!', `Congratulation! you earn ${amountAfter} Point By ${you?.nick}`)
                    }))
                }
                await transaction.commit()
                return res.status(200).json({ status: 'true', item, chat })
            } else {
                await transaction.rollback()
                return res.status(200).json({ status: 'false' })
            }
        } catch (err) {
            await transaction.rollback()
            logger.error('point-api')
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.get('/getHistory', [
        query('pageNum').exists(),
        query('pageSize').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const historyList = await PointService.getHistory(req)

            const ch01Chk = await Mcn.findOne({
                where: {
                    mcnerId: req?.id,
                    code: 'ch01'
                },
            })

            if (ch01Chk) {
                historyList?.forEach((item: any) => {
                    item.amount = Math.floor(item.amount * 0.3)
                })
            }


            return res.status(200).json({ historyList })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })




}
