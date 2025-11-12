import { User, Container, sequelize, Rank, CallHistory, Score, CreatorAuth } from '../models/index'
import bcrypt from 'bcrypt'
import { logger } from '../config/winston'
//import { PAYMENT_STATE } from '../constant/payment-constant'
import Sequelize from 'sequelize'
import { USER_ATTRIBUTE, USER_ROLE } from '../constant/user-constant'
import { RANK_TYPE } from '../constant/rank-constant'
const Op = Sequelize.Op

class RankService {
    constructor() { }

    static async rankList(req: any) {
        try {
            const UserId: number = req.id
            const date: number = req.query.date
            const gender: number = req.query.gender
            const country: string = req.query.country
            const pageNum: number = req.query.pageNum
            const pageSize: number = req.query.pageSize

            let country_attr: any = {}
            let date_attr: any
            const now = new Date();

            if (Number(date) === Number(RANK_TYPE.RANK_TODAY)) {
                date_attr = new Date(now.setDate(now.getDate() - 1));
            } else if (Number(date) === Number(RANK_TYPE.RANK_WEEK)) {
                date_attr = new Date(now.setDate(now.getDate() - 7));
            } else if (Number(date) === RANK_TYPE.RANK_MONTH) {
                date_attr = new Date(now.setDate(now.getDate() - 30));
            } else date_attr = new Date(now.setDate(now.getDate() - 1));
            if (country === 'ko') {
                country_attr[Op.eq] = country
            } else {
                //애플 심사 거절 로직 대응
                //country_attr[Op.not] = 'ko'
                country_attr[Op.not] = null
            }
            const UserList: User[] = await User.findAll({
                subQuery: false,
                include: [{
                    model: CreatorAuth,
                    attributes: ['callPrice'],
                }, {
                    model: Score
                }, /*{
                    model: CallHistory,
                    as: 'CallHistoriesByCreatedAt',
                    required: true,
                },*//* {
                    // subQuery: false,
                    model: CallHistory,
                    as: 'CallHistories',
                    // limit: 1,
                    required: true,
                },*/ {
                    // separate: true,
                    model: User,
                    as: 'Banners',
                    where: {
                        id: UserId,
                    },
                    attributes: {
                        exclude: USER_ATTRIBUTE.EXCLUDE
                    },
                    required: false,
                }, {
                    // separate: true,
                    model: User,
                    as: 'Bannings',
                    where: {
                        id: UserId,
                    },
                    attributes: {
                        exclude: USER_ATTRIBUTE.EXCLUDE
                    },
                    required: false,
                }],
                where: {
                    '$Banners.id$': null,
                    '$Bannings.id$': null,
                    roles: USER_ROLE.NORMAL_USER,
                    gender,
                    // country: country_attr,
                    totalTime: {
                        [Op.gt]: 0,
                    }
                    /* 랭킹 지금은 전부다 보여주기
                    '$CallHistoriesByCreatedAt.createdAt$': {
                        [Op.gte]: date_attr
                    },*/
                },
                attributes: {
                    exclude: USER_ATTRIBUTE.EXCLUDE,
                    include: [
                        // [Sequelize.fn('SUM', Sequelize.col('CallHistories.time')), 'totalTime'],
                        //이친구 속도 너무 느림
                        //[Sequelize.fn('SUM', Sequelize.col('CallHistoriesByCreatedAt.time')), 'totalTimeByCreatedAt'],
                        // [Sequelize.fn('avg', Sequelize.col('CallHistories.time')), 'avgTime']
                    ],
                },
                // group: ['User.id'],
                order: [[sequelize.col("totalTime"), "DESC"]],
                offset: Number(pageNum * pageSize),
                limit: Number(pageSize),
            })
            return UserList
        } catch (err) {
            logger.error('rankList')
            logger.error(err)
            return []
        }
    }


    static async rankListFake(req: any) {
        try {
            const UserId: number = req.id
            const date: number = req.query.date
            const gender: number = req.query.gender
            const country: string = req.query.country
            const pageNum: number = req.query.pageNum
            const pageSize: number = req.query.pageSize

            let country_attr: any = {}
            let date_attr: any
            const now = new Date();

            if (Number(date) === Number(RANK_TYPE.RANK_TODAY)) {
                date_attr = new Date(now.setDate(now.getDate() - 1));
            } else if (Number(date) === Number(RANK_TYPE.RANK_WEEK)) {
                date_attr = new Date(now.setDate(now.getDate() - 7));
            } else if (Number(date) === RANK_TYPE.RANK_MONTH) {
                date_attr = new Date(now.setDate(now.getDate() - 30));
            } else date_attr = new Date(now.setDate(now.getDate() - 1));
            if (country === 'ko') {
                country_attr[Op.eq] = country
            } else {
                //애플 심사 거절 로직 대응
                //country_attr[Op.not] = 'ko'
                country_attr[Op.not] = null
            }
            const UserList: User[] = await User.findAll({
                subQuery: false,
                include: [{
                    model: CreatorAuth,
                    attributes: ['callPrice'],
                }, {
                    model: Score
                }, /*{
                    model: CallHistory,
                    as: 'CallHistoriesByCreatedAt',
                    required: true,
                }, {
                    model: CallHistory,
                    as: 'CallHistories',
                    required: true,
                },*/ {
                    model: User,
                    as: 'Banners',
                    where: {
                        id: UserId,
                    },
                    attributes: {
                        exclude: USER_ATTRIBUTE.EXCLUDE
                    },
                    required: false,
                }, {
                    model: User,
                    as: 'Bannings',
                    where: {
                        id: UserId,
                    },
                    attributes: {
                        exclude: USER_ATTRIBUTE.EXCLUDE
                    },
                    required: false,
                }],
                where: {
                    '$Banners.id$': null,
                    '$Bannings.id$': null,
                    roles: USER_ROLE.NORMAL_USER,
                    gender,
                    country: country_attr,
                    id: {
                        [Op.in]: [225, 5064, 34045, 6, 30287, 1006]
                    },
                    /* 랭킹 지금은 전부다 보여주기
                    '$CallHistoriesByCreatedAt.createdAt$': {
                        [Op.gte]: date_attr
                    },*/
                },
                attributes: {
                    exclude: USER_ATTRIBUTE.EXCLUDE,
                    include: [
                        // [Sequelize.fn('SUM', Sequelize.col('CallHistories.time')), 'totalTime'],
                        //이친구 속도 너무 느림
                        //[Sequelize.fn('SUM', Sequelize.col('CallHistoriesByCreatedAt.time')), 'totalTimeByCreatedAt'],
                        // [Sequelize.fn('avg', Sequelize.col('CallHistories.time')), 'avgTime']
                    ],
                },
                // group: ['User.id'],
                order: [[sequelize.col("totalTime"), "DESC"]],
                offset: Number(pageNum * pageSize),
                limit: Number(pageSize),
            })
            return UserList
        } catch (err) {
            logger.error('rankListFake')
            logger.error(err)
            return []
        }
    }
}
export default RankService

