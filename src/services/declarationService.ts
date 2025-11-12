import { User, Container, sequelize, Declaration } from '../models/index'
import bcrypt from 'bcrypt'
import { logger } from '../config/winston'
//import { PAYMENT_STATE } from '../constant/payment-constant'
import Sequelize from 'sequelize'
const Op = Sequelize.Op

class DeclarationService {
    constructor() { }

    static async createDeclaration(req: any, transaction: any) {
        try {
            const UserId: number = req.body.UserId
            const PostId: number = req.body.PostId
            const RoomId: number = req.body.RoomId
            const url: string = req.body.url
            const type: number = req.body.type

            await Declaration.create({
                UserId,
                PostId,
                RoomId,
                url,
                type
            }, { transaction })
        } catch (err) {
            logger.error('createDeclaration')
            logger.error(err)
            return null
        }
    }
}
export default DeclarationService
