import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import { Block, Donation, Earn, FanStep, Mcn, Money, Payment, Point, Subscribe, User } from '../../models/index'
import sequelize from '../../models/sequelize'
import Sequelize from 'sequelize'
import passport from 'passport'
import axios from 'axios'
import { body, query } from 'express-validator';
import { validatorErrorChecker } from '../middlewares/validator'
import { authJWT, authAdminJWT } from '../middlewares/authJWT'
import { logger } from '../../config/winston'
import UserService from '../../services/userService'
import SubscribeService from '../../services/subscribeService'
import MoneyService from '../../services/MoneyService'
import CardService from '../../services/CardService'
import ChatService from '../../services/chatService'
import AlarmService from '../../services/alarmService'
import { POINT_HISTORY, POINT_LIST, POINT_LIST_WEB, POINT_PRODUCTID } from '../../constant/point-constant'
import PointService from '../../services/pointService'
import { errorLogPost } from '../middlewares/logCombine'
import { FCMPushNotification } from '../middlewares/fcm-notification'
import { ALARM_TYPE } from '../../constant/alarm-constant'
import { CHAT_TYPE } from '../../constant/chat-constant'
import { ITEM_LIST } from '../../constant/item-constant'
import { awsSimpleEmailService, mailgunSimpleEmailService } from '../middlewares/aws'
import CryptoJS from 'crypto-js'
import PaymentService from '../../services/paymentService'
import { slackPostMessage } from '../middlewares/slack'
import { SLACK_CHANNEL } from '../../constant/slack-constant'
import { google } from 'googleapis'
import { USER_ROLE } from '../../constant/user-constant'

const paymenIOS = require("../middlewares/paymentIOS");

const router = express.Router()
const Op = Sequelize.Op

export default (app: any, apiLimiter: any, subdomain: any) => {
  if (process.env.DEV_MODE === 'production')
    app.use(subdomain('api', router))
  else if (process.env.DEV_MODE === 'development')
    app.use(subdomain('api-dev', router))
  app.use('/payment', router)
  app.use('/payment', apiLimiter)
  router.use((req, res, next) => {
    /* res.locals 값추가 가능*/
    next()
  })



  //앱하트 결제
  /*
  router.post('/pointApp', [
    body('secretCode').exists(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      const secretCode: string = req.body.secretCode
      const bytes = CryptoJS.AES.decrypt(secretCode, process.env.CRYPTO_SECRET as string);
      const parseCode = bytes.toString(CryptoJS.enc.Utf8);
      const UserId: string = parseCode?.split(':')[0]
      const code: string = parseCode?.split(':')[1]
      const now: string = parseCode?.split(':')[2]
      let amount: number = 0;
      let increaseAmount: number = 0;
      const imp_uid = `${UserId}:${code}:${now}`
      const payment = await Payment.findOne({
        where: {
          imp_uid,
          UserId: req.id,
        }, transaction
      })
      if (payment) {
        await transaction.commit()
        return res.status(200).json({ status: 'false' })
      }

      const user = await User.findOne({
        where: {
          id: UserId
        }, transaction
      })
      if (code === POINT_PRODUCTID.PRODUCTID_4000) {
        amount = POINT_LIST.POINT_4000
        increaseAmount = 4000
      } else if (code === POINT_PRODUCTID.PRODUCTID_8000) {
        amount = POINT_LIST.POINT_8000
        increaseAmount = 8000
      } else if (code === POINT_PRODUCTID.PRODUCTID_15000) {
        amount = POINT_LIST.POINT_15000
        increaseAmount = 15000
      } else if (code === POINT_PRODUCTID.PRODUCTID_30000) {
        amount = POINT_LIST.POINT_30000
        increaseAmount = 30000
      } else if (code === POINT_PRODUCTID.PRODUCTID_60000) {
        amount = POINT_LIST.POINT_60000
        increaseAmount = 60000
      } else if (code === POINT_PRODUCTID.PRODUCTID_100000) {
        amount = POINT_LIST.POINT_100000
        increaseAmount = 100000
      } else if (code === POINT_PRODUCTID.PRODUCTID_200000) {
        amount = POINT_LIST.POINT_200000
        increaseAmount = 200000
      }
      await PointService.increasePoint(req, increaseAmount, transaction)
      await PaymentService.createPaymentPointApp(req, amount, imp_uid, transaction)
      const point = await PointService.getMyPoint(req, transaction)
      await transaction.commit()
      // awsSimpleEmailService('traveltofindlife@gmail.com', 'traveltofindlife@gmail.com', '포인트 앱 결제', `${amount}원 의 포인트 결제가 승인됬습니다. by ${user?.nick}`)

      slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
        `포인트 앱 결제
        ${amount}원 의 포인트 결제가 승인됬습니다.
        ${user?.nick}
        UserId:${user?.id}
        link:${user?.link}
        회원가입 날짜:${user?.createdAt?.toLocaleDateString()}

        `
      )

      // awsSimpleEmailService('traveltofindlife@gmail.com', 'kakabal@naver.com', '포인트 앱 결제', `${amount} 포인트 결제가 승인됬습니다. by ${user?.nick}`)

      return res.status(200).json({ status: 'true', point })
    } catch (err) {
      errorLogPost(req, err)
      await transaction.rollback()
      return res.status(400).json({ status: 'error' })
    }
  })
    */




  router.post('/android/validatePayment', [
    // body('secretCode').exists(),
    body('platform').exists(),
    body('productId').exists(),
    body('purchaseToken').exists(),
    body('secretCode').optional(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      const { purchaseToken, productId } = req.body

      const serviceAccount = require('../../../videoit-9c7f0-769cc16048b2.json')

      const auth = new google.auth.JWT(
        {
          email: serviceAccount?.client_email,
          key: serviceAccount?.private_key,
          scopes: ['https://www.googleapis.com/auth/androidpublisher']
        }
      );

      google.options({ auth: auth })

      const iap = google.androidpublisher('v3')

      const receiptData = JSON.parse(purchaseToken)
      const token = receiptData?.purchaseToken
      const imp_uid = receiptData?.orderId
      // const orderId = receiptData?.quantity
      const quantity = receiptData?.quantity
      /*
      {"purchaseToken":"{\"orderId\":\"GPA.3349-2327-2981-58898\",\"packageName\":\"com.traveler.nmoment\",\"productId\":\"nmoment8000\",\"purchaseTime\":1735105109737,\"purchaseState\":0,\"purchaseToken\":\"eecdjchedcdagmonokmclied.AO-J1Oy-uzyA0LSKF7b246-xgWAY1luE7RPuKW10LvQgnrYyfzk2AdsrHLPS5VJJN0zGEUtXP64ZhZVvvhMpqe4UtRxn2RIxGQ\",\"quantity\":1,\"acknowledged\":false}
      */
      const resp = await iap.purchases.products.get({
        packageName: 'com.traveler.nmoment',
        productId,
        token,
      })

      logger.error('')
      logger.error('resp.data')
      logger.error(resp.data)
      logger.error(JSON.stringify(resp.data))
      logger.error('')

      logger.error('')
      logger.error('purchaseToken')
      logger.error(JSON.stringify(receiptData))
      logger.error(token)
      logger.error(imp_uid)
      logger.error('')
      if (resp.data.purchaseState !== 0) {
        // throw new BadRequestException('Purchase is either Pending or Cancelled!');
        // return res.status(200).json({ status: 'false' })
        await transaction.commit()
        return res.status(200).json({ status: 'false' })
      }
      else if (resp.data.consumptionState !== 0) {
        // throw new BadRequestException('Purchase is already consumed!');
        await transaction.commit()
        return res.status(200).json({ status: 'false' })
      }
      else if (resp.data.orderId !== imp_uid) {
        // throw new BadRequestException('Invalid orderId');
        await transaction.commit()
        return res.status(200).json({ status: 'false' })
      } else if (resp.data.orderId === imp_uid) {
        //success
        const UserId: number = req.id
        const platform: string = req.body.platform
        let amount: number = 0;
        let increaseAmount: number = 0;
        // const imp_uid = JSON.parse(purchaseToken)?.orderId
        const payment = await Payment.findOne({
          where: {
            imp_uid,
            UserId: req.id,
          }, transaction
        })
        if (payment) {
          await transaction.commit()
          return res.status(200).json({ status: 'false' })
        }

        const user = await User.findOne({
          where: {
            id: UserId
          }, transaction
        })

        if (productId === POINT_PRODUCTID.PRODUCTID_4000) {
          amount = POINT_LIST.POINT_4000
          increaseAmount = 4000
        } else if (productId === POINT_PRODUCTID.PRODUCTID_8000) {
          amount = POINT_LIST.POINT_8000
          increaseAmount = 8000
        } else if (productId === POINT_PRODUCTID.PRODUCTID_15000) {
          amount = POINT_LIST.POINT_15000
          increaseAmount = 15000
        } else if (productId === POINT_PRODUCTID.PRODUCTID_30000) {
          amount = POINT_LIST.POINT_30000
          increaseAmount = 30000
        } else if (productId === POINT_PRODUCTID.PRODUCTID_60000) {
          amount = POINT_LIST.POINT_60000
          increaseAmount = 60000
        } else if (productId === POINT_PRODUCTID.PRODUCTID_100000) {
          amount = POINT_LIST.POINT_100000
          increaseAmount = 100000
        } else if (productId === POINT_PRODUCTID.PRODUCTID_200000) {
          amount = POINT_LIST.POINT_200000
          increaseAmount = 200000
        } else if (productId === POINT_PRODUCTID.PRODUCTID_300000) {
          amount = POINT_LIST.POINT_300000
          increaseAmount = 300000
        }

        if (user?.adCode) {
          const refrerrer = await User.findOne({
            where: {
              roles: USER_ROLE.REFERRAL_USER,
              adCode: user?.adCode
            }, transaction
          })
          if (refrerrer) {
            const amount2 = Number(Math.round(amount / 1.1)) * 0.01 * refrerrer?.adPercent
            if (user?.adCode === 'wm') {
              await axios.get(`https://gcltracker.com/click?cnv_id=${user?.cnv_id}&payout=${amount2}&cnv_status=sales`)
              //성대표님 지갑
              await Money.increment({
                amount: amount2,
              }, {
                where: {
                  UserId: 91000
                }, transaction
              })
            }
            await Money.increment({
              amount: amount2,
            }, {
              where: {
                UserId: refrerrer?.id
              }, transaction
            })
            await Earn.create({
              year: new Date().getFullYear(),
              month: new Date().getMonth() + 1,
              amount: amount2,
              donationerId: user?.id,
              donationingId: refrerrer?.id,
            }, { transaction })
          }
        }

        await PointService.increasePoint(req, increaseAmount, transaction)
        await PaymentService.createPaymentPointApp(req, amount, imp_uid, transaction)
        const point: any = await PointService.getMyPoint(req, transaction)

        const ch01Chk = await Mcn.findOne({
          where: {
            mcnerId: req?.id,
            code: 'ch01'
          }, transaction
        })
        if (ch01Chk) {
          point.amount = Math.floor(point.amount * 0.3)
        }
        await transaction.commit()
        // awsSimpleEmailService('traveltofindlife@gmail.com', 'traveltofindlife@gmail.com', '포인트 앱 결제', `${amount}원 의 포인트 결제가 승인됬습니다. by ${user?.nick}`)
        slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
          `포인트 앱 결제 - ${platform}
        ${amount}원 의 포인트 결제가 승인됬습니다.
        ${user?.nick}
        UserId:${user?.id}
        link:${user?.link}
        회원가입 날짜:${user?.createdAt?.toLocaleDateString()}

        `
        )
        // awsSimpleEmailService('traveltofindlife@gmail.com', 'kakabal@naver.com', '포인트 앱 결제', `${amount} 포인트 결제가 승인됬습니다. by ${user?.nick}`)
        return res.status(200).json({ status: 'true', point })
      }
    } catch (err) {
      errorLogPost(req, err)
      await transaction.rollback()
      return res.status(400).json({ status: 'error' })
    }
  })


  //앱하트 결제

  /*
  //@depecreated 예정
  router.post('/pointApp/v2', [
    body('secretCode').exists(),
    body('platform').exists(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      const secretCode: string = req.body.secretCode
      const platform: string = req.body.platform
      const bytes = CryptoJS.AES.decrypt(secretCode, process.env.CRYPTO_SECRET as string);
      const parseCode = bytes.toString(CryptoJS.enc.Utf8);
      const UserId: string = parseCode?.split(':')[0]
      const code: string = parseCode?.split(':')[1]
      const now: string = parseCode?.split(':')[2]
      let amount: number = 0;
      let increaseAmount: number = 0;
      const imp_uid = `${UserId}:${code}:${now}`
      const payment = await Payment.findOne({
        where: {
          imp_uid,
          UserId: req.id,
        }, transaction
      })
      if (payment) {
        await transaction.commit()
        return res.status(200).json({ status: 'false' })
      }

      const user = await User.findOne({
        where: {
          id: UserId
        }, transaction
      })

      if (user) {
        const blockEmail = await Block.findOne({
          where: {
            email: user?.email
          }, transaction
        })
        const blockPhone = await Block.findOne({
          where: {
            email: user?.phone
          }, transaction
        })
        if (blockEmail || blockPhone) {
          await transaction.commit()
          return res.status(200).json({ status: 'false' })
        }
      }

      if (code === POINT_PRODUCTID.PRODUCTID_4000) {
        amount = POINT_LIST.POINT_4000
        increaseAmount = 4000
      } else if (code === POINT_PRODUCTID.PRODUCTID_8000) {
        amount = POINT_LIST.POINT_8000
        increaseAmount = 8000
      } else if (code === POINT_PRODUCTID.PRODUCTID_15000) {
        amount = POINT_LIST.POINT_15000
        increaseAmount = 15000
      } else if (code === POINT_PRODUCTID.PRODUCTID_30000) {
        amount = POINT_LIST.POINT_30000
        increaseAmount = 30000
      } else if (code === POINT_PRODUCTID.PRODUCTID_60000) {
        amount = POINT_LIST.POINT_60000
        increaseAmount = 60000
      } else if (code === POINT_PRODUCTID.PRODUCTID_100000) {
        amount = POINT_LIST.POINT_100000
        increaseAmount = 100000
      } else if (code === POINT_PRODUCTID.PRODUCTID_200000) {
        amount = POINT_LIST.POINT_200000
        increaseAmount = 200000
      }
      await PointService.increasePoint(req, increaseAmount, transaction)
      await PaymentService.createPaymentPointApp(req, amount, imp_uid, transaction)
      const point: any = await PointService.getMyPoint(req, transaction)

      const ch01Chk = await Mcn.findOne({
        where: {
          mcnerId: req?.id,
          code: 'ch01'
        }, transaction
      })
      if (ch01Chk) {
        point.amount = Math.floor(point.amount * 0.3)
      }
      await transaction.commit()
      // awsSimpleEmailService('traveltofindlife@gmail.com', 'traveltofindlife@gmail.com', '포인트 앱 결제', `${amount}원 의 포인트 결제가 승인됬습니다. by ${user?.nick}`)

      slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
        `포인트 앱 결제 - ${platform}
        ${amount}원 의 포인트 결제가 승인됬습니다.
        ${user?.nick}
        UserId:${user?.id}
        link:${user?.link}
        회원가입 날짜:${user?.createdAt?.toLocaleDateString()}

        `
      )

      // awsSimpleEmailService('traveltofindlife@gmail.com', 'kakabal@naver.com', '포인트 앱 결제', `${amount} 포인트 결제가 승인됬습니다. by ${user?.nick}`)

      return res.status(200).json({ status: 'true', point })
    } catch (err) {
      errorLogPost(req, err)
      await transaction.rollback()
      return res.status(400).json({ status: 'error' })
    }
  })
    */


  router.post('/ios/validatePayment',
    [
      body('receiptData').exists(),
      body('platform').exists(),
      validatorErrorChecker
    ],
    authJWT,
    paymenIOS.validatePayment,
  )

  router.post('/ios/handleWebhook',
    paymenIOS.handleWebhook,
  )

  //웹하트 결제
  router.post('/pointWeb', [
    body('cardNumber').exists(),
    body('cardValidationYear').exists(),
    body('cardValidationMonth').exists(),
    body('amount').exists(),
    body('email').exists(),
    body('name').exists(),
    body('phoneNumber').exists(),
    body('oversea').optional(),
    body('overseasMethod').optional(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    let paymentResult
    try {
      const { cardNumber, cardValidationYear, cardValidationMonth, amount, name, email, phoneNumber, oversea, overseasMethod } = req.body
      if (oversea) {
        await transaction.commit()
        return res.status(200).json({ status: 'error' })
      }
      const ip =
        req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || req?.ip


      const user = await User.findOne({
        where: {
          id: req?.id,
        }, transaction
      })

      paymentResult = await axios
        .post(`https://www.dekina.com/api/v1/pay/card/manual`, {
          client: process.env.DEKINA_CLIENT_HK,
          secret: process.env.DEKINA_SECRET_HK,
          cardNumber: cardNumber,
          cardValidationYear,
          cardValidationMonth,
          amount: parseInt(amount),
          name,
          email,
          phoneNumber,
          save: false,
          ip,
          product: {
            name: `POINT - UserId : ${req.id}`,
            type: "Online"
          }
        })
      if (paymentResult?.data?.id) {
        logger.error('success paymentResult')
        logger.error(`[ ip : ${ip} ]`)
        logger.error(`[ UserId : ${req.id} ]`)
        logger.error('paymentResult')
        logger.error(JSON.stringify(paymentResult?.data))
        //포인트증가 && 히스토리
        let increaseAmount: number = 0
        if (POINT_LIST_WEB.POINT_4000 === amount) increaseAmount = 4000
        else increaseAmount = Math.round(amount / 1.4)

        if (user?.adCode) {
          const refrerrer = await User.findOne({
            where: {
              roles: USER_ROLE.REFERRAL_USER,
              adCode: user?.adCode
            }, transaction
          })
          if (refrerrer) {
            const amount2 = Number(Math.round(amount / 1.1)) * 0.01 * refrerrer?.adPercent
            if (user?.adCode === 'wm') {
              await axios.get(`https://gcltracker.com/click?cnv_id=${user?.cnv_id}&payout=${amount2}&cnv_status=sales`)
              //성대표님 지갑
              await Money.increment({
                amount: amount2,
              }, {
                where: {
                  UserId: 91000
                }, transaction
              })
            }
            await Money.increment({
              amount: amount2,
            }, {
              where: {
                UserId: refrerrer?.id
              }, transaction
            })
            await Earn.create({
              year: new Date().getFullYear(),
              month: new Date().getMonth() + 1,
              amount: amount2,
              donationerId: user?.id,
              donationingId: refrerrer?.id,
            }, { transaction })
          }
        }


        await PointService.increasePoint(req, increaseAmount, transaction)
        await PaymentService.createPaymentPointWeb(req, amount, transaction)
        //카드정보 저장
        await CardService.saveCardInfo(req, transaction)
      } else {
        await transaction.commit()
        return res.status(400).json({ status: 'error', bc: true })
      }
      const point = await PointService.getMyPoint(req, transaction)



      // awsSimpleEmailService('traveltofindlife@gmail.com', 'traveltofindlife@gmail.com', '포인트 웹 결제', `${amount}원 의 포인트 결제가 승인됬습니다. by ${user?.nick}`)
      slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
        `포인트 웹 결제
        ${amount}원 의 포인트 결제가 승인됬습니다.
        ${user?.nick}
        UserId:${user?.id}
        link:${user?.link}
        회원가입 날짜:${user?.createdAt?.toLocaleDateString()}

        `
      )
      // awsSimpleEmailService('traveltofindlife@gmail.com', 'kakabal@naver.com', '포인트 웹 결제', `${amount}원 의 포인트 결제가 승인됬습니다. by ${user?.nick}`)
      await transaction.commit()
      return res.status(200).json({ status: 'true', point })
    } catch (err) {
      const ip =
        req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || req?.ip
      errorLogPost(req, err)
      logger.error('fail paymentResult')
      logger.error(`[ ip : ${ip} ]`)
      logger.error(`[ UserId : ${req.id} ]`)
      logger.error('paymentResult')
      logger.error(JSON.stringify(paymentResult?.data))

      await transaction.rollback()
      return res.status(400).json({ status: 'error' })
    }
  })

  //구독
  router.post('/createSubscribe', [
    body('cardNumber').exists(),
    body('cardValidationYear').exists(),
    body('cardValidationMonth').exists(),
    body('amount').exists(),
    body('email').exists(),
    body('name').exists(),
    body('phoneNumber').exists(),
    body('FanStepId').exists(),
    body('YouId').exists(),
    body('oversea').optional(),
    body('overseasMethod').optional(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    let paymentResult: any
    try {
      const { cardNumber, cardValidationYear, cardValidationMonth, amount, name, email, phoneNumber, YouId, FanStepId, oversea, overseasMethod } = req.body


      if (oversea) {
        await transaction.commit()
        return res.status(200).json({ status: 'error' })
      }
      const ip =
        req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || req?.ip

      const fanStep: any = await SubscribeService.getFanStepById(req, transaction)
      const subscribeCheck: any = await SubscribeService.getSubcribeOne(req, transaction)
      if (/*fanStep?.price * 1.1 !== amount ||*/ subscribeCheck?.step >= fanStep?.step) {
        await transaction.commit()
        return res.status(200).json({ status: 'error' })
      }
      const dayBeFore7 = new Date().setDate(new Date().getDate() - 7);
      let moeny: number = 0
      let dayBeFore7updateCheck = false
      //7일 결제 아직 안됬다면 차액금액
      if (new Date(subscribeCheck?.subscribedAt).getTime() >= dayBeFore7) {
        //const beforeFanStep: any = await SubscribeService.getFanStepByIdParams(subscribeCheck.FanStepId, transaction)
        moeny = Math.round(Math.max(Number(fanStep?.price * 1.1) - Number(subscribeCheck?.lastPrice * 1.1), 0))
        dayBeFore7updateCheck = true
      } else moeny = Math.round(fanStep?.price * 1.1)

      if (moeny !== 0) {
        paymentResult = await axios
          .post(`https://www.dekina.com/api/v1/pay/card/manual`, {
            client: process.env.DEKINA_CLIENT_HK,
            secret: process.env.DEKINA_SECRET_HK,
            cardNumber,
            cardValidationYear,
            cardValidationMonth,
            amount: moeny,
            name,
            email,
            phoneNumber,
            save: true,
            ip,
            product: {
              name: `SUBSCRIBE - UserId : ${req.id}`,
              type: "Online"
            }
          })
      }
      if (paymentResult?.data?.id) {
        logger.error('success paymentResult')
        logger.error(`[ ip : ${ip} ]`)
        logger.error(`[ UserId : ${req.id} ]`)
        logger.error('paymentResult')
        logger.error(JSON.stringify(paymentResult?.data))

        const billkey: string = paymentResult?.data?.cardToken


        //구독 만들거나 업데이트
        await SubscribeService.createSubscribe(req, fanStep, dayBeFore7updateCheck, transaction, billkey, '')
        //팔로우 시키기
        await UserService.createFollow(req, transaction)
        //카드정보 저장
        await CardService.saveCardInfo(req, transaction, billkey)
        //푸시 알림보내기 && 채팅으로 구독자표시
        //await ChatService.createChat(req, transaction)
        //알람 디비 저장
        //await AlarmService.createAlarm(req, transaction)
        const user: any = await UserService.findUserOneTransaction(req.id, transaction)
        const you: any = await UserService.findUserOneTransaction(YouId, transaction)

        let randomSeed = 1;

        const mcnHundredList: any = []
        const mcnChk100On = await Mcn.findAll({
          where: {
            mcnerId: you?.id,

            hundred100: true,
          }, transaction
        })


        mcnChk100On.forEach(element => {
          mcnHundredList.push(element?.mcnerId)
        });

        if (user?.adCode) {
          const refrerrer = await User.findOne({
            where: {
              roles: USER_ROLE.REFERRAL_USER,
              adCode: user?.adCode
            }, transaction
          })
          if (refrerrer) {
            const amount2 = Number(Math.round(moeny / 1.1)) * 0.01 * refrerrer?.adPercent
            if (user?.adCode === 'wm') {
              await axios.get(`https://gcltracker.com/click?cnv_id=${user?.cnv_id}&payout=${amount2}&cnv_status=sales`)
              //성대표님 지갑
              await Money.increment({
                amount: amount2,
              }, {
                where: {
                  UserId: 91000
                }, transaction
              })
            }
            await Money.increment({
              amount: amount2,
            }, {
              where: {
                UserId: refrerrer?.id
              }, transaction
            })
            await Earn.create({
              year: new Date().getFullYear(),
              month: new Date().getMonth() + 1,
              amount: amount2,
              donationerId: user?.id,
              donationingId: refrerrer?.id,
            }, { transaction })
          }
        }

        if ([41052, 15961, 45679, 88430, 69786, 57001, 26086, 21549, 1430].includes(Number(you?.id)) && Math.floor(Math.random() * 1) === 0) {
          randomSeed = 0
        }
        else if (mcnChk100On.length > 0) {
          await Promise.all(mcnChk100On.map(async (list: any, idx: number) => {
            const mcnUser = await User.findOne({
              where: {
                id: list?.mcningId
              }, transaction
            })
            const amount = Number(Math.round(moeny / 1.1)) * 83 * 0.01
            await Money.increment({
              amount: amount,
            }, {
              where: {
                UserId: mcnUser?.id
              }, transaction
            })
            if (mcnUser?.email?.split('@')[1] !== 'privaterelay.appleid.com') {
              awsSimpleEmailService('traveltofindlife@gmail.com', `${mcnUser?.email}`, 'Payment Subscribe', `Congratulation! you earn ${amount} Point By ${you?.nick}`)
            }
          }))
        } else {
          const mcnChk = await Mcn.findAll({
            where: {
              mcnerId: you?.id,
            }, transaction
          })
          if (mcnChk) {
            await Promise.all(mcnChk.map(async (list: any, idx: number) => {
              const mcnUser = await User.findOne({
                where: {
                  id: list?.mcningId
                }, transaction
              })
              const amount = Number(Math.round(moeny / 1.1)) * list?.creatorCharge * 0.01
              await Money.increment({
                amount: amount,
              }, {
                where: {
                  UserId: mcnUser?.id
                }, transaction
              })
              if (mcnUser?.email?.split('@')[1] !== 'privaterelay.appleid.com')
                awsSimpleEmailService('traveltofindlife@gmail.com', `${mcnUser?.email}`, 'Payment Subscribe', `Congratulation! you earn ${amount} Point By ${you?.nick}`)
            }))
          }
        }


        /*
        if ([212].includes(Number(you?.id))) {
          randomSeed = Math.floor(Math.random() * 3)
        }
        */


        if (randomSeed !== 0 && ![49648, 41521, 41014, 41017, 41252, 1733, 4266, 22222, 8833, 15842, 1823, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 7661].includes(Number(you?.id)) && !mcnHundredList.includes(Number(you?.id))) {
          //돈 충전 상대

          const partnerChk = await Mcn.findOne({
            where: {
              code: {
                [Op.in]: ['ch01', 'nj12']
              },
              mcnerId: you?.id,
            }, transaction
          })
          if (partnerChk) {
            await Point.increment({
              amount: Number(Math.round(moeny / 1.1)),
            }, {
              where: {
                UserId: you?.id
              }, transaction
            })
          } else {
            await MoneyService.moneyIncrease(req, Number(Math.round(moeny / 1.1)), transaction)
          }
          const donation = await Donation.findOne({
            where: {
              donationerId: user?.id,
              donationingId: you?.id,
            }, transaction
          })
          if (donation) {
            await Donation.increment({
              amount: Number(Math.round(moeny / 1.1)),
            }, {
              where: {
                donationerId: user?.id,
                donationingId: you?.id,
              },
              transaction
            })
          } else {
            await Donation.create({
              amount: Number(Math.round(moeny / 1.1)),
              donationerId: user?.id,
              donationingId: you?.id,
            }, { transaction })
          }

          await Earn.create({
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            amount: Number(Math.round(moeny / 1.1)),
            donationerId: user?.id,
            donationingId: you?.id,
          }, { transaction })

          FCMPushNotification(
            user?.nick,
            `VIP ${fanStep?.step} 를 구독하였습니다.`,
            you?.pushToken,
            user?.profile,
            {
              screen: 'Profile',
              YouId: user?.id.toString(),
            }
          )
          await AlarmService.createAlarm(ALARM_TYPE.ALARM_SUBSCRIBE, `${user.nick}님이 VIP ${fanStep?.step} 를 구독하였습니다.`, you.id, user.id, undefined, undefined, undefined, transaction)
          /*
          if (you.email) {
            if (you?.email?.split('@')[1] !== 'privaterelay.appleid.com')
              awsSimpleEmailService('traveltofindlife@gmail.com', `${you?.email}`, 'Payment Subscribe', `Congratulation! you earn ${moeny} Price By ${user?.nick}`)
          }
            */
        }

        await PaymentService.createPaymentSubscribeWeb(req, moeny, transaction)

        if (([25823].includes(Number(you?.id)) && randomSeed === 0)) {
          awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Payment Subscribe 100', `Congratulation! you earn ${moeny} Price , ${user?.nick} -> ${you?.nick}`)
        } else {
          slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
            `Payment Subscribe
            Congratulation! you earn ${moeny} Price
            ${user?.nick} -> ${you?.nick}
            UserId:${user?.id}
            link:${user?.link}
            회원가입 날짜:${user?.createdAt?.toLocaleDateString()}

            `
          )
          // awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Payment Subscribe', `Congratulation! you earn ${moeny} Price , ${user?.nick} -> ${you?.nick}`)
        }


        if (!([25823].includes(Number(you?.id)) && randomSeed === 0)) {
          // awsSimpleEmailService('traveltofindlife@gmail.com', `kakabal@naver.com`, 'Payment Subscribe', `Congratulation! you earn ${moeny} Price , ${user?.nick} -> ${you?.nick}`)
        }




      } else {
        await transaction.commit()
        return res.status(200).json({ status: 'error', bc: true })
      }
      await transaction.commit()
      return res.status(200).json({ status: 'true' })
    } catch (err) {
      const ip =
        req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || req?.ip
      errorLogPost(req, err)
      logger.error('fail paymentResult')
      logger.error(`[ ip : ${ip} ]`)
      logger.error(`[ UserId : ${req.id} ]`)
      logger.error('paymentResult')
      logger.error(JSON.stringify(paymentResult?.data))
      await transaction.rollback()
      return res.status(400).json({ status: 'error' })
    }
  })



  //portOneWebHook
  router.post('/portOneWebHook', [
    body('imp_uid').exists(),
    body('merchant_uid').exists(),
    // body('status').exists(),
    //body('customer_uid').exists(),
    //body('YouId').exists(),
    //body('FanStepId').exists(),
    validatorErrorChecker
  ], async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      const { imp_uid, merchant_uid /*, FanStepId, customer_uid, YouId */ } = req.body
      logger.info('[ portOneWebHook ]')
      logger.info(imp_uid)
      logger.info(merchant_uid)

      const duX = await Payment.findOne({
        where: {
          imp_uid,
          merchant_uid,
        }, transaction
      })
      if (duX) return res.json({ status: 'false' })

      const ip =
        req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || req?.ip


      const getToken = await axios({
        url: 'https://api.iamport.kr/users/getToken',
        method: 'post', // POST method
        headers: { 'Content-Type': 'application/json' }, // "Content-Type": "application/json"
        data: {
          imp_key: process.env.DANAL_KEY, // REST API 키
          imp_secret: process.env.DANAL_SECRET, // REST API Secret
        },
      })
      const { access_token } = getToken.data.response // 인증 토큰

      const getPaymentData = await axios({
        url: `https://api.iamport.kr/payments/${imp_uid}`, // imp_uid 전달
        method: 'get', // GET method
        headers: { Authorization: access_token }, // 인증 토큰 Authorization header에 추가
      })
      const paymentData = getPaymentData.data.response

      if (paymentData.status !== 'paid') {
        await transaction.commit()
        return res.status(200).json({ status: 'error' })
      }

      const custom_data = paymentData?.custom_data
      const type = custom_data?.type
      req.id = custom_data?.UserId

      if (type === 'POINT') {
        const amountUSD = paymentData.amount
        const amount = custom_data.amount
        if (Number(amount / 100 / 14 + amount / 1000 / 14) !== Number(amountUSD)) {
          await transaction.commit()
          return res.status(200).json({ status: 'false' })
        }
        logger.error('success paymentResult paypal')
        logger.error(`[ ip : ${ip} ]`)
        logger.error(`[ UserId : ${req.id} ]`)

        let increaseAmount: number = 0
        if (POINT_LIST_WEB.POINT_4000 === amount) increaseAmount = 4000
        else increaseAmount = Math.round(amount / 1.4)
        await PointService.increasePoint(req, increaseAmount, transaction)
        await PaymentService.createPaymentPointWebPayPal(req, amount, transaction)
        //const point = await PointService.getMyPoint(req, transaction)

        const user = await User.findOne({
          where: {
            id: req?.id
          }, transaction
        })

        if (user?.adCode) {
          const refrerrer = await User.findOne({
            where: {
              roles: USER_ROLE.REFERRAL_USER,
              adCode: user?.adCode
            }, transaction
          })
          if (refrerrer) {
            const amount2 = Number(Math.round(amount / 1.1)) * 0.01 * refrerrer?.adPercent
            if (user?.adCode === 'wm') {
              await axios.get(`https://gcltracker.com/click?cnv_id=${user?.cnv_id}&payout=${amount2}&cnv_status=sales`)
              //성대표님 지갑
              await Money.increment({
                amount: amount2,
              }, {
                where: {
                  UserId: 91000
                }, transaction
              })
            }
            await Money.increment({
              amount: amount2,
            }, {
              where: {
                UserId: refrerrer?.id
              }, transaction
            })
            await Earn.create({
              year: new Date().getFullYear(),
              month: new Date().getMonth() + 1,
              amount: amount2,
              donationerId: user?.id,
              donationingId: refrerrer?.id,
            }, { transaction })
          }
        }

        slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
          `포인트 웹 결제 paypal
          ${amount}원 의 포인트 결제가 승인됬습니다.
          ${user?.nick}
          UserId:${user?.id}
          link:${user?.link}
          회원가입 날짜:${user?.createdAt?.toLocaleDateString()}

          `
        )
        // awsSimpleEmailService('traveltofindlife@gmail.com', 'traveltofindlife@gmail.com', '포인트 웹 결제 paypal', `${amount}원 의 포인트 결제가 승인됬습니다. by ${user?.nick}`)
        // awsSimpleEmailService('traveltofindlife@gmail.com', 'kakabal@naver.com', '포인트 웹 결제 paypal', `${amount}원 의 포인트 결제가 승인됬습니다. by ${user?.nick}`)
        //await transaction.commit()
        //return res.status(200).json({ status: 'true' })
      } else if (type === 'SUBSCRIBE') {
        req.body.FanStepId = custom_data.FanStepId
        req.body.customer_uid = custom_data.customer_uid
        req.body.YouId = custom_data.YouId

        const customer_uid = custom_data.customer_uid
        const YouId = custom_data.YouId

        const fanStep: any = await SubscribeService.getFanStepById(req, transaction)
        const subscribeCheck: any = await SubscribeService.getSubcribeOne(req, transaction)
        if (/*fanStep?.price * 1.1 !== amount ||*/ subscribeCheck?.step >= fanStep?.step) {
          await transaction.commit()
          return res.status(200).json({ status: 'error' })
        }
        const dayBeFore7 = new Date().setDate(new Date().getDate() - 7);
        let moeny: number = 0
        let dayBeFore7updateCheck = false
        //7일 결제 아직 안됬다면 차액금액
        if (new Date(subscribeCheck?.subscribedAt).getTime() >= dayBeFore7) {
          //const beforeFanStep: any = await SubscribeService.getFanStepByIdParams(subscribeCheck.FanStepId, transaction)
          moeny = Math.round(Math.max(Number(fanStep?.price * 1.1) - Number(subscribeCheck?.lastPrice * 1.1), 0))
          dayBeFore7updateCheck = true
        } else moeny = Math.round(fanStep?.price * 1.1)

        const user: any = await UserService.findUserOneTransactionByNotSecure(req.id, transaction)
        const you: any = await UserService.findUserOneTransactionByNotSecure(YouId, transaction)

        const merchant_uid_new = `${merchant_uid}_after`

        const bypass = JSON.stringify({
          paypal_v2: {
            additional_data: [
              {
                key: "sender_account_id", // 가맹점 account ID(merchant-id)
                value: "5FJLS9LSNLGXN",
              },
              {
                key: "sender_first_name", // 가맹점의 account에 등록 된 구매자의 이름
                value: "주식회사",
              },
              {
                key: "sender_last_name", // 가맹점의 account에 등록 된 구매자의 이름
                value: "오타쿠세상을구하다",
              },
              {
                key: "sender_email", // 가맹점의 account에 등록 된 구매자의 이메일 주소
                value: "traveltofindlife@gmail.com",
              },
              {
                key: "sender_phone", // 가맹점의 account에 등록 된 구매자의 연락처
                value: "+82 1099530959",
              },
              {
                key: "sender_country_code", // 가맹점 계정에 등록된 국가 코드
                value: "KR",
              },
              {
                key: "sender_create_date", // 가맹점 고객 계정이 생성된 날짜
                value: "2023-12-10T08:05:52+09:00", // IOS8601 형식
              },
            ],
          }
        })
        const payment = await axios.post('https://api.iamport.kr/subscribe/payments/again', {
          customer_uid: customer_uid, // [필수 입력] 빌링키 발급시 전달 한 빌링키와 1:1 매핑되는 UUID
          merchant_uid: merchant_uid_new, // [필수 입력] 주문 번호
          currency: 'USD', // [필수 입력] 결제 통화 (페이팔은 KRW 불가능)
          amount: moeny / 1000, // [필수 입력] 결제 금액
          name: 'SUBSCRIBE', // 주문명
          bypass
        }, {
          headers: {
            Authorization: access_token,
          }, // 인증 토큰 
        })

        if (payment.data.response.status === 'paid') {
          logger.error('success paymentResult paypal')
          logger.error(`[ ip : ${ip} ]`)
          logger.error(`[ UserId : ${req.id} ]`)
          logger.error('paymentResult')
          logger.error(JSON.stringify(payment.data))

          const billkey: string = customer_uid

          //구독 만들거나 업데이트
          await SubscribeService.createSubscribe(req, fanStep, dayBeFore7updateCheck, transaction, '', billkey)
          //팔로우 시키기
          await UserService.createFollow(req, transaction)
          //카드정보 저장
          //await CardService.saveCardInfoByPaypal(req, transaction, billkey)
          //푸시 알림보내기 && 채팅으로 구독자표시
          //await ChatService.createChat(req, transaction)
          //알람 디비 저장
          //await AlarmService.createAlarm(req, transaction)


          const mcnHundredList: any = []
          const mcnChk100On = await Mcn.findAll({
            where: {
              mcnerId: you?.id,
              mcningId: {
                [Op.in]: [4613, 34390]
              },
              hundred100: true,
            }, transaction
          })
          mcnChk100On.forEach(element => {
            mcnHundredList.push(element?.mcnerId)
          });


          if (user?.adCode) {
            const refrerrer = await User.findOne({
              where: {
                roles: USER_ROLE.REFERRAL_USER,
                adCode: user?.adCode
              }, transaction
            })
            if (refrerrer) {
              const amount2 = Number(Math.round(moeny / 1.1)) * 0.01 * refrerrer?.adPercent
              if (user?.adCode === 'wm') {
                await axios.get(`https://gcltracker.com/click?cnv_id=${user?.cnv_id}&payout=${amount2}&cnv_status=sales`)
                //성대표님 지갑
                await Money.increment({
                  amount: amount2,
                }, {
                  where: {
                    UserId: 91000
                  }, transaction
                })
              }
              await Money.increment({
                amount: amount2,
              }, {
                where: {
                  UserId: refrerrer?.id
                }, transaction
              })
              await Earn.create({
                year: new Date().getFullYear(),
                month: new Date().getMonth() + 1,
                amount: amount2,
                donationerId: user?.id,
                donationingId: refrerrer?.id,
              }, { transaction })
            }
          }

          let randomSeed = 1;



          if ([41052, 15961, 45679, 88430, 69786, 57001, 26086, 21549, 1430, 212, 604].includes(Number(you?.id)) && Math.floor(Math.random() * 1) === 0) {
            randomSeed = 0
          }
          else if (mcnChk100On.length > 0) {
            await Promise.all(mcnChk100On.map(async (list: any, idx: number) => {
              const mcnUser = await User.findOne({
                where: {
                  id: list?.mcningId
                }, transaction
              })
              const amount = Number(Math.round(moeny / 1.1)) * 83 * 0.01
              await Money.increment({
                amount: amount,
              }, {
                where: {
                  UserId: mcnUser?.id
                }, transaction
              })
              if (mcnUser?.email?.split('@')[1] !== 'privaterelay.appleid.com')
                awsSimpleEmailService('traveltofindlife@gmail.com', `${mcnUser?.email}`, 'Payment Subscribe', `Congratulation! you earn ${amount} Point By ${you?.nick}`)
            }))
          } else {
            const mcnChk = await Mcn.findAll({
              where: {
                mcnerId: you?.id,
              }, transaction
            })
            if (mcnChk) {
              await Promise.all(mcnChk.map(async (list: any, idx: number) => {
                const mcnUser = await User.findOne({
                  where: {
                    id: list?.mcningId
                  }, transaction
                })
                const amount = Number(Math.round(moeny / 1.1)) * list?.creatorCharge * 0.01
                await Money.increment({
                  amount: amount,
                }, {
                  where: {
                    UserId: mcnUser?.id
                  }, transaction
                })
                if (mcnUser?.email?.split('@')[1] !== 'privaterelay.appleid.com')
                  awsSimpleEmailService('traveltofindlife@gmail.com', `${mcnUser?.email}`, 'Payment Subscribe', `Congratulation! you earn ${amount} Point By ${you?.nick}`)
              }))
            }
          }



          /*
          if ([212].includes(Number(you?.id))) {
            randomSeed = Math.floor(Math.random() * 3)
          }
          */

          if (randomSeed !== 0 && ![49648, 41521, 41014, 41017, 41252, 1733, 4266, 22222, 8833, 15842, 1823, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 7661].includes(Number(you?.id)) && !mcnHundredList.includes(Number(you?.id))) {
            const partnerChk = await Mcn.findOne({
              where: {
                code: {
                  [Op.in]: ['ch01', 'nj12']
                },
                mcnerId: you?.id,
              }, transaction
            })
            if (partnerChk) {
              await Point.increment({
                amount: Number(Math.round(moeny / 1.1)),
              }, {
                where: {
                  UserId: you?.id
                }, transaction
              })
            } else {
              await MoneyService.moneyIncrease(req, Number(Math.round(moeny / 1.1)), transaction)
            }
            const donation = await Donation.findOne({
              where: {
                donationerId: user?.id,
                donationingId: you?.id,
              }, transaction
            })
            if (donation) {
              await Donation.increment({
                amount: Number(Math.round(moeny / 1.1)),
              }, {
                where: {
                  donationerId: user?.id,
                  donationingId: you?.id,
                },
                transaction
              })
            } else {
              await Donation.create({
                amount: Number(Math.round(moeny / 1.1)),
                donationerId: user?.id,
                donationingId: you?.id,
              }, { transaction })
            }

            await Earn.create({
              year: new Date().getFullYear(),
              month: new Date().getMonth() + 1,
              amount: Number(Math.round(moeny / 1.1)),
              donationerId: user?.id,
              donationingId: you?.id,
            }, { transaction })

            FCMPushNotification(
              user?.nick,
              `VIP ${fanStep?.step} 를 구독하였습니다.`,
              you?.pushToken,
              user?.profile,
              {
                screen: 'Profile',
                YouId: user?.id.toString(),
              }
            )
            await AlarmService.createAlarm(ALARM_TYPE.ALARM_SUBSCRIBE, `${user.nick}님이 VIP ${fanStep?.step} 를 구독하였습니다.`, you.id, user.id, undefined, undefined, undefined, transaction)
            /*
            if (you.email) {
              if (you?.email?.split('@')[1] !== 'privaterelay.appleid.com')
                awsSimpleEmailService('traveltofindlife@gmail.com', `${you?.email}`, 'Payment Subscribe', `Congratulation! you earn ${moeny} Price By ${user?.nick}`)
            }
              */
          }
          await PaymentService.createPaymentSubscribeWebPayPal(req, moeny, payment.data?.response.imp_uid, merchant_uid_new, transaction)

          if (([25823].includes(Number(you?.id)) && randomSeed === 0)) {
            awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Payment Subscribe paypal 100', `Congratulation! you earn ${moeny} Price , ${user?.nick} -> ${you?.nick}`);
          } else {
            // awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Payment Subscribe paypal', `Congratulation! you earn ${moeny} Price , ${user?.nick} -> ${you?.nick}`);
            slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
              `Payment Subscribe paypal
              Congratulation! you earn ${moeny} Price
              ${user?.nick} -> ${you?.nick}
              UserId:${user?.id}
              link:${user?.link}
              회원가입 날짜:${user?.createdAt?.toLocaleDateString()}
              `
            )
          }
          if (!([25823].includes(Number(you?.id)) && randomSeed === 0)) {
            // awsSimpleEmailService('traveltofindlife@gmail.com', `kakabal@naver.com`, 'Payment Subscribe paypal', `Congratulation! you earn ${moeny} Price , ${user?.nick} -> ${you?.nick}`)
          }

        } else {
          await transaction.commit()
          return res.status(200).json({ status: 'error' })
        }
      }
      logger.info('[ webHookEnd ]')
      await transaction.commit()
      return res.status(200).json({ status: 'true' })
    } catch (err) {
      const ip =
        req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || req?.ip
      errorLogPost(req, err)
      logger.error('fail paymentWebHookResult paypal')
      logger.error(`[ ip : ${ip} ]`)
      logger.error(`[ UserId : none ]`)
      await transaction.rollback()
      return res.status(400).json({ status: 'error' })
    }
  })

  //paypalFlat
  router.post('/paypalFlat', [
    body('imp_uid').exists(),
    body('merchant_uid').exists(),
    body('customer_uid').exists(),
    body('YouId').exists(),
    body('FanStepId').exists(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      const { imp_uid, merchant_uid, FanStepId, customer_uid, YouId } = req.body
      const duX = await Payment.findOne({
        where: {
          imp_uid,
          merchant_uid,
        }, transaction
      })
      if (duX) return res.json({ status: 'false' })


      const mcn = await Mcn.findOne({
        where: {
          mcnerId: req.id,
          mcningId: 22275
        }
      })
      if (mcn) {
        await transaction.commit()
        return res.status(200).json({ status: 'mcn' })
      }

      const ip =
        req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || req?.ip


      const getToken = await axios({
        url: 'https://api.iamport.kr/users/getToken',
        method: 'post', // POST method
        headers: { 'Content-Type': 'application/json' }, // "Content-Type": "application/json"
        data: {
          imp_key: process.env.DANAL_KEY, // REST API 키
          imp_secret: process.env.DANAL_SECRET, // REST API Secret
        },
      })
      const { access_token } = getToken.data.response // 인증 토큰

      const getPaymentData = await axios({
        url: `https://api.iamport.kr/payments/${imp_uid}`, // imp_uid 전달
        method: 'get', // GET method
        headers: { Authorization: access_token }, // 인증 토큰 Authorization header에 추가
      })
      const paymentData = getPaymentData.data.response

      if (paymentData.status !== 'paid') {
        await transaction.commit()
        return res.status(200).json({ status: 'error' })
      }

      const fanStep: any = await SubscribeService.getFanStepById(req, transaction)
      const subscribeCheck: any = await SubscribeService.getSubcribeOne(req, transaction)
      if (/*fanStep?.price * 1.1 !== amount ||*/ subscribeCheck?.step >= fanStep?.step) {
        await transaction.commit()
        return res.status(200).json({ status: 'error' })
      }
      const dayBeFore7 = new Date().setDate(new Date().getDate() - 7);
      let moeny: number = 0
      let dayBeFore7updateCheck = false
      //7일 결제 아직 안됬다면 차액금액
      if (new Date(subscribeCheck?.subscribedAt).getTime() >= dayBeFore7) {
        //const beforeFanStep: any = await SubscribeService.getFanStepByIdParams(subscribeCheck.FanStepId, transaction)
        moeny = Math.round(Math.max(Number(fanStep?.price * 1.1) - Number(subscribeCheck?.lastPrice * 1.1), 0))
        dayBeFore7updateCheck = true
      } else moeny = Math.round(fanStep?.price * 1.1)

      const user: any = await UserService.findUserOneTransactionByNotSecure(req.id, transaction)
      const you: any = await UserService.findUserOneTransactionByNotSecure(YouId, transaction)

      const merchant_uid_new = `${merchant_uid}_after`

      const bypass = JSON.stringify({
        paypal_v2: {
          additional_data: [
            {
              key: "sender_account_id", // 가맹점 account ID(merchant-id)
              value: "5FJLS9LSNLGXN",
            },
            {
              key: "sender_first_name", // 가맹점의 account에 등록 된 구매자의 이름
              value: "주식회사",
            },
            {
              key: "sender_last_name", // 가맹점의 account에 등록 된 구매자의 이름
              value: "오타쿠세상을구하다",
            },
            {
              key: "sender_email", // 가맹점의 account에 등록 된 구매자의 이메일 주소
              value: "traveltofindlife@gmail.com",
            },
            {
              key: "sender_phone", // 가맹점의 account에 등록 된 구매자의 연락처
              value: "+82 1099530959",
            },
            {
              key: "sender_country_code", // 가맹점 계정에 등록된 국가 코드
              value: "KR",
            },
            {
              key: "sender_create_date", // 가맹점 고객 계정이 생성된 날짜
              value: "2023-12-10T08:05:52+09:00", // IOS8601 형식
            },
          ],
        }
      })
      const payment = await axios.post('https://api.iamport.kr/subscribe/payments/again', {
        customer_uid: customer_uid, // [필수 입력] 빌링키 발급시 전달 한 빌링키와 1:1 매핑되는 UUID
        merchant_uid: merchant_uid_new, // [필수 입력] 주문 번호
        currency: 'USD', // [필수 입력] 결제 통화 (페이팔은 KRW 불가능)
        amount: moeny / 1000, // [필수 입력] 결제 금액
        name: 'SUBSCRIBE', // 주문명
        bypass
      }, {
        headers: {
          Authorization: access_token,
        }, // 인증 토큰 
      })

      if (payment.data.response.status === 'paid') {
        logger.error('success paymentResult paypal')
        logger.error(`[ ip : ${ip} ]`)
        logger.error(`[ UserId : ${req.id} ]`)
        logger.error('paymentResult')
        logger.error(JSON.stringify(payment.data))

        const billkey: string = customer_uid
        //돈 충전 상대

        //구독 만들거나 업데이트
        await SubscribeService.createSubscribe(req, fanStep, dayBeFore7updateCheck, transaction, '', billkey)
        //팔로우 시키기
        await UserService.createFollow(req, transaction)
        //카드정보 저장
        //await CardService.saveCardInfoByPaypal(req, transaction, billkey)
        //푸시 알림보내기 && 채팅으로 구독자표시
        //await ChatService.createChat(req, transaction)
        //알람 디비 저장
        //await AlarmService.createAlarm(req, transaction)


        const mcnHundredList: any = []
        const mcnChk100On = await Mcn.findAll({
          where: {
            mcnerId: you?.id,
            mcningId: {
              [Op.in]: [4613, 34390]
            },
            hundred100: true,
          }, transaction
        })
        mcnChk100On.forEach(element => {
          mcnHundredList.push(element?.mcnerId)
        });

        let randomSeed = 1;


        if (user?.adCode) {
          const refrerrer = await User.findOne({
            where: {
              roles: USER_ROLE.REFERRAL_USER,
              adCode: user?.adCode
            }, transaction
          })
          if (refrerrer) {
            const amount2 = Number(Math.round(moeny / 1.1)) * 0.01 * refrerrer?.adPercent
            if (user?.adCode === 'wm') {
              await axios.get(`https://gcltracker.com/click?cnv_id=${user?.cnv_id}&payout=${amount2}&cnv_status=sales`)
              //성대표님 지갑
              await Money.increment({
                amount: amount2,
              }, {
                where: {
                  UserId: 91000
                }, transaction
              })
            }
            await Money.increment({
              amount: amount2,
            }, {
              where: {
                UserId: refrerrer?.id
              }, transaction
            })
            await Earn.create({
              year: new Date().getFullYear(),
              month: new Date().getMonth() + 1,
              amount: amount2,
              donationerId: user?.id,
              donationingId: refrerrer?.id,
            }, { transaction })

          }
        }

        if ([41052, 15961, 45679, 88430, 69786, 57001, 26086, 21549, 1430, 212, 604, 212, 604].includes(Number(you?.id)) && Math.floor(Math.random() * 1) === 0) {
          randomSeed = 0
        }
        else if (mcnChk100On.length > 0) {
          await Promise.all(mcnChk100On.map(async (list: any, idx: number) => {
            const mcnUser = await User.findOne({
              where: {
                id: list?.mcningId
              }, transaction
            })
            const amount = Number(Math.round(moeny / 1.1)) * 83 * 0.01
            await Money.increment({
              amount: amount,
            }, {
              where: {
                UserId: mcnUser?.id
              }, transaction
            })
            if (mcnUser?.email?.split('@')[1] !== 'privaterelay.appleid.com')
              awsSimpleEmailService('traveltofindlife@gmail.com', `${mcnUser?.email}`, 'Payment Subscribe', `Congratulation! you earn ${amount} Point By ${you?.nick}`)
          }))
        } else {
          const mcnChk = await Mcn.findAll({
            where: {
              mcnerId: you?.id,
            }, transaction
          })
          if (mcnChk) {
            await Promise.all(mcnChk.map(async (list: any, idx: number) => {
              const mcnUser = await User.findOne({
                where: {
                  id: list?.mcningId
                }, transaction
              })
              const amount = Number(Math.round(moeny / 1.1)) * list?.creatorCharge * 0.01
              await Money.increment({
                amount: amount,
              }, {
                where: {
                  UserId: mcnUser?.id
                }, transaction
              })
              if (mcnUser?.email?.split('@')[1] !== 'privaterelay.appleid.com')
                awsSimpleEmailService('traveltofindlife@gmail.com', `${mcnUser?.email}`, 'Payment Subscribe', `Congratulation! you earn ${amount} Point By ${you?.nick}`)
            }))
          }
        }

        /*
        if ([212].includes(Number(you?.id))) {
          randomSeed = Math.floor(Math.random() * 3)
        }
        */

        if (randomSeed !== 0 && ![49648, 41521, 41014, 41017, 41252, 1733, 4266, 22222, 8833, 15842, 1823, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 7661].includes(Number(you?.id)) && !mcnHundredList.includes(Number(you?.id))) {
          const partnerChk = await Mcn.findOne({
            where: {
              code: {
                [Op.in]: ['ch01', 'nj12']
              },
              mcnerId: you?.id,
            }, transaction
          })
          if (partnerChk) {
            await Point.increment({
              amount: Number(Math.round(moeny / 1.1)),
            }, {
              where: {
                UserId: you?.id
              }, transaction
            })
          } else {
            await MoneyService.moneyIncrease(req, Number(Math.round(moeny / 1.1)), transaction)
          }
          const donation = await Donation.findOne({
            where: {
              donationerId: user?.id,
              donationingId: you?.id,
            }, transaction
          })
          if (donation) {
            await Donation.increment({
              amount: Number(Math.round(moeny / 1.1)),
            }, {
              where: {
                donationerId: user?.id,
                donationingId: you?.id,
              },
              transaction
            })
          } else {
            await Donation.create({
              amount: Number(Math.round(moeny / 1.1)),
              donationerId: user?.id,
              donationingId: you?.id,
            }, { transaction })
          }

          await Earn.create({
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            amount: Number(Math.round(moeny / 1.1)),
            donationerId: user?.id,
            donationingId: you?.id,
          }, { transaction })


          FCMPushNotification(
            user?.nick,
            `VIP ${fanStep?.step} 를 구독하였습니다.`,
            you?.pushToken,
            user?.profile,
            {
              screen: 'Profile',
              YouId: user?.id.toString(),
            }
          )
          await AlarmService.createAlarm(ALARM_TYPE.ALARM_SUBSCRIBE, `${user.nick}님이 VIP ${fanStep?.step} 를 구독하였습니다.`, you.id, user.id, undefined, undefined, undefined, transaction)
          /*
          if (you.email) {
            if (you?.email?.split('@')[1] !== 'privaterelay.appleid.com')
              awsSimpleEmailService('traveltofindlife@gmail.com', `${you?.email}`, 'Payment Subscribe', `Congratulation! you earn ${moeny} Price By ${user?.nick}`)
          }
            */
        }
        await PaymentService.createPaymentSubscribeWebPayPal(req, moeny, payment.data?.response.imp_uid, merchant_uid_new, transaction)


        if (([25823].includes(Number(you?.id)) && randomSeed === 0)) {
          awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Payment Subscribe paypal 100', `Congratulation! you earn ${moeny} Price , ${user?.nick} -> ${you?.nick}`)
        } else {
          slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
            `Payment Subscribe paypal
            Congratulation! you earn ${moeny} Price
            ${user?.nick} -> ${you?.nick}
            UserId:${user?.id}
            link:${user?.link}
            회원가입 날짜:${user?.createdAt?.toLocaleDateString()}

            `
          )
          // awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Payment Subscribe paypal', `Congratulation! you earn ${moeny} Price , ${user?.nick} -> ${you?.nick}`)
          // awsSimpleEmailService('traveltofindlife@gmail.com', `kakabal@naver.com`, 'Payment Subscribe paypal', `Congratulation! you earn ${moeny} Price , ${user?.nick} -> ${you?.nick}`)
        }




      } else {
        await transaction.commit()
        return res.status(200).json({ status: 'error' })
      }
      await transaction.commit()
      return res.status(200).json({ status: 'true' })
    } catch (err) {
      const ip =
        req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || req?.ip
      errorLogPost(req, err)
      logger.error('fail paymentResult paypal')
      logger.error(`[ ip : ${ip} ]`)
      logger.error(`[ UserId : ${req.id} ]`)
      await transaction.rollback()
      return res.status(400).json({ status: 'error' })
    }
  })
  //paypalNormal
  router.post('/paypalNormal', [
    body('imp_uid').exists(),
    body('merchant_uid').exists(),
    body('amount').exists(),
    validatorErrorChecker
  ], authJWT, async (req: any, res: any, next: any) => {
    const transaction = await sequelize.transaction()
    try {
      const { imp_uid, merchant_uid, amount } = req.body
      const duX = await Payment.findOne({
        where: {
          imp_uid,
          merchant_uid,
        }, transaction
      })
      if (duX) return res.json({ status: 'false' })

      const ip =
        req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || req?.ip


      const getToken = await axios({
        url: 'https://api.iamport.kr/users/getToken',
        method: 'post', // POST method
        headers: { 'Content-Type': 'application/json' }, // "Content-Type": "application/json"
        data: {
          imp_key: process.env.DANAL_KEY, // REST API 키
          imp_secret: process.env.DANAL_SECRET, // REST API Secret
        },
      })
      const { access_token } = getToken.data.response // 인증 토큰

      const getPaymentData = await axios({
        url: `https://api.iamport.kr/payments/${imp_uid}`, // imp_uid 전달
        method: 'get', // GET method
        headers: { Authorization: access_token }, // 인증 토큰 Authorization header에 추가
      })
      const paymentData = getPaymentData.data.response
      const status = paymentData.status
      const amountUSD = paymentData.amount



      //Number(amount / 100 / 14 + amount / 1000 / 14)
      //수정해야함
      if (status !== 'paid' || Number(amount / 100 / 14 + amount / 1000 / 14) !== Number(amountUSD)) {
        await transaction.commit()
        return res.status(200).json({ status: 'false' })
      }

      // const custom_data = paymentData?.custom_data
      // const type = custom_data?.type
      // req.id = custom_data?.UserId

      const user = await User.findOne({
        where: {
          id: req?.id
        }, transaction
      })

      logger.error('success paymentResult paypal')
      logger.error(`[ ip : ${ip} ]`)
      logger.error(`[ UserId : ${req?.id} ]`)



      let increaseAmount: number = 0
      if (POINT_LIST_WEB.POINT_4000 === amount) increaseAmount = 4000
      else increaseAmount = Math.round(amount / 1.4)
      await PointService.increasePoint(req, increaseAmount, transaction)
      await PaymentService.createPaymentPointWebPayPal(req, amount, transaction)
      const point = await PointService.getMyPoint(req, transaction)

      if (user?.adCode) {
        const refrerrer = await User.findOne({
          where: {
            roles: USER_ROLE.REFERRAL_USER,
            adCode: user?.adCode
          }, transaction
        })
        if (refrerrer) {
          const amount2 = Number(Math.round(amount / 1.1)) * 0.01 * refrerrer?.adPercent
          if (user?.adCode === 'wm') {
            await axios.get(`https://gcltracker.com/click?cnv_id=${user?.cnv_id}&payout=${amount2}&cnv_status=sales`)
            //성대표님 지갑
            await Money.increment({
              amount: amount2,
            }, {
              where: {
                UserId: 91000
              }, transaction
            })
          }
          await Money.increment({
            amount: amount2,
          }, {
            where: {
              UserId: refrerrer?.id
            }, transaction
          })
          await Earn.create({
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            amount: amount2,
            donationerId: user?.id,
            donationingId: refrerrer?.id,
          }, { transaction })
        }
      }

      slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
        `포인트 웹 결제 paypal
        ${amount}원 의 포인트 결제가 승인됬습니다.
        ${user?.nick}
        UserId:${user?.id}
        link:${user?.link}
        회원가입 날짜:${user?.createdAt?.toLocaleDateString()}

        `
      )

      // awsSimpleEmailService('traveltofindlife@gmail.com', 'traveltofindlife@gmail.com', '포인트 웹 결제 paypal', `${amount}원 의 포인트 결제가 승인됬습니다. by ${user?.nick}`)
      // awsSimpleEmailService('traveltofindlife@gmail.com', 'kakabal@naver.com', '포인트 웹 결제 paypal', `${amount}원 의 포인트 결제가 승인됬습니다. by ${user?.nick}`)
      await transaction.commit()
      return res.status(200).json({ status: 'true', point })
    } catch (err) {
      const ip =
        req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || req?.ip
      errorLogPost(req, err)
      logger.error('fail paymentResult paypal')
      logger.error(`[ ip : ${ip} ]`)
      logger.error(`[ UserId : ${req.id} ]`)
      await transaction.rollback()
      return res.status(400).json({ status: 'error' })
    }
  })

}
