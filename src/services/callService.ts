import { User, Container, sequelize, Declaration, CallHistory, CreatorAuth } from '../models/index'
import bcrypt from 'bcrypt'
import { logger } from '../config/winston'
//import { PAYMENT_STATE } from '../constant/payment-constant'
import Sequelize from 'sequelize'
const Op = Sequelize.Op

class CallService {
    constructor() { }


    static async getMyCreatorAuth(req: any) {
        try {
            const UserId: number = req.id
            const creatorAuth = await CreatorAuth.findOne({
                where: {
                    UserId
                }
            })
            return creatorAuth
        } catch (err) {
            logger.error('getMyCallPrice')
            logger.error(err)
            return null
        }
    }


    static async changeCallPrice(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const callPrice: number = req.body.callPrice
            await CreatorAuth.update({
                callPrice
            }, {
                where: {
                    UserId
                }, transaction
            })
            return true
        } catch (err) {
            logger.error('changeCallPrice')
            logger.error(err)
            return false
        }
    }

    static async createCallHistory(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const time: number = req.body.time
            await CallHistory.create({
                time,
                UserId,
                UserIdByCreatedAt: UserId
            }, { transaction })
            return
        } catch (err) {
            logger.error('createCallHistory')
            logger.error(err)
            return null
        }
    }
}
export default CallService
