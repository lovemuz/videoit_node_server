import { User, Container, sequelize, Score } from '../models/index'
import bcrypt from 'bcrypt'
import { logger } from '../config/winston'
//import { PAYMENT_STATE } from '../constant/payment-constant'
import Sequelize from 'sequelize'
import { SCORE_TIME } from '../constant/score-constant'
const Op = Sequelize.Op

class ScoreService {
    constructor() { }
    static async updateScore(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const YouId: number = req.body.YouId
            const score: number = req.body.score
            //const score

            const myScore = await Score.findOne({
                where: {
                    UserId: YouId
                }, transaction
            })
            if (score === 1) {
                await Score.increment({
                    score1: 1,
                }, {
                    where: {
                        UserId: YouId,
                        id: myScore?.id,
                    }, transaction
                })
            } else if (score === 2) {
                await Score.increment({
                    score2: 1,
                }, {
                    where: {
                        UserId: YouId,
                        id: myScore?.id,
                    }, transaction
                })
            } else if (score === 3) {
                await Score.increment({
                    score3: 1,
                }, {
                    where: {
                        UserId: YouId,
                        id: myScore?.id,
                    }, transaction
                })
            } else if (score === 4) {
                await Score.increment({
                    score4: 1,
                }, {
                    where: {
                        UserId: YouId,
                        id: myScore?.id,
                    }, transaction
                })
            } else if (score === 5) {
                await Score.increment({
                    score5: 1,
                }, {
                    where: {
                        UserId: YouId,
                        id: myScore?.id,
                    }, transaction
                })
            }
            return true
        } catch (err) {
            logger.error('updateScore')
            logger.error(err)
            return null
        }
    }
    static async updateTime(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const time: number = req.body.time

            if (time < SCORE_TIME.TIME1) {
                await Score.increment({
                    time1: 1,
                }, {
                    where: {
                        UserId,
                        //id: score?.id,
                    }, transaction
                })
            } else if (time < SCORE_TIME.TIME2) {
                await Score.increment({
                    time2: 1,
                }, {
                    where: {
                        UserId,
                        //id: score?.id,
                    }, transaction
                })
            }
            else if (time < SCORE_TIME.TIME3) {
                await Score.increment({
                    time3: 1,
                }, {
                    where: {
                        UserId,
                        //id: score?.id,
                    }, transaction
                })
            } else if (time >= SCORE_TIME.TIME3) {
                await Score.increment({
                    time4: 1,
                }, {
                    where: {
                        UserId,
                        //id: score?.id,
                    }, transaction
                })
            }
            return true
        } catch (err) {
            logger.error('updateTime')
            logger.error(err)
            return null
        }
    }
}
export default ScoreService
