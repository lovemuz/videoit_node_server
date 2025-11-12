import { User, Container, sequelize, Ban, Follow } from '../models/index'
import bcrypt from 'bcrypt'
import { logger } from '../config/winston'
//import { PAYMENT_STATE } from '../constant/payment-constant'
import Sequelize from 'sequelize'
const Op = Sequelize.Op

class BanService {
    constructor() { }
    static async getPaymentPriceList() {
    }

    static async removeBan(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const YouId: number = req.body.YouId

            await Ban.destroy({
                where: {
                    banningId: YouId,
                    bannerId: UserId,

                }
                , transaction
            })

            return true
        } catch (err) {
            logger.error('removeBan')
            logger.error(err)
            return null
        }
    }

    static async createBan(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const YouId: number = req.body.YouId

            const ban = await Ban.findOne({
                where: {
                    [Op.or]: [{
                        [Op.and]: [
                            { banningId: UserId },
                            { bannerId: YouId }
                        ],
                    }, {
                        [Op.and]: [
                            { banningId: YouId },
                            { bannerId: UserId },
                        ]
                    }]
                }
                , transaction
            })
            if (!ban) {
                await Ban.create({
                    bannerId: UserId,
                    banningId: YouId
                }, { transaction })
            }

            await Follow.destroy({
                where: {
                    followerId: UserId,
                    followingId: YouId
                },
                transaction
            })
            await Follow.destroy({
                where: {
                    followerId: YouId,
                    followingId: UserId
                },
                transaction
            })

            return true
        } catch (err) {
            logger.error('createBan')
            logger.error(err)
            return null
        }
    }
    static async checkBan(req: any, YouId: number, transaction?: any) {
        try {
            const UserId: number = req.id
            let ban

            if (transaction) {
                ban = await Ban.findOne({
                    where: {
                        [Op.or]: [{
                            [Op.and]: [
                                { banningId: UserId },
                                { bannerId: YouId }
                            ],
                        }, {
                            [Op.and]: [
                                { banningId: YouId },
                                { bannerId: UserId },
                            ]
                        }]
                    }, transaction
                })
            } else {
                ban = await Ban.findOne({
                    where: {
                        [Op.or]: [{
                            [Op.and]: [
                                { banningId: UserId },
                                { bannerId: YouId }
                            ],
                        }, {
                            [Op.and]: [
                                { banningId: YouId },
                                { bannerId: UserId },
                            ]
                        }]
                    }
                })
            }
            if (ban) return true
            else return false
        } catch (err) {
            logger.error('checkBan')
            logger.error(err)
            return null
        }
    }
}
export default BanService
