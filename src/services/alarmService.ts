import { User, Container, sequelize, Alarm, AlarmSetting, Post } from '../models/index'
import bcrypt from 'bcrypt'
import { logger } from '../config/winston'
//import { PAYMENT_STATE } from '../constant/payment-constant'
import Sequelize, { HasMany, NUMBER, QueryTypes } from 'sequelize'
import { USER_ATTRIBUTE } from '../constant/user-constant'
import { ALARM_TYPE } from '../constant/alarm-constant'
import { errorLogGet } from '../api/middlewares/logCombine'
const Op = Sequelize.Op

class AlarmService {
    constructor() { }

    static async readAlarm(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const AlarmId: number = req.body.AlarmId
            await Alarm.update({
                read: true
            }, {
                where: {
                    UserId,
                    id: AlarmId
                }, transaction
            })
        } catch (err) {
            logger.error('readAlarm')
            logger.error(err)
            return null
        }
    }

    static async getMyAlarmSetting(req: any) {
        try {
            const UserId: number = req.id
            const alarmSetting: AlarmSetting | null = await AlarmSetting.findOne({
                where: {
                    UserId
                }
            })
            return alarmSetting
        } catch (err) {
            logger.error('getMyAlarmSetting')
            logger.error(err)
            return null
        }
    }
    static async getMyAlarm(req: any) {
        try {
            const pageNum: number = req.query.pageNum
            const pageSize: number = req.query.pageSize;
            const UserId: number = req.id

            const alarmList: any = await Alarm.findAll({
                subQuery: false,
                include: [{
                    model: User,
                    required: false,
                    attributes: {
                        exclude: USER_ATTRIBUTE.EXCLUDE
                    },
                    on: Sequelize.literal(`User.id = Alarm.YouId`)
                }],
                where: {
                    UserId,
                },
                order: [['createdAt', 'DESC']],
                offset: Number(pageNum * pageSize),
                limit: Number(pageSize),
            })


            return alarmList
        } catch (err) {
            logger.error('getMyAlarm')
            logger.error(err)
            return null
        }
    }



    static async updateAlarmSettingV2(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const comment: boolean = req.body.comment
            const news: boolean = req.body.news
            const gift: boolean = req.body.gift
            const call: boolean = req.body.call
            const chat: boolean = req.body.chat
            const follow: boolean = req.body.follow
            const post: boolean = req.body.post
            const creatorPush: boolean = req.body?.creatorPush

            if (creatorPush) {
                await AlarmSetting.update({
                    news,
                    comment,
                    gift,
                    call,
                    chat,
                    follow,
                    post,
                    creatorPush
                }, {
                    where: {
                        UserId
                    },
                    transaction
                })
            } else {
                await AlarmSetting.update({
                    news,
                    comment,
                    gift,
                    call,
                    chat,
                    follow,
                    post,
                }, {
                    where: {
                        UserId
                    },
                    transaction
                })
            }
            return true
        } catch (err) {
            logger.error('updateAlarmSettingV2')
            logger.error(err)
            return null
        }
    }


    static async updateAlarmSettingV3(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const comment: boolean = req.body.comment
            const news: boolean = req.body.news
            const gift: boolean = req.body.gift
            const call: boolean = req.body.call
            const chat: boolean = req.body.chat
            const follow: boolean = req.body.follow
            const post: boolean = req.body.post
            const creatorPush: boolean = req.body?.creatorPush
            await AlarmSetting.update({
                news,
                comment,
                gift,
                call,
                chat,
                follow,
                post,
                creatorPush
            }, {
                where: {
                    UserId
                },
                transaction
            })
            return true
        } catch (err) {
            logger.error('updateAlarmSettingV2')
            logger.error(err)
            return null
        }
    }

    static async updateAlarmSetting(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const comment: boolean = req.body.comment
            const news: boolean = req.body.news
            const gift: boolean = req.body.gift
            const call: boolean = req.body.call
            const chat: boolean = req.body.chat
            const follow: boolean = req.body.follow
            const post: boolean = req.body.post

            await AlarmSetting.update({
                news,
                comment,
                gift,
                call,
                chat,
                follow,
                post,
            }, {
                where: {
                    UserId
                },
                transaction
            })

            return true
        } catch (err) {
            logger.error('updateAlarmSetting')
            logger.error(err)
            return null
        }
    }
    static async createAlarm(type: number, content: string, YouId: number, UserId: number, PostId?: number, RoomId?: number, url?: string, transaction?: any) {
        try {
            await Alarm.create({
                type,
                content,
                YouId: UserId,
                UserId: YouId,
                PostId,
                RoomId,
                url,
                read: false,
            }, {
                transaction
            })
            return true
        } catch (err) {
            logger.error('createAlarm')
            logger.error(err)
            return null
        }

    }

}
export default AlarmService
