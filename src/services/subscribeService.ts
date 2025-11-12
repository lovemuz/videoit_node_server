import { User, Container, sequelize, Score, FanStep, Benifit, Subscribe, Follow, Mcn, Post } from '../models/index'
import bcrypt from 'bcrypt'
import { logger } from '../config/winston'
//import { PAYMENT_STATE } from '../constant/payment-constant'
import Sequelize from 'sequelize'
import { SCORE_TIME } from '../constant/score-constant'
import { USER_ATTRIBUTE, USER_GENDER, USER_ROLE } from '../constant/user-constant'
import { SUBSCRIBE_STATE } from '../constant/subscribe-constant'
import UserService from './userService'
const Op = Sequelize.Op

class SubscribeService {
    constructor() { }


    static async getFanStepExistsStep(req: any) {
        try {
            const UserId: number = req.id
            const possibleStep: any = [11]
            const fanStep = await FanStep.findAll({
                where: {
                    UserId,
                },
                order: [['step', 'ASC']],
            })
            fanStep.map((list, idx) => {
                possibleStep.push(list?.step)
            })
            return possibleStep
        } catch (err) {
            logger.error('getFanStepExistsStep')
            logger.error(err)
            return null
        }
    }

    static async createSubscribe(req: any, fanStep: FanStep, dayBeFore7updateCheck: boolean, transaction: any, billkeyKorean_HK?: string, billkeyForeign?: string) {
        try {
            //const { cardNumber, cardValidationYear, cardValidationMonth, amount, name, email, phoneNumber,YouId ,FanStepId} = req.body
            const FanStepId: number = req.body.FanStepId
            const UserId: number = req.id
            const YouId: number = req.body.YouId
            const subscribe = await Subscribe.findOne({
                where: {
                    subscriberId: UserId,
                    subscribingId: YouId,
                }, transaction
            })
            if (subscribe) {
                // 구독있으면 업데이트
                if (dayBeFore7updateCheck) {
                    await Subscribe.update({
                        lastPrice: fanStep?.price,
                        FanStepId,
                        step: fanStep.step,
                        subscribedAt: new Date(),
                        subscribeState: SUBSCRIBE_STATE.ING,
                        billkeyKorean_HK,
                        billkeyForeign,
                    }, {
                        where: {
                            subscriberId: UserId,
                            subscribingId: YouId,
                        }, transaction
                    })
                } else if ([49648, 41521, 41014, 41017, 41252, 4266, 8833, 15842, 1823, 22222, 39949, 1430, 2184, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 1733, 7661].includes(Number(YouId))) {
                    await Subscribe.update({
                        lastPrice: fanStep?.price,
                        FanStepId,
                        step: fanStep.step,
                        subscribeCount: 1,
                        subscribedAt: new Date(),
                        subscribeState: SUBSCRIBE_STATE.ING,
                        billkeyKorean_HK,
                        billkeyForeign,
                    }, {
                        where: {
                            subscriberId: UserId,
                            subscribingId: YouId,
                        }, transaction
                    })
                } else {
                    // if()
                    await Subscribe.update({
                        lastPrice: fanStep?.price,
                        FanStepId,
                        step: fanStep.step,
                        subscribeCount: sequelize.literal('subscribeCount + 1'),
                        subscribedAt: new Date(),
                        subscribeState: SUBSCRIBE_STATE.ING,
                        billkeyKorean_HK,
                        billkeyForeign,
                    }, {
                        where: {
                            subscriberId: UserId,
                            subscribingId: YouId,
                        }, transaction
                    })
                }
            } else {
                // 아예 새로만들어야함
                await Subscribe.create({
                    lastPrice: fanStep?.price,
                    FanStepId,
                    subscriberId: UserId,
                    subscribingId: YouId,
                    step: fanStep.step,
                    subscribeCount: 1,
                    subscribedAt: new Date(),
                    subscribeState: SUBSCRIBE_STATE.ING,
                    billkeyKorean_HK,
                    billkeyForeign,
                }, { transaction })

            }
            const follow = await Follow.findOne({
                where: {
                    followerId: UserId,
                    followingId: YouId
                },
                transaction
            })
            if (!follow) {
                await Follow.create({
                    followerId: UserId,
                    followingId: YouId
                }, {
                    transaction
                })
            }
            return true
        } catch (err) {
            logger.error('createSubsribe')
            logger.error(err)
            return null
        }
    }

    static async getSubcribeOne(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const YouId: number = req.body.YouId
            const subscribe = await Subscribe.findOne({
                where: {
                    subscriberId: UserId,
                    subscribingId: YouId,
                    //subscribeState: SUBSCRIBE_STATE.ING,
                }, transaction
            })
            return subscribe
        } catch (err) {
            logger.error('getSubscribeOne')
            logger.error(err)
            return null
        }
    }

    static async getSubscribeState(req: any) {
        try {
            if (req.id) {
                const UserId: number = req.id
                let YouId: number = req.query?.YouId
                const link: string = req.query?.link
                const platform: string = req.query?.platform
                if (platform === 'web') {
                    const you: any = await UserService.findLinkOne(link)
                    YouId = you?.id
                }
                const subscribe = await Subscribe.findOne({
                    include: [{
                        model: FanStep
                    }],
                    where: {
                        subscriberId: UserId,
                        subscribingId: YouId,
                        //subscribeState: SUBSCRIBE_STATE.ING,
                    }
                })
                return subscribe
            } else return null
        } catch (err) {
            logger.error('getSubscribeState')
            logger.error(err)
            return null
        }
    }

    static async getFanStepById(req: any, transaction: any) {
        try {
            const FanStepId: number = req.body.FanStepId
            const fanStep = await FanStep.findOne({
                where: {
                    id: FanStepId,
                }
                , transaction
            })
            return fanStep
        } catch (err) {
            logger.error('getFanStepById')
            logger.error(err)
            return null
        }
    }
    static async getFanStepByIdQuery(req: any) {
        try {
            const FanStepId: number = req.query.FanStepId
            const fanStep = await FanStep.findOne({
                include: [{
                    model: User,
                    attributes: {
                        exclude: USER_ATTRIBUTE.EXCLUDE
                    },
                }],
                where: {
                    id: FanStepId,
                }
            })
            return fanStep
        } catch (err) {
            logger.error('getFanStepById')
            logger.error(err)
            return null
        }
    }
    static async getFanStepByIdParams(FanStepId: number, transaction: any) {
        try {
            const fanStep = await FanStep.findOne({
                where: {
                    id: FanStepId,
                }
                , transaction
            })
            return fanStep
        } catch (err) {
            logger.error('getFanStepByIdParams')
            logger.error(err)
            return null
        }
    }
    static async cancelSubscribing(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const YouId: number = req.body.YouId
            await Subscribe.update({
                subscribeState: SUBSCRIBE_STATE.CANCEL
            }, {
                where: {
                    subscriberId: UserId,
                    subscribingId: YouId,
                }, transaction
            })
            return true
        } catch (err) {
            logger.error('cancelSubscribing')
            logger.error(err)
            return null
        }
    }
    static async reSubscribing(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const YouId: number = req.body.YouId
            await Subscribe.update({
                subscribeState: SUBSCRIBE_STATE.ING
            }, {
                where: {
                    subscriberId: UserId,
                    subscribingId: YouId,
                }, transaction
            })
            return true
        } catch (err) {
            logger.error('reSubscribing')
            logger.error(err)
            return null
        }
    }

    static async getMySubscribing(req: any) {
        try {
            const pageNum: number = req.query.pageNum
            const pageSize: number = req.query.pageSize
            const UserId: number = req.id

            const subscribing: User[] = await User.findAll({
                include: [{
                    model: User,
                    as: 'Subscribings',
                    attributes: {
                        exclude: USER_ATTRIBUTE.EXCLUDE
                    },
                    order: [[{ model: Subscribe, as: 'Subscribings' }, 'subscribedAt', 'DESC']],
                    //required: false,
                }],
                where: {
                    id: UserId,
                },
                attributes: {
                    exclude: USER_ATTRIBUTE.EXCLUDE,
                },
                order: [['updatedAt', 'DESC']],
                offset: Number(pageNum * pageSize),
                limit: Number(pageSize),
            })
            return subscribing;
        } catch (err) {
            logger.error('getMySubsribing')
            logger.error(err)
            return []
        }
    }
    static async getMySubscriber(req: any, transaction?: any) {
        try {
            const pageNum: number = req.query.pageNum
            const pageSize: number = req.query.pageSize
            const UserId: number = req.id

            //Subscribe
            if (transaction) {


                let subscriber: any;
                /*
                const mcnHundredList: any = []
                const mcnMediaJDList: any = []
                const mcnHundredNotJDList: any = []


                const mcnChk100On = await Mcn.findAll({
                    where: {
                        mcningId: {
                            [Op.in]: [4613, 34390]
                        },
                        hundred100: true,
                    },
                })

                const mcnChkMediaJD = await Mcn.findAll({
                    where: {
                        mcningId: 22275,
                    },
                })
                mcnChk100On.forEach(element => {
                    mcnHundredList.push(element?.mcnerId)
                });

                mcnChkMediaJD.forEach(element => {
                    mcnMediaJDList.push(element?.mcnerId)
                });
                const mcnChk100OnNotMediaJD = await Mcn.findAll({
                    where: {
                        mcnerId: {
                            [Op.notIn]: mcnMediaJDList
                        },
                        mcningId: {
                            [Op.in]: [4613, 34390]
                        },
                    },
                })

                mcnChk100OnNotMediaJD.forEach(element => {
                    mcnHundredNotJDList.push(element?.mcnerId)
                });
                */

                const dayAfter2184 = new Date("2025-04-09")
                const dayBeFore30 = new Date("2024-05-01")

                /*if (mcnHundredNotJDList.includes(Number(req?.id))) {
                    subscriber = null;
                } else*/ if ([2184, 41521, 4266, 41052, 15961, 45679, 88430, 69786].includes(Number(req?.id))) {
                    subscriber = await User.findAll({
                        include: [{
                            model: User,
                            as: 'Subscribers',
                            attributes: {
                                exclude: USER_ATTRIBUTE.EXCLUDE
                            },
                            order: [[{ model: Subscribe, as: 'Subscribers' }, 'subscribedAt', 'DESC']],
                            required: false,
                            through: {
                                as: 'Subscribe',
                                where: {
                                    subscribedAt: {
                                        [Op.lte]: dayAfter2184,
                                    }
                                }
                            }
                        }],
                        where: {
                            id: UserId,
                        }, transaction,
                        attributes: {
                            exclude: USER_ATTRIBUTE.EXCLUDE,
                        },
                        offset: Number(pageNum * pageSize),
                        limit: Number(pageSize),
                    })
                }
                else if ([41521, 8833, 15842, 1823, 1430, 2184, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 7661].includes(Number(req?.id)) /*|| mcnHundredList.includes(Number(req?.id))*/) {
                    subscriber = await User.findAll({
                        include: [{
                            model: User,
                            as: 'Subscribers',
                            attributes: {
                                exclude: USER_ATTRIBUTE.EXCLUDE
                            },
                            order: [[{ model: Subscribe, as: 'Subscribers' }, 'subscribedAt', 'DESC']],
                            required: false,
                            through: {
                                as: 'Subscribe',
                                where: {
                                    subscribedAt: {
                                        [Op.lte]: dayBeFore30,
                                    }
                                }
                            }
                        }],
                        where: {
                            id: UserId,
                        }, transaction,
                        attributes: {
                            exclude: USER_ATTRIBUTE.EXCLUDE,
                        },
                        offset: Number(pageNum * pageSize),
                        limit: Number(pageSize),
                    })
                } else {
                    subscriber = await User.findAll({
                        include: [{
                            model: User,
                            as: 'Subscribers',
                            attributes: {
                                exclude: USER_ATTRIBUTE.EXCLUDE
                            },
                            order: [[{ model: Subscribe, as: 'Subscribers' }, 'subscribedAt', 'DESC']],
                            required: false,
                        }],
                        where: {
                            id: UserId,
                        }, transaction,
                        attributes: {
                            exclude: USER_ATTRIBUTE.EXCLUDE,
                        },
                        offset: Number(pageNum * pageSize),
                        limit: Number(pageSize),
                    })
                }

                return subscriber;
            } else {
                let subscriber: any;
                /*
                const mcnHundredList: any = []
                const mcnMediaJDList: any = []
                const mcnHundredNotJDList: any = []


                const mcnChk100On = await Mcn.findAll({
                    where: {
                        mcningId: {
                            [Op.in]: [4613, 34390]
                        },
                        hundred100: true,
                    },
                })

                const mcnChkMediaJD = await Mcn.findAll({
                    where: {
                        mcningId: 22275,
                    },
                })
                mcnChk100On.forEach(element => {
                    mcnHundredList.push(element?.mcnerId)
                });

                mcnChkMediaJD.forEach(element => {
                    mcnMediaJDList.push(element?.mcnerId)
                });
                const mcnChk100OnNotMediaJD = await Mcn.findAll({
                    where: {
                        mcnerId: {
                            [Op.notIn]: mcnMediaJDList
                        },
                        mcningId: {
                            [Op.in]: [4613, 34390]
                        },
                    },
                })

                mcnChk100OnNotMediaJD.forEach(element => {
                    mcnHundredNotJDList.push(element?.mcnerId)
                });
                */

                const dayAfter2184 = new Date("2025-04-09")
                const dayBeFore30 = new Date("2024-05-01")

                /*if (mcnHundredNotJDList.includes(Number(req?.id))) {
                    subscriber = null;
                } else*/ if ([2184, 41521, 4266, 41052, 15961, 45679, 88430, 69786].includes(Number(req?.id))) {
                    subscriber = await User.findAll({
                        include: [{
                            model: User,
                            as: 'Subscribers',
                            attributes: {
                                exclude: USER_ATTRIBUTE.EXCLUDE
                            },
                            order: [[{ model: Subscribe, as: 'Subscribers' }, 'subscribedAt', 'DESC']],
                            required: false,
                            through: {
                                as: 'Subscribe',
                                where: {
                                    subscribedAt: {
                                        [Op.lte]: dayAfter2184,
                                    }
                                }
                            }
                        }],
                        where: {
                            id: UserId,
                        },
                        attributes: {
                            exclude: USER_ATTRIBUTE.EXCLUDE,
                        },
                        offset: Number(pageNum * pageSize),
                        limit: Number(pageSize),
                    })
                }
                else if ([8833, 15842, 1823, 1430, 2184, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 7661].includes(Number(req?.id)) /*|| mcnHundredList.includes(Number(req?.id))*/) {
                    subscriber = await User.findAll({
                        include: [{
                            model: User,
                            as: 'Subscribers',
                            attributes: {
                                exclude: USER_ATTRIBUTE.EXCLUDE
                            },
                            order: [[{ model: Subscribe, as: 'Subscribers' }, 'subscribedAt', 'DESC']],
                            required: false,
                            through: {
                                as: 'Subscribe',
                                where: {
                                    subscribedAt: {
                                        [Op.lte]: dayBeFore30,
                                    }
                                }
                            }
                        }],
                        where: {
                            id: UserId,
                        },
                        attributes: {
                            exclude: USER_ATTRIBUTE.EXCLUDE,
                        },
                        offset: Number(pageNum * pageSize),
                        limit: Number(pageSize),
                    })
                } else {
                    subscriber = await User.findAll({
                        include: [{
                            model: User,
                            as: 'Subscribers',
                            attributes: {
                                exclude: USER_ATTRIBUTE.EXCLUDE
                            },
                            order: [[{ model: Subscribe, as: 'Subscribers' }, 'subscribedAt', 'DESC']],
                            required: false,
                        }],
                        where: {
                            id: UserId,
                        },
                        attributes: {
                            exclude: USER_ATTRIBUTE.EXCLUDE,
                        },
                        offset: Number(pageNum * pageSize),
                        limit: Number(pageSize),
                    })
                }
                return subscriber;
            }
        } catch (err) {
            logger.error('getMySubscriber')
            logger.error(err)
            return []
        }
    }


    static async getMySubscriberCs(link: string,) {
        try {
            const pageNum: number = 0
            const pageSize: number = 20

            let subscriber: any;

            subscriber = await User.findAll({
                subQuery: false,
                include: [{
                    model: User,
                    as: 'Subscribers',
                    attributes: {
                        exclude: USER_ATTRIBUTE.EXCLUDE
                    },
                    required: false,
                }],
                where: {
                    link,
                },
                attributes: {
                    exclude: USER_ATTRIBUTE.EXCLUDE,

                },
                order: [[sequelize.literal('`Subscribers.Subscribe.subscribedAt`'), 'DESC']],
                offset: Number(pageNum * pageSize),
                limit: Number(pageSize),
            })
            return subscriber;
        } catch (err) {
            logger.error('getMySubscriberCs')
            logger.error(err)
            return []
        }
    }
    static async getMySubscriberAndRoomMan(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            //Subscribe
            const subscriber: any = await User.findAll({
                include: [{
                    model: User,
                    as: 'Subscribers',
                    attributes: {
                        exclude: USER_ATTRIBUTE.EXCLUDE
                    },
                    where: {
                        [Op.or]: [{
                            gender: USER_GENDER.BOY,
                        }, {
                            roles: USER_ROLE.CS_USER
                        }]
                    },
                    order: [[{ model: Subscribe, as: 'Subscribers' }, 'subscribedAt', 'DESC']],
                }],
                where: {
                    id: UserId,
                }, transaction,
                attributes: {
                    exclude: USER_ATTRIBUTE.EXCLUDE,
                },
            })
            return subscriber;
        } catch (err) {
            logger.error('getMySubscriberAndRoom')
            logger.error(err)
            return []
        }
    }

    static async getMySubscriberAndRoom(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            //Subscribe
            const subscriber: any = await User.findAll({
                include: [{
                    model: User,
                    as: 'Subscribers',
                    attributes: {
                        exclude: USER_ATTRIBUTE.EXCLUDE
                    },

                    order: [[{ model: Subscribe, as: 'Subscribers' }, 'subscribedAt', 'DESC']],
                }],
                where: {
                    id: UserId,
                }, transaction,
                attributes: {
                    exclude: USER_ATTRIBUTE.EXCLUDE,
                },
            })
            return subscriber;
        } catch (err) {
            logger.error('getMySubscriberAndRoom')
            logger.error(err)
            return []
        }
    }

    static async removeFanStep(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const FanStepId: number = req.body.FanStepId

            const fanStep = await FanStep.destroy({
                where: {
                    UserId,
                    id: FanStepId
                }, transaction
            })
            await Benifit.create({
                where: {
                    UserId,
                    FanStepId
                }, transaction
            })
            return fanStep
        } catch (err) {
            logger.error('removeFanStep')
            logger.error(err)
            return null
        }
    }

    static async updateFanStep(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const FanStepId: number = req.body.FanStepId
            const title: string = req.body.title
            const step: number = req.body.step
            const duration: number = 0//req.body.duration
            const price: number = req.body.price
            const benifits: any[] = req.body.benifits


            const fanstep = await FanStep.findOne({
                where: {
                    id: FanStepId,
                }, transaction
            })
            await Post.update({
                step: step,
            }, {
                where: {
                    step: fanstep?.step,
                    UserId,
                }, transaction
            })

            await FanStep.update({
                title,
                step,
                duration,
                price,
            }, {
                where: {
                    id: FanStepId,
                    UserId
                }, transaction
            })
            await Benifit.destroy({
                where: {
                    FanStepId,
                    UserId,
                }, transaction
            })
            for await (const list of benifits) {
                await Benifit.create({
                    UserId,
                    content: list.content,
                    FanStepId
                }, { transaction })
            }
            return true
        } catch (err) {
            logger.error('createFanStep')
            logger.error(err)
            return null
        }
    }

    static async createFanStep(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const title: string = req.body.title
            const step: number = req.body.step
            const duration: number = 0//req.body.duration
            const price: number = req.body.price
            const benifits: [] = req.body.benifits

            const fanStep = await FanStep.create({
                UserId,
                title,
                step,
                duration,
                price,
            }, { transaction })

            for await (const list of benifits) {
                await Benifit.create({
                    UserId,
                    content: list,
                    FanStepId: fanStep.id
                }, { transaction })
            }
            return fanStep
        } catch (err) {
            logger.error('createFanStep')
            logger.error(err)
            return null
        }
    }

    static async getMyFanStepTransaction(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const fanStep = await FanStep.findAll({
                include: [{
                    model: Benifit
                }],
                where: {
                    UserId,
                }, transaction,
                order: [['step', 'ASC']],
            })
            let possibleStep = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            fanStep.forEach((list: any) => {
                possibleStep = possibleStep.filter((item) => Number(item) !== list['dataValues']?.step)
            })
            return [fanStep, possibleStep]
        } catch (err) {
            logger.error('getMyFanStep')
            logger.error(err)
            return [null, null]
        }
    }
    static async getMyFanStep(req: any) {
        try {
            const UserId: number = req.id
            const fanStep = await FanStep.findAll({
                include: [{
                    model: Benifit
                }],
                where: {
                    UserId,
                },
                order: [['step', 'ASC']],
            })
            let possibleStep = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            fanStep.forEach((list: any) => {
                possibleStep = possibleStep.filter((item) => Number(item) !== list['dataValues']?.step)
            })
            return [fanStep, possibleStep]
        } catch (err) {
            logger.error('getMyFanStep')
            logger.error(err)
            return [null, null]
        }
    }
    static async getProfileFanStep(req: any) {
        try {
            let YouId: number = req.query?.YouId
            const link: string = req.query?.link
            const platform: string = req.query?.platform
            if (platform === 'web') {
                const you: any = await UserService.findLinkOne(link)
                YouId = you?.id
            }
            if (!YouId) return []
            const fanStep = await FanStep.findAll({
                include: [{
                    model: Benifit
                }],
                where: {
                    UserId: YouId,
                },
                order: [['step', 'ASC']],
            })
            return fanStep
        } catch (err) {
            logger.error('getProfileFanStep')
            logger.error(err)
            return []
        }
    }
}
export default SubscribeService
