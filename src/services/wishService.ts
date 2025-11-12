import { User, Container, sequelize, Wish } from '../models/index'
import bcrypt from 'bcrypt'
import { logger } from '../config/winston'
//import { PAYMENT_STATE } from '../constant/payment-constant'
import Sequelize from 'sequelize'
const Op = Sequelize.Op

class WishService {
    constructor() { }
    static async createWish(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const PostId: number = req.body.PostId

            const wish = await Wish.findOne({
                where: {
                    UserId,
                    PostId
                },
                transaction
            })
            if (wish) return
            const wishR = await Wish.create({
                UserId,
                PostId
            }, { transaction })

            return wishR
        } catch (err) {
            logger.error('createWish')
            logger.error(err)
            return null
        }
    }
    static async removeWish(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const PostId: number = req.body.PostId

            const wish: any = await Wish.findOne({
                where: {
                    UserId,
                    PostId,
                }, transaction
            })
            await Wish.destroy({
                where: {
                    UserId,
                    PostId
                },
                transaction
            })
            return wish.id
        } catch (err) {
            logger.error('removeWish')
            logger.error(err)
            return null
        }
    }
}
export default WishService
