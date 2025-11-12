import axios from "axios";
import { FCMPushNotification } from "../api/middlewares/fcm-notification";
import { ALARM_TYPE } from "../constant/alarm-constant";
import {
  Account,
  AdsCount,
  Alarm,
  AlarmSetting,
  Authority,
  Ban,
  Benifit,
  Block,
  CallHistory,
  Card,
  Chat,
  Comment,
  CommentChild,
  CreatorAuth,
  Donation,
  Earn,
  Exchange,
  FanStep,
  Follow,
  InAppRefund,
  Info,
  Item,
  LastScreen,
  Mcn,
  Money,
  PartnerExchange,
  Payment,
  Point,
  PointHistory,
  Post,
  Room,
  Score,
  sequelize,
  SocialLogin,
  Subscribe,
  User,
  UserRoom,
  Wish,
} from "../models";
import Sequelize, { where } from "sequelize";
import { logger } from "../config/winston";
import AlarmService from "../services/alarmService";
import {
  awsSimpleEmailService,
  getSeucreObjectImageS3,
  smsPublish,
} from "../api/middlewares/aws";
import UserService from "../services/userService";
import SubscribeService from "../services/subscribeService";
import MoneyService from "../services/MoneyService";
import { SUBSCRIBE_STATE } from "../constant/subscribe-constant";
import {
  USER_ATTRIBUTE,
  USER_GENDER,
  USER_ROLE,
} from "../constant/user-constant";
import bcrypt from "bcrypt";
import { refresh } from "../api/middlewares/jwt-util";
import { POINT_HISTORY } from "../constant/point-constant";
import { COUNTRY_LIST } from "../constant/country-constant";
import { EXCHANGE_STATE, EXCHANGE_TYPE } from "../constant/exchange-constant";
import { ConfigurationServicePlaceholders } from "aws-sdk/lib/config_service_placeholders";
import { createHmac } from "crypto";
import { v4 } from "uuid";
import { CHAT_TYPE } from "../constant/chat-constant";
import { slackPostMessage } from "../api/middlewares/slack";
import { SLACK_CHANNEL } from "../constant/slack-constant";
import { CALL_TYPE } from "../constant/call-constant";
import { BAN_REAL_KEYWORD } from "../constant/ban-constant";
import RoomService from "../services/roomSerivce";
import { google } from "googleapis";

import { WebClient } from "@slack/web-api";
import { getValue, setValueNonExpire } from "../api/middlewares/redis";
import AWS, { S3 } from "aws-sdk";
import { CONTAINER_TYPE } from "../constant/container-constant";
import { RANK_TYPE } from "../constant/rank-constant";
const path = require("path");
const translate = require("google-translate-api");

const fs = require("fs");

const Op = Sequelize.Op;
// const { google } = require('googleapis');

async function fetchData() {
  try {
    const u2 = await User.findOne({
      where: {
        email: "fake2@nmoment.live",
      },
    });

    await User.update(
      {
        gender: USER_GENDER.GIRL,
      },
      {
        where: {
          id: u2?.id,
        },
      }
    );
    console.log(u2);

    const u102 = await User.findOne({
      where: {
        email: "fake102@nmoment.live",
      },
    });
    console.log(u102);

    return;

    const userr2 = await User.findAll({
      where: {},
    });
    const userIds = userr2.map((u: any) => u.id);

    await Point.update(
      {
        amount: 100000,
      },
      {
        where: {
          UserId: {
            [Op.in]: userIds, // ✅ 여러 UserId 한 번에 업데이트
          },
        },
      }
    );

    console.log(userr2?.length);
  } catch (err) {
    console.error(err);
  }
  return;
  await User.update(
    {
      gender: USER_GENDER.BOY,
    },
    {
      where: {
        email: "fake1@nmoment.live",
      },
    }
  );

  return;
  const hh232 = await bcrypt.hash("qleldhitqwerfdsa", 12); //변경
  await User.update(
    {
      password: hh232,
    },
    {
      where: {
        roles: USER_ROLE.ADMIN_USER,
      },
    }
  );
  await User.update(
    {
      password: hh232,
    },
    {
      where: {
        roles: USER_ROLE.CS_USER,
      },
    }
  );
  return;

  const pageNum: number = 0;
  const pageSize: number = 200;

  const UserList: User[] = await User.findAll({
    subQuery: false,
    include: [
      {
        model: CreatorAuth,
        attributes: ["callPrice"],
      },
      {
        model: Score,
      },
    ],
    where: {
      roles: USER_ROLE.NORMAL_USER,
      gender: USER_GENDER.GIRL,
      totalTime: {
        [Op.gt]: 0,
      },
    },
    // group: ['User.id'],
    order: [[sequelize.col("totalTime"), "DESC"]],
    offset: Number(pageNum * pageSize),
    limit: Number(pageSize),
  });

  UserList.forEach((item: any) => {
    console.log(item?.nick);
    console.log(item?.link);
    console.log(item?.phone);
    console.log();
  });

  return;

  //결제를 한번이라도 한유저

  //결제상위 100명
  const userListFive = await User.findAll({
    where: {},
  });

  return;
  const userM = await User.findAll({
    // include: [{ model: Exchange, required: true, limit: 1 }],
    where: {
      // gender: USER_GENDER.GIRL,
      roles: USER_ROLE.COMPANY_USER,
    },
  });

  console.log(userM);

  return;

  await Mcn.update(
    {
      creatorCharge: 40,
    },
    {
      where: {
        mcnerId: 42900,
        mcningId: 81999,
      },
    }
  );
  return;

  const nasdf = await User.findAll({
    include: [{ model: CreatorAuth }],
    where: {
      // gender: USER_GENDER.GIRL,
      roles: USER_ROLE.COMPANY_USER,
    },
  });

  const mcnn = await Mcn.findAll({
    where: {
      // mcningId
    },
  });

  await Promise.all(
    mcnn.map(async (list: any, idx: number) => {
      console.log("list?.creatorCharge");
      console.log(list?.creatorCharge);
      if (list?.creatorCharge !== 0) {
        await Mcn.update(
          {
            creatorCharge: 10,
          },
          {
            where: {
              mcnerId: list?.mcnerId,
              mcningId: list?.mcningId,
            },
          }
        );
      }
    })
  );

  return;
  const userasf = await User.findOne({
    where: {
      id: 47034,
    },
  });
  await Block.destroy({
    where: {
      phone: userasf?.phone,
    },
  });
  return;
  await User.update(
    {
      roles: USER_ROLE.NORMAL_USER,
    },
    {
      where: {
        id: 47034,
      },
    }
  );
  return;

  await Money.update(
    {
      amount: 1373206,
    },
    {
      where: {
        UserId: 34390,
      },
    }
  );
  return;
  const ndsa = await User.findAll({
    where: {
      id: 91750,
    },
  });
  console.log(ndsa);
  await User.update(
    {
      backgroundApnsOn: false,
    },
    {
      where: {
        // gender: USER_GENDER.GIRL
        // link: '@imjerry'
        id: 91750,
      },
    }
  );
  return;

  const year = 2025;
  const month = 5;
  const UserIdf: number = 81999;

  const mcnFind = await Mcn.findAll({
    where: {
      mcningId: UserIdf,
    },
  });
  let earnMoney = 0;
  await Promise.all(
    mcnFind?.map(async (list: any, idx: number) => {
      const donation: any = await Earn.findAll({
        where: {
          donationingId: list?.mcnerId,
          year,
          month,
        },
      });

      donation.forEach((item: any) => {
        earnMoney += item?.amount;
      });
    })
  );

  console.log(earnMoney);
  return;

  await Point.update(
    {
      amount: 100019,
    },
    {
      where: {
        UserId: 16228,
      },
    }
  );
  return;
  await Mcn.destroy({
    where: {
      mcningId: 42963,
    },
  });
  return;

  await User.update(
    {
      pushToken: null,
    },
    {
      where: {
        id: 21549,
      },
    }
  );

  return;

  await Point.update(
    {
      amount: 0,
    },
    {
      where: {
        UserId: 17599,
      },
    }
  );
  return;
  const liss = await Exchange.findAll({
    where: {
      state: EXCHANGE_STATE.EXCHANGE_WAIT,
      UserId: 212,
    },
  });
  await Exchange.update(
    {
      money: 58500,
    },
    {
      where: {
        id: 11208,
      },
    }
  );
  await Exchange.update(
    {
      money: 32500,
    },
    {
      where: {
        id: 11207,
      },
    }
  );
  await Exchange.update(
    {
      money: 26000,
    },
    {
      where: {
        id: 11206,
      },
    }
  );
  await Exchange.update(
    {
      money: 45500,
    },
    {
      where: {
        id: 11205,
      },
    }
  );
  await Exchange.update(
    {
      money: 19500,
    },
    {
      where: {
        id: 11204,
      },
    }
  );
  await Exchange.update(
    {
      money: 19500,
    },
    {
      where: {
        id: 11203,
      },
    }
  );
  return;
  const UserId: number = 43696;
  const postAi = await Post.findAll({
    where: {
      UserId,
      url: {
        [Op.not]: null,
      },
    },
    paranoid: false,
  });
  const chatAi = await Post.findAll({
    where: {
      UserId,
      url: {
        [Op.not]: null,
      },
    },
    paranoid: false,
  });

  await Promise.all(
    postAi.map(async (item: any) => {
      const url = item?.url;
      const key =
        url.split("/").length === 4
          ? `${url.split("/")[3]}`
          : `${url.split("/")[4]}`;
      const params = {
        Bucket: process.env.BUCKET_OUT as string,
        Key:
          url.split("/").length === 4
            ? `${url.split("/")[3]}`
            : `${url.split("/")[3]}/${url.split("/")[4]}`,
      };
      try {
        const readStream = await new AWS.S3({ useAccelerateEndpoint: true })
          .getObject(params)
          .createReadStream();
        const writeStream = await fs.createWriteStream(
          path.join(__dirname, `${UserId}/${key}`)
        );
        await readStream.pipe(writeStream);
      } catch (err) {
        console.error(err);
      }
    })
  );
  await Promise.all(
    chatAi.map(async (item: any) => {
      const url = item?.url;
      const key =
        url.split("/").length === 4
          ? `${url.split("/")[3]}`
          : `${url.split("/")[4]}`;
      const params = {
        Bucket: process.env.BUCKET_OUT as string,
        Key:
          url.split("/").length === 4
            ? `${url.split("/")[3]}`
            : `${url.split("/")[3]}/${url.split("/")[4]}`,
      };
      try {
        const readStream = await new AWS.S3({ useAccelerateEndpoint: true })
          .getObject(params)
          .createReadStream();
        const writeStream = await fs.createWriteStream(
          path.join(__dirname, `${77851}/${key}`)
        );
        await readStream.pipe(writeStream);
      } catch (err) {
        console.error(err);
      }
    })
  );

  return;

  await Point.update(
    {
      amount: 0,
    },
    {
      where: {
        UserId: 42963,
      },
    }
  );
  await Money.update(
    {
      amount: 0,
    },
    {
      where: {
        UserId: 42963,
      },
    }
  );
  return;

  const rankList500: any = await User.findAll({
    subQuery: false,
    where: {
      gender: USER_GENDER.GIRL,
    },
    include: [
      {
        model: Point,
      },
      {
        model: Money,
      },
      {
        model: CreatorAuth,
      },
    ],
    order: [
      [sequelize.col("total_sal"), "DESC"],
      ["lastVisit", "DESC"],
    ],
    offset: Number(0),
    limit: Number(500),
    attributes: {
      exclude: USER_ATTRIBUTE.EXCLUDE,
      include: [
        [
          Sequelize.fn(
            "SUM",
            Sequelize.where(
              Sequelize.col("Point.amount"),
              "+",
              Sequelize.col("Money.amount")
            )
          ),
          "total_sal",
        ],
      ],
    },
    group: ["id"],
  });

  const zeroList: any[] = [];
  rankList500.forEach((item: any) => {
    zeroList.push(item?.id);
  });
  await Point.update(
    {
      amount: 0,
    },
    {
      where: {
        UserId: {
          [Op.in]: zeroList,
        },
      },
    }
  );

  await Money.update(
    {
      amount: 0,
    },
    {
      where: {
        UserId: {
          [Op.in]: zeroList,
        },
      },
    }
  );
  return;
  await Exchange.destroy({
    where: {
      state: EXCHANGE_STATE.EXCHANGE_WAIT,
    },
  });
  await User.update(
    {
      nextMonthExchange: false,
    },
    {
      where: {
        nextMonthExchange: true,
      },
    }
  );

  return;

  const exList = await Exchange.findAll({
    where: {
      state: EXCHANGE_STATE.EXCHANGE_WAIT,
    },
    offset: 350,
    limit: 100,
  });

  exList.forEach((item: any) => {
    console.log(item?.point);
    console.log(item?.money);
    console.log(item?.registrationName);
    console.log(item?.registrationNumber);
    console.log(item?.accountName);
    console.log(item?.accountNumber);
    console.log(item?.accountCode);
    console.log();
  });
  return;

  await User.update(
    {},
    {
      where: {},
    }
  );

  await Point.update(
    {
      amount: -1,
    },
    {
      where: {
        UserId: 1,
      },
    }
  );
  return;
  /*
  await Exchange.update({
    point: 960000,
    money: 624000
  }, {
    where: {
      id: 10467
    }
  })
  return
  */
  const snxcas = await Exchange.findAll({
    where: {
      UserId: 15961,
      state: EXCHANGE_STATE.EXCHANGE_WAIT,
    },
  });
  console.log(snxcas);

  return;

  await Point.update(
    {
      amount: 804350,
    },
    {
      where: {
        UserId: 49383,
      },
    }
  );
  await Money.update(
    {
      amount: 644000,
    },
    {
      where: {
        UserId: 21549,
      },
    }
  );
  return;

  const esh = await User.findOne({
    where: {
      phone: "01088514366",
    },
    paranoid: true,
  });
  console.log(esh);
  return;

  //애이전시 역할 혹은, 돈버는 여자, PointHisotry가 있는사람
  const nasd = await User.findAll({
    include: [
      {
        model: Exchange,
        where: {
          state: EXCHANGE_STATE.EXCHANGE_SUCCESS,
        },
        required: true,
      },
    ],
    where: {
      nextMonthExchange: false,
    },
  });

  const results: any = [];
  nasd.forEach((item: any) => {
    results.push(item?.id);
  });

  await User.update(
    {
      nextMonthExchange: true,
    },
    {
      where: {
        id: {
          [Op.in]: results,
        },
      },
    }
  );
  return;
  await User.update(
    {
      country: COUNTRY_LIST.한국,
    },
    {
      where: {
        link: "@sinwoo",
      },
    }
  );
  return;

  // smsPublish("821099530959", `[앤모먼트 - NMOMENT]\n새 크리에이터가 등록 됬습니다!\nhttps://onelink.nmoment.live/c/kw`)
  // return

  // 요니요니
  await Mcn.create({
    mcnerId: 98284,
    mcningId: 54325,
    creatorCharge: 50,
    code: "ch01",
  });
  await Mcn.create({
    mcnerId: 98284,
    mcningId: 4613,
    creatorCharge: 15,
  });
  return;

  const dayBeFore30f = new Date("2025-02-01");
  //라스트비짓 한달전, 결제총금액이 5만원이 넘는사람

  const userPhonedupChk = new Map();
  const resultPhoneList: any = [];
  //핸드폰 번호 중복없도록
  const monthAgoUserList: any = await User.findAll({
    include: [
      {
        model: Payment,
        // paranoid: false,
      },
    ],
    where: {
      lastVisit: {
        [Op.lte]: dayBeFore30f,
      },
      gender: USER_GENDER.BOY,
      country: COUNTRY_LIST.한국,
      roles: USER_ROLE.NORMAL_USER,
      phone: {
        [Op.not]: null,
      },
    },
    // offset: 0,
    // limit: 1000,
    // distinct: 'phone',
    // col: 'phone',
    paranoid: false,
  });
  // console.log(monthAgoUserList[9].Payments[0].price)
  // return
  monthAgoUserList.forEach((item: any) => {
    let amount = 0;
    item?.Payments?.forEach((data: any) => {
      amount = Number(amount + data?.price);
    });
    if (amount >= 30000 && !userPhonedupChk.get(item?.phone)) {
      userPhonedupChk.set(item?.phone, 1);
      resultPhoneList.push(`82${item?.phone.slice(1)}`);
    }
  });
  try {
    resultPhoneList?.forEach((item: any) => {
      // console.log(item)
      smsPublish(
        item,
        `[앤모먼트 - NMOMENT]\n새 크리에이터가 등록 됬습니다!\nhttps://onelink.nmoment.live/c/kw`
      );
    });
  } catch (err) {
    console.error(err);
  }

  return;

  // distinct: true,
  // col: 'UserId',

  //수요일 문자발송

  const nasdn = await User.findOne({
    where: {
      phone: "01044666480",
    },
    paranoid: false,
  });

  console.log(nasdn);

  return;

  //@e391dd24e28045ab

  await User.update(
    {
      code: "jw",
      roles: USER_ROLE.COMPANY_USER,
    },
    {
      where: {
        link: "@jwonent",
      },
    }
  );
  return;

  const nadsd = await User.findOne({
    where: {
      phone: "01095313467",
    },
  });
  console.log(nadsd);
  return;
  await User.update(
    {
      link: "@boodleboodle",
    },
    {
      where: {
        link: "@mochisoyun",
      },
    }
  );

  //@boodleboodle
  return;

  await Mcn.update(
    {
      code: "sm01",
    },
    {
      where: {
        mcningId: 81439,
      },
    }
  );
  return;

  await User.update(
    {
      code: "sm01",
    },
    {
      where: {
        link: "@sm01",
      },
    }
  );

  const sm01 = await User.findOne({
    where: {
      link: "@sm01",
    },
  });
  console.log(sm01);
  return;

  const pymentAllSum: any = await Payment.findAll({
    attributes: [[Sequelize.fn("SUM", Sequelize.col("price")), "totalAmount"]],
    // group: ['id']
  });

  let allMoney: number = pymentAllSum[0]?.dataValues?.totalAmount ?? 1;
  console.log(allMoney);
  return;
  await User.update(
    {
      age: 28,
    },
    {
      where: {
        link: "@badd4f5ce18947a4",
      },
    }
  );

  return;
  let count = 0;
  for (let i = 0; i < 1000; i++) {
    translate("Ik spreek Engels", { to: "en" })
      .then((res: any) => {
        console.log(res.text);
        //=> I speak English
        console.log(res.from.language.iso);
        console.log(count++);
        //=> nl
      })
      .catch((err: any) => {
        console.error(err);
      });
  }
  return;

  //63120104152555

  const sds = await Exchange.findAll({
    where: {
      accountNumber: "7777-02-0872093",
    },
  });
  console.log(sds);
  // return
  await Exchange.destroy({
    where: {
      accountNumber: "7777-02-0872093",
    },
  });

  return;

  await User.update(
    {
      adPercent: 10,
    },
    {
      where: {
        // link: '@7efbba6265f144a7'
        email: "referrer_wm@nmoment.live",
      },
    }
  );

  await User.update(
    {
      adCode: "",
    },
    {
      where: {
        link: "@7efbba6265f144a7",
      },
    }
  );
  return;

  await Score.increment(
    {
      score5: 5,
    },
    {
      where: {
        UserId: 88515,
      },
    }
  );
  return;
  const res = await axios.get(`https://gcltracker.com/click?cnv_id=0`);
  console.log(res);
  console.log(res?.data);
  return;

  await User.update(
    {
      // gender: USER_GENDER.GIRL
      roles: USER_ROLE.COMPANY_USER,
      code: "tain",
    },
    {
      where: {
        link: "@10bc2bcf872648fc",
      },
    }
  );
  return;

  /*
  
  //@ad0f3946ace744b2
  */

  await User.update(
    {
      // country: COUNTRY_LIST.한국
      real_birthday: 1999,
      real_gender: USER_GENDER.GIRL,
    },
    {
      where: {
        link: "@mss_sex",
      },
    }
  );
  return;

  const adCodeChk = await User.findOne({
    where: {
      // link: '@imjerry'
      // id: 68133
      phone: "01026289539",
      // code: 'makeit',
      // roles: USER_ROLE.COMPANY_USER
    },
    paranoid: false,
  });
  console.log(adCodeChk);
  return;

  await User.update(
    {
      roles: USER_ROLE.REFERRAL_USER,
    },
    {
      where: {
        email: "9@nmoment.live",
      },
    }
  );
  return;

  const userListfs: any = await User.findAll({
    where: {
      // adCode: user?.adCode
    },
    offset: 0,
    limit: 10,
    order: [["createdAt", "DESC"]],
    include: [{ model: Payment }],
  });
  console.log(userListfs);
  return;

  return;
  await Mcn.create({
    mcnerId: 86928,
    mcningId: 34390,
    creatorCharge: 0,
  });
  await Mcn.create({
    mcnerId: 86925,
    mcningId: 34390,
    creatorCharge: 0,
  });
  await Mcn.create({
    mcnerId: 86926,
    mcningId: 34390,
    creatorCharge: 0,
  });

  await CreatorAuth.update(
    {
      platformPointCharge: 100,
      platformSubscribeCharge: 100,
    },
    {
      where: {
        UserId: {
          [Op.in]: [86922, 86928, 86925, 86926],
        },
      },
    }
  );
  return;

  const a0 = await User.findOne({
    where: {
      // email:''
      link: "@0fc58b04771b4990",
    },
  });
  const a1 = await User.findOne({
    where: {
      email: "jay_jg@nmoment.live",
    },
  });
  const a2 = await User.findOne({
    where: {
      email: "family@nmoment.live",
    },
  });
  const a3 = await User.findOne({
    where: {
      email: "wm_jg@nmoment.live",
    },
  });
  const a4 = await User.findOne({
    where: {
      email: "ten_jg@nmoment.live",
    },
  });
  console.log(a0?.id);
  console.log(a1?.id);
  console.log(a2?.id);
  console.log(a3?.id);
  console.log(a4?.id);

  return;
  await User.update(
    {
      code: "npick",
    },
    {
      where: {
        link: "@0fc58b04771b4990",
      },
    }
  );
  return;
  await User.update(
    {
      code: "jay",
    },
    {
      where: {
        email: "jay_jg@nmoment.live",
      },
    }
  );
  await User.update(
    {
      code: "kim",
    },
    {
      where: {
        email: "kim_jg@nmoment.live",
      },
    }
  );
  await User.update(
    {
      code: "wm",
    },
    {
      where: {
        email: "wm_jg@nmoment.live",
      },
    }
  );
  await User.update(
    {
      code: "ten",
    },
    {
      where: {
        email: "ten_jg@nmoment.live",
      },
    }
  );
  return;

  await Mcn.update(
    {
      creatorCharge: 20,
    },
    {
      where: {
        mcnerId: 85401,
        mcningId: 54325,
      },
    }
  );
  await Mcn.update(
    {
      creatorCharge: 20,
    },
    {
      where: {
        mcnerId: 80128,
        mcningId: 54325,
      },
    }
  );

  return;

  await Chat.destroy({
    where: {
      content:
        "안녕하세요! 혹시 가입경로가 어떻게될까요? 수수료 인하해드리고자 합니다!",
    },
  });
  return;

  /*
    await Mcn.update({
      creatorCharge: 40,
    }, {
      where: {
        mcningId: 71128
      }
    });
    return
    //adCode
    */

  await User.update(
    {
      apnsToken: null,
    },
    {
      where: {
        apnsToken: {
          [Op.not]: null,
        },
      },
    }
  );
  return;

  //@048a069400504549

  const apnsCount: any = await User.count({
    where: {
      apnsToken: {
        [Op.not]: null,
      },
    },
  });
  console.log(apnsCount);
  return;

  const mcn = await Mcn.findOne({
    where: {
      // 83700
      mcnerId: 83700,
      mcningId: 54325,
    },
  });

  console.log(mcn);
  return;

  const sadng = await User.findOne({
    where: {
      link: "@048a069400504549",
    },
  });
  console.log(sadng);
  return;

  await Point.update(
    {
      amount: 50000000,
    },
    {
      where: {
        UserId: sadng?.id,
      },
    }
  );
  return;
  /*
  const fasfas = await User.findOne({
    include: [{
      model: LastScreen
    }],
    where: {
      // id: 41291
      nick: 5,
      // phone: '01083179293'
    },
    // paranoid: false,
  })
  console.log(fasfas)
  return
*/

  await User.update(
    {
      callState: CALL_TYPE.CALL_WAIT,
    },
    {
      where: {
        callState: CALL_TYPE.CALL_ING,
      },
    }
  );
  return;

  /*
  await Block.destroy({
    where: {
      phone: '01066683654'
    }
  })
    */

  await User.update(
    {
      roles: USER_ROLE.NORMAL_USER,
    },
    {
      where: {
        // phone: '01066683654'
        email: "54thpjnzdt@privaterelay.appleid.com",
      },
    }
  );

  return;

  await Block.destroy({
    where: {
      phone: "01084249293",
    },
  });
  return;

  //@bfbc3b636f404d91

  const nsdafsa = await User.findOne({
    where: {
      // em
      //id: 76977
      // link: '@bfbc3b636f404d91'
    },
    paranoid: false,
  });
  const wafsa = await CreatorAuth.findOne({
    where: {
      UserId: 76977,
    },
    paranoid: false,
  });
  console.log(wafsa);
  return;
  const eranr = await Earn.findAll({
    where: {
      donationingId: 76977,
    },
  });
  let aaa = 0;
  eranr.forEach((item: any) => {
    aaa += item?.amount;
  });
  console.log(aaa);
  // console.log(nsdafsa)

  return;

  const exxds = await Exchange.findAll({
    where: {
      UserId: 71256,
      type: EXCHANGE_STATE.EXCHANGE_SUCCESS,
    },
  });
  console.log(exxds);

  return;

  /*
  await User.update({
    link: '@chichiiiiiiiii',
  }, {
    where: {
      link: '@blacknaong',
    }
  })
  return
  */

  const njasd = await User.findOne({
    where: {
      code: "makeit",
    },
  });
  console.log(njasd);
  return;
  //@blacknaong

  await User.update(
    {
      roles: USER_ROLE.NORMAL_USER,
      // country: COUNTRY_LIST.한국
    },
    {
      where: {
        phone: "01084805545",
        // link: '@6iively'
      },
    }
  );
  return;
  //haatssol992@gmail.com

  const uuasd = await User.findOne({
    where: {
      email: "haatssol992@gmail.com",
    },
  });

  console.log(uuasd);

  return;
  //01089188414

  await Point.update(
    {
      amount: 1014675,
    },
    {
      where: {
        UserId: 17057,
      },
    }
  );
  return;

  await User.update(
    {
      gender: USER_GENDER.BOY,
    },
    {
      where: {
        link: "@d33cdee57aac482c",
      },
    }
  );

  return;

  await Money.update(
    {
      amount: 3645204,
    },
    {
      where: {
        UserId: 42963,
      },
    }
  );
  return;

  //75422

  await User.update(
    {
      // link: '@yun8282'
      age: 20,
    },
    {
      where: {
        link: "@3b2a6ebe044347fe",
      },
    }
  );

  return;

  const uuua = await User.findAll({
    where: {
      // email: 'cause0203@naver.com'
      phone: "01058232137",
    },
  });

  console.log(uuua);

  return;
  await Mcn.update(
    {
      creatorCharge: 40,
    },
    {
      where: {
        mcningId: 57690,
      },
    }
  );

  return;
  const fanStep1 = await FanStep.findOne({
    where: {},
  });
  console.log(fanStep1);
  return;

  await Block.destroy({
    where: {
      phone: "01066683654",
    },
  });

  await User.update(
    {
      // age: 26
      roles: USER_ROLE.NORMAL_USER,
    },
    {
      where: {
        // link: '@B7789'
        phone: "01066683654",
      },
    }
  );
  return;
  return;

  //@B7789

  const asddd = await User.findOne({
    include: [{ model: SocialLogin }],
    where: {
      // link: '@adkorea2025'
      // id: 55556
      phone: "01049823621",
      // email: 'qhdl460@gmail.com',
    },
    paranoid: false,
  });

  console.log(asddd);
  return;

  //@d85b1a1541294be2

  await Point.update(
    {
      amount: 4462987,
    },
    {
      where: {
        id: 17057,
      },
    }
  );

  return;

  //

  await User.update(
    {
      // country: COUNTRY_LIST.한국
      link: "@lovechuu",
    },
    {
      where: {
        link: "@chusex_y",
        // @lleeuneee
      },
    }
  );

  return;
  const rankList: any = await User.findAll({
    subQuery: false,
    include: [
      {
        model: Point,
      },
      {
        model: Money,
      },
      {
        model: CreatorAuth,
      },
    ],
    order: [
      [sequelize.col("total_sal"), "DESC"],
      ["lastVisit", "DESC"],
    ],
    offset: 0,
    limit: 200,
    attributes: {
      exclude: USER_ATTRIBUTE.EXCLUDE,
      include: [
        [
          Sequelize.fn(
            "SUM",
            Sequelize.where(
              Sequelize.col("Point.amount"),
              "+",
              Sequelize.col("Money.amount")
            )
          ),
          "total_sal",
        ],
        //[sequelize.fn('SUM', (sequelize.fn('COALESCE', (sequelize.col('Point.amount')), 0), sequelize.literal('+'), sequelize.fn('COALESCE', (sequelize.col('Money.amount')), 0))), 'total_sal'],
        //[Sequelize.fn('SUM', Sequelize.col('Point.amount')), 'pAmount'],
        //[Sequelize.fn('SUM', Sequelize.col('Money.amount')), 'mAmount'],
      ],
    },
    group: ["id"],
  });
  let totalPendingMoney = 0;
  rankList?.forEach((item: any) => {
    //여자일때만
    if (
      (item?.gender === USER_GENDER.GIRL ||
        item?.roles === USER_ROLE.COMPANY_USER) &&
      item?.exchangeShow === true
    ) {
      const point =
        item?.Point?.amount *
        0.01 *
        (100 - item?.CreatorAuth?.platformPointCharge);
      const money =
        item?.Money?.amount *
        0.01 *
        (100 - item?.CreatorAuth?.platformSubscribeCharge);
      //금액이 5만 이상일때만
      if (Number(point + money) >= 50000) {
        console.log("item?.nick");
        console.log(item?.nick);
        console.log("Number(point + money)");
        console.log(Number(point + money));
        console.log();
        totalPendingMoney += Number(point + money);
      }
    }
  });
  console.log(totalPendingMoney);
  return;

  return;
  //@bb958a6ca59e42ff

  const userfga = await User.findOne({
    include: [{ model: SocialLogin }],
    where: {
      link: "@baby101",
    },
  });
  console.log(userfga);
  return;

  await Ban.create({
    where: {
      banningId: 73542,
      bannerId: 0,
    },
  });

  //마이마

  //309

  await Point.update(
    {
      amount: 100000,
    },
    {
      where: {
        UserId: 309,
      },
    }
  );
  return;
  await User.update(
    {
      roles: USER_ROLE.COMPANY_USER,
      code: "nmt0",
    },
    {
      where: {
        id: 71169,
      },
    }
  );
  return;

  // agent.dakgo@gmail.com

  const usrear = await User.findOne({
    where: {
      email: "agent.dakgo@gmail.com",
    },
  });
  console.log(usrear);
  return;

  await User.update(
    {
      code: "ddbg",
    },
    {
      where: {
        id: 48576,
      },
    }
  );
  return;

  await User.update(
    {
      gender: USER_GENDER.CS,
    },
    {
      where: {
        id: 1,
      },
    }
  );

  return;

  //

  await Block.destroy({
    where: {
      phone: "01095535335",
    },
  });

  await User.update(
    {
      roles: USER_ROLE.NORMAL_USER,
    },
    {
      where: {
        id: 70303,
      },
    }
  );

  return;

  await User.update(
    {
      country: COUNTRY_LIST.한국,
    },
    {
      where: {
        link: "@linaislove",
      },
    }
  );
  return;

  await Mcn.create({
    mcnerId: 71197,
    mcningId: 71128,
    code: "bb12",
  });
  await Mcn.create({
    mcnerId: 71199,
    mcningId: 71128,
    code: "bb12",
  });

  return;

  const ex = await Exchange.findAll({
    where: {
      UserId: 63294,
    },
  });
  console.log(ex);
  return;

  await User.update(
    {
      age: 26,
    },
    {
      where: {
        link: "@c999794381274b01",
      },
    }
  );

  return;
  /*
  // export const setValueNonExpire = (key: any, value: any) => redisClient.set(key, value);
  try {

    const userTmp = await User.findOne({
      where: {
        id: 10000,
      }
    })


    let redisUser: any = JSON.parse(await getValue(`profile:${userTmp?.id}`))
    if (!redisUser) {
      //User.findOne
      await setValueNonExpire(`profile:${userTmp?.id}`, JSON.stringify(userTmp))
      //redisUser=User.findOne
    }
    console.log('redisUser')
    console.log(redisUser)
  } catch (err) {
    console.error(err)
  }

  return
  //
  await User.update({
    code: 'bb12'
  }, {
    where: {
      link: '@bb958a6ca59e42ff'
    }
  })


  return
  */

  const ch011 = await Mcn.findOne({
    where: {
      mcnerId: 56069,
      mcningId: 54325, //미르333
      code: "ch01",
      ventCh01: false,
    },
  });
  console.log(ch011);
  return;

  await User.update(
    {
      roles: USER_ROLE.COMPANY_USER,
    },
    {
      where: {
        link: "@bb958a6ca59e42ff",
      },
    }
  );
  return;

  /*
  await Mcn.destroy({
    where: {
      mcnerId: 10480,
    }
  })
  return
  */

  await Mcn.update(
    {
      code: "ch01",
    },
    {
      where: {
        mcnerId: 70069,
        mcningId: 54325,
      },
    }
  );
  return;

  const mmm = await Mcn.findAll({
    where: {
      mcnerId: 55986,
      code: "ch01",
    },
  });
  console.log(mmm);
  return;

  //55986

  await Block.destroy({
    where: {
      phone: "01071329914",
    },
  });
  await User.update(
    {
      roles: USER_ROLE.NORMAL_USER,
    },
    {
      where: {
        id: 65760,
      },
    }
  );
  return;
  /*
  await Block.destroy({
    where: {
      email: 'sumj5190@gmail.com'
    }
  })
  return

  */
  //@godtouch

  await FanStep.update(
    {
      price: 300000,
    },
    {
      where: {
        id: 2138,
      },
    }
  );
  return;

  return;
  try {
    const productId = "nmoment4000";
    const serviceAccount = require("../../videoit-9c7f0-769cc16048b2.json");

    const auth = new google.auth.JWT({
      email: serviceAccount?.client_email,
      key: serviceAccount?.private_key,
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });

    google.options({ auth: auth });

    const iap = google.androidpublisher("v3");

    const resp = await iap.purchases.products.get({
      packageName: "com.traveler.nmoment",
      productId,
      token:
        "minodojglppganfbiedlabed.AO-J1OyNtpooSraUdtKlZ_9gYs0o20ZF_0ryTNACmvaaaG5EwPX0hPruUdGbE3XejoXYCYzJA2xjjAxrDLFhmu9WC4fvTDNL-RDXCWjlHKpzLOigxCr1QhScXR8uXtX8R94iV6MmMHqD",
    });
    console.log("resp");
    console.log(resp);
    if (resp.data.purchaseState !== 0) {
      // throw new BadRequestException('Purchase is either Pending or Cancelled!');
      // return res.status(200).json({ status: 'false' })
    } else if (resp.data.consumptionState !== 0) {
      // throw new BadRequestException('Purchase is already consumed!');
    } else if (resp.data.orderId !== productId) {
      // throw new BadRequestException('Invalid orderId');
    } else if (resp.data.orderId === productId) {
    }
  } catch (err) {
    console.log(err);
  }
  return;

  await Payment.destroy({
    where: {
      UserId: 68575,
    },
  });
  return;
  const asdasd = await Payment.findAll({
    where: {
      // platform: 'android',
      // type: 'APP'
    },
    offset: 0,
    limit: 10,
    order: [["createdAt", "DESC"]],
  });
  console.log(asdasd);
  return;

  await Block.create({
    email: "dox31279@gmail.com",
  });
  return;

  await User.update(
    {
      // roles: USER_ROLE.NORMAL_USER
      // gender: USER_GENDER.BOY
      country: COUNTRY_LIST.미국,
    },
    {
      where: {
        // email: '617@nmoment.live'
        id: 65785,
        // link: '@d5b9e189bd4844d8'
      },
    }
  );
  return;

  const fun = async () => {
    try {
      return new Promise((resolve) => {
        setTimeout(() => {
          try {
            throw Error;
          } catch (err) {}

          // resolve([]);
        }, 5000);
      });
    } catch (err) {}
  };

  async function fetchSockets() {
    for (let i = 0; i < 5; i++) {
      try {
        console.log(1);
        return await fun();
      } catch (e) {}
    }
    return [];
  }

  const connectList: any = await fetchSockets();
  console.log(connectList);

  return;

  return;

  const jsd = await User.findOne({
    where: {
      // roles: USER_ROLE.BAN_USER,
      // link: '@cb2d3edfe1f84634'
      // phone: '01022013763'
      email: "xibic39666@marchub.com",
      // id: '41017'
      // nick: '소은'
      // id: 39321,
      // phone: '010assist'
    },
    // paranoid: false,
  });

  console.log(jsd);

  return;

  await Block.destroy({
    where: {
      email: "617@nmoment.live",
    },
  });
  return;

  //@b659a4b62cde44a7

  await Block.create({
    where: {
      phone: "01022013763",
      email: "gyska19@naver.com’",
    },
  });
  return;

  await User.update(
    {
      // roles: USER_ROLE.NORMAL_USER
      age: 26,
    },
    {
      where: {
        link: "@b40dc6a6f1d447de",
      },
    }
  );

  return;

  await Mcn.update(
    {
      creatorCharge: 50,
    },
    {
      where: {
        mcningId: 54325,
      },
    }
  );

  return;

  //@769ade35ad9041e6
  //57690
  //@mingming2

  await Block.destroy({
    where: {
      phone: "01085600796",
    },
  });
  await User.update(
    {
      roles: USER_ROLE.NORMAL_USER,
    },
    {
      where: {
        link: "@32d340caf41c4c74",
      },
    }
  );

  const asdf = await User.findOne({
    where: {
      // link: '@46398495f9b34c1f'
      nick: "세은",
    },
  });
  console.log(asdf);

  return;

  return;

  await CreatorAuth.update(
    {
      callPrice: 2000,
    },
    {
      where: {
        UserId: 63348,
      },
    }
  );
  return;

  //@meow
  const chch = await User.findOne({
    where: {
      // link: '@industry'
      email: "kt95997381@gmail.com",
    },
  });
  console.log(chch);
  return;

  //@test123

  await User.update(
    {
      callState: CALL_TYPE.CALL_ING,
    },
    {
      where: {
        //pointHistory
        // callState: CALL_TYPE.CALL_ING
        link: "@Seohee",
      },
    }
  );

  return;
  const adsCount: any = await AdsCount.findOne({
    where: {
      adCode: "ib",
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
    },
  });
  console.log(adsCount);
  return;

  //@8fc666da73684b52
  await Mcn.update(
    {
      code: "nj12",
    },
    {
      where: {
        mcnerId: 57675,
        mcningId: 57690,
      },
    }
  );
  await Mcn.update(
    {
      code: "nj12",
    },
    {
      where: {
        mcnerId: 61579,
        mcningId: 57690,
      },
    }
  );
  return;
  const mm = await Mcn.findOne({
    where: {
      mcnerId: 44398,
      mcningId: 54325,
    },
  });
  console.log(mm);
  return;

  await Block.destroy({
    where: {
      phone: "01035577454",
    },
  });
  await User.update(
    {
      roles: USER_ROLE.NORMAL_USER,
    },
    {
      where: {
        phone: "01035577454",
      },
    }
  );
  return;

  await User.update(
    {
      age: 27,
    },
    {
      where: {
        link: "@lluvganii",
      },
    }
  );
  return;
  /*
  const x = await Mcn.findOne({
    where: {
      mcnerId: 44398,
      mcningId: 54325,
    }
  })

  await Mcn.update({
    code: 'ch01'
  }, {
    where: {
      mcnerId: 44398,
      mcningId: 54325,
    }
  })
  console.log(x)

  return
  */

  //01098057537

  /*
  

  await User.update({
    country: COUNTRY_LIST.미국
  }, {
    where: {
      link: {
        [Op.in]: [
          '@d486916fa8304',
        ]
      },
    }
  })
  return
  */

  /*
  console.log(new Date('2024-11-24T15:46:57.000Z').getHours())
  console.log(new Date('2024-11-24T15:46:57.000Z').getMinutes())
  console.log(new Date('2024-11-24T15:46:57.000Z').getSeconds())
  consol
  return
  */

  const userCallingListGirl: any = await User.findAll({
    include: [
      {
        required: false,
        model: PointHistory,
        where: {
          plusOrMinus: POINT_HISTORY.PLUS,
          type: POINT_HISTORY.TYPE_CALL,
          createdAt: {
            [Op.gt]: new Date(
              new Date().setMinutes(new Date().getMinutes() - 2)
            ), //sequelize.literal("NOW() - (INTERVAL '1 MINUTE')")
          },
        },
      },
    ],
    where: {
      gender: USER_GENDER.GIRL,
      callState: CALL_TYPE.CALL_ING,
      // link: '@4ce868022cc54b5f' //'@ooong'
    },
  });
  userCallingListGirl?.forEach((item: any) => {
    console.log(item?.PointHistories[0]?.createdAt);
    console.log(new Date());
    console.log(new Date(new Date().setMinutes(new Date().getMinutes() - 2)));
  });

  return;

  /*
  await Mcn.create({
    mcnerId: 60076,
    mcningId: 57690,
    creatorCharge: 45,
    code: 'nj12'
  })
  return
  */

  await User.update(
    {
      // age: 24,
      country: COUNTRY_LIST.한국,
    },
    {
      where: {
        link: "@stephchang98",
        // id: 60031
      },
    }
  );
  return;
  for await (const keyword of BAN_REAL_KEYWORD.LIST) {
    if (String("혹시 라인하시나요?").includes(keyword)) {
      console.log(keyword);
    }
  }
  return;

  /*await User.update({
    // roles: USER_ROLE.COMPANY_USER
    code: 'mb12'
    // gender: USER_GENDER.GIRL
  }, {
    where: {
      id: 59784
    }
  })
  return
  */

  await Mcn.update(
    {
      eventCh01: false,
    },
    {
      where: {
        mcnerId: 55952,
        code: "ch01",
      },
    }
  );
  await Mcn.update(
    {
      eventCh01: false,
    },
    {
      where: {
        mcnerId: 44398,
        code: "ch01",
      },
    }
  );
  return;

  //@8791a4badf3c4aa6

  await FanStep.update(
    {
      step: 8,
    },
    {
      where: {
        id: 1729,
      },
    }
  );
  await Subscribe.update(
    {
      step: 8,
    },
    {
      where: {
        subscribingId: 43696,
        step: 10,
      },
    }
  );

  await Post.update(
    {
      step: 8,
    },
    {
      where: {
        step: 10,
        UserId: 43696,
      },
    }
  );

  return;

  // 43696
  const fnns = await FanStep.findAll({
    where: {
      UserId: 43696,
    },
  });
  console.log(fnns);
  return;

  const postss = await Subscribe.findAll({
    where: {
      // step: 10,
      subscribingId: 212,
      step: 10,
    },
  });
  console.log(postss);
  return;

  await InAppRefund.update(
    {
      amount: 0,
    },
    {
      where: {
        phone: "01051775470",
      },
    }
  );
  return;

  await Block.destroy({
    where: {
      phone: "01028528024",
    },
  });
  await User.update(
    {
      roles: USER_ROLE.NORMAL_USER,
    },
    {
      where: {
        link: "@d92f6415b8b34e21",
      },
    }
  );
  return;

  await Point.decrement(
    {
      amount: 50000,
    },
    {
      where: {
        UserId: {
          [Op.in]: ["58651", "58746", "58750"],
        },
      },
    }
  );

  //01058972228

  //nguyenthiminhanhntt@gmail.com

  await User.update(
    {
      // link: '@sexyhana123'
      code: "nj12",
    },
    {
      where: {
        // id: 57690,
        // link: '@butterfly0304'
        id: 57690,
      },
    }
  );
  return;

  await User.update(
    {
      // roles: USER_ROLE.NORMAL_USER
      country: COUNTRY_LIST.한국,
    },
    {
      where: {
        // phone: '01087092210'
        id: 55952,
      },
    }
  );

  //55952

  //01087092210
  // await

  const exchangePrice = 20000;

  await User.update(
    {
      exchangeShow: false,
    },
    {
      where: {
        link: "@5a82712d8de3464c",
      },
    }
  );
  return;

  const mcnLista: any = await User.findAll({
    include: [
      {
        model: User,
        include: [{ model: Point }, { model: Money }, { model: CreatorAuth }],
        as: "Mcners",
        attributes: {
          exclude: USER_ATTRIBUTE.EXCLUDE_MCN_TEST123,
        },
      },
      { model: Point },
      { model: Money },
      { model: CreatorAuth },
    ],
    where: {
      roles: USER_ROLE.COMPANY_USER,
      id: 54325,
    },
    order: [[{ model: User, as: "Mcners" }, "createdAt", "DESC"]],
  });
  console.log(mcnLista[0]?.Mcners);

  mcnLista[0]?.Mcners?.forEach((item: any) => {
    console.log(item?.nick);
  });

  return;
  const auuu: any = await User.findAll({
    include: [{ model: SocialLogin }],
    where: {
      // nick: '오빠살살'
      // roles: USER_ROLE.BAN_USER,
      // phone: '01084209089'
      // email: '@8791a4badf3c4aa6'
      link: "@ef6c2f9493fc4de6",
    },
    // order: [['createdAt', 'DESC']],
    // offset: 0,
    // limit: 6,
  });
  console.log(auuu[0]);
  return;

  await Block.destroy({
    where: {
      phone: "01082900758",
    },
  });
  await User.update(
    {
      roles: USER_ROLE.NORMAL_USER,
    },
    {
      where: {
        id: 54549,
      },
    }
  );
  return;

  await Point.decrement(
    {
      amount: 50000,
    },
    {
      where: {
        UserId: 21549,
      },
    }
  );
  return;

  console.log(auuu?.Exchanges[0]);
  let suma = 0;
  auuu?.Exchanges?.forEach((item: any) => {
    suma += item?.money;
  });
  console.log(suma);
  return;

  //@dangee

  await Block.destroy({
    where: {
      phone: "01053724444",
    },
  });

  console.log(auuu);
  return;

  //17057

  const subscribed = await Subscribe.findAll({
    where: {
      subscribingId: 17057,
    },
  });

  console.log(subscribed);
  return;

  const posttt = await Post.findAll({
    limit: 20,
    offset: 0,
  });
  console.log(posttt);
  return;
  const pas = await Payment.findAll({
    where: {
      price: 0,
      platform: "APP",
      type: 1,
      refund: false,
    },
  });
  console.log(pas);
  return;

  //@iloveyou

  await User.update(
    {
      age: 25,
    },
    {
      where: {
        link: "@iloveyou",
      },
    }
  );
  return;
  const ppp = await Post.findOne({
    where: {
      id: 250,
    },
  });

  console.log(ppp);
  return;

  await InAppRefund.update(
    {
      amount: 0,
    },
    {
      where: {
        phone: "01037631682",
      },
    }
  );
  return;
  const userfs: any = await User.findOne({
    include: [{ model: SocialLogin }],
    where: {
      // link: '@akaks'
      phone: "01071758722",
      // email: 'kimzeroxx@gmail.com'
      // nick: '탈퇴 (인스타cherry779821)비공계정 에서 영통진행 팔걸어주세요'
      // link: '@a41227ad7e4d483a'//'@55434575ccac4f19'
    },
  });

  console.log(userfs);
  return;

  const caa = await CreatorAuth.findOne({
    where: {
      UserId: 6,
    },
  });

  console.log(caa);
  return;

  /*
  await User.update({
    gender: USER_GENDER.BOY
  }, {
    where: {
      link: '@1cb96a169d124f97'
    }
  })
  return
  
*/
  /*
  
  

  await Info.destroy({
    where: {
      phone: '01099530959'
    }
  })

  return
  */
  const hash = await bcrypt.hash("nmomenthxwa", 12); //변경
  const refreshToken = refresh();

  const user55 = await User.create({
    phone: "01099999986", //변경
    email: "hxwa@nmoment.live", //변경
    age: 20,
    link: "@hxwa", //변경
    password: hash,
    gender: USER_GENDER.GIRL,
    real_birthday: "1999",
    real_gender: USER_GENDER.GIRL,
    nick: "hxwa", //변경
    profile: `${process.env.CLOUD_FRONT_STORAGE}/girl.png`,
    background: `${process.env.CLOUD_FRONT_STORAGE}/girl.png`,
    country: COUNTRY_LIST.한국,
    roles: USER_ROLE.NORMAL_USER,
    refreshToken,
    lastVisit: new Date(),
    callState: CALL_TYPE.CALL_WAIT,
  });

  await Account.create({
    UserId: user55.id,
  });
  await AlarmSetting.create({
    UserId: user55.id,
  });
  await Point.create({
    UserId: user55.id,
    amount: 0,
  });
  await Score.create({
    UserId: user55.id,
  });
  await Item.create({
    UserId: user55.id,
  });
  await Card.create({
    UserId: user55.id,
  });
  await CreatorAuth.create({
    platformPointCharge: 50,
    platformSubscribeCharge: 50,
    UserId: user55.id,
  });
  await Money.create({
    UserId: user55.id,
  });

  const cs2: any = await User.findOne({
    where: {
      roles: USER_ROLE.CS_USER,
    },
  });
  if (cs2) {
    await Follow.create(
      {
        followerId: user55.id,
        followingId: cs2.id,
      },
      {}
    );
  }
  return;

  await User.destroy({
    where: {
      id: 419,
    },
  });
  await Alarm.destroy({
    where: {
      UserId: 419,
    },
  });
  await Comment.destroy({
    where: {
      UserId: 419,
    },
  });
  await CommentChild.destroy({
    where: {
      UserId: 419,
    },
  });
  await Post.destroy({
    where: {
      UserId: 419,
    },
  });
  await Authority.destroy({
    where: {
      UserId: 419,
    },
  });
  await CallHistory.destroy({
    where: {
      UserId: 419,
    },
  });
  await FanStep.destroy({
    where: {
      UserId: 419,
    },
  });
  await Benifit.destroy({
    where: {
      UserId: 419,
    },
  });
  await Wish.destroy({
    where: {
      UserId: 419,
    },
  });
  await Ban.destroy({
    where: {
      bannerId: 419,
    },
  });
  await Follow.destroy({
    where: {
      followerId: 419,
    },
  });
  await Subscribe.destroy({
    where: {
      subscriberId: 419,
    },
  });
  await SocialLogin.destroy({
    where: {
      UserId: 419,
    },
  });
  await Account.destroy({
    where: {
      UserId: 419,
    },
  });
  await AlarmSetting.destroy({
    where: {
      UserId: 419,
    },
  });
  await Point.destroy({
    where: {
      UserId: 419,
    },
  });
  await Score.destroy({
    where: {
      UserId: 419,
    },
  });
  await Item.destroy({
    where: {
      UserId: 419,
    },
  });
  await Card.destroy({
    where: {
      UserId: 419,
    },
  });
  await CreatorAuth.destroy({
    where: {
      UserId: 419,
    },
  });
  await Money.destroy({
    where: {
      UserId: 419,
    },
  });
  return;

  await Ban.destroy({
    where: {
      bannerId: 6,
      banningId: 1006,
    },
  });

  await Ban.destroy({
    where: {
      bannerId: 6,
      banningId: 44398,
    },
  });

  return;

  const callTime = "1726470866714";

  const callAfterTime = new Date(Number(callTime)).getTime();
  const currentTime = new Date().getTime();
  const difference = currentTime - callAfterTime;
  console.log(difference / 1000);
  return;
  await User.update(
    {
      // gender:
      age: 20,
      gender: USER_GENDER.GIRL,
    },
    {
      where: {
        email: "gtrlfxo2@gmail.com",
      },
    }
  );

  return;

  await Subscribe.update(
    {
      step: 5,
    },
    {
      where: {
        subscribingId: 43696,
        step: 10,
      },
    }
  );

  const suss = await Subscribe.findAll({
    where: {
      subscribingId: 43696,
      step: 5,
    },
  });

  console.log(suss);
  return;

  //@9d7f935129d94cde
  await User.update(
    {
      roles: USER_ROLE.COMPANY_USER,
    },
    {
      where: {
        id: 45767,
      },
    }
  );
  return;

  //43696
  await FanStep.update(
    {
      step: 5,
    },
    {
      where: {
        id: 1039,
      },
    }
  );

  await Post.update(
    {
      step: 5,
    },
    {
      where: {
        UserId: 43696,
        step: 10,
      },
    }
  );

  return;

  /*
  const pss = await Payment.findAll({
    where: {
      platform: 'APP',
      UserId: 46604// fsfsddd2[0]
    }
  })
  console.log(pss)
  return
  */

  const hash34 = await bcrypt.hash("1234@@", 12);

  await User.update(
    {
      password: hash34,
      // roles: USER_ROLE.NORMAL_USER
    },
    {
      where: {
        id: 42910,
      },
    }
  );
  return;

  await Payment.create({
    platform: "WEB",
    UserId: 46604,
    price: 0,
  });
  return;
  //44229

  const sssn = await Subscribe.findAll({
    where: {
      subscriberId: 44229,
    },
  });
  console.log(sssn);

  await Subscribe.update(
    {
      subscribeState: false,
    },
    {
      where: {
        subscribingId: 41052,
        subscriberId: 44229,
      },
    }
  );
  return;

  const userCall = await User.findAll({
    include: [{ model: CallHistory, as: "CallHistories" }],
    where: {
      "$CallHistories.id$": {
        [Op.not]: null,
      },
    },
  });
  await Promise.all(
    userCall.map(async (list: any, idx: number) => {
      const CallHistories = list?.CallHistories;
      let sum = 0;
      // console.log(CallHistories)
      CallHistories.forEach((item: any) => {
        sum += item?.time;
        // console.log(item)
      });
      if (sum && CallHistories) {
        const avg = Number(sum / CallHistories?.length).toFixed(1);
        console.log("avg");
        console.log(avg);
        console.log("nick");
        console.log(list?.nick);
        await User.update(
          {
            totalTime: sum,
            avgTime: avg,
          },
          {
            where: {
              id: list?.id,
            },
          }
        );
      }
    })
  );

  return;

  await Payment.destroy({
    where: {
      id: 17794,
    },
  });

  return;

  const chatListXpnt: any = await Chat.findAll({
    include: [
      {
        model: Room,
        include: [{ model: UserRoom, include: [{ model: User }] }],
      },
    ],
    where: {
      //UserId: 22128
      UserId: 7083, // 9906
      /*
      url: {
        [Op.not]: null
      },
      */
    },
    // offset: 400,
    // limit: 100,
  });

  chatListXpnt?.forEach((list: any) => {
    console.log(list?.Room?.UserRooms[0]?.User?.nick);
    console.log(list?.Room?.UserRooms[1]?.User?.nick);
    console.log(list?.content);
    console.log(list?.url);
    console.log(list?.cost);
    console.log(list?.createdAt);
    console.log();
  });
  return;

  // 2024-08-19T10:16:32.000Z

  const userCallingList: any = await User.findAll({
    include: [
      {
        model: PointHistory,
        where: {
          plusOrMinus: true,
          type: POINT_HISTORY.TYPE_CALL,
          createdAt: {
            [Op.gt]: new Date(Date.now() - 60 * 1000), //sequelize.literal("NOW() - (INTERVAL '1 MINUTE')")
          },
        },
        limit: 1,
        order: [["createdAt", "DESC"]],
      },
    ],
    where: {
      callState: CALL_TYPE.CALL_ING,
    },
  });
  await Promise.all(
    userCallingList.map(async (list: any) => {
      const pointHistory = list?.PointHistories[0];
      if (!pointHistory) {
        await User.update(
          {
            callState: CALL_TYPE.CALL_WAIT,
          },
          {
            where: {
              id: list?.id,
            },
          }
        );
      }
    })
  );
  return;

  const dsna = await Chat.findAll({
    where: {
      content: {
        [Op.like]: "%http://fantrie.com/mochimochinono%",
      },
    },
  });
  //
  console.log(dsna);

  return;

  //@5a82712d8de3464c
  //@776c8cf679754484

  await CreatorAuth.update(
    {
      callPrice: 4000,
    },
    {
      where: {
        UserId: 11787,
      },
    }
  );

  return;

  slackPostMessage(
    SLACK_CHANNEL.CALL_LOG,
    `Video Call Price!
    
    `
  );

  return;

  console.log(new Date().toLocaleDateString());
  /*
  slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
    `구독 결제
    UserId:1
    link:@123123
    `
  )
    */
  // console.log(res)
  return;
  await Chat.destroy({
    where: {
      content: "이제 팬딩으로 오세용",
    },
  });
  return;

  const cchch = await Chat.findAll({
    where: {
      content: "https://fanding.kr/user/orij_ho",
      // UserId: 6
    },
  });
  console.log(cchch);
  return;

  /*
  await User.update({
    // real_birthday: 1999,
    // real_gender: USER_GENDER.GIRL,
    country: COUNTRY_LIST.한국
  }, {
    where: {
      link: '@yukiiiii0505',
    }
  })

  return
  */
  const vvv = await Block.findOne({
    where: {
      email: "qwerdf1551@gmail.com",
    },
  });
  console.log(vvv);
  await Block.destroy({
    where: {
      id: 76,
    },
  });
  return;

  const exx = await Exchange.findAll({
    where: {
      UserId: 39949,
    },
  });

  console.log(exx);

  return;

  await CreatorAuth.update(
    {
      callPrice: 5000,
    },
    {
      where: {
        UserId: 34122,
      },
    }
  );
  return;

  // @4ad187d6b2e447c7

  await User.update(
    {
      // roles: USER_ROLE.COMPANY_USER
      gender: USER_GENDER.GIRL,
    },
    {
      where: {
        // id: 42328
        link: "@4ad187d6b2e447c7",
      },
    }
  );
  return;

  const dsad = await PointHistory.findAll({
    where: {
      UserId: 34122,
    },
    order: [["createdAt", "DESC"]],
    offset: 0,
    limit: 20,
  });

  console.log(dsad);
  return;

  const cal = await CreatorAuth.findAll({
    include: [{ model: User }],
    where: {
      callPrice: {
        [Op.gt]: 3000,
      },
    },
  });

  console.log(cal);
  return;

  await Money.update(
    {
      amount: 0,
    },
    {
      where: {
        UserId: 17417,
      },
    }
  );
  return;

  const step = 5;
  let left = -1;
  let right = 11;
  const price = 1000;

  const fanstep: any = await FanStep.findAll({
    where: {
      UserId: 6,
    },
  });

  fanstep.forEach((item: any) => {
    if (item.step < step) {
      left = Math.max(left, item.step);
    } else if (item.step > step) {
      right = Math.min(right, item.step);
    }
  });
  if (left !== -1) {
    const leftFanStep: any = await FanStep.findOne({
      where: {
        step: left,
      },
    });
    if (leftFanStep?.price >= price) {
      return;
    }
  }
  if (right !== 11) {
    const rightFanStep: any = await FanStep.findOne({
      where: {
        step: right,
      },
    });
    if (price >= rightFanStep?.price) {
      return;
    }
  }
  console.log(left);
  console.log(right);
  return;

  const follower: User | null = await User.findOne({
    include: [
      {
        model: User,
        as: "Followers",
        attributes: {
          exclude: USER_ATTRIBUTE.EXCLUDE,
        },
        include: [
          {
            model: AlarmSetting,
          },
        ],
      },
    ],
    attributes: {
      exclude: USER_ATTRIBUTE.EXCLUDE,
    },
    where: {
      id: 1,
    },
  });

  function chunk(data: any = [], size = 1) {
    const arr = [];

    for (let i = 0; i < data.length; i += size) {
      arr.push(data.slice(i, i + size));
    }

    return arr;
  }
  const newResult = chunk(follower?.Followers, 500);

  newResult?.map((item: any, idx: number) => {
    setTimeout(() => {
      item?.forEach((list: any) => {
        /*
          if (list?.AlarmSetting.post) {
              if (list?.pushToken) {
                  FCMPushNotification(
                      user?.nick.toString(),
                      `새 포스트를 작성했어요!`,
                      list?.pushToken?.toString(),
                      user?.profile?.toString(),
                      {
                          screen: 'Profile',
                          YouId: req?.id.toString(),
                      }
                  )
              }
          }
              */
        console.log(list?.id);
      });
    }, idx * 2000);
  });
  return;

  const dsdsad = await Chat.findAll({
    where: {
      UserId: 27634,
      cost: 199999,
      // content: { [Op.like]: `%이게 내 몸%` }
    },
  });

  console.log(dsdsad);

  return;

  // awsSimpleEmailService('traveltofindlife@gmail.com', 'traveltofindlife@gmail.com', 'nmoment', '내.용 헤헤 앤모먼트')
  return;
  //@8c3b6fd213914597

  //@0fc58b04771b4990

  await User.update(
    {
      roles: USER_ROLE.COMPANY_USER,
    },
    {
      where: {
        id: 34390,
      },
    }
  );

  return;

  await Point.update(
    {
      amount: 0,
    },
    {
      where: {
        UserId: 4613,
      },
    }
  );
  await Money.update(
    {
      amount: 542428,
    },
    {
      where: {
        UserId: 4613,
      },
    }
  );
  return;
  //

  //@lovejjj

  await User.update(
    {
      lastVisit: new Date(),
    },
    {
      where: {
        id: 34122,
      },
    }
  );
  return;

  return;
  //24750

  await Point.update(
    {
      amount: 0,
    },
    {
      where: {
        UserId: 24750,
      },
    }
  );
  await Money.update(
    {
      amount: 0,
    },
    {
      where: {
        UserId: 24750,
      },
    }
  );
  return;

  /*
  await Ban.create({
     banningId: ,
     bannerId: 33376,
  })
  await Ban.create({
    banningId: ,
    bannerId: 32326,
 })
 await Ban.create({
  banningId: ,
  bannerId: 32623,
})
  */

  const dona = await Donation.findAll({
    where: {
      donationerId: 29421,
    },
  });

  console.log(dona);
  return;

  const bann = await Block.findAll({
    where: {},
  });
  console.log(bann);
  return;

  await User.update(
    {
      // link: link
      link: "@hip_fringes",
    },
    {
      where: {
        // link: '@mini6666',
        id: 32392,
      },
    }
  );
  return;
  const user421: any = await User.findAll({
    include: [{ model: SocialLogin }],
    where: {
      // email: 'kqzq8dhvcp@privaterelay.appleid.com'
      // link: '@_yona_pila'
      nick: "힙쁘링 🍑",
      // nick: '승민이'
    },
  });
  //@eb31c2a768ab40d6

  console.log(user421[0]);

  return;

  await Mcn.update(
    {
      creatorCharge: 17,
    },
    {
      where: {
        mcnerId: 32272,
        mcningId: 9906,
      },
    }
  );
  return;

  return;

  await Money.update(
    {
      amount: 0,
    },
    {
      where: {
        UserId: 1869,
      },
    }
  );
  return;

  /*
  await Chat.destroy({
    where: {
      url: 'https://nmoment-container-secure-out.s3.ap-northeast-2.amazonaws.com/1719500925369pm8yywprl39s24q6m7mo5wiv814o5i4bvtqzqk83sjnryik5s9840u8ssb7n0lgn5yc0uqeeme5mmcdo.mp4'
    }
  })
    */

  await Post.destroy({
    where: {
      // lock: false,
      UserId: 1823,
    },
  });

  /*
    await Post.update({
  
    },{
      where:{
  
      }
    })
  */
  return;

  return;

  //29647
  //

  const tokens = v4().split("-");
  const link = "@" + tokens[0] + tokens[1] + tokens[2];
  //1821
  //1823
  await User.update(
    {
      link: link,
    },
    {
      where: {
        // link: '@kiname._'
        id: 1823,
      },
    }
  );
  return;

  const usa: any = await User.findOne({
    include: [{ model: SocialLogin }, { model: Post }],
    where: {
      //id: 2184
      link: "@kiname._",
      // email: 'godgoding@gmail.com'
    },
  });
  console.log(usa?.Posts);
  await Post.update(
    {
      contentSecret: true,
      adult: true,
    },
    {
      where: {
        id: 2705,
      },
    }
  );

  return;

  // const hash34 = await bcrypt.hash('1234@@', 12)

  await Money.update(
    {
      amount: 373943,
    },
    {
      where: {
        UserId: 4613,
      },
    }
  );
  return;

  //17184
  // @lucia1028

  //@test123

  //@lleeuneee

  await Point.update(
    {
      amount: 550,
    },
    {
      where: {
        UserId: 417,
      },
    }
  );

  await Money.update(
    {
      amount: 0,
    },
    {
      where: {
        UserId: 9261,
      },
    }
  );
  return;

  /*
  const exx = await Exchange.findAll({
    where: {
      UserId: 9906
    }
  })

  console.log(exx)

  return
  */

  return;

  /*
  const month = 4;

  const beforeFirstDay = new Date(2024, month - 1, 1);
  const befotreLastDay = new Date(2024, month, 0);
  //console.log(new Date(beforeFirstDay).getMonth() + 1)
  //console.log(new Date(befotreLastDay).getMonth() + 1)



  const mcnFind: any = await Mcn.findAll({
    where: {
      mcningId: 22275
    }
  })
  let earnMoney = 0;
  await Promise.all(mcnFind?.map(async (list: any, idx: number) => {

    const user = await User.findOne({
      where: {
        id: list?.mcnerId
      }
    })
    const donation: any = await Donation.findAll({
      where: {
        donationingId: list?.mcnerId,
        createdAt: {
          [Op.and]: [
            {
              [Op.gte]: beforeFirstDay
            },
            {
              [Op.lte]: befotreLastDay
            },
          ],
        }
      },

    })
      


    let count = 0
    donation.forEach((item: any) => {
      count += item?.amount
      earnMoney += item?.amount
    })
    list['dataValues'].User = user
    list.User = user
    list['dataValues'].earn = count
    list.earn = count

    console.log(user)
    console.log(donation)
    // console.log(`크리에티터 이름 - ${user?.nick}`)
    // console.log(`크리에이터 수익금액 - ${count}`)
  }))


  const sad = await Subscribe.findAll({
    where: {
      subscriberId: 25937,
    }
  })
  // console.log(sad)

  return
  */

  await User.update(
    {
      country: COUNTRY_LIST.미국,
    },
    {
      where: {
        link: "@fd6e9fa8d88149c9",
      },
    }
  );
  return;

  const sda = await User.findOne({
    include: [{ model: Point }, { model: Money }],
    where: {
      link: "@rpwnwhsdp",
    },
  });

  console.log(sda?.Point);
  console.log(sda?.Money);

  await Point.update(
    {
      amount: 0,
    },
    {
      where: {
        UserId: 14259,
      },
    }
  );

  await Money.update(
    {
      amount: 0,
    },
    {
      where: {
        UserId: 14259,
      },
    }
  );

  return;

  const dayBeFore30 = new Date().setDate(new Date().getDate() - 30);
  const subscribe: any = await Subscribe.findAll({
    // include: [{ model: FanStep }],
    where: {
      //subscribeState: SUBSCRIBE_STATE.ING,
      subscribedAt: {
        [Op.lte]: dayBeFore30,
      },
    },
  });

  console.log(subscribe);
  console.log(subscribe?.length);
  return;

  /*
const dayBeFore30f = new Date("2024-05-01")
let subscribes = await Subscribe.findAll({
  where: {
    // subscriberId: list?.donationerId,
    // subscribingId: UserId,
    subscribeState: true,
    subscribedAt: {
      [Op.lte]: dayBeFore30f,
    }
  },
  order: [['subscribedAt', 'ASC']]
})

console.log(subscribes)
console.log(subscribes?.length)
return
*/

  await Money.update(
    {
      amount: 226781,
    },
    {
      where: {
        id: 4613,
      },
    }
  );

  return;

  //226781

  const dayBeFore30d = new Date("2024-05-01");
  const subscriber: any = await User.findAll({
    include: [
      {
        model: User,
        as: "Subscribers",
        attributes: {
          exclude: USER_ATTRIBUTE.EXCLUDE,
        },
        order: [
          [{ model: Subscribe, as: "Subscribers" }, "subscribedAt", "DESC"],
        ],
        required: false,
        through: {
          as: "Subscribe",
          where: {
            subscribedAt: {
              [Op.lte]: dayBeFore30d,
            },
          },
        },
      },
    ],
    where: {
      id: 17057,
    },
    attributes: {
      exclude: USER_ATTRIBUTE.EXCLUDE,
    },
    // offset: Number(pageNum * pageSize),
    // limit: Number(pageSize),
  });

  console.log(subscriber);
  console.log(subscriber?.Subscribers.length);

  return;

  const mcc2 = await Mcn.findOne({
    where: {
      mcnerId: 17057,
      mcningId: 4613,
    },
  });

  console.log(mcc2);
  return;

  const fsfs: any = await User.findOne({
    include: [{ model: Point }, { model: PointHistory }],
    where: {
      link: "@a52830ed91914e77",
    },
  });

  console.log(fsfs.Point);

  // 124000

  await Point.update(
    {
      amount: 2371,
    },
    {
      where: {
        id: 20101,
      },
    }
  );
  return;
  fsfs.PointHistories.forEach((item: any) => {
    console.log(item?.amount);
    console.log(item?.createdAt);
  });
  // console.log(fsfs?.Point)
  return;

  await User.update(
    {
      link: "@x_xrawwi",
      real_gender: 2,
      real_birthday: 1988,
      roles: USER_ROLE.NORMAL_USER,
    },
    {
      where: {
        phone: "010fake3",
      },
    }
  );
  return;

  const mcc = await Mcn.findOne({
    where: {
      mcnerId: 17057,
      mcningId: 4613,
    },
  });

  console.log(mcc);
  return;

  await Mcn.create({
    mcnerId: 24885,
    mcningId: 4613,
    creatorCharge: 5,
  });

  return;

  const usdaf = await User.findOne({
    where: {
      link: "@Eune_i006",
    },
  });
  console.log(usdaf);
  console.log(usdaf?.introduce);

  await User.update(
    {
      introduce: `인스타에는 없는 비공개 사진 볼 수 있어요☺️
    (ex.일상,미공샷 등등!!) 관심 많이 가져주세요💌`,
    },
    {
      where: {
        link: "@Eune_i006",
      },
    }
  );
  return;

  //console.log(new Date(beforeFirstDay).getMonth() + 1)
  //console.log(new Date(befotreLastDay).getMonth() + 1)

  return;

  const subss = await Subscribe.findAll({
    where: {
      subscribeState: true,
    },
    order: [["updatedAt", "DESC"]],
  });

  await Promise.all(
    subss.map((list, idx) => {
      console.log(list?.subscribingId);
      console.log(list?.lastPrice);
      // console.log(list?.createdAt)
      console.log(list?.updatedAt);
      console.log();
    })
  );

  return;
  await Mcn.update(
    {
      creatorCharge: 0,
    },
    {
      where: {
        mcnerId: 17057,
        mcningId: 4613,
      },
    }
  );

  return;

  const phh = await PointHistory.findAll({
    where: {
      UserId: 21693,
    },
  });

  console.log(phh);
  return;

  const fdaff = await User.findOne({
    include: [{ model: Card }],
    where: {
      link: "@5d6a38d9ee8e494b",
    },
  });

  console.log(fdaff);
  console.log(fdaff?.Card);
  return;

  await Money.update(
    {
      amount: 2000,
    },
    {
      where: {
        id: 2184,
      },
    }
  );
  return;

  //@65g_bagel
  await Mcn.update(
    {
      creatorCharge: 33,
    },
    {
      where: {
        mcnerId: 17712,
        mcningId: 4613,
      },
    }
  );

  return;
  await User.update(
    {
      lastVisit: new Date(),
    },
    {
      where: {
        link: "@joj._.838",
      },
    }
  );
  await User.update(
    {
      lastVisit: new Date(),
    },
    {
      where: {
        link: "@Eune_i006",
      },
    }
  );

  return;
  const fass = await User.findOne({
    include: [{ model: Money }],
    where: {
      link: "@Eune_i006",
    },
  });

  console.log(fass);
  console.log(fass?.Money);

  await Money.update(
    {
      amount: 11692000,
    },
    {
      where: {
        id: 2184,
      },
    }
  );
  return;

  await User.update(
    {
      nick: "린아❤️",
    },
    {
      where: {
        link: "@mimi69",
      },
    }
  );
  return;

  await Mcn.destroy({
    where: {
      mcnerId: 22790,
      mcningId: 22275,
    },
  });

  return;

  const mjd = await User.findOne({
    include: [{ model: Money }],
    where: {
      email: "mediajdinc@gmail.com",
    },
  });

  console.log(mjd);

  await Mcn.update(
    {
      creatorCharge: 100,
    },
    {
      where: {
        mcningId: 22275,
      },
    }
  );

  await Money.update(
    {
      amount: 641373,
    },
    {
      where: {
        id: 22275,
      },
    }
  );
  return;

  const dosd = await Exchange.findAll({
    where: {
      UserId: "17941",
    },
  });

  console.log(dosd);
  return;

  const asd = await User.findOne({
    where: {
      link: "@6197a1ab033249d2",
    },
  });
  console.log(asd);

  return;

  const usda = await User.findOne({
    where: {
      link: "@baby101",
    },
  });

  console.log(usda);
  return;

  const emails: any = await User.findOne({
    include: [{ model: SocialLogin }],
    where: {
      id: 4613,
    },
  });

  console.log(emails.SocialLogins[0]);
  return;

  await Mcn.update(
    {
      creatorCharge: 17,
    },
    {
      where: {
        mcnerId: 20767,
        mcningId: 9906,
      },
    }
  );

  return;

  await User.update(
    {
      roles: USER_ROLE.COMPANY_USER,
    },
    {
      where: {
        link: "@waxer92",
      },
    }
  );

  return;

  //console.log(subT)
  //console.log(subT?.length)

  return;

  const donaList = await Donation.findAll({
    where: {
      donationingId: 16676,
    },
  });

  //console.log(mize)
  console.log(donaList);
  return;

  const subs = await Subscribe.findAll({
    where: {
      subscriberId: 13387,
    },
  });

  await Subscribe.update(
    {
      subscribeState: false,
    },
    {
      where: {
        subscriberId: 13387,
      },
    }
  );

  console.log(subs);
  return;

  //wookjin.yang94@gmail.com
  //shoedy@naver.com
  const fas: any = await User.findAll({
    include: [{ model: SocialLogin }],
    where: {
      //nick: '가식돈에눈깔돌아간ㅇㄱㅁ',
      email: "wookjin.yang94@gmail.com",
      //link: '@fe5bd1fdcc924c34'
    },
    paranoid: false,
  });

  //225 유교미
  //7659 훈탱
  //15711  식돈에눈깔돌아간ㅇㄱㅁ
  const room: any = await Room.findOne({
    include: [{ model: Chat }],
    where: {
      [Op.or]: [
        {
          [Op.and]: [{ MeId: 15711 }, { YouId: 225 }],
        },
        {
          [Op.and]: [{ MeId: 225 }, { YouId: 15711 }],
        },
      ],
    },
  });

  //  console.log(fas)
  console.log(room);
  console.log(room.Chats);
  return;

  await Mcn.destroy({
    where: {
      mcnerId: 16195,
    },
  });
  return;

  const us1: any = await User.findOne({
    where: {
      link: "@fe5bd1fdcc924c34",
    },
  });
  const cs1: any = await User.findOne({
    where: {
      link: "@Eune_i006",
    },
  });

  const donation = await Donation.findAll({
    where: {
      donationerId: us1.id,
      donationingId: cs1.id,
    },
  });

  const subscribett = await Subscribe.findOne({
    where: {
      subscriberId: us1.id,
      subscribingId: cs1.id,
      //subscribeState: SUBSCRIBE_STATE.ING,
    },
  });

  console.log(donation);
  console.log(subscribett);
  return;

  const nasn = await User.findAll({
    include: [{ model: SocialLogin }],
    where: {
      email: "ansubini@naver.com",
      //phone: '01024264714',
      //link: '@df779f56199c42af'
    },
    paranoid: false,
  });
  console.log(nasn);
  return;

  //15136
  //15143

  const mcnF: any = await User.findAll({
    include: [{ model: FanStep }],
    where: {
      //roles: USER_ROLE.CS_USER
      link: "@df779f56199c42af",
    },
  });

  console.log(mcnF);
  return;

  const saa = await Subscribe.findAll({
    where: {
      step: 9,
      subscribingId: 225,
    },
  });
  console.log(saa);

  return;

  return;

  await Mcn.update(
    {
      creatorCharge: 12,
    },
    {
      where: {
        mcnerId: 13752,
      },
    }
  );
  return;
  const sb = await User.findOne({
    where: {
      link: "@lovely_081700",
    },
  });
  console.log(sb);

  return;

  const mcner2: any = await User.findOne({
    include: [{ model: PointHistory }],
    where: {
      link: "@gkdud1508",
    },
  });
  console.log(mcner2);

  const mcnFind2 = await Mcn.findAll({
    where: {
      mcnerId: mcner2?.id,
    },
  });
  console.log(mcnFind2);

  return;

  await FanStep.update(
    {
      price: 100,
    },
    {
      where: {
        id: 324,
      },
    }
  );
  return;

  const god = await User.findOne({
    include: [{ model: FanStep }],
    where: {
      link: "@godtouch",
    },
  });

  console.log(god?.FanSteps);
  return;

  const mcning: any = await User.findOne({
    where: {
      link: "@xpnt",
    },
  });

  const mcnList2: any = await User.findAll({
    include: [
      {
        model: User,
        include: [{ model: Point }, { model: Money }, { model: CreatorAuth }],
        as: "Mcners",
        attributes: {
          exclude: USER_ATTRIBUTE.EXCLUDE,
        },
      },
      { model: Point },
      { model: Money },
      { model: CreatorAuth },
    ],
    where: {
      roles: USER_ROLE.COMPANY_USER,
      id: mcning?.id,
    },
  });
  console.log(mcnList2[0].Mcners[0].Mcn);
  return;

  const mcner22: any = await User.findOne({
    include: [{ model: PointHistory }],
    where: {
      link: "@cow01000",
    },
  });
  console.log(mcner22?.PointHistories);

  let ax = 0;

  mcner22?.PointHistories?.map((list: any) => {
    ax += list?.amount;
  });
  console.log(ax);

  return;

  /*
  await Money.update({
    amount: 126093
  }, {
    where: {
      UserId: mcning?.id
    }
  })

  return
  */

  const mcner = await User.findOne({
    where: {
      link: "@jun_juyeon00",
    },
  });

  console.log(mcner);

  await Mcn.update(
    {
      creatorCharge: 11,
    },
    {
      where: {
        mcningId: mcning?.id,
      },
    }
  );
  return;

  await User.update(
    {
      gender: USER_GENDER.GIRL,
    },
    {
      where: {
        link: "@godtouch",
      },
    }
  );

  return;

  const yy: any = await User.findOne({
    where: {
      link: "@__ulliling",
    },
  });

  console.log(yy);

  await Point.update(
    {
      amount: 0,
    },
    {
      where: {
        UserId: yy.id,
      },
    }
  );
  await Money.update(
    {
      amount: 0,
    },
    {
      where: {
        UserId: yy.id,
      },
    }
  );

  return;

  await Mcn.update(
    {
      creatorCharge: 10,
    },
    {
      where: {
        mcningId: 4613,
        mcnerId: 12011,
      },
    }
  );
  return;

  const mcnList = await Mcn.findAll({
    where: {
      mcningId: 4613,
    },
  });

  console.log(mcnList);
  return;

  await User.update(
    {
      roles: USER_ROLE.COMPANY_USER,
    },
    {
      where: {
        link: "@xpnt",
      },
    }
  );

  return;

  //10770
  const payment = await Payment.findOne({
    include: [{ model: User }],
    where: {
      imp_uid: "imps_378727518364",
    },
  });
  console.log(payment);
  return;
  const d = await Subscribe.findOne({
    where: {},
  });

  return;
  const gm: any = await User.findOne({
    include: [{ model: Money }, { model: Point }],
    where: {
      link: "@8002caf7becd44f8",
    },
  });

  const ph = await PointHistory.findAll({
    where: {
      UserId: gm.id,
    },
  });
  //console.log(ph)
  //return
  console.log(gm.Money);
  console.log(gm.Point);

  await Point.update(
    {
      amount: 300000,
    },
    {
      where: {
        id: 2101,
      },
    }
  );

  return;
  const c5: any = await User.findOne({
    where: {
      email: "5@nmoment.live",
    },
  });
  const c3: any = await User.findOne({
    where: {
      email: "3@nmoment.live",
    },
  });

  return;

  /*
  await Post.update({
    url: 'https://nmoment-container-secure-out.s3.ap-northeast-2.amazonaws.com/afterpost.png',
  }, {
    where: {
      id: 757
    }
  })
  */
  //return

  const csf: any = await User.findOne({
    where: {
      link: "@nmoment_cs",
    },
  });

  //https://d5w3s87s233gw.cloudfront.net/
  //https://nmoment.live/profile/@bomistry

  await User.update(
    {
      //adultPage: true,
      profile: "https://d5w3s87s233gw.cloudfront.net/storage/bom2.jpg",
      background: "https://d5w3s87s233gw.cloudfront.net/storage/bom1.jpg",
    },
    {
      where: {
        link: "@bomistry",
      },
    }
  );

  return;

  await User.update(
    {
      country: "ko",
      gender: USER_GENDER.GIRL,
    },
    {
      where: {
        link: "@kitty_kyokyo",
      },
    }
  );

  return;

  /*
2023-12-07T14:00:21.000Z
        subscribedAt: {

  */
  /*
   const uu: any = await User.findOne({
     where: {
       link: '@__ulliling'
     }
   })
   */

  /*
const suba = await Subscribe.findAll({
  where: {
    subscribeState: SUBSCRIBE_STATE.ING
  },
  order: [['subscribedAt', 'DESC']]
})
*/
  console.log(subscribe);
  console.log(subscribe.length);
  //logger.info(subscribe.length)
  //console.log(subscribe[3].FanStep)

  return;
  const hj: any = await User.findOne({
    where: {
      link: "@kiname._",
    },
  });

  const userList: any = await User.findAll({
    where: {
      gender: USER_GENDER.BOY,
    },
    offset: 500,
    limit: 40,
  });

  for await (const list of userList) {
    const follow = await Follow.findOne({
      where: {
        followerId: list.id,
        followingId: hj.id,
      },
    });
    if (follow) return true;

    await Follow.create({
      followerId: list.id,
      followingId: hj.id,
    });
  }

  await CallHistory.create({
    UserId: 1853,
    UserIdByCreatedAt: 1853,
    time: 130,
  });

  return;

  const fake: any = await User.findAll({
    where: {
      nick: "fake user",
    },
  });
  console.log(fake);

  for await (const list of fake) {
    await Point.update(
      {
        amount: 0,
      },
      {
        where: {
          UserId: list.id,
        },
      }
    );
  }
  return;

  const u2: any = await User.findOne({
    where: {
      link: "@hyeo._.2n",
    },
  });
  await Point.update(
    {
      amount: 5100,
    },
    {
      where: {
        UserId: u2.id,
      },
    }
  );
  const u3: any = await User.findOne({
    where: {
      link: "@1caa636791af44cb",
    },
  });
  await Point.update(
    {
      amount: 5099,
    },
    {
      where: {
        UserId: u3.id,
      },
    }
  );
  const u4: any = await User.findOne({
    where: {
      link: "@433a905507df4f75",
    },
  });
  await Point.update(
    {
      amount: 4420,
    },
    {
      where: {
        UserId: u4.id,
      },
    }
  );
  const u5: any = await User.findOne({
    where: {
      link: "@4d3b6bef580346fc",
    },
  });
  await Point.update(
    {
      amount: 3249,
    },
    {
      where: {
        UserId: u5.id,
      },
    }
  );
  return;
  const what: any = await User.findOne({
    where: {
      link: "@3a1bd875e7b944ac",
    },
    include: [
      {
        model: Payment,
      },
      {
        model: PointHistory,
      },
      {
        model: Card,
      },
    ],
  });
  console.log(what);

  //what.Payments.forEach((list: any) => {
  //    console.log(list)
  //  })
  what.PointHistories.forEach((list: any) => {
    console.log(list);
  });
  console.log(what.Card);

  return;

  const csUser: any = await User.findOne({
    where: {
      roles: USER_ROLE.CS_USER,
    },
  });
  const creator: any = await User.findOne({
    where: {
      link: "@joj._.838",
    },
  });
  const fakeList: any = [];
  for (let i = 10; i < 100; i++) {
    fakeList.push(i);
  }
  for await (const list of fakeList) {
    //const UserId: number = req.id
    const follow = await Follow.findOne({
      where: {
        followerId: list,
        followingId: csUser.id,
      },
    });
    if (follow) return true;
    console.log("create");
    await Follow.create({
      followerId: list,
      followingId: csUser.id,
    });
  }

  return;

  const fasm: any = await User.findOne({
    where: {
      link: "@5804604",
    },
  });

  await Subscribe.create({
    lastPrice: 5000,
    FanStepId: 1,
    subscriberId: 120,
    subscribingId: fasm.id,
    step: 1,
    subscribeCount: 1,
    subscribedAt: new Date(),
    subscribeState: SUBSCRIBE_STATE.ING,
  });
  await Subscribe.create({
    lastPrice: 5000,
    FanStepId: 1,
    subscriberId: 121,
    subscribingId: fasm.id,
    step: 1,
    subscribeCount: 1,
    subscribedAt: new Date(),
    subscribeState: SUBSCRIBE_STATE.ING,
  });
  await Subscribe.create({
    lastPrice: 5000,
    FanStepId: 1,
    subscriberId: 122,
    subscribingId: fasm.id,
    step: 1,
    subscribeCount: 1,
    subscribedAt: new Date(),
    subscribeState: SUBSCRIBE_STATE.ING,
  });
  await Subscribe.create({
    lastPrice: 5000,
    FanStepId: 1,
    subscriberId: 123,
    subscribingId: fasm.id,
    step: 1,
    subscribeCount: 1,
    subscribedAt: new Date(),
    subscribeState: SUBSCRIBE_STATE.ING,
  });
  await Subscribe.create({
    lastPrice: 5000,
    FanStepId: 1,
    subscriberId: 124,
    subscribingId: fasm.id,
    step: 1,
    subscribeCount: 1,
    subscribedAt: new Date(),
    subscribeState: SUBSCRIBE_STATE.ING,
  });
  await Subscribe.create({
    lastPrice: 5000,
    FanStepId: 1,
    subscriberId: 125,
    subscribingId: fasm.id,
    step: 1,
    subscribeCount: 1,
    subscribedAt: new Date(),
    subscribeState: SUBSCRIBE_STATE.ING,
  });
  await Subscribe.create({
    lastPrice: 5000,
    FanStepId: 1,
    subscriberId: 126,
    subscribingId: fasm.id,
    step: 1,
    subscribeCount: 1,
    subscribedAt: new Date(),
    subscribeState: SUBSCRIBE_STATE.ING,
  });
  await Subscribe.create({
    lastPrice: 5000,
    FanStepId: 1,
    subscriberId: 127,
    subscribingId: fasm.id,
    step: 1,
    subscribeCount: 1,
    subscribedAt: new Date(),
    subscribeState: SUBSCRIBE_STATE.ING,
  });
  await Subscribe.create({
    lastPrice: 5000,
    FanStepId: 1,
    subscriberId: 128,
    subscribingId: fasm.id,
    step: 1,
    subscribeCount: 1,
    subscribedAt: new Date(),
    subscribeState: SUBSCRIBE_STATE.ING,
  });
  await Subscribe.create({
    lastPrice: 5000,
    FanStepId: 1,
    subscriberId: 129,
    subscribingId: fasm.id,
    step: 1,
    subscribeCount: 1,
    subscribedAt: new Date(),
    subscribeState: SUBSCRIBE_STATE.ING,
  });
  await Subscribe.create({
    lastPrice: 5000,
    FanStepId: 1,
    subscriberId: 130,
    subscribingId: fasm.id,
    step: 1,
    subscribeCount: 1,
    subscribedAt: new Date(),
    subscribeState: SUBSCRIBE_STATE.ING,
  });
  await Subscribe.create({
    lastPrice: 5000,
    FanStepId: 1,
    subscriberId: 131,
    subscribingId: fasm.id,
    step: 1,
    subscribeCount: 1,
    subscribedAt: new Date(),
    subscribeState: SUBSCRIBE_STATE.ING,
  });
  await Subscribe.create({
    lastPrice: 5000,
    FanStepId: 1,
    subscriberId: 132,
    subscribingId: fasm.id,
    step: 1,
    subscribeCount: 1,
    subscribedAt: new Date(),
    subscribeState: SUBSCRIBE_STATE.ING,
  });
  await Subscribe.create({
    lastPrice: 5000,
    FanStepId: 1,
    subscriberId: 133,
    subscribingId: fasm.id,
    step: 1,
    subscribeCount: 1,
    subscribedAt: new Date(),
    subscribeState: SUBSCRIBE_STATE.ING,
  });
  await Subscribe.create({
    lastPrice: 5000,
    FanStepId: 1,
    subscriberId: 134,
    subscribingId: fasm.id,
    step: 1,
    subscribeCount: 1,
    subscribedAt: new Date(),
    subscribeState: SUBSCRIBE_STATE.ING,
  });
  await Subscribe.create({
    lastPrice: 5000,
    FanStepId: 1,
    subscriberId: 135,
    subscribingId: fasm.id,
    step: 1,
    subscribeCount: 1,
    subscribedAt: new Date(),
    subscribeState: SUBSCRIBE_STATE.ING,
  });

  return;

  await User.update(
    {
      roles: USER_ROLE.NORMAL_USER,
      nick: "화창한날",
      link: "@18278172182182",
    },
    {
      where: {
        id: 6,
      },
    }
  );

  const testUser = await User.findOne({
    where: {
      email: "test@gmail.com",
    },
  });
  console.log(testUser);
  return;

  const phone: string = "";
  const email: string = "test@gmail.com";
  const age: string = "20";
  const password: string = "test";

  const gender: number = USER_GENDER.GIRL;
  const nick: string = "우리가";
  const profile: string = `${process.env.CLOUD_FRONT_STORAGE}/girl.png`;
  const country: string = "ko";

  const exUser = await User.findOne({
    where: {
      email,
    },
  });
  if (exUser) return;

  return;

  await User.update(
    {
      roles: USER_ROLE.BAN_USER,
    },
    {
      where: {
        nick: "fake user",
      },
    }
  );

  return;
  const crea = await User.findOne({
    where: {
      link: "@__ulliling",
    },
  });
  const userfsa = await User.findAll({
    where: {
      gender: USER_GENDER.BOY,
    },
  });
  userfsa?.forEach((list: any) => {
    FCMPushNotification(
      "빅쮸 등장!",
      "인스타그램 셀럽 빅쮸님이 앤모먼트에 가입했습니다 💕",
      list?.pushToken,
      crea?.profile,
      {
        screen: "Profile",
        YouId: crea?.id.toString(),
      }
    );
  });
  return;

  //tralvel91moment99@

  const uas = await User.findAll({
    where: {
      roles: USER_ROLE.CS_USER,
    },
  });
  console.log(uas);
  return;

  await Point.increment(
    {
      amount: 1000,
    },
    {
      where: {
        UserId: {
          [Op.not]: null,
        },
      },
    }
  );
  return;

  const userd = await User.findAll({});
  for await (const list of userd) {
    console.log(list?.phone);
  }
  return;
  //console.log()
  /*
  await Payment.create({
    price: 1000,
    platform: 'WEB',
    type: '1',
    refund: 0,
    UserId: 5,
  })
  await Payment.create({
    price: 1000,
    platform: 'WEB',
    type: '1',
    refund: 0,
    UserId: 5,
  })
  await Payment.create({
    price: 1000,
    platform: 'WEB',
    type: '1',
    refund: 0,
    UserId: 5,
  })
  await Payment.create({
    price: 1000,
    platform: 'WEB',
    type: '1',
    refund: 0,
    UserId: 5,
  })
  await Payment.create({
    price: 1000,
    platform: 'WEB',
    type: '1',
    refund: 0,
    UserId: 5,
  })
  await Payment.create({
    price: 1000,
    platform: 'WEB',
    type: '1',
    refund: 0,
    UserId: 5,
  })
  await Payment.create({
    price: 1000,
    platform: 'WEB',
    type: '1',
    refund: 0,
    UserId: 5,
  })
  await Payment.create({
    price: 1000,
    platform: 'WEB',
    type: '1',
    refund: 0,
    UserId: 5,
  })
  await Payment.create({
    price: 1000,
    platform: 'WEB',
    type: '1',
    refund: 0,
    UserId: 5,
  })
  await Payment.create({
    price: 1000,
    platform: 'WEB',
    type: '1',
    refund: 0,
    UserId: 5,
  })
  await Payment.create({
    price: 1000,
    platform: 'WEB',
    type: '1',
    refund: 0,
    UserId: 5,
  })
  await Payment.create({
    price: 1000,
    platform: 'WEB',
    type: '1',
    refund: 0,
    UserId: 5,
  })


  return
  */
  await Point.increment(
    {
      amount: 10000,
    },
    {
      where: {
        id: {
          [Op.not]: 0,
        },
      },
    }
  );
  return;
  const sub = await Subscribe.update(
    {
      FanStepId: 1,
    },
    {
      where: {
        subscribingId: 5,
      },
    }
  );
  console.log(sub);

  return;

  await User.update(
    {
      callState: false,
    },
    {
      where: {
        callState: true,
      },
    }
  );
  return;

  FCMPushNotification(
    "hi",
    "contnet",
    `efWXb_pi50iwksoCIGpwBZ:APA91bHwXPL6WJn3ZeY8RHvkim7GfqhIwRfQc24xSb0VMuprLvlGa48QvzcMhkIIq1FF27HyjzwhEhqpYWMegLfAOc9lXlXCkzKya9vzf-3W1jXrJdKmvIx-XXCzU6MTcAZZkgMAy2XU`,
    undefined,
    {
      screen: "Chat",
      RoomId: 2,
    }
  );

  return;

  await Point.increment(
    {
      amount: 100000,
    },
    {
      where: {
        UserId: 201,
      },
    }
  );
  await Point.increment(
    {
      amount: 100000,
    },
    {
      where: {
        UserId: 202,
      },
    }
  );

  await Score.update(
    {
      time1: 1,
      time2: 10,
      time3: 50,
      time4: 1000,
      score1: 2,
      score2: 3,
      score3: 6,
      score4: 10,
      score5: 5,
    },
    {
      where: {
        UserId: 202,
      },
    }
  );
  await CallHistory.create({
    UserId: 201,
    UserIdByCreatedAt: 201,
    time: 5,
  });
  await CallHistory.create({
    UserId: 201,
    UserIdByCreatedAt: 201,
    time: 80,
  });
  await CallHistory.create({
    UserId: 201,
    UserIdByCreatedAt: 201,
    time: 40,
  });
  await CallHistory.create({
    UserId: 202,
    UserIdByCreatedAt: 202,
    time: 60,
  });
  await CallHistory.create({
    UserId: 202,
    UserIdByCreatedAt: 202,
    time: 12,
  });
  await CallHistory.create({
    UserId: 202,
    UserIdByCreatedAt: 202,
    time: 30,
  });
  return;
  const userf = await User.findOne({
    include: [
      { model: CallHistory, as: "CallHistoriesByCreatedAt" },
      { model: CallHistory, as: "CallHistories" },
    ],
    where: {
      id: 2,
    },
  });
  console.log(userf);

  return;

  await Point.increment(
    {
      amount: 100000,
    },
    {
      where: {
        UserId: 4,
      },
    }
  );
  await Point.increment(
    {
      amount: 100000,
    },
    {
      where: {
        UserId: 5,
      },
    }
  );
  return;

  Alarm.create({
    type: ALARM_TYPE.ALARM_POST,
    UserId: 7,
    YouId: 2,
    content: "ggggg",
    PostId: 1,
  });
  Alarm.create({
    type: ALARM_TYPE.ALARM_POST,
    UserId: 7,
    YouId: 6,
    content: "ggggg",
    PostId: 1,
  });
  return;
  await Score.create({
    UserId: 2,
    time1: 1,
    time2: 10,
    time3: 50,
    time4: 1000,
    score1: 2,
    score2: 3,
    score3: 6,
    score4: 10,
    score5: 5,
  });
  await Score.create({
    UserId: 6,
    time1: 1,
    time2: 10,
    time3: 50,
    time4: 1000,
    score1: 2,
    score2: 3,
    score3: 6,
    score4: 10,
    score5: 5,
  });
  await Score.create({
    UserId: 7,
    time1: 1,
    time2: 10,
    time3: 50,
    time4: 10,
    score1: 2,
    score2: 3,
    score3: 6,
    score4: 10,
    score5: 5,
  });
  await CallHistory.create({
    UserId: 7,
    time: 10,
  });
  return;
  const user = await User.findAll({});
  console.log(user);

  //2,6,7,
  await CallHistory.create({
    UserId: 7,
    time: 10,
  });
  await CallHistory.create({
    UserId: 7,
    time: 40,
  });
  await CallHistory.create({
    UserId: 7,
    time: 30,
  });
  return;
  /*
    await User.create({
      phone: '5',
    })
    await User.create({
      phone: '6',
    })
    await User.create({
      phone: '7',
    })
    await User.create({
      phone: '8',
    })
  
    const user = await User.findAll({
  
    })
    console.log(user)
    return
    */
  const user1: any = await User.findOne({
    where: {
      phone: "5",
    },
    //lastVisit: new Date(),
  });
  const user2: any = await User.findOne({
    where: {
      phone: "6",
    },
    //lastVisit: new Date(),
  });
  const user3: any = await User.findOne({
    where: {
      phone: "7",
    },
    //lastVisit: new Date(),
  });
  const user4: any = await User.findOne({
    where: {
      phone: "8",
    },
    //lastVisit: new Date(),
  });
  /*
    await Ban.create({
      bannerId: user1.id,
      banningId: user2.id
    })
    await Ban.create({
      bannerId: user3.id,
      banningId: user1.id
    })
    */

  console.log("success");

  await axios
    .get("http://localhost:5050/user/liveList", {
      params: {
        gender: 1,
        country: null,
        global: false,
        pageNum: 1,
        pageSize: 10,
        id: user1.id,
      },
    })
    .then((res) => {
      console.log(res.data);
    })
    .catch((err) => {
      console.error(err);
    });

  return;

  /*
  await axios
    .post(`http://localhost:5050/user/loginLocal`, {
      email: 'a@gmail.com',
      password: 'a',
    })
    .then((res) => {
      console.log(res.data)
    })
    .catch((err) => {
      console.error(err)
    })
  return
  */
  await axios
    .put(
      `http://localhost:5050/user/modify`,
      {
        nick: "이름",
        password: "a",
        phone: "01012341234",
        address: "123123",
      },
      {
        headers: {
          authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZXMiOjEsImlhdCI6MTY4NDY4MDI1NSwiZXhwIjoxNjg0NjgzODU1fQ.MwaaLq9WOykewcc8_8tyaDkXKSKQPU6SDG7syOJEKgA`,
        },
      }
    )
    .then((res) => {
      console.log(res.data);
    })
    .catch((err) => {
      console.error(err);
    });
}
fetchData();
