import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import { CallHistory, Donation, FanStep, Mcn, Payment, Room, Subscribe, User } from '../../models/index'
import sequelize from '../../models/sequelize'
import Sequelize from 'sequelize'
import passport from 'passport'
import axios from 'axios'
import { body, query } from 'express-validator';
import { validatorErrorChecker } from '../middlewares/validator'
import { authJWT, authAdminJWT } from '../middlewares/authJWT'
import { logger } from '../../config/winston'
import RoomService from '../../services/roomSerivce'
import { USER_ATTRIBUTE, USER_GENDER, USER_ROLE } from '../../constant/user-constant'
import UserService from '../../services/userService'
import { errorLogGet, errorLogPost } from '../middlewares/logCombine'
import { COUNTRY_LIST } from '../../constant/country-constant'

const router = express.Router()
const Op = Sequelize.Op

export default (app: any, apiLimiter: any, subdomain: any) => {
    if (process.env.DEV_MODE === 'production')
        app.use(subdomain('api', router))
    app.use('/room', router)
    app.use('/room', apiLimiter)
    router.use((req, res, next) => {
        /* res.locals 값추가 가능*/
        next()
    })


    router.get('/getRoomOne', [
        query('RoomId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const room: any = await RoomService.getRoomOne(req)
            let user = null
            const UserId: number = req.id
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
            if (room) {
                //상대방한테 자신의 이름을 주기위해 meIndex 사용
                room['dataValues'].profile = room?.UserRooms[meIndex]?.User?.profile
                room['dataValues'].nick = room?.UserRooms[meIndex]?.User?.nick
                room['dataValues'].profileYou = room?.UserRooms[youIndex]?.User?.profile
                room['dataValues'].nickYou = room?.UserRooms[youIndex]?.User?.nick
            }
            //room['dataValues'].read = lastReadChatId !== room?.Chats[0].id ? false : true
            let totalScoreLength = 1
            let totalScore = 0
            if (user?.Score) {
                totalScoreLength = user.Score?.score1 + user.Score?.score2 + user.Score?.score3 + user.Score?.score4 + user.Score?.score5
                totalScore = user.Score?.score1 * 1 + user.Score?.score2 * 2 + user.Score?.score3 * 3 + user.Score?.score4 * 4 + user.Score?.score5 * 5
            }
            if (user) {
                user['dataValues'].avgScore = totalScore / totalScoreLength
                //평균 영상시간 
                const you: any = await UserService.getCallAvgTimeOne(req, user.id)
                user['dataValues'].avgTime = you['dataValues']?.avgTime ? you['dataValues']?.avgTime : 0
            }
            //include: [[Sequelize.fn('avg', Sequelize.col('CallHistories.time')), 'avgTime']]
            return res.status(200).json({ room, user })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })



    router.get('/getRoomOne/v2', [
        query('RoomId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const room: any = await RoomService.getRoomOne(req)
            let user = null
            const UserId: number = req.id
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
            if (room) {
                //상대방한테 자신의 이름을 주기위해 meIndex 사용
                room['dataValues'].profile = room?.UserRooms[meIndex]?.User?.profile
                room['dataValues'].nick = room?.UserRooms[meIndex]?.User?.nick
                room['dataValues'].profileYou = room?.UserRooms[youIndex]?.User?.profile
                room['dataValues'].nickYou = room?.UserRooms[youIndex]?.User?.nick
            }
            //room['dataValues'].read = lastReadChatId !== room?.Chats[0].id ? false : true
            let totalScoreLength = 1
            let totalScore = 0
            if (user?.Score) {
                totalScoreLength = user.Score?.score1 + user.Score?.score2 + user.Score?.score3 + user.Score?.score4 + user.Score?.score5
                totalScore = user.Score?.score1 * 1 + user.Score?.score2 * 2 + user.Score?.score3 * 3 + user.Score?.score4 * 4 + user.Score?.score5 * 5
            }
            if (user) {
                user['dataValues'].avgScore = totalScore / totalScoreLength
                //평균 영상시간 
                const you: any = await UserService.getCallAvgTimeOne(req, user.id)
                user['dataValues'].avgTime = you['dataValues']?.avgTime ? you['dataValues']?.avgTime : 0
            }

            let subscribe: any
            const me = await UserService.findUserOne(UserId)



            /*
            const mcnHundredList: any = []
            const mcnMediaJDList: any = []
            const mcnHundredNotJDList: any = []

            const mcnChk100On = await Mcn.findAll({
                where: {
                    mcningId: {
                        [Op.in]: [4613, 34390]
                    },
                    hundred100: true,
                },
            })

            const mcnChkMediaJD = await Mcn.findAll({
                where: {
                    mcningId: 22275,
                },
            })
            mcnChk100On.forEach(element => {
                mcnHundredList.push(element?.mcnerId)
            });

            mcnChkMediaJD.forEach(element => {
                mcnMediaJDList.push(element?.mcnerId)
            });
            const mcnChk100OnNotMediaJD = await Mcn.findAll({
                where: {
                    mcnerId: {
                        [Op.notIn]: mcnMediaJDList
                    },
                    mcningId: {
                        [Op.in]: [4613, 34390]
                    },
                },
            })

            mcnChk100OnNotMediaJD.forEach(element => {
                mcnHundredNotJDList.push(element?.mcnerId)
            });
            */
            const dayBeFore30 = new Date("2024-05-01")
            if (me?.gender === USER_GENDER.GIRL) {
                /*if (mcnHundredNotJDList.includes(Number(req?.id))) {
                    subscribe = null;
                }

                else*/ if ([49648, 41521, 41014, 41017, 41252, 1733, 4266, 22222, 39949, 8833, 15842, 1823, 1430, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 1733, 7661, 212].includes(Number(req?.id)) /*|| mcnHundredList.includes(Number(req?.id))*/) {
                    subscribe = await Subscribe.findOne({
                        where: {
                            subscriberId: user?.id,
                            subscribingId: UserId,
                            subscribedAt: {
                                [Op.lte]: dayBeFore30,
                            }
                        }
                    })
                } else {
                    subscribe = await Subscribe.findOne({
                        where: {
                            subscriberId: user?.id,
                            subscribingId: UserId
                        }
                    })
                }

            } else {//boy
                /*if (mcnHundredNotJDList.includes(Number(req?.id))) {
                    subscribe = null;
                }
                else*/ if ([49648, 41521, 41014, 41017, 41252, 1733, 4266, 22222, 39949, 8833, 15842, 1823, 1430, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 1733, 7661, 212].includes(Number(req?.id)) /*|| mcnHundredList.includes(Number(req?.id))*/) {
                    subscribe = await Subscribe.findOne({
                        where: {
                            subscriberId: UserId,
                            subscribingId: user?.id,
                            subscribedAt: {
                                [Op.lte]: dayBeFore30,
                            }
                        },
                    })
                } else {
                    subscribe = await Subscribe.findOne({
                        where: {
                            subscriberId: UserId,
                            subscribingId: user?.id,
                        }
                    })
                }
            }
            //include: [[Sequelize.fn('avg', Sequelize.col('CallHistories.time')), 'avgTime']]
            return res.status(200).json({ room, user, subscribe })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


    router.put('/outRoom', [
        body('RoomId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            await RoomService.outRoom(req, transaction)
            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.put('/roomReadChat', [
        body('RoomId').exists(),
        body('ChatId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const userRoom: any = await RoomService.roomReadChat(req, transaction)
            await transaction.commit()
            return res.status(200).json({
                status: 'true',
                youLastReadChatId: userRoom.meLastReadChatId
            })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })



    router.get('/getMyRoom', [
        query('pageNum').exists(),
        query('pageSize').exists(),
        query('country').optional(),
        query('platform').optional(),
        query('APP_VERSION').optional(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {

            const { country, platform, APP_VERSION } = req.query
            if (country === COUNTRY_LIST.미국 &&
                String(process.env.APP_VERSION) >= String(APP_VERSION) &&
                /*platform === 'android' ||*/ platform === 'ios') {
                return res.status(200).json({ roomList: [] })
            }

            const UserId: number = req.id
            const roomList: any = await RoomService.getMyRoom(req)
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

    router.get('/getMyDonation3', [
        query('YouId').exists(),
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const { YouId } = req.query

            const rankListTmp: any = await User.findOne({
                subQuery: false,
                include: [{
                    model: User,
                    as: 'Donationers',
                    attributes: {
                        exclude: USER_ATTRIBUTE.EXCLUDE
                    },
                }],
                where: {
                    id: YouId,
                },
                offset: 0,
                limit: 3,
                order: [[sequelize.col("amount"), "DESC"]],
            })
            const rankList: any = []

            await Promise.all(rankListTmp?.Donationers?.map(async (list: any, idx: number) => {
                rankList.push({
                    User: list
                })
            }))

            return res.status(200).json({ rankList })
        } catch (err) {
            console.log(err)
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.get('/getMyDonation', [
        query('YouId').exists(),
        query('pageNum').exists(),
        query('pageSize').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const { pageNum, pageSize, YouId } = req.query
            const rankListTmp: any = await User.findOne({
                subQuery: false,
                include: [{
                    model: User,
                    as: 'Donationers',
                    attributes: {
                        exclude: USER_ATTRIBUTE.EXCLUDE
                    },
                }],
                where: {
                    id: YouId,
                },
                offset: Number(pageNum * pageSize),
                limit: Number(pageSize),
                order: [[sequelize.col("amount"), "DESC"]],
            })
            const rankList: any = []
            if (!rankListTmp?.Donationers) {
                return res.status(200).json({ rankList })
            }
            await Promise.all(rankListTmp?.Donationers?.map(async (list: any, idx: number) => {
                rankList.push({
                    User: list
                })
            }))
            return res.status(200).json({ rankList })
        } catch (err) {
            console.log(err)
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.get('/getMyRank', [
        query('pageNum').exists(),
        query('pageSize').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const { pageNum, pageSize } = req.query
            const UserId: number = req.id


            const rankList = await Donation.findAll({
                where: {
                    donationingId: UserId
                },
                order: [['amount', 'DESC']],
                offset: Number(pageNum * pageSize),
                limit: Number(pageSize),
            })

            /*
            const mcnHundredList: any = []
            const mcnMediaJDList: any = []
            const mcnHundredNotJDList: any = []


            const mcnChk100On = await Mcn.findAll({
                where: {
                    mcningId: {
                        [Op.in]: [4613, 34390]
                    },
                    hundred100: true,
                },
            })

            const mcnChkMediaJD = await Mcn.findAll({
                where: {
                    mcningId: 22275,
                },
            })
            mcnChk100On.forEach(element => {
                mcnHundredList.push(element?.mcnerId)
            });

            mcnChkMediaJD.forEach(element => {
                mcnMediaJDList.push(element?.mcnerId)
            });
            const mcnChk100OnNotMediaJD = await Mcn.findAll({
                where: {
                    mcnerId: {
                        [Op.notIn]: mcnMediaJDList
                    },
                    mcningId: {
                        [Op.in]: [4613, 34390]
                    },
                },
            })

            mcnChk100OnNotMediaJD.forEach(element => {
                mcnHundredNotJDList.push(element?.mcnerId)
            });

            */



            await Promise.all(rankList.map(async (list: any, idx: number) => {
                const user = await User.findOne({
                    where: {
                        id: list?.donationerId
                    }
                })
                const dayAfter2184 = new Date("2025-04-09")
                const dayBeFore30 = new Date("2024-05-01")
                let subscribe
                /*if (mcnHundredNotJDList.includes(Number(req?.id))) {
                    subscribe = null;
                }
                else*/ if ([2184, 41521, 4266, 41052, 15961, 45679, 88430, 69786].includes(Number(req?.id))) {
                    subscribe = await Subscribe.findOne({
                        where: {
                            subscriberId: list?.donationerId,
                            subscribingId: UserId,
                            subscribedAt: {
                                [Op.lte]: dayAfter2184,
                            }
                        }
                    })
                }
                else if ([49648, 41521, 41521, 41014, 41017, 41252, 1733, 4266, 22222, 39949, 8833, 15842, 1823, 1430, 2184, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 1733, 7661, 212].includes(Number(req?.id)) /*|| mcnHundredList.includes(Number(req?.id))*/) {
                    subscribe = await Subscribe.findOne({
                        where: {
                            subscriberId: list?.donationerId,
                            subscribingId: UserId,
                            subscribedAt: {
                                [Op.lte]: dayBeFore30,
                            }
                        }
                    })
                } else {
                    subscribe = await Subscribe.findOne({
                        where: {
                            subscriberId: list?.donationerId,
                            subscribingId: UserId,
                        }
                    })
                }

                list['dataValues'].User = user
                list['dataValues'].Subscribe = subscribe
            }))


            return res.status(200).json({ rankList })
        } catch (err) {
            console.log(err)
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.get('/getNotReadRoomCount', [
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const count: number = await RoomService.getNotReadRoomCount(req)
            return res.status(200).json({ count })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


    router.get('/getRoomCallingState', [
        query('RoomId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const UserId: number = req.id
            const RoomId: number = req.query.RoomId
            const room: any = await Room.findOne({
                where: {
                    id: RoomId,
                    [Op.or]: [{
                        MeId: UserId,

                    }, {
                        YouId: UserId
                    }]
                }
            })
            return res.status(200).json({ room, status: 'true' })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/createRoom', [
        body('YouId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const room: Room | null = await RoomService.createRoom(req, transaction)
            await transaction.commit()
            return res.status(200).json({ status: 'true', RoomId: room?.id })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.get('/getMyRoomAdmin', [
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const UserId: number = req.id
            const room: any = await RoomService.getMyRoomAdmin(req)
            if (!room) return res.status(200).json({ status: 'false' })
            /*
            let youIndex = 0; 
            if (room?.UserRooms.length < 2) return
            if (room?.UserRooms[0]?.User.id === UserId) {
                youIndex = 1;
            } else {
                youIndex = 0;
            }
            room['dataValues'].profile = room?.UserRooms[youIndex]?.User?.profile
            room['dataValues'].nick = room?.UserRooms[youIndex]?.User?.nick
            */
            return res.status(200).json({ room })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.post('/createRoomAdmin', [
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const room: Room | null = await RoomService.createRoomAdmin(req, transaction)
            if (room) {
                await transaction.commit()
                return res.status(200).json({ status: 'true', RoomId: room.id })
            } else {
                await transaction.rollback()
                return res.status(400).json({ status: 'false', RoomId: null })
            }
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


}
