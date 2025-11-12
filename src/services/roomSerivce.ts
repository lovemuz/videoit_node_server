import { User, Container, sequelize, Room, Chat, UserRoom, Score, CallHistory, CreatorAuth } from '../models/index'
import bcrypt from 'bcrypt'
import { logger } from '../config/winston'
//import { PAYMENT_STATE } from '../constant/payment-constant'
import Sequelize from 'sequelize'
import { USER_ATTRIBUTE, USER_ROLE } from '../constant/user-constant'
import { CHAT_TYPE } from '../constant/chat-constant'
const Op = Sequelize.Op

class RoomService {
    constructor() { }

    static async updateCallingState(RoomId: number, state: Boolean, transaction: any) {
        try {
            await Room.update({
                calling: state,
                callingAt: new Date(),
            }, {
                where: {
                    id: RoomId,
                }, transaction
            })
            return true
        } catch (err) {
            logger.error('updateCallingState')
            logger.error(err)
            return null
        }
    }
    static async updateFirstCost(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const RoomId: number = req.body.RoomId
            await Room.update({
                firstCost: true,
            }, {
                where: {
                    id: RoomId,
                }, transaction
            })
            return true
        } catch (err) {
            logger.error('updateFirstCost')
            logger.error(err)
            return null
        }
    }

    static async roomReadChat(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const RoomId: number = req.body.RoomId
            const ChatId: number = req.body.ChatId

            await UserRoom.update({
                meLastReadChatId: ChatId,
            }, {
                where: {
                    UserId,
                    RoomId,
                }, transaction
            })


            const youRoom = await UserRoom.findOne({
                where: {
                    RoomId,
                    UserId: {
                        [Op.not]: UserId
                    }
                }
            })
            return youRoom
        } catch (err) {
            logger.error('roomReadChat')
            logger.error(err)
            return null
        }
    }

    static async outRoom(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const RoomId: number = req.body.RoomId

            const chat: any = await Chat.findOne({
                where: {
                    RoomId,
                }, transaction,
                limit: 1,
                offset: 0,
                order: [['createdAt', 'DESC']]
            })
            const ChatId: number = chat?.id
            await UserRoom.update({
                meShow: false,
                meOutChatId: ChatId,
            }, {
                where: {
                    UserId,
                    RoomId,
                }, transaction
            })
            return true
        } catch (err) {
            logger.error('outRoom')
            logger.error(err)
            return null
        }
    }
    static async getRoomOneCs(UserId: number, RoomId: number) {
        try {

            const room = await Room.findOne({
                include: [{
                    model: Chat,
                    as: 'Chats',
                    order: [['createdAt', 'DESC']],
                    separate: true, // <--- Run separate query
                    limit: 1,
                }, {
                    model: UserRoom,
                    include: [{
                        model: User,
                        include: [{
                            model: CreatorAuth,
                            attributes: ['callPrice'],
                        }, {
                            model: Score,
                        }],
                        attributes: {
                            exclude: USER_ATTRIBUTE.EXCLUDE,
                        },
                    }]
                }],
                where: {
                    id: RoomId,
                    [Op.or]: [{
                        MeId: UserId,

                    }, {
                        YouId: UserId
                    }]
                }
            })
            return room
        } catch (err) {
            logger.error('getRoomOne')
            logger.error(err)
            return null
        }
    }
    static async getRoomOne(req: any) {
        try {
            const UserId: number = req.id
            const RoomId: number = req.query.RoomId

            const room = await Room.findOne({
                include: [{
                    model: Chat,
                    as: 'Chats',
                    order: [['createdAt', 'DESC']],
                    separate: true, // <--- Run separate query
                    limit: 1,
                }, {
                    model: UserRoom,
                    include: [{
                        model: User,
                        include: [{
                            model: CreatorAuth,
                            attributes: ['callPrice'],
                        }, {
                            model: Score,
                        }],
                        attributes: {
                            exclude: USER_ATTRIBUTE.EXCLUDE,
                        },
                    }]
                }],
                where: {
                    id: RoomId,
                    [Op.or]: [{
                        MeId: UserId,

                    }, {
                        YouId: UserId
                    }]
                }
            })
            return room
        } catch (err) {
            logger.error('getRoomOne')
            logger.error(err)
            return null
        }
    }
    static async getRoomOneTransaction(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const RoomId: number = req.query.RoomId

            const room = await Room.findOne({
                include: [{
                    model: Chat,
                    as: 'Chats',
                    order: [['createdAt', 'DESC']],
                    separate: true, // <--- Run separate query
                    limit: 1,
                }, {
                    model: UserRoom,
                    include: [{
                        model: User,
                        include: [{
                            model: CreatorAuth,
                            attributes: ['callPrice'],
                        }, {
                            model: Score,
                        }],
                        attributes: {
                            exclude: USER_ATTRIBUTE.EXCLUDE,
                        },
                    }]
                }],
                where: {
                    id: RoomId,
                    [Op.or]: [{
                        MeId: UserId,

                    }, {
                        YouId: UserId
                    }]
                }, transaction
            })
            return room
        } catch (err) {
            logger.error('getRoomOne')
            logger.error(err)
            return null
        }
    }

    static async findRoomOpponent(req: any, transaction: any) {
        try {
            const RoomId: number = req.body.RoomId
            const UserId: number = req.id
            const room = await Room.findOne({
                where: {
                    id: RoomId,
                }, transaction
            })
            if (!room) {
                return null
            }
            else if (UserId === room?.MeId) return room.YouId
            else if (UserId === room?.YouId) return room.MeId
        } catch (err) {
            logger.error('findRoomOpponent')
            logger.error(err)
            return null
        }
    }

    static async getRoomByCall(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const RoomId: number = req.body.RoomId
            const room = await Room.findOne({
                include: [{
                    model: UserRoom,
                    include: [{
                        model: User,
                        attributes: {
                            exclude: USER_ATTRIBUTE.EXCLUDE,
                        },
                    }]
                }],
                where: {
                    id: RoomId,
                    [Op.or]: [{
                        MeId: UserId,

                    }, {
                        YouId: UserId
                    }]
                }, transaction
            })
            return room
        } catch (err) {
            logger.error('getRoomByCall')
            logger.error(err)
            return null
        }
    }

    static async createRoomAdmin(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const cs: any = await User.findOne({
                where: {
                    roles: USER_ROLE.CS_USER
                }, transaction
            })
            if (!cs) return null
            let room: Room | null = await Room.findOne({
                where: {
                    [Op.or]: [{
                        [Op.and]: [
                            { MeId: cs.id },
                            { YouId: UserId }
                        ],
                    }, {
                        [Op.and]: [
                            { MeId: UserId },
                            { YouId: cs.id }
                        ],
                    }]
                },
                transaction
            })
            if (room) return room
            else {
                room = await Room.create({
                    MeId: UserId,
                    YouId: cs.id,
                }, { transaction })

                await UserRoom.create({
                    RoomId: room.id,
                    MyRoomId: room.id,
                    UserId,
                }, { transaction })
                await UserRoom.create({
                    RoomId: room.id,
                    MyRoomId: room.id,
                    UserId: cs.id,
                }, { transaction })
                return room
            }
        } catch (err) {
            logger.error('createRoomAdmin')
            logger.error(err)
            return null
        }
    }
    static async createRoom(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const YouId: number = req.body.YouId
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
            if (room) return room
            else {
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
                return room
            }
        } catch (err) {
            logger.error('createRoom')
            logger.error(err)
            return null
        }
    }
    static async getNotReadRoomCount(req: any) {
        try {
            const UserId: number = req?.id;
            if (!UserId) return 0
            const pageNum: number = 0;
            const pageSize: number = 100;
            const roomList: Room[] = await Room.findAll({
                subQuery: false,
                include: [{
                    subQuery: false,
                    model: Chat,
                    as: 'Chats',
                    order: [['createdAt', 'DESC']],
                    separate: true, // <--- Run separate query
                    limit: 1,
                    where: {
                        type: {
                            [Op.not]: CHAT_TYPE.CHAT_ALERT
                        }
                    }
                }, {
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
                where: { // 1 대1 채팅
                    [Op.or]: [{
                        MeId: UserId,

                    }, {
                        YouId: UserId,
                    }],
                    [Op.not]: {
                        lastChatDate: null
                    },
                    '$MyUserRoom.meShow$': true,
                },
                order: [['lastChatDate', 'DESC']],
                offset: Number(pageNum * pageSize),
                limit: Number(pageSize),
            })
            let count = 0
            roomList?.forEach((list: any) => {
                if (list?.Chats[0]?.id !== list?.MyUserRoom[0]?.meLastReadChatId) count++
            })
            return count
        } catch (err) {
            logger.error('getNotRoomReadCount')
            logger.error(err)
            return 0
        }
    }
    static async getMyRoomCs(UserId: number) {
        try {
            // const UserId: number = req.id
            // const pageNum: number = req.query.pageNum
            // const pageSize: number = req.query.pageSize

            const cs: any = await User.findOne({
                where: {
                    roles: USER_ROLE.CS_USER
                }
            })

            const roomList: Room[] = await Room.findAll({
                subQuery: false,
                include: [{
                    subQuery: false,
                    model: Chat,
                    as: 'Chats',
                    order: [['createdAt', 'DESC']],
                    separate: true, // <--- Run separate query
                    limit: 1,
                    where: {
                        type: {
                            [Op.not]: CHAT_TYPE.CHAT_ALERT
                        }
                    }
                }, {
                    limit: 2,
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
                        [Op.and]: [
                            {
                                MeId: {
                                    [Op.not]: cs.id
                                }
                            },
                            { YouId: UserId }
                        ],
                    }, {
                        [Op.and]: [
                            { MeId: UserId },
                            {
                                YouId: {
                                    [Op.not]: cs.id
                                }
                            }
                        ],
                    }],
                    [Op.not]: {
                        lastChatDate: null
                    },
                    '$MyUserRoom.meShow$': true,
                },
                order: [['lastChatDate', 'DESC']],
                offset: 0,// Number(pageNum * pageSize),
                limit: 100// Number(pageSize),
            })
            return roomList
        } catch (err) {
            logger.error('getMyRoomCs')
            logger.error(err)
            return []
        }
    }

    static async getMyRoom(req: any) {
        try {
            if (req.roles === USER_ROLE.CS_USER || req.roles === USER_ROLE.ADMIN_USER) {
                const UserId: number = req.id
                const pageNum: number = req.query.pageNum
                const pageSize: number = req.query.pageSize
                const cs = await User.findOne({
                    where: {
                        roles: USER_ROLE.CS_USER
                    }
                })
                if (!cs) return null
                const room: any = await Room.findAll({
                    subQuery: false,
                    include: [{
                        subQuery: false,
                        model: Chat,
                        as: 'Chats',
                        order: [['createdAt', 'DESC']],
                        separate: true, // <--- Run separate query
                        limit: 1,
                        where: {
                            type: {
                                [Op.not]: CHAT_TYPE.CHAT_ALERT
                            }
                        }
                    }, {
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
                            UserId: cs?.id,
                        }
                    }],
                    where: { // 1 대1 채팅 어드민
                        [Op.or]: [{
                            MeId: cs?.id,

                        }, {
                            YouId: cs?.id,
                        }],
                        [Op.not]: {
                            lastChatDate: null
                        },
                    },
                    order: [['lastChatDate', 'DESC']],
                    offset: Number(pageNum * pageSize),
                    limit: Number(pageSize),
                })
                return room
            } else {
                const UserId: number = req.id
                const pageNum: number = req.query.pageNum
                const pageSize: number = req.query.pageSize

                const cs: any = await User.findOne({
                    where: {
                        roles: USER_ROLE.CS_USER
                    }
                })

                const roomList: Room[] = await Room.findAll({
                    subQuery: false,
                    include: [{
                        subQuery: false,
                        model: Chat,
                        as: 'Chats',
                        order: [['createdAt', 'DESC']],
                        separate: true, // <--- Run separate query
                        limit: 1,
                        where: {
                            type: {
                                [Op.not]: CHAT_TYPE.CHAT_ALERT
                            }
                        }
                    }, {
                        limit: 2,
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
                            [Op.and]: [
                                {
                                    MeId: {
                                        [Op.not]: cs.id
                                    }
                                },
                                { YouId: UserId }
                            ],
                        }, {
                            [Op.and]: [
                                { MeId: UserId },
                                {
                                    YouId: {
                                        [Op.not]: cs.id
                                    }
                                }
                            ],
                        }],
                        [Op.not]: {
                            lastChatDate: null
                        },
                        '$MyUserRoom.meShow$': true,
                    },
                    order: [['lastChatDate', 'DESC']],
                    offset: Number(pageNum * pageSize),
                    limit: Number(pageSize),
                })
                return roomList
            }

        } catch (err) {
            logger.error('getMyRoom')
            logger.error(err)
            return []
        }
    }
    static async getMyRoomTransaction(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const pageNum: number = 0
            const pageSize: number = 20

            const cs: any = await User.findOne({
                where: {
                    roles: USER_ROLE.CS_USER
                }, transaction
            })

            const roomList: Room[] = await Room.findAll({
                subQuery: false,
                include: [{
                    subQuery: false,
                    model: Chat,
                    as: 'Chats',
                    order: [['createdAt', 'DESC']],
                    separate: true, // <--- Run separate query
                    limit: 1,
                    where: {
                        type: {
                            [Op.not]: CHAT_TYPE.CHAT_ALERT
                        }
                    }
                }, {
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
                where: { // 1 대1 채팅
                    /*[Op.or]: [{
                         MeId: UserId,
                     }, {
                         YouId: UserId,
                     }],*/
                    [Op.or]: [{
                        [Op.and]: [
                            {
                                MeId: {
                                    [Op.not]: cs.id
                                }
                            },
                            { YouId: UserId }
                        ],
                    }, {
                        [Op.and]: [
                            { MeId: UserId },
                            {
                                YouId: {
                                    [Op.not]: cs.id
                                }
                            }
                        ],
                    }],
                    [Op.not]: {
                        lastChatDate: null
                    },
                    '$MyUserRoom.meShow$': true,
                }, transaction,
                order: [['lastChatDate', 'DESC']],
                offset: Number(pageNum * pageSize),
                limit: Number(pageSize),
            })
            return roomList
        } catch (err) {
            logger.error('getMyRoom')
            logger.error(err)
            return []
        }
    }


    static async getMyRoomAdmin(req: any) {
        try {
            const UserId: number = req.id
            const cs = await User.findOne({
                where: {
                    roles: USER_ROLE.CS_USER
                }
            })
            if (!cs) return null

            const room: any = await Room.findOne({
                subQuery: false,
                include: [{
                    subQuery: false,
                    model: Chat,
                    as: 'Chats',
                    order: [['createdAt', 'DESC']],
                    separate: true, // <--- Run separate query
                    limit: 1,
                    where: {
                        type: {
                            [Op.not]: CHAT_TYPE.CHAT_ALERT
                        }
                    }
                }, {
                    model: UserRoom,
                    include: [{
                        model: User,
                        attributes: {
                            exclude: USER_ATTRIBUTE.EXCLUDE,
                        }
                    }]
                }],
                where: { // 1 대1 채팅 어드민
                    [Op.or]: [{
                        [Op.and]: [
                            { MeId: cs.id },
                            { YouId: UserId }
                        ],
                    }, {
                        [Op.and]: [
                            { MeId: UserId },
                            { YouId: cs.id }
                        ],
                    }]
                },
            })
            return room
        } catch (err) {
            logger.error('getMyRoomAdmin')
            logger.error(err)
            return []
        }
    }


    static async getMyRoomAdminTransaction(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const cs = await User.findOne({
                where: {
                    roles: USER_ROLE.CS_USER
                }, transaction
            })
            if (!cs) return null

            const room: any = await Room.findOne({
                subQuery: false,
                include: [{
                    subQuery: false,
                    model: Chat,
                    as: 'Chats',
                    order: [['createdAt', 'DESC']],
                    separate: true, // <--- Run separate query
                    limit: 1,
                    where: {
                        type: {
                            [Op.not]: CHAT_TYPE.CHAT_ALERT
                        }
                    },
                }, {

                    model: UserRoom,
                    include: [{
                        model: User,
                        attributes: {
                            exclude: USER_ATTRIBUTE.EXCLUDE,
                        }
                    }],
                    limit: 2,
                }],
                where: { // 1 대1 채팅 어드민
                    [Op.or]: [{
                        [Op.and]: [
                            { MeId: cs.id },
                            { YouId: UserId }
                        ],
                    }, {
                        [Op.and]: [
                            { MeId: UserId },
                            { YouId: cs.id }
                        ],
                    }]
                }, transaction
            })
            return room
        } catch (err) {
            logger.error('getMyRoomAdminTransaction')
            logger.error(err)
            return null
        }
    }


    static async getFromRoomAdmin(req: any, transaction: any) {
        try {
            const YouId: number = req.body.YouId
            const cs = await User.findOne({
                where: {
                    roles: USER_ROLE.CS_USER
                }
            })
            if (!cs) return null

            let room: any = await Room.findOne({
                subQuery: false,
                include: [{
                    subQuery: false,
                    model: Chat,
                    as: 'Chats',
                    order: [['createdAt', 'DESC']],
                    separate: true, // <--- Run separate query
                    limit: 1,
                    where: {
                        type: {
                            [Op.not]: CHAT_TYPE.CHAT_ALERT
                        }
                    }
                }, {
                    model: UserRoom,
                    include: [{
                        model: User,
                        attributes: {
                            exclude: USER_ATTRIBUTE.EXCLUDE,
                        }
                    }]
                }],
                where: { // 1 대1 채팅 어드민
                    [Op.or]: [{
                        [Op.and]: [
                            { MeId: cs.id },
                            { YouId: YouId }
                        ],
                    }, {
                        [Op.and]: [
                            { MeId: YouId },
                            { YouId: cs.id }
                        ],
                    }]
                }, transaction
            })
            if (room) return room
            else if (!room) {
                room = await Room.create({
                    MeId: YouId,
                    YouId: cs.id,
                }, { transaction })

                await UserRoom.create({
                    RoomId: room.id,
                    UserId: YouId,
                }, { transaction })
                await UserRoom.create({
                    RoomId: room.id,
                    UserId: cs.id,
                }, { transaction })
                return room
            }
        } catch (err) {
            logger.error('getFromRoomAdmin')
            logger.error(err)
            return null
        }

    }
}
export default RoomService
