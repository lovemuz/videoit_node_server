import { User, Container, sequelize, Chat, Ban, Room, UserRoom, Authority, PointHistory, Point, Donation, Mcn } from '../models/index'
import bcrypt from 'bcrypt'
import { logger } from '../config/winston'
//import { PAYMENT_STATE } from '../constant/payment-constant'
import Sequelize from 'sequelize'
import RoomService from './roomSerivce'
import { CHAT_TYPE } from '../constant/chat-constant'
import { getSeucreObject } from '../api/middlewares/aws'
import { POINT_HISTORY } from '../constant/point-constant'
import UserService from './userService'
import { USER_ROLE } from '../constant/user-constant'
import { BAN_KEYWORD } from '../constant/ban-constant'
import { slackPostMessage } from '../api/middlewares/slack'
import { SLACK_CHANNEL } from '../constant/slack-constant'
const Op = Sequelize.Op

class ChatService {
    constructor() { }


    static async purchaseChat(req: any, transaction: any, chat: any) {
        try {
            const UserId: number = req.id
            const ChatId: number = req.body.ChatId

            await Authority.create({
                UserId,
                ChatId,
            }, { transaction })

            await PointHistory.create({
                UserId,
                type: POINT_HISTORY.TYPE_CHAT,
                plusOrMinus: POINT_HISTORY.MINUS,
                amount: chat.cost
            }, { transaction })

            await PointHistory.create({
                UserId: chat.UserId,
                type: POINT_HISTORY.TYPE_CHAT,
                plusOrMinus: POINT_HISTORY.PLUS,
                amount: chat.cost
            }, { transaction })

            await Point.increment({
                amount: chat.cost,
            }, {
                where: {
                    UserId: chat.UserId,
                },
                transaction
            })
            await Point.decrement({
                amount: chat.cost,
            }, {
                where: {
                    UserId,
                },
                transaction
            })


            return true
        } catch (err) {
            logger.error('purchaseChat')
            logger.error(err)
            return null
        }
    }

    static async getFindChatOne(req: any, ChatId: number) {
        try {
            //const UserId:number=req.id
            const chat = await Chat.findOne({
                where: {
                    id: ChatId
                },
            })
            return chat
        } catch (err) {
            logger.error('getFindChatOne')
            logger.error(err)
            return null
        }
    }

    static async removeChat(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const ChatId: number = req.body.ChatId
            const chat: any = await Chat.findOne({
                include: [{ model: Room }],
                where: {
                    id: ChatId
                }, transaction
            })
            const cs: any = await User.findOne({
                where: {
                    roles: USER_ROLE.CS_USER
                }, transaction
            })
            const auth = await Authority.findOne({
                where: {
                    ChatId,
                }, transaction
            })

            if (chat?.Room?.MeId === cs?.id || chat?.Room?.YouId === cs?.id || auth
            ) {
            } else {
                await Chat.destroy({
                    where: {
                        UserId,
                        id: ChatId
                    }, transaction
                })
            }
        } catch (err) {
            logger.error('removeChat')
            logger.error(err)
            return null
        }
    }
    static async getFindSecureChatOne(UserId: number, ChatId: number) {
        try {
            const chat: any = await Chat.findOne({
                include: [{
                    model: Authority,
                    where: {
                        UserId,
                    },
                    required: false,
                }, {
                    model: Room,
                }],
                where: {
                    id: ChatId,
                },
            })

            const mcn: any = await Mcn.findOne({
                where: {
                    mcnerId: chat?.UserId,
                    mcningId: UserId,
                }
            })
            //마지막 chat?.type===CHAT_TYPE.CHAT_VIDEO 이유는 비디오일때만 권한없으면 가리기용 && chat?.type === CHAT_TYPE.CHAT_VIDEO -> 없앰
            if (!mcn && Number(chat?.UserId) !== Number(UserId) && chat?.cost > 0 && chat?.lock && !chat?.Authorities[0]) {
                chat['dataValues'].url = null
            }
            if (chat?.lock === true &&
                (chat?.Authorities[0] || Number(chat.UserId) === Number(UserId))
            ) {
                chat['dataValues'].lock = false
            }


            return chat
        } catch (err) {
            logger.error('getFindSecureChatOne')
            logger.error(err)
            return null
        }
    }
    static async getMyChat(req: any) {
        try {
            const UserId: number = req.id
            const RoomId: number = req.query.RoomId
            const pageNum: number = req.query.pageNum
            const pageSize: number = req.query.pageSize

            const userRoom = await UserRoom.findOne({
                where: {
                    UserId,
                    RoomId,
                }
            })
            if (!userRoom) return []

            const youRoom: any = await UserRoom.findOne({
                where: {
                    RoomId,
                    UserId: {
                        [Op.not]: UserId
                    }
                }
            })

            const chatList: any = await Chat.findAll({
                include: [{
                    model: Authority,
                    where: {
                        UserId,
                    },
                    required: false,
                }],
                where: {
                    //UserId,
                    RoomId,
                    id: {
                        [Op.gt]: userRoom.meOutChatId ? userRoom.meOutChatId : 0
                    }
                },
                order: [['createdAt', 'DESC']],
                offset: Number(pageNum * pageSize),
                limit: Number(pageSize),
            })
            const user = await UserService.findUserOne(req.id)

            const mcn: any = await Mcn.findOne({
                where: {
                    mcnerId: youRoom?.UserId,
                    mcningId: UserId,
                }
            })


            for await (const list of chatList) {
                if (list?.lock === true &&
                    (mcn || list?.Authorities[0] || user?.roles === USER_ROLE.CS_USER || user?.roles === USER_ROLE.ADMIN_USER || Number(list.UserId) === Number(UserId))
                ) {
                    list['dataValues'].lock = false
                }
            }
            return chatList
        } catch (err) {
            logger.error('getMyChat')
            logger.error(err)
            return null
        }
    }


    static async getMyChatCs(req: any) {
        try {
            const link: string = req.query.link
            const userFromLink: any = await User.findOne({
                where: {
                    link,
                }
            })
            const UserId: number = userFromLink?.id
            const RoomId: number = req.query.RoomId
            // const pageNum: number = req.query.pageNum
            // const pageSize: number = req.query.pageSize

            const userRoom = await UserRoom.findOne({
                where: {
                    UserId,
                    RoomId,
                }
            })
            if (!userRoom) return []

            const youRoom: any = await UserRoom.findOne({
                where: {
                    RoomId,
                    UserId: {
                        [Op.not]: UserId
                    }
                }
            })

            const chatList: any = await Chat.findAll({
                include: [{
                    model: Authority,
                    where: {
                        UserId,
                    },
                    required: false,
                }],
                where: {
                    //UserId,
                    RoomId,
                    id: {
                        [Op.gt]: userRoom.meOutChatId ? userRoom.meOutChatId : 0
                    }
                },
                paranoid: false,
                order: [['createdAt', 'DESC']],
                offset: 0,// Number(pageNum * pageSize),
                limit: 1000// Number(pageSize),
            })
            const user = await UserService.findUserOne(req.id)

            const mcn: any = await Mcn.findOne({
                where: {
                    mcnerId: youRoom?.UserId,
                    mcningId: UserId,
                }
            })


            for await (const list of chatList) {
                if (list?.lock === true &&
                    (mcn || list?.Authorities[0] || user?.roles === USER_ROLE.CS_USER || user?.roles === USER_ROLE.ADMIN_USER || Number(list.UserId) === Number(UserId))
                ) {
                    list['dataValues'].lock = false
                }
            }
            return chatList
        } catch (err) {
            logger.error('getMyChat')
            logger.error(err)
            return null
        }
    }

    static async getRoomGallery(req: any) {
        try {
            const UserId: number = req.id
            const RoomId: number = req.query.RoomId
            const pageNum: number = req.query.pageNum
            const pageSize: number = req.query.pageSize

            const room: any = await RoomService.getRoomOne(req)
            if (!room) return []

            const chatList: any = await Chat.findAll({
                include: [{
                    model: Authority,
                    where: {
                        UserId: req.id,
                    },
                    required: false,
                }],
                where: {
                    //UserId,
                    type: {
                        [Op.in]: [CHAT_TYPE.CHAT_IMAGE, CHAT_TYPE.CHAT_VIDEO]
                    },
                    RoomId,
                },
                order: [['createdAt', 'DESC']],
                offset: Number(pageNum * pageSize),
                limit: Number(pageSize),
            })

            const user = await UserService.findUserOne(req.id)


            const youRoom: any = await UserRoom.findOne({
                where: {
                    RoomId,
                    UserId: {
                        [Op.not]: UserId
                    }
                }
            })
            const mcn: any = await Mcn.findOne({
                where: {
                    mcnerId: youRoom?.UserId,
                    mcningId: UserId,
                }
            })

            for await (const list of chatList) {
                if (list?.lock === true &&
                    (mcn || list?.Authorities[0] || user?.roles === USER_ROLE.CS_USER || user?.roles === USER_ROLE.ADMIN_USER || Number(list.UserId) === Number(req.id))
                ) {
                    list['dataValues'].lock = false
                }
            }

            return chatList
        } catch (err) {
            logger.error('getRoomGallery')
            logger.error(err)
            return null
        }
    }

    static async createChat(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const thumbnail: string = req.body.thumbnail
            const url: string = req.body.url
            const type: number = req.body.type
            let content: string = req.body.content
            const RoomId: number = req.body.RoomId
            //create chat
            const lock: number = req.body.lock
            const cost: number = req.body.cost
            const adult: number = req.body.adult
            const purchasePossibledAt: number = req.body.purchasePossibledAt
            const timePossible: number = req.body.timePossible

            let time = new Date(new Date().setHours(0, 0, 0, 0));//이전 자정

            const chat: any = await Chat.create({
                UserId,
                thumbnail,
                url,
                type,
                content,
                RoomId,
                //cost: 0,
                lock,
                cost,
                adult,
                purchasePossibledAt,
                timePossible,
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



            if (chat.type === CHAT_TYPE.CHAT_VIDEO || chat.type === CHAT_TYPE.CHAT_IMAGE) {
                chat['dataValues'].url = await getSeucreObject(chat['dataValues'].url)
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

            return chat
        } catch (err) {
            logger.error('createChat')
            logger.error(err)
            return null
        }
    }




    static async createChatFromParams(req: any, YouId: number, type: number, content: string, transaction: any, url?: string) {
        try {
            const UserId: number = req.id
            //const RoomId: number = req.body.RoomId
            let room: Room | null = await Room.findOne({
                where: {
                    [Op.or]: [{
                        [Op.and]: [
                            { MeId: YouId },
                            { YouId: UserId }
                        ],
                    }, {
                        [Op.and]: [
                            { MeId: UserId },
                            { YouId: YouId }
                        ],
                    }]
                },
                transaction
            })
            if (!room) {
                room = await Room.create({
                    MeId: UserId,
                    YouId,
                }, { transaction })

                await UserRoom.create({
                    RoomId: room.id,
                    MyRoomId: room.id,
                    UserId,
                }, { transaction })
                await UserRoom.create({
                    RoomId: room.id,
                    MyRoomId: room.id,
                    UserId: YouId,
                }, { transaction })
            }

            let time = new Date(new Date().setHours(0, 0, 0, 0));//이전 자정
            const adminChatCheck = await Chat.findOne({
                where: {
                    type: CHAT_TYPE.CHAT_ALERT,
                    RoomId: room.id,
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
                    RoomId: room.id
                }, { transaction })
            }
            const chat: any = await Chat.create({
                UserId,
                url,
                type,
                content,
                RoomId: room.id,
                cost: 0,
            }, { transaction })

            if (chat.type === CHAT_TYPE.CHAT_VIDEO || chat.type === CHAT_TYPE.CHAT_IMAGE) {
                chat['dataValues'].url = await getSeucreObject(chat['dataValues'].url)
            }

            await Room.update({
                lastChatDate: new Date(),
            }, {
                where: {
                    id: room.id
                }, transaction
            })

            await UserRoom.update({
                meShow: true
            }, {
                where: {
                    RoomId: room.id
                }, transaction
            })
            return chat
        } catch (err) {
            logger.error('createChatFromParams')
            logger.error(err)
            return null
        }
    }
}
export default ChatService
