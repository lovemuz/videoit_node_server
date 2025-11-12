import { User, Container, sequelize, Item, Point, PointHistory } from '../models/index'
import bcrypt from 'bcrypt'
import { logger } from '../config/winston'
//import { PAYMENT_STATE } from '../constant/payment-constant'
import Sequelize from 'sequelize'
import { ITEM_LIST } from '../constant/item-constant'
import { POINT_HISTORY } from '../constant/point-constant'
const Op = Sequelize.Op

class ItemService {
    constructor() { }
    static async getMyItem(req: any) {
        try {
            const UserId: number = req.id

            const item: Item | null = await Item.findOne({
                where: {
                    UserId,
                }
            })
            return item
        } catch (err) {
            logger.error('getMyItem')
            logger.error(err)
            return null
        }
    }




    static async purchaseItem(req: any, point: any, transaction: any) {
        try {
            const UserId: number = req.id
            const code: string = req.body.code
            const count: number = req.body.count
            let price: number

            let candy_count_attr = 0
            let cake_count_attr = 0
            let crown_count_attr = 0
            let heart_count_attr = 0
            let ring_count_attr = 0
            let rose_count_attr = 0

            if (ITEM_LIST.ITEM_CAKE.code === code) {
                price = ITEM_LIST.ITEM_CAKE.price
                cake_count_attr = 1
            } else if (ITEM_LIST.ITEM_CANDY.code === code) {
                price = ITEM_LIST.ITEM_CANDY.price
                candy_count_attr = 1
            }
            else if (ITEM_LIST.ITEM_CROWN.code === code) {
                price = ITEM_LIST.ITEM_CROWN.price
                crown_count_attr = 1
            }
            else if (ITEM_LIST.ITEM_HEART.code === code) {
                price = ITEM_LIST.ITEM_HEART.price
                heart_count_attr = 1
            } else if (ITEM_LIST.ITEM_RING.code === code) {
                price = ITEM_LIST.ITEM_RING.price
                ring_count_attr = 1
            } else if (ITEM_LIST.ITEM_ROSE.code === code) {
                price = ITEM_LIST.ITEM_ROSE.price
                rose_count_attr = 1
            } else {
                //오류 경우
                price = point.amount * 2
            }
            if (price * count > point.amount) {
                return false
            } else {
                await Item.increment({
                    candy_count: candy_count_attr * count,
                    rose_count: rose_count_attr * count,
                    cake_count: cake_count_attr * count,
                    ring_count: ring_count_attr * count,
                    crown_count: crown_count_attr * count,
                    heart_count: heart_count_attr * count,
                }, {
                    where: {
                        UserId
                    }, transaction
                })
                await Point.decrement({
                    amount: price * count
                }, {
                    where: {
                        UserId
                    }, transaction
                })
                await PointHistory.create({
                    type: POINT_HISTORY.TYPE_GIFT,
                    plusOrMinus: POINT_HISTORY.MINUS,
                    amount: price * count,
                    UserId
                }, { transaction })
                const item = await Item.findOne({
                    where: {
                        UserId,
                    },
                    transaction
                })
                return item

            }
        } catch (err) {
            logger.error('purchaseItem')
            logger.error(err)
            return null
        }
    }




    static async giftItem(req: any, point: Point, transaction: any) {
        try {
            const UserId: number = req.id
            const YouId: number = req.body.YouId
            const code: string = req.body.code
            const count: number = req.body.count

            let itemCount: number = 0
            let price: number = 2147483647
            const itemChk: any = await Item.findOne({
                where: {
                    UserId
                }, transaction
            })
            let candy_count_attr = 0
            let cake_count_attr = 0
            let crown_count_attr = 0
            let heart_count_attr = 0
            let ring_count_attr = 0
            let rose_count_attr = 0
            if (ITEM_LIST.ITEM_CAKE.code === code) {
                price = ITEM_LIST.ITEM_CAKE.price
                itemCount = itemChk.cake_count
                cake_count_attr = 1
            } else if (ITEM_LIST.ITEM_CANDY.code === code) {
                price = ITEM_LIST.ITEM_CANDY.price
                itemCount = itemChk.candy_count
                candy_count_attr = 1
            }
            else if (ITEM_LIST.ITEM_CROWN.code === code) {
                price = ITEM_LIST.ITEM_CROWN.price
                itemCount = itemChk.crown_count
                crown_count_attr = 1
            }
            else if (ITEM_LIST.ITEM_HEART.code === code) {
                price = ITEM_LIST.ITEM_HEART.price
                itemCount = itemChk.heart_count
                heart_count_attr = 1
            } else if (ITEM_LIST.ITEM_RING.code === code) {
                price = ITEM_LIST.ITEM_RING.price
                itemCount = itemChk.ring_count
                ring_count_attr = 1
            } else if (ITEM_LIST.ITEM_ROSE.code === code) {
                price = ITEM_LIST.ITEM_ROSE.price
                itemCount = itemChk.rose_count
                rose_count_attr = 1
            }


            if (count > itemCount) {
                return [false, null]
            } else {
                logger.error(1)
                await Item.decrement({
                    candy_count: candy_count_attr * count,
                    rose_count: rose_count_attr * count,
                    cake_count: cake_count_attr * count,
                    ring_count: ring_count_attr * count,
                    crown_count: crown_count_attr * count,
                    heart_count: heart_count_attr * count,
                }, {
                    where: {
                        UserId
                    }, transaction
                })
                await Point.increment({
                    amount: price * count
                }, {
                    where: {
                        UserId: YouId
                    }, transaction
                })
                await PointHistory.create({
                    type: POINT_HISTORY.TYPE_GIFT,
                    plusOrMinus: POINT_HISTORY.PLUS,
                    amount: price * count,
                    UserId: YouId
                }, { transaction })
                const item = await Item.findOne({
                    where: {
                        UserId,
                    },
                    transaction
                })
                return [item, price * count]
            }
        } catch (err) {
            logger.error('giftItem')
            logger.error(err)
            return [null, null]
        }
    }

    static async reverseItem(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const code: string = req.body.code
            const count: number = req.body.count
            let itemCount: number = 0
            let price: number = 2147483647

            const itemChk: any = await Item.findOne({
                where: {
                    UserId
                }, transaction
            })

            let candy_count_attr = 0
            let cake_count_attr = 0
            let crown_count_attr = 0
            let heart_count_attr = 0
            let ring_count_attr = 0
            let rose_count_attr = 0

            if (ITEM_LIST.ITEM_CAKE.code === code) {
                price = ITEM_LIST.ITEM_CAKE.price
                itemCount = itemChk.cake_count
                cake_count_attr = 1
            } else if (ITEM_LIST.ITEM_CANDY.code === code) {
                price = ITEM_LIST.ITEM_CANDY.price
                itemCount = itemChk.candy_count
                candy_count_attr = 1
            }
            else if (ITEM_LIST.ITEM_CROWN.code === code) {
                price = ITEM_LIST.ITEM_CROWN.price
                itemCount = itemChk.crown_count
                crown_count_attr = 1
            }
            else if (ITEM_LIST.ITEM_HEART.code === code) {
                price = ITEM_LIST.ITEM_HEART.price
                itemCount = itemChk.heart_count
                heart_count_attr = 1
            } else if (ITEM_LIST.ITEM_RING.code === code) {
                price = ITEM_LIST.ITEM_RING.price
                itemCount = itemChk.ring_count
                ring_count_attr = 1
            } else if (ITEM_LIST.ITEM_ROSE.code === code) {
                price = ITEM_LIST.ITEM_ROSE.price
                itemCount = itemChk.rose_count
                rose_count_attr = 1
            }
            if (count > itemCount) {
                return false
            } else {
                await Item.decrement({
                    candy_count: candy_count_attr * count,
                    rose_count: rose_count_attr * count,
                    cake_count: cake_count_attr * count,
                    ring_count: ring_count_attr * count,
                    crown_count: crown_count_attr * count,
                    heart_count: heart_count_attr * count,
                }, {
                    where: {
                        UserId
                    }, transaction
                })
                await Point.increment({
                    amount: price * count
                }, {
                    where: {
                        UserId
                    }, transaction
                })
                await PointHistory.create({
                    type: POINT_HISTORY.TYPE_GIFT,
                    plusOrMinus: POINT_HISTORY.PLUS,
                    amount: price * count,
                    UserId
                }, { transaction })
                const item = await Item.findOne({
                    where: {
                        UserId,
                    },
                    transaction
                })
                return item
            }
        } catch (err) {
            logger.error('reverseItem')
            logger.error(err)
            return null
        }
    }
}
export default ItemService
