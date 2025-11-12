import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import { User } from '../../models/index'
import Sequelize from 'sequelize'
import passport from 'passport'
import axios from 'axios'
import { body } from 'express-validator';
import { validatorErrorChecker } from '../middlewares/validator'
import { authJWT, authAdminJWT } from '../middlewares/authJWT'
import { logger } from '../../config/winston'
import { errorLogGet } from '../middlewares/logCombine'

const router = express.Router()
const Op = Sequelize.Op

export default (app: any, apiLimiter: any, subdomain: any) => {
    if (process.env.DEV_MODE === 'production')
        app.use(subdomain('onelink', router))

    app.use('/c', router)
    // app.use('/c', apiLimiter)

    router.use((req, res, next) => {
        /* res.locals 값추가 가능*/
        next()
    })

    router.get('/:adcode', async (req: any, res: any, next: any) => {
        try {
            const adcode = req.query?.adcode
            const url = `https://nmoment.onelink.me/xLAx?af_xp=custom&pid=user_referrer&af_dp=nmoment%3A%2F%2F&c=nmoment_referrer&deep_link_value=adcode&deep_link_sub1=${adcode}`
            return res.redirect(url)
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


}
