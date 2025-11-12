import axios from "axios";
import {
  USER_ATTRIBUTE,
  USER_GENDER,
  USER_ROLE,
} from "../constant/user-constant";
import {
  Account,
  Alarm,
  AlarmSetting,
  Ban,
  CallHistory,
  Card,
  CreatorAuth,
  Item,
  Money,
  Point,
  Score,
  User,
} from "../models";
import bcrypt from "bcrypt";
import { refresh } from "../api/middlewares/jwt-util";
import AuthService from "../services/authService";

async function makeCS() {
  //tralvel91moment99@
  const phone: string = "010cs";
  const email: string = "videoit2025@gmail.com";
  const age: string = "20";
  const password: string = process.env.CS_PASSWORD as string;

  const gender: number = USER_GENDER.GIRL;
  const nick: string = "videoit 관리자";
  const profile: string = `${process.env.CLOUD_FRONT_STORAGE}/icon_round.png`;
  const country: string = "ko";

  const exUser = await User.findOne({
    where: {
      phone,
    },
  });
  if (exUser) return;

  const hash = await bcrypt.hash(password, 12);
  const refreshToken = refresh();
  let link = "@videoit_cs";

  const cs = await User.create({
    phone,
    email,
    age,
    link,
    password: hash,
    gender,
    nick,
    profile,
    country,
    roles: USER_ROLE.CS_USER,
    refreshToken,
  });

  await Account.create({
    UserId: cs.id,
  });
  await AlarmSetting.create({
    UserId: cs.id,
  });
  await Point.create({
    UserId: cs.id,
  });
  await Score.create({
    UserId: cs.id,
  });
  await Item.create({
    UserId: cs.id,
  });
  await Card.create({
    UserId: cs.id,
  });
  await CreatorAuth.create({
    UserId: cs.id,
  });
  await Money.create({
    UserId: cs.id,
  });
}
async function makeAdmin() {
  const phone: string = "010admin";
  const email: string = "app@videoit.net";
  const age: string = "20";
  const password: string = process.env.ADMIN_PASSWORD as string;

  const gender: number = USER_GENDER.BOY;
  const nick: string = "videoit 어드민";
  const profile: string = `${process.env.CLOUD_FRONT_STORAGE}/icon_round.png`;
  const country: string = "ko";

  const exUser = await User.findOne({
    where: {
      phone,
    },
  });
  if (exUser) return;

  const hash = await bcrypt.hash(password, 12);
  const refreshToken = refresh();
  let link = "@videoit_admin";

  const admin = await User.create({
    phone,
    email,
    age,
    link,
    password: hash,
    gender,
    nick,
    profile,
    country,
    roles: USER_ROLE.ADMIN_USER,
    refreshToken,
  });

  await Account.create({
    UserId: admin.id,
  });
  await AlarmSetting.create({
    UserId: admin.id,
  });
  await Point.create({
    UserId: admin.id,
  });
  await Score.create({
    UserId: admin.id,
  });
  await Item.create({
    UserId: admin.id,
  });
  await Card.create({
    UserId: admin.id,
  });
  await CreatorAuth.create({
    UserId: admin.id,
  });
  await Money.create({
    UserId: admin.id,
  });
}

async function makeFakeUser() {
  const fakeList = [];
  for (let i = 0; i < 200; i++) {
    fakeList.push(i);
  }
  for await (let list of fakeList) {
    const phone: string = `0fake${list}`;
    const email: string = `fake${list}@nmoment.live`;
    const age: string = "20";
    const password: string = "1234"; //process.env.FAKE_PASSWORD as string;

    const gender: number = list > 100 ? USER_GENDER.BOY : USER_GENDER.GIRL;
    const nick: string = "fake user";
    const profile: string =
      list > 100
        ? `${process.env.CLOUD_FRONT_STORAGE}/boy.png`
        : `${process.env.CLOUD_FRONT_STORAGE}/girl.png`;
    const country: string = "ko";

    const exUser = await User.findOne({
      where: {
        phone,
      },
    });
    if (exUser) return;

    const hash = await bcrypt.hash(password, 12);
    const refreshToken = refresh();
    const randomNumber = await AuthService.generate6DigitRandom();
    let link = `@${list}${randomNumber}`;
    const user = await User.create({
      phone,
      email,
      age,
      link,
      password: hash,
      gender,
      nick,
      profile,
      country,
      roles: USER_ROLE.NORMAL_USER,
      refreshToken,
      lastVisit: new Date(),
    });

    await Account.create({
      UserId: user.id,
    });
    await AlarmSetting.create({
      UserId: user.id,
    });
    await Point.create({
      UserId: user.id,
    });
    await Score.create({
      UserId: user.id,
    });
    await Item.create({
      UserId: user.id,
    });
    await Card.create({
      UserId: user.id,
    });
    await CreatorAuth.create({
      UserId: user.id,
    });
    await Money.create({
      UserId: user.id,
    });
  }
}
makeAdmin();
makeCS();
makeFakeUser();
