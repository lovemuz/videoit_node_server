import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import { Block, Chat, Donation, Earn, Mcn, Money, Point, Room, Subscribe, User, UserRoom } from '../../models/index'
import sequelize from '../../models/sequelize'
import Sequelize from 'sequelize'
import passport from 'passport'
import axios from 'axios'
import { body, query } from 'express-validator';
import { validatorErrorChecker } from '../middlewares/validator'
import { authJWT, authAdminJWT } from '../middlewares/authJWT'
import { logger } from '../../config/winston'
import ChatService from '../../services/chatService'
import BanService from '../../services/banService'
import RoomService from '../../services/roomSerivce'
import { errorLogGet, errorLogPost } from '../middlewares/logCombine'
import { FCMPushNotification } from '../middlewares/fcm-notification'
import UserService from '../../services/userService'
import PointService from '../../services/pointService'
import { USER_ATTRIBUTE, USER_GENDER, USER_ROLE } from '../../constant/user-constant'
import { CHAT_ALL_TYPE, CHAT_TYPE } from '../../constant/chat-constant'
import SubscribeService from '../../services/subscribeService'
import { ALARM_TYPE } from '../../constant/alarm-constant'
import { awsSimpleEmailService, mailgunSimpleEmailService } from '../middlewares/aws'
import PostService from '../../services/postService'
import Jimp from 'jimp'
import { slackPostMessage } from '../middlewares/slack'
import { SLACK_CHANNEL } from '../../constant/slack-constant'
import { BAN_KEYWORD, BAN_REAL_KEYWORD } from '../../constant/ban-constant'
import { CHAT_CS_TYPE } from '../../constant/cs-constant'

const router = express.Router()
const Op = Sequelize.Op

export default (app: any, apiLimiter: any, subdomain: any) => {
    if (process.env.DEV_MODE === 'production')
        app.use(subdomain('api', router))
    app.use('/chat', router)
    app.use('/chat', apiLimiter)
    router.use((req, res, next) => {
        /* res.locals 값추가 가능*/
        next()
    })



    router.get('/getMyChat', [
        query('pageNum').exists(),
        query('pageSize').exists(),
        query('RoomId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const chatList: any = await ChatService.getMyChat(req)
            return res.status(200).json({ chatList })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.get('/getRoomGallery', [
        query('RoomId').exists(),
        query('pageNum').exists(),
        query('pageSize').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const galleryList: Chat[] | null = await ChatService.getRoomGallery(req)
            return res.status(200).json({ galleryList })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.delete('/removeChat', [
        body('ChatId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            await ChatService.removeChat(req, transaction)
            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/createAllChat', [
        body('url').optional(),
        body('thumbnail').optional(),
        body('content').optional(),
        body('type').optional(),
        body('timePossible').optional(),
        body('purchasePossibledAt').optional(),
        body('toWhom').optional(), // 'follow', 'all','subsribe'
        body('cost').optional(),
        body('adult').optional(),
        body('lock').optional(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            //컨텐츠도없고 url도 없으면 return
            const url: string = req.body.url
            const content: string = req.body.content
            const UserId: number = req.id
            const toWhom: string = req.body.toWhom
            const thumbnail: string = req.body.thumbnail
            const type: number = req.body.type
            const timePossible: boolean = req.body.timePossible
            const purchasePossibledAt: Date = req.body.purchasePossibledAt
            const cost: number = req.body.cost
            const adult: boolean = req.body.adult;
            const lock: boolean = req.body.lock

            if (!url && !content) {
                await transaction.commit()
                return res.status(200).json({ status: 'true' })
            }
            //성별 여자만 가능해야하고, 
            const userChk: any = await UserService.findUserOneTransaction2(UserId, transaction)
            const user: any = await UserService.findUserOneTransaction(UserId, transaction)
            if (user?.gender !== USER_GENDER.GIRL) {
                await transaction.commit()
                return res.status(200).json({ status: 'true' })
            }

            const blockCheck = await Block.findOne({
                where: {
                    email: userChk?.email
                }, transaction
            })
            if (blockCheck) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }


            //toWhom 체크
            //팔로우 혹은 구독자 가져옴 
            let youList: any;
            const bulkChat = []
            const bulkRoom = []

            const roomList = await Room.findAll({
                include: [{
                    model: UserRoom,
                    include: [{
                        model: User,
                        attributes: {
                            exclude: USER_ATTRIBUTE.EXCLUDE,
                        }
                    }]
                }, {
                    model: UserRoom,
                    as: 'MyUserRoom',
                    where: {
                        UserId,
                    }
                }],
                where: {
                    [Op.or]: [{
                        MeId: UserId,

                    }, {
                        YouId: UserId
                    }]
                }, transaction
            })


            if (toWhom === CHAT_ALL_TYPE.FOLLOW) {
                youList = await UserService.getMyFollowAndRoomMan(req, transaction)
                for await (const list of youList?.Followers) {
                    try {
                        //room 찾고 
                        ///룸 없으면 만들고
                        const follow = list?.Follow
                        const followerId = follow?.followerId
                        const followingId = follow?.followingId
                        //room id 없을때 create 
                        let room: any = roomList.find((ele: any) => {
                            if (
                                (Number(ele.MeId) === Number(followerId) && Number(ele.YouId) === Number(followingId)) ||
                                (Number(ele.MeId) === Number(followingId) && Number(ele.YouId) === Number(followerId))) {
                                return true
                            }
                        })
                        if (!room) {
                            let UserRooms = []

                            room = await Room.create({
                                MeId: followerId,
                                YouId: followingId,
                            }, { transaction })

                            const userRooms1 = await UserRoom.create({
                                RoomId: room.id,
                                MyRoomId: room.id,
                                UserId: followerId,
                            }, { transaction })
                            const userRooms2 = await UserRoom.create({
                                RoomId: room.id,
                                MyRoomId: room.id,
                                UserId: followingId,
                            }, { transaction })
                            UserRooms.push(userRooms1)
                            UserRooms.push(userRooms2)

                            room['dataValues'].UserRooms = UserRooms
                            room.UserRooms = UserRooms
                        }

                        let Chats = [{
                            UserId: list.id,
                            url,
                            thumbnail,
                            content,
                            type,
                            cost,
                            adult,
                            purchasePossibledAt: timePossible ? purchasePossibledAt : null,
                            RoomId: room?.id,
                            lock
                        }]
                        let youIndex = 0;
                        let meIndex = 0;

                        if (room?.UserRooms.length < 2) return
                        if (room?.UserRooms[0]?.User?.id === UserId) {
                            youIndex = 1;
                            meIndex = 0;
                        } else {
                            meIndex = 1;
                            youIndex = 0;
                        }
                        list['dataValues'].room = room
                        list.room = room
                        list['dataValues'].room['dataValues'].Chats = Chats
                        list.room.Chats = Chats


                        list['dataValues'].room['dataValues'].profileYou = room?.UserRooms[meIndex]?.User?.profile
                        list['dataValues'].room['dataValues'].nickYou = room?.UserRooms[meIndex]?.User?.nick
                        list.room.profileYou = room?.UserRooms[meIndex]?.User?.profile
                        list.room.nickYou = room?.UserRooms[meIndex]?.User?.nick
                        list['dataValues'].room['dataValues'].profile = room?.UserRooms[youIndex]?.User?.profile
                        list['dataValues'].room['dataValues'].nick = room?.UserRooms[youIndex]?.User?.nick
                        list.room.profile = room?.UserRooms[youIndex]?.User?.profile
                        list.room.nick = room?.UserRooms[youIndex]?.User?.nick

                        list['dataValues'].room['dataValues'].read = false
                        list.room.read = false

                        bulkChat.push({
                            UserId: req.id,
                            url,
                            thumbnail,
                            content,
                            type,
                            cost,
                            adult,
                            purchasePossibledAt: timePossible ? purchasePossibledAt : null,
                            RoomId: room?.id,
                            lock
                        })
                        bulkRoom.push(room?.id)
                    } catch (err) {
                        logger.error('[ CHAT_ALL_TYPE.FOLLOW ]')
                        logger.error(err)
                    }
                    //
                }
            } else if (toWhom === CHAT_ALL_TYPE.SUBSCRIBE) {
                youList = await SubscribeService.getMySubscriberAndRoomMan(req, transaction)
                for await (const list of youList[0]?.Subscribers) {
                    try {
                        //room 찾고 
                        ///룸 없으면 만들고
                        const subsribe = list?.Subscribe
                        const subscriberId = subsribe?.subscriberId
                        const subscribingId = subsribe?.subscribingId
                        //room id 없을때 create 
                        let room: any = roomList.find((ele: any) => {
                            if (
                                (Number(ele.MeId) === Number(subscriberId) && Number(ele.YouId) === Number(subscribingId)) ||
                                (Number(ele.MeId) === Number(subscribingId) && Number(ele.YouId) === Number(subscriberId))) {
                                return true
                            }
                        })
                        if (!room) {
                            let UserRooms = []

                            room = await Room.create({
                                MeId: subscribingId,
                                YouId: subscriberId,
                            }, { transaction })

                            const userRooms1 = await UserRoom.create({
                                RoomId: room.id,
                                MyRoomId: room.id,
                                UserId: subscribingId,
                            }, { transaction })
                            const userRooms2 = await UserRoom.create({
                                RoomId: room.id,
                                MyRoomId: room.id,
                                UserId: subscriberId,
                            }, { transaction })
                            UserRooms.push(userRooms1)
                            UserRooms.push(userRooms2)

                            room['dataValues'].UserRooms = UserRooms
                            room.UserRooms = UserRooms
                        }

                        let Chats = [{
                            UserId: list.id,
                            url,
                            thumbnail,
                            content,
                            type,
                            cost,
                            adult,
                            purchasePossibledAt: timePossible ? purchasePossibledAt : null,
                            RoomId: room?.id,
                            lock
                        }]
                        let youIndex = 0;
                        let meIndex = 0;

                        if (room?.UserRooms.length < 2) return
                        if (room?.UserRooms[0]?.User?.id === UserId) {
                            youIndex = 1;
                            meIndex = 0;
                        } else {
                            meIndex = 1;
                            youIndex = 0;
                        }
                        list['dataValues'].room = room
                        list.room = room
                        list['dataValues'].room['dataValues'].Chats = Chats
                        list.room.Chats = Chats


                        list['dataValues'].room['dataValues'].profileYou = room?.UserRooms[meIndex]?.User?.profile
                        list['dataValues'].room['dataValues'].nickYou = room?.UserRooms[meIndex]?.User?.nick
                        list.room.profileYou = room?.UserRooms[meIndex]?.User?.profile
                        list.room.nickYou = room?.UserRooms[meIndex]?.User?.nick
                        list['dataValues'].room['dataValues'].profile = room?.UserRooms[youIndex]?.User?.profile
                        list['dataValues'].room['dataValues'].nick = room?.UserRooms[youIndex]?.User?.nick
                        list.room.profile = room?.UserRooms[youIndex]?.User?.profile
                        list.room.nick = room?.UserRooms[youIndex]?.User?.nick

                        list['dataValues'].room['dataValues'].read = false
                        list.room.read = false

                        bulkChat.push({
                            UserId: req.id,
                            url,
                            thumbnail,
                            content,
                            type,
                            cost,
                            adult,
                            purchasePossibledAt: timePossible ? purchasePossibledAt : null,
                            RoomId: room?.id,
                            lock
                        })
                        bulkRoom.push(room?.id)
                    } catch (err) {
                        logger.error('[ CHAT_ALL_TYPE.SUBSCRIBE ]')
                        logger.error(err)
                    }
                }
            } else if (toWhom === CHAT_ALL_TYPE.ALL) {
                // 아직 없음
                await transaction.commit()
                return res.status(200).json({ status: 'true' })
            } else {
                await transaction.commit()
                return res.status(200).json({ status: 'true' })
            }
            //버크인서트 채팅
            await Chat.bulkCreate(bulkChat, { transaction })
            //룸 버크 업데이트
            await Room.update({
                lastChatDate: new Date(),
            }, {
                where: {
                    id: {
                        [Op.in]: bulkRoom
                    }
                }, transaction
            })
            await UserRoom.update({
                meShow: true
            }, {
                where: {
                    RoomId: {
                        [Op.in]: bulkRoom
                    }
                }, transaction
            })
            //푸시알림
            //소켓

            //업데이트 된 룸 찾기


            const realRoom: any = await RoomService.getMyRoomTransaction(req, transaction)
            realRoom?.forEach((ele: any) => {
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


            function chunk(data: any = [], size = 1) {
                const arr = [];

                for (let i = 0; i < data.length; i += size) {
                    arr.push(data.slice(i, i + size));
                }

                return arr;
            }

            if (toWhom === CHAT_ALL_TYPE.FOLLOW) {
                const newResult = chunk(youList?.Followers, 500)
                newResult?.map((item: any, idx: number) => {
                    setTimeout(() => {
                        item?.forEach((list: any) => {
                            if (/*list?.AlarmSetting.chat &&*/ list?.pushToken) {
                                FCMPushNotification(
                                    user?.nick,
                                    content,
                                    list?.pushToken,
                                    user?.profile,
                                    {
                                        screen: 'Chat',
                                        RoomId: list?.room?.id.toString(),
                                    }
                                )
                            }
                        })
                    }, idx * 1500)
                })
                youList?.Followers.forEach((list: any) => {
                    req.app
                        .get('io')
                        .of('/connect')
                        .to(list?.id?.toString())
                        .emit('newChat', { room: list?.room, admin: false })
                })
            } else if (toWhom === CHAT_ALL_TYPE.SUBSCRIBE) {
                const newResult = chunk(youList[0]?.Subscribers, 500)
                newResult?.map((item: any, idx: number) => {
                    setTimeout(() => {
                        item?.forEach((list: any) => {
                            if (/*list?.AlarmSetting.chat &&*/ list?.pushToken) {
                                FCMPushNotification(
                                    user?.nick,
                                    content,
                                    list?.pushToken,
                                    user?.profile,
                                    {
                                        screen: 'Chat',
                                        RoomId: list?.room?.id.toString(),
                                    }
                                )
                            }
                        })
                    }, idx * 1500)
                })

                youList[0]?.Subscribers.forEach((list: any) => {
                    req.app
                        .get('io')
                        .of('/connect')
                        .to(list?.id?.toString())
                        .emit('newChat', { room: list?.room, admin: false })
                })
            }


            await transaction.commit()
            return res.status(200).json({ status: 'true', realRoom })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })



    router.post('/createChat', [
        body('url').optional(),
        body('thumbnail').optional(),
        body('content').optional(),
        body('type').optional(),
        body('admin').optional(),
        body('RoomId').exists(),
        body('lock').optional(),
        body('cost').optional(),
        body('adult').optional(),
        body('purchasePossibledAt').optional(),
        body('timePossible').optional(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const UserId: number = req.id
            const admin = req.body.admin
            const cost: number = req.body.cost

            if (Number(cost) < 0) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }

            const YouId: any = await RoomService.findRoomOpponent(req, transaction)
            if (!YouId) {
                await transaction.commit()
                return res.status(200).json({ status: 'noRoom', message: 'noRoom' })
            }
            const banCheck = await BanService.checkBan(req, YouId, transaction);
            if (banCheck) {
                await transaction.commit()
                return res.status(200).json({ status: 'ban', message: 'ban' })
            }
            req.query.RoomId = req.body.RoomId

            const userChk: any = await UserService.findUserOneTransaction2(req.id, transaction)
            const user: any = await UserService.findUserOneTransaction(req.id, transaction)



            const blockCheck = await Block.findOne({
                where: {
                    email: userChk?.email
                }, transaction
            })
            if (blockCheck) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }
            const you: any = await UserService.findUserOneTransaction(YouId, transaction)

            //관리자 혹은 다른 성별일때만 채팅 가능하도록
            if (!admin && user?.gender === you?.gender && user?.roles !== USER_ROLE.CS_USER) {
                await transaction.commit()
                return res.status(200).json({ status: 'gender', message: 'gender' })
            }


            const room: Room | null = await RoomService.getRoomOneTransaction(req, transaction)
            if (user.gender === USER_GENDER.BOY && user.roles !== USER_ROLE.ADMIN_USER && user.roles !== USER_ROLE.CS_USER && !room?.firstCost) {
                const point: any = await PointService.getMyPoint(req, transaction)
                if (!admin && point?.amount < 50) {
                    await transaction.commit()
                    return res.status(200).json({ status: 'short' })
                }
                if (!admin) {
                    await PointService.decreasePointByChat(req, 50, transaction)
                }
                await RoomService.updateFirstCost(req, transaction)

            }
            const chat = await ChatService.createChat(req, transaction)

            if (req.body?.content) {
                for (let i = 0; i < BAN_KEYWORD.LIST.length; i++) {
                    if (req.body.content.includes(BAN_KEYWORD.LIST[i])) {
                        slackPostMessage(SLACK_CHANNEL.BAN,
                            `밴 키워드 모니터링
                      ${req.body?.content}
                      ${user?.nick} -> ${you?.nick}
                      UserId:${user?.id}  -> UserId:${you?.id}
                      link:${user?.link}  -> link:${you?.link}
        
                      `
                        )
                        break
                    }
                }
            }



            if (req.body?.content && !admin) {
                for await (const keyword of BAN_REAL_KEYWORD.LIST) {
                    if (req.body.content.includes(keyword)) {
                        await RoomService.createRoomAdmin(req, transaction)
                        const roomCsAfter: any = await RoomService.getMyRoomAdminTransaction(req, transaction)

                        const RoomIdCs: number = roomCsAfter?.id
                        const content: string = user?.country === "ko"
                            ? "계좌, sns 유도로 확인되어 경고드립니다. 2회차시 계정 영구 밴 처리 됩니다."
                            : user?.country === "ja"
                                ? "口座やSNSへの誘導が確認され、警告いたします。2回目の場合、アカウントは永久停止となります。"
                                : user?.country === "es"
                                    ? "Se ha detectado una inducción a cuentas o redes sociales. Esta es una advertencia. En la segunda ocasión, su cuenta será suspendida permanentemente."
                                    : user?.country === "fr"
                                        ? "Une incitation à un compte ou aux réseaux sociaux a été détectée. Ceci est un avertissement. En cas de récidive, votre compte sera définitivement banni."
                                        : user?.country === "id"
                                            ? "Peringatan diberikan karena terdeteksi mengarahkan ke rekening atau media sosial. Pelanggaran kedua akan menyebabkan akun diblokir secara permanen."
                                            : user?.country === "zh"
                                                ? "已检测到引导至账户或社交媒体的行为，特此警告。第二次将永久封禁账户。"
                                                : "Account or SNS solicitation detected. This is a warning. On the second occurrence, your account will be permanently banned."

                        let time = new Date(new Date().setHours(0, 0, 0, 0));//이전 자정
                        const cs = await User.findOne({
                            where: {
                                roles: USER_ROLE.CS_USER
                            }, transaction
                        })

                        const chatCs: any = await Chat.create({
                            UserId: cs?.id,
                            type: CHAT_TYPE.CHAT_NORMAL,
                            content,
                            RoomId: RoomIdCs,
                        }, { transaction })

                        const adminChatCheck = await Chat.findOne({
                            where: {
                                type: CHAT_TYPE.CHAT_ALERT,
                                RoomId: RoomIdCs,
                                createdAt: {
                                    [Op.gte]: time,
                                }
                            },
                            transaction
                        })
                        if (!adminChatCheck) {
                            await Chat.create({
                                type: CHAT_TYPE.CHAT_ALERT,
                                content: Number(new Date()).toString(),
                                RoomId: RoomIdCs
                            }, { transaction })
                        }

                        await Room.update({
                            lastChatDate: new Date(),
                        }, {
                            where: {
                                id: RoomIdCs
                            }, transaction
                        })

                        await UserRoom.update({
                            meShow: true
                        }, {
                            where: {
                                RoomId: RoomIdCs
                            }, transaction
                        })

                        let youIndex = 0;
                        //읽었는지도 봐야함
                        let lastReadChatId = -1
                        if (roomCsAfter?.UserRooms.length >= 2) {
                            if (roomCsAfter?.UserRooms[0]?.User?.id === UserId) {
                                lastReadChatId = roomCsAfter?.UserRooms[0]?.meLastReadChatId
                                youIndex = 1;
                            } else {
                                lastReadChatId = roomCsAfter?.UserRooms[1]?.meLastReadChatId
                                youIndex = 0;
                            }

                            roomCsAfter['dataValues'].profile = roomCsAfter?.UserRooms[youIndex]?.User?.profile
                            roomCsAfter['dataValues'].nick = roomCsAfter?.UserRooms[youIndex]?.User?.nick
                            roomCsAfter['dataValues'].read = lastReadChatId === roomCsAfter?.Chats[0]?.id ? true : false
                        }
                        req.app
                            .get('io')
                            .of('/chat')
                            .to(user?.id?.toString())
                            .emit('updateChat', { chat: chatCs })
                        req.app
                            .get('io')
                            .of('/connect')
                            .to(user?.id?.toString())
                            .emit('newChat', { room: roomCsAfter, admin: true })
                        break
                    }
                }
            }

            if (admin) {
                const content = req.body.content
                awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'CS 문의', `${content}`)
                slackPostMessage(SLACK_CHANNEL.CS,
                    `CS 문의
                  ${content}
                  ${user?.nick}
                  UserId:${user?.id}
                  link:${user?.link}

                  `
                )
            }


            if (you?.AlarmSetting?.chat) {
                FCMPushNotification(
                    user?.nick,
                    req.body.content,
                    you?.pushToken,
                    user?.profile,
                    {
                        screen: 'Chat',
                        RoomId: req.body.RoomId.toString(),
                    }
                )
            }
            await transaction.commit()
            return res.status(200).json({ status: 'true', chat })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


    router.post('/answerCs', [
        body('type').exists(),
        body('RoomId').exists(),
        body('country').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const type: number = req.body.type
            const country: any = req.body.country

            let content: string = ''

            if (type === CHAT_CS_TYPE.REFUND) {
                content =
                    country === "ko"
                        ? "환불은 원칙상 불가능합니다. 멤버십 경우 구독, 재구독 전부 환불이 불가능합니다."
                        : country === "ja"
                            ? "返金は原則できません。メンバーシップの場合、購読および再購読の両方が返金対象外です。"
                            : country === "es"
                                ? "Los reembolsos no son posibles en principio. En el caso de membresías, ni las suscripciones ni las renovaciones son reembolsables."
                                : country === "fr"
                                    ? "Les remboursements ne sont pas possibles en principe. Pour les adhésions, ni les abonnements ni les réabonnements ne sont remboursables."
                                    : country === "id"
                                        ? "Pengembalian dana pada prinsipnya tidak memungkinkan. Dalam kasus keanggotaan, baik langganan maupun langganan ulang tidak dapat dikembalikan."
                                        : country === "zh"
                                            ? "原则上不予退款。对于会员订阅和续订均不支持退款。"
                                            : "Refunds are not possible as a rule. For memberships, neither subscriptions nor resubscriptions are refundable."
            } else if (type === CHAT_CS_TYPE.PAYMENT) {
                content =
                    country === "ko"
                        ? "BC, 우리카드 라면 다른 카드 이용 혹은 계좌이체 진행 원할 시 멤버십 대상, 구독 단계 혹은 구매 포인트 말씀 주세요."
                        : country === "ja"
                            ? "BCカード、ウリカードをご利用の場合、他のカード利用または口座振替をご希望の場合は、メンバーシップの対象、購読段階または購入ポイントをお知らせください。"
                            : country === "es"
                                ? "Si está utilizando BC o Woori Card y desea utilizar otra tarjeta o realizar una transferencia bancaria, indíquenos el nivel de membresía, el nivel de suscripción o los puntos de compra."
                                : country === "fr"
                                    ? "Si vous utilisez BC ou Woori Card et souhaitez utiliser une autre carte ou effectuer un virement bancaire, veuillez indiquer le niveau d'adhésion, le niveau d'abonnement ou les points d'achat."
                                    : country === "id"
                                        ? "Jika Anda menggunakan kartu BC atau Woori dan ingin menggunakan kartu lain atau melakukan transfer bank, mohon sebutkan keanggotaan, tingkatan langganan, atau poin pembelian."
                                        : country === "zh"
                                            ? "如果您使用的是BC卡或Woori卡，并希望使用其他卡或进行银行转账，请告知会员资格对象、订阅阶段或购买积分。"
                                            : "If you're using a BC or Woori Card and want to use another card or make a bank transfer, please specify your membership tier, subscription level, or purchase points."
            } else if (type === CHAT_CS_TYPE.EXCHANGE) {
                const user = await User.findOne({
                    where: {
                        id: req.id
                    }, transaction
                })
                //
                const ch01Chk = await Mcn.findOne({
                    where: {
                        mcnerId: req?.id,
                        code: 'ch01'
                    }, transaction
                })
                if (ch01Chk) {
                    content = country === "ko"
                        ? "카톡 ntoos6713 으로 연락 주시면 환전 진행 도와드리겠습니다."
                        : country === "ja"
                            ? "カカオトーク ntoos6713 に連絡していただければ、両替を進めるお手伝いをいたします。"
                            : country === "es"
                                ? "Por favor, contácteme en KakaoTalk ntoos6713 y le ayudaré con el cambio de divisas."
                                : country === "fr"
                                    ? "Veuillez me contacter sur KakaoTalk ntoos6713 et je vous aiderai avec le change."
                                    : country === "id"
                                        ? "Silakan hubungi saya di KakaoTalk ntoos6713, saya akan membantu proses penukaran uang."
                                        : country === "zh"
                                            ? "请通过KakaoTalk ntoos6713联系我，我将协助您进行兑换。"
                                            : "Please contact me on KakaoTalk ntoos6713, and I will assist you with the exchange."
                } else {
                    content = user?.nextMonthExchange ?
                        country === "ko"
                            ? "해당달 환전신청은 익월 15일 마다 진행 됩니다."
                            : country === "ja"
                                ? "該当月の換金申請は翌月15日に行われます。"
                                : country === "es"
                                    ? "La solicitud de intercambio del mes correspondiente se procesa el 15 del mes siguiente."
                                    : country === "fr"
                                        ? "Les demandes d'échange pour le mois en cours sont traitées le 15 du mois suivant."
                                        : country === "id"
                                            ? "Permohonan penukaran bulan terkait dilakukan pada tanggal 15 bulan berikutnya."
                                            : country === "zh"
                                                ? "当月的兑换申请将在次月15日进行。"
                                                : "Exchange requests for the current month are processed on the 15th of the following month." :
                        country === "ko"
                            ? "환전은 매주 금요일마다 진행 됩니다."
                            : country === "ja"
                                ? "換金は毎週金曜日に行われます。"
                                : country === "es"
                                    ? "El intercambio se realiza todos los viernes."
                                    : country === "fr"
                                        ? "Les échanges sont effectués tous les vendredis."
                                        : country === "id"
                                            ? "Penukaran dilakukan setiap hari Jumat."
                                            : country === "zh"
                                                ? "兑换每周五进行。"
                                                : "Exchange is processed every Friday."
                }

            } else if (type === CHAT_CS_TYPE.ERROR) {
                content =
                    country === "ko"
                        ? "오류 내용 말씀 주시면 순차적으로 확인 후 말씀 드리겠습니다."
                        : country === "ja"
                            ? "エラー内容をお知らせいただければ、順次確認のうえご案内いたします。"
                            : country === "es"
                                ? "Por favor, indíquenos el contenido del error y lo revisaremos en orden para responderle."
                                : country === "fr"
                                    ? "Veuillez nous indiquer le contenu de l'erreur et nous vous répondrons après vérification dans l'ordre."
                                    : country === "id"
                                        ? "Silakan beri tahu kami isi kesalahan, kami akan memeriksanya secara berurutan dan memberi tahu Anda."
                                        : country === "zh"
                                            ? "请告知错误内容，我们会依次确认后再回复您。"
                                            : "Please provide the error details, and we will check them sequentially and get back to you."
            } else if (type === CHAT_CS_TYPE.USE) {
                content =
                    country === "ko"
                        ? "영상통화 진행시 30초마다 설정한 포인트를 획득하게 됩니다. 포인트는 설정 -> 환전하기 에서 환전 가능합니다. 프로필 사진 변경시 유저 들에게 추천이 시작됩니다."
                        : country === "ja"
                            ? "ビデオ通話を進行すると、30秒ごとに設定したポイントを獲得できます。ポイントは設定 -> 換金するから換金が可能です。プロフィール写真を変更すると、ユーザーにおすすめが開始されます。"
                            : country === "es"
                                ? "Durante una videollamada, ganarás los puntos configurados cada 30 segundos. Los puntos se pueden canjear en Configuración -> Cambiar por dinero. Al cambiar tu foto de perfil, se comenzará a recomendar a otros usuarios."
                                : country === "fr"
                                    ? "Lors d'un appel vidéo, vous gagnez les points définis toutes les 30 secondes. Les points peuvent être échangés dans Paramètres -> Convertir en argent. En modifiant votre photo de profil, vous commencerez à être recommandé aux utilisateurs."
                                    : country === "id"
                                        ? "Saat melakukan panggilan video, Anda akan mendapatkan poin yang diatur setiap 30 detik. Poin dapat ditukar melalui Pengaturan -> Tukarkan. Ketika foto profil diubah, rekomendasi kepada pengguna lain akan dimulai."
                                        : country === "zh"
                                            ? "进行视频通话时，每30秒可获得设定的积分。积分可在“设置”->“兑换”中进行兑换。更改个人资料照片时，将开始向用户推荐。"
                                            : "During a video call, you will earn the set points every 30 seconds. Points can be exchanged via Settings -> Redeem. Changing your profile picture will trigger recommendations to users."
            }
            req.query.RoomId = req.body.RoomId

            const RoomId: number = req.body.RoomId
            let time = new Date(new Date().setHours(0, 0, 0, 0));//이전 자정

            const cs = await User.findOne({
                where: {
                    roles: USER_ROLE.CS_USER
                }, transaction
            })

            const chat: any = await Chat.create({
                UserId: cs?.id,
                type: CHAT_TYPE.CHAT_NORMAL,
                content,
                RoomId,
            }, { transaction })

            const adminChatCheck = await Chat.findOne({
                where: {
                    type: CHAT_TYPE.CHAT_ALERT,
                    RoomId,
                    createdAt: {
                        [Op.gte]: time,
                    }
                },
                transaction
            })
            if (!adminChatCheck) {
                await Chat.create({
                    type: CHAT_TYPE.CHAT_ALERT,
                    content: Number(new Date()).toString(),
                    RoomId
                }, { transaction })
            }


            await Room.update({
                lastChatDate: new Date(),
            }, {
                where: {
                    id: RoomId
                }, transaction
            })

            await UserRoom.update({
                meShow: true
            }, {
                where: {
                    RoomId
                }, transaction
            })
            await transaction.commit()
            return res.status(200).json({ status: 'true', chat })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })



    router.post('/purchaseChat', [
        body('ChatId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const ChatId: number = req.body?.ChatId
            const point: any = await PointService.getMyPoint(req, transaction)
            const chat: any = await ChatService.getFindChatOne(req, ChatId)

            const mcn = await Mcn.findOne({
                where: {
                    mcnerId: req.id,
                }
            })
            if (mcn) {
                await transaction.commit()
                return res.status(200).json({ status: 'mcn' })
            }

            if (Number(chat.cost) < 0) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }
            if (Number(point?.amount) < Number(chat?.cost)) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }
            await ChatService.purchaseChat(req, transaction, chat)
            const user: any = await UserService.findUserOne(req?.id)
            const you: any = await UserService.findUserOne(chat?.UserId)


            const donation = await Donation.findOne({
                where: {
                    donationerId: user?.id,
                    donationingId: you?.id,
                }, transaction
            })
            if (donation) {
                await Donation.increment({
                    amount: chat.cost,
                }, {
                    where: {
                        donationerId: user?.id,
                        donationingId: you?.id,
                    },
                    transaction
                })
            } else {
                await Donation.create({
                    amount: chat.cost,
                    donationerId: user?.id,
                    donationingId: you?.id,
                }, { transaction })
            }
            await Earn.create({
                year: new Date().getFullYear(),
                month: new Date().getMonth() + 1,
                amount: chat.cost,
                donationerId: user?.id,
                donationingId: you?.id,
            }, { transaction })

            //채팅 으로 구매했다고 알리기
            const chatAfter = await ChatService.createChatFromParams(req, chat.UserId, CHAT_TYPE.CHAT_NORMAL, `채팅 컨텐츠를 ${chat?.cost} 포인트로 구매했습니다.`, transaction)
            /*
            if (you.email) {
                if (you?.email?.split('@')[1] !== 'privaterelay.appleid.com')
                    awsSimpleEmailService('traveltofindlife@gmail.com', `${you?.email}`, 'Chat Purchase!', `Congratulation! you earn ${chat?.cost} Point By ${user?.nick}`)
            }
                */
            // awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Chat Purchase!', `Congratulation! you earn ${chat?.cost} Price , ${user?.nick} -> ${you?.nick}`)

            slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
                `Chat Purchase!
                Congratulation! you earn ${chat?.cost} Price
                ${user?.nick} -> ${you?.nick}
                UserId:${user?.id}
                link:${user?.link}
                회원가입 날짜:${user?.createdAt?.toLocaleDateString()}

                `
            )
            // awsSimpleEmailService('traveltofindlife@gmail.com', `kakabal@naver.com`, 'Chat Purchase!', `Congratulation! you earn ${chat?.cost} Price , ${user?.nick} -> ${you?.nick}`)

            if (you?.pushToken) {
                FCMPushNotification(
                    user?.nick,
                    `채팅 컨텐츠를 ${chat?.cost} 포인트로 구매했습니다.`,
                    you?.pushToken,
                    user?.profile,
                    {
                        screen: 'Chat',
                        RoomId: chat?.RoomId.toString(),
                    }
                )
            }



            const mcnChk = await Mcn.findAll({
                where: {
                    mcnerId: chat?.UserId,
                }, transaction
            })
            if (mcnChk) {
                await Promise.all(mcnChk.map(async (list: any, idx: number) => {
                    const mcnUser = await User.findOne({
                        where: {
                            id: list?.mcningId
                        }, transaction
                    })
                    const amount = chat.cost * list?.creatorCharge * 0.01
                    await Money.increment({
                        amount: amount,
                    }, {
                        where: {
                            UserId: mcnUser?.id
                        }, transaction
                    })
                    if (mcnUser?.email?.split('@')[1] !== 'privaterelay.appleid.com')
                        awsSimpleEmailService('traveltofindlife@gmail.com', `${mcnUser?.email}`, 'Chat Purchase!', `Congratulation! you earn ${amount} Point By ${you?.nick}`)
                }))
            }
            /*
            req.app
                .get('io')
                .of('/chat')
                .to(chat?.RoomId?.toString())
                .emit('updateChat', { chat: chatAfter })
                */
            await transaction.commit()
            return res.status(200).json({ status: 'true', chat: chatAfter })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
}
