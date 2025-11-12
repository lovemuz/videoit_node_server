import { User, Container, sequelize, Point, PointHistory, Money } from '../models/index'
import bcrypt from 'bcrypt'
import { logger } from '../config/winston'
//import { PAYMENT_STATE } from '../constant/payment-constant'
import Sequelize from 'sequelize'
import { POINT_ATTENDANCE } from '../constant/point-constant'
const Op = Sequelize.Op

class MoneyService {
    constructor() { }

    static async moneyIncrease(req: any, amount: number, transaction?: any) {
        try {
            const YouId: number = req.body.YouId
            await Money.increment({
                amount,
            }, {
                where: {
                    UserId: YouId
                }, transaction
            })
            return true
        } catch (err) {
            logger.error('moneyIncrease')
            logger.error(err)
            return null
        }
    }


}
export default MoneyService
