import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import { AdsCount, Donation, Payment, Rank, User } from '../../models/index'
import sequelize from '../../models/sequelize'
import Sequelize from 'sequelize'
import passport from 'passport'
import axios from 'axios'
import { body, query } from 'express-validator';
import { validatorErrorChecker } from '../middlewares/validator'
import { authJWT, authAdminJWT } from '../middlewares/authJWT'
import { logger } from '../../config/winston'
import RankService from '../../services/rankService'
import { errorLogGet } from '../middlewares/logCombine'
import { COUNTRY_LIST } from '../../constant/country-constant'

const router = express.Router()
const Op = Sequelize.Op

export default (app: any, apiLimiter: any, subdomain: any) => {
    if (process.env.DEV_MODE === 'production')
        app.use(subdomain('api', router))
    app.use('/ads', router)
    app.use('/ads', apiLimiter)
    router.use((req, res, next) => {
        /* res.locals 값추가 가능*/
        next()
    })
    router.post('/addCount', [
        body('adCode').exists(),
        validatorErrorChecker
    ], async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const adCode = req.body.adCode
            const adsCount: any = await AdsCount.findOne({
                where: {
                    adCode,
                    year: new Date().getFullYear(),
                    month: new Date().getMonth() + 1,
                    day: new Date().getDate()
                }, transaction
            })
            if (adsCount) {
                await AdsCount.update({
                    count: adsCount.count + 1
                }, {
                    where: {
                        adCode,
                        year: new Date().getFullYear(),
                        month: new Date().getMonth() + 1,
                        day: new Date().getDate()
                    }, transaction
                })

            } else {
                await AdsCount.create({
                    count: 1,
                    adCode,
                    year: new Date().getFullYear(),
                    month: new Date().getMonth() + 1,
                    day: new Date().getDate()
                }, { transaction })
            }
            await transaction.commit()
            return res.status(200)
        } catch (err) {
            await transaction.rollback()
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


}
