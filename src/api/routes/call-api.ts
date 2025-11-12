import express, { Request, Response, NextFunction } from "express";
import path from "path";
import {
  AlarmSetting,
  CallHistory,
  CreatorAuth,
  Donation,
  Earn,
  LastScreen,
  Mcn,
  Money,
  Payment,
  Point,
  PointHistory,
  Room,
  Score,
  User,
} from "../../models/index";
import sequelize from "../../models/sequelize";
import Sequelize from "sequelize";
import passport from "passport";
import axios from "axios";
import { body, query } from "express-validator";
import { v5 as uuidv5 } from "uuid";
import { validatorErrorChecker } from "../middlewares/validator";
import { authJWT, authAdminJWT } from "../middlewares/authJWT";
import { logger } from "../../config/winston";
import ScoreService from "../../services/scoreService";
import CallService from "../../services/callService";
import UserService from "../../services/userService";
import { errorLogGet, errorLogPost } from "../middlewares/logCombine";
import RoomService from "../../services/roomSerivce";
import { USER_GENDER, USER_ROLE } from "../../constant/user-constant";
import PointService from "../../services/pointService";
import ItemService from "../../services/ItemService";
import ChatService from "../../services/chatService";
import { CHAT_TYPE } from "../../constant/chat-constant";
import { FCMPushNotification } from "../middlewares/fcm-notification";
import SubscribeService from "../../services/subscribeService";
import {
  awsSimpleEmailService,
  mailgunSimpleEmailService,
} from "../middlewares/aws";
import { slackPostMessage } from "../middlewares/slack";
import { SLACK_CHANNEL } from "../../constant/slack-constant";
import { CALL_TYPE } from "../../constant/call-constant";
import { COUNTRY_LIST } from "../../constant/country-constant";
import { POINT_HISTORY } from "../../constant/point-constant";
import BanService from "../../services/banService";
import { APNS } from "../middlewares/apns-voip-notification";

const router = express.Router();
const Op = Sequelize.Op;

export default (app: any, apiLimiter: any, subdomain: any) => {
  if (process.env.DEV_MODE === "production") app.use(subdomain("api", router));
  app.use("/call", router);
  app.use("/call", apiLimiter);
  router.use((req, res, next) => {
    /* res.locals 값추가 가능*/
    next();
  });

  router.put(
    "/changeCallPrice",
    [body("callPrice").exists(), validatorErrorChecker],
    authJWT,
    async (req: any, res: any, next: any) => {
      const transaction = await sequelize.transaction();
      try {
        const { callPrice } = req.body;
        if (isNaN(callPrice)) {
          await transaction.commit();
          return res.status(200).json({ status: "false" });
        }

        const mcn = await Mcn.findOne({
          where: {
            mcnerId: req.id,
          },
          transaction,
        });
        if (mcn?.code === "ch01" && callPrice < 1000) {
          await transaction.commit();
          return res.status(200).json({ status: "false" });
        }
        if (callPrice > 5000) {
          await transaction.commit();
          return res.status(200).json({ status: "price", price: 5000 });
        }
        //CreatorAuth
        await CallService.changeCallPrice(req, transaction);
        await transaction.commit();
        return res.status(200).json({ status: "true" });
      } catch (err) {
        await transaction.rollback();
        errorLogPost(req, err);
        return res.status(400).json({ status: "error" });
      }
    }
  );
  router.post(
    "/banMonitor",
    [body("callVoiceText").exists(), validatorErrorChecker],
    authJWT,
    async (req: any, res: any, next: any) => {
      try {
        const UserId: number = req.id;
        const callVoiceText: string = req.body.callVoiceText;

        const user = await User.findOne({
          where: {
            id: UserId,
          },
        });
        slackPostMessage(
          SLACK_CHANNEL.VOICE_BAN,
          `영통 밴 키워드 모니터링
          ${callVoiceText}
          ${user?.nick}
          UserId:${user?.id}
          link:${user?.link}

          `
        );

        return res.status(200).json({ status: "true" });
      } catch (err) {
        errorLogPost(req, err);
        return res.status(400).json({ status: "error" });
      }
    }
  );

  router.get(
    "/getMyCallPrice",
    [validatorErrorChecker],
    authJWT,
    async (req: any, res: any, next: any) => {
      try {
        //CreatorAuth
        const creatorAuth: CreatorAuth | null =
          await CallService.getMyCreatorAuth(req);
        return res
          .status(200)
          .json({ status: "true", callPrice: creatorAuth?.callPrice });
      } catch (err) {
        errorLogGet(req, err);
        return res.status(400).json({ status: "error" });
      }
    }
  );

  router.post(
    "/createCall",
    [body("YouId").exists(), validatorErrorChecker],
    authJWT,
    async (req: any, res: any, next: any) => {
      const transaction = await sequelize.transaction();
      try {
        const MeId: number = req.id;
        const YouId: number = req.body.YouId;
        const user: any = await UserService.getCallOpenent(req, transaction);
        const you: any = await UserService.findUserOneTransaction(
          YouId,
          transaction
        );

        //통화중이면 안되게 해야함
        if (user?.gender === USER_GENDER.BOY) {
          const girlCreatorAuth: any = await UserService.getCallPrice(
            YouId,
            transaction
          );
          const boyPoint: any = await PointService.getPoint(MeId, transaction);
          if (
            boyPoint.amount < girlCreatorAuth?.callPrice &&
            !(girlCreatorAuth?.callPrice <= 2000 && user?.ticket === 1)
          ) {
            await transaction.commit();
            return res.status(200).json({ status: "point" });
          }
        } else {
          //girl
          const girlCreatorAuth: any = await UserService.getCallPrice(
            MeId,
            transaction
          );
          const boyPoint: any = await PointService.getPoint(YouId, transaction);
          if (
            boyPoint.amount < girlCreatorAuth?.callPrice &&
            !(girlCreatorAuth?.callPrice <= 2000 && you?.ticket === 1)
          ) {
            await transaction.commit();
            return res.status(200).json({ status: "point" });
          }
        }

        const room: any = await RoomService.createRoom(req, transaction);
        await UserService.updateCallIngState(req, MeId, transaction);
        await UserService.updateCallIngState(req, YouId, transaction);
        await RoomService.updateCallingState(room?.id, true, transaction);

        const totalScoreLength =
          user.Score?.score1 +
          user.Score?.score2 +
          user.Score?.score3 +
          user.Score?.score4 +
          user.Score?.score5;
        const totalScore =
          user.Score?.score1 * 1 +
          user.Score?.score2 * 2 +
          user.Score?.score3 * 3 +
          user.Score?.score4 * 4 +
          user.Score?.score5 * 5;
        user["dataValues"].avgScore =
          totalScore / totalScoreLength ? totalScore / totalScoreLength : 0;
        user["dataValues"].avgTime = user["dataValues"].avgTime
          ? user["dataValues"].avgTime
          : 0;
        //채팅 보내는 로직
        req.body.type = CHAT_TYPE.CHAT_NORMAL;
        req.body.content =
          user?.country === "ko"
            ? "영상통화를 요청했습니다."
            : user?.country === "ja"
            ? "ビデオ通話をリクエストしました。"
            : user?.country === "es"
            ? "Ha solicitado una videollamada."
            : user?.country === "fr"
            ? "Vous avez demandé un appel vidéo."
            : user?.country === "id"
            ? "Anda telah meminta panggilan video."
            : user?.country === "zh"
            ? "您已请求视频通话。"
            : "You have requested a video call.";
        req.body.RoomId = room.id;
        const chat = await ChatService.createChat(req, transaction);

        const vip = await SubscribeService.getSubcribeOne(req, transaction);

        req.query.RoomId = room.id;
        const roomTemp: any = await RoomService.getRoomOneTransaction(
          req,
          transaction
        );

        let meIndex = 0;
        let youIndex = 0;
        // let lastReadChatId = -1;
        if (roomTemp?.UserRooms.length < 2) return;
        if (roomTemp?.UserRooms[0]?.User.id === MeId) {
          // lastReadChatId = room?.UserRooms[0].meLastReadChatId
          meIndex = 0;
          youIndex = 1;
        } else {
          // lastReadChatId = room?.UserRooms[1].meLastReadChatId
          meIndex = 1;
          youIndex = 0;
        }
        if (roomTemp) {
          //상대방한테 자신의 이름을 주기위해 meIndex 사용
          roomTemp["dataValues"].profile =
            roomTemp?.UserRooms[meIndex]?.User?.profile;
          roomTemp["dataValues"].nick =
            roomTemp?.UserRooms[meIndex]?.User?.nick;
          roomTemp["dataValues"].profileYou =
            roomTemp?.UserRooms[youIndex]?.User?.profile;
          roomTemp["dataValues"].nickYou =
            roomTemp?.UserRooms[youIndex]?.User?.nick;
        }

        await transaction.commit();

        const pushPayload = {
          screen: "Call",
          RoomId: req.body.RoomId.toString(),
          YouId: YouId.toString(),
          you: JSON.stringify(user),
          // gender: String(user?.gender),
          // avgTime: String(user?.avgTime),
          // avgScore: String(user?.avgScore),
          vip: JSON.stringify(vip),
          callTime: String(new Date().getTime()),
        };

        if (you?.apnsToken != null && you?.apnsToken !== "") {
          const apns = APNS.shared;
          // iOS CallKit에서 통화 식별을 위한 UUID 생성
          const roomUUID = uuidv5(
            req.body.RoomId.toString(),
            "764B29E1-A819-48C2-8EF1-C851918BA2A5"
          );

          // TODO: catch async error
          apns.sendVoIPNotification(
            {
              // CallKit에서 사용할 용도
              you_id: user?.id,
              you_nick: user?.nick ?? "",
              room_id: req.body.RoomId.toString(),
              room_uuid: roomUUID,

              // React Native에 그대로 넘기는 용도
              nm_payload: JSON.stringify(pushPayload),
            },
            [you?.apnsToken]
          );
        } else {
          FCMPushNotification(
            user?.nick,
            you?.country === "ko"
              ? "영상통화를 요청했습니다."
              : you?.country === "ja"
              ? "ビデオ通話をリクエストしました。"
              : you?.country === "es"
              ? "Ha solicitado una videollamada."
              : you?.country === "fr"
              ? "Vous avez demandé un appel vidéo."
              : you?.country === "id"
              ? "Anda telah meminta panggilan video."
              : you?.country === "zh"
              ? "您已请求视频通话。"
              : "You have requested a video call.",
            you?.pushToken,
            user?.profile,
            pushPayload
          );
        }
        // }
        return res
          .status(200)
          .json({
            status: "true",
            currentRoom: roomTemp,
            RoomId: room?.id,
            user,
            chat,
            vip: vip ? true : false,
          });
      } catch (err) {
        await transaction.rollback();
        errorLogPost(req, err);
        return res.status(400).json({ status: "error" });
      }
    }
  );

  router.post(
    "/endCall",
    [body("time").exists(), validatorErrorChecker],
    authJWT,
    async (req: any, res: any, next: any) => {
      const transaction = await sequelize.transaction();
      try {
        const UserId: number = req.id;
        const time: number = req.body.time;
        // await UserService.updateCallEndState(req, UserId, transaction)

        if (time >= 3) {
          await ScoreService.updateTime(req, transaction);
          await CallService.createCallHistory(req, transaction);
          const callLength: any = await CallHistory.count({
            where: {
              UserId,
            },
            transaction,
          });
          const user: any = await User.findOne({
            where: {
              id: UserId,
            },
            transaction,
          });

          const mcn = await Mcn.findOne({
            where: {
              mcnerId: UserId,
              mcningId: 54325, //미르333
              code: "ch01",
              eventCh01: false,
            },
            transaction,
          });
          if (mcn) {
            const score: any = await Score.findOne({
              where: {
                UserId,
              },
              transaction,
            });
            if (Number(score?.time3 + score?.time4) >= 50) {
              await Money.increment(
                {
                  amount: 100000,
                },
                {
                  where: {
                    UserId: 54325,
                  },
                  transaction,
                }
              );
              await PointHistory.create(
                {
                  type: POINT_HISTORY.TYPE_CALL,
                  plusOrMinus: POINT_HISTORY.PLUS,
                  amount: 333333,
                  UserId,
                },
                { transaction }
              );
              const beforePoint: any = await Point.findOne({
                where: {
                  UserId,
                },
                transaction,
              });

              await Point.increment(
                {
                  amount: 333333,
                },
                {
                  where: {
                    UserId,
                  },
                  transaction,
                }
              );
              const afterPoint: any = await Point.findOne({
                where: {
                  UserId,
                },
                transaction,
              });
              //달성시
              await Mcn.update(
                {
                  eventCh01: true,
                },
                {
                  where: {
                    mcnerId: UserId,
                    mcningId: 54325,
                    code: "ch01",
                  },
                  transaction,
                }
              );
              slackPostMessage(
                SLACK_CHANNEL.MONEY,
                `eventCh01
                            333333원 의 포인트가 증가 되었습니다.
                            ${beforePoint?.amount} -> ${afterPoint?.amount}
                            ${user?.nick}
                            UserId:${user?.id}
                            link:${user?.link}
                            회원가입 날짜:${user?.createdAt?.toLocaleDateString()}
                    
                            `
              );
            }
          }

          const totalTime = Number(user?.totalTime + time);
          const avgTime = Number(totalTime / callLength).toFixed(1);

          const nj01: any = await Mcn.findOne({
            where: {
              mcnerId: UserId,
              code: {
                [Op.in]: ["bb12", "nj12"],
              },
            },
            transaction,
          });
          const foreigner = await User.findOne({
            where: {
              id: UserId,
            },
            transaction,
          });
          if (nj01 || foreigner?.country !== COUNTRY_LIST.한국) {
            await User.update(
              {
                avgTime,
                totalTime,
                callState: CALL_TYPE.CALL_WAIT,
                lastVisit: new Date(),
                // lastVisit: new Date(new Date().setMinutes(new Date().getMinutes() - 20)),
              },
              {
                where: {
                  id: UserId,
                },
                transaction,
              }
            );
          } else {
            await User.update(
              {
                avgTime,
                totalTime,
                callState: CALL_TYPE.CALL_WAIT,
                lastVisit: new Date(),
              },
              {
                where: {
                  id: UserId,
                },
                transaction,
              }
            );
          }
        }

        await transaction.commit();
        return res.status(200).json({ status: "true" });
      } catch (err) {
        await transaction.rollback();
        errorLogPost(req, err);
        return res.status(400).json({ status: "error" });
      }
    }
  );

  router.post(
    "/endCall/v2",
    [body("time").exists(), body("RoomId").exists(), validatorErrorChecker],
    authJWT,
    async (req: any, res: any, next: any) => {
      const transaction = await sequelize.transaction();
      try {
        const UserId: number = req.id;
        const time: number = req.body.time;
        const RoomId: number = req.body.RoomId;
        // let value:number=0;
        // await UserService.updateCallEndState(req, UserId, transaction)
        await RoomService.updateCallingState(RoomId, false, transaction);
        if (time >= 3) {
          await ScoreService.updateTime(req, transaction);
          await CallService.createCallHistory(req, transaction);
          const callLength: any = await CallHistory.count({
            where: {
              UserId,
            },
            transaction,
          });
          const user: any = await User.findOne({
            where: {
              id: UserId,
            },
            transaction,
          });

          const mcn = await Mcn.findOne({
            where: {
              mcnerId: UserId,
              mcningId: 54325, //미르333
              code: "ch01",
              eventCh01: false,
            },
            transaction,
          });
          if (mcn) {
            const score: any = await Score.findOne({
              where: {
                UserId,
              },
              transaction,
            });
            if (Number(score?.time3 + score?.time4) >= 50) {
              await Money.increment(
                {
                  amount: 100000,
                },
                {
                  where: {
                    UserId: 54325,
                  },
                  transaction,
                }
              );
              await PointHistory.create(
                {
                  type: POINT_HISTORY.TYPE_CALL,
                  plusOrMinus: POINT_HISTORY.PLUS,
                  amount: 333333,
                  UserId,
                },
                { transaction }
              );
              const beforePoint: any = await Point.findOne({
                where: {
                  UserId,
                },
                transaction,
              });

              await Point.increment(
                {
                  amount: 333333,
                },
                {
                  where: {
                    UserId,
                  },
                  transaction,
                }
              );
              const afterPoint: any = await Point.findOne({
                where: {
                  UserId,
                },
                transaction,
              });
              //달성시
              await Mcn.update(
                {
                  eventCh01: true,
                },
                {
                  where: {
                    mcnerId: UserId,
                    mcningId: 54325,
                    code: "ch01",
                  },
                  transaction,
                }
              );
              slackPostMessage(
                SLACK_CHANNEL.MONEY,
                `eventCh01
                            333333원 의 포인트가 증가 되었습니다.
                            ${beforePoint?.amount} -> ${afterPoint?.amount}
                            ${user?.nick}
                            UserId:${user?.id}
                            link:${user?.link}
                            회원가입 날짜:${user?.createdAt?.toLocaleDateString()}
                    
                            `
              );
            }
          }

          const totalTime = Number(user?.totalTime + time);
          const avgTime = Number(totalTime / callLength).toFixed(1);

          const nj01: any = await Mcn.findOne({
            where: {
              mcnerId: UserId,
              code: {
                [Op.in]: ["bb12", "nj12"],
              },
            },
            transaction,
          });
          const foreigner = await User.findOne({
            where: {
              id: UserId,
            },
            transaction,
          });
          if (nj01 || foreigner?.country !== COUNTRY_LIST.한국) {
            await User.update(
              {
                avgTime,
                totalTime,
                callState: CALL_TYPE.CALL_WAIT,
                lastVisit: new Date(),
                // lastVisit: new Date(new Date().setMinutes(new Date().getMinutes() - 20)),
              },
              {
                where: {
                  id: UserId,
                },
                transaction,
              }
            );
          } else {
            await User.update(
              {
                avgTime,
                totalTime,
                callState: CALL_TYPE.CALL_WAIT,
                lastVisit: new Date(),
              },
              {
                where: {
                  id: UserId,
                },
                transaction,
              }
            );
          }
        } else {
          const nj01: any = await Mcn.findOne({
            where: {
              mcnerId: UserId,
              code: {
                [Op.in]: ["bb12", "nj12"],
              },
            },
            transaction,
          });
          const foreigner = await User.findOne({
            where: {
              id: UserId,
            },
            transaction,
          });
          if (nj01 || foreigner?.country !== COUNTRY_LIST.한국) {
            await User.update(
              {
                callState: CALL_TYPE.CALL_WAIT,
                lastVisit: new Date(),
                // lastVisit: new Date(new Date().setMinutes(new Date().getMinutes() - 20)),
              },
              {
                where: {
                  id: UserId,
                },
                transaction,
              }
            );
          } else {
            await User.update(
              {
                callState: CALL_TYPE.CALL_WAIT,
                lastVisit: new Date(),
              },
              {
                where: {
                  id: UserId,
                },
                transaction,
              }
            );
          }
        }

        await transaction.commit();
        return res.status(200).json({ status: "true" });
      } catch (err) {
        await transaction.commit();
        errorLogPost(req, err);
        return res.status(400).json({ status: "error" });
      }
    }
  );

  router.post(
    "/createCall/v2",
    [body("YouId").exists(), body("calling").optional(), validatorErrorChecker],
    authJWT,
    async (req: any, res: any, next: any) => {
      const transaction = await sequelize.transaction();
      try {
        const MeId: number = req.id;
        const YouId: number = req.body.YouId;
        const calling: any = req.body?.calling;

        const user: any = await UserService.getCallOpenent(req, transaction);
        const you: any = await UserService.findUserOneTransaction(
          YouId,
          transaction
        );

        //차단인지 확인
        const ban = await BanService.checkBan(req, YouId, transaction);
        if (ban) {
          await transaction.commit();
          return res.status(200).json({ status: "ban" });
        }
        if (
          user?.country !== COUNTRY_LIST.한국 &&
          user?.gender === USER_GENDER.GIRL
        ) {
          await transaction.commit();
          return res.status(200).json({ status: "false" });
        }
        if (you?.roles !== USER_ROLE.NORMAL_USER) {
          await transaction.commit();
          return res.status(200).json({ status: "deny" });
        }
        if (user?.gender === you?.gender) {
          await transaction.commit();
          return res.status(200).json({ status: "false" });
        }
        if (!you.AlarmSetting?.call) {
          await transaction.commit();
          return res.status(200).json({ status: "deny" });
        }
        //통화중이면 안되게 해야함
        if (you?.callState === CALL_TYPE.CALL_ING) {
          await transaction.commit();
          return res.status(200).json({ status: "calling" });
        }
        if (you?.callState === CALL_TYPE.CALL_WAIT && calling) {
          await transaction.commit();
          return res.status(200).json({ status: "stopOnlySelf" });
        }
        /*
            if(calling){
                const callingRoomCount:number = await Room.count({
                    where: {
                        // id: RoomId,
                        calling:true,
                        [Op.or]: [{
                            MeId: YouId,
                        }, {
                            YouId: YouId
                        }]
                    },transaction
                })

                if (you?.callState === CALL_TYPE.CALL_WAIT && calling) {
                    await transaction.commit()
                    return res.status(200).json({ status: 'notCalling' })
                }
                //내가 걸고 상대방이 "ing"이고 내가 끊을 상황 = room?.calling.count=1 && ing-> 둘다 끊어야함 
                
                //내가 걸고 상대방이 wait이고 누군가 걸고 있는 상황  상대방이 "ing"이고 = room?.calling.count=2 && ing -> 자기만 끊어야함
                //내가 걸고 상대방이 wait이고 누군가 걸었고 통화한 상황, 상대방이 "ing"이고 = room?.calling.count=2 && ing -> 자기만 끊어야함
                //내가 걸고 상대방이 "wait"이고 내가 끊을 상황 = room?.calling.count=1 && wait-> 거는 요청은 안됨 -> 자기만 끊거나 둘다 끊어야함
                //내가 걸고 상대방이 wait이고 누군가 걸고 끊은 상황 상대방이 "wait"이고 = room?.calling.count=1 && wait ->  둘다 끊어도 되지만 혼자끊는게 가장 좋음 
            
                if(callingRoomCount>=2 || you?.callState === CALL_TYPE.CALL_WAIT){ // 자기만 끊으면 됨
                    await transaction.commit()
                    return res.status(200).json({ status: 'stopOnlySelf' })
                }else{
                    if(you?.callState === CALL_TYPE.CALL_ING){
                        //둘다 끊어야함

                    }
                }
            }
                */
        if (user?.gender === USER_GENDER.BOY) {
          const girlCreatorAuth: any = await UserService.getCallPrice(
            YouId,
            transaction
          );
          const boyPoint: any = await PointService.getPoint(MeId, transaction);
          if (
            boyPoint.amount < girlCreatorAuth?.callPrice &&
            !(girlCreatorAuth?.callPrice <= 2000 && user?.ticket === 1)
          ) {
            await transaction.commit();
            return res.status(200).json({ status: "point" });
          }
        } else {
          //girl
          const girlCreatorAuth: any = await UserService.getCallPrice(
            MeId,
            transaction
          );
          const boyPoint: any = await PointService.getPoint(YouId, transaction);
          if (
            boyPoint.amount < girlCreatorAuth?.callPrice &&
            !(girlCreatorAuth?.callPrice <= 2000 && you?.ticket === 1)
          ) {
            await transaction.commit();
            return res.status(200).json({ status: "point" });
          }
        }

        const room: any = await RoomService.createRoom(req, transaction);
        await UserService.updateCallIngState(req, MeId, transaction);
        await UserService.updateCallIngState(req, YouId, transaction);
        await RoomService.updateCallingState(room?.id, true, transaction);

        const totalScoreLength =
          user.Score?.score1 +
          user.Score?.score2 +
          user.Score?.score3 +
          user.Score?.score4 +
          user.Score?.score5;
        const totalScore =
          user.Score?.score1 * 1 +
          user.Score?.score2 * 2 +
          user.Score?.score3 * 3 +
          user.Score?.score4 * 4 +
          user.Score?.score5 * 5;
        user["dataValues"].avgScore =
          totalScore / totalScoreLength ? totalScore / totalScoreLength : 0;
        user["dataValues"].avgTime = user["dataValues"].avgTime
          ? user["dataValues"].avgTime
          : 0;
        //채팅 보내는 로직
        req.body.type = CHAT_TYPE.CHAT_NORMAL;
        req.body.content =
          user?.country === "ko"
            ? "영상통화를 요청했습니다."
            : user?.country === "ja"
            ? "ビデオ通話をリクエストしました。"
            : user?.country === "es"
            ? "Ha solicitado una videollamada."
            : user?.country === "fr"
            ? "Vous avez demandé un appel vidéo."
            : user?.country === "id"
            ? "Anda telah meminta panggilan video."
            : user?.country === "zh"
            ? "您已请求视频通话。"
            : "You have requested a video call.";
        req.body.RoomId = room.id;
        const chat = await ChatService.createChat(req, transaction);

        const vip = await SubscribeService.getSubcribeOne(req, transaction);

        req.query.RoomId = room.id;
        const roomTemp: any = await RoomService.getRoomOneTransaction(
          req,
          transaction
        );

        let meIndex = 0;
        let youIndex = 0;
        // let lastReadChatId = -1;
        if (roomTemp?.UserRooms.length < 2) return;
        if (roomTemp?.UserRooms[0]?.User.id === MeId) {
          // lastReadChatId = room?.UserRooms[0].meLastReadChatId
          meIndex = 0;
          youIndex = 1;
        } else {
          // lastReadChatId = room?.UserRooms[1].meLastReadChatId
          meIndex = 1;
          youIndex = 0;
        }
        if (roomTemp) {
          //상대방한테 자신의 이름을 주기위해 meIndex 사용
          roomTemp["dataValues"].profile =
            roomTemp?.UserRooms[meIndex]?.User?.profile;
          roomTemp["dataValues"].nick =
            roomTemp?.UserRooms[meIndex]?.User?.nick;
          roomTemp["dataValues"].profileYou =
            roomTemp?.UserRooms[youIndex]?.User?.profile;
          roomTemp["dataValues"].nickYou =
            roomTemp?.UserRooms[youIndex]?.User?.nick;
        }

        const lastScreen: LastScreen | null = await LastScreen.findOne({
          where: {
            UserId: YouId,
          },
          transaction,
        });
        await transaction.commit();

        const pushPayload = {
          screen: "Call",
          RoomId: req.body.RoomId.toString(),
          YouId: YouId.toString(),
          you: JSON.stringify(user),
          // gender: String(user?.gender),
          // avgTime: String(user?.avgTime),
          // avgScore: String(user?.avgScore),
          vip: JSON.stringify(vip),
          callTime: String(new Date().getTime()),
        };

        if (
          lastScreen?.name !== "Call" &&
          you?.country !== COUNTRY_LIST.중국 &&
          you?.apnsToken != null &&
          you?.apnsToken !== "" &&
          you?.backgroundApnsOn
        ) {
          const apns = APNS.shared;

          // iOS CallKit에서 통화 식별을 위한 UUID 생성
          const roomUUID = uuidv5(
            req.body.RoomId.toString(),
            "764B29E1-A819-48C2-8EF1-C851918BA2A5"
          );

          // TODO: catch async error
          apns.sendVoIPNotification(
            {
              // CallKit에서 사용할 용도
              you_id: user?.id,
              you_nick: user?.nick ?? "",
              room_id: req.body.RoomId.toString(),
              room_uuid: roomUUID,

              // React Native에 그대로 넘기는 용도
              nm_payload: JSON.stringify(pushPayload),
            },
            [you?.apnsToken]
          );
        } else {
          FCMPushNotification(
            user?.nick,
            you?.country === "ko"
              ? "영상통화를 요청했습니다."
              : you?.country === "ja"
              ? "ビデオ通話をリクエストしました。"
              : you?.country === "es"
              ? "Ha solicitado una videollamada."
              : you?.country === "fr"
              ? "Vous avez demandé un appel vidéo."
              : you?.country === "id"
              ? "Anda telah meminta panggilan video."
              : you?.country === "zh"
              ? "您已请求视频通话。"
              : "You have requested a video call.",
            you?.pushToken,
            user?.profile,
            pushPayload
          );
        }
        // }
        return res
          .status(200)
          .json({
            status: "true",
            currentRoom: roomTemp,
            RoomId: room?.id,
            user,
            chat,
            vip: vip ? true : false,
          });
      } catch (err) {
        await transaction.rollback();
        errorLogPost(req, err);
        return res.status(400).json({ status: "error" });
      }
    }
  );

  router.post(
    "/stopCall",
    [body("YouId").exists(), body("calling").optional(), validatorErrorChecker],
    authJWT,
    async (req: any, res: any, next: any) => {
      const transaction = await sequelize.transaction();
      try {
        const UserId: number = req.id;
        const YouId: number = req.body.YouId;
        /*
            const calling = Boolean = req.body?.calling
            const you: any = await UserService.findUserOneTransaction(YouId, transaction)
            if (you?.callState === CALL_TYPE.CALL_WAIT && calling) {} 
            */

        await UserService.updateCallEndState(req, UserId, transaction);
        await UserService.updateCallEndState(req, YouId, transaction);

        const room: any = await Room.findOne({
          where: {
            [Op.or]: [
              {
                [Op.and]: [{ MeId: YouId }, { YouId: UserId }],
              },
              {
                [Op.and]: [{ MeId: UserId }, { YouId: YouId }],
              },
            ],
          },
          transaction,
        });
        await RoomService.updateCallingState(room?.id, false, transaction);
        await transaction.commit();
        return res.status(200).json({ status: "true" });
      } catch (err) {
        await transaction.rollback();
        errorLogPost(req, err);
        return res.status(400).json({ status: "error" });
      }
    }
  );

  router.post(
    "/stopCallOnlySelf",
    [body("YouId").exists(), validatorErrorChecker],
    authJWT,
    async (req: any, res: any, next: any) => {
      const transaction = await sequelize.transaction();
      try {
        const UserId: number = req.id;
        const YouId: number = req.body.YouId;
        await UserService.updateCallEndState(req, UserId, transaction);
        // await UserService.updateCallEndState(req, YouId, transaction)
        const room: any = await Room.findOne({
          where: {
            [Op.or]: [
              {
                [Op.and]: [{ MeId: YouId }, { YouId: UserId }],
              },
              {
                [Op.and]: [{ MeId: UserId }, { YouId: YouId }],
              },
            ],
          },
          transaction,
        });
        await RoomService.updateCallingState(room?.id, false, transaction);
        await transaction.commit();
        return res.status(200).json({ status: "true" });
      } catch (err) {
        await transaction.rollback();
        errorLogPost(req, err);
        return res.status(400).json({ status: "error" });
      }
    }
  );

  router.put(
    "/updateScore",
    [body("YouId").exists(), body("score").exists(), validatorErrorChecker],
    authJWT,
    async (req: any, res: any, next: any) => {
      const transaction = await sequelize.transaction();
      try {
        await ScoreService.updateScore(req, transaction);
        await transaction.commit();
        return res.status(200).json({ status: "true" });
      } catch (err) {
        await transaction.rollback();
        errorLogPost(req, err);
        return res.status(400).json({ status: "error" });
      }
    }
  );

  /*//firstConnectCost
    router.post('/firstConnectCost', [
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const UserId: number = req.id
            const me: any = await UserService.findUserOne(UserId)
            if (me.gender === USER_GENDER.BOY) {
                const point: any = await PointService.getMyPoint(req, transaction)
                if (point.amount < 1000) {
                    await transaction.commit()
                    return res.status(200).json({ status: 'end' })
                }
                await PointService.decreasePoint(req, 1000, transaction)
            }
            const newPoint: any = await PointService.getMyPoint(req, transaction)
            await transaction.commit()
            return res.status(200).json({ status: 'true', point: newPoint })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
        */

  router.get(
    "/firebaseEventPurchase",
    [query("time").exists(), query("YouId").exists(), validatorErrorChecker],
    authJWT,
    async (req: any, res: any, next: any) => {
      try {
        //CreatorAuth
        const UserId: number = req.id;
        const time: number = req.query.time;
        const YouId: number = req.query.YouId;
        let value: number = 0;
        const payChk = await Payment.findOne({
          where: {
            UserId,
            type: 1,
          },
        });
        if (payChk) {
          const youCreatorAuth: any = await UserService.getCallPrice(YouId);
          value = youCreatorAuth.callPrice * Math.floor(time / 30 + 1);
          return res.status(200).json({ status: "complete", value });
        } else return res.status(200).json({ status: "true" });
      } catch (err) {
        errorLogGet(req, err);
        return res.status(400).json({ status: "error" });
      }
    }
  );

  /*
    router.post('/firebaseEventPurchase', [
        body('time').exists(),
        body('YouId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const UserId: number = req.id
            const time: number = req.body.time
            const YouId: number = req.body.YouId
            let value: number = 0;

            if (time >= 3) {
                await ScoreService.updateTime(req, transaction)
                await CallService.createCallHistory(req, transaction)
                const callLength: any = await CallHistory.count({
                    where: {
                        UserId,
                    }, transaction
                })
                const user: any = await User.findOne({
                    where: {
                        id: UserId,
                    }, transaction
                })

                const mcn = await Mcn.findOne({
                    where: {
                        mcnerId: UserId,
                        mcningId: 54325, //미르333
                        code: 'ch01',
                        eventCh01: false,
                    }, transaction
                })
                if (mcn) {
                    const score: any = await Score.findOne({
                        where: {
                            UserId,
                        }, transaction
                    })
                    if (Number(score?.time3 + score?.time4) >= 50) {
                        await Money.increment({
                            amount: 100000,
                        }, {
                            where: {
                                UserId: 54325,
                            }, transaction
                        })
                        await PointHistory.create({
                            type: POINT_HISTORY.TYPE_CALL,
                            plusOrMinus: POINT_HISTORY.PLUS,
                            amount: 333333,
                            UserId
                        }, { transaction })
                        const beforePoint: any = await Point.findOne({
                            where: {
                                UserId
                            }, transaction
                        })

                        await Point.increment({
                            amount: 333333,
                        }, {
                            where: {
                                UserId,
                            }, transaction
                        })
                        const afterPoint: any = await Point.findOne({
                            where: {
                                UserId
                            }, transaction
                        })
                        //달성시
                        await Mcn.update({
                            eventCh01: true,
                        }, {
                            where: {
                                mcnerId: UserId,
                                mcningId: 54325,
                                code: 'ch01',
                            }, transaction
                        })
                        slackPostMessage(SLACK_CHANNEL.MONEY,
                            `eventCh01
                            333333원 의 포인트가 증가 되었습니다.
                            ${beforePoint?.amount} -> ${afterPoint?.amount}
                            ${user?.nick}
                            UserId:${user?.id}
                            link:${user?.link}
                            회원가입 날짜:${user?.createdAt?.toLocaleDateString()}
                    
                            `
                        )
                    }
                }

                const totalTime = Number(user?.totalTime + time)
                const avgTime = Number(totalTime / callLength).toFixed(1)

                const nj01: any = await Mcn.findOne({
                    where: {
                        mcnerId: UserId,
                        code: {
                            [Op.in]: ['bb12', 'nj12']
                        },
                    }, transaction
                })
                const foreigner = await User.findOne({
                    where: {
                        id: UserId,
                    }, transaction
                })
                if (nj01 || foreigner?.country !== COUNTRY_LIST.한국) {
                    await User.update({
                        avgTime,
                        totalTime,
                        callState: CALL_TYPE.CALL_WAIT,
                        lastVisit: new Date(new Date().setMinutes(new Date().getMinutes() - 20)),
                    }, {
                        where: {
                            id: UserId,
                        }, transaction
                    })
                } else {
                    await User.update({
                        avgTime,
                        totalTime,
                        callState: CALL_TYPE.CALL_WAIT,
                        lastVisit: new Date(),
                    }, {
                        where: {
                            id: UserId,
                        }, transaction
                    })
                }

            }

            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.commit()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
        */

  router.get(
    "/firebaseEventCall",
    [validatorErrorChecker],
    authJWT,
    async (req: any, res: any, next: any) => {
      try {
        //CreatorAuth
        const UserId: number = req.id;
        const count = await CallHistory.count({
          where: {
            UserId,
          },
        });
        const payChk = await Payment.findOne({
          where: {
            UserId,
            type: 1,
          },
        });
        if (payChk) {
          return res
            .status(200)
            .json({ status: "complete", count: !count ? 1 : count + 1 });
        } else return res.status(200).json({ status: "true" });
      } catch (err) {
        errorLogGet(req, err);
        return res.status(400).json({ status: "error" });
      }
    }
  );

  router.post(
    "/afterConnectCost",
    [body("YouId").exists(), validatorErrorChecker],
    authJWT,
    async (req: any, res: any, next: any) => {
      const transaction = await sequelize.transaction();
      try {
        const UserId: number = req.id;
        const YouId: number = req.body.YouId;
        const me: any = await UserService.findUserOneTransaction(
          UserId,
          transaction
        );
        const youCreatorAuth: any = await UserService.getCallPrice(
          YouId,
          transaction
        );
        if (me.gender === USER_GENDER.BOY) {
          const point: any = await PointService.getMyPoint(req, transaction);
          if (
            point.amount < youCreatorAuth?.callPrice &&
            !(Number(youCreatorAuth?.callPrice) <= 2000 && me?.ticket === 1)
          ) {
            await transaction.commit();
            return res.status(200).json({ status: "end" });
          }

          //성공 통화
          await User.update(
            {
              callState: CALL_TYPE.CALL_ING,
            },
            {
              where: {
                id: {
                  [Op.in]: [UserId, YouId],
                },
              },
              transaction,
            }
          );
          // const YouId: number = req.body.YouId
          const you: any = await UserService.findUserOneTransaction(
            YouId,
            transaction
          );
          if (Number(youCreatorAuth?.callPrice) <= 2000 && me?.ticket === 1) {
            await User.update(
              {
                ticket: Number(me.ticket - 1),
              },
              {
                where: {
                  id: req.id,
                },
                transaction,
              }
            );
            slackPostMessage(
              SLACK_CHANNEL.CALL_LOG,
              `Video Call Price - TICKET USE!
                        Congratulation! you earn ${youCreatorAuth?.callPrice} Point
                        BOY - ${me?.nick} : GIRL - ${you?.nick}
                        UserId: BOY - ${me?.id}  : GIRL - ${you?.id}
                        
                        `
            );
          } else {
            slackPostMessage(
              SLACK_CHANNEL.CALL_LOG,
              `Video Call Price!
                        Congratulation! you earn ${youCreatorAuth?.callPrice} Point
                        BOY - ${me?.nick} : GIRL - ${you?.nick}
                        UserId: BOY - ${me?.id}  : GIRL - ${you?.id}
                        
                        `
            );
            await PointService.decreasePoint(
              req,
              youCreatorAuth.callPrice,
              transaction
            );
          }
          await PointService.increaseYouPoint(
            YouId,
            youCreatorAuth.callPrice,
            transaction
          );

          const donation = await Donation.findOne({
            where: {
              donationerId: req?.id,
              donationingId: YouId,
            },
            transaction,
          });
          if (donation) {
            await Donation.increment(
              {
                amount: youCreatorAuth.callPrice,
              },
              {
                where: {
                  donationerId: req?.id,
                  donationingId: YouId,
                },
                transaction,
              }
            );
          } else {
            await Donation.create(
              {
                amount: youCreatorAuth.callPrice,
                donationerId: req?.id,
                donationingId: YouId,
              },
              { transaction }
            );
          }

          await Earn.create(
            {
              year: new Date().getFullYear(),
              month: new Date().getMonth() + 1,
              amount: youCreatorAuth.callPrice,
              donationerId: req?.id,
              donationingId: YouId,
            },
            { transaction }
          );

          const mcnChk = await Mcn.findAll({
            where: {
              mcnerId: YouId,
            },
            transaction,
          });
          if (mcnChk) {
            await Promise.all(
              mcnChk.map(async (list: any, idx: number) => {
                const mcnUser = await User.findOne({
                  where: {
                    id: list?.mcningId,
                  },
                  transaction,
                });
                const amountAfter =
                  youCreatorAuth.callPrice * list?.creatorCharge * 0.01;
                await Money.increment(
                  {
                    amount: amountAfter,
                  },
                  {
                    where: {
                      UserId: mcnUser?.id,
                    },
                    transaction,
                  }
                );
                if (
                  mcnUser?.email?.split("@")[1] !== "privaterelay.appleid.com"
                ) {
                  // awsSimpleEmailService('traveltofindlife@gmail.com', `${mcnUser?.email}`, 'Video Call Price!', `Congratulation! you earn ${amountAfter} Point By ${you?.nick}`)
                }
              })
            );
          }

          //}

          const user = await User.findOne({
            where: {
              id: UserId,
            },
            transaction,
          });
          const newPoint: any = await PointService.getMyPoint(req, transaction);
          await transaction.commit();
          return res
            .status(200)
            .json({ status: "true", point: newPoint, user });
        }

        const newPoint: any = await PointService.getMyPoint(req, transaction);

        const ch01Chk = await Mcn.findOne({
          where: {
            mcnerId: UserId,
            code: "ch01",
          },
          transaction,
        });

        if (ch01Chk) {
          newPoint.amount = Math.floor(newPoint.amount * 0.3);
        }

        await transaction.commit();
        return res.status(200).json({ status: "true", point: newPoint });
      } catch (err) {
        await transaction.rollback();
        errorLogPost(req, err);
        return res.status(400).json({ status: "error" });
      }
    }
  );
};
