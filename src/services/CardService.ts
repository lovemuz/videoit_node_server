import { Card, User } from '../models/index'
import bcrypt from 'bcrypt'
import { logger } from '../config/winston'
import { awsSimpleEmailService } from '../api/middlewares/aws'

class CardService {
    constructor() { }

    static async getMyCard(req: any) {
        try {
            const UserId: number = req.id
            const card = await Card.findOne({
                where: {
                    UserId
                }
            })
            return card
        } catch (err) {
            logger.error('getMyCard')
            logger.error(err)
            return null
        }
    }

    //saveCardInfoByPaypal
    static async saveCardInfoByPaypal(req: any, transaction: any, billkey: string) {
        try {
            const UserId: number = req.id
            await Card.update({
                billkeyForeign: billkey,
            }, {
                where: {
                    UserId,
                }, transaction
            })
            return true
        } catch (err) {
            logger.error('saveCardInfo')
            logger.error(err)
            return null
        }
    }
    static async saveCardInfo(req: any, transaction: any, billkey?: string) {
        try {
            const UserId: number = req.id
            const { cardNumber, cardValidationYear, cardValidationMonth, name, email, phoneNumber, YouId, FanStepId } = req.body
            if (billkey) {
                await Card.update({
                    card_number: cardNumber,
                    expiry: `${cardValidationMonth}${cardValidationYear}`,
                    phone: phoneNumber,
                    email,
                    name,
                    billkeyKorean_HK: billkey,
                    //billkeyForeign: billkey,
                }, {
                    where: {
                        UserId,
                    }, transaction
                })
            } else {
                await Card.update({
                    card_number: cardNumber,
                    expiry: `${cardValidationMonth}${cardValidationYear}`,
                    phone: phoneNumber,
                    email,
                    name,
                }, {
                    where: {
                        UserId,
                    }, transaction
                })
            }

            return true
        } catch (err) {
            logger.error('saveCardInfo')
            logger.error(err)
            return null
        }
    }

}
export default CardService