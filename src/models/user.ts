import {
  Model, DataTypes, BelongsToManyGetAssociationsMixin,
  HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
  BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
  dbType,
  Account, Alarm, AlarmSetting, Point, Score, Comment, CommentChild,
  PointHistory, Chat, Exchange, Item, Payment, Post, Follow, UserRoom, Wish, Ban,
  CallHistory, Authority, SocialLogin, Card, CreatorAuth, FanStep, Benifit, Money
} from './index';
import { sequelize } from './sequelize';

class User extends Model {
  public readonly id!: number;
  public sns: string;
  public cnv_id: string;
  public snsId: string;
  public phone: string;
  public link: string
  public linkChange: boolean
  public adultPage: boolean
  public password: string;
  public birthday: string;
  public email: string;
  public name: string;
  public country: string
  public nick: string;
  public profile: string
  public background: string
  public introduce: string;
  public suggestion: number;
  public callState: number
  public age: number;
  public gender: number;
  public real_birthday: number;
  public real_gender: number;
  public lastVisit: Date
  public attendanceCheck: Date
  public roles: number
  public banReason: string
  public refreshToken: string
  public pushToken: string
  public apnsToken: string
  public ticket: number
  public soundOn: Boolean;
  public withdrawState: Boolean
  public withdrawApplyedAt: Date;
  public nextMonthExchange: Boolean;
  public exchangeShow: Boolean;
  public postShowApp: Boolean;
  public backgroundApnsOn: Boolean;
  public totalTime: number;
  public avgTime: number;
  public code: string;
  public adCode: string;
  public adPercent: number;


  public readonly deletedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly Account?: Account;
  public readonly Point?: Point;
  public readonly Score?: Score;
  public readonly AlarmSetting?: AlarmSetting;
  public readonly Card?: Card;
  public readonly CreatorAuth?: CreatorAuth;
  public readonly Item?: Item;
  public readonly Money?: Money;

  public readonly Alarms?: Alarm[];
  public readonly Comments?: Comment[];
  public readonly CommentChilds?: CommentChild[];
  public readonly PointHistorys?: PointHistory[];
  public readonly Chats?: Chat[];
  public readonly Exchanges?: Exchange[];
  public readonly Payments?: Payment[];
  public readonly Posts?: Post[];
  public readonly Authoritys?: Authority[];
  public readonly SocialLogins?: SocialLogin[];
  public readonly CallHistorys?: CallHistory[];
  public readonly FanSteps?: FanStep[];
  public readonly Benifits?: Benifit[];

  public readonly Wishes?: Wish[];
  public readonly UserRooms?: UserRoom[];
  public readonly Banners?: User[];
  public readonly Bannings?: User[];
  public readonly Followers?: User[];
  public readonly Follwings?: User[];
  public readonly Subscribers?: User[];
  public readonly Subscribings?: User[];
}
User.init({
  cnv_id: {
    type: DataTypes.STRING(200),
    defaultValue: null,
    allowNull: true,
    unique: false,
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: false,
  },
  sns: {
    type: DataTypes.STRING(200),
    defaultValue: null,
    allowNull: true,
    unique: false,
  },
  snsId: {
    type: DataTypes.STRING(200),
    defaultValue: null,
    allowNull: true,
    unique: false,
  },
  link: {
    type: DataTypes.STRING(30),
    allowNull: true,
    unique: true,
  },
  linkChange: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: true,
    unique: false,
  },
  adultPage: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: true,
    unique: false,
  },
  email: {
    type: DataTypes.STRING(200),
    allowNull: true,
    unique: false,
  },
  password: {
    type: DataTypes.STRING(200),
    allowNull: true,
    unique: false,
  },
  birthday: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: false,
  },
  name: {
    type: DataTypes.STRING(40),
    allowNull: true,
    unique: false,
  },
  country: {
    type: DataTypes.STRING(10),
    allowNull: true,
    unique: false,
  },
  nick: {
    type: DataTypes.STRING(40),
    allowNull: true,
    unique: false,
  },
  profile: {
    type: DataTypes.STRING(200),
    allowNull: true,
    unique: false,
  },
  background: {
    type: DataTypes.STRING(200),
    allowNull: true,
    unique: false,
  },
  introduce: {
    type: DataTypes.STRING(300),
    allowNull: true,
    unique: false,
  },
  code: {
    type: DataTypes.STRING(50),
    defaultValue: '',
    allowNull: true,
    unique: false,
  },
  suggestion: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: true,
    unique: false,
  },
  adCode: {
    type: DataTypes.STRING(50),
    defaultValue: '',
    allowNull: true,
    unique: false,
  },
  adPercent: {
    type: DataTypes.INTEGER,
    defaultValue: 20,
    allowNull: true,
    unique: false,
  },
  age: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: true,
    unique: false,
  },
  gender: {
    type: DataTypes.INTEGER,
    defaultValue: 1, // 1 여자 , 2 남자
    allowNull: true,
    unique: false,
  },
  soundOn: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: true,
    unique: false,
  },
  postShowApp: {//게시글 앱에서 보는거
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: true,
    unique: false,
  },
  nextMonthExchange: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: true,
    unique: false,
  },
  exchangeShow: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: true,
    unique: false,
  },
  avgTime: {//영상통화 평균시간
    type: DataTypes.FLOAT,
    defaultValue: 0,
    allowNull: true,
    unique: false,
  },
  totalTime: {//영상통화 총시간
    type: DataTypes.FLOAT,
    defaultValue: 0,
    allowNull: true,
    unique: false,
  },

  ticket: {//영상통화 티켓
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: true,
    unique: false,
  },
  withdrawState: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: true,
    unique: false,
  },
  withdrawApplyedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    unique: false,
  },

  real_birthday: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: false,
  },
  real_gender: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: false,
  },
  callState: {   // 0 no,1 연결
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: true,
    unique: false,
  },
  lastVisit: {
    type: DataTypes.DATE,
    allowNull: true,
    unique: false,
  },
  attendanceCheck: {
    type: DataTypes.DATE,
    allowNull: true,
    unique: false,
  },
  roles: {
    // 1 일반 유저 //2 mcn //3 ban //4 cs //5 관리자 //6 탈퇴자
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: false,
    defaultValue: 1,
  },
  banReason: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: false,
  },
  refreshToken: {
    type: DataTypes.STRING(200),
    allowNull: true,
    unique: false,
  },
  pushToken: {
    type: DataTypes.STRING(200),
    allowNull: true,
    unique: false,
  },
  apnsToken: {
    type: DataTypes.STRING(200),
    allowNull: true,
    defaultValue: null,
    unique: false,
  },
  backgroundApnsOn: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: true,
    unique: false,
  },
}, {
  sequelize,
  timestamps: true,
  underscored: false,
  modelName: 'User',
  tableName: 'users',
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
  indexes: [
    {
      name: 'user_nick',
      fields: ['nick'],
    },
    {
      name: 'user_link',
      fields: ['link'],
    },
    {
      name: 'user_phone',
      fields: ['phone'],
    },
    {
      name: 'user_email',
      fields: ['email'],
    },
    {
      name: 'user_refreshToken',
      fields: ['refreshToken'],
    },
    {
      name: 'user_pushToken',
      fields: ['pushToken'],
    },
    {
      name: 'user_apnsToken',
      fields: ['apnsToken'],
    },
    {
      name: 'user_lastVisit',
      fields: ['lastVisit'],
    }
  ],
});

export const associate = (db: dbType) => {
  db.User.hasOne(db.Account)
  db.User.hasOne(db.AlarmSetting)
  db.User.hasOne(db.Point)
  db.User.hasOne(db.Score)
  db.User.hasOne(db.Item)
  db.User.hasOne(db.Card)
  db.User.hasOne(db.CreatorAuth)
  db.User.hasOne(db.Money)
  db.User.hasOne(db.LastScreen)


  db.User.hasMany(db.Benifit)
  db.User.hasMany(db.FanStep)
  db.User.hasMany(db.SocialLogin)
  db.User.hasMany(db.Alarm)
  db.User.hasMany(db.Comment)
  db.User.hasMany(db.CommentChild)
  db.User.hasMany(db.PointHistory)



  db.User.hasMany(db.Chat)
  db.User.hasMany(db.Exchange)

  db.User.hasMany(db.Payment)

  db.User.hasMany(db.Post)
  db.User.hasMany(db.CallHistory)
  db.User.hasMany(db.CallHistory, {
    as: 'CallHistoriesByCreatedAt',
    foreignKey: {
      name: 'UserIdByCreatedAt',
    }
  })

  db.User.belongsToMany(db.User, {
    through: 'Follow',
    as: 'Followers',
    foreignKey: 'followingId',
  });
  db.User.belongsToMany(db.User, {
    through: 'Follow',
    as: 'Followings',
    foreignKey: 'followerId',
  });

  db.User.belongsToMany(db.User, {
    through: 'Subscribe',
    as: 'Subscribers',
    foreignKey: 'subscribingId',
  });
  db.User.belongsToMany(db.User, {
    through: 'Subscribe',
    as: 'Subscribings',
    foreignKey: 'subscriberId',
  });


  db.User.belongsToMany(db.User, {
    through: 'Donation',
    as: 'Donationers',
    foreignKey: 'donationingId',
  });
  db.User.belongsToMany(db.User, {
    through: 'Donation',
    as: 'Donationings',
    foreignKey: 'donationerId',
  });


  db.User.belongsToMany(db.User, {
    through: 'Ban',
    as: 'Banners',
    foreignKey: 'banningId',
  });
  db.User.belongsToMany(db.User, {
    through: 'Ban',
    as: 'Bannings',
    foreignKey: 'bannerId',
  });

  db.User.belongsToMany(db.User, {
    through: 'Mcn',
    as: 'Mcners',
    foreignKey: 'mcningId',
  });
  db.User.belongsToMany(db.User, {
    through: 'Mcn',
    as: 'Mcnings',
    foreignKey: 'mcnerId',
  });

  db.User.hasMany(db.UserRoom)
  db.User.hasMany(db.Wish)
  db.User.hasMany(db.Authority)

};

export default User;
