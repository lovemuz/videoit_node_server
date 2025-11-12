import axios from "axios";
import { logger } from "../../config/winston";
import {
  POINT_HISTORY,
  POINT_LIST,
  POINT_PRODUCTID,
} from "../../constant/point-constant";
import { SLACK_CHANNEL } from "../../constant/slack-constant";
import { USER_ROLE } from "../../constant/user-constant";
import {
  Earn,
  InAppRefund,
  Mcn,
  Money,
  Payment,
  Point,
  PointHistory,
  sequelize,
  User,
} from "../../models";
import PaymentService from "../../services/paymentService";
import PointService from "../../services/pointService";
import { awsSimpleEmailService } from "./aws";
import { slackPostMessage } from "./slack";

const appleReceiptVerify = require("node-apple-receipt-verify");
const { EmptyError, ServiceUnavailableError } = appleReceiptVerify;

appleReceiptVerify.config({
  secret: "temptemp", // Your shared secret from App Store Connect
  environment: ["production"], // Can be 'production' or 'sandbox'
  verbose: true, // Enables verbose logging for debugging
  extended: true, // Provides extended information for subscriptions
  ignoreExpired: false,
});

// validation handler (In this case - subscription Validation)
const validatePayment = async (req: any, res: any) => {
  const receiptData = req.body.receiptData;
  const transaction = await sequelize.transaction();
  try {
    logger.error("validatePayment");
    logger.error(`UserId:${req?.id}`);
    // Validate the receipt
    const products = await appleReceiptVerify.validate({
      receipt: receiptData,
    });
    const platform: string = req.body.platform;
    const UserId: number = req?.id;

    const user = await User.findOne({
      where: {
        id: UserId,
      },
      transaction,
    });
    let allAmount = 0;
    await Promise.all(
      products?.map(async (list: any, idx: number) => {
        let amount: number = 0;
        let increaseAmount: number = 0;
        const transactionId = list?.transactionId;
        const code = list?.productId;
        const imp_uid = transactionId;
        const payment = await Payment.findOne({
          where: {
            imp_uid,
            UserId,
          },
          transaction,
        });
        if (payment) {
          await transaction.commit();
          return res.status(200).json({ status: "false" });
        }

        if (code === POINT_PRODUCTID.PRODUCTID_4000) {
          amount = POINT_LIST.POINT_4000;
          increaseAmount = 4000;
        } else if (code === POINT_PRODUCTID.PRODUCTID_8000) {
          amount = POINT_LIST.POINT_8000;
          increaseAmount = 8000;
        } else if (code === POINT_PRODUCTID.PRODUCTID_15000) {
          amount = POINT_LIST.POINT_15000;
          increaseAmount = 15000;
        } else if (code === POINT_PRODUCTID.PRODUCTID_30000) {
          amount = POINT_LIST.POINT_30000;
          increaseAmount = 30000;
        } else if (code === POINT_PRODUCTID.PRODUCTID_60000) {
          amount = POINT_LIST.POINT_60000;
          increaseAmount = 60000;
        } else if (code === POINT_PRODUCTID.PRODUCTID_100000) {
          amount = POINT_LIST.POINT_100000;
          increaseAmount = 100000;
        } else if (code === POINT_PRODUCTID.PRODUCTID_200000) {
          amount = POINT_LIST.POINT_200000;
          increaseAmount = 200000;
        } else if (code === POINT_PRODUCTID.PRODUCTID_300000) {
          amount = POINT_LIST.POINT_300000;
          increaseAmount = 300000;
        }

        allAmount = Number(allAmount + amount);

        if (user?.phone) {
          const inAppRefund: any = await InAppRefund.findOne({
            where: {
              phone: user?.phone,
            },
            transaction,
          });
          if (inAppRefund && inAppRefund?.amount > 0) {
            let minusPointChk =
              Number(increaseAmount) - Number(inAppRefund?.amount);
            increaseAmount = Math.max(
              Number(increaseAmount - inAppRefund?.amount),
              0
            );
            //12000 5000 =7000  10000 30000 =-20000
            if (Number(minusPointChk) > 0) {
              await InAppRefund.update(
                {
                  amount: 0,
                },
                {
                  where: {
                    phone: user?.phone,
                  },
                  transaction,
                }
              );
            } else {
              await InAppRefund.decrement(
                {
                  amount: Math.floor(Math.abs(minusPointChk)),
                },
                {
                  where: {
                    phone: user?.phone,
                  },
                  transaction,
                }
              );
            }
          }
        }

        if (user?.adCode) {
          const refrerrer = await User.findOne({
            where: {
              roles: USER_ROLE.REFERRAL_USER,
              adCode: user?.adCode,
            },
            transaction,
          });
          if (refrerrer) {
            const amount2 =
              (Number(Math.round(amount)) / 1.1) *
              (0.01 * refrerrer?.adPercent);
            if (user?.adCode === "wm") {
              await axios.get(
                `https://gcltracker.com/click?cnv_id=${user?.cnv_id}&payout=${amount2}&cnv_status=sales`
              );
              //성대표님 지갑
              await Money.increment(
                {
                  amount: amount2,
                },
                {
                  where: {
                    UserId: 91000,
                  },
                  transaction,
                }
              );
            }
            await Money.increment(
              {
                amount: amount2,
              },
              {
                where: {
                  UserId: refrerrer?.id,
                },
                transaction,
              }
            );
            await Earn.create(
              {
                year: new Date().getFullYear(),
                month: new Date().getMonth() + 1,
                amount: amount2,
                donationerId: user?.id,
                donationingId: refrerrer?.id,
              },
              { transaction }
            );
          }
        }
        await PointService.increasePoint(req, increaseAmount, transaction);
        await PaymentService.createPaymentPointApp(
          req,
          amount,
          imp_uid,
          transaction
        );
      })
    );
    const point: any = await PointService.getMyPoint(req, transaction);
    const ch01Chk = await Mcn.findOne({
      where: {
        mcnerId: req?.id,
        code: "ch01",
      },
      transaction,
    });
    if (ch01Chk) {
      point.amount = Math.floor(point.amount * 0.3);
    }
    await transaction.commit();
    // awsSimpleEmailService('traveltofindlife@gmail.com', 'traveltofindlife@gmail.com', '포인트 앱 결제', `${allAmount}원 의 포인트 결제가 승인됬습니다. by ${user?.nick}`)

    slackPostMessage(
      SLACK_CHANNEL.PAYMENT_LOG,
      `포인트 앱 결제 - ${platform}
        ${allAmount}원 의 포인트 결제가 승인됬습니다.
        ${user?.nick}
        UserId:${user?.id}
        link:${user?.link}
        회원가입 날짜:${user?.createdAt?.toLocaleDateString()}

        `
    );
    // awsSimpleEmailService('traveltofindlife@gmail.com', 'kakabal@naver.com', '포인트 앱 결제', `${allAmount} 포인트 결제가 승인됬습니다. by ${user?.nick}`)
    return res.status(200).json({ status: "true", point });
  } catch (error: any) {
    await transaction.rollback();
    if (error instanceof EmptyError) {
      return res
        .status(400)
        .json({ success: false, message: "Receipt data is empty" });
    } else if (error instanceof ServiceUnavailableError) {
      return res.status(503).json({
        success: false,
        message: "Service unavailable, try again later",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "An error occurred during receipt validation",
        error: error.message,
      });
    }
  }
};

const jwt = require("jsonwebtoken");

// Webhook handler
const handleWebhook = async (req: any, res: any) => {
  const notification = req.body;
  console.log(notification, "Request Body");

  // logger.error(notification, "Request Body");
  const transaction = await sequelize.transaction();
  try {
    // incoming signedPayload is encoded by Apple
    const signedPayload = notification.signedPayload;
    // We have to decode the signed payload
    const decodedPayload = jwt.decode(signedPayload);
    // decoded signedPayload contains "notificationType" property to determine the type of event.
    const notificationType = decodedPayload.notificationType;
    // subtype is also used to determine type of event
    const subtype = decodedPayload.subtype;

    // logger.error("Notification type:", notificationType)
    logger.error("");
    logger.error("----------------------------------");
    logger.error("Notification type:", notificationType);
    logger.error("Subtype type:", subtype);
    logger.error("----------------------------------");
    logger.error("");

    if (notificationType === "REFUND") {
      // handleDidRenew(decodedPayload);
      const transactionInfo = jwt.decode(
        decodedPayload.data.signedTransactionInfo
      );
      const imp_uid = transactionInfo?.transactionId;
      const code = transactionInfo?.productId;

      const payment: any = await Payment.findOne({
        where: {
          imp_uid,
        },
        transaction,
      });

      if (payment) {
        const user = await User.findOne({
          where: {
            id: payment?.UserId,
          },
          transaction,
        });
        let amount: number = 0;
        let decreaseAmount: number = 0;

        if (code === POINT_PRODUCTID.PRODUCTID_4000) {
          amount = POINT_LIST.POINT_4000;
          decreaseAmount = 4000;
        } else if (code === POINT_PRODUCTID.PRODUCTID_8000) {
          amount = POINT_LIST.POINT_8000;
          decreaseAmount = 8000;
        } else if (code === POINT_PRODUCTID.PRODUCTID_15000) {
          amount = POINT_LIST.POINT_15000;
          decreaseAmount = 15000;
        } else if (code === POINT_PRODUCTID.PRODUCTID_30000) {
          amount = POINT_LIST.POINT_30000;
          decreaseAmount = 30000;
        } else if (code === POINT_PRODUCTID.PRODUCTID_60000) {
          amount = POINT_LIST.POINT_60000;
          decreaseAmount = 60000;
        } else if (code === POINT_PRODUCTID.PRODUCTID_100000) {
          amount = POINT_LIST.POINT_100000;
          decreaseAmount = 100000;
        } else if (code === POINT_PRODUCTID.PRODUCTID_200000) {
          amount = POINT_LIST.POINT_200000;
          decreaseAmount = 200000;
        } else if (code === POINT_PRODUCTID.PRODUCTID_300000) {
          amount = POINT_LIST.POINT_300000;
          decreaseAmount = 300000;
        }

        const pointBefore: any = await Point.findOne({
          where: {
            UserId: user?.id,
          },
          transaction,
        });

        let minusPointChk =
          Number(pointBefore?.amount) - Number(decreaseAmount);
        decreaseAmount = Math.min(pointBefore?.amount, decreaseAmount);

        if (minusPointChk < 0 && user?.phone) {
          //차액금액 만큼 돈을빼고
          const inAppRefund = await InAppRefund.findOne({
            where: {
              phone: user?.phone,
            },
            transaction,
          });
          if (inAppRefund) {
            await InAppRefund.increment(
              {
                amount: Math.floor(Math.abs(minusPointChk)),
              },
              {
                where: {
                  phone: user?.phone,
                },
                transaction,
              }
            );
          } else {
            await InAppRefund.create(
              {
                phone: user?.phone,
                platform: payment?.platform,
                amount: Math.floor(Math.abs(minusPointChk)),
              },
              { transaction }
            );
          }
        }
        await Point.decrement(
          {
            amount: decreaseAmount,
          },
          {
            where: {
              UserId: user?.id,
            },
            transaction,
          }
        );
        await PointHistory.create(
          {
            type: POINT_HISTORY.TYPE_PAYMENT,
            amount: decreaseAmount,
            plusOrMinus: POINT_HISTORY.MINUS,
            UserId: user?.id,
          },
          { transaction }
        );

        const pointAfter = await Point.findOne({
          where: {
            UserId: user?.id,
          },
          transaction,
        });

        await Payment.destroy({
          where: {
            imp_uid,
          },
          transaction,
        });
        slackPostMessage(
          SLACK_CHANNEL.REFUND,
          `포인트 앱 환불 - ${payment?.platform}
            ${amount}원 의 포인트 결제가 환불되었습니다.
            기존 포인트 ${pointBefore?.amount} -> 변경후 포인트 ${
            pointAfter?.amount
          } 
            ${user?.nick}
            핸드폰 번호:${user?.phone}
            UserId:${user?.id}
            link:${user?.link}
            회원가입 날짜:${user?.createdAt?.toLocaleDateString()}
    
            `
        );
      }
    } /*else if(notificationType ==='ONE_TIME_CHARGE') {
        }*/ else {
      logger.error("Unknown notification type:", notificationType);
      console.error("Unknown notification type:", notificationType);
    }
    await transaction.commit();
    res.status(200).send("Notification received and processed successfully");
  } catch (error) {
    await transaction.rollback();
    console.error("Error processing notification:", error);
    res.status(500).send("Error processing notification");
  }
};

module.exports = {
  handleWebhook,
  validatePayment,
};
