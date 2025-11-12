import { User, Container, sequelize, Exchange, Point, PointHistory, Account, Money, CreatorAuth } from '../models/index'
import bcrypt from 'bcrypt'
import { logger } from '../config/winston'
//import { PAYMENT_STATE } from '../constant/payment-constant'
import Sequelize from 'sequelize'
import { EXCHANGE_RATE, EXCHANGE_STATE, EXCHANGE_TYPE } from '../constant/exchange-constant'
import { POINT_HISTORY } from '../constant/point-constant'
const Op = Sequelize.Op

class ExchangeService {
    constructor() { }


    static async getMyAccount(req: any) {
        try {
            const UserId: number = req.id
            const account = await Account.findOne({
                where: {
                    UserId
                }
            })
            return account
        } catch (err) {
            logger.error('getMyAccount')
            logger.error(err)
            return null
        }
    }

    static async getExchageListByBeforeMonth(req: any) {
        try {
            const beforeDate = new Date();
            //const beforeFirstDay = new Date(beforeDate.getFullYear(), beforeDate.getMonth(), 1);
            //const befotreLastDay = new Date(beforeDate.getFullYear(), beforeDate.getMonth() + 1, 0);

            const beforeFirstDay = new Date(beforeDate.getFullYear(), beforeDate.getMonth() - 1, 1);
            const befotreLastDay = new Date(beforeDate.getFullYear(), beforeDate.getMonth(), 0);

            const exchageList: Exchange[] = await Exchange.findAll({
                where: {
                    state: EXCHANGE_STATE.EXCHANGE_SUCCESS,
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
            return exchageList
        } catch (err) {
            logger.error('getExchageListByBeforeMonth')
            logger.error(err)
            return null
        }
    }

    static async getExchageList(req: any) {
        try {
            const UserId: number = req.id
            const pageNum: number = req.query.pageNum
            const pageSize: number = req.query.pageSize

            const exchageList: Exchange[] = await Exchange.findAll({
                where: {
                    UserId,
                },
                order: [['createdAt', 'DESC']],
                offset: Number(pageNum * pageSize),
                limit: Number(pageSize),
            })
            return exchageList
        } catch (err) {
            logger.error('getExchangeList')
            logger.error(err)
            return null
        }
    }
    static async getExchageListByCS(req: any) {
        try {
            // const pageNum: number = req.query.pageNum
            // const pageSize: number = req.query.pageSize

            const exchageList: Exchange[] = await Exchange.findAll({
                include: [{
                    model: User,
                }],
                where: {
                    state: EXCHANGE_STATE.EXCHANGE_WAIT,
                },
                order: [['createdAt', 'DESC']],
                // offset: Number(pageNum * pageSize),
                // limit: Number(pageSize),
            })

            //하나로 묶는 과정 필요함
            const user = new Map()
            //registrationNumber 같은걸로 sum
            exchageList?.forEach((list: any, idx) => {
                // https://www.paypal.me/lovelycutesexy
                if (list?.typeBusiness === 2) {
                    const registrationNumber = `${list?.accountNumber}:${list?.UserId}`
                    if (!registrationNumber) return
                    if (!user.get(registrationNumber)) {
                        user.set(registrationNumber, [list.money, [list]])
                    } else {
                        user.set(registrationNumber, [
                            Math.floor(list.money + user.get(registrationNumber)[0]), user.get(registrationNumber)[1].concat(list)])
                    }
                } else {
                    const registrationNumber = `${list?.registrationNumber?.replace(/-/g, "")}:${list?.UserId}`
                    if (!registrationNumber) return
                    if (!user.get(registrationNumber)) {
                        user.set(registrationNumber, [list.money, [list]])
                    } else {
                        user.set(registrationNumber, [
                            Math.floor(list.money + user.get(registrationNumber)[0]), user.get(registrationNumber)[1].concat(list)])
                    }
                }
            })
            const arr = [...user.values()];
            return arr
        } catch (err) {
            logger.error('getExchageListByCS')
            logger.error(err)
            return null
        }
    }

    static async approveExchange(req: any, transaction: any) {
        try {
            const ExchangeId: number = req.body.ExchangeId
            await Exchange.update({
                state: EXCHANGE_STATE.EXCHANGE_SUCCESS,
            }, {
                where: {
                    id: ExchangeId,
                },
                transaction
            })

            return true
        } catch (err) {
            logger.error('approveExchange')
            logger.error(err)
            return null
        }
    }
    /*
    static async cancleExchange(req: any, transaction: any) {
        const UserId: number = req.id
        const ExchangeId: number = req.body.ExchangeId

        const exchange: any = await Exchange.findOne({
            where: {
                UserId,
                id: ExchangeId,
                state: EXCHANGE_STATE.EXCHANGE_WAIT,
            }, transaction
        })
        if (!exchange) return true

        const point: number = exchange.point

        await Exchange.update({
            state: EXCHANGE_STATE.EXCHANGE_FAIL,
        }, {
            where: {
                UserId,
                id: ExchangeId,
            },
            transaction
        })
        await Point.increment({
            amount: point,
        }, {
            where: {
                UserId,
            },
            transaction
        })
        await PointHistory.create({
            UserId,
            type: POINT_HISTORY.TYPE_EXCHANGE,
            plusOrMinus: POINT_HISTORY.PLUS,
            amount: point,
        }, { transaction })

        return true
    }
    */
    static async exchangeCancle(req: any, transaction: any) {
        try {
            const rejectionReason: number = req.body.rejectionReason
            const ExchangeId: number = req.body.ExchangeId

            const exchange: any = await Exchange.findOne({
                where: {
                    id: ExchangeId,
                    state: EXCHANGE_STATE.EXCHANGE_WAIT,
                }, transaction
            })
            if (!exchange) return true

            const point: number = exchange.point

            await Exchange.update({
                state: EXCHANGE_STATE.EXCHANGE_FAIL,
                rejectionReason,
            }, {
                where: {
                    UserId: exchange.UserId,
                    id: ExchangeId,
                },
                transaction
            })

            if (exchange.type === EXCHANGE_TYPE.EXCHANGE_POINT) {


                await Point.increment({
                    amount: point,
                }, {
                    where: {
                        UserId: exchange.UserId,
                    },
                    transaction
                })
                await PointHistory.create({
                    UserId: exchange.UserId,
                    type: POINT_HISTORY.TYPE_EXCHANGE,
                    plusOrMinus: POINT_HISTORY.PLUS,
                    amount: point,
                }, { transaction })

            } else if (exchange.type === EXCHANGE_TYPE.EXCHANGE_MONEY) {
                await Money.increment({
                    amount: point,
                }, {
                    where: {
                        UserId: exchange.UserId,
                    },
                    transaction
                })
            }
            return true
        } catch (err) {
            logger.error('exchangeCancel')
            logger.error(err)
            return null
        }
    }
    static async applyExchange(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const typeBusiness: number = req.body.typeBusiness
            const type: number = req.body.type
            const point: number = req.body.point
            const accountName: string = req.body.accountName
            const accountNumber: string = req.body.accountNumber
            const registrationName: string = req.body.registrationName
            const registrationNumber: string = req.body.registrationNumber
            const accountCode: string = req.body.accountCode
            let money: number = 0
            //
            const creatorAuth: any = await CreatorAuth.findOne({
                where: {
                    UserId
                }, transaction
            })
            if (type === EXCHANGE_TYPE.EXCHANGE_MONEY) {
                if (typeBusiness === 0) {
                    //주민등록번호
                    money = point * (100 - creatorAuth.platformSubscribeCharge) * 0.01
                }
                else if (typeBusiness === 1) {
                    //사업자
                    money = point * (100 - creatorAuth.platformSubscribeCharge) * 0.01
                } else if (typeBusiness === 2) {
                    // 외국인
                    money = point * (100 - creatorAuth.platformSubscribeCharge) * 0.01
                }
            } else if (EXCHANGE_TYPE.EXCHANGE_POINT) {
                if (typeBusiness === 0) {
                    //주민등록번호
                    money = point * (100 - creatorAuth.platformPointCharge) * 0.01
                }
                else if (typeBusiness === 1) {
                    //사업자
                    money = point * (100 - creatorAuth.platformPointCharge) * 0.01
                } else if (typeBusiness === 2) {
                    //외국인
                    money = point * (100 - creatorAuth.platformPointCharge) * 0.01
                }
            }
            money = Math.ceil(money)
            await Account.update({
                type: typeBusiness,
                accountName,
                accountNumber,
                accountCode,
                registrationName,
                registrationNumber,
            }, {
                where: {
                    UserId,
                }, transaction
            })
            const exchange = await Exchange.create({
                type,
                typeBusiness,
                state: EXCHANGE_STATE.EXCHANGE_WAIT,
                UserId,
                point,
                money,
                accountName,
                accountNumber,
                accountCode,
                registrationName,
                registrationNumber,
            }, {
                transaction
            })
            if (type === EXCHANGE_TYPE.EXCHANGE_MONEY) {
                await Money.decrement({
                    amount: point,
                }, {
                    where: {
                        UserId,
                    },
                    transaction
                })
            } else if (type === EXCHANGE_TYPE.EXCHANGE_POINT) {
                await Point.decrement({
                    amount: point,
                }, {
                    where: {
                        UserId,
                    },
                    transaction
                })
                await PointHistory.create({
                    UserId,
                    type: POINT_HISTORY.TYPE_EXCHANGE,
                    plusOrMinus: POINT_HISTORY.MINUS,
                    amount: point,
                }, { transaction })
            }

            return exchange
        } catch (err) {
            logger.error('applyExchange')
            logger.error(err)
            return null
        }
    }
}
export default ExchangeService
