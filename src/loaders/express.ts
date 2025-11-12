import express from 'express'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import path from 'path'
import session from 'express-session'
//import nunjucks from 'nunjucks'
import dotenv from 'dotenv'
import helmet from 'helmet'
import cors from 'cors'
import hpp from 'hpp'
import passport from 'passport'
import passportConfig from '../passport'
import { logger, stream } from '../config/winston'
import router from '../api/index'
//import { swaggerUi, specs } from '../swagger/swagger'
import swaggerUi from "swagger-ui-express";
import swaggerFile from "../swagger/swagger-output.json";

export default async (app: any) => {
  dotenv.config()
  passportConfig()



  app.use(hpp())
  //app.use(cors)
  //app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))
  if (process.env.DEV_MODE === 'development') {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));
  }
  app.use(morgan('combined', { stream: stream }))
  app.use(
    cors({
      origin: '*',
      credentials: true,
    }),
  )

  //app.use(express.static(path.join(__dirname, '../public')));
  //app.use('/', express.static(path.join(__dirname, '../../../web/build')))
  //app.use('/img', express.static(path.join(__dirname, '../uploads')))
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))
  app.use(cookieParser(process.env.COOKIE_SECRET))
  app.use(helmet({ contentSecurityPolicy: false }))

  /* session 방식 이용시 필요
  if (process.env.DEV_MODE === 'production') {
    //app.use(sessionMiddleware)
  } else {
    app.use(
      session({
        resave: false,
        saveUninitialized: false,
        secret: process.env.COOKIE_SECRET,
        cookie: {
          httpOnly: false,
          secure: false,
          maxAge: 24000 * 60 * 60, //24시간
        },
      }),
    )
  }
  */
  app.use(passport.initialize())
  /* passport
  app.use(passport.session())
  */
  app.use((_: any, res: { setHeader: (arg0: string, arg1: string) => void }, next: () => void) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE',
    )
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    next()
  })

  app.use(router())
}
