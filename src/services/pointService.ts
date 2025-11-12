import { User, Container, sequelize, Point, PointHistory, Money } from '../models/index'
import bcrypt from 'bcrypt'
import { logger } from '../config/winston'
//import { PAYMENT_STATE } from '../constant/payment-constant'
import Sequelize from 'sequelize'
import { POINT_ATTENDANCE, POINT_HISTORY } from '../constant/point-constant'
import { USER_GENDER } from '../constant/user-constant'
const Op = Sequelize.Op

class PointService {
    constructor() { }


    static async getMyMoney(req: any, transaction?: any) {
        try {
            const UserId: number = req.id
            if (transaction) {
                const money: Money | null = await Money.findOne({
                    where: {
                        UserId,
                    }, transaction
                })
                return money
            } else {
                const money: Money | null = await Money.findOne({
                    where: {
                        UserId,
                    }
                })
                return money
            }

        } catch (err) {
            logger.error('getMyMoney')
            logger.error(err)
            return null
        }
    }
    static async getMyPoint(req: any, transaction?: any) {
        try {
            const UserId: number = req.id
            if (transaction) {
                const point: Point | null = await Point.findOne({
                    where: {
                        UserId,
                    }, transaction
                })
                return point
            } else {
                const point: Point | null = await Point.findOne({
                    where: {
                        UserId,
                    }
                })
                return point
            }
        } catch (err) {
            logger.error('getMyPoint')
            logger.error(err)
            return null
        }

    }
    static async getPoint(UserId: number, transaction?: any) {
        try {
            if (transaction) {
                const point: Point | null = await Point.findOne({
                    where: {
                        UserId,
                    }, transaction
                })
                return point
            } else {
                const point: Point | null = await Point.findOne({
                    where: {
                        UserId,
                    }
                })
                return point
            }
        } catch (err) {
            logger.error('getPoint')
            logger.error(err)
            return null
        }
    }
    static async increaseYouPoint(UserId: any, amount: number, transaction: any) {
        try {
            await Point.increment({
                amount
            }, {
                where: {
                    UserId,
                }, transaction
            })
            await PointHistory.create({
                type: POINT_HISTORY.TYPE_CALL,
                amount,
                plusOrMinus: POINT_HISTORY.PLUS,
                UserId,
            }, { transaction })
            return true
        } catch (err) {
            logger.error('increaseYourPoint')
            logger.error(err)
            return null
        }
    }


    static async increaseUserPoint(UserId: any, amount: number, transaction: any) {
        try {
            await Point.increment({
                amount
            }, {
                where: {
                    UserId,
                }, transaction
            })
            /*
            await PointHistory.create({
                type: POINT_HISTORY.TYPE_PAYMENT,
                amount,
                plusOrMinus: POINT_HISTORY.PLUS,
                UserId,
            }, { transaction })
            */
            return true
        } catch (err) {
            logger.error('increaseUserPoint')
            logger.error(err)
            return null
        }
    }
    static async decreaseUserPoint(UserId: any, amount: number, transaction: any) {
        try {
            await Point.decrement({
                amount
            }, {
                where: {
                    UserId,
                }, transaction
            })
            /*
            await PointHistory.create({
                type: POINT_HISTORY.TYPE_PAYMENT,
                amount,
                plusOrMinus: POINT_HISTORY.MINUS,
                UserId,
            }, { transaction })
            */
            return true
        } catch (err) {
            logger.error('decreaseUserPoint')
            logger.error(err)
            return null
        }
    }

    static async increasePoint(req: any, amount: number, transaction: any) {
        try {
            const UserId: number = req.id
            await Point.increment({
                amount
            }, {
                where: {
                    UserId,
                }, transaction
            })
            await PointHistory.create({
                type: POINT_HISTORY.TYPE_PAYMENT,
                amount,
                plusOrMinus: POINT_HISTORY.PLUS,
                UserId,
            }, { transaction })
            return true
        } catch (err) {
            logger.error('increasePoint')
            logger.error(err)
            return null
        }
    }
    static async decreasePoint(req: any, amount: number, transaction: any) {
        try {
            const UserId: number = req.id
            await Point.decrement({
                amount
            }, {
                where: {
                    UserId,
                }, transaction
            })
            await PointHistory.create({
                type: POINT_HISTORY.TYPE_CALL,
                amount,
                plusOrMinus: POINT_HISTORY.MINUS,
                UserId,
            }, { transaction })
            return true
        } catch (err) {
            logger.error('decreasePoint')
            logger.error(err)
            return null
        }
    }
    static async decreasePointByChat(req: any, amount: number, transaction: any) {
        try {
            const UserId: number = req.id
            await Point.decrement({
                amount
            }, {
                where: {
                    UserId,
                }, transaction
            })
            await PointHistory.create({
                type: POINT_HISTORY.TYPE_CHAT,
                amount,
                plusOrMinus: POINT_HISTORY.MINUS,
                UserId,
            }, { transaction })
            return true
        } catch (err) {
            logger.error('decreasePointByChat')
            logger.error(err)
            return null
        }
    }
    static async getHistory(req: any) {
        try {
            const UserId: number = req.id
            const pageNum: number = req.query.pageNum
            const pageSize: number = req.query.pageSize

            const pointHistory: PointHistory[] = await PointHistory.findAll({
                where: {
                    UserId
                },
                order: [['createdAt', 'DESC']],
                offset: Number(pageNum * pageSize),
                limit: Number(pageSize),
            })
            return pointHistory
        } catch (err) {
            logger.error('getHistory')
            logger.error(err)
            return null
        }
    }

    static async attendanceCheck(req: any, transaction: any) {
        try {
            const UserId: number = req.id

            const user = await User.findOne({
                where: {
                    id: UserId
                }, transaction
            })
            if (user?.gender === USER_GENDER.BOY) {
                await Point.increment({
                    amount: POINT_ATTENDANCE.BOY
                }, {
                    where: {
                        UserId,
                    }, transaction
                })
                await PointHistory.create({
                    UserId,
                    type: POINT_HISTORY.TYPE_ATTENDANCE,
                    plusOrMinus: POINT_HISTORY.PLUS,
                    amount: POINT_ATTENDANCE.BOY,
                }, { transaction })
                return true
            } else if (user?.gender === USER_GENDER.GIRL) {
                await Point.increment({
                    amount: POINT_ATTENDANCE.GIRL
                }, {
                    where: {
                        UserId,
                    }, transaction
                })
                await PointHistory.create({
                    UserId,
                    type: POINT_HISTORY.TYPE_ATTENDANCE,
                    plusOrMinus: POINT_HISTORY.PLUS,
                    amount: POINT_ATTENDANCE.GIRL,
                }, { transaction })
                return true
            }

        } catch (err) {
            logger.error('attendanceCheck')
            logger.error(err)
            return null
        }
    }


}
export default PointService
