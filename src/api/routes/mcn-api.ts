import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import { AlarmSetting, Block, CallHistory, Chat, CreatorAuth, Donation, Earn, Exchange, Mcn, Money, PartnerExchange, Point, PointHistory, Post, Subscribe, User } from '../../models/index'
import sequelize from '../../models/sequelize'
import Sequelize from 'sequelize'
import passport from 'passport'
import axios from 'axios'
import { body, query } from 'express-validator';
import { validatorErrorChecker } from '../middlewares/validator'
import { authJWT, authAdminJWT, authCsJWT, authCompanyJWT } from '../middlewares/authJWT'
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
import { awsSimpleEmailService, mailgunSimpleEmailService } from '../middlewares/aws'
import { slackPostMessage } from '../middlewares/slack'
import { SLACK_CHANNEL } from '../../constant/slack-constant'
import { POINT_HISTORY } from '../../constant/point-constant'

const router = express.Router()
const Op = Sequelize.Op

export default (app: any, apiLimiter: any, subdomain: any) => {
    if (process.env.DEV_MODE === 'production')
        app.use(subdomain('api', router))
    app.use('/mcn', router)
    app.use('/mcn', apiLimiter)
    router.use((req, res, next) => {
        /* res.locals 값추가 가능*/
        next()
    })

    //creatorSuggestion


    router.post('/creatorPush', [
        body('UserId').exists(),
        body('content').exists(),
        validatorErrorChecker
    ], authCompanyJWT, async (req: any, res: any, next: any) => {
        //const transaction = await sequelize.transaction()
        try {
            const MyId: number = req.id
            if (Number(MyId) !== 4613 && Number(MyId) !== 34390) return res.status(400).json({ status: 'false' })

            const UserId: number = req.body.UserId
            const crea: any = await User.findOne({
                where: {
                    id: UserId
                }
            })

            const title: string = crea?.nick
            const content: string = req.body.content

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
                }, idx * 1500)
            })
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            //await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/hundredOnOff', [
        body('mcnerId').exists(),
        body('mcningId').exists(),
        validatorErrorChecker
    ], authCompanyJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const MyId: number = req.id
            const mcnerId: number = req.body.mcnerId
            const mcningId: number = req.body.mcningId

            if (Number(MyId) !== 4613 && Number(MyId) !== 34390) return res.status(400).json({ status: 'false' })
            const mcn = await Mcn.findOne({
                where: {
                    mcnerId,
                    mcningId
                }, transaction
            })
            const hundred100 = mcn?.hundred100 ? false : true


            await Mcn.update({
                hundred100
            }, {
                where: {
                    mcnerId,
                    mcningId
                }, transaction
            })
            await transaction.commit();
            return res.status(200).json({ status: 'true', hundred100 })
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
        validatorErrorChecker
    ], authCompanyJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const MyId: number = req.id
            if (Number(MyId) !== 4613 && Number(MyId) !== 34390) return res.status(400).json({ status: 'false' })

            const { mcnerLink, mcningLink, creatorCharge }: any = req.body;

            if (Number(creatorCharge) < 0 || Number(creatorCharge) >= 100) return res.status(400).json({ status: 'false' })

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
            await Mcn.create({
                mcnerId: mcner.id,
                mcningId: mcning.id,
                creatorCharge
            }, { transaction })
            slackPostMessage(SLACK_CHANNEL.MONEY,
                `Mcn 크리에이터 영입
                ${mcner?.nick} -> ${mcning?.nick} 추가 완료
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


    router.get('/getCallData', [
        query('year').exists(),
        query('month').exists(),
        validatorErrorChecker
    ], authCompanyJWT, async (req: any, res: any, next: any) => {
        try {

            const { year, month } = req.query
            const UserId: number = req.id

            //console.log(year)
            //console.log(month)
            const beforeFirstDay = new Date(year, month - 1, 1);
            const befotreLastDay = new Date(year, month, 0);
            //console.log(new Date(beforeFirstDay).getMonth() + 1)
            //console.log(new Date(befotreLastDay).getMonth() + 1)

            const mcnFind = await Mcn.findAll({
                where: {
                    mcningId: UserId
                }
            })
            await Promise.all(mcnFind?.map(async (list: any, idx: number) => {

                const user = await User.findOne({
                    // include: [{ model: CreatorAuth }],
                    where: {
                        id: list?.mcnerId
                    }
                })
                const call: any = await CallHistory.findAll({
                    where: {
                        UserId: list?.mcnerId,
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
                    }
                })
                //1~말일까지 매일 데이터 구분 하는것 필요
                // console.log('donation')
                // console.log(donation)
                call.forEach((item: any) => {
                    // console.log(new Date(item?.createdAt).getDate())
                    const day = new Date(item?.createdAt).getDate()
                    if (list['dataValues'][day]) {
                        list['dataValues'][day] += item?.time
                        list[day] += item?.time
                    } else {
                        list['dataValues'][day] = item?.time
                        list[day] = item?.time
                    }
                })
                // console.log(list)
                list['dataValues'].User = user
                list.User = user
            }))

            return res.status(200).json({ creatorCallList: mcnFind })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.get('/earnMoney', [
        query('year').exists(),
        query('month').exists(),
        validatorErrorChecker
    ], authCompanyJWT, async (req: any, res: any, next: any) => {
        try {

            const { year, month } = req.query
            const UserId: number = req.id

            //console.log(year)
            //console.log(month)
            const beforeFirstDay = new Date(year, month - 1, 1);
            const befotreLastDay = new Date(year, month, 0);
            //console.log(new Date(beforeFirstDay).getMonth() + 1)
            //console.log(new Date(befotreLastDay).getMonth() + 1)

            const mcnFind = await Mcn.findAll({
                where: {
                    mcningId: UserId
                }
            })
            let earnMoney = 0;
            await Promise.all(mcnFind?.map(async (list: any, idx: number) => {

                const user = await User.findOne({
                    // include: [{ model: CreatorAuth }],
                    where: {
                        id: list?.mcnerId
                    }
                })
                const donation: any = await Earn.findAll({
                    where: {
                        donationingId: list?.mcnerId,
                        year,
                        month,
                    }
                })
                /*
                const donation2: any = await Donation.findAll({
                    where: {
                        donationingId: list?.mcnerId,
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
                */
                //1~말일까지 매일 데이터 구분 하는것 필요
                // console.log('donation')
                // console.log(donation)
                donation.forEach((item: any) => {
                    // console.log(new Date(item?.createdAt).getDate())
                    const day = new Date(item?.createdAt).getDate()
                    if (list['dataValues'][day]) {
                        list['dataValues'][day] += item?.amount
                        list[day] += item?.amount
                    } else {
                        list['dataValues'][day] = item?.amount
                        list[day] = item?.amount
                    }
                })
                // console.log(list)


                let count = 0
                donation.forEach((item: any) => {
                    count += item?.amount
                    earnMoney += item?.amount
                })
                list['dataValues'].User = user
                list.User = user
                list['dataValues'].earn = count
                list.earn = count
                // list.Donations = donation
                //console.log(`크리에티터 이름 - ${user?.nick}`)
                //console.log(`크리에이터 수익금액 - ${count}`)
            }))

            return res.status(200).json({ earnMoney, creatorList: mcnFind })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.get('/exchangeSelf', authCompanyJWT, async (req: any, res: any, next: any) => {
        try {
            const UserId: number = req.id
            const user = await User.findOne({
                where: {
                    id: UserId
                }
            })
            if (['ch01', 'nj12', 'jh01', 'bb12', 'ddbg', 'npick', 'sm01', 'dh83', 'jw'].includes(String(user?.code))) {
                return res.status(200).json({ exchangeSelf: true })
            } else {
                // return res.status(200).json({ exchangeSelf: true })
                return res.status(200).json({ exchangeSelf: false })
            }
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/exchangeCreatorAll', [
        validatorErrorChecker
    ], authCompanyJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {

            const CompanyId: number = req.id
            const mcn = await User.findOne({
                where: {
                    id: CompanyId
                }, transaction
            })

            const mcnList: any = await User.findAll({
                include: [{
                    model: User,
                    include: [{ model: Point }, { model: Money }, { model: CreatorAuth }],
                    as: 'Mcners',
                    attributes: {
                        exclude: USER_ATTRIBUTE.EXCLUDE_MCN_TEST123
                    },
                }, { model: Point }, { model: Money }, { model: CreatorAuth }],
                where: {
                    roles: USER_ROLE.COMPANY_USER,
                    id: CompanyId
                }, transaction
            })

            await Promise.all(mcnList[0].Mcners?.map(async (item: any) => {

                const UserId: number = item?.id
                // const UserId: number = item?.mcnerId
                const amount: number = Number(Math.floor(
                    Number(
                        Number(
                            item?.Point?.amount *
                            0.01 *
                            (100 -
                                item?.CreatorAuth
                                    ?.platformPointCharge)
                        ) +
                        Number(
                            item?.Money?.amount *
                            0.01 *
                            (100 -
                                item?.CreatorAuth
                                    ?.platformSubscribeCharge)
                        )
                    ) / 10000
                ) * 10000)

                if (amount >= 10000) {
                    const creatorAuth: any = await CreatorAuth.findOne({
                        where: {
                            UserId
                        }, transaction
                    })

                    const point: any = await Point.findOne({
                        where: {
                            UserId
                        }, transaction
                    })
                    const money: any = await Point.findOne({
                        where: {
                            UserId
                        }, transaction
                    })

                    const reAmount = Math.round(amount / (0.01 * (100 - creatorAuth?.platformPointCharge)))

                    if (Number(point?.amount + money?.amount) < reAmount) {
                        return
                        // await transaction.commit()
                        // return res.status(200).json({ status: 'false' })
                    }

                    const pointMinus = Math.round(Math.min(reAmount, point?.amount))
                    const moneyMinus = Math.round(Math.abs(reAmount - pointMinus))

                    await Point.decrement({
                        amount: pointMinus,
                    }, {
                        where: {
                            UserId
                        }, transaction
                    })
                    await Money.decrement({
                        amount: moneyMinus,
                    }, {
                        where: {
                            UserId
                        }, transaction
                    })

                    const user = await User.findOne({
                        where: {
                            id: UserId
                        }, transaction
                    })

                    await PointHistory.create({
                        UserId: user?.id,
                        type: POINT_HISTORY.TYPE_EXCHANGE,
                        plusOrMinus: POINT_HISTORY.MINUS,
                        amount: pointMinus,
                    }, { transaction })



                    if (['jh01'].includes(String(mcn?.code))) {
                        const realMoney = amount * (0.01 * (100 - creatorAuth?.platformPointCharge))
                        slackPostMessage(SLACK_CHANNEL.MONEY,
                            `에이전시 환전
                            에이전시 코드: ${mcn?.code}
                            "증가해야할 구독머니 : ${realMoney}"
                            총 차감 : ${reAmount}
                            포인트 차감 : ${pointMinus} 
                            구독차감 : ${moneyMinus}
                            ${user?.nick}
                            UserId:${user?.id}
                            link:${user?.link}
                            회원가입 날짜:${user?.createdAt?.toLocaleDateString()}
                    
                            `
                        )
                    } else {
                        slackPostMessage(SLACK_CHANNEL.MONEY,
                            `에이전시 환전
                            에이전시 코드: ${mcn?.code}
                            총 차감 : ${reAmount}
                            포인트 차감 : ${pointMinus} 
                            구독차감 : ${moneyMinus}
                            ${user?.nick}
                            UserId:${user?.id}
                            link:${user?.link}
                            회원가입 날짜:${user?.createdAt?.toLocaleDateString()}
                    
                            `
                        )
                    }


                    //환전 내역 만들어야함
                    await PartnerExchange.create({
                        UserId: user?.id,
                        code: mcn?.code,
                        nick: user?.nick,
                        profile: user?.profile,
                        link: user?.link,
                        phone: user?.phone,
                        exchangePrice: amount,
                        totalAmount: reAmount,
                        point: pointMinus,
                        money: moneyMinus,
                    }, { transaction })
                }
            }))

            const mcnListAfter: any = await User.findAll({
                include: [{
                    model: User,
                    include: [{ model: Point }, { model: Money }, { model: CreatorAuth }],
                    as: 'Mcners',
                    attributes: {
                        exclude: USER_ATTRIBUTE.EXCLUDE_MCN_TEST123
                    },
                }, { model: Point }, { model: Money }, { model: CreatorAuth }],
                where: {
                    roles: USER_ROLE.COMPANY_USER,
                    id: CompanyId
                }, transaction
            })
            let totalExchange = 0
            mcnListAfter[0].Mcners?.forEach((item: any) => {
                if (Number(Math.floor(
                    Number(
                        Number(
                            item?.Point?.amount *
                            0.01 *
                            (100 -
                                item?.CreatorAuth
                                    ?.platformPointCharge)
                        ) +
                        Number(
                            item?.Money?.amount *
                            0.01 *
                            (100 -
                                item?.CreatorAuth
                                    ?.platformSubscribeCharge)
                        )
                    ) / 10000
                ) * 10000) >= 3000) {
                    totalExchange += Number(Math.floor(
                        Number(
                            Number(
                                item?.Point?.amount *
                                0.01 *
                                (100 -
                                    item?.CreatorAuth
                                        ?.platformPointCharge)
                            ) +
                            Number(
                                item?.Money?.amount *
                                0.01 *
                                (100 -
                                    item?.CreatorAuth
                                        ?.platformSubscribeCharge)
                            )
                        ) / 10000
                    ) * 10000)
                }
            })
            await transaction.commit()
            return res.status(200).json({ status: 'true', mcnList: mcnListAfter, totalExchange })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/exchangeCreatorOne', [
        body('UserId').exists(),
        body('amount').exists(),
        validatorErrorChecker
    ], authCompanyJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {

            const CompanyId: number = req.id
            const mcn = await User.findOne({
                where: {
                    id: CompanyId
                }, transaction
            })
            const UserId: number = req.body.UserId
            const amount: number = Number(req.body.amount)

            //박사님과 우리한테도 환전됨을 알려야함

            const creatorAuth: any = await CreatorAuth.findOne({
                where: {
                    UserId
                }, transaction
            })

            const point: any = await Point.findOne({
                where: {
                    UserId
                }, transaction
            })
            const money: any = await Money.findOne({
                where: {
                    UserId
                }, transaction
            })

            const reAmount = Math.round(amount / (0.01 * (100 - creatorAuth?.platformPointCharge)))

            if (Number(point?.amount + money?.amount) < reAmount) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }

            const pointMinus = Math.round(Math.min(reAmount, point?.amount))
            const moneyMinus = Math.round(Math.abs(reAmount - pointMinus))

            await Point.decrement({
                amount: pointMinus,
            }, {
                where: {
                    UserId
                }, transaction
            })
            await Money.decrement({
                amount: moneyMinus,
            }, {
                where: {
                    UserId
                }, transaction
            })

            const user = await User.findOne({
                where: {
                    id: UserId
                }, transaction
            })


            await PointHistory.create({
                UserId: user?.id,
                type: POINT_HISTORY.TYPE_EXCHANGE,
                plusOrMinus: POINT_HISTORY.MINUS,
                amount: pointMinus,
            }, { transaction })

            if (['jh01'].includes(String(mcn?.code))) {
                const realMoney = amount * (0.01 * (100 - creatorAuth?.platformPointCharge))
                slackPostMessage(SLACK_CHANNEL.MONEY,
                    `에이전시 환전
                    에이전시 코드: ${mcn?.code}
                    "증가해야할 구독머니 : ${realMoney}"
                    총 차감 : ${reAmount}
                    포인트 차감 : ${pointMinus} 
                    구독차감 : ${moneyMinus}
                    ${user?.nick}
                    UserId:${user?.id}
                    link:${user?.link}
                    회원가입 날짜:${user?.createdAt?.toLocaleDateString()}
            
                    `
                )
            } else {
                slackPostMessage(SLACK_CHANNEL.MONEY,
                    `에이전시 환전
                    에이전시 코드: ${mcn?.code}
                    총 차감 : ${reAmount}
                    포인트 차감 : ${pointMinus} 
                    구독차감 : ${moneyMinus}
                    ${user?.nick}
                    UserId:${user?.id}
                    link:${user?.link}
                    회원가입 날짜:${user?.createdAt?.toLocaleDateString()}
            
                    `
                )
            }


            //환전 내역 만들어야함
            await PartnerExchange.create({
                UserId: user?.id,
                code: mcn?.code,
                nick: user?.nick,
                profile: user?.profile,
                link: user?.link,
                phone: user?.phone,
                exchangePrice: amount,
                totalAmount: reAmount,
                point: pointMinus,
                money: moneyMinus,
            }, { transaction })

            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    //myMcnExchangeList
    router.get('/myMcnExchangeList', [ //일단 지금은 천개만
        validatorErrorChecker
    ], authCompanyJWT, async (req: any, res: any, next: any) => {
        try {
            const CompanyId: number = req.id
            const mcn = await User.findOne({
                where: {
                    id: CompanyId
                }
            })
            const exchangeList = await PartnerExchange.findAll({
                where: {
                    code: mcn?.code
                },
                offset: 0,
                limit: 1000,
                order: [['createdAt', 'DESC']]
            })
            // const mcnList = await UserService.getMcnList(req)
            return res.status(200).json({ exchangeList })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.get('/myMcnList', [
        query('pageNum').exists(),
        query('pageSize').exists(),
        validatorErrorChecker
    ], authCompanyJWT, async (req: any, res: any, next: any) => {
        try {
            const mcnList = await UserService.getMcnList(req)

            let totalExchange = 0
            mcnList[0].Mcners?.forEach((item: any) => {
                if (Number(Math.floor(
                    Number(
                        Number(
                            item?.Point?.amount *
                            0.01 *
                            (100 -
                                item?.CreatorAuth
                                    ?.platformPointCharge)
                        ) +
                        Number(
                            item?.Money?.amount *
                            0.01 *
                            (100 -
                                item?.CreatorAuth
                                    ?.platformSubscribeCharge)
                        )
                    ) / 10000
                ) * 10000) >= 20000) {
                    totalExchange += Number(Math.floor(
                        Number(
                            Number(
                                item?.Point?.amount *
                                0.01 *
                                (100 -
                                    item?.CreatorAuth
                                        ?.platformPointCharge)
                            ) +
                            Number(
                                item?.Money?.amount *
                                0.01 *
                                (100 -
                                    item?.CreatorAuth
                                        ?.platformSubscribeCharge)
                            )
                        ) / 10000
                    ) * 10000)
                }
            })
            return res.status(200).json({ mcnList, totalExchange })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.get('/myMcnListByJoin', [
        query('pageNum').exists(),
        query('pageSize').exists(),
        validatorErrorChecker
    ], authCompanyJWT, async (req: any, res: any, next: any) => {
        try {
            const mcnList = await UserService.getMcnListByJoin(req)
            return res.status(200).json({ mcnList })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


}
