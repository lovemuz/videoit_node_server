import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import { Account, Alarm, AlarmSetting, Authority, Ban, Benifit, Block, CallHistory, Card, Chat, Comment, CommentChild, CreatorAuth, Exchange, FanStep, Follow, Item, Mcn, Money, Point, Post, Score, SocialLogin, Subscribe, User, Wish } from '../../models/index'
import sequelize from '../../models/sequelize'
import Sequelize from 'sequelize'
import passport from 'passport'
import axios from 'axios'
import { body, query } from 'express-validator';
import { validatorErrorChecker } from '../middlewares/validator'
import { authJWT, authAdminJWT, authCsJWT } from '../middlewares/authJWT'
import { logger } from '../../config/winston'
import ExchangeService from '../../services/exchageService'
import { errorLogGet, errorLogPost } from '../middlewares/logCombine'
import PointService from '../../services/pointService'
import UserService from '../../services/userService'
import { ALARM_TYPE } from '../../constant/alarm-constant'
import ChatService from '../../services/chatService'
import { FCMPushNotification } from '../middlewares/fcm-notification'
import { USER_ATTRIBUTE, USER_GENDER, USER_ROLE } from '../../constant/user-constant'
import RoomService from '../../services/roomSerivce'
import { CHAT_TYPE } from '../../constant/chat-constant'
import MoneyService from '../../services/MoneyService'
import { awsSimpleEmailService, mailgunSimpleEmailService } from '../middlewares/aws'
import SubscribeService from '../../services/subscribeService'
import AlarmService from '../../services/alarmService'
import { SUBSCRIBE_STATE } from '../../constant/subscribe-constant'
import { slackPostMessage } from '../middlewares/slack'
import { SLACK_CHANNEL } from '../../constant/slack-constant'
import { v4 } from 'uuid';
import { COUNTRY_LIST } from '../../constant/country-constant'

const router = express.Router()
const Op = Sequelize.Op

export default (app: any, apiLimiter: any, subdomain: any) => {
    if (process.env.DEV_MODE === 'production')
        app.use(subdomain('api', router))
    app.use('/cs', router)
    app.use('/cs', apiLimiter)
    router.use((req, res, next) => {
        /* res.locals 값추가 가능*/
        next()
    })

    router.get('/rankFromCreator', [
        query('pageNum').exists(),
        query('pageSize').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        try {
            //const exchageList = await ExchangeService.getExchageListByCS(req)
            const rankList: any = await UserService.csRankFromCreator(req)

            let totalPendingMoney = 0
            rankList?.forEach((item: any) => {
                //여자일때만
                if ((item?.gender === USER_GENDER.GIRL || item?.roles === USER_ROLE.COMPANY_USER)
                    && item?.exchangeShow === true
                ) {
                    const point = item?.Point?.amount * 0.01 * (100 - item?.CreatorAuth?.platformPointCharge)
                    const money = item?.Money?.amount * 0.01 * (100 - item?.CreatorAuth?.platformSubscribeCharge)
                    //금액이 5만 이상일때만
                    if (Number(point + money) >= 50000) {
                        totalPendingMoney += Number(point + money)
                    }

                }
            })
            return res.status(200).json({ status: 'true', rankList, totalPendingMoney })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.get('/exchageList', [
        query('pageNum').optional(),
        query('pageSize').optional(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        try {
            const exchageList = await ExchangeService.getExchageListByCS(req)
            let totalExchangeMoney = 0
            exchageList?.forEach((list: any, idx) => {
                totalExchangeMoney += Number(list[0])
            })
            return res.status(200).json({ exchageList, totalExchangeMoney })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/exchnageApprove', [
        body('ExchangeId').exists(),
        body('YouId').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {

            //Mcn 있다면 

            /*
            const mcnChk = await Mcn.findAll({
                where: {
                    mcnerId: req.body.YouId,
                }, transaction
            })
            if (mcnChk) {
                await Promise.all(mcnChk.map(async (list: any, idx: number) => {
                    const ExchangeId: number = req.body.ExchangeId
                    const exchange: any = await Exchange.findOne(
                        {
                            where: {
                                id: ExchangeId,
                            },
                            transaction
                        }
                    )
                    const mcnUser = await User.findOne({
                        where: {
                            id: list?.mcningId
                        }, transaction
                    })
                    const amount = exchange?.point * list?.creatorCharge * 0.01
                    await Money.increment({
                        amount: amount,
                    }, {
                        where: {
                            UserId: mcnUser?.id
                        }, transaction
                    })
                }))
            }*/


            await ExchangeService.approveExchange(req, transaction)
            //알림, 채팅 보내야함
            const user: any = await User.findOne({
                where: {
                    roles: USER_ROLE.CS_USER
                }
            })
            const you: any = await UserService.findUserOne(req.body.YouId)
            const room = await RoomService.getFromRoomAdmin(req, transaction)
            req.body.type = CHAT_TYPE.CHAT_NORMAL
            req.body.content = '환전 완료되었습니다.'
            req.body.RoomId = room.id
            await ChatService.createChat(req, transaction)
            if (you?.pushToken)
                FCMPushNotification(
                    user?.nick,
                    '환전 완료되었습니다.',
                    you?.pushToken,
                    user?.profile,
                    {
                        screen: 'Chat',
                        RoomId: room.id.toString(),
                    }
                )
            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.put('/exchangeCancle', [
        body('ExchangeId').exists(),
        body('YouId').exists(),
        body('rejectionReason').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {

            const rejectionReason = req.body.rejectionReason
            await ExchangeService.exchangeCancle(req, transaction)
            //알림, 채팅 보내야함
            const user: any = await User.findOne({
                where: {
                    roles: USER_ROLE.CS_USER
                }
            })
            const you: any = await UserService.findUserOne(req.body.YouId)
            const room = await RoomService.getFromRoomAdmin(req, transaction)
            req.body.type = CHAT_TYPE.CHAT_NORMAL
            req.body.content = `${rejectionReason} 의 이유로 환전 반려 되었습니다. 다시 시도해주세요.`
            req.body.RoomId = room.id
            await ChatService.createChat(req, transaction)
            if (you?.AlarmSetting.chat) {
                FCMPushNotification(
                    user?.nick,
                    `${rejectionReason} 의 이유로 환전 반려 되었습니다. 다시 시도해주세요.`,
                    you?.pushToken,
                    user?.profile,
                    {
                        screen: 'Chat',
                        RoomId: room.id.toString(),
                    }
                )
            }
            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.get('/getUserPoint', [
        query('link').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        try {
            const link = req.query.link
            const user: any = await User.findOne({
                where: {
                    link,
                }
            })
            const point = await PointService.getPoint(user.id)
            const money = await Money.findOne({
                where: {
                    UserId: user?.id
                }
            })  //await MoneyService.(user.id)
            return res.status(200).json({ status: 'true', point, money })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.put('/increaseUserPoint', [
        body('UserId').exists(),
        body('amount').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const UserId: number = req.body.UserId
            const amount: number = req.body.amount

            const beforePoint = await Point.findOne({
                where: {
                    UserId,
                }, transaction
            })
            await PointService.increaseUserPoint(UserId, amount, transaction)
            const afterPoint = await Point.findOne({
                where: {
                    UserId,
                }, transaction
            })
            const user = await User.findOne({
                where: {
                    id: UserId,
                }, transaction
            })
            slackPostMessage(SLACK_CHANNEL.MONEY,
                `Point Up
                ${amount}원 의 포인트가 증가 되었습니다.
                ${beforePoint?.amount} -> ${afterPoint?.amount}
                ${user?.nick}
                UserId:${user?.id}
                link:${user?.link}
                회원가입 날짜:${user?.createdAt?.toLocaleDateString()}
        
                `
            )
            await transaction.commit()
            // awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Point Up', `${UserId} ${amount}`)

            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.put('/decreaseUserPoint', [
        body('UserId').exists(),
        body('amount').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const UserId: number = req.body.UserId
            const amount: number = req.body.amount
            const point: any = await PointService.getPoint(UserId)
            if (point?.amount < amount) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }
            const beforePoint = await Point.findOne({
                where: {
                    UserId,
                }, transaction
            })
            await PointService.decreaseUserPoint(UserId, amount, transaction)
            const user = await User.findOne({
                where: {
                    id: UserId,
                }, transaction
            })
            const afterPoint = await Point.findOne({
                where: {
                    UserId,
                }, transaction
            })
            slackPostMessage(SLACK_CHANNEL.MONEY,
                `Point Down
                ${amount}원 의 포인트가 감소 되었습니다.
                ${beforePoint?.amount} -> ${afterPoint?.amount}
                ${user?.nick}
                UserId:${user?.id}
                link:${user?.link}
                회원가입 날짜:${user?.createdAt?.toLocaleDateString()}
        
                `
            )
            await transaction.commit()
            // awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Point Down', `${UserId} ${amount}`)

            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })



    router.put('/increaseUserMoney', [
        body('UserId').exists(),
        body('amount').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const UserId: number = req.body.UserId
            const amount: number = req.body.amount
            // await MoneyService.moneyIncrease
            // await PointService.increaseUserPoint(UserId, amount, transaction)
            const beforeMoney = await Money.findOne({
                where: {
                    UserId,
                }, transaction
            })
            await Money.increment({
                amount
            }, {
                where: {
                    UserId,
                }, transaction
            })
            const afterMoney = await Money.findOne({
                where: {
                    UserId,
                }, transaction
            })
            const user = await User.findOne({
                where: {
                    id: UserId,
                }, transaction
            })
            slackPostMessage(SLACK_CHANNEL.MONEY,
                `Money Up
                ${amount}원 의 구독이 증가 되었습니다.
                ${beforeMoney?.amount} -> ${afterMoney?.amount}
                ${user?.nick}
                UserId:${user?.id}
                link:${user?.link}
                회원가입 날짜:${user?.createdAt?.toLocaleDateString()}
        
                `
            )
            await transaction.commit()
            // awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Money Up', `${UserId} ${amount}`)
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.put('/decreaseUserMoney', [
        body('UserId').exists(),
        body('amount').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const UserId: number = req.body.UserId
            const amount: number = req.body.amount
            const money: any = await Money.findOne({
                where: {
                    UserId,
                }, transaction
            }) //await PointService.getPoint(UserId)
            if (money?.amount < amount) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }
            const beforeMoney = await Money.findOne({
                where: {
                    UserId,
                }, transaction
            })
            await Money.decrement({
                amount
            }, {
                where: {
                    UserId,
                }, transaction
            })
            const afterMoney = await Money.findOne({
                where: {
                    UserId,
                }, transaction
            })
            const user = await User.findOne({
                where: {
                    id: UserId,
                }, transaction
            })
            slackPostMessage(SLACK_CHANNEL.MONEY,
                `Money Down
                ${amount}원 의 구독이 감소 되었습니다.
                ${beforeMoney?.amount} -> ${afterMoney?.amount}
                ${user?.nick}
                UserId:${user?.id}
                link:${user?.link}
                회원가입 날짜:${user?.createdAt?.toLocaleDateString()}
        
                `
            )
            // await PointService.decreaseUserPoint(UserId, amount, transaction)
            await transaction.commit()
            // awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Money Down', `${UserId} ${amount}`)
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.get('/getMyChatCs', [
        // query('pageNum').exists(),
        // query('pageSize').exists(),
        query('link').exists(),
        query('RoomId').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        try {
            const RoomId: number = req.query.RoomId
            const link: string = req.query.link
            const userFromLink: any = await User.findOne({
                where: {
                    link,
                }
            })
            const UserId: number = userFromLink?.id
            const chatList: any = await ChatService.getMyChatCs(req)

            const room: any = await RoomService.getRoomOneCs(UserId, RoomId)
            let user = null
            let meIndex = 0;
            let youIndex = 0;
            // let lastReadChatId = -1;
            if (room?.UserRooms.length < 2) return
            if (room?.UserRooms[0]?.User.id === UserId) {
                // lastReadChatId = room?.UserRooms[0].meLastReadChatId
                user = room?.UserRooms[1]?.User
                meIndex = 0;
                youIndex = 1
            } else {
                // lastReadChatId = room?.UserRooms[1].meLastReadChatId
                user = room?.UserRooms[0]?.User
                meIndex = 1;
                youIndex = 0
            }
            return res.status(200).json({ chatList, user })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.get('/getMyRoomCs', [
        // query('pageNum').exists(),
        // query('pageSize').exists(),
        query('link').exists(),
        query('country').optional(),
        query('platform').optional(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const link: string = req.query.link
            const user: any = await User.findOne({
                where: {
                    link,
                }
            })
            const UserId: number = user?.id
            const roomList: any = await RoomService.getMyRoomCs(UserId)
            roomList?.forEach((ele: any) => {
                let youIndex = 0;
                //읽었는지도 봐야함
                let lastReadChatId = -1
                if (ele?.UserRooms.length < 2) return
                if (ele?.UserRooms[0]?.User?.id === UserId) {
                    lastReadChatId = ele?.UserRooms[0]?.meLastReadChatId
                    youIndex = 1;
                } else {
                    lastReadChatId = ele?.UserRooms[1]?.meLastReadChatId
                    youIndex = 0;
                }

                ele['dataValues'].profile = ele?.UserRooms[youIndex]?.User?.profile
                ele['dataValues'].nick = ele?.UserRooms[youIndex]?.User?.nick
                ele['dataValues'].read = lastReadChatId === ele?.Chats[0]?.id ? true : false
            })
            return res.status(200).json({ roomList })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    //withdrawUser
    router.post('/withdrawUser', [
        body('UserId').exists(),
        body('pwd').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const { UserId, pwd }: any = req.body;

            if (pwd !== '9hidnsakjdasibjd*&&^fss@@baksdbaskjdasjba$@!!!%sdjk') {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }
            //let tokens:any=v4().split('-')
            let link = '@'
            let dup = true
            let time = 0
            while (dup) {
                time++
                if (time >= 100) {
                    break
                }
                const tokens = v4().split('-')
                link = '@' + tokens[0] + tokens[1] + tokens[2]
                const linkUser = await User.findOne({
                    where: {
                        link,
                    }, transaction
                })
                if (!linkUser) {
                    dup = false
                }
            }
            if (time >= 100) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }
            await User.update({
                link
            }, {
                where: {
                    id: UserId,
                }, transaction
            })

            await User.destroy({
                where: {
                    id: UserId,
                },
                transaction
            })
            await Alarm.destroy({
                where: {
                    UserId,
                },
                transaction
            })
            await Comment.destroy({
                where: {
                    UserId,
                },
                transaction
            })
            await CommentChild.destroy({
                where: {
                    UserId,
                },
                transaction
            })
            await Post.destroy({
                where: {
                    UserId,
                },
                transaction
            })
            await Authority.destroy({
                where: {
                    UserId,
                },
                transaction
            })

            await CallHistory.destroy({
                where: {
                    UserId,
                },
                transaction
            })
            await FanStep.destroy({
                where: {
                    UserId,
                },
                transaction
            })
            await Benifit.destroy({
                where: {
                    UserId,
                },
                transaction
            })
            await Wish.destroy({
                where: {
                    UserId,
                },
                transaction
            })
            await Ban.destroy({
                where: {
                    bannerId: UserId,
                },
                transaction
            })
            await Follow.destroy({
                where: {
                    followerId: UserId,
                },
                transaction
            })
            await Subscribe.destroy({
                where: {
                    subscriberId: UserId,
                },
                transaction
            })
            await SocialLogin.destroy({
                where: {
                    UserId
                }, transaction
            })
            await Account.destroy({
                where: {
                    UserId
                }, transaction
            })
            await AlarmSetting.destroy({
                where: {
                    UserId
                }, transaction
            })
            await Point.destroy({
                where: {
                    UserId
                }, transaction
            })
            await Score.destroy({
                where: {
                    UserId
                }, transaction
            })
            await Item.destroy({
                where: {
                    UserId
                }, transaction
            })
            await Card.destroy({
                where: {
                    UserId
                }, transaction
            })
            await CreatorAuth.destroy({
                where: {
                    UserId
                }, transaction
            })
            await Money.destroy({
                where: {
                    UserId
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

    //createSubscribe
    router.post('/createSubscribe', [
        body('userLink').exists(),
        body('creatorLink').exists(),
        body('step').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const { userLink, creatorLink, step }: any = req.body;

            const creator: any = await User.findOne({
                where: {
                    link: creatorLink
                }, transaction
            })
            const user: any = await User.findOne({
                where: {
                    link: userLink
                }, transaction
            })
            const fanStep: any = await FanStep.findOne({
                where: {
                    UserId: creator?.id,
                    step: step,
                }, transaction
            })
            const subscribe: any = await Subscribe.findOne({
                include: [{ model: FanStep }],
                where: {
                    subscriberId: user.id,
                    subscribingId: creator.id,
                }, transaction
            })

            const dayBeFore7 = new Date().setDate(new Date().getDate() - 7);
            let moeny: number = 0
            let dayBeFore7updateCheck = false
            //7일 결제 아직 안됬다면 차액금액

            if (!subscribe) {
                moeny = Math.round(fanStep?.price * 1.1)
            } else {
                if (new Date(subscribe?.subscribedAt).getTime() >= dayBeFore7) {
                    //const beforeFanStep: any = await SubscribeService.getFanStepByIdParams(subscribeCheck.FanStepId, transaction)
                    moeny = Math.round(Math.max(Number(fanStep?.price * 1.1) - Number(subscribe?.lastPrice * 1.1), 0))
                    dayBeFore7updateCheck = true
                } else moeny = Math.round(fanStep?.price * 1.1)
            }

            //돈 충전 상대
            // if (alarmOn) {
            await Money.increment({
                amount: Number(moeny / 1.1),
            }, {
                where: {
                    UserId: creator.id
                }, transaction
            })
            // }
            //구독 만들거나 업데이트
            //await SubscribeService.createSubscribe(req, fanStep, transaction)

            if (subscribe) {
                // 구독있으면 업데이트
                if (dayBeFore7updateCheck) {
                    await Subscribe.update({
                        lastPrice: fanStep?.price,
                        FanStepId: fanStep.id,
                        step: fanStep.step,
                        subscribedAt: new Date(),
                        subscribeState: SUBSCRIBE_STATE.ING,
                    }, {
                        where: {
                            subscriberId: user.id,
                            subscribingId: creator.id,
                        }, transaction
                    })
                } else {
                    await Subscribe.update({
                        lastPrice: fanStep?.price,
                        FanStepId: fanStep.id,
                        step: fanStep.step,
                        subscribeCount: sequelize.literal('subscribeCount + 1'),
                        subscribedAt: new Date(),
                        subscribeState: SUBSCRIBE_STATE.ING,
                    }, {
                        where: {
                            subscriberId: user.id,
                            subscribingId: creator.id,
                        }, transaction
                    })
                }
            } else {
                // 아예 새로만들어야함
                await Subscribe.create({
                    lastPrice: fanStep?.price,
                    FanStepId: fanStep.id,
                    subscriberId: user.id,
                    subscribingId: creator.id,
                    step: fanStep.step,
                    subscribeCount: 1,
                    subscribedAt: new Date(),
                    subscribeState: SUBSCRIBE_STATE.ING,
                }, { transaction })

            }

            const follow = await Follow.findOne({
                where: {
                    followerId: user.id,
                    followingId: creator.id
                }, transaction
            })
            if (!follow) {
                await Follow.create({
                    followerId: user.id,
                    followingId: creator.id
                }, { transaction })
            }

            // if (alarmOn) {
            FCMPushNotification(
                user?.nick,
                `VIP ${fanStep?.step} 를 구독하였습니다.`,
                creator?.pushToken,
                user?.profile,
                {
                    screen: 'Profile',
                    YouId: user?.id.toString(),
                }
            )
            await AlarmService.createAlarm(ALARM_TYPE.ALARM_SUBSCRIBE, `${user.nick}님이 VIP ${fanStep?.step} 를 구독하였습니다.`, creator.id, user.id, undefined, undefined, undefined, transaction)
            if (creator.email) {
                awsSimpleEmailService('traveltofindlife@gmail.com', `${creator?.email}`, 'Payment Subscribe', `Congratulation! you earn ${Number(moeny)} Price By ${user?.nick} `)
            }
            slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
                `Payment Subscribe
                    Congratulation! you earn ${Number(moeny)} Price
                    ${user?.nick} -> ${creator?.nick}
                    UserId:${user?.id}
                    link:${user?.link}
                    회원가입 날짜:${user?.createdAt?.toLocaleDateString()}
        
                    `
            )
            // awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Payment Subscribe', `Congratulation! you earn ${Number(moeny)} Price `)
            // } else {
            // awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Payment Subscribe', `Congratulation! you earn ${Number(moeny)} Price `)
            // }
            const mcnChk = await Mcn.findAll({
                where: {
                    mcnerId: creator?.id,
                }, transaction
            })
            if (mcnChk) {
                await Promise.all(mcnChk.map(async (list: any, idx: number) => {
                    const mcnUser = await User.findOne({
                        where: {
                            id: list?.mcningId
                        }, transaction
                    })
                    const amount = Number(Math.round(Number(moeny / 1.1))) * list?.creatorCharge * 0.01
                    await Money.increment({
                        amount: amount,
                    }, {
                        where: {
                            UserId: mcnUser?.id
                        }, transaction
                    })
                    awsSimpleEmailService('traveltofindlife@gmail.com', `${mcnUser?.email}`, 'Payment Subscribe', `Congratulation! you earn ${amount} Point By ${creator?.nick}`)
                }))
            }




            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/withdrawPost', [
        body('PostId').exists(),
        body('pwd').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const { PostId, pwd }: any = req.body;

            if (pwd !== '9hidnsakjdasibjd*&&^fss@@baksdbaskjdasjba$@!!!%sdjk') {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }
            await Post.destroy({
                where: {
                    id: PostId,
                },
                transaction
            })
            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/changeNextMonthExchange', [
        body('YouId').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const { YouId }: any = req.body;
            const beforeUser = await User.findOne({
                where: {
                    id: YouId
                }, transaction
            })

            await User.update({
                nextMonthExchange: !beforeUser?.nextMonthExchange
            }, {
                where: {
                    id: YouId
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

    router.post('/removeAllChat', [
        body('ChatId').exists(),
        body('pwd').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const { ChatId, pwd }: any = req.body;

            if (pwd !== '34fsdf!@WSAfsfjasidjiaj214tgsd#%^#^4!!!%sdjk') {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }

            const chat: any = await Chat.findOne({
                where: {
                    id: ChatId
                }, transaction
            })

            await Chat.destroy({
                where: {
                    UserId: chat.UserId,
                    createdAt: chat?.createdAt,
                    content: chat?.content
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

    router.post('/withdrawCancelPost', [
        body('PostId').exists(),
        body('pwd').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const { PostId, pwd }: any = req.body;

            if (pwd !== '9hidnsakjdasibjd*&&^fss@@baksdbaskjdasjba$@!!!%sdjk') {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }
            await Post.update({
                removeState: false,
            }, {
                where: {
                    id: PostId
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


    router.post('/withdrawCancelUser', [
        body('UserId').exists(),
        body('pwd').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const { UserId, pwd }: any = req.body;

            if (pwd !== '9hidnsakjdasibjd*&&^fss@@baksdbaskjdasjba$@!!!%sdjk') {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }
            await User.update({
                withdrawState: false,
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

    router.get('/getUserOutList', [
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        try {
            //CreatorAuth
            const userOutList: any = await User.findAll({
                subQuery: false,
                include: [{
                    model: Point
                }, {
                    model: Money
                }, {
                    model: CreatorAuth
                }],
                where: {
                    withdrawState: true,
                },
                order: [
                    ['withdrawApplyedAt', 'DESC']],
                // offset: Number(pageNum * pageSize),
                // limit: Number(pageSize),
                attributes: {
                    exclude: USER_ATTRIBUTE.EXCLUDE,
                },
                group: ['id'],
            })

            return res.status(200).json({ status: 'true', userOutList })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.get('/getPostRemoveList', [
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        try {
            //CreatorAuth
            const postRemoveList: any = await Post.findAll({
                subQuery: false,
                include: [{ model: User }],
                where: {
                    removeState: true,
                },
                order: [
                    ['removeApplyedAt', 'DESC']],
            })

            return res.status(200).json({ status: 'true', postRemoveList })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })



    router.get('/getMcnList', [
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        try {
            //CreatorAuth
            const mcnList: any = await UserService.getCsMcnList(req)
            return res.status(200).json({ status: 'true', mcnList })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.get('/getUserSubscribe', [
        query('link').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        try {
            //getMySubscriberCs
            const link: string = req.query.link
            const subscriber = await SubscribeService.getMySubscriberCs(link)
            return res.status(200).json({ status: 'true', subscriber })
        } catch (err) {
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.get('/getUserCharge', [
        query('link').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        try {
            //CreatorAuth
            const creatorAuth = await UserService.getUserCharge(req)
            return res.status(200).json({ status: 'true', creatorAuth })
        } catch (err) {
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


    router.post('/hundredRestore', [
        body('creatorLink').exists(),
        body('userLink').exists(),
        body('step').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const { creatorLink, userLink, step }: any = req.body;

            const creator: any = await User.findOne({
                where: {
                    link: creatorLink,
                }, transaction
            })
            const user: any = await User.findOne({
                where: {
                    link: userLink
                }, transaction
            })
            const fanStep: any = await FanStep.findOne({
                where: {
                    UserId: creator?.id,
                    step,
                }, transaction
            })



            const dayBeFore29 = new Date().setDate(new Date().getDate() - 29);
            //1달 이내 알림 있으면 안되도록 
            const alarm = await Alarm.findOne({
                where: {
                    type: ALARM_TYPE.ALARM_SUBSCRIBE,
                    // content: `${user.nick}님이 VIP ${fanStep?.step} 를 구독하였습니다.`,
                    YouId: user.id,
                    UserId: creator.id,
                    createdAt: {
                        [Op.gte]: dayBeFore29,
                    },
                }, transaction
            })
            if (alarm) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }

            //돈계산
            let moeny: number = fanStep?.price * 1.1

            //83 다시 빼야함
            const mcn = await Mcn.findOne({
                where: {
                    mcnerId: creator?.id,
                    hundred100: true,
                }, transaction
            })

            if (mcn) {
                const mcnUser = await User.findOne({
                    where: {
                        id: mcn?.mcningId
                    }, transaction
                })
                await Money.decrement({
                    amount: Number(Math.round(moeny / 1.1)) * 83 * 0.01,
                }, {
                    where: {
                        UserId: mcnUser?.id
                    }, transaction
                })
            }

            //돈 충전 상대
            await Money.increment({
                amount: Number(moeny / 1.1),
            }, {
                where: {
                    UserId: creator.id
                }, transaction
            })


            FCMPushNotification(
                user?.nick,
                `VIP ${fanStep?.step} 를 구독하였습니다.`,
                creator?.pushToken,
                user?.profile,
                {
                    screen: 'Profile',
                    YouId: user?.id.toString(),
                }
            )
            await AlarmService.createAlarm(ALARM_TYPE.ALARM_SUBSCRIBE, `${user.nick}님이 VIP ${fanStep?.step} 를 구독하였습니다.`, creator.id, user.id, undefined, undefined, undefined)
            if (creator.email) {
                awsSimpleEmailService('traveltofindlife@gmail.com', `${creator?.email}`, 'Payment Subscribe', `Congratulation! you earn ${Number(moeny)} Price By ${user?.nick} `)
            }
            awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Payment Subscribe Recuver', `Congratulation! you earn ${Number(moeny)} Price `)

            slackPostMessage(SLACK_CHANNEL.MONEY,
                `Payment Subscribe Recover
                Congratulation! you earn ${Number(moeny)} Price
                ${user?.nick} -> ${creator?.nick}
                UserId:${user?.id}
                link:${user?.link}
                회원가입 날짜:${user?.createdAt?.toLocaleDateString()}
                `
            )
            awsSimpleEmailService('traveltofindlife@gmail.com', `kakabal@naver.com`, 'Payment Subscribe Recuver', `Congratulation! you earn ${Number(moeny)} Price `)
            const mcnChk = await Mcn.findAll({
                where: {
                    mcnerId: creator?.id,
                }, transaction
            })
            if (mcnChk) {
                await Promise.all(mcnChk.map(async (list: any, idx: number) => {
                    const mcnUser = await User.findOne({
                        where: {
                            id: list?.mcningId
                        }, transaction
                    })
                    const amount = Number(Math.round(Number(moeny / 1.1))) * list?.creatorCharge * 0.01
                    await Money.increment({
                        amount: amount,
                    }, {
                        where: {
                            UserId: mcnUser?.id
                        }, transaction
                    })
                    awsSimpleEmailService('traveltofindlife@gmail.com', `${mcnUser?.email}`, 'Payment Subscribe', `Congratulation! you earn ${amount} Point By ${creator?.nick}`)
                }))
            }

            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


    router.post('/addMcnCreator', [
        body('mcnerLink').exists(),
        body('mcningLink').exists(),
        body('creatorCharge').exists(),
        body('code').optional(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const { mcnerLink, mcningLink, creatorCharge, code }: any = req.body;





            const user: any = await User.findOne({
                where: {
                    link: mcnerLink
                }, transaction
            })
            const mcn: any = await User.findOne({
                where: {
                    link: mcningLink
                }, transaction
            })


            const jh01 = code === 'jh01' && mcn?.code === 'jh01' ? true : false
            const ch01 = code === 'ch01' && mcn?.code === 'ch01' ? true : false
            const mb12 = code === 'mb12' && mcn?.code === 'mb12' ? true : false
            const nj12 = code === 'nj12' && mcn?.code === 'nj12' ? true : false
            const bb12 = code === 'bb12' && mcn?.code === 'bb12' ? true : false
            const xpnt = code === 'xpnt' && mcn?.code === 'xpnt' ? true : false
            const ddbg = code === 'ddbg' && mcn?.code === 'ddbg' ? true : false
            const ad2025 = code === 'ad2025' && mcn?.code === 'ad2025' ? true : false
            const fing = code === 'fing' && mcn?.code === 'fing' ? true : false
            const abc1 = code === 'abc1' && mcn?.code === 'abc1' ? true : false
            const tain = code === 'tain' && mcn?.code === 'tain' ? true : false
            const dh83 = code === 'dh83' && mcn?.code === 'dh83' ? true : false
            const jw = code === 'jw' && mcn?.code === 'jw' ? true : false

            const makeit = code === 'makeit' && mcn?.code === 'makeit' ? true : false
            const npick = code === 'npick' && mcn?.code === 'npick' ? true : false
            const jay = code === 'jay' && mcn?.code === 'jay' ? true : false
            const family = code === 'family' && mcn?.code === 'family' ? true : false
            const wm = code === 'wm' && mcn?.code === 'wm' ? true : false
            const ten = code === 'ten' && mcn?.code === 'ten' ? true : false


            if (ch01) {
                await Mcn.create({
                    creatorCharge: 50,
                    mcnerId: user?.id,
                    mcningId: mcn?.id,
                    code,
                }, { transaction })

                await CreatorAuth.update({
                    callPrice: 2000,
                }, {
                    where: {
                        UserId: user.id,
                    }, transaction
                })
                await Mcn.create({
                    creatorCharge: 15,
                    mcnerId: user?.id,
                    mcningId: 4613,
                    code,
                }, { transaction })
                slackPostMessage(SLACK_CHANNEL.MONEY,
                    `에이전시 크리에이터추가 
                  ${user?.nick} -> ${mcn?.nick} 추가 완료
                  ${user?.link} -> ${mcn?.link}
                  ${user?.id} -> ${mcn?.id}
                  수수료 50
          
                  `
                )
            } else if (jw) {
                await Mcn.create({
                    creatorCharge: 73,
                    mcnerId: user?.id,
                    mcningId: mcn?.id,
                    code,
                }, { transaction })
                await Mcn.create({
                    creatorCharge: 10,
                    mcnerId: user?.id,
                    mcningId: 4613,
                    code,
                }, { transaction })
                slackPostMessage(SLACK_CHANNEL.MONEY,
                    `에이전시 크리에이터추가 
                  ${user?.nick} -> ${mcn?.nick} 추가 완료
                  ${user?.link} -> ${mcn?.link}
                  ${user?.id} -> ${mcn?.id}
                  수수료 73
          
                  `
                )
            } else if (dh83) {
                await Mcn.create({
                    creatorCharge: 73,
                    mcnerId: user?.id,
                    mcningId: mcn?.id,
                    code,
                }, { transaction })
                await Mcn.create({
                    creatorCharge: 10,
                    mcnerId: user?.id,
                    mcningId: 4613,
                    code,
                }, { transaction })
                slackPostMessage(SLACK_CHANNEL.MONEY,
                    `에이전시 크리에이터추가 
                  ${user?.nick} -> ${mcn?.nick} 추가 완료
                  ${user?.link} -> ${mcn?.link}
                  ${user?.id} -> ${mcn?.id}
                  수수료 73
          
                  `
                )
            } else if (npick) {
                await Mcn.create({
                    creatorCharge: 83,
                    mcnerId: user?.id,
                    mcningId: mcn?.id,
                    code,
                }, { transaction })
                slackPostMessage(SLACK_CHANNEL.MONEY,
                    `에이전시 크리에이터추가 
                  ${user?.nick} -> ${mcn?.nick} 추가 완료
                  ${user?.link} -> ${mcn?.link}
                  ${user?.id} -> ${mcn?.id}
                  수수료 83
          
                  `
                )
            } else if (jay) {
                await Mcn.create({
                    creatorCharge: 73,
                    mcnerId: user?.id,
                    mcningId: mcn?.id,
                    code,
                }, { transaction })
                await Mcn.create({
                    creatorCharge: 83,
                    mcnerId: user?.id,
                    mcningId: 34390,//엔픽
                    code,
                }, { transaction })
                slackPostMessage(SLACK_CHANNEL.MONEY,
                    `에이전시 크리에이터추가 
                  ${user?.nick} -> ${mcn?.nick} 추가 완료
                  ${user?.link} -> ${mcn?.link}
                  ${user?.id} -> ${mcn?.id}
                  수수료 73
          
                  `
                )
            } else if (family) {
                await Mcn.create({
                    creatorCharge: 50,
                    mcnerId: user?.id,
                    mcningId: mcn?.id,
                    code,
                }, { transaction })
                await Mcn.create({
                    creatorCharge: 83,
                    mcnerId: user?.id,
                    mcningId: 34390,//엔픽
                    code,
                }, { transaction })

                slackPostMessage(SLACK_CHANNEL.MONEY,
                    `에이전시 크리에이터추가 
                  ${user?.nick} -> ${mcn?.nick} 추가 완료
                  ${user?.link} -> ${mcn?.link}
                  ${user?.id} -> ${mcn?.id}
                  수수료 50
          
                  `
                )
            } else if (wm) {
                await Mcn.create({
                    creatorCharge: 70,
                    mcnerId: user?.id,
                    mcningId: mcn?.id,
                    code,
                }, { transaction })
                await Mcn.create({
                    creatorCharge: 83,
                    mcnerId: user?.id,
                    mcningId: 34390,//엔픽
                    code,
                }, { transaction })
                slackPostMessage(SLACK_CHANNEL.MONEY,
                    `에이전시 크리에이터추가 
                  ${user?.nick} -> ${mcn?.nick} 추가 완료
                  ${user?.link} -> ${mcn?.link}
                  ${user?.id} -> ${mcn?.id}
                  수수료 70
          
                  `
                )
            } else if (ten) {
                await Mcn.create({
                    creatorCharge: 70,
                    mcnerId: user?.id,
                    mcningId: mcn?.id,
                    code,
                }, { transaction })
                await Mcn.create({
                    creatorCharge: 83,
                    mcnerId: user?.id,
                    mcningId: 34390,//엔픽
                    code,
                }, { transaction })
                slackPostMessage(SLACK_CHANNEL.MONEY,
                    `에이전시 크리에이터추가 
                  ${user?.nick} -> ${mcn?.nick} 추가 완료
                  ${user?.link} -> ${mcn?.link}
                  ${user?.id} -> ${mcn?.id}
                  수수료 70
          
                  `
                )
            } else if (jh01) {
                await Mcn.create({
                    creatorCharge: 53,
                    mcnerId: user?.id,
                    mcningId: mcn?.id,
                    code,
                }, { transaction })
                slackPostMessage(SLACK_CHANNEL.MONEY,
                    `에이전시 크리에이터추가 
                  ${user?.nick} -> ${mcn?.nick} 추가 완료
                  ${user?.link} -> ${mcn?.link}
                  ${user?.id} -> ${mcn?.id}
                  수수료 53
          
                  `
                )
            } else if (makeit) {
                await Mcn.create({
                    creatorCharge: 73,
                    mcnerId: user?.id,
                    mcningId: mcn?.id,
                    code,
                }, { transaction })
                await Mcn.create({
                    creatorCharge: 83,
                    mcnerId: user?.id,
                    mcningId: 34390,//엔픽
                    code,
                }, { transaction })

                slackPostMessage(SLACK_CHANNEL.MONEY,
                    `에이전시 크리에이터추가 
                  ${user?.nick} -> ${mcn?.nick} 추가 완료
                  ${user?.link} -> ${mcn?.link}
                  ${user?.id} -> ${mcn?.id}
                  수수료 10
          
                  `
                )
            } else if (ad2025) {
                await Mcn.create({
                    creatorCharge: 43,
                    mcnerId: user?.id,
                    mcningId: mcn?.id,
                    code,
                }, { transaction })
                await Mcn.create({
                    creatorCharge: 10,
                    mcnerId: user?.id,
                    mcningId: 4613,
                    code,
                }, { transaction })
                slackPostMessage(SLACK_CHANNEL.MONEY,
                    `에이전시 크리에이터추가 
                  ${user?.nick} -> ${mcn?.nick} 추가 완료
                  ${user?.link} -> ${mcn?.link}
                  ${user?.id} -> ${mcn?.id}
                  수수료 43
          
                  `
                )
            } else if (fing) {
                await Mcn.create({
                    creatorCharge: 30,
                    mcnerId: user?.id,
                    mcningId: mcn?.id,
                    code,
                }, { transaction })
                await Mcn.create({
                    creatorCharge: 23,
                    mcnerId: user?.id,
                    mcningId: 73885,
                    code,
                }, { transaction })
                await Mcn.create({
                    creatorCharge: 10,
                    mcnerId: user?.id,
                    mcningId: 4613,
                    code,
                }, { transaction })
                slackPostMessage(SLACK_CHANNEL.MONEY,
                    `에이전시 크리에이터추가 
                  ${user?.nick} -> ${mcn?.nick} 추가 완료
                  ${user?.link} -> ${mcn?.link}
                  ${user?.id} -> ${mcn?.id}
                  수수료 30
          
                  `
                )
            } else if (ddbg) {
                await Mcn.create({
                    creatorCharge: 73,
                    mcnerId: user?.id,
                    mcningId: mcn?.id,
                    code,
                }, { transaction })
                await Mcn.create({
                    creatorCharge: 10,
                    mcnerId: user?.id,
                    mcningId: 4613,
                    code,
                }, { transaction })
            } else if (xpnt) {
                await Mcn.create({
                    creatorCharge: 27,
                    mcnerId: user?.id,
                    mcningId: mcn?.id,
                    code,
                }, { transaction })
                await Mcn.create({
                    creatorCharge: 7,
                    mcnerId: user?.id,
                    mcningId: 4613,
                    code,
                }, { transaction })
                slackPostMessage(SLACK_CHANNEL.MONEY,
                    `에이전시 크리에이터추가 
                  ${user?.nick} -> ${mcn?.nick} 추가 완료
                  ${user?.link} -> ${mcn?.link}
                  ${user?.id} -> ${mcn?.id}
                  수수료 73
          
                  `
                )
            } else if (tain) {
                await Mcn.create({
                    creatorCharge: 20,
                    mcnerId: user?.id,
                    mcningId: mcn?.id,
                    code,
                }, { transaction })
                slackPostMessage(SLACK_CHANNEL.MONEY,
                    `에이전시 크리에이터추가 
                  ${user?.nick} -> ${mcn?.nick} 추가 완료
                  ${user?.link} -> ${mcn?.link}
                  ${user?.id} -> ${mcn?.id}
                  수수료 20
          
                  `
                )
            } else if (abc1) {
                await Mcn.create({
                    creatorCharge: 40,
                    mcnerId: user?.id,
                    mcningId: mcn?.id,
                    code,
                }, { transaction })
                slackPostMessage(SLACK_CHANNEL.MONEY,
                    `에이전시 크리에이터추가 
                  ${user?.nick} -> ${mcn?.nick} 추가 완료
                  ${user?.link} -> ${mcn?.link}
                  ${user?.id} -> ${mcn?.id}
                  수수료 40
          
                  `
                )
            } else if (bb12) {
                await Mcn.create({
                    creatorCharge: 40,
                    mcnerId: user?.id,
                    mcningId: mcn?.id,
                    code,
                }, { transaction })
                slackPostMessage(SLACK_CHANNEL.MONEY,
                    `에이전시 크리에이터추가 
                  ${user?.nick} -> ${mcn?.nick} 추가 완료
                  ${user?.link} -> ${mcn?.link}
                  ${user?.id} -> ${mcn?.id}
                  수수료 40
          
                  `
                )
            } else if (mb12) {
                await Mcn.create({
                    creatorCharge: 18,
                    mcnerId: user?.id,
                    mcningId: mcn?.id,
                    code,
                }, { transaction })

                await CreatorAuth.update({
                    callPrice: 2000,
                }, {
                    where: {
                        UserId: user.id,
                    }, transaction
                })
                await Mcn.create({
                    creatorCharge: 28,
                    mcnerId: user?.id,
                    mcningId: 4613,
                    code,
                }, { transaction })
                slackPostMessage(SLACK_CHANNEL.MONEY,
                    `에이전시 크리에이터추가 
                  ${user?.nick} -> ${mcn?.nick} 추가 완료
                  ${user?.link} -> ${mcn?.link}
                  ${user?.id} -> ${mcn?.id}
                  수수료 18
          
                  `
                )
            } else if (nj12) {
                await Mcn.create({
                    creatorCharge: 40,
                    mcnerId: user?.id,
                    mcningId: mcn?.id,
                    code,
                }, { transaction })
                slackPostMessage(SLACK_CHANNEL.MONEY,
                    `에이전시 크리에이터추가 
                  ${user?.nick} -> ${mcn?.nick} 추가 완료
                  ${user?.link} -> ${mcn?.link}
                  ${user?.id} -> ${mcn?.id}
                  수수료 40
          
                  `
                )
            }
            else {
                await Mcn.create({
                    mcnerId: user.id,
                    mcningId: mcn.id,
                    creatorCharge
                }, { transaction })
                slackPostMessage(SLACK_CHANNEL.MONEY,
                    `에이전시 크리에이터추가 
                ${user?.nick} -> ${mcn?.nick} 추가 완료
                ${user?.link} -> ${mcn?.link}
                ${user?.id} -> ${mcn?.id}
                수수료 ${creatorCharge}
        
                `
                )
            }

            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/updateMcnCreator', [
        body('mcnerLink').exists(),
        body('mcningLink').exists(),
        body('creatorCharge').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const { mcnerLink, mcningLink, creatorCharge }: any = req.body;

            const mcner: any = await User.findOne({
                where: {
                    link: mcnerLink
                }, transaction
            })
            const mcning: any = await User.findOne({
                where: {
                    link: mcningLink
                }, transaction
            })
            await Mcn.update({
                creatorCharge
            }, {
                where: {
                    mcnerId: mcner.id,
                    mcningId: mcning.id,
                }, transaction
            })

            //
            slackPostMessage(SLACK_CHANNEL.MONEY,
                `에이전시 크리에이터 수수료 변경
                ${mcner?.nick} -> ${mcning?.nick} 변경 완료
                ${mcner?.link} -> ${mcning?.link}
                ${mcner?.id} -> ${mcning?.id}
                수수료 ${creatorCharge}
        
                `
            )

            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/creatorPush', [
        body('UserId').exists(),
        body('title').exists(),
        body('content').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        //const transaction = await sequelize.transaction()
        try {
            const UserId: number = req.body.UserId
            const title: string = req.body.title
            const content: string = req.body.content
            const crea = await User.findOne({
                where: {
                    id: UserId
                }
            })
            const boy = await User.findAll({
                include: [{ model: AlarmSetting, as: 'AlarmSetting' }],
                where: {
                    '$AlarmSetting.creatorPush$': true,
                    pushToken: {
                        [Op.not]: null
                    },
                    gender: USER_GENDER.BOY
                }
            })
            function chunk(data: any = [], size = 1) {
                const arr = [];

                for (let i = 0; i < data.length; i += size) {
                    arr.push(data.slice(i, i + size));
                }

                return arr;
            }
            const newResult = chunk(boy, 500)

            newResult?.map((item: any, idx: number) => {
                setTimeout(() => {
                    item?.forEach((list: any) => {
                        FCMPushNotification(title, content, list?.pushToken, crea?.profile,
                            {
                                screen: 'Profile',
                                YouId: crea?.id.toString(),
                            })
                    })
                }, idx * 2000)
            })

            return res.status(200).json({ status: 'true' })
        } catch (err) {
            //await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.put('/changePostAdult', [
        body('PostId').exists(),
        body('adult').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const PostId: number = req.body.PostId
            const adult: number = req.body.adult
            await Post.update({
                adult: !adult
            }, {
                where: {
                    id: PostId
                }
            })
            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.put('/changeChatAdult', [
        body('ChatId').exists(),
        body('adult').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const ChatId: number = req.body.ChatId
            const adult: number = req.body.adult
            await Chat.update({
                adult: !adult
            }, {
                where: {
                    id: ChatId
                }
            })
            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/banUser', [
        body('UserId').exists(),
        body('banReason').optional(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const UserId: number = req.body?.UserId
            const banReason: string = req.body?.banReason
            const user = await User.findOne({
                where: {
                    id: UserId,
                }, transaction
            })
            let image = Number(user?.gender) === Number(USER_GENDER.BOY) ? 'https://d5w3s87s233gw.cloudfront.net/boy.png' : 'https://d5w3s87s233gw.cloudfront.net/girl.png'
            await Block.create({
                phone: user?.phone,
                email: user?.email
            }, { transaction })

            //subscribe 다 지우기
            await Subscribe.destroy({
                where: {
                    subscriberId: UserId
                }, transaction
            })
            await User.update({
                roles: USER_ROLE.BAN_USER,
                profile: image,
                background: image,
            }, {
                where: {
                    id: UserId
                }, transaction
            })

            slackPostMessage(SLACK_CHANNEL.BLOCK,
                `유저 밴
        ${user?.nick}
        이메일:${user?.email}
        핸드폰 번호:${user?.phone}
        UserId:${user?.id}
        link:${user?.link}
        회원가입 날짜:${user?.createdAt?.toLocaleDateString()}

        밴 사유 : ${banReason}

        `
            )

            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })



    router.post('/changeAdultPage', [
        body('YouId').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const YouId: number = req.body.YouId

            const user = await User.findOne({
                where: {
                    id: YouId,
                }, transaction
            })
            if (user?.adultPage) {
                await User.update({
                    adultPage: false,
                }, {
                    where: {
                        id: YouId,
                    }, transaction
                })

            } else {
                await User.update({
                    adultPage: true,
                }, {
                    where: {
                        id: YouId,
                    }, transaction
                })
            }
            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/changeProfile', [
        body('UserId').exists(),
        body('gender').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const UserId: number = req.body.UserId
            const gender: number = req.body.gender;
            let profile = Number(gender) === Number(USER_GENDER.BOY) ? 'https://d5w3s87s233gw.cloudfront.net/boy.png' : 'https://d5w3s87s233gw.cloudfront.net/girl.png'
            await User.update({
                profile
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


    router.post('/changeGender', [
        body('UserId').exists(),
        body('gender').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const UserId: number = req.body.UserId
            const gender: number = req.body.gender;
            if (gender === USER_GENDER.BOY || gender === USER_GENDER.GIRL) {
                await User.update({
                    gender
                }, {
                    where: {
                        id: UserId
                    }, transaction
                })
            }
            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/changeBackground', [
        body('UserId').exists(),
        body('gender').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const UserId: number = req.body.UserId
            const gender: number = req.body.gender;
            let background = Number(gender) === Number(USER_GENDER.BOY) ? 'https://d5w3s87s233gw.cloudfront.net/boy.png' : 'https://d5w3s87s233gw.cloudfront.net/girl.png'
            await User.update({
                background
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

    router.put('/changeExchangeShow', [
        body('UserId').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const { UserId } = req.body
            const user = await User.findOne({
                where: {
                    id: UserId,
                }, transaction
            })
            await User.update({
                exchangeShow: !user?.exchangeShow
            }, {
                where: {
                    id: UserId,
                }, transaction
            })
            slackPostMessage(SLACK_CHANNEL.MONEY,
                `정산 보임 여부 변경
                ${user?.exchangeShow ? '보임' : '안보임'} -> ${user?.exchangeShow ? '안보임' : '보임'}
                ${user?.nick}
                UserId:${user?.id}
                link:${user?.link}
                회원가입 날짜:${user?.createdAt?.toLocaleDateString()}
        
                `
            )
            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.put('/changeCharge', [
        body('UserId').exists(),
        body('platformPointCharge').exists(),
        body('platformSubscribeCharge').exists(),
        validatorErrorChecker
    ], authCsJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            //CreatorAuth
            const { UserId, platformPointCharge, platformSubscribeCharge } = req.body
            await UserService.changeCharge(req, transaction)
            //await ExchangeService.cancleExchange(req, transaction)
            const user = await User.findOne({
                where: {
                    id: UserId,
                }, transaction
            })
            slackPostMessage(SLACK_CHANNEL.MONEY,
                `수수료 변경
                포인트-${platformPointCharge} 구독-${platformSubscribeCharge}
                ${user?.nick}
                UserId:${user?.id}
                link:${user?.link}
                회원가입 날짜:${user?.createdAt?.toLocaleDateString()}
        
                `
            )
            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
}
