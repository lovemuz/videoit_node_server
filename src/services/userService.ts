import { User, Container, sequelize, Ban, Rank, Post, Follow, SocialLogin, Score, CallHistory, Account, AlarmSetting, Point, PointHistory, Item, Card, CreatorAuth, Money, Alarm, Comment, CommentChild, Authority, Benifit, FanStep, Wish, Subscribe, Room, Chat, UserRoom, Mcn, Info, LastScreen } from '../models/index'
import bcrypt from 'bcrypt'
import { logger } from '../config/winston'
//import { PAYMENT_STATE } from '../constant/payment-constant'
import Sequelize from 'sequelize'
import { refresh, sign } from '../api/middlewares/jwt-util'
import { USER_ATTRIBUTE, USER_GENDER, USER_ROLE } from '../constant/user-constant'
import { v4 } from 'uuid';
import { COUNTRY_LIST } from '../constant/country-constant'
import { POINT_HISTORY } from '../constant/point-constant'
import { CALL_TYPE } from '../constant/call-constant'
import { BAN_KEYWORD } from '../constant/ban-constant'
import { getValue } from '../api/middlewares/redis'
import { slackPostMessage } from '../api/middlewares/slack'
import { SLACK_CHANNEL } from '../constant/slack-constant'


const Op = Sequelize.Op

class UserService {
  constructor() { }


  //getMcnList

  static async getCsMcnList(req: any) {
    try {
      const mcnList: any = await User.findAll({
        include: [{
          model: User,
          include: [{ model: Point }, { model: Money }, { model: CreatorAuth }],
          as: 'Mcners',
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE
          },
        }, { model: Point }, { model: Money }, { model: CreatorAuth }],
        where: {
          roles: USER_ROLE.COMPANY_USER,
        }
      })

      return mcnList
    } catch (err) {
      logger.error('getMcnList')
      logger.error(err)
      return []
    }
  }


  static async getMcnListByJoin(req: any) {
    try {
      const UserId: number = req.id

      const mcnList: any = await User.findAll({
        include: [{
          model: User,
          include: [{ model: Point }, { model: Money }, { model: CreatorAuth }],
          as: 'Mcners',
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE_MCN_TEST123
          },
        }, { model: Point }, { model: Money }, { model: CreatorAuth }],
        where: {
          roles: USER_ROLE.COMPANY_USER,
          id: UserId
        },
        order: [[{ model: User, as: 'Mcners' }, 'createdAt', 'DESC']],
      })
      return mcnList
    } catch (err) {
      logger.error('getMcnList')
      logger.error(err)
      return []
    }
  }

  static async getMcnList(req: any) {
    try {
      const UserId: number = req.id


      /*if (UserId === 4613 || UserId === 34390) {
        const mcnList: any = await User.findAll({
          include: [{
            model: User,
            include: [{ model: Point }, { model: Money }, { model: CreatorAuth }],
            as: 'Mcners',
            attributes: {
              exclude: USER_ATTRIBUTE.EXCLUDE_MCN_TEST123
            },
          }, { model: Point }, { model: Money }, { model: CreatorAuth }],
          where: {
            roles: USER_ROLE.COMPANY_USER,
            id: UserId
          }
        })
        return mcnList
      } else {
       */
      const mcnList: any = await User.findAll({
        include: [{
          model: User,
          include: [{ model: Point }, { model: Money }, { model: CreatorAuth }],
          as: 'Mcners',
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE_MCN_TEST123
          },
        }, { model: Point }, { model: Money }, { model: CreatorAuth }],
        where: {
          roles: USER_ROLE.COMPANY_USER,
          id: UserId
        }
      })
      const after = mcnList[0].Mcners?.sort((a: any, b: any) => {
        return (b.Point.amount + b.Money.amount) - (a.Point.amount + a.Money.amount)
      })
      mcnList[0].Mcners = after
      return mcnList
      // }

    } catch (err) {
      logger.error('getMcnList')
      logger.error(err)
      return []
    }
  }


  static async changePassword(req: any, transaction: any) {
    try {

      const password: string = req.body.password
      const UserId: number = req.id

      const hash = await bcrypt.hash(password, 12)
      const refreshToken = refresh()
      await User.update({
        password: hash,
      },
        {
          where: {
            id: UserId
          },
          transaction
        }
      )
      return true
    } catch (err) {
      logger.error('changePassword')
      logger.error(err)
      return null
    }
  }

  static async changeCharge(req: any, transaction: any) {
    try {
      const platformSubscribeCharge = req.body.platformSubscribeCharge
      const platformPointCharge = req.body.platformPointCharge;
      const UserId: number = req.body.UserId
      await CreatorAuth.update({
        platformSubscribeCharge,
        platformPointCharge
      }, {
        where: {
          UserId
        }, transaction
      })
      return true
    } catch (err) {
      logger.error('changeCharge')
      logger.error(err)
      return null
    }
  }
  static async getUserCharge(req: any) {
    try {
      const link: number = req.query.link
      const user: any = await User.findOne({
        where: {
          link
        }
      })
      const creatorAuth = await CreatorAuth.findOne({
        include: [{ model: User }],
        where: {
          UserId: user.id
        }
      })
      return creatorAuth
    } catch (err) {
      logger.error('getUserCharge')
      logger.error(err)
      return null
    }
  }
  static async getCreatorAuth(req: any) {
    try {
      const UserId: number = req.id
      const creatorAuth = await CreatorAuth.findOne({
        where: {
          UserId
        }
      })
      return creatorAuth
    } catch (err) {
      logger.error('getCreatorAuth')
      logger.error(err)
      return null
    }
  }
  static async getCallPrice(UserId: number, transaction?: any) {
    try {
      if (transaction) {
        const creatorAuth = await CreatorAuth.findOne({
          where: {
            UserId
          }, transaction
        })
        return creatorAuth
      } else {
        const creatorAuth = await CreatorAuth.findOne({
          where: {
            UserId
          }
        })
        return creatorAuth
      }

    } catch (err) {
      logger.error('getCreatorAuth')
      logger.error(err)
      return null
    }
  }

  static async csRankFromCreator(req: any) {
    const pageNum: number = req.query.pageNum
    const pageSize: number = req.query.pageSize
    const rankList: any = await User.findAll({
      subQuery: false,
      include: [{
        model: Point
      }, {
        model: Money
      }, {
        model: CreatorAuth
      }],
      order: [
        [sequelize.col("total_sal"), 'DESC'],
        ['lastVisit', 'DESC']],
      offset: Number(pageNum * pageSize),
      limit: Number(pageSize),
      attributes: {
        exclude: USER_ATTRIBUTE.EXCLUDE,
        include: [
          [
            Sequelize.fn(
              'SUM',
              Sequelize.where(Sequelize.col('Point.amount'), '+', Sequelize.col('Money.amount'))
            ),
            'total_sal',
          ],
          //[sequelize.fn('SUM', (sequelize.fn('COALESCE', (sequelize.col('Point.amount')), 0), sequelize.literal('+'), sequelize.fn('COALESCE', (sequelize.col('Money.amount')), 0))), 'total_sal'],
          //[Sequelize.fn('SUM', Sequelize.col('Point.amount')), 'pAmount'],
          //[Sequelize.fn('SUM', Sequelize.col('Money.amount')), 'mAmount'],
        ],
      },
      group: ['id'],
    })
    return rankList
  }

  static async searchUser(req: any) {
    try {
      const UserId: number = req.id
      const keyword: string = req.query.keyword
      const pageNum: number = 0
      const pageSize: number = 50

      const userList: User[] = await User.findAll({
        subQuery: false,
        include: [{
          model: User,
          as: 'Banners',
          where: {
            id: UserId,
          },
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE
          },
          required: false,
        }, {
          model: User,
          as: 'Bannings',
          where: {
            id: UserId,
          },
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE
          },
          required: false,
        }],
        where: {
          '$Banners.id$': null,
          '$Bannings.id$': null,
          roles: USER_ROLE.NORMAL_USER,
          [Op.or]: [
            { nick: { [Op.like]: `%${keyword}%` } },
            { link: { [Op.like]: `%${keyword}%` } },
          ],
        },
        order: [['lastVisit', 'DESC']],
        offset: Number(pageNum * pageSize),
        limit: Number(pageSize),
        attributes: {
          exclude: USER_ATTRIBUTE.EXCLUDE,
        },
        group: ['User.id']
      })
      return userList
    } catch (err) {
      logger.error('searchUser')
      logger.error(err)
      return null
    }
  }
  static async updateCallIngState(req: any, UserId: number, transaction: any) {
    try {
      await User.update({
        callState: CALL_TYPE.CALL_ING
      }, {
        where: {
          id: UserId,
        }, transaction
      })
      return true
    } catch (err) {
      logger.error('updateCallIngState')
      logger.error(err)
      return null
    }
  }
  static async updateCallEndState(req: any, UserId: number, transaction: any) {
    try {

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
          callState: CALL_TYPE.CALL_WAIT,
          // lastVisit: new Date(new Date().setMinutes(new Date().getMinutes() - 20)),
          lastVisit: new Date(),
        }, {
          where: {
            id: UserId
          }, transaction
        })
      } else {
        await User.update({
          lastVisit: new Date(),
          callState: CALL_TYPE.CALL_WAIT,
        }, {
          where: {
            id: UserId
          }, transaction
        })
      }

      return true
    } catch (err) {
      logger.error('updateCallEndState')
      logger.error(err)
      return null
    }
  }

  static async getCallAvgTimeOne(req: any, UserId: number) {
    try {
      const you: any = await User.findOne({
        subQuery: false,
        /*
        include: [{
          model: CallHistory,
          as: 'CallHistories',
          required: false,
        }],
        */
        where: {
          id: UserId
        },
        attributes: {
          exclude: USER_ATTRIBUTE.EXCLUDE,
          // include: [[Sequelize.fn('avg', Sequelize.col('CallHistories.time')), 'avgTime']]
        },
        // group: ['User.id']
      })
      return you
    } catch (err) {
      logger.error('getCallAvgTimeOne')
      logger.error(err)
      return null
    }
  }
  static async updateEmail(req: any, transaction: any) {
    try {
      const UserId: number = req.id
      const email = req.body.email
      await User.update({
        email
      }, {
        where: {
          id: UserId
        },
        transaction
      })

      return true
    } catch (err) {
      logger.error('updateEmail')
      logger.error(err)
      return null
    }
  }
  static async findLinkOne(link: string | null) {
    try {
      const user = await User.findOne({
        where: {
          link,
        },
        attributes: {
          exclude: ['password', 'refreshToken']
        },
      })
      return user
    } catch (err) {
      logger.error('findLinkOne')
      logger.error(err)
      return null
    }
  }

  static async snsUserCheck(req: any, transaction: any) {
    try {
      const email: string = req.body.email
      const sns: string = req.body.sns
      const snsId: string = req.body.snsId

      const socialLogin = await SocialLogin.findOne({
        where: {
          email,
          sns,
          snsId,
        }, transaction
      })
      if (socialLogin) {
        //const password = v4()
        //const hash = await bcrypt.hash(snsId, 12)
        const refreshToken = refresh()

        const user: any = await User.findOne({
          where: {
            id: socialLogin?.UserId
          }, transaction
        })

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


        const accessToken = sign({ id: user.id, roles: user.roles })
        return { user, password: snsId, refreshToken, accessToken, dupEmail: false }
      } else {
        return { user: null, password: null, refreshToken: null, accessToken: null, dupEmail: false }
      }
    } catch (err) {
      logger.error('snsUserCheck')
      logger.error(err)
      return null
    }
  }
  static async socialUserAdd(req: any, transaction: any) {
    try {
      const phone: string = req.body.phone
      const email: string = req.body.email
      const sns: string = req.body.sns
      const snsId: string = req.body.snsId

      const exUser = await User.findOne({
        where: {
          phone,
        }, transaction
      })
      if (exUser) {
        const socialLogin = await SocialLogin.create({
          UserId: exUser.id,
          email,
          sns,
          snsId,
        }, { transaction })
        const password = v4()
        const hash = await bcrypt.hash(password, 12)
        const refreshToken = refresh()
        await User.update({
          password: hash,
          refreshToken,
        },
          {
            where: {
              id: socialLogin.UserId
            },
            transaction
          }
        )
        const user: any = await User.findOne({
          where: {
            id: socialLogin?.UserId
          }, transaction
        })
        const accessToken = sign({ id: user.id, roles: user.roles })
        return { user, password, refreshToken, accessToken }
      }
      else return { user: null, password: null, refreshToken: null, accessToken: null }
    } catch (err) {
      logger.error('socialUserAdd')
      logger.error(err)
      return null
    }
  }

  static async loginLocalV2(req: any, transaction: any) {
    try {
      const password: string = req.body?.password
      const phone: string = req.body?.phone
      const email: string = req.body?.email

      const sns: string = req.body?.sns === 'null' ? null : req.body?.sns;
      const snsId: string = req.body.snsId === 'null' ? null : req.body.snsId


      let user = null, success = true, diffPass = false
      if (phone) {
        const exUser: any = await User.findOne({
          where: {
            phone,
            sns,
            snsId,
          },
          transaction
        })
        if (exUser) {
          const result = await bcrypt.compare(password, exUser?.password)
          if (result) {
            user = exUser
            success = true
            diffPass = false
          }
          else {
            success = false
            diffPass = true
          }
        }
      }
      if (email && !user) {
        const exUser: any = await User.findOne({
          where: {
            email,
            sns,
            snsId,
          },
          transaction
        })
        if (exUser) {
          const result = await bcrypt.compare(password, exUser?.password)
          if (result) {
            user = exUser
            success = true
            diffPass = false
          }
          else {
            success = false
            diffPass = true
          }
        }

      }

      if (user) {
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

        return {
          user,
          point,
          success,
          diffPass
        }
      }
      return {
        user: null,
        point: null,
        success: false
      }
    } catch (err) {
      logger.error('loginLocal')
      logger.error(err)
      return null
    }
  }

  static async loginLocal(req: any, transaction: any) {
    try {
      const password: string = req.body?.password
      const phone: string = req.body?.phone
      const email: string = req.body?.email


      let user = null, success = true, diffPass = false
      if (phone) {
        const exUserNotSns: any = await User.findOne({
          where: {
            phone,
            sns: null,
            snsId: null,
          },
          transaction
        })
        const exUserGoogle: any = await User.findOne({
          where: {
            phone,
            sns: 'google',
          },
          transaction
        })
        const exUserApple: any = await User.findOne({
          where: {
            phone,
            sns: 'apple',
          },
          transaction
        })

        let passwordSuccess = false
        if (exUserNotSns) {
          const result = await bcrypt.compare(password, exUserNotSns?.password)
          if (result) {
            passwordSuccess = true
            user = exUserNotSns
            success = true
            diffPass = false
          }
          else {
            success = false
            diffPass = true
          }
        } if (exUserGoogle && !passwordSuccess) {
          const result = await bcrypt.compare(password, exUserGoogle?.password)
          if (result) {
            passwordSuccess = true
            user = exUserGoogle
            success = true
            diffPass = false
          }
          else {
            success = false
            diffPass = true
          }
        }
        if (exUserApple && !passwordSuccess) {
          const result = await bcrypt.compare(password, exUserApple?.password)
          if (result) {
            passwordSuccess = true
            user = exUserApple
            success = true
            diffPass = false
          }
          else {
            success = false
            diffPass = true
          }
        }
      }
      if (email && !user) {

        const exUserNotSns: any = await User.findOne({
          where: {
            email,
            sns: null,
            snsId: null,
          },
          transaction
        })
        const exUserGoogle: any = await User.findOne({
          where: {
            email,
            sns: 'google',
          },
          transaction
        })
        const exUserApple: any = await User.findOne({
          where: {
            email,
            sns: 'apple',
          },
          transaction
        })

        let passwordSuccess = false
        if (exUserNotSns) {
          const result = await bcrypt.compare(password, exUserNotSns?.password)
          if (result) {
            passwordSuccess = true
            user = exUserNotSns
            success = true
            diffPass = false
          }
          else {
            success = false
            diffPass = true
          }
        } if (exUserGoogle && !passwordSuccess) {
          const result = await bcrypt.compare(password, exUserGoogle?.password)
          if (result) {
            passwordSuccess = true
            user = exUserGoogle
            success = true
            diffPass = false
          }
          else {
            success = false
            diffPass = true
          }
        }
        if (exUserApple && !passwordSuccess) {
          const result = await bcrypt.compare(password, exUserApple?.password)
          if (result) {
            passwordSuccess = true
            user = exUserApple
            success = true
            diffPass = false
          }
          else {
            success = false
            diffPass = true
          }
        }

      }

      if (user) {
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

        return {
          user,
          point,
          success,
          diffPass
        }
      }
      return {
        user: null,
        point: null,
        success: false
      }
    } catch (err) {
      logger.error('loginLocal')
      logger.error(err)
      return null
    }
  }

  static async updateIntroduce(req: any, transaction: any) {
    try {
      const UserId: number = req.id
      const nick: string = req.body.nick
      const link: string = req.body.link
      let introduce: string = req.body.introduce
      const profile: string = req.body.profile
      const background: string = req.body.background;

      const user = await User.findOne({
        where: {
          id: UserId
        }, transaction
      })
      const userLink = await User.findOne({
        where: {
          link: link
        }, transaction
      })
      if (user?.link !== link && user?.linkChange === false && userLink) {
        return [false, '이미 존재하는 링크입니다.']
      }
      else if (user?.link !== link && user?.linkChange === true) {
        return [false, '링크를 이미 바꾸었습니다.']
      }
      else if (link?.length >= 30 || nick?.length >= 40 || introduce?.length >= 300) {
        return [false, '글자수 제한 초과']
      }

      if (introduce) {
        for (let i = 0; i < BAN_KEYWORD.LIST.length; i++) {
          const redRegExp = new RegExp(BAN_KEYWORD.LIST[i], 'gi')
          introduce = introduce?.replace(redRegExp, "")
        }
      }


      if (user?.link !== link && user?.linkChange === false) {
        await User.update({
          nick,
          link,
          introduce,
          profile,
          linkChange: true,
          background,
        }, {
          where: {
            id: UserId
          }, transaction
        })
      } else {
        await User.update({
          nick,
          //link,
          introduce,
          profile,
          background
        }, {
          where: {
            id: UserId
          }, transaction
        })
      }
      return [true, '성공']
    } catch (err) {
      logger.error('updateIntroduce')
      logger.error(err)
      return [null, null]
    }
  }




  static async attendanceCheckV2(req: any, transaction: any) {
    try {
      const UserId: number = req.id

      const user: any = await User.findOne({
        where: {
          id: UserId
        }, transaction
      })
      const today = new Date(new Date().setHours(0, 0, 0, 0));//이전 자정
      // today.setHours(today.getHours() - 9)
      if (!user.attendanceCheck) {
        await User.update({
          attendanceCheck: new Date(),
        }, {
          where: {
            id: UserId
          },
          transaction
        })
        return 2
      }
      if (user.attendanceCheck > today) {

        return false
      }
      await User.update({
        attendanceCheck: new Date(),
      }, {
        where: {
          id: UserId
        },
        transaction
      })

      return true
    } catch (err) {
      logger.error('attendanceCheckV2')
      logger.error(err)
      return null
    }
  }
  static async attendanceCheck(req: any, transaction: any) {
    try {
      const UserId: number = req.id

      const user: any = await User.findOne({
        where: {
          id: UserId
        }, transaction
      })
      const today = new Date(new Date().setHours(0, 0, 0, 0));//이전 자정
      // today.setHours(today.getHours() - 9)

      if (!user.attendanceCheck) {
        return 2
      }
      if (user.attendanceCheck > today) {
        return false
      }


      return true
    } catch (err) {
      logger.error('attendanceCheck')
      logger.error(err)
      return null
    }
  }
  static async attendanceCheckAfter(req: any, transaction: any) {
    try {
      const UserId: number = req.id

      const user: any = await User.findOne({
        where: {
          id: UserId
        }, transaction
      })
      const today = new Date(new Date().setHours(0, 0, 0, 0));//이전 자정
      // today.setHours(today.getHours() - 9)

      if (user.attendanceCheck > today) {
        return false
      }
      await User.update({
        attendanceCheck: new Date(),
      }, {
        where: {
          id: UserId
        },
        transaction
      })
      return true
    } catch (err) {
      logger.error('attendanceCheck')
      logger.error(err)
      return null
    }
  }

  static async myBanList(req: any) {
    try {
      const pageNum: number = req.query.pageNum
      const pageSize: number = req.query.pageSize
      const UserId: number = req.id

      const banList: User[] = await User.findAll({
        include: [{
          model: User,
          as: 'Bannings',
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE
          },
          //required: false,
        }],
        where: {
          id: UserId,
        },
        attributes: {
          exclude: USER_ATTRIBUTE.EXCLUDE,
        },
        order: [['createdAt', 'DESC']],
        offset: Number(pageNum * pageSize),
        limit: Number(pageSize),
      })
      return banList;
    } catch (err) {
      logger.error('myBanList')
      logger.error(err)
      return null
    }
  }

  /*
  static async myMcnList(req: any) {
    try {
      const pageNum: number = req.query.pageNum
      const pageSize: number = req.query.pageSize
      const UserId: number = req.id

      const mcnList: User[] = await User.findAll({
        include: [{
          model: User,
          as: 'Bannings',
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE
          },
          //required: false,
        }],
        where: {
          id: UserId,
        },
        attributes: {
          exclude: USER_ATTRIBUTE.EXCLUDE,
        },
        order: [['createdAt', 'DESC']],
        offset: Number(pageNum * pageSize),
        limit: Number(pageSize),
      })
      return mcnList;
    } catch (err) {
      logger.error('myMcnList')
      logger.error(err)
      return null
    }
  }
  */

  static async createFollow(req: any, transaction: any) {
    try {
      const UserId: number = req.id
      const YouId: number = req.body.YouId

      const follow = await Follow.findOne({
        where: {
          followerId: UserId,
          followingId: YouId
        },
        transaction
      })
      if (follow) return true

      await Follow.create({
        followerId: UserId,
        followingId: YouId
      }, {
        transaction
      })

      return true
    } catch (err) {
      logger.error('createFollow')
      logger.error(err)
      return null
    }
  }



  static async createFollowFromProfile(req: any, transaction: any) {
    try {
      const UserId: number = req?.id
      let YouId: number = req.body?.YouId
      const link: string = req.body?.link
      const platform: string = req.body?.platform
      if (platform === 'web') {
        // const you: any = await UserService.findLinkOne(link)
        const you: any = await User.findOne({
          where: {
            link,
          },
          attributes: {
            exclude: ['password', 'refreshToken']
          },
        })
        YouId = you?.id
      }

      const follow = await Follow.findOne({
        where: {
          followerId: UserId,
          followingId: YouId
        },
        transaction
      })
      if (follow) return false

      await Follow.create({
        followerId: UserId,
        followingId: YouId
      }, {
        transaction
      })

      return true
    } catch (err) {
      logger.error('createFollowFromProfile')
      logger.error(err)
      return null
    }
  }
  static async removeFollow(req: any, transaction: any) {
    try {
      const UserId: number = req.id
      const YouId: number = req.body.YouId
      await Follow.destroy({
        where: {
          followerId: UserId,
          followingId: YouId
        },
        transaction
      })
      return true
    } catch (err) {
      logger.error('removeFollow')
      logger.error(err)
      return null
    }
  }


  static async getCallOpenent(req: any, transaction: any) {
    try {
      const UserId: number = req.id
      // 유저 팔로워, 포스트포함
      const user: User | null = await User.findOne({
        subQuery: false,
        include: [{
          model: CreatorAuth,
          attributes: ['callPrice'],
        }, {
          model: Score,
        }/*, {
          model: CallHistory,
          as: 'CallHistories',
          required: false,
        }*/],
        where: {
          id: UserId,
        },
        attributes: {
          exclude: USER_ATTRIBUTE.EXCLUDE,
          // include: [[Sequelize.fn('avg', Sequelize.col('CallHistories.time')), 'avgTime']]
        },
        transaction,
        // group: ['User.id']
      })
      return user
    } catch (err) {
      logger.error('getCallOpenent')
      logger.error(err)
      return null
    }
  }

  static async profileInfo(req: any) {
    try {

      //const UserId: number = req?.id
      let YouId: number = req.query?.YouId
      const link: string = req.query?.link
      const platform: string = req.query?.platform
      if (platform === 'web') {
        // const you: any = await UserService.findLinkOne(link)
        const you: any = await User.findOne({
          where: {
            link,
          },
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE
          },
        })


        YouId = you?.id
      }
      if (!YouId) return [null, null]
      // 유저 팔로워, 포스트포함
      const user: User | null = await User.findOne({
        subQuery: false,
        include: [{
          model: CreatorAuth,
          attributes: ['callPrice'],
        }, {
          model: Score,
        }, {
          model: CallHistory,
          as: 'CallHistories',
          required: false,
        }, {
          model: User,
          as: 'Followers',
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE
          },
          required: false,
        }, {
          model: Post,
          attributes: ['id', 'UserId'],
          required: false,
        }],
        where: {
          id: YouId,
        },
        attributes: {
          exclude: USER_ATTRIBUTE.EXCLUDE,
          include: [[Sequelize.fn('avg', Sequelize.col('CallHistories.time')), 'avgTime']]
        },
        group: ['followerId'],
      })
      const follow = req?.id ? await Follow.findOne({
        where: {
          followerId: req?.id,
          followingId: YouId,
        }
      }) : null
      // 팔로잉 여부
      return [user, follow ? true : false]
    } catch (err) {
      logger.error('profileInfo')
      logger.error(err)
      return null
    }
  }


  static async profileInfoV2Fake(req: any) {
    try {

      //const UserId: number = req?.id
      let YouId: number = req.query?.YouId
      const link: string = req.query?.link
      const platform: string = req.query?.platform
      if (platform === 'web') {
        const you: any = await UserService.findLinkOne(link)
        YouId = you?.id
      }
      if (!YouId) return [null, null]

      /*
      if (![225, 5064, 34045, 6, 30287, 1006].includes(Number(YouId))) {
        return [null, false, null]
      }
        */
      let user: User | null
      // 유저 팔로워, 포스트포함
      if ([225, 5064, 34045, 6, 30287, 1006, 44398].includes(Number(YouId))) {
        user = await User.findOne({
          subQuery: false,
          include: [{
            model: CreatorAuth,
            attributes: ['callPrice'],
          }, {
            model: Score,
          }],
          where: {
            id: YouId,
          },
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE,
          },
        })
      } else {
        user = await User.findOne({
          subQuery: false,
          include: [{
            model: CreatorAuth,
            attributes: ['callPrice'],
          }, {
            model: Score,
          }],
          where: {
            id: YouId,
            [Op.or]: [{
              profile: `${process.env.CLOUD_FRONT_STORAGE}/boy.png`,
            }, {
              profile: `${process.env.CLOUD_FRONT_STORAGE}/girl.png`,
            }],
          },
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE,
          },
        })
      }
      const followCount = await Follow.count({
        where: {
          followingId: YouId,
        },
      })
      const follow = req?.id ? await Follow.findOne({
        where: {
          followerId: req?.id,
          followingId: YouId,
        }
      }) : null
      // 팔로잉 여부
      return [user, follow ? true : false, followCount]
    } catch (err) {
      logger.error('profileInfo')
      logger.error(err)
      return null
    }
  }


  static async findLinkOneRedis(link: string | null) {
    try {
      const user = await User.findOne({
        where: {
          link,
        },
        attributes: {
          exclude: ['password', 'refreshToken']
        },
      })
      return user
    } catch (err) {
      logger.error('findLinkOne')
      logger.error(err)
      return null
    }
  }
  static async findIdOneRedis(id: string | null) {
    try {
      const user = await User.findOne({
        where: {
          id,
        },
        attributes: {
          exclude: ['password', 'refreshToken']
        },
      })
      return user
    } catch (err) {
      logger.error('findLinkOne')
      logger.error(err)
      return null
    }
  }


  static async profileInfoV2(req: any) {
    try {

      //const UserId: number = req?.id
      let YouId: number = req.query?.YouId
      const link: string = req.query?.link
      const platform: string = req.query?.platform
      if (platform === 'web') {
        // let redisUser: any = JSON.parse(await getValue(`profile:link:${link}`))
        const you: any = await User.findOne({
          where: {
            link,
          },
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE
          },
        })
        YouId = you?.id
      }
      if (!YouId) return [null, null]
      // 유저 팔로워, 포스트포함
      const user: User | null = await User.findOne({
        subQuery: false,
        include: [{
          model: AlarmSetting,
        }, {
          model: CreatorAuth,
          attributes: ['callPrice'],
        }, {
          model: Score,
        }],
        where: {
          id: YouId,
        },
        attributes: {
          exclude: USER_ATTRIBUTE.EXCLUDE,
        },
      })
      const followCount = await Follow.count({
        where: {
          followingId: YouId,
        },
      })
      const follow = req?.id ? await Follow.findOne({
        where: {
          followerId: req?.id,
          followingId: YouId,
        }
      }) : null
      // 팔로잉 여부
      return [user, follow ? true : false, followCount]
    } catch (err) {
      logger.error('profileInfo')
      logger.error(err)
      return null
    }
  }

  static async updateLastVisit(req: any, transaction: any) {
    try {
      const UserId: number = req.id

      const user = await User.findOne({
        where: {
          id: UserId
        }, transaction
      })

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
      if (user?.gender === USER_GENDER.GIRL && (nj01 || foreigner?.country !== COUNTRY_LIST.한국)) {
        await User.update({
          // lastVisit: new Date(new Date().setMinutes(new Date().getMinutes() - 20)),
          lastVisit: new Date(),
        }, {
          where: {
            id: UserId
          }, transaction
        })
      } else {
        await User.update({
          lastVisit: new Date(),
        }, {
          where: {
            id: UserId
          }, transaction
        })
      }
      return true
    } catch (err) {
      logger.error('updateLastVisit')
      logger.error(err)
      return null
    }
  }

  static async updateLastVisitV2(req: any, transaction: any) {
    try {
      const UserId: number = req.id

      const user = await User.findOne({
        where: {
          id: UserId
        }, transaction
      })

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
      if (user?.gender === USER_GENDER.GIRL && (nj01 || foreigner?.country !== COUNTRY_LIST.한국)) {
        await User.update({
          // lastVisit: new Date(new Date().setMinutes(new Date().getMinutes() - 20)),
          lastVisit: new Date(),
        }, {
          where: {
            id: UserId
          }, transaction
        })
      } else {
        await User.update({
          lastVisit: new Date(),
        }, {
          where: {
            id: UserId
          }, transaction
        })
      }
      return true
    } catch (err) {
      logger.error('updateLastVisit')
      logger.error(err)
      return null
    }
  }


  static async suggestionList(req: any) {
    try {
      const UserId: number = req.id
      const gender: number = req.query.gender
      const global: boolean = req.query.global
      const country: string = req.query.country
      const pageNum: number = req.query.pageNum
      const pageSize: number = req.query.pageSize


      let country_attr: any = {}
      if (country === 'ko') {
        if (global) {
          country_attr[Op.not] = null
        } else {
          country_attr[Op.eq] = country
        }
      } else {
        //애플 심사 거절 로직 대응
        //country_attr[Op.not] = 'ko'
        country_attr[Op.not] = null
      }

      // const now = new Date()
      const suggestionList: User[] = await User.findAll({
        subQuery: false,
        include: [{
          model: CreatorAuth,
          attributes: ['callPrice'],
        }, {
          model: Score
        },/* {
          model: CallHistory,
          as: 'CallHistoriesByCreatedAt',
          required: true,
        },*//* {
          // separate: true,
          model: CallHistory,
          as: 'CallHistories',
          required: true,
        },*/ {
          // separate: true,
          model: User,
          as: 'Banners',
          where: {
            id: UserId,
          },
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE
          },
          required: false,
        }, {
          // separate: true,
          model: User,
          as: 'Bannings',
          where: {
            id: UserId,
          },
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE
          },
          required: false,
        }],
        where: {
          '$Banners.id$': null,
          '$Bannings.id$': null,
          /*
          '$CallHistoriesByCreatedAt.createdAt$': {
            [Op.gte]: new Date(now.setDate(now.getDate() - 60))
          },
          */
          roles: USER_ROLE.NORMAL_USER,
          gender,
          country: country_attr,

        },
        order: [
          [sequelize.col("totalTime"), 'DESC'],
          ['lastVisit', 'DESC']],
        offset: Number(pageNum * pageSize),
        limit: Number(pageSize),
        attributes: {
          exclude: USER_ATTRIBUTE.EXCLUDE,
          include: [
            // [Sequelize.fn('SUM', Sequelize.col('CallHistories.time')), 'totalTime'],
            //[Sequelize.fn('SUM', Sequelize.col('CallHistoriesByCreatedAt.time')), 'totalTimeByCreatedAt'],
            // [Sequelize.fn('avg', Sequelize.col('CallHistories.time')), 'avgTime']
          ],
        },
        // group: ['User.id'],
      })

      return suggestionList
    } catch (err) {
      logger.error('suggestionList')
      logger.error(err)
      return null
    }
  }

  static async getMyFollowing(req: any) {
    try {
      const UserId: number = req.id // req.id
      const pageNum: number = req.query.pageNum
      const pageSize: number = req.query.pageSize

      const user: any = await User.findAll({
        subQuery: false,
        include: [{
          model: User,
          as: 'Followings',
          include: [{
            model: CreatorAuth,
            attributes: ['callPrice'],
          }, {
            model: Score
          }],
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE,
          },
        }],
        group: ['followingId'],
        where: {
          id: UserId,
        },
        attributes: {
          exclude: USER_ATTRIBUTE.EXCLUDE
        },
        order: [['lastVisit', 'DESC']],
        offset: Number(pageNum * pageSize),
        limit: Number(pageSize),
      })
      return user
    } catch (err) {
      logger.error('getMyFollowing')
      logger.error(err)
      return null
    }
  }
  static async getMyAllFollowing(req: any) {
    try {
      const UserId: number = req.id // req.id
      const user: any = await User.findAll({
        subQuery: false,
        include: [{
          model: User,
          as: 'Followings',
          /*
          include: [{
            model: CreatorAuth,
            attributes: ['callPrice'],
          }, {
            model: Score
          }, {
            model: CallHistory,
            as: 'CallHistories',
            required: false,
          }],
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE,
            include: [[Sequelize.fn('avg', Sequelize.col('time')), 'avgTime']]
          },
          */
        }],
        group: ['followingId'],
        where: {
          id: UserId,
        },
        attributes: {
          exclude: USER_ATTRIBUTE.EXCLUDE
        },
        //order: [['lastVisit', 'DESC']],
      })
      return user
    } catch (err) {
      logger.error('getMyFollowing')
      logger.error(err)
      return null
    }
  }


  static async getMyFollowAndRoom(req: any, transaction: any) {
    try {
      const UserId: number = req?.id // req.id
      const user: any = await User.findOne({
        include: [{
          model: User,
          as: 'Followers',
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE
          },
        }],
        attributes: {
          exclude: USER_ATTRIBUTE.EXCLUDE
        },
        where: {
          id: UserId,
        }, transaction,

      })
      return user

    } catch (err) {
      logger.error('getMyFollowAndRoom')
      logger.error(err)
      return null
    }
  }

  static async getMyFollowAndRoomMan(req: any, transaction: any) {
    try {
      const UserId: number = req?.id // req.id
      const user: any = await User.findOne({
        include: [{
          model: User,
          as: 'Followers',
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE
          },
          where: {
            [Op.or]: [{
              gender: USER_GENDER.BOY,

            }, {
              roles: USER_ROLE.CS_USER,
            }]
          }
        }],
        attributes: {
          exclude: USER_ATTRIBUTE.EXCLUDE
        },
        where: {
          id: UserId,
        }, transaction,

      })
      return user

    } catch (err) {
      logger.error('getMyFollowAndRoom')
      logger.error(err)
      return null
    }
  }

  static async getMyFollow(req: any, transaction?: any) {
    try {
      const UserId: number = req?.id // req.id
      if (transaction) {
        const user: User | null = await User.findOne({
          include: [{
            model: User,
            as: 'Followers',
            attributes: {
              exclude: USER_ATTRIBUTE.EXCLUDE
            },
            include: [{
              model: AlarmSetting
            }]
          }],
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE
          },
          where: {
            id: UserId,
          }, transaction,

        })

        return user
      } else {
        const user: User | null = await User.findOne({
          include: [{
            model: User,
            as: 'Followers',
            attributes: {
              exclude: USER_ATTRIBUTE.EXCLUDE
            },
            include: [{
              model: AlarmSetting
            }]
          }],
          where: {
            id: UserId,
          },
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE
          },
        })

        return user
      }
    } catch (err) {
      logger.error('getMyFollow')
      logger.error(err)
      return null
    }
  }

  static async liveList(req: any) {
    try {
      const UserId: number = req.id // req.id
      const gender: number = req.query.gender
      const globalTmp: string = req.query?.global.toString()
      const country: string = req.query.country
      const pageNum: number = req.query.pageNum
      const pageSize: number = req.query.pageSize

      let country_attr: any = {}
      if (country === 'ko') {
        if (globalTmp === 'true') {
          country_attr[Op.not] = null
        } else {
          //
          country_attr[Op.not] = null
          // country_attr[Op.eq] = country
        }
      } else {
        //애플 심사 거절 로직 대응
        //country_attr[Op.not] = 'ko'
        country_attr[Op.not] = null
      }

      const user: any = await User.findOne({
        where: {
          id: UserId
        }
      })
      const googleAndApple = user?.email?.split('@')[1]
      if (
        user?.email === 'test@gmail.com' ||
        googleAndApple === 'accounts.google.com' ||
        googleAndApple === 'google.com' ||
        googleAndApple === 'email.apple.com' ||
        googleAndApple === 'insideapple.apple.com'
      ) {
        const userList: User[] = await User.findAll({
          subQuery: false,
          include: [{
            model: CreatorAuth,
            attributes: ['callPrice'],
          }, {
            model: Score,
          },/* {
            model: CallHistory,
            as: 'CallHistories',
            required: false,
          },*/ {
            model: User,
            as: 'Banners',
            where: {
              id: UserId,
            },
            attributes: {
              exclude: USER_ATTRIBUTE.EXCLUDE
            },
            required: false,
          }, {
            model: User,
            as: 'Bannings',
            where: {
              id: UserId,
            },
            attributes: {
              exclude: USER_ATTRIBUTE.EXCLUDE
            },
            required: false,
          }],
          where: {
            [Op.or]: [{
              profile: `${process.env.CLOUD_FRONT_STORAGE}/boy.png`,

            }, {
              profile: `${process.env.CLOUD_FRONT_STORAGE}/girl.png`,
            }],
            '$Banners.id$': null,
            '$Bannings.id$': null,
            roles: USER_ROLE.NORMAL_USER,
            gender,
            country: country_attr,
          },
          order: [['lastVisit', 'DESC']],
          offset: Number(pageNum * pageSize),
          limit: Number(pageSize),
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE,
            // include: [[Sequelize.fn('avg', Sequelize.col('CallHistories.time')), 'avgTime']]
          },
          // group: ['User.id']
        })
        return userList
      } else {
        const userList: any = await User.findAll({
          subQuery: false,

          include: [{
            model: CreatorAuth,
            attributes: ['callPrice'],
          }, {
            model: Score,
          }, /*{
            // separate: true,
            model: CallHistory,
            as: 'CallHistories',
            // separate: true,
            // order: [['createdAt', 'DESC']],
            required: false,
            // foreignKey: 'UserId',
            // attributes: {
            // include: [[Sequelize.fn('avg', Sequelize.col('time')), 'avgTime']]
            // },
          },*/ {
            model: User,
            as: 'Banners',
            where: {
              id: UserId,
            },
            attributes: {
              exclude: USER_ATTRIBUTE.EXCLUDE
            },
            required: false,
          }, {
            model: User,
            as: 'Bannings',
            where: {
              id: UserId,
            },
            attributes: {
              exclude: USER_ATTRIBUTE.EXCLUDE
            },
            required: false,
          }],
          where: {
            '$Banners.id$': null,
            '$Bannings.id$': null,
            profile: {
              [Op.not]: `${process.env.CLOUD_FRONT_STORAGE}/girl.png`
            },
            roles: USER_ROLE.NORMAL_USER,
            gender,
            country: country_attr,
          },
          order: [['lastVisit', 'DESC']],
          offset: Number(pageNum * pageSize),
          limit: Number(pageSize),
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE,
            // include: [[Sequelize.fn('avg', Sequelize.col('CallHistories.time')), 'avgTime']]
          },
          //group: ['User.id']
        })

        return userList
      }

    } catch (err) {
      logger.error('liveList')
      logger.error(err)
      return null
    }
  }


  static async liveListFake(req: any) {
    try {
      const UserId: number = req.id // req.id
      const gender: number = req.query.gender
      const globalTmp: string = req.query?.global.toString()
      const country: string = req.query.country
      const pageNum: number = req.query.pageNum
      const pageSize: number = req.query.pageSize

      let country_attr: any = {}
      if (country === 'ko') {
        if (globalTmp === 'true') {
          country_attr[Op.not] = null
        } else {
          //
          country_attr[Op.not] = null
          // country_attr[Op.eq] = country
        }
      } else {
        //애플 심사 거절 로직 대응
        //country_attr[Op.not] = 'ko'
        country_attr[Op.not] = null
      }

      const user: any = await User.findOne({
        where: {
          id: UserId
        }
      })
      const googleAndApple = user?.email?.split('@')[1]
      if (
        user?.email === 'test@gmail.com' ||
        googleAndApple === 'accounts.google.com' ||
        googleAndApple === 'google.com' ||
        googleAndApple === 'email.apple.com' ||
        googleAndApple === 'insideapple.apple.com'
      ) {
        const userList: User[] = await User.findAll({
          subQuery: false,
          include: [{
            model: CreatorAuth,
            attributes: ['callPrice'],
          }, {
            model: Score,
          }/*, {
            model: CallHistory,
            as: 'CallHistories',
            required: false,
          }*/, {
            model: User,
            as: 'Banners',
            where: {
              id: UserId,
            },
            attributes: {
              exclude: USER_ATTRIBUTE.EXCLUDE
            },
            required: false,
          }, {
            model: User,
            as: 'Bannings',
            where: {
              id: UserId,
            },
            attributes: {
              exclude: USER_ATTRIBUTE.EXCLUDE
            },
            required: false,
          }],
          where: {
            [Op.or]: [{
              profile: `${process.env.CLOUD_FRONT_STORAGE}/boy.png`,

            }, {
              profile: `${process.env.CLOUD_FRONT_STORAGE}/girl.png`,
            }],
            '$Banners.id$': null,
            '$Bannings.id$': null,
            roles: USER_ROLE.NORMAL_USER,
            gender,
            country: country_attr,
          },
          order: [['lastVisit', 'DESC']],
          offset: Number(pageNum * pageSize),
          limit: Number(pageSize),
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE,
            // include: [[Sequelize.fn('avg', Sequelize.col('CallHistories.time')), 'avgTime']]
          },
          // group: ['User.id']
        })
        return userList
      } else {
        const userList: User[] = await User.findAll({
          subQuery: false,
          include: [{
            model: CreatorAuth,
            attributes: ['callPrice'],
          }, {
            model: Score,
          }/*, {
            model: CallHistory,
            as: 'CallHistories',
            required: false,
          }*/, {
            model: User,
            as: 'Banners',
            where: {
              id: UserId,
            },
            attributes: {
              exclude: USER_ATTRIBUTE.EXCLUDE
            },
            required: false,
          }, {
            model: User,
            as: 'Bannings',
            where: {
              id: UserId,
            },
            attributes: {
              exclude: USER_ATTRIBUTE.EXCLUDE
            },
            required: false,
          }],
          where: {
            [Op.or]: [{
              profile: `${process.env.CLOUD_FRONT_STORAGE}/boy.png`,

            }, {
              profile: `${process.env.CLOUD_FRONT_STORAGE}/girl.png`,
            }],
            '$Banners.id$': null,
            '$Bannings.id$': null,
            roles: USER_ROLE.NORMAL_USER,
            gender,
            country: country_attr,
          },
          order: [['lastVisit', 'DESC']],
          offset: Number(pageNum * pageSize),
          limit: Number(pageSize),
          attributes: {
            exclude: USER_ATTRIBUTE.EXCLUDE,
            // include: [[Sequelize.fn('avg', Sequelize.col('CallHistories.time')), 'avgTime']]
          },
          // group: ['User.id']
        })
        return userList
      }

    } catch (err) {
      logger.error('liveList')
      logger.error(err)
      return null
    }
  }



  static async changeProfile(req: any, transaction: any) {
    try {
      const UserId: number = req.id
      const profile: string = req.body.profile
      await User.update({
        profile
      }, {
        where: {
          id: UserId,
        },
        transaction
      })

      return true
    } catch (err) {
      logger.error('changeProfile')
      logger.error(err)
      return null
    }
  }


  static async apnsUpdate(req: any, transaction: any) {
    try {
      const UserId: number = req.id
      const apnsToken: string = req.body.apnsToken

      const preUser = await User.findOne({
        where: {
          apnsToken,
        },
        transaction
      })

      if (preUser) {
        await User.update(
          {
            apnsToken: null,
          },
          {
            where: {
              id: preUser.id,
            },
            transaction
          },
        )
      }
      await User.update({
        apnsToken,
      },
        {
          where: {
            id: UserId
          },
          transaction
        })
      return true
    } catch (err) {
      logger.error('apnsToken')
      logger.error(err)
      return null
    }
  }


  static async tokenUpdate(req: any, transaction: any) {
    try {
      const UserId: number = req.id
      const pushToken: string = req.body.pushToken

      const preUser = await User.findOne({
        where: {
          pushToken,
        },
        transaction
      })

      if (preUser) {
        await User.update(
          {
            pushToken: null,
          },
          {
            where: {
              id: preUser.id,
            },
            transaction
          },
        )
      }
      await User.update({
        pushToken,
      },
        {
          where: {
            id: UserId
          },
          transaction
        })
      return true
    } catch (err) {
      logger.error('tokenUpdate')
      logger.error(err)
      return null
    }
  }

  static async findUserByPhoneCheck(phone: string) {
    try {
      const user = await User.findOne({
        where: {
          phone
        }
      })
      if (user) return true
      else return false
    } catch (err) {
      logger.error('findUserByPhoneCheck')
      logger.error(err)
      return null
    }
  }
  static async findUserByEmailCheck(email: string) {
    try {
      const user = await User.findOne({
        where: {
          email
        }
      })
      if (user) return true
      else return false
    } catch (err) {
      logger.error('findUserByEmailCheck')
      logger.error(err)
      return null
    }
  }

  static async findUserOneByAppToWeb(id: number | null) {
    try {
      const user = await User.findOne({
        where: {
          id
        },
        attributes: {
          exclude: USER_ATTRIBUTE.EXCLUDE2
        },
      })
      return user
    } catch (err) {
      logger.error('findUserOneByAppToWeb')
      logger.error(err)
      return null
    }
  }
  static async findUserOne(id: number | null) {
    try {
      const user = await User.findOne({
        include: [{
          model: AlarmSetting,
        }],
        where: {
          id: id,
        },
        attributes: {
          exclude: USER_ATTRIBUTE.EXCLUDE
        },
      })
      return user
    } catch (err) {
      logger.error('findUserOne')
      logger.error(err)
      return null
    }
  }


  static async findUserOneTransaction2(id: number | null, transaction: any) {
    try {
      const user = await User.findOne({
        include: [{
          model: AlarmSetting,
        }],
        where: {
          id,
        },
        attributes: {
          exclude: ['phone', 'sns', 'snsId', 'password', 'refreshToken', 'real_birthday', 'real_gender']
        },
        transaction
      })
      return user
    } catch (err) {
      logger.error('findUserOneTransaction')
      logger.error(err)
      return null
    }
  }

  static async findUserOneTransaction(id: number | null, transaction: any) {
    try {
      const user = await User.findOne({
        include: [{
          model: AlarmSetting,
        }],
        where: {
          id,
        },
        attributes: {
          exclude: USER_ATTRIBUTE.EXCLUDE
        },
        transaction
      })
      return user
    } catch (err) {
      logger.error('findUserOneTransaction')
      logger.error(err)
      return null
    }
  }
  static async findUserOneTransactionByNotSecure(id: number | null, transaction: any) {
    try {
      const user = await User.findOne({
        include: [{
          model: AlarmSetting,
        }],
        where: {
          id,
        },
        /*
        attributes: {
          exclude: USER_ATTRIBUTE.EXCLUDE
        },
        */
        transaction
      })
      return user
    } catch (err) {
      logger.error('findUserOneTransaction')
      logger.error(err)
      return null
    }
  }

  static async joinUser(req: any, res: any, transaction: any) {
    try {
      const phone: string = req.body?.phone;
      const email: string = req.body?.email;
      const sns: string = req.body?.sns === 'null' || req.body?.sns === '' || req.body?.sns === 'undefined' || !req.body?.sns ? null : req.body?.sns;
      const snsId: string = req.body?.snsId === 'null' || req.body?.snsId === '' || req.body?.snsId === 'undefined' || !req.body?.snsId ? null : req.body?.snsId;
      const age: string = req.body?.age;
      const password: string = !snsId ? req.body?.password : snsId;
      const gender: number = req.body?.gender;
      const nick: string = req.body?.nick;
      const profile: string = req.body?.profile;
      const country: string = req.body?.country
      const real_birthday: number = req.body?.real_birthday;
      const real_gender: number = req.body?.real_gender;
      let code: string = req.body?.code
      const adCode: string = req.body?.adCode
      if (code) {
        code = code.toLowerCase();
      }
      //소문자화 시키기
      //코드있을때
      //만약 user 코드가 ch01 같다면 && 회사계정
      //에이전시 그중에서도 ch01 일때

      const exUser: any = await User.findOne({
        where: {
          email,
          sns,
          snsId
        }, transaction
      })
      //sns 가입이이 아닌 로컬 유저가 있을때는 리턴

      /*
      // exUser:null, sns:null, snsId:null
      exUser:User, sns:null, snsId:null
      // exUser:null, sns:apple, snsId:1234
      exUser:User, sns:apple, snsId:1234
      */

      //sns 유저는 없다면 가입시켜야함
      if (exUser /*&& !sns && !snsId*/) {
        /*
        const snsCheck = await SocialLogin.findOne({
          where: {
            email,
            sns,
            snsId,
          }, transaction
        })
        */

        return { user: null, password: null, refreshToken: null, accessToken: null, dupPhone: false, dupEmail: true }
        //}
      }

      const hash = await bcrypt.hash(password, 12)
      const refreshToken = refresh()
      //let tokens:any=v4().split('-')
      let link = '@'
      let dup = true
      let time = 0
      while (dup) {
        time++
        if (time >= 100) return { user: null, password: null, refreshToken: null, accessToken: null, dupPhone: false, dupEmail: false }
        const tokens = v4().split('-')
        link = '@' + tokens[0] + tokens[1] + tokens[2]
        const linkUser = await User.findOne({
          where: {
            link,
          }, transaction
        })
        if (!linkUser) {
          dup = false
        }
      }


      const mcn = code === '' || !code ? null : await User.findOne({
        where: {
          code,
          roles: USER_ROLE.COMPANY_USER
        }, transaction
      })
      const exchangeSelf = code && ['ch01', 'nj12', 'bb12', 'npick', 'jay', 'family', 'wm', 'ten', 'dh83', 'jw'].includes(String(mcn?.code)) ? true : false
      const jh01 = code && mcn?.code === 'jh01' ? true : false
      const ch01 = code && mcn?.code === 'ch01' ? true : false
      const mb12 = code && mcn?.code === 'mb12' ? true : false
      const nj12 = code && mcn?.code === 'nj12' ? true : false
      const bb12 = code && mcn?.code === 'bb12' ? true : false
      const xpnt = code && mcn?.code === 'xpnt' ? true : false
      const ddbg = code && mcn?.code === 'ddbg' ? true : false
      const ad2025 = code && mcn?.code === 'ad2025' ? true : false
      const fing = code && mcn?.code === 'fing' ? true : false
      const abc1 = code && mcn?.code === 'abc1' ? true : false
      const tain = code && mcn?.code === 'tain' ? true : false
      const dh83 = code && mcn?.code === 'dh83' ? true : false
      const jw = code && mcn?.code === 'jw' ? true : false

      const makeit = code && mcn?.code === 'makeit' ? true : false
      const npick = code && mcn?.code === 'npick' ? true : false
      const jay = code && mcn?.code === 'jay' ? true : false
      const family = code && mcn?.code === 'family' ? true : false
      const wm = code && mcn?.code === 'wm' ? true : false
      const ten = code && mcn?.code === 'ten' ? true : false

      const user = await User.create({
        sns,
        snsId,
        adCode,
        phone,
        email,
        age,
        link,
        password: hash,
        gender,
        real_birthday,
        real_gender,
        nick,
        profile,
        background: profile,
        country,
        roles: USER_ROLE.NORMAL_USER,
        refreshToken,
        lastVisit: bb12 || nj12 || country !== COUNTRY_LIST.한국 ? new Date(new Date().setMinutes(new Date().getMinutes() - 20)) : new Date(),
        callState: CALL_TYPE.CALL_WAIT,
        exchangeShow: gender === USER_GENDER.BOY || exchangeSelf ? false : true,
        nextMonthExchange: makeit ? true : xpnt ? true : false,
        adPercent: 10,
      },
        { transaction }
      )
      if (sns && snsId) {
        await SocialLogin.create({
          email,
          sns,
          snsId,
          UserId: user.id
        }, { transaction })
      }
      await Account.create({
        UserId: user.id,
      }, { transaction })
      await AlarmSetting.create({
        UserId: user.id,
      }, { transaction })
      await Point.create({
        UserId: user.id,
        amount: 0,
      }, { transaction })
      await Score.create({
        UserId: user.id,
      }, { transaction })
      await Item.create({
        UserId: user.id,
      }, { transaction })
      await Card.create({
        UserId: user.id,
      }, { transaction })
      await CreatorAuth.create({
        platformPointCharge: npick || jay || family || wm || ten || makeit || tain ? 50 : fing ? 80 : ddbg ? 100 : xpnt ? 50 : mb12 ? 73 : 70,
        platformSubscribeCharge: npick || jay || family || wm || ten || makeit || tain ? 50 : fing ? 80 : ddbg ? 100 : xpnt ? 50 : mb12 ? 73 : 70,
        UserId: user.id,
      }, { transaction })
      await Money.create({
        UserId: user.id,
      }, { transaction })
      /*
      await LastScreen.create({
        name: 'Live',
        changedAt: new Date(),
        UserId: user?.id,
      }, { transaction })
      */

      //mcn   
      if (code && mcn && gender === USER_GENDER.GIRL) {
        //근데 만약 ch01일때는 신이사님 15 추가해야함
        if (ch01) {
          await Mcn.create({
            creatorCharge: 50,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })

          await CreatorAuth.update({
            callPrice: 2000,
          }, {
            where: {
              UserId: user.id,
            }, transaction
          })
          await Mcn.create({
            creatorCharge: 15,
            mcnerId: user?.id,
            mcningId: 4613,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 50
    
            `
          )
        } else if (jw) {
          await Mcn.create({
            creatorCharge: 73,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: 4613,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 73
    
            `
          )
        } else if (dh83) {
          await Mcn.create({
            creatorCharge: 73,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: 4613,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 73
    
            `
          )
        } else if (npick) {
          await Mcn.create({
            creatorCharge: 83,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 83
    
            `
          )
        } else if (jay) {
          await Mcn.create({
            creatorCharge: 73,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 83,
            mcnerId: user?.id,
            mcningId: 34390,//엔픽
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 73
    
            `
          )
        } else if (family) {
          await Mcn.create({
            creatorCharge: 50,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 83,
            mcnerId: user?.id,
            mcningId: 34390,//엔픽
            code,
          }, { transaction })

          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 50
    
            `
          )
        } else if (wm) {
          await Mcn.create({
            creatorCharge: 70,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 83,
            mcnerId: user?.id,
            mcningId: 34390,//엔픽
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 70
    
            `
          )
        } else if (ten) {
          await Mcn.create({
            creatorCharge: 70,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 83,
            mcnerId: user?.id,
            mcningId: 34390,//엔픽
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 70
    
            `
          )
        } else if (jh01) {
          await Mcn.create({
            creatorCharge: 53,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 53
    
            `
          )
        } else if (makeit) {
          await Mcn.create({
            creatorCharge: 73,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 83,
            mcnerId: user?.id,
            mcningId: 34390,//엔픽
            code,
          }, { transaction })

          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 10
    
            `
          )
        } else if (ad2025) {
          await Mcn.create({
            creatorCharge: 43,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: 4613,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 43
    
            `
          )
        } else if (fing) {
          await Mcn.create({
            creatorCharge: 30,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 23,
            mcnerId: user?.id,
            mcningId: 73885,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: 4613,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 30
    
            `
          )
        } else if (ddbg) {
          await Mcn.create({
            creatorCharge: 73,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: 4613,
            code,
          }, { transaction })
        } else if (xpnt) {
          await Mcn.create({
            creatorCharge: 27,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 7,
            mcnerId: user?.id,
            mcningId: 4613,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 73
    
            `
          )
        } else if (tain) {
          await Mcn.create({
            creatorCharge: 20,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 20
    
            `
          )
        } else if (abc1) {
          await Mcn.create({
            creatorCharge: 40,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 40
    
            `
          )
        } else if (bb12) {
          await Mcn.create({
            creatorCharge: 40,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 40
    
            `
          )
        } else if (mb12) {
          await Mcn.create({
            creatorCharge: 18,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })

          await CreatorAuth.update({
            callPrice: 2000,
          }, {
            where: {
              UserId: user.id,
            }, transaction
          })
          await Mcn.create({
            creatorCharge: 28,
            mcnerId: user?.id,
            mcningId: 4613,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 18
    
            `
          )
        } else if (nj12) {
          await Mcn.create({
            creatorCharge: 40,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 40
    
            `
          )
        } else {
          await Mcn.create({
            creatorCharge: 0,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
        }
      }




      const cs = await User.findOne({
        where: {
          roles: USER_ROLE.CS_USER
        }
      })
      if (cs) {
        await Follow.create({
          followerId: user.id,
          followingId: cs.id
        }, {
          transaction
        })
        await Follow.create({
          followerId: cs.id,
          followingId: user?.id
        }, {
          transaction
        })
      }

      const accessToken = sign({ id: user.id, roles: user.roles })
      return { user, password, refreshToken, accessToken, dupPhone: false, dupEmail: false }
    } catch (err) {
      logger.error('joinUser')
      logger.error(err)
      return null
    }
  }


  static async joinUserV2(req: any, res: any, transaction: any) {
    try {
      const phone: string = req.body?.phone;
      const email: string = req.body?.email;
      const sns: string = req.body?.sns === 'null' || req.body?.sns === '' || req.body?.sns === 'undefined' || !req.body?.sns ? null : req.body?.sns;
      const snsId: string = req.body?.snsId === 'null' || req.body?.snsId === '' || req.body?.snsId === 'undefined' || !req.body?.snsId ? null : req.body?.snsId;
      // const snsId: string = req.body?.snsId ?? null;
      const age: string = req.body?.age;
      const password: string = !snsId ? req.body?.password : snsId;
      const gender: number = req.body?.gender;
      const nick: string = req.body?.nick;
      const profile: string = Number(gender) === USER_GENDER.BOY ? `${process.env.CLOUD_FRONT_STORAGE}/boy.png` : `${process.env.CLOUD_FRONT_STORAGE}/girl.png` //req.body?.profile;
      const country: string = req.body?.country
      const real_birthday: number = req.body?.real_birthday;
      const real_gender: number = req.body?.real_gender;
      let code: string = req.body?.code
      const adCode: string = req.body?.adCode
      if (code) {
        code = code.toLowerCase();
      }

      const exUser: any = await User.findOne({
        where: {
          email,
          sns,
          snsId
        }, transaction
      })

      //sns 유저는 없다면 가입시켜야함
      if (exUser) {
        return { user: null, password: null, refreshToken: null, accessToken: null, dupPhone: false, dupEmail: true }
      }

      const hash = await bcrypt.hash(password, 12)
      const refreshToken = refresh()
      //let tokens:any=v4().split('-')
      let link = '@'
      let dup = true
      let time = 0
      while (dup) {
        time++
        if (time >= 100) return { user: null, password: null, refreshToken: null, accessToken: null, dupPhone: false, dupEmail: false }
        const tokens = v4().split('-')
        link = '@' + tokens[0] + tokens[1] + tokens[2]
        const linkUser = await User.findOne({
          where: {
            link,
          }, transaction
        })
        if (!linkUser) {
          dup = false
        }
      }

      const mcn = code === '' || !code ? null : await User.findOne({
        where: {
          code,
          roles: USER_ROLE.COMPANY_USER
        }, transaction
      })
      const exchangeSelf = code && ['ch01', 'nj12', 'bb12', 'npick', 'jay', 'family', 'wm', 'ten', 'dh83', 'jw'].includes(String(mcn?.code)) ? true : false
      const jh01 = code && mcn?.code === 'jh01' ? true : false
      const ch01 = code && mcn?.code === 'ch01' ? true : false
      const mb12 = code && mcn?.code === 'mb12' ? true : false
      const nj12 = code && mcn?.code === 'nj12' ? true : false
      const bb12 = code && mcn?.code === 'bb12' ? true : false
      const xpnt = code && mcn?.code === 'xpnt' ? true : false
      const ddbg = code && mcn?.code === 'ddbg' ? true : false
      const ad2025 = code && mcn?.code === 'ad2025' ? true : false
      const fing = code && mcn?.code === 'fing' ? true : false
      const abc1 = code && mcn?.code === 'abc1' ? true : false
      const tain = code && mcn?.code === 'tain' ? true : false
      const dh83 = code && mcn?.code === 'dh83' ? true : false
      const jw = code && mcn?.code === 'jw' ? true : false

      const makeit = code && mcn?.code === 'makeit' ? true : false
      const npick = code && mcn?.code === 'npick' ? true : false
      const jay = code && mcn?.code === 'jay' ? true : false
      const family = code && mcn?.code === 'family' ? true : false
      const wm = code && mcn?.code === 'wm' ? true : false
      const ten = code && mcn?.code === 'ten' ? true : false

      const user = await User.create({
        sns,
        snsId,
        adCode,
        phone,
        email,
        age,
        link,
        password: hash,
        gender,
        real_birthday,
        real_gender,
        nick,
        profile,
        background: profile,
        country,
        roles: USER_ROLE.NORMAL_USER,
        refreshToken,
        lastVisit: bb12 || nj12 || country !== COUNTRY_LIST.한국 ? new Date(new Date().setMinutes(new Date().getMinutes() - 20)) : new Date(),
        callState: CALL_TYPE.CALL_WAIT,
        exchangeShow: gender === USER_GENDER.BOY || exchangeSelf ? false : true,
        nextMonthExchange: makeit ? true : xpnt ? true : false,
        adPercent: 10,
      },
        { transaction }
      )
      if (sns && snsId) {
        await SocialLogin.create({
          email,
          sns,
          snsId,
          UserId: user.id
        }, { transaction })
      }


      await Account.create({
        UserId: user.id,
      }, { transaction })
      await AlarmSetting.create({
        UserId: user.id,
      }, { transaction })
      await Point.create({
        UserId: user.id,
        amount: 0,
      }, { transaction })
      await Score.create({
        UserId: user.id,
      }, { transaction })
      await Item.create({
        UserId: user.id,
      }, { transaction })
      await Card.create({
        UserId: user.id,
      }, { transaction })
      await CreatorAuth.create({
        platformPointCharge: 70,
        platformSubscribeCharge: 70,
        UserId: user.id,
      }, { transaction })
      await Money.create({
        UserId: user.id,
      }, { transaction })


      if (code && mcn && gender === USER_GENDER.GIRL) {
        //근데 만약 ch01일때는 신이사님 15 추가해야함
        if (ch01) {
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })

          await CreatorAuth.update({
            callPrice: 2000,
          }, {
            where: {
              UserId: user.id,
            }, transaction
          })
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: 4613,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 50
    
            `
          )
        } else if (jw) {
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: 4613,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 73
    
            `
          )
        } else if (dh83) {
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: 4613,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 73
    
            `
          )
        } else if (jh01) {
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 53
    
            `
          )
        } else if (npick) {
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 83
    
            `
          )
        } else if (jay) {
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: 34390,//엔픽
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 73
    
            `
          )
        } else if (family) {
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: 34390,//엔픽
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 50
    
            `
          )
        } else if (wm) {
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: 34390,//엔픽
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 70
    
            `
          )
        } else if (ten) {
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: 34390,//엔픽
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 70
    
            `
          )
        } else if (makeit) {
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: 34390,//엔픽
            code,
          }, { transaction })


          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 73
    
            `
          )
        } else if (ad2025) {
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: 4613,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 43
    
            `
          )
        } else if (fing) {
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: 73885,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: 4613,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 30
    
            `
          )
        } else if (ddbg) {
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: 4613,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 73
    
            `
          )
        } else if (xpnt) {
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: 4613,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 27
    
            `
          )
        } else if (tain) {
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 20
    
            `
          )
        } else if (abc1) {
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 40
    
            `
          )
        } else if (mb12) {
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })

          await CreatorAuth.update({
            callPrice: 2000,
          }, {
            where: {
              UserId: user.id,
            }, transaction
          })

          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: 4613,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 mb12
    
            `
          )
        } else if (bb12) {
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 40
    
            `
          )
        } else if (nj12) {
          await Mcn.create({
            creatorCharge: 10,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
          slackPostMessage(SLACK_CHANNEL.MONEY,
            `에이전시 크리에이터추가 
            ${user?.nick} -> ${mcn?.nick} 추가 완료
            ${user?.link} -> ${mcn?.link}
            ${user?.id} -> ${mcn?.id}
            수수료 40
    
            `
          )
        } else {
          await Mcn.create({
            creatorCharge: 0,
            mcnerId: user?.id,
            mcningId: mcn?.id,
            code,
          }, { transaction })
        }
      }

      const cs = await User.findOne({
        where: {
          roles: USER_ROLE.CS_USER
        }
      })
      if (cs) {
        await Follow.create({
          followerId: user.id,
          followingId: cs.id
        }, {
          transaction
        })
        await Follow.create({
          followerId: cs.id,
          followingId: user?.id
        }, {
          transaction
        })
      }

      const accessToken = sign({ id: user.id, roles: user.roles })
      return { user, password, refreshToken, accessToken, dupPhone: false, dupEmail: false }
    } catch (err) {
      logger.error('joinUser')
      logger.error(err)
      return null
    }
  }

  static async destroyUser(req: any, transaction: any) {
    try {
      const UserId: number = req.id
      //밴 당한 회원 이면 안되고, 
      const user = await User.findOne({
        where: {
          id: UserId
        }, transaction
      })
      if (user?.roles === USER_ROLE.BAN_USER) return false
      await User.destroy({
        where: {
          id: UserId,
        },
        transaction
      })
      await Alarm.destroy({
        where: {
          UserId,
        },
        transaction
      })
      await Comment.destroy({
        where: {
          UserId,
        },
        transaction
      })
      await CommentChild.destroy({
        where: {
          UserId,
        },
        transaction
      })
      await Post.destroy({
        where: {
          UserId,
        },
        transaction
      })
      await Authority.destroy({
        where: {
          UserId,
        },
        transaction
      })

      await CallHistory.destroy({
        where: {
          UserId,
        },
        transaction
      })
      await FanStep.destroy({
        where: {
          UserId,
        },
        transaction
      })
      await Benifit.destroy({
        where: {
          UserId,
        },
        transaction
      })
      await Wish.destroy({
        where: {
          UserId,
        },
        transaction
      })
      await Ban.destroy({
        where: {
          bannerId: UserId,
        },
        transaction
      })
      await Follow.destroy({
        where: {
          followerId: UserId,
        },
        transaction
      })
      await Subscribe.destroy({
        where: {
          subscriberId: UserId,
        },
        transaction
      })
      await SocialLogin.destroy({
        where: {
          UserId
        }, transaction
      })
      await Account.destroy({
        where: {
          UserId
        }, transaction
      })
      await AlarmSetting.destroy({
        where: {
          UserId
        }, transaction
      })
      await Point.destroy({
        where: {
          UserId
        }, transaction
      })
      await Score.destroy({
        where: {
          UserId
        }, transaction
      })
      await Item.destroy({
        where: {
          UserId
        }, transaction
      })
      await Card.destroy({
        where: {
          UserId
        }, transaction
      })
      await CreatorAuth.destroy({
        where: {
          UserId
        }, transaction
      })
      await Money.destroy({
        where: {
          UserId
        }, transaction
      })

      return true
    } catch (err) {
      logger.error('destoryUser')
      logger.error(err)
      return null
    }
  }
}
export default UserService
