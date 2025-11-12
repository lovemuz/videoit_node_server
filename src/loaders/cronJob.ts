import { CronJob } from 'cron'
import axios from 'axios'
import path from 'path'
import fs from 'fs'
import { AdsCount, CallHistory, Card, Donation, Earn, FanStep, LastScreen, Mcn, Money, Payment, Point, PointHistory, Room, Subscribe, User } from '../models'
import SubscribeService from '../services/subscribeService'
import sequelize from '..//models/sequelize'
import { SUBSCRIBE_STATE } from '../constant/subscribe-constant'
import Sequelize from 'sequelize'
import UserService from '../services/userService'
import { FCMPushNotification } from '../api/middlewares/fcm-notification'
import AlarmService from '../services/alarmService'
import { ALARM_TYPE } from '../constant/alarm-constant'
import { awsSimpleEmailService, mailgunSimpleEmailService } from '../api/middlewares/aws'
import MoneyService from '../services/MoneyService'
import { logger } from '../config/winston'
import PaymentService from '../services/paymentService'
import { slackPostMessage } from '../api/middlewares/slack'
import { SLACK_CHANNEL } from '../constant/slack-constant'
import { POINT_HISTORY } from '../constant/point-constant'
import { CALL_TYPE } from '../constant/call-constant'
import { USER_GENDER, USER_ROLE } from '../constant/user-constant'
import { getValue, setValue, setValueNonExpire } from '../api/middlewares/redis'
import RankService from '../services/rankService'
import { COUNTRY_LIST } from '../constant/country-constant'
const Op = Sequelize.Op

const timezone = 'Asia/Seoul'


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

export default (app: any) => {

  async function cmdLogin3() {

    //30116
    await User.update({
      lastVisit: new Date(),
    }, {
      where: {
        link: '@hyeo._.2n'
      },
    })
    await User.update({
      lastVisit: new Date(),
    }, {
      where: {
        link: '@nongnong59'
      },
    })
  }

  async function cmdLogin2() {
    await User.update({
      lastVisit: new Date(),
    }, {
      where: {
        link: '@kiname._'
      },
    })
    await User.update({
      lastVisit: new Date(),
    }, {
      where: {
        link: '@__ulliling'
      },
    })
  }

  async function cmdLogin() {
    await User.update({
      lastVisit: new Date(),
    }, {
      where: {
        link: '@eune__i06'
      },
    })
    await User.update({
      lastVisit: new Date(),
    }, {
      where: {
        link: '@39402e240de9425f'
      },
    })
    await User.update({
      lastVisit: new Date(),
    }, {
      where: {
        link: '@8002caf7becd44f8'
      },
    })
  }
  async function cmdCalling() {

    //transaction
    const userCallingListGirl: any = await User.findAll({
      include: [{
        required: false,
        model: PointHistory,
        where: {
          plusOrMinus: POINT_HISTORY.PLUS,
          type: POINT_HISTORY.TYPE_CALL,
          createdAt: {
            [Op.gt]: new Date(new Date().setMinutes(new Date().getMinutes() - 2)) //sequelize.literal("NOW() - (INTERVAL '1 MINUTE')")
          }
        },
        limit: 1,
        order: [['createdAt', 'DESC']],
      }],

      where: {
        gender: USER_GENDER.GIRL,
        callState: CALL_TYPE.CALL_ING
      },
    })


    const userCallingListBoy: any = await User.findAll({
      include: [{
        required: false,
        model: PointHistory,
        where: {
          plusOrMinus: POINT_HISTORY.MINUS,
          type: POINT_HISTORY.TYPE_CALL,
          createdAt: {
            [Op.gt]: new Date(new Date().setMinutes(new Date().getMinutes() - 2)) //sequelize.literal("NOW() - (INTERVAL '1 MINUTE')")
          }
        },
        limit: 1,
        order: [['createdAt', 'DESC']],
      }],
      where: {
        gender: USER_GENDER.BOY,
        callState: CALL_TYPE.CALL_ING
      },
    })

    await Room.update({
      caliing: false,
    }, {
      where: {
        calling: true,
        callingAt: {
          [Op.lt]: new Date(new Date().setMinutes(new Date().getMinutes() - 2))//sequelize.literal("NOW() - (INTERVAL '1 MINUTE')")//120-> 2분
        }
      },
    })

    await LastScreen.update({
      name: 'Live',
    }, {
      where: {
        name: 'Call',
        changedAt: {
          [Op.lt]: new Date(new Date().setMinutes(new Date().getMinutes() - 2))//sequelize.literal("NOW() - (INTERVAL '1 MINUTE')")//120-> 2분
        }
      },
    })

    await Promise.all(userCallingListBoy.map(async (list: any) => {
      const pointHistory = list?.PointHistories[0]
      if (!pointHistory) {
        await User.update({
          callState: CALL_TYPE.CALL_WAIT
        }, {
          where: {
            id: list?.id
          },
        })
      }
    }))
    await Promise.all(userCallingListGirl.map(async (list: any) => {
      const pointHistory = list?.PointHistories[0]
      if (!pointHistory) {
        await User.update({
          callState: CALL_TYPE.CALL_WAIT
        }, {
          where: {
            id: list?.id
          },
        })
      }
    }))

  }



  async function cmdPaymentSum() {
    let todayZero
    if ([15, 16, 17, 18, 19, 20, 21, 22, 23].includes(new Date().getHours())) {
      // todayZero.setHours()
      todayZero = new Date(new Date().setHours(24, 0, 0, 0))
    } else {
      todayZero = new Date(new Date().setHours(0, 0, 0, 0))
    }
    todayZero.setHours(todayZero.getHours() - 9)

    const pyment = await Payment.findAll({
      include: [{ model: User }],
      where: {
        createdAt: {
          [Op.gte]: todayZero
        }
      }
    })


    let todayAllMoney: number = 0
    let today미국: number = 0
    let today스페인: number = 0
    let today인도: number = 0
    let today프랑스: number = 0
    let today중국: number = 0
    let today일본: number = 0
    let today한국: number = 0

    let todayPointMoney: number = 0
    let todaySubscribeMoney: number = 0
    let todayAppMoney: number = 0
    let todayWebMoney: number = 0



    pyment.forEach((item: any) => {
      if (item?.User?.country === COUNTRY_LIST.스페인) {
        today스페인 = Number(today스페인 + Number(item?.price))
      } else if (item?.User?.country === COUNTRY_LIST.인도) {
        today인도 = Number(today인도 + Number(item?.price))
      } else if (item?.User?.country === COUNTRY_LIST.프랑스) {
        today프랑스 = Number(today프랑스 + Number(item?.price))
      } else if (item?.User?.country === COUNTRY_LIST.중국) {
        today중국 = Number(today중국 + Number(item?.price))
      } else if (item?.User?.country === COUNTRY_LIST.일본) {
        today일본 = Number(today일본 + Number(item?.price))
      } else if (item?.User?.country === COUNTRY_LIST.한국) {
        today한국 = Number(today한국 + Number(item?.price))
      } else {
        today미국 = Number(today미국 + Number(item?.price))
      }

      if (item?.platform === 'WEB') {
        todayWebMoney = Number(todayWebMoney + Number(item?.price))
        todayAllMoney = Number(todayAllMoney + Number(item?.price))
        if (item?.type === 1) {
          todayPointMoney = Number(todayPointMoney + Number(item?.price))
        } else if (item?.type === 2) {
          todaySubscribeMoney = Number(todaySubscribeMoney + Number(item?.price))
        }
      } else {
        todayAppMoney = Number(todayAppMoney + item?.price)
        todayAllMoney = Number(todayAllMoney + item?.price)
        if (item?.type === 1) {
          todayPointMoney = Number(todayPointMoney + item?.price)
        } else if (item?.type === 2) {
          todaySubscribeMoney = Number(todaySubscribeMoney + item?.price)
        }
      }
    })
    slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
      `일일 매출 집계 - ${new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
    총 결제량 : ${Number(todayAllMoney).toLocaleString()}
    - 미국 결제량 : ${Number(today미국).toLocaleString()}
    - 스페인 결제량: ${Number(today스페인).toLocaleString()}
    - 인도 결제량: ${Number(today인도).toLocaleString()}
    - 프랑스 결제량: ${Number(today프랑스).toLocaleString()}
    - 중국 결제량: ${Number(today중국).toLocaleString()}
    - 일본 결제량: ${Number(today일본).toLocaleString()}
    - 한국 결제량: ${Number(today한국).toLocaleString()}

    총 포인트 결제 : ${Number(todayPointMoney).toLocaleString()}
    총 구독 결제 : ${Number(todaySubscribeMoney).toLocaleString()}
    앱 결제량 : ${Number(todayAppMoney).toLocaleString()}
    웹 결제량 : ${Number(todayWebMoney).toLocaleString()}

    ${todayAllMoney >= (new Date().getHours() + 1) * 160000 ? '잘하고 계시군요!' : '좀더 분발하셔야 할것 같습니다!'}

    `
    )

  }
  async function cmdPaymentMonthSum() {

    let date = new Date();
    let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);

    let todayZero
    /*
    if ([15, 16, 17, 18, 19, 20, 21, 22, 23].includes(new Date().getHours())) {
      // todayZero.setHours()
      todayZero = new Date(firstDay.setHours(24, 0, 0, 0))
      // todayZero = new Date(firstDay.setHours(0, 0, 0, 0))
    } else {
      todayZero = new Date(firstDay.setHours(0, 0, 0, 0))
    }
    */
    todayZero = new Date(firstDay.setHours(0, 0, 0, 0))
    todayZero.setHours(todayZero.getHours() - 9)

    const pyment = await Payment.findAll({
      include: [{ model: User }],
      where: {
        createdAt: {
          [Op.gte]: todayZero
        }
      }
    })


    let todayAllMoney: number = 0
    let today미국: number = 0
    let today스페인: number = 0
    let today인도: number = 0
    let today프랑스: number = 0
    let today중국: number = 0
    let today일본: number = 0
    let today한국: number = 0

    let todayPointMoney: number = 0
    let todaySubscribeMoney: number = 0
    let todayAppMoney: number = 0
    let todayWebMoney: number = 0



    pyment.forEach((item: any) => {
      if (item?.User?.country === COUNTRY_LIST.스페인) {
        today스페인 = Number(today스페인 + Number(item?.price))
      } else if (item?.User?.country === COUNTRY_LIST.인도) {
        today인도 = Number(today인도 + Number(item?.price))
      } else if (item?.User?.country === COUNTRY_LIST.프랑스) {
        today프랑스 = Number(today프랑스 + Number(item?.price))
      } else if (item?.User?.country === COUNTRY_LIST.중국) {
        today중국 = Number(today중국 + Number(item?.price))
      } else if (item?.User?.country === COUNTRY_LIST.일본) {
        today일본 = Number(today일본 + Number(item?.price))
      } else if (item?.User?.country === COUNTRY_LIST.한국) {
        today한국 = Number(today한국 + Number(item?.price))
      } else {
        today미국 = Number(today미국 + Number(item?.price))
      }

      if (item?.platform === 'WEB') {
        todayWebMoney = Number(todayWebMoney + Number(item?.price))
        todayAllMoney = Number(todayAllMoney + Number(item?.price))
        if (item?.type === 1) {
          todayPointMoney = Number(todayPointMoney + Number(item?.price))
        } else if (item?.type === 2) {
          todaySubscribeMoney = Number(todaySubscribeMoney + Number(item?.price))
        }
      } else {
        todayAppMoney = Number(todayAppMoney + item?.price)
        todayAllMoney = Number(todayAllMoney + item?.price)
        if (item?.type === 1) {
          todayPointMoney = Number(todayPointMoney + item?.price)
        } else if (item?.type === 2) {
          todaySubscribeMoney = Number(todaySubscribeMoney + item?.price)
        }
      }
    })
    slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
      `${new Date().getMonth() + 1}월 누적 매출 집계 
    총 결제량 : ${Number(todayAllMoney).toLocaleString()}
    - 미국 결제량 : ${Number(today미국).toLocaleString()}
    - 스페인 결제량: ${Number(today스페인).toLocaleString()}
    - 인도 결제량: ${Number(today인도).toLocaleString()}
    - 프랑스 결제량: ${Number(today프랑스).toLocaleString()}
    - 중국 결제량: ${Number(today중국).toLocaleString()}
    - 일본 결제량: ${Number(today일본).toLocaleString()}
    - 한국 결제량: ${Number(today한국).toLocaleString()}
    
    총 포인트 결제 : ${Number(todayPointMoney).toLocaleString()}
    총 구독 결제 : ${Number(todaySubscribeMoney).toLocaleString()}
    앱 결제량 : ${Number(todayAppMoney).toLocaleString()}
    웹 결제량 : ${Number(todayWebMoney).toLocaleString()}

    ${todayAllMoney >= ((new Date().getDate()) * 3500000) ? '잘하고 계시군요!' : '좀더 분발하셔야 할것 같습니다!'}

    `
    )

    const adsCountIb: any = await AdsCount.findOne({
      where: {
        adCode: 'ib',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate()
      },
    })
    const adsCountNm: any = await AdsCount.findOne({
      where: {
        adCode: 'nm',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate()
      },
    })
    const adsCountEx: any = await AdsCount.findOne({
      where: {
        adCode: 'ex',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate()
      },
    })
    const adsCountMo: any = await AdsCount.findOne({
      where: {
        adCode: 'mo',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate()
      },
    })

    slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
      `일일 광고 집계 - ${new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
    일베 광고 클릭량 : ${Number(adsCountIb?.count ? adsCountIb?.count : 0).toLocaleString()}
    exoclick 광고 클릭량 : ${Number(adsCountEx?.count ? adsCountEx?.count : 0).toLocaleString()}
    모비온 광고 클릭량 : ${Number(adsCountMo?.count ? adsCountMo?.count : 0).toLocaleString()}
    SNS 클릭량 : ${Number(adsCountNm?.count ? adsCountNm?.count : 0).toLocaleString()}

    `
    )


    const pymentAllSum: any = await Payment.findAll({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('price')), 'totalAmount']
      ],
      // group: ['id']
    })

    let allMoney: number = pymentAllSum[0]?.dataValues?.totalAmount ?? 1

    const pymentAllCount = await Payment.count({
      distinct: true,
      col: 'UserId',
    })

    const pymentMonthCount = await Payment.count({
      distinct: true,
      col: 'UserId',
      where: {
        createdAt: {
          [Op.gte]: todayZero
        }
      }
    })

    const userAllCount = await User.count({
      paranoid: false
    })
    const userMonthCount = await User.count({
      paranoid: false,
      where: {
        createdAt: {
          [Op.gte]: todayZero
        }
      }
    })

    slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
      `KPI 집계 - ${new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
    총 ARPU : ${Number(allMoney / userAllCount).toFixed(1).toLocaleString()}
    총 ARPPU : ${Number(allMoney / pymentAllCount).toFixed(1).toLocaleString()}

    이번달 ARPU : ${Number(todayAllMoney / userMonthCount).toFixed(1).toLocaleString()}
    이번달 ARPPU : ${Number(todayAllMoney / pymentMonthCount).toFixed(1).toLocaleString()}

    (ARPU = 앱 활동 사용자의 1인당 평균 결제 금액)
    (ARPPU = 유료 사용자 1인당 평균 결제 금액)

    `
    )


    /*
    const pymentCount = await Payment.count({
      distinct: true,
      col: 'UserId',
      where: {
        createdAt: {
          [Op.gte]: todayZero
        }
      }
    })
      */

    //내부 sns 클릭량 : ${Number(adsCountNm?.count ? adsCountNm?.count : 0).toLocaleString()}

  }





  async function cmd() {
    logger.info(`cron start`)



    //30일이 경과한 데이터
    const dayBeFore30 = new Date().setDate(new Date().getDate() - 30)
    const subscribe: any = await Subscribe.findAll({
      include: [{ model: FanStep }],
      where: {
        //subscribeState: SUBSCRIBE_STATE.ING,
        subscribedAt: {
          [Op.lte]: dayBeFore30,
        },
        //subscribeState: true
      }
    })


    logger.info('subscribe.length')
    logger.info(subscribe.length)
    for await (const list of subscribe) {

      const transaction = await sequelize.transaction()
      try {
        if (list.subscribeState === SUBSCRIBE_STATE.CANCEL) {
          //그냥 구독 지워야함
          logger.info(`[subscribe delete subscribingId = ${list?.subscribingId}]  :  subscriberId = ${list.subscriberId}]`)
          await Subscribe.destroy({
            where: {
              subscribingId: list?.subscribingId,
              subscriberId: list.subscriberId,
            }, transaction
          })
          await transaction.commit()
        } else {
          //자동 결제
          const user: any = await User.findOne({
            where: {
              id: list.subscriberId
            }, transaction
          })
          if (!list.FanStep || (!list?.billkeyKorean && !list?.billkeyForeign && !list?.billkeyKorean_HK && !list?.billkeyForeign_HK)) {
            logger.info(`[subscribe delete subscribingId = ${list?.subscribingId}]  :  subscriberId = ${list.subscriberId}]`)
            await Subscribe.destroy({
              where: {
                subscribingId: list?.subscribingId,
                subscriberId: list.subscriberId,
              }, transaction
            })
            await transaction.commit()
            continue;
          }
          const moeny = list?.FanStep?.price

          const card = await Card.findOne({
            where: {
              UserId: list.subscriberId,
            }, transaction
          })

          //list(Subscribe) billkeyKorean, billkeyForeign 으로 분기처리

          if (list?.billkeyForeign) {

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


            const merchant_uid = `mid_${new Date().getTime()}_${list.subscriberId}`

            const payment = await axios.post('https://api.iamport.kr/subscribe/payments/again', {
              customer_uid: list?.billkeyForeign, // [필수 입력] 빌링키 발급시 전달 한 빌링키와 1:1 매핑되는 UUID
              merchant_uid, // [필수 입력] 주문 번호
              currency: 'USD', // [필수 입력] 결제 통화 (페이팔은 KRW 불가능)
              amount: Math.floor(moeny * 1.1) / 1000, // [필수 입력] 결제 금액
              name: 'SUBSCRIBE', // 주문명
              bypass
            }, {
              headers: {
                Authorization: access_token,
              }, // 인증 토큰 
            })
            if (payment.data.response.status === 'paid') {
              //돈 충전 상대
              let req: any = {
                id: null, body: {
                  YouId: null,
                  FanStepId: null
                }
              }
              req.id = list.subscriberId
              req.body.YouId = list.subscribingId
              req.body.FanStepId = list?.FanStep.id


              //구독 만들거나 업데이트

              await SubscribeService.createSubscribe(req, list?.FanStep, false, transaction)
              //팔로우 시키기
              await UserService.createFollow(req, transaction)
              //카드정보 저장
              const you: any = await UserService.findUserOneTransaction(list.subscribingId, transaction)


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

              let randomSeed = 0;


              if (/*[39949].includes(Number(you?.id)) &&*/ Math.floor(Math.random() * 1) === 0) {
                randomSeed = 10
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
              if ([1869, 27634, 212].includes(Number(you?.id))) {
                randomSeed = Math.floor(Math.random() * 7)
              }
              if ([21549].includes(Number(you?.id))) {
                randomSeed = Math.floor(Math.random() * 5)
              }
              if ([41521].includes(Number(you?.id))) {
                randomSeed = Math.floor(Math.random() * 1)
              }

              if (randomSeed === 0 && ![49648, 41521, 41014, 41017, 41252, 4266, 8833, 15842, 1823, 22222, 39949, 1430, 2184, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 1733, 7661].includes(Number(you?.id)) && !mcnHundredList.includes(Number(you?.id))) {
                const partnerChk = await Mcn.findOne({
                  where: {
                    code: 'ch01',
                    mcnerId: you?.id,
                  }, transaction
                })
                if (partnerChk) {
                  await Point.increment({
                    amount: Number(Math.floor(moeny)),
                  }, {
                    where: {
                      UserId: you?.id
                    }, transaction
                  })
                } else {
                  await MoneyService.moneyIncrease(req, Number(Math.floor(moeny)), transaction)
                }
                const donation = await Donation.findOne({
                  where: {
                    donationerId: user?.id,
                    donationingId: you?.id,
                  }, transaction
                })
                if (donation) {
                  await Donation.increment({
                    amount: Number(Math.floor(moeny)),
                  }, {
                    where: {
                      donationerId: user?.id,
                      donationingId: you?.id,
                    },
                    transaction
                  })
                } else {
                  await Donation.create({
                    amount: Number(Math.floor(moeny)),
                    donationerId: user?.id,
                    donationingId: you?.id,
                  }, { transaction })
                }

                await Earn.create({
                  year: new Date().getFullYear(),
                  month: new Date().getMonth() + 1,
                  amount: Number(Math.floor(moeny)),
                  donationerId: user?.id,
                  donationingId: you?.id,
                }, { transaction })

                FCMPushNotification(
                  user?.nick,
                  `VIP ${list?.FanStep?.step} 를 재구독하였습니다.`,
                  you?.pushToken,
                  user?.profile,
                  {
                    screen: 'Profile',
                    YouId: user?.id.toString(),
                  }
                )
                await AlarmService.createAlarm(ALARM_TYPE.ALARM_SUBSCRIBE, `${user.nick}님이 VIP ${list?.FanStep?.step} 를 재구독하였습니다.`, you.id, user.id, undefined, undefined, undefined, transaction)
                if (you.email) {
                  if (you?.email?.split('@')[1] !== 'privaterelay.appleid.com')
                    awsSimpleEmailService('traveltofindlife@gmail.com', `${you?.email}`, 'Payment Subscribe', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price `)
                }

              }
              await PaymentService.createPaymentSubscribeWebPayPal(req, Number(Math.floor(moeny * 1.1)), payment.data?.response.imp_uid, merchant_uid, transaction)

              if (randomSeed === 0) {
                // awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Re Payment Subscribe paypal', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price By ${you?.nick}`)

              } else {
                awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Re Payment Subscribe paypal 100', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price By ${you?.nick}`)
              }

              if (randomSeed !== 10) {
                slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
                  `Re Payment Subscribe paypal
                  Congratulation! you earn ${Math.floor(moeny * 1.1)} Price
                  ${user?.nick} -> ${you?.nick}
                  UserId:${user?.id}
                  link:${user?.link}
                  회원가입 날짜:${user?.createdAt?.toLocaleDateString()}

                  `
                )
                // awsSimpleEmailService('traveltofindlife@gmail.com', `kakabal@naver.com`, 'Re Payment Subscribe paypal', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price By ${you?.nick}`)
              }


              logger.info(`[subscribe success subscribingId = ${list?.subscribingId}]  :  subscriberId = ${list.subscriberId}]`)
            } else {
              //실패시 구독지움
              logger.info(`[subscribe delete subscribingId = ${list?.subscribingId}]  :  subscriberId = ${list.subscriberId}]`)
              /*
              await Subscribe.destroy({
                  where: {
                      subscribingId: list?.subscribingId,
                      subscriberId: list.subscriberId,
                  }, transaction
              })
              */
            }
          } else if (list?.billkeyKorean_HK) {
            let paymentResult: any
            paymentResult = await axios
              .post(`https://www.dekina.com/api/v1/pay/card/manual`, {
                client: process.env.DEKINA_CLIENT_HK,
                secret: process.env.DEKINA_SECRET_HK,
                cardId: card?.billkeyKorean_HK,
                amount: Math.floor(moeny * 1.1),
                save: false,
                name: card?.name,
                phoneNumber: card?.phone,
                email: user.email,
                product: {
                  name: `SUBSCRIBE - UserId : ${list?.subscriberId}`,
                  type: "Online"
                }
              })

            if (paymentResult?.data?.id) {
              //돈 충전 상대
              let req: any = {
                id: null, body: {
                  YouId: null,
                  FanStepId: null
                }
              }
              req.id = list.subscriberId
              req.body.YouId = list.subscribingId
              req.body.FanStepId = list?.FanStep.id
              const you: any = await UserService.findUserOneTransaction(list.subscribingId, transaction)
              await SubscribeService.createSubscribe(req, list?.FanStep, false, transaction)
              //팔로우 시키기
              await UserService.createFollow(req, transaction)
              //카드정보 저장


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

              let randomSeed = 0;


              if (/*[39949].includes(Number(you?.id)) &&*/ Math.floor(Math.random() * 1) === 0) {
                randomSeed = 10
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


              if ([1869, 27634, 212].includes(Number(you?.id))) {
                randomSeed = Math.floor(Math.random() * 7)
              }
              if ([21549].includes(Number(you?.id))) {
                randomSeed = Math.floor(Math.random() * 5)
              }
              if ([41521].includes(Number(you?.id))) {
                randomSeed = Math.floor(Math.random() * 1)
              }

              if (randomSeed === 0 && ![49648, 41521, 41014, 41017, 41252, 4266, 8833, 15842, 1823, 22222, 39949, 1430, 2184, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 1733, 7661].includes(Number(you?.id)) && !mcnHundredList.includes(Number(you?.id))) {
                const partnerChk = await Mcn.findOne({
                  where: {
                    code: 'ch01',
                    mcnerId: you?.id,
                  }, transaction
                })
                if (partnerChk) {
                  await Point.increment({
                    amount: Number(Math.floor(moeny)),
                  }, {
                    where: {
                      UserId: you?.id
                    }, transaction
                  })
                } else {
                  await MoneyService.moneyIncrease(req, Number(Math.floor(moeny)), transaction)
                }
                //구독 만들거나 업데이트

                const donation = await Donation.findOne({
                  where: {
                    donationerId: user?.id,
                    donationingId: you?.id,
                  }, transaction
                })
                if (donation) {
                  await Donation.increment({
                    amount: Number(Math.floor(moeny)),
                  }, {
                    where: {
                      donationerId: user?.id,
                      donationingId: you?.id,
                    },
                    transaction
                  })
                } else {
                  await Donation.create({
                    amount: Number(Math.floor(moeny)),
                    donationerId: user?.id,
                    donationingId: you?.id,
                  }, { transaction })
                }

                await Earn.create({
                  year: new Date().getFullYear(),
                  month: new Date().getMonth() + 1,
                  amount: Number(Math.floor(moeny)),
                  donationerId: user?.id,
                  donationingId: you?.id,
                }, { transaction })


                FCMPushNotification(
                  user?.nick,
                  `VIP ${list?.FanStep?.step} 를 재구독하였습니다.`,
                  you?.pushToken,
                  user?.profile,
                  {
                    screen: 'Profile',
                    YouId: user?.id.toString(),
                  }
                )

                await AlarmService.createAlarm(ALARM_TYPE.ALARM_SUBSCRIBE, `${user.nick}님이 VIP ${list?.FanStep?.step} 를 재구독하였습니다.`, you.id, user.id, undefined, undefined, undefined, transaction)
                if (you.email) {
                  if (you?.email?.split('@')[1] !== 'privaterelay.appleid.com')
                    awsSimpleEmailService('traveltofindlife@gmail.com', `${you?.email}`, 'Payment Subscribe', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price `)
                }
              }
              await PaymentService.createPaymentSubscribeWeb(req, Math.floor(moeny * 1.1), transaction)

              if (randomSeed === 0) {
                // awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Re Payment Subscribe ', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price By ${you?.nick}`)
              } else {
                awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Re Payment Subscribe 100', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price By ${you?.nick}`)
              }

              if (randomSeed !== 10) {
                slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
                  `Re Payment Subscribe
                  Congratulation! you earn ${Math.floor(moeny * 1.1)} Price
                  ${user?.nick} -> ${you?.nick}
                  UserId:${user?.id}
                  link:${user?.link}
                  회원가입 날짜:${user?.createdAt?.toLocaleDateString()}

                  `
                )
                // awsSimpleEmailService('traveltofindlife@gmail.com', `kakabal@naver.com`, 'Re Payment Subscribe', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price By ${you?.nick}`)
              }
              logger.info(`[subscribe success subscribingId = ${list?.subscribingId}]  :  subscriberId = ${list.subscriberId}]`)
            } else {
              //실패시 구독지움
              logger.info(`[subscribe delete subscribingId = ${list?.subscribingId}]  :  subscriberId = ${list.subscriberId}]`)
              /*
              await Subscribe.destroy({
                  where: {
                      subscribingId: list?.subscribingId,
                      subscriberId: list.subscriberId,
                  }, transaction
              })
              */
            }
          } else if (list?.billkeyKorean) {
            let paymentResult: any
            paymentResult = await axios
              .post(`https://www.dekina.com/api/v1/pay/card/manual`, {
                client: process.env.DEKINA_CLIENT_KR,
                secret: process.env.DEKINA_SECRET_KR,
                cardId: card?.billkeyKorean,
                amount: Math.floor(moeny * 1.1),
                save: false,
                name: card?.name,
                phoneNumber: card?.phone,
                email: user.email,
                product: {
                  name: `SUBSCRIBE - UserId : ${list?.subscriberId}`,
                  type: "Online"
                }
              })

            if (paymentResult?.data?.id) {
              //돈 충전 상대
              let req: any = {
                id: null, body: {
                  YouId: null,
                  FanStepId: null
                }
              }
              req.id = list.subscriberId
              req.body.YouId = list.subscribingId
              req.body.FanStepId = list?.FanStep.id
              const you: any = await UserService.findUserOneTransaction(list.subscribingId, transaction)
              await SubscribeService.createSubscribe(req, list?.FanStep, false, transaction)
              //팔로우 시키기
              await UserService.createFollow(req, transaction)
              //카드정보 저장



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

              let randomSeed = 0;


              if (/*[39949].includes(Number(you?.id)) &&*/ Math.floor(Math.random() * 1) === 0) {
                randomSeed = 10
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


              if ([1869, 27634, 212].includes(Number(you?.id))) {
                randomSeed = Math.floor(Math.random() * 7)
              }
              if ([21549].includes(Number(you?.id))) {
                randomSeed = Math.floor(Math.random() * 5)
              }
              if ([41521].includes(Number(you?.id))) {
                randomSeed = Math.floor(Math.random() * 1)
              }

              if (randomSeed === 0 && ![49648, 41521, 41014, 41017, 41252, 4266, 8833, 15842, 1823, 22222, 39949, 1430, 2184, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 1733, 7661].includes(Number(you?.id)) && !mcnHundredList.includes(Number(you?.id))) {
                const partnerChk = await Mcn.findOne({
                  where: {
                    code: 'ch01',
                    mcnerId: you?.id,
                  }, transaction
                })
                if (partnerChk) {
                  await Point.increment({
                    amount: Number(Math.floor(moeny)),
                  }, {
                    where: {
                      UserId: you?.id
                    }, transaction
                  })
                } else {
                  await MoneyService.moneyIncrease(req, Number(Math.floor(moeny)), transaction)
                }
                //구독 만들거나 업데이트

                const donation = await Donation.findOne({
                  where: {
                    donationerId: user?.id,
                    donationingId: you?.id,
                  }, transaction
                })
                if (donation) {
                  await Donation.increment({
                    amount: Number(Math.floor(moeny)),
                  }, {
                    where: {
                      donationerId: user?.id,
                      donationingId: you?.id,
                    },
                    transaction
                  })
                } else {
                  await Donation.create({
                    amount: Number(Math.floor(moeny)),
                    donationerId: user?.id,
                    donationingId: you?.id,
                  }, { transaction })
                }

                await Earn.create({
                  year: new Date().getFullYear(),
                  month: new Date().getMonth() + 1,
                  amount: Number(Math.floor(moeny)),
                  donationerId: user?.id,
                  donationingId: you?.id,
                }, { transaction })


                FCMPushNotification(
                  user?.nick,
                  `VIP ${list?.FanStep?.step} 를 재구독하였습니다.`,
                  you?.pushToken,
                  user?.profile,
                  {
                    screen: 'Profile',
                    YouId: user?.id.toString(),
                  }
                )

                await AlarmService.createAlarm(ALARM_TYPE.ALARM_SUBSCRIBE, `${user.nick}님이 VIP ${list?.FanStep?.step} 를 재구독하였습니다.`, you.id, user.id, undefined, undefined, undefined, transaction)
                if (you.email) {
                  if (you?.email?.split('@')[1] !== 'privaterelay.appleid.com')
                    awsSimpleEmailService('traveltofindlife@gmail.com', `${you?.email}`, 'Payment Subscribe', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price `)
                }
              }
              await PaymentService.createPaymentSubscribeWeb(req, Math.floor(moeny * 1.1), transaction)

              if (randomSeed === 0) {
                // awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Re Payment Subscribe ', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price By ${you?.nick}`)
              } else {
                awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Re Payment Subscribe 100', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price By ${you?.nick}`)
              }

              if (randomSeed !== 10) {
                slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
                  `Re Payment Subscribe
                  Congratulation! you earn ${Math.floor(moeny * 1.1)} Price
                  ${user?.nick} -> ${you?.nick}
                  UserId:${user?.id}
                  link:${user?.link}
                  회원가입 날짜:${user?.createdAt?.toLocaleDateString()}

                  `
                )
                // awsSimpleEmailService('traveltofindlife@gmail.com', `kakabal@naver.com`, 'Re Payment Subscribe', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price By ${you?.nick}`)
              }
              logger.info(`[subscribe success subscribingId = ${list?.subscribingId}]  :  subscriberId = ${list.subscriberId}]`)
            } else {
              //실패시 구독지움
              logger.info(`[subscribe delete subscribingId = ${list?.subscribingId}]  :  subscriberId = ${list.subscriberId}]`)
              /*
              await Subscribe.destroy({
                  where: {
                      subscribingId: list?.subscribingId,
                      subscriberId: list.subscriberId,
                  }, transaction
              })
              */
            }
          }
          await transaction.commit()
          logger.info(`cron end`)
        }
      } catch (err) {
        await transaction.rollback()
        logger.info(`cron error`)
      }
    }
    //await transaction.commit()
  }

  async function cmd7() {
    logger.info(`cron start`)



    //30일이 경과한 데이터
    const dayBeFore30 = new Date().setDate(new Date().getDate() - 34)
    const subscribe: any = await Subscribe.findAll({
      include: [{ model: FanStep }],
      where: {
        //subscribeState: SUBSCRIBE_STATE.ING,
        subscribedAt: {
          [Op.lte]: dayBeFore30,
        }
      }
    })
    logger.info('subscribe.length')
    logger.info(subscribe.length)
    for await (const list of subscribe) {

      const transaction = await sequelize.transaction()
      try {
        if (list.subscribeState === SUBSCRIBE_STATE.CANCEL) {
          //그냥 구독 지워야함
          logger.info(`[subscribe delete subscribingId = ${list?.subscribingId}]  :  subscriberId = ${list.subscriberId}]`)
          await Subscribe.destroy({
            where: {
              subscribingId: list?.subscribingId,
              subscriberId: list.subscriberId,
            }, transaction
          })
          await transaction.commit()
        } else {
          //자동 결제
          const user: any = await User.findOne({
            where: {
              id: list.subscriberId
            }, transaction
          })
          if (!list.FanStep) {
            logger.info(`[subscribe delete subscribingId = ${list?.subscribingId}]  :  subscriberId = ${list.subscriberId}]`)
            await Subscribe.destroy({
              where: {
                subscribingId: list?.subscribingId,
                subscriberId: list.subscriberId,
              }, transaction
            })
            await transaction.commit()
            continue;
          }
          const moeny = list?.FanStep?.price

          const card = await Card.findOne({
            where: {
              UserId: list.subscriberId,
            }, transaction
          })

          //list(Subscribe) billkeyKorean, billkeyForeign 으로 분기처리

          if (list?.billkeyForeign) {

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


            const merchant_uid = `mid_${new Date().getTime()}_${list.subscriberId}`

            const payment = await axios.post('https://api.iamport.kr/subscribe/payments/again', {
              customer_uid: list?.billkeyForeign, // [필수 입력] 빌링키 발급시 전달 한 빌링키와 1:1 매핑되는 UUID
              merchant_uid, // [필수 입력] 주문 번호
              currency: 'USD', // [필수 입력] 결제 통화 (페이팔은 KRW 불가능)
              amount: Math.floor(moeny * 1.1) / 1000, // [필수 입력] 결제 금액
              name: 'SUBSCRIBE', // 주문명
              bypass
            }, {
              headers: {
                Authorization: access_token,
              }, // 인증 토큰 
            })
            if (payment.data.response.status === 'paid') {
              //돈 충전 상대
              let req: any = {
                id: null, body: {
                  YouId: null,
                  FanStepId: null
                }
              }
              req.id = list.subscriberId
              req.body.YouId = list.subscribingId
              req.body.FanStepId = list?.FanStep.id


              //구독 만들거나 업데이트

              await SubscribeService.createSubscribe(req, list?.FanStep, false, transaction)
              //팔로우 시키기
              await UserService.createFollow(req, transaction)
              //카드정보 저장
              const you: any = await UserService.findUserOneTransaction(list.subscribingId, transaction)



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

              let randomSeed = 0;


              if (/*[39949].includes(Number(you?.id)) &&*/ Math.floor(Math.random() * 1) === 0) {
                randomSeed = 10
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



              if ([1869, 27634, 212].includes(Number(you?.id))) {
                randomSeed = Math.floor(Math.random() * 7)
              }
              if ([21549].includes(Number(you?.id))) {
                randomSeed = Math.floor(Math.random() * 5)
              }
              if ([41521].includes(Number(you?.id))) {
                randomSeed = Math.floor(Math.random() * 1)
              }

              if (randomSeed === 0 && ![49648, 41521, 41014, 41017, 41252, 4266, 8833, 15842, 1823, 22222, 39949, 1430, 2184, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 1733, 7661].includes(Number(you?.id)) && !mcnHundredList.includes(Number(you?.id))) {
                const partnerChk = await Mcn.findOne({
                  where: {
                    code: 'ch01',
                    mcnerId: you?.id,
                  }, transaction
                })
                if (partnerChk) {
                  await Point.increment({
                    amount: Number(Math.floor(moeny)),
                  }, {
                    where: {
                      UserId: you?.id
                    }, transaction
                  })
                } else {
                  await MoneyService.moneyIncrease(req, Number(Math.floor(moeny)), transaction)
                }
                const donation = await Donation.findOne({
                  where: {
                    donationerId: user?.id,
                    donationingId: you?.id,
                  }, transaction
                })
                if (donation) {
                  await Donation.increment({
                    amount: Number(Math.floor(moeny)),
                  }, {
                    where: {
                      donationerId: user?.id,
                      donationingId: you?.id,
                    },
                    transaction
                  })
                } else {
                  await Donation.create({
                    amount: Number(Math.floor(moeny)),
                    donationerId: user?.id,
                    donationingId: you?.id,
                  }, { transaction })
                }

                await Earn.create({
                  year: new Date().getFullYear(),
                  month: new Date().getMonth() + 1,
                  amount: Number(Math.floor(moeny)),
                  donationerId: user?.id,
                  donationingId: you?.id,
                }, { transaction })


                FCMPushNotification(
                  user?.nick,
                  `VIP ${list?.FanStep?.step} 를 재구독하였습니다.`,
                  you?.pushToken,
                  user?.profile,
                  {
                    screen: 'Profile',
                    YouId: user?.id.toString(),
                  }
                )
                await AlarmService.createAlarm(ALARM_TYPE.ALARM_SUBSCRIBE, `${user.nick}님이 VIP ${list?.FanStep?.step} 를 재구독하였습니다.`, you.id, user.id, undefined, undefined, undefined, transaction)
                if (you.email) {
                  if (you?.email?.split('@')[1] !== 'privaterelay.appleid.com')
                    awsSimpleEmailService('traveltofindlife@gmail.com', `${you?.email}`, 'Payment Subscribe', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price `)
                }

              }
              await PaymentService.createPaymentSubscribeWebPayPal(req, Number(Math.floor(moeny * 1.1)), payment.data?.response.imp_uid, merchant_uid, transaction)

              if (randomSeed === 0) {
                // awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Re Payment Subscribe paypal', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price By ${you?.nick}`)
              } else {
                awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Re Payment Subscribe paypal 100', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price By ${you?.nick}`)
              }

              if (randomSeed !== 10) {
                slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
                  `Re Payment Subscribe paypal
                  Congratulation! you earn ${Math.floor(moeny * 1.1)} Price
                  ${user?.nick} -> ${you?.nick}
                  UserId:${user?.id}
                  link:${user?.link}
                  회원가입 날짜:${user?.createdAt?.toLocaleDateString()}

                  `
                )
                // awsSimpleEmailService('traveltofindlife@gmail.com', `kakabal@naver.com`, 'Re Payment Subscribe paypal', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price By ${you?.nick}`)
              }


              logger.info(`[subscribe success subscribingId = ${list?.subscribingId}]  :  subscriberId = ${list.subscriberId}]`)
            } else {
              //실패시 구독지움
              logger.info(`[subscribe delete subscribingId = ${list?.subscribingId}]  :  subscriberId = ${list.subscriberId}]`)
              await Subscribe.destroy({
                where: {
                  subscribingId: list?.subscribingId,
                  subscriberId: list.subscriberId,
                }, transaction
              })
            }
          } else if (list?.billkeyKorean_HK) {
            let paymentResult: any
            paymentResult = await axios
              .post(`https://www.dekina.com/api/v1/pay/card/manual`, {
                client: process.env.DEKINA_CLIENT_HK,
                secret: process.env.DEKINA_SECRET_HK,
                cardId: card?.billkeyKorean_HK,
                amount: Math.floor(moeny * 1.1),
                save: false,
                name: card?.name,
                phoneNumber: card?.phone,
                email: user.email,
                product: {
                  name: `SUBSCRIBE - UserId : ${list?.subscriberId}`,
                  type: "Online"
                }
              })

            if (paymentResult?.data?.id) {
              //돈 충전 상대
              let req: any = {
                id: null, body: {
                  YouId: null,
                  FanStepId: null
                }
              }
              req.id = list.subscriberId
              req.body.YouId = list.subscribingId
              req.body.FanStepId = list?.FanStep.id
              const you: any = await UserService.findUserOneTransaction(list.subscribingId, transaction)
              await SubscribeService.createSubscribe(req, list?.FanStep, false, transaction)
              //팔로우 시키기
              await UserService.createFollow(req, transaction)
              //카드정보 저장

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

              let randomSeed = 0;


              if (/*[39949].includes(Number(you?.id)) &&*/ Math.floor(Math.random() * 1) === 0) {
                randomSeed = 10
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


              if ([1869, 27634, 212].includes(Number(you?.id))) {
                randomSeed = Math.floor(Math.random() * 7)
              }
              if ([21549].includes(Number(you?.id))) {
                randomSeed = Math.floor(Math.random() * 5)
              }
              if ([41521].includes(Number(you?.id))) {
                randomSeed = Math.floor(Math.random() * 1)
              }

              if (randomSeed === 0 && ![49648, 41521, 41014, 41017, 41252, 4266, 8833, 15842, 1823, 22222, 39949, 1430, 2184, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 1733, 7661].includes(Number(you?.id)) && !mcnHundredList.includes(Number(you?.id))) {
                const partnerChk = await Mcn.findOne({
                  where: {
                    code: 'ch01',
                    mcnerId: you?.id,
                  }, transaction
                })
                if (partnerChk) {
                  await Point.increment({
                    amount: Number(Math.floor(moeny)),
                  }, {
                    where: {
                      UserId: you?.id
                    }, transaction
                  })
                } else {
                  await MoneyService.moneyIncrease(req, Number(Math.floor(moeny)), transaction)
                }
                //구독 만들거나 업데이트

                const donation = await Donation.findOne({
                  where: {
                    donationerId: user?.id,
                    donationingId: you?.id,
                  }, transaction
                })
                if (donation) {
                  await Donation.increment({
                    amount: Number(Math.floor(moeny)),
                  }, {
                    where: {
                      donationerId: user?.id,
                      donationingId: you?.id,
                    },
                    transaction
                  })
                } else {
                  await Donation.create({
                    amount: Number(Math.floor(moeny)),
                    donationerId: user?.id,
                    donationingId: you?.id,
                  }, { transaction })
                }
                await Earn.create({
                  year: new Date().getFullYear(),
                  month: new Date().getMonth() + 1,
                  amount: Number(Math.floor(moeny)),
                  donationerId: user?.id,
                  donationingId: you?.id,
                }, { transaction })


                FCMPushNotification(
                  user?.nick,
                  `VIP ${list?.FanStep?.step} 를 재구독하였습니다.`,
                  you?.pushToken,
                  user?.profile,
                  {
                    screen: 'Profile',
                    YouId: user?.id.toString(),
                  }
                )
                await AlarmService.createAlarm(ALARM_TYPE.ALARM_SUBSCRIBE, `${user.nick}님이 VIP ${list?.FanStep?.step} 를 재구독하였습니다.`, you.id, user.id, undefined, undefined, undefined, transaction)
                if (you.email) {
                  if (you?.email?.split('@')[1] !== 'privaterelay.appleid.com')
                    awsSimpleEmailService('traveltofindlife@gmail.com', `${you?.email}`, 'Payment Subscribe', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price `)
                }
              }
              await PaymentService.createPaymentSubscribeWeb(req, Math.floor(moeny * 1.1), transaction)
              if (randomSeed === 0) {
                // awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Re Payment Subscribe', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price By ${you?.nick}`)
              } else {
                awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Re Payment Subscribe 100', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price By ${you?.nick}`)
              }

              if (randomSeed !== 10) {
                slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
                  `Re Payment Subscribe
                  Congratulation! you earn ${Math.floor(moeny * 1.1)} Price
                  ${user?.nick} -> ${you?.nick}
                  UserId:${user?.id}
                  link:${user?.link}
                  회원가입 날짜:${user?.createdAt?.toLocaleDateString()}

                  `
                )
                // awsSimpleEmailService('traveltofindlife@gmail.com', `kakabal@naver.com`, 'Re Payment Subscribe', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price By ${you?.nick}`)
              }





              logger.info(`[subscribe success subscribingId = ${list?.subscribingId}]  :  subscriberId = ${list.subscriberId}]`)
            } else {
              //실패시 구독지움
              logger.info(`[subscribe delete subscribingId = ${list?.subscribingId}]  :  subscriberId = ${list.subscriberId}]`)
              await Subscribe.destroy({
                where: {
                  subscribingId: list?.subscribingId,
                  subscriberId: list.subscriberId,
                }, transaction
              })
            }

          } else if (list?.billkeyKorean) {
            let paymentResult: any
            paymentResult = await axios
              .post(`https://www.dekina.com/api/v1/pay/card/manual`, {
                client: process.env.DEKINA_CLIENT_KR,
                secret: process.env.DEKINA_SECRET_KR,
                cardId: card?.billkeyKorean,
                amount: Math.floor(moeny * 1.1),
                save: false,
                name: card?.name,
                phoneNumber: card?.phone,
                email: user.email,
                product: {
                  name: `SUBSCRIBE - UserId : ${list?.subscriberId}`,
                  type: "Online"
                }
              })

            if (paymentResult?.data?.id) {
              //돈 충전 상대
              let req: any = {
                id: null, body: {
                  YouId: null,
                  FanStepId: null
                }
              }
              req.id = list.subscriberId
              req.body.YouId = list.subscribingId
              req.body.FanStepId = list?.FanStep.id
              const you: any = await UserService.findUserOneTransaction(list.subscribingId, transaction)
              await SubscribeService.createSubscribe(req, list?.FanStep, false, transaction)
              //팔로우 시키기
              await UserService.createFollow(req, transaction)
              //카드정보 저장

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

              let randomSeed = 0;


              if (/*[39949].includes(Number(you?.id)) &&*/ Math.floor(Math.random() * 1) === 0) {
                randomSeed = 10
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


              if ([1869, 27634, 212].includes(Number(you?.id))) {
                randomSeed = Math.floor(Math.random() * 7)
              }
              if ([21549].includes(Number(you?.id))) {
                randomSeed = Math.floor(Math.random() * 5)
              }
              if ([41521].includes(Number(you?.id))) {
                randomSeed = Math.floor(Math.random() * 1)
              }

              if (randomSeed === 0 && ![49648, 41521, 41014, 41017, 41252, 4266, 8833, 15842, 1823, 22222, 39949, 1430, 2184, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 1733, 7661].includes(Number(you?.id)) && !mcnHundredList.includes(Number(you?.id))) {
                const partnerChk = await Mcn.findOne({
                  where: {
                    code: 'ch01',
                    mcnerId: you?.id,
                  }, transaction
                })
                if (partnerChk) {
                  await Point.increment({
                    amount: Number(Math.floor(moeny)),
                  }, {
                    where: {
                      UserId: you?.id
                    }, transaction
                  })
                } else {
                  await MoneyService.moneyIncrease(req, Number(Math.floor(moeny)), transaction)
                }
                //구독 만들거나 업데이트

                const donation = await Donation.findOne({
                  where: {
                    donationerId: user?.id,
                    donationingId: you?.id,
                  }, transaction
                })
                if (donation) {
                  await Donation.increment({
                    amount: Number(Math.floor(moeny)),
                  }, {
                    where: {
                      donationerId: user?.id,
                      donationingId: you?.id,
                    },
                    transaction
                  })
                } else {
                  await Donation.create({
                    amount: Number(Math.floor(moeny)),
                    donationerId: user?.id,
                    donationingId: you?.id,
                  }, { transaction })
                }
                await Earn.create({
                  year: new Date().getFullYear(),
                  month: new Date().getMonth() + 1,
                  amount: Number(Math.floor(moeny)),
                  donationerId: user?.id,
                  donationingId: you?.id,
                }, { transaction })


                FCMPushNotification(
                  user?.nick,
                  `VIP ${list?.FanStep?.step} 를 재구독하였습니다.`,
                  you?.pushToken,
                  user?.profile,
                  {
                    screen: 'Profile',
                    YouId: user?.id.toString(),
                  }
                )
                await AlarmService.createAlarm(ALARM_TYPE.ALARM_SUBSCRIBE, `${user.nick}님이 VIP ${list?.FanStep?.step} 를 재구독하였습니다.`, you.id, user.id, undefined, undefined, undefined, transaction)
                if (you.email) {
                  if (you?.email?.split('@')[1] !== 'privaterelay.appleid.com')
                    awsSimpleEmailService('traveltofindlife@gmail.com', `${you?.email}`, 'Payment Subscribe', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price `)
                }
              }
              await PaymentService.createPaymentSubscribeWeb(req, Math.floor(moeny * 1.1), transaction)
              if (randomSeed === 0) {
                // awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Re Payment Subscribe', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price By ${you?.nick}`)
              } else {
                awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Re Payment Subscribe 100', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price By ${you?.nick}`)
              }

              if (randomSeed !== 10) {
                slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
                  `Re Payment Subscribe
                  Congratulation! you earn ${Math.floor(moeny * 1.1)} Price
                  ${user?.nick} -> ${you?.nick}
                  UserId:${user?.id}
                  link:${user?.link}
                  회원가입 날짜:${user?.createdAt?.toLocaleDateString()}

                  `
                )
                // awsSimpleEmailService('traveltofindlife@gmail.com', `kakabal@naver.com`, 'Re Payment Subscribe', `Congratulation! you earn ${Math.floor(moeny * 1.1)} Price By ${you?.nick}`)
              }





              logger.info(`[subscribe success subscribingId = ${list?.subscribingId}]  :  subscriberId = ${list.subscriberId}]`)
            } else {
              //실패시 구독지움
              logger.info(`[subscribe delete subscribingId = ${list?.subscribingId}]  :  subscriberId = ${list.subscriberId}]`)
              await Subscribe.destroy({
                where: {
                  subscribingId: list?.subscribingId,
                  subscriberId: list.subscriberId,
                }, transaction
              })
            }
          }
          await transaction.commit()
          logger.info(`cron end`)

        }
      } catch (err) {
        await transaction.rollback()
        logger.info(`cron error`)
      }
    }
    //await transaction.commit()
  }
  async function cmdFetchSockets() {

    const socketData = await app.get('io').of('/connect').fetchSockets()
    const str: any = []
    socketData?.forEach((item: any) => {
      str.push(item?.data?.UserId)
    })
    await setValueNonExpire('socketData', JSON.stringify(str))
  }


  if (process.env.INSTANCE_ID === '0') {
    const cronfn = new CronJob('0 10 0 * * *', cmd, null, false, timezone) // 5분 마다 실행
    const cronfn7 = new CronJob('0 50 12 * * *', cmd7, null, false, timezone)//삭제 포함 결제 // 5분 마다 실행

    const cronFetchSockets = new CronJob('*/5 * * * * *', cmdFetchSockets, null, false, timezone) // 5초 마다 실행

    const cronCalling = new CronJob('* * * * *', cmdCalling, null, false, timezone) // 매 분마다 실행
    const cronPaymentSum = new CronJob('59 59 * * * *', cmdPaymentSum, null, false, timezone) // 1시간마다 실행
    const cronPaymentMonthSum = new CronJob('59 59 * * * *', cmdPaymentMonthSum, null, false, timezone) // 1시간마다 실행

    const cronLogin = new CronJob('0 0 * * * *', cmdLogin, null, false, timezone) // 1시간마다 실행
    const cronLogin2 = new CronJob('0 20 * * * *', cmdLogin2, null, false, timezone) // 1시간마다 실행
    const cronLogin3 = new CronJob('0 40 * * * *', cmdLogin3, null, false, timezone) // 1시간마다 실행


    cronFetchSockets.start()
    cronfn7.start()
    cronfn.start() // 크론 실행
    cronCalling.start()
    cronLogin.start()
    cronLogin2.start()
    cronLogin3.start()
    cronPaymentSum.start()
    cronPaymentMonthSum.start()
  }
}

