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

export default (app: any, subdomain: any) => {
  if (process.env.DEV_MODE === 'production')
    app.use(subdomain('api', router))
  app.use('/', router)
  router.use((req, res, next) => {
    /* res.locals 값추가 가능*/
    next()
  })

  router.get('/real', async (req: any, res: any, next: any) => {
    try {
      //return res.status(200).sendFile(path.join(__dirname, '../../../../web/build/index.html'))
      return res.status(200).json({ status: 'true', real: true })
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })

  router.get('/*', async (req: any, res: any, next: any) => {
    try {
      //return res.status(200).sendFile(path.join(__dirname, '../../../../web/build/index.html'))
      return res.status(200).json({ status: 'true' })
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })





}
