import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import { AlarmSetting, Block, CallHistory, CreatorAuth, Donation, FanStep, Info, LastScreen, Mcn, Payment, Point, PointHistory, Post, SocialLogin, Subscribe, User } from '../../models/index'
import Sequelize from 'sequelize'
import sequelize from '../../models/sequelize'
import passport from 'passport'
import axios from 'axios'
import UserService from '../../services/userService'
import { body, query } from 'express-validator';
import { validatorErrorChecker } from '../middlewares/validator'
import { logger } from '../../config/winston'
import {
  upload,
  deleteS3,
  awsSimpleEmailService
} from '../middlewares/aws'
import { authJWT, authAdminJWT } from '../middlewares/authJWT'
import { sign, refresh, verify } from '../middlewares/jwt-util'
import { renewal } from '../middlewares/renewal'
import { USER_ATTRIBUTE, USER_GENDER, USER_ROLE } from '../../constant/user-constant'
//import EmailService from '../../services/emailService'
import { FCMPushNotification } from '../middlewares/fcm-notification'
import BanService from '../../services/banService'
import PointService from '../../services/pointService'
import CryptoJS from 'crypto-js'
import { CALL_TYPE } from '../../constant/call-constant'
import { errorLogGet, errorLogPost } from '../middlewares/logCombine'
import PostService from '../../services/postService'
import CardService from '../../services/CardService'
import { getValue, setValue } from '../middlewares/redis'
import { COUNTRY_LIST } from '../../constant/country-constant'
import { BANNER_TYPE } from '../../constant/banner-constant'
import { POINT_ATTENDANCE, POINT_HISTORY } from '../../constant/point-constant'
import { slackPostMessage } from '../middlewares/slack'
import { SLACK_CHANNEL } from '../../constant/slack-constant'
import SubscribeService from '../../services/subscribeService'

const router = express.Router()
const Op = Sequelize.Op

export default (app: any, apiLimiter: any, subdomain: any) => {
  if (process.env.DEV_MODE === 'production')
    app.use(subdomain('api', router))
  app.use('/user', router)
  app.use('/user', apiLimiter)

  router.use((req, res, next) => {
    /* res.locals 값추가 가능*/
    next()
  })


  router.post('/accessTokenRefresh', [
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    try {
      const UserId: number = req.id
      const user: any = await User.findOne({
        where: {
          id: UserId,
        }
      })
      const accessToken = sign({ id: user.id, roles: user.roles })
      return res.status(200).json({ status: 'true', accessToken })
    } catch (err) {
      console.log(err)
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })



  router.post('/loginLocal', [
    body('password').exists(),
    body('email').optional(),
    body('phone').optional(),
    body('platform').optional(),
    validatorErrorChecker
  ], async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      const { email, phone, platform } = req.body

      const ip =
        req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || req?.ip

      let blockChk: any
      let blockChk2: any
      if (email) {
        blockChk = await Block.findOne({
          where: {
            email
          }, transaction
        })
        if (blockChk) {
          blockChk2 = await Block.findOne({
            where: {
              phone: blockChk?.phone
            }, transaction
          })
        }
      } else if (phone) {
        blockChk = await Block.findOne({
          where: {
            phone
          }, transaction
        })
      }
      if (blockChk || blockChk2) {
        await transaction.commit()
        return res.status(200).json({ status: 'ban' })
      }


      //count ++ 
      let loginLocalCount: number = await getValue(`loginLocal:${email ? email : phone}:${ip}`)
      if (!loginLocalCount) {
        await setValue(`loginLocal:${email ? email : phone}:${ip}`, 1, 60 * 60)
        loginLocalCount = 1
      }

      const { user, point, success, diffPass }: any = await UserService.loginLocal(req, transaction);
      //01084624815
      if (user?.phone === '01084624815') {
        await transaction.commit()
        return res.status(200).json({ status: 'error', diffPass })
      }
      if (user) {
        const blockCheck = await Block.findOne({
          where: {
            email: user?.email
          }, transaction
        })
        if (blockCheck) {
          await transaction.commit()
          return res.status(200).json({ status: 'false' })
        }
      }
      if (!success) {
        await setValue(`loginLocal:${email ? email : phone}:${ip}`, Number(loginLocalCount) + 1, 60 * 60)
        await transaction.commit()
        return res.status(200).json({ status: 'false', diffPass })
      }

      if (Number(loginLocalCount) >= 15) {
        await transaction.commit()
        return res.status(200).json({ status: 'false' })
      }

      const accessToken = sign({ id: user.id, roles: user.roles })
      const refreshToken = refresh()


      const nj01: any = await Mcn.findOne({
        where: {
          mcnerId: user?.id,
          code: {
            [Op.in]: ['bb12', 'nj12']
          },
        }, transaction
      })
      if (nj01 || user?.country !== COUNTRY_LIST.한국) {
        await User.update({
          refreshToken: refreshToken,
          // lastVisit: new Date(new Date().setMinutes(new Date().getMinutes() - 20)),
          lastVisit: new Date(),
          callState: CALL_TYPE.CALL_WAIT,
        }, {
          where: {
            id: user.id
          }, transaction
        })
      } else {
        await User.update({
          refreshToken: refreshToken,
          lastVisit: new Date(),
          callState: CALL_TYPE.CALL_WAIT,
        }, {
          where: {
            id: user.id
          }, transaction
        })
      }
      //접속시 자동 영상통화 허용 여부 켜기 , 윤아린 빼고
      if (platform !== 'web' && Number(user.id) !== 292 && Number(user.id) !== 6 &&
        user?.gender === USER_GENDER.GIRL
      ) {
        await AlarmSetting.update({
          call: true,
        }, {
          where: {
            UserId: user.id
          }, transaction
        })
      }



      logger.info('[ Login Success ]')
      logger.info(`[ ip : ${ip} ]`)
      logger.info(`[ UserId : ${user.id} ]`)

      await transaction.commit()
      //알림 보내야함
      return res.status(200).json({
        status: 'true', accessToken, refreshToken, user, point, diffPass,
        // APP_VERSION: process.env.APP_VERSION,
        // review: String(process.env.REVIEW) === 'true' ? true : false,

      })
    } catch (err) {
      console.log(err)
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })


  router.post('/loginLocal/v2', [
    body('password').exists(),
    body('email').optional(),
    body('sns').exists(),
    body('snsId').exists(),
    body('phone').optional(),
    body('platform').optional(),
    validatorErrorChecker
  ], async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      const { email, phone, platform } = req.body

      const ip =
        req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || req?.ip

      let blockChk: any
      let blockChk2: any
      if (email) {
        blockChk = await Block.findOne({
          where: {
            email
          }, transaction
        })
        if (blockChk) {
          blockChk2 = await Block.findOne({
            where: {
              phone: blockChk?.phone
            }, transaction
          })
        }
      } else if (phone) {
        blockChk = await Block.findOne({
          where: {
            phone
          }, transaction
        })
      }
      if (blockChk || blockChk2) {
        await transaction.commit()
        return res.status(200).json({ status: 'ban' })
      }


      //count ++ 
      let loginLocalCount: number = await getValue(`loginLocal:${email ? email : phone}:${ip}`)
      if (!loginLocalCount) {
        await setValue(`loginLocal:${email ? email : phone}:${ip}`, 1, 60 * 60)
        loginLocalCount = 1
      }

      const { user, point, success, diffPass }: any = await UserService.loginLocalV2(req, transaction);
      //01084624815
      if (user?.phone === '01084624815') {
        await transaction.commit()
        return res.status(200).json({ status: 'error', diffPass })
      }
      if (user) {
        const blockCheck = await Block.findOne({
          where: {
            email: user?.email
          }, transaction
        })
        if (blockCheck) {
          await transaction.commit()
          return res.status(200).json({ status: 'false' })
        }
      }
      if (!success) {
        await setValue(`loginLocal:${email ? email : phone}:${ip}`, Number(loginLocalCount) + 1, 60 * 60)
        await transaction.commit()
        return res.status(200).json({ status: 'false', diffPass })
      }

      if (Number(loginLocalCount) >= 15) {
        await transaction.commit()
        return res.status(200).json({ status: 'false' })
      }

      const accessToken = sign({ id: user.id, roles: user.roles })
      const refreshToken = refresh()


      const nj01: any = await Mcn.findOne({
        where: {
          mcnerId: user?.id,
          code: {
            [Op.in]: ['bb12', 'nj12']
          },
        }, transaction
      })
      if (nj01 || user?.country !== COUNTRY_LIST.한국) {
        await User.update({
          refreshToken: refreshToken,
          // lastVisit: new Date(new Date().setMinutes(new Date().getMinutes() - 20)),
          lastVisit: new Date(),
          callState: CALL_TYPE.CALL_WAIT,
        }, {
          where: {
            id: user.id
          }, transaction
        })
      } else {
        await User.update({
          refreshToken: refreshToken,
          lastVisit: new Date(),
          callState: CALL_TYPE.CALL_WAIT,
        }, {
          where: {
            id: user.id
          }, transaction
        })
      }
      //접속시 자동 영상통화 허용 여부 켜기 , 윤아린 빼고
      if (platform !== 'web' && Number(user.id) !== 292 && Number(user.id) !== 6 &&
        user?.gender === USER_GENDER.GIRL
      ) {
        await AlarmSetting.update({
          call: true,
        }, {
          where: {
            UserId: user.id
          }, transaction
        })
      }



      logger.info('[ Login Success ]')
      logger.info(`[ ip : ${ip} ]`)
      logger.info(`[ UserId : ${user.id} ]`)

      await transaction.commit()
      //알림 보내야함
      return res.status(200).json({
        status: 'true', accessToken, refreshToken, user, point, diffPass,
        // APP_VERSION: process.env.APP_VERSION,
        // review: String(process.env.REVIEW) === 'true' ? true : false,

      })
    } catch (err) {
      console.log(err)
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })



  router.post('/updatePostShowApp', [
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      const UserId: number = req.id
      const userBefore: any = await User.findOne({
        where: {
          id: UserId
        }, transaction
      })
      await User.update({
        postShowApp: !userBefore?.postShowApp
      }, {
        where: {
          id: UserId
        }, transaction
      })
      const user: any = await User.findOne({
        where: {
          id: UserId
        }, transaction
      })
      await transaction.commit()
      return res.status(200).json({ status: 'true', user });
    } catch (err) {
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })

  router.post('/updateLastScreen', [
    body('name').exists(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      const UserId: number = req?.id
      if (!UserId) {
        await transaction.commit()
        return res.status(200).json({ status: 'false' });
      }
      const name: string = req.body.name

      const lastScreenChk = await LastScreen.findOne({
        where: {
          UserId,
        }, transaction
      })
      if (lastScreenChk) {
        await LastScreen.update({
          name,
          changedAt: new Date(),
        }, {
          where: {
            // id: lastScreenChk?.id
            UserId
          }, transaction
        })
      } else {
        await LastScreen.create({
          name,
          changedAt: new Date(),
          UserId,
        }, { transaction })
      }
      await transaction.commit()
      return res.status(200).json({ status: 'true' });
    } catch (err) {
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })



  //socialUserAdd
  router.post('/socialUserAdd', [
    body('phone').exists(),
    body('email').exists(),
    body('sns').exists(),
    body('snsId').exists(),
    validatorErrorChecker
  ], async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      const { user, password, refreshToken, accessToken }: any = await UserService.socialUserAdd(req, transaction);

      if (user && password) {
        let alpha = CryptoJS.AES.encrypt(password, process.env.CRYPTO_SECRET as string).toString();
        const ip =
          req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || req?.ip

        logger.info('[ Login Success ]')
        logger.info(`[ ip : ${ip} ]`)
        logger.info(`[ UserId : ${user.id} ]`)
        await transaction.commit()
        return res.status(200).json({ status: 'true', user, alpha, refreshToken, accessToken });
      }
      else {
        await transaction.rollback()
        return res.status(200).json({ status: 'false' })
      }
    } catch (err) {
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })
  //snsUserCheck
  router.post('/snsUserCheck', [
    body('email').exists(),
    body('sns').exists(),
    body('snsId').exists(),
    validatorErrorChecker
  ], async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      const { user, password, refreshToken, accessToken, dupEmail }: any = await UserService.snsUserCheck(req, transaction);

      if (user && password) {
        let blockChk: any
        let blockChk2: any
        if (user?.email) {
          blockChk = await Block.findOne({
            where: {
              email: user?.email
            }, transaction
          })
          if (blockChk) {
            blockChk2 = await Block.findOne({
              where: {
                phone: blockChk?.phone
              }, transaction
            })
          }
        } else if (user?.phone) {
          blockChk = await Block.findOne({
            where: {
              phone: user?.phone
            }, transaction
          })
        }
        if (blockChk || blockChk2) {
          await transaction.commit()
          return res.status(200).json({ status: 'ban' })
        }

        let alpha = CryptoJS.AES.encrypt(password, process.env.CRYPTO_SECRET as string).toString();
        const point: any = await Point.findOne({
          where: {
            UserId: user?.id
          }, transaction
        })
        const ch01Chk = await Mcn.findOne({
          where: {
            mcnerId: user?.id,
            code: 'ch01'
          }, transaction
        })

        if (ch01Chk) {
          point.amount = Math.floor(point.amount * 0.3)
        }

        const ip =
          req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || req?.ip

        logger.info('[ Login Success ]')
        logger.info(`[ ip : ${ip} ]`)
        logger.info(`[ UserId : ${user.id} ]`)
        await transaction.commit()
        return res.status(200).json({ status: 'true', user, alpha, refreshToken, accessToken, dupEmail, point });
      }
      else {
        await transaction.commit()
        return res.status(200).json({ status: 'false', dupEmail })
      }
    } catch (err) {
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })

  router.get('/sitemapUser', [
    validatorErrorChecker
  ], async (req: any, res: any, next: any) => {
    try {
      const user = await User.findAll({
        where: {
          profile: {
            [Op.not]: `${process.env.CLOUD_FRONT_STORAGE}/girl.png`
          },
          roles: USER_ROLE.NORMAL_USER,
          gender: USER_GENDER.GIRL,
          country: COUNTRY_LIST.한국
        },
        attributes: {
          exclude: USER_ATTRIBUTE.EXCLUDE
        },
      })
      return res.status(200).json({ status: 'true', user })
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })

  //apptoweb
  router.get('/apptoweb', [
    query('accessToken').exists().isString(),
    query('refreshToken').exists().isString(),
    validatorErrorChecker
  ], async (req: any, res: any, next: any) => {
    try {
      const accessToken: string = req.query.accessToken
      const refreshToken: string = req.query.refreshToken

      const result = verify(accessToken)
      if (!result.ok) return res.status(200).json({ status: 'true' })
      const user: any = await UserService.findUserOneByAppToWeb(result.id)
      const point: any = await PointService.getPoint(result.id)
      /*
      if (user.refreshToken !== refreshToken) {
        return res.status(200).json({ status: 'true' })
      }
      */
      return res.status(200).json({ status: 'true', user, point })
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })

  router.get('/apptowebAndSubscribeAndFanStep', [
    query('accessToken').exists().isString(),
    query('refreshToken').exists().isString(),
    query('FanStepId').exists(),
    validatorErrorChecker
  ], async (req: any, res: any, next: any) => {
    try {
      const accessToken: string = req.query.accessToken
      // const refreshToken: string = req.query.refreshToken

      const result = verify(accessToken)
      if (!result.ok) return res.status(200).json({ status: 'true' })
      const user: any = await UserService.findUserOneByAppToWeb(result.id)
      const fanStep: any = await SubscribeService.getFanStepByIdQuery(req)
      const subscribe = await Subscribe.findOne({
        include: [{
          model: FanStep
        }],
        where: {
          subscriberId: user?.id,
          subscribingId: fanStep?.User?.id,
          //subscribeState: SUBSCRIBE_STATE.ING,
        }
      })
      return res.status(200).json({ status: 'true', user, fanStep, subscribe })
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })
  router.get('/possibleLinkCheck', [
    query('link').exists().isString(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    try {
      const link: string = req.query.link
      const result = await User.findOne({
        paranoid: false,
        where: {
          link,
        },
        attributes: {
          exclude: ['password', 'refreshToken']
        },
      })
      // await UserService.findLinkOne(link)
      return res.status(200).json({ status: 'true', result: result ? false : true })
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })

  /*
  router.get('/tokenVerify', [
    query('accessToken').exists().isString(),
    query('url').exists().isString(),
    validatorErrorChecker
  ], async (req: any, res: any, next: any) => {
    try {
      const accessToken: string = req.query.accessToken
      const url: string = req.query.url
      const result = verify(accessToken) // token을 검증합니다.

      if (result.ok) {
        // token이 검증되었으면 req에 값을 세팅하고, 다음 콜백함수로 갑니다.
        if (USER_ROLE.isBanRole(result.roles)) {
          return res.status(400).send({
            ok: false,
            message: 'ban authorization', // jwt가 만료되었다면 메세지는 'jwt expired'입니다.
          })
        }
        req.id = result.id
        req.roles = result.roles
      }
      //url로 비디오 체크
      const PostId: number = req.params.PostId
      //const post: Post = await PostService.getFindSecurePostOne(req, PostId)
      return res.status(200).json({ status: 'true', result: result ? false : true })
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })
  */


  router.get('/getUserCallState', [
    query('YouId').exists(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    try {
      const YouId: number = req.query.YouId
      //차단인지 확인
      const ban = await BanService.checkBan(req, YouId)
      if (ban) {
        return res.status(200).json({ status: 'ban' })
      }
      //남자 포인트 검사해야함
      const user: any = await UserService.findUserOne(req.id)
      const you: any = await UserService.findUserOne(YouId)

      if (user?.country !== COUNTRY_LIST.한국 && user?.gender === USER_GENDER.GIRL) {
        return res.status(200).json({ status: 'false' })
      }
      if (you.roles !== USER_ROLE.NORMAL_USER) {
        return res.status(200).json({ status: 'deny' })
      }
      if (!you.AlarmSetting.call) {
        return res.status(200).json({ status: 'deny' })
      }
      if (user.gender === USER_GENDER.BOY && you.gender === USER_GENDER.GIRL) {
        const point: any = await PointService.getPoint(req.id)
        return res.status(200).json({ status: 'true', callState: you?.callState, point: point?.amount })
      } else if (user.gender === USER_GENDER.GIRL && you.gender === USER_GENDER.BOY) {
        const point: any = await PointService.getPoint(YouId)
        return res.status(200).json({ status: 'true', callState: you?.callState, point: point?.amount })
      }
      return res.status(200).json({ status: 'false' })

    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })

  router.post('/joinLocal', [
    body('phone').optional(),
    body('email').exists().isEmail(),
    body('sns').optional(),
    body('snsId').optional(),
    body('age').exists(),
    body('password').exists(),
    body('gender').exists(),
    body('real_birthday').optional(),
    body('real_gender').optional(),
    body('nick').exists(),
    body('profile').exists(),
    body('country').exists(),
    body('code').optional(),
    body('adCode').optional(),
    body('cnv_id').optional(),
    validatorErrorChecker
  ], async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      const { age, gender, adCode, cnv_id } = req.body

      if (
        Number(age) < 20 ||
        Number(age) > 100 ||
        (Number(gender) !== Number(USER_GENDER.BOY) &&
          Number(gender) !== Number(USER_GENDER.GIRL))

      ) {
        await transaction.commit()
        return res.status(200).json({ status: 'false' })
      }
      const { user, password, refreshToken, accessToken, dupPhone, dupEmail }: any = await UserService.joinUser(req, res, transaction);

      if (user && password) {
        if (adCode) {
          if (adCode === 'wm') {
            await User.update({
              adCode,
              cnv_id
            }, {
              where: {
                id: user?.id,
              }, transaction
            })
            await axios.get(`https://gcltracker.com/click?cnv_id=${cnv_id}`)
          } else {
            await User.update({
              adCode,
            }, {
              where: {
                id: user?.id,
              }, transaction
            })
          }
        }

        let alpha = CryptoJS.AES.encrypt(password, process.env.CRYPTO_SECRET as string).toString();
        await transaction.commit()
        return res.status(200).json({ status: 'true', user, alpha, refreshToken, accessToken });
      }
      else {
        await transaction.rollback()
        return res.status(200).json({ status: 'false', dupPhone, dupEmail })
      }
    } catch (err) {
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })


  router.post('/joinLocal/v2', [
    body('imp_uid').exists(),
    body('email').exists().isEmail(),
    body('sns').optional(),
    body('snsId').optional(),
    body('age').exists(),
    body('password').exists(),
    body('gender').exists(),
    body('nick').exists(),
    body('country').exists(),
    body('code').optional(),
    body('adCode').optional(),
    body('cnv_id').optional(),
    validatorErrorChecker
  ], async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      const { age, gender, imp_uid, adCode, cnv_id } = req.body;
      if (
        Number(age) < 20 ||
        Number(age) > 100 ||
        (Number(gender) !== Number(USER_GENDER.BOY) &&
          Number(gender) !== Number(USER_GENDER.GIRL))

      ) {
        await transaction.commit()
        return res.status(200).json({ status: 'false' })
      }

      const getToken = await axios({
        url: 'https://api.iamport.kr/users/getToken',
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        data: {
          imp_key: process.env.DANAL_KEY,
          imp_secret: process.env.DANAL_SECRET,
        },
      })
      const { access_token } = getToken.data.response // 인증 토큰
      // imp_uid로 인증 정보 조회
      const getCertifications = await axios({
        url: `https://api.iamport.kr/certifications/${imp_uid}`, // imp_uid 전달
        method: 'get', // GET method
        headers: { Authorization: access_token }, // 인증 토큰 Authorization header에 추가
      })
      const certificationsInfo = getCertifications.data.response
      if (!certificationsInfo) return res.status(200).json({ status: 'false' })

      const phone = certificationsInfo?.phone;
      const real_gender =
        certificationsInfo?.gender === "male"
          ? USER_GENDER.BOY
          : USER_GENDER.GIRL;
      const real_birthday = Number(
        certificationsInfo?.birthday?.slice(0, 4)
      );
      if (real_birthday >
        Number(new Date().getFullYear() - 19)) {
        await transaction.commit()
        return res.status(200).json({ status: 'adult' })
      }

      const blockChk = await Block.findOne({
        where: {
          phone
        }, transaction
      })

      if (blockChk) {
        await transaction.commit()
        return res.status(200).json({ status: 'false' })
      }


      req.body.phone = phone
      req.body.real_gender = real_gender
      req.body.real_birthday = real_birthday

      const { user, password, refreshToken, accessToken, dupPhone, dupEmail }: any = await UserService.joinUserV2(req, res, transaction);


      if (user && password) {
        //adCode
        if (adCode) {
          if (adCode === 'wm') {
            await User.update({
              adCode,
              cnv_id
            }, {
              where: {
                id: user?.id,
              }, transaction
            })
            await axios.get(`https://gcltracker.com/click?cnv_id=${cnv_id}`)
          } else {
            await User.update({
              adCode,
            }, {
              where: {
                id: user?.id,
              }, transaction
            })
          }
        }

        let alpha = CryptoJS.AES.encrypt(password, process.env.CRYPTO_SECRET as string).toString();

        const info = await Info.findOne({
          where: {
            phone,
          }, transaction
        })
        if (!info) {
          await Info.create({
            phone,
            real_birthday,
            real_gender
          }, { transaction })

          if (user?.gender === USER_GENDER.BOY) {
            await Point.update({
              amount: 50
            }, {
              where: {
                UserId: user?.id,
              }, transaction
            })
            const userTicketCount: any = await User.findOne({
              where: {
                id: user?.id,
              }, transaction
            })
            await User.update({
              ticket: Number(userTicketCount?.ticket + 1),
            }, {
              where: {
                id: user?.id,
              }, transaction
            })
          }
          const afterUser = await User.findOne({
            where: {
              id: user?.id,
            }, transaction
          })

          await transaction.commit()
          return res.status(200).json({ status: 'true', user: afterUser, alpha, refreshToken, accessToken });
        } else {
          await transaction.commit()
          return res.status(200).json({ status: 'true', user, alpha, refreshToken, accessToken });
        }
      }
      else {
        await transaction.rollback()
        return res.status(200).json({ status: 'false', dupPhone, dupEmail })
      }
    } catch (err) {
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })

  router.post('/webLoginVerify', [
    body('accessToken').exists().isString(),
    validatorErrorChecker
  ], async (req: any, res: any, next: any) => {
    try {
      const accessToken: string = req.body.accessToken
      const result = verify(accessToken) // token을 검증합니다.

      if (result.ok) {
        return res.status(200).send({
          login: true,
        })
      } else {
        return res.status(200).send({
          login: false,
        })
      }
    } catch (err) {
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })


  router.post('/auth/renewal', renewal, [
    //  #swagger.description = '유저 토근 재발급'
    //  #swagger.tags = ['User']
  ])

  /*
    router.post('/connect', authJWT, async (req: any, res: any, next: any) => {
      const transaction = await sequelize.transaction()
      try {
        //lastvisit 최근으로
        const myFollow: any = await UserService.getMyFollow(req, transaction)
        await UserService.updateLastVisit(req, transaction)
        await transaction.commit().then(() => {
          //push
          //팔로우 접속 하셨습니다 알림.
          myFollow?.Followers.forEach((list: any) => {
            FCMPushNotification(`팔로잉 접속 알림`, `${list.nick}님이 접속 하셨습니다!`, list?.pushToken, list.profile)
          })
          return res.status(200).json({ status: 'true' })
        })
  
      } catch (err) {
        await transaction.rollback()
        errorLogPost(req, err)
        return res.status(400).json({ status: 'error' })
      }
    })
    */

  router.delete('/Withdrawal', authJWT, async (req: any, res: any, next: any) => {
    //  #swagger.description = '유저 회원탈퇴'
    //  #swagger.tags = ['User']
    const transaction = await sequelize.transaction()
    try {
      const donation = await Donation.findOne({
        where: {
          donationingId: req?.id,
        }, transaction
      })
      if (donation) {
        const user = await UserService.findUserOneTransaction(req?.id, transaction)
        slackPostMessage(SLACK_CHANNEL.CS,
          `탈퇴요청
          ${user?.nick}
          UserId:${user?.id}
          link:${user?.link}

        `
        )
        awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, '탈퇴요청', `${user?.nick}`)
        await User.update({
          withdrawState: true,
          withdrawApplyedAt: new Date()
        }, {
          where: {
            id: req.id
          }, transaction
        })
        await transaction.commit()
        return res.status(200).json({ status: 'wait' })
      }

      if ([41017, 41252, 1733, 4266, 22222, 15961, 8833, 15842, 1823, 27634, 26086, 419, 2184, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 1733, 7661].includes(Number(req?.id))) {
        await transaction.commit()
        return res.status(200).json({ status: 'false' })
      }
      const result = await UserService.destroyUser(req, transaction);
      if (result) {
        await transaction.commit()
        return res.status(200).json({ status: 'true' })
      } else {
        await transaction.commit()
        return res.status(200).json({ status: 'false' })
      }
    } catch (err) {
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })

  router.put('/apnsUpdate', [
    body('apnsToken').exists(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      await UserService.apnsUpdate(req, transaction);
      await transaction.commit()
      return res.status(200).json({ status: 'true' })
    } catch (err) {
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })



  router.put('/tokenUpdate', [
    body('pushToken').exists(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      await UserService.tokenUpdate(req, transaction);
      await transaction.commit()
      return res.status(200).json({ status: 'true' })
    } catch (err) {
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })


  router.post('/createFollowFromProfile', [
    //body('YouId').exists(),
    body('YouId').optional(),
    body('link').optional(),
    body('platform').optional(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      //await UserService.tokenUpdate(req, transaction);
      const result = await UserService.createFollowFromProfile(req, transaction)
      await transaction.commit()
      return res.status(200).json({ status: 'true', result })
    } catch (err) {
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })

  router.post('/changePassword', [
    body('password').optional(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      //await UserService.tokenUpdate(req, transaction);
      await UserService.changePassword(req, transaction)

      await transaction.commit()
      return res.status(200).json({ status: 'true' })
    } catch (err) {
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })


  router.post('/createFollow', [
    body('YouId').exists(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      //await UserService.tokenUpdate(req, transaction);
      await UserService.createFollow(req, transaction)
      await transaction.commit()
      return res.status(200).json({ status: 'true' })
    } catch (err) {
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })
  router.delete('/removeFollow', [
    body('YouId').exists(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      const YouId: number = req.body.YouId
      const you = await UserService.findUserOneTransaction(YouId, transaction)
      if (you?.roles === USER_ROLE.CS_USER) {
        await transaction.commit()
        return res.status(200).json({ status: 'false' })
      }
      //await UserService.tokenUpdate(req, transaction);
      await UserService.removeFollow(req, transaction)
      await transaction.commit()
      return res.status(200).json({ status: 'true' })
    } catch (err) {
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })

  router.put('/updateIntroduce', [
    body('nick').exists(),
    body('link').exists(),
    body('introduce').optional(),
    body('profile').exists(),
    body('background').optional(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      const user = await User.findOne({
        where: {
          id: req.id
        }, transaction
      })
      if (user?.withdrawState) {
        await transaction.commit()
        return res.status(200).json({ status: 'false' })
      }
      if ([8833, 15842, 1823, 26086, 419, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 1733, 7661].includes(Number(req?.id))) {
        await transaction.commit()
        return res.status(200).json({ status: 'false' })
      }
      const [errorCheck, message] = await UserService.updateIntroduce(req, transaction);

      if (!errorCheck) {
        await transaction.rollback()
        return res.status(200).json({ status: 'false', message })
      }
      await transaction.commit()
      return res.status(200).json({ status: 'true' })
    } catch (err) {
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })

  router.get('/getBannerGirl', [
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    try {
      const UserId: number = req.id
      const user = await User.findOne({
        where: {
          id: UserId,
        }
      })
      if (user?.profile === 'https://d5w3s87s233gw.cloudfront.net/girl.png' && user?.country === COUNTRY_LIST.한국 && user?.gender === USER_GENDER.GIRL) {
        return res.status(200).json({
          type: BANNER_TYPE.GIRL,
          androidUrl: null,
          iosUrl: null,
          webUrl: 'https://open.kakao.com/o/s7qBJO5g',
          bannerImage: 'https://d5w3s87s233gw.cloudfront.net/appBannerGirl.png'
        })
      }
      return res.status(200)
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })

  router.get('/getBannerBoy', [
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    try {
      const UserId: number = req.id
      const user = await User.findOne({
        where: {
          id: UserId,
        }
      })
      const info = await Info.findOne({
        where: {
          phone: user?.phone
        }
      })
      const callHistory = await CallHistory.findOne({
        where: {
          UserId
        }
      })
      if (!user?.real_birthday && !info && !callHistory && user?.country === COUNTRY_LIST.한국 && user?.gender === USER_GENDER.BOY) {
        return res.status(200).json({
          type: BANNER_TYPE.TICKET,
          androidUrl: null,
          iosUrl: null,
          webUrl: null,
          bannerImage: 'https://d5w3s87s233gw.cloudfront.net/appBannerTicket.png'
        })
      }
      else {
        return res.status(200).json({
          type: BANNER_TYPE.REFERRAL,
          androidUrl: null,
          iosUrl: null,
          webUrl: 'https://temu.to/m/ujfgvil519x',
          bannerImage: 'https://d5w3s87s233gw.cloudfront.net/appBannerTemu.png'
        })
      }
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })


  router.get('/getBannerBoy/v2', [
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    try {
      const UserId: number = req.id
      const user = await User.findOne({
        where: {
          id: UserId,
        }
      })
      /*
      const info = await Info.findOne({
        where: {
          phone: user?.phone
        }
      })
      const callHistory = await CallHistory.findOne({
        where: {
          UserId
        }
      })
        */
      if (user?.ticket) {
        return res.status(200).json({
          type: BANNER_TYPE.TICKET2,
          androidUrl: null,
          iosUrl: null,
          webUrl: null,
          bannerImage: 'https://d5w3s87s233gw.cloudfront.net/appBannerTicket2.png'
        })
      }
      else {
        return res.status(200)
        /*
        return res.status(200).json({
          type: BANNER_TYPE.REFERRAL,
          androidUrl: null,
          iosUrl: null,
          webUrl: 'https://temu.to/m/ujfgvil519x',
          bannerImage: 'https://d5w3s87s233gw.cloudfront.net/appBannerTemu.png'
        })
          */
      }
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })
  /*
    router.get('/getFirstBannerBoy', [
      validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
      try {
        return res.status(200).json({
          status: 'ads',
          androidUrl: 'https://bbom.studio',
          iosUrl: 'https://bbom.studio',
          webUrl: 'https://bbom.studio',
          bannerImage:'https://'
        })
      } catch (err) {
        errorLogGet(req, err)
        return res.status(400).json({ status: 'error' })
      }
    })
     router.get('/getFirstBannerGirl', [
       validatorErrorChecker
     ], authJWT, async (req: any, res: any, next: any) => {
       try {
         return res.status(200).json({
           status: 'ads',
           androidUrl: 'https://bbom.studio',
           iosUrl: 'https://bbom.studio',
           webUrl: 'https://bbom.studio',
           bannerImage:'https://'
         })
       } catch (err) {
         errorLogGet(req, err)
         return res.status(400).json({ status: 'error' })
       }
     })
     */

  router.put('/attendanceCheck', [
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      const check = await UserService.attendanceCheck(req, transaction);
      if (check === 2) {//처음
        await transaction.commit()
        return res.status(200).json({
          status: 'ads',
          androidUrl: 'https://temu.to/m/ujfgvil519x',
          iosUrl: 'https://temu.to/m/ujfgvil519x',
          webUrl: 'https://temu.to/m/ujfgvil519x'
        })
      }
      else if (!check) { // 불가능
        await transaction.commit()
        return res.status(200).json({ status: 'false' })
      }

      //포인트 10
      await transaction.commit()
      return res.status(200).json({ status: 'true', ads: true, })
    } catch (err) {
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })


  router.put('/attendanceCheck/v2', [
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {

      const UserId: number = req.id
      const user = await User.findOne({
        where: {
          id: req.id
        }, transaction
      })
      let price = 10;
      const check = await UserService.attendanceCheckV2(req, transaction);
      if (check === 2) {//처음
        if (user?.gender === USER_GENDER.BOY) {
          // price = 50;
          await Point.increment({
            amount: price
          }, {
            where: {
              UserId,
            }, transaction
          })
          await PointHistory.create({
            UserId,
            type: POINT_HISTORY.TYPE_ATTENDANCE,
            plusOrMinus: POINT_HISTORY.PLUS,
            amount: price,
          }, { transaction })
          await transaction.commit()
          return res.status(200).json({
            status: 'true',
            androidUrl: 'https://temu.to/m/ujfgvil519x',
            iosUrl: 'https://temu.to/m/ujfgvil519x',
            webUrl: 'https://temu.to/m/ujfgvil519x',
            price
          })
        } else {
          await Point.increment({
            amount: price
          }, {
            where: {
              UserId,
            }, transaction
          })
          await PointHistory.create({
            UserId,
            type: POINT_HISTORY.TYPE_ATTENDANCE,
            plusOrMinus: POINT_HISTORY.PLUS,
            amount: price,
          }, { transaction })
        }
        await transaction.commit()
        return res.status(200).json({
          status: 'true',
          androidUrl: 'https://temu.to/m/ujfgvil519x',
          iosUrl: 'https://temu.to/m/ujfgvil519x',
          webUrl: 'https://temu.to/m/ujfgvil519x',
          price
        })
      }
      else if (!check) {
        await transaction.commit()
        return res.status(200).json({ status: 'false' })
      } else {
        await Point.increment({
          amount: POINT_ATTENDANCE.BOY
        }, {
          where: {
            UserId,
          }, transaction
        })
        await PointHistory.create({
          UserId,
          type: POINT_HISTORY.TYPE_ATTENDANCE,
          plusOrMinus: POINT_HISTORY.PLUS,
          amount: 10,
        }, { transaction })
        await transaction.commit()
        return res.status(200).json({
          status: 'true',
          androidUrl: 'https://temu.to/m/ujfgvil519x',
          iosUrl: 'https://temu.to/m/ujfgvil519x',
          webUrl: 'https://temu.to/m/ujfgvil519x',
          price
        })
      }
    } catch (err) {
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })

  router.put('/attendanceCheckAfter', [
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      const check = await UserService.attendanceCheckAfter(req, transaction);
      if (!check) {
        await transaction.commit()
        return res.status(200).json({ status: 'false' })
      }
      await PointService.attendanceCheck(req, transaction)
      await transaction.commit()
      return res.status(200).json({ status: 'true', })
    } catch (err) {
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })

  router.post('/updateLastVisitV2', [
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      //await UserService.tokenUpdate(req, transaction);
      await UserService.updateLastVisitV2(req, transaction)
      await transaction.commit()
      return res.status(200).json({ status: 'true' })
    } catch (err) {
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })


  router.post('/updateLastVisit', [
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      //await UserService.tokenUpdate(req, transaction);
      await UserService.updateLastVisit(req, transaction)
      await transaction.commit()
      return res.status(200).json({ status: 'true' })
    } catch (err) {
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })
  router.post('/createBan', [
    body('YouId').exists(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      //await UserService.tokenUpdate(req, transaction);
      await BanService.createBan(req, transaction)
      await transaction.commit()
      return res.status(200).json({ status: 'true' })
    } catch (err) {
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })
  router.delete('/removeBan', [
    body('YouId').exists(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      //await UserService.tokenUpdate(req, transaction);
      await BanService.removeBan(req, transaction)
      await transaction.commit()
      return res.status(200).json({ status: 'true' })
    } catch (err) {
      await transaction.rollback()
      errorLogPost(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })

  //snsUserExist

  router.get('/snsUserExist', [
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    try {

      const sns = await SocialLogin.findOne({
        where: {
          UserId: req.id
        }
      })
      if (sns) {
        return res.status(200).json({ status: 'true', snsCheck: true })
      } else {
        return res.status(200).json({ status: 'true', snsCheck: false })
      }
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })
  router.get('/getCreatorAuth', [
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    try {
      const creatorAuth = await UserService.getCreatorAuth(req)
      return res.status(200).json({ status: 'true', creatorAuth })
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })

  router.get('/getMyCard', [
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    try {
      const card = await CardService.getMyCard(req)
      return res.status(200).json({ status: 'true', card })
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })



  router.get('/myFollowing', [
    query('pageNum').optional(),
    query('pageSize').optional(),
    query('country').optional(),
    query('platform').optional(),
    query('APP_VERSION').optional(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    try {

      const { country, platform, APP_VERSION } = req.query
      if (country === COUNTRY_LIST.미국 && String(process.env.APP_VERSION) >= String(APP_VERSION) &&/*platform === 'android' ||*/ platform === 'ios') {
        return res.status(200).json({ myFollowing: [] })
      }


      const myFollowing: any = await UserService.getMyFollowing(req)

      if (myFollowing[0]?.Followings) {
        myFollowing[0].Followings = myFollowing[0]?.Followings?.sort((a: any, b: any) => {
          return a['dataValues'].lastVisit < b['dataValues'].lastVisit ? 1 : a['dataValues'].lastVisit > b['dataValues'].lastVisit ? -1 : 0
        })
      }
      myFollowing[0]?.Followings?.forEach((ele: any) => {
        const totalScoreLength = ele.Score?.score1 + ele.Score?.score2 + ele.Score?.score3 + ele.Score?.score4 + ele.Score?.score5
        const totalScore = ele.Score?.score1 * 1 + ele.Score?.score2 * 2 + ele.Score?.score3 * 3 + ele.Score?.score4 * 4 + ele.Score?.score5 * 5
        ele['dataValues'].avgScore = totalScore / totalScoreLength
      })
      return res.status(200).json({ status: 'true', myFollowing })
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })

  router.get('/profileInfo', [
    query('YouId').optional(),
    query('link').optional(),
    query('platform').optional(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    try {
      const [user, followCheck]: any = await UserService.profileInfo(req)
      let totalScoreLength = 1
      let totalScore = 0
      if (user?.Score) {
        totalScoreLength = user?.Score?.score1 + user?.Score?.score2 + user?.Score?.score3 + user?.Score?.score4 + user?.Score?.score5
        totalScore = user?.Score?.score1 * 1 + user?.Score?.score2 * 2 + user?.Score?.score3 * 3 + user?.Score?.score4 * 4 + user?.Score?.score5 * 5
      }
      user['dataValues'].avgScore = totalScore / totalScoreLength
      return res.status(200).json({ user, followCheck })
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })



  router.get('/profileInfo/v2', [
    query('YouId').optional(),
    query('link').optional(),
    query('country').optional(),
    query('platform').optional(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    try {

      const { country, platform } = req.query

      const [user, followCheck, followCount]: any = await UserService.profileInfoV2(req)
      if (!user && platform === 'web') {
        // https://nmoment.live/Profile/@orijho
        // 이런 삭제된 계정으로 접근시에는 리다이렉트 시켜야함
        // *web일때만 
        return res.status(200).json({ status: 'delete', user, followCheck, followCount })
      }
      let totalScoreLength = 1
      let totalScore = 0
      if (user?.Score) {
        totalScoreLength = user?.Score?.score1 + user?.Score?.score2 + user?.Score?.score3 + user?.Score?.score4 + user?.Score?.score5
        totalScore = user?.Score?.score1 * 1 + user?.Score?.score2 * 2 + user?.Score?.score3 * 3 + user?.Score?.score4 * 4 + user?.Score?.score5 * 5
      }
      user['dataValues'].avgScore = totalScore / totalScoreLength
      return res.status(200).json({ user, followCheck, followCount })
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })


  router.get('/profileData', [
    query('pageNum').optional(),
    query('pageSize').optional(),
    query('YouId').optional(),
    query('link').optional(),
    query('country').optional(),
    query('platform').optional(),
    query('APP_VERSION').optional(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    try {

      const { country, platform, APP_VERSION } = req.query

      const subscribe = await SubscribeService.getSubscribeState(req)
      const fanStepList = await SubscribeService.getProfileFanStep(req)
      const postLength: number = await PostService.postUserListLength(req)
      const postList: Post[] = await PostService.postUserList(req)

      if (country === COUNTRY_LIST.미국 && String(process.env.APP_VERSION) >= String(APP_VERSION) &&/*platform === 'android' ||*/ platform === 'ios') {
        const [user, followCheck, followCount]: any = await UserService.profileInfoV2Fake(req)
        return res.status(200).json({ user, followCheck, followCount, subscribe, fanStepList: [], postLength, postList: [] })
      }
      const [user, followCheck, followCount]: any = await UserService.profileInfoV2(req)
      if (!user && platform === 'web') {
        // https://nmoment.live/Profile/@orijho
        // 이런 삭제된 계정으로 접근시에는 리다이렉트 시켜야함
        // *web일때만 
        return res.status(200).json({ status: 'delete', user, followCheck, followCount })
      }
      let totalScoreLength = 1
      let totalScore = 0
      if (user?.Score) {
        totalScoreLength = user?.Score?.score1 + user?.Score?.score2 + user?.Score?.score3 + user?.Score?.score4 + user?.Score?.score5
        totalScore = user?.Score?.score1 * 1 + user?.Score?.score2 * 2 + user?.Score?.score3 * 3 + user?.Score?.score4 * 4 + user?.Score?.score5 * 5
      }
      user['dataValues'].avgScore = totalScore / totalScoreLength
      return res.status(200).json({ user, followCheck, followCount, subscribe, fanStepList, postLength, postList })
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })


  router.get('/profileDataNotLogin', [
    query('pageNum').optional(),
    query('pageSize').optional(),
    query('YouId').optional(),
    query('link').optional(),
    query('country').optional(),
    query('platform').optional(),
    validatorErrorChecker
  ], async (req: any, res: any, next: any) => {
    try {

      const { country, platform } = req.query

      const subscribe = await SubscribeService.getSubscribeState(req)
      const fanStepList = await SubscribeService.getProfileFanStep(req)
      const postLength: number = await PostService.postUserListLength(req)
      const postList: Post[] = await PostService.postUserList(req)

      const [user, followCheck, followCount]: any = await UserService.profileInfoV2(req)
      if (!user && platform === 'web') {
        // https://nmoment.live/Profile/@orijho
        // 이런 삭제된 계정으로 접근시에는 리다이렉트 시켜야함
        // *web일때만 
        return res.status(200).json({ status: 'delete', user, followCheck, followCount })
      }
      let totalScoreLength = 1
      let totalScore = 0
      if (user?.Score) {
        totalScoreLength = user?.Score?.score1 + user?.Score?.score2 + user?.Score?.score3 + user?.Score?.score4 + user?.Score?.score5
        totalScore = user?.Score?.score1 * 1 + user?.Score?.score2 * 2 + user?.Score?.score3 * 3 + user?.Score?.score4 * 4 + user?.Score?.score5 * 5
      }
      if (user) {
        user['dataValues'].avgScore = totalScore / totalScoreLength
      }
      return res.status(200).json({ user, followCheck, followCount, subscribe, fanStepList, postLength, postList })
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })

  router.get('/profileInfoNotLogin', [
    query('YouId').optional(),
    query('link').optional(),
    query('platform').optional(),
    validatorErrorChecker
  ], async (req: any, res: any, next: any) => {
    try {
      const [user, followCheck, followCount]: any = await UserService.profileInfoV2(req)
      let totalScoreLength = 1
      let totalScore = 0
      if (user?.Score) {
        totalScoreLength = user?.Score?.score1 + user?.Score?.score2 + user?.Score?.score3 + user?.Score?.score4 + user?.Score?.score5
        totalScore = user?.Score?.score1 * 1 + user?.Score?.score2 * 2 + user?.Score?.score3 * 3 + user?.Score?.score4 * 4 + user?.Score?.score5 * 5
      }
      if (user) {
        user['dataValues'].avgScore = totalScore / totalScoreLength
      }
      return res.status(200).json({ user, followCheck, followCount })
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })
  router.get('/searchUser', [
    query('keyword').exists(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    try {
      const searchList: any = await UserService.searchUser(req)
      return res.status(200).json({ status: 'true', searchList })
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })


  router.get('/liveList', [
    query('gender').exists(),
    query('global').exists(),
    query('country').exists(),
    query('pageNum').exists().toInt(),
    query('pageSize').exists().toInt(),
    query('platform').optional(),
    query('APP_VERSION').optional(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    try {
      const { country, platform, APP_VERSION } = req.query

      if (country === COUNTRY_LIST.미국 &&
        String(process.env.APP_VERSION) >= String(APP_VERSION) &&
         /*platform === 'android' ||*/ platform === 'ios') {
        const userList = await UserService.liveListFake(req)
        userList?.forEach((ele: any) => {
          const totalScoreLength = ele.Score?.score1 + ele.Score?.score2 + ele.Score?.score3 + ele.Score?.score4 + ele.Score?.score5
          const totalScore = ele.Score?.score1 * 1 + ele.Score?.score2 * 2 + ele.Score?.score3 * 3 + ele.Score?.score4 * 4 + ele.Score?.score5 * 5
          ele['dataValues'].avgScore = totalScore / totalScoreLength
        })
        return res.status(200).json({ userList })
      }

      async function fetchSockets() {
        for (let i = 0; i < 3; i++) {
          try {

            const socketData = JSON.parse(await getValue('socketData'))
            // const socketData = await req.app.get('io').of('/connect').fetchSockets()
            if (socketData && socketData?.length > 0) return socketData
          } catch (e) {
            logger.error('fetchSockets ERROR')
            logger.error(e)
            logger.error(JSON.stringify(e))
          }
        }
        return []
      }

      const userList = await UserService.liveList(req)
      const connectList: any = await fetchSockets()

      const liveList: any = []
      for (const socket of connectList) {
        liveList.push(Number(socket))
      }


      userList?.forEach((ele: any) => {
        const totalScoreLength = ele.Score?.score1 + ele.Score?.score2 + ele.Score?.score3 + ele.Score?.score4 + ele.Score?.score5
        const totalScore = ele.Score?.score1 * 1 + ele.Score?.score2 * 2 + ele.Score?.score3 * 3 + ele.Score?.score4 * 4 + ele.Score?.score5 * 5
        ele['dataValues'].avgScore = totalScore / totalScoreLength

        if (Number(ele?.id) === 6) {
          ele['dataValues'].on = false
        }
        else {
          if (liveList?.find((e: number) => e === ele?.id)) {
            ele['dataValues'].on = true
          } else ele['dataValues'].on = false
        }
      })


      return res.status(200).json({ userList })
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })
  router.get('/suggestionList', [
    query('gender').exists(),
    query('global').exists(),
    query('country').exists(),
    query('pageNum').exists(),
    query('pageSize').exists(),
    query('platform').optional(),
    query('APP_VERSION').optional(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    try {

      const { country, platform, APP_VERSION } = req.query
      if (country === COUNTRY_LIST.미국 && String(process.env.APP_VERSION) >= String(APP_VERSION) &&/*platform === 'android' ||*/ platform === 'ios') {
        return res.status(200).json({ suggestionList: [] })
      }

      const suggestionList = await UserService.suggestionList(req)
      suggestionList?.forEach((ele: any) => {
        const totalScoreLength = ele.Score?.score1 + ele.Score?.score2 + ele.Score?.score3 + ele.Score?.score4 + ele.Score?.score5
        const totalScore = ele.Score?.score1 * 1 + ele.Score?.score2 * 2 + ele.Score?.score3 * 3 + ele.Score?.score4 * 4 + ele.Score?.score5 * 5
        ele['dataValues'].avgScore = totalScore / totalScoreLength
      })
      return res.status(200).json({ suggestionList })
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })

  //myMcnList


  //
  router.get('/myBanList', [
    query('pageNum').exists(),
    query('pageSize').exists(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    try {
      if (req?.id === 6) return res.status(200).json({ banList: [] })
      else {
        const banList = await UserService.myBanList(req)
        return res.status(200).json({ banList });
      }
    } catch (err) {
      errorLogGet(req, err)
      return res.status(400).json({ status: 'error' })
    }
  })
}