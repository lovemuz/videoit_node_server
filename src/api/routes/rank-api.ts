import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import { Donation, Payment, Rank, User } from '../../models/index'
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
    app.use('/rank', router)
    app.use('/rank', apiLimiter)
    router.use((req, res, next) => {
        /* res.locals 값추가 가능*/
        next()
    })
    router.get('/rankList', [
        query('date').exists(),
        query('gender').exists(),
        query('country').exists(),
        query('pageNum').exists(),
        query('pageSize').exists(),
        query('platform').optional(),
        query('APP_VERSION').optional(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {


            const { country, platform, APP_VERSION } = req.query
            if (req?.id === 6 || (country === COUNTRY_LIST.미국 &&
                String(process.env.APP_VERSION) >= String(APP_VERSION) &&
                /*platform === 'android' ||*/ platform === 'ios')) {
                const rankList = await RankService.rankListFake(req)
                rankList.forEach((ele: any) => {
                    const totalScoreLength = ele?.Score?.score1 + ele?.Score?.score2 + ele?.Score?.score3 + ele?.Score?.score4 + ele?.Score?.score5
                    const totalScore = ele?.Score?.score1 * 1 + ele?.Score?.score2 * 2 + ele?.Score?.score3 * 3 + ele?.Score?.score4 * 4 + ele?.Score?.score5 * 5
                    ele['dataValues'].avgScore = totalScore / totalScoreLength
                })
                return res.status(200).json({ rankList })
            }
            const rankList = await RankService.rankList(req)
            rankList.forEach((ele: any) => {
                const totalScoreLength = ele?.Score?.score1 + ele?.Score?.score2 + ele?.Score?.score3 + ele?.Score?.score4 + ele?.Score?.score5
                const totalScore = ele?.Score?.score1 * 1 + ele?.Score?.score2 * 2 + ele?.Score?.score3 * 3 + ele?.Score?.score4 * 4 + ele?.Score?.score5 * 5
                ele['dataValues'].avgScore = totalScore / totalScoreLength
            })
            return res.status(200).json({ rankList })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

}
