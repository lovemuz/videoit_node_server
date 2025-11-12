import { User, Container, sequelize, Post, Comment, CommentChild, Wish, Authority, Point, PointHistory, Room, Subscribe, Follow, Mcn } from '../models/index'
import bcrypt from 'bcrypt'
import { logger } from '../config/winston'
//import { PAYMENT_STATE } from '../constant/payment-constant'
import Sequelize from 'sequelize'
import { USER_ATTRIBUTE, USER_ROLE } from '../constant/user-constant'
import { POINT_HISTORY } from '../constant/point-constant'
import { deleteS3, getSeucreObject } from '../api/middlewares/aws'
import ChatService from './chatService'
import RoomService from './roomSerivce'
import UserService from './userService'
import { slackPostMessage } from '../api/middlewares/slack'
import { SLACK_CHANNEL } from '../constant/slack-constant'
const Op = Sequelize.Op

class PostService {
    constructor() { }

    static async getFindPostOne(req: any, PostId: number) {
        try {
            //const UserId:number=req.id
            const post = await Post.findOne({
                where: {
                    id: PostId
                },
            })
            return post
        } catch (err) {
            logger.error('getFindPostOne')
            logger.error(err)
            return null
        }
    }


    static async getFindSecurePostOne(UserId: number, PostId: number) {
        try {
            const post: any = await Post.findOne({
                subQuery: false,
                include: [{
                    model: Authority,
                    where: {
                        UserId,
                    },
                    required: false,
                },],
                where: {
                    id: PostId
                },
            })
            const subscribe: any = await Subscribe.findOne({
                where: {
                    subscriberId: UserId,
                    subscribingId: post?.UserId,
                }
            })

            const mcn: any = await Mcn.findOne({
                where: {
                    mcnerId: post?.UserId,
                    mcningId: UserId,
                }
            })

            if (!mcn && Number(post?.UserId) !== Number(UserId) && post?.cost >= -1 && post?.lock && (!post?.Authorities[0] &&
                Number(subscribe?.step ? subscribe?.step : 0) < Number(post?.step))) {
                post['dataValues'].url = null
            }
            return post
        } catch (err) {
            logger.error('getFindPostSecurePostOne')
            logger.error(err)
            return null
        }
    }

    static async purchasePost(req: any, transaction: any, post: any) {
        try {
            const UserId: number = req.id
            const PostId: number = req.body.PostId
            let randomSeed: number = req.body.randomSeed

            await Authority.create({
                UserId,
                PostId,
            }, { transaction })

            await PointHistory.create({
                UserId,
                type: POINT_HISTORY.TYPE_POST,
                plusOrMinus: POINT_HISTORY.MINUS,
                amount: post.cost
            }, { transaction })




            const mcnHundredList: any = []
            const mcnChk100On = await Mcn.findAll({
                where: {
                    mcningId: {
                        [Op.in]: [4613, 34390]
                    },
                    hundred100: true,
                },
            })
            mcnChk100On.forEach(element => {
                mcnHundredList.push(element?.mcnerId)
            });

            if (randomSeed !== 0 && ![8833, 15842, 1823, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 7661].includes(Number(post?.UserId)) && !mcnHundredList.includes(Number(post?.UserId))) {
                await Point.increment({
                    amount: post.cost,
                }, {
                    where: {
                        UserId: post.UserId,
                    },
                    transaction
                })
                await PointHistory.create({
                    UserId: post.UserId,
                    type: POINT_HISTORY.TYPE_POST,
                    plusOrMinus: POINT_HISTORY.PLUS,
                    amount: post.cost
                }, { transaction })
            }
            await Point.decrement({
                amount: post.cost,
            }, {
                where: {
                    UserId,
                },
                transaction
            })
            return true
        } catch (err) {
            logger.error('purchasePost')
            logger.error(err)
            return null
        }
    }

    static async createComment(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const content: string = req.body.content
            const PostId: number = req.body.PostId
            const post = await Post.findOne({
                where: {
                    id: PostId
                }
            })
            const comment: Comment | null = await Comment.create({
                content,
                PostId,
                UserId,
            }, { transaction })
            return [comment, post]
        } catch (err) {
            logger.error('createComment')
            logger.error(err)
            return null
        }
    }
    static async createPostv2(req: any, transaction: any) {
        try {
            //cost 가 -1이면 안뜨도록, 
            const UserId: number = req.id
            const type: number = req.body.type
            const title: string = req.body.title
            const content: string = req.body.content
            const url: string = req.body.url
            const lock: boolean = req.body.lock
            const cost: number = lock === false ? 0 : req.body.step !== 11 && req.body.onlyMember ? -1 : req.body.cost
            const step: number = lock === false ? 0 : req.body.step ? req.body.step : 11
            const thumbnail: string = req.body.thumbnail
            const adult: string = req.body?.adult
            const contentSecret: boolean = req.body?.contentSecret


            const created = await Post.create({
                type,
                title,
                content,
                url,
                lock,
                cost,
                UserId,
                step,
                thumbnail,
                adult,
                contentSecret
            }, { transaction })

            const post: any = await Post.findOne({
                subQuery: false,
                include: [{
                    model: Comment,
                    as: 'Comments',
                    separate: true,

                }, {
                    model: Wish,
                    separate: true,
                    required: false,
                }, {
                    model: User,
                    as: 'User',
                    required: false,
                    attributes: {
                        exclude: USER_ATTRIBUTE.EXCLUDE,
                    },
                }],
                where: {
                    id: created.id
                }, transaction
            })

            const did = post.Wishes.filter((item: any) => Number(item.UserId) === Number(UserId))
            if (did[0]?.id) {
                post['dataValues'].wishCheck = true
            } else {
                post['dataValues'].wishCheck = false
            }

            return post
        } catch (err) {
            logger.error('createPost')
            logger.error(err)
            return null
        }
    }
    static async createPost(req: any, transaction: any) {
        try {
            //cost 가 -1이면 안뜨도록, 
            const UserId: number = req.id
            const type: number = req.body.type
            const title: string = req.body.title
            const content: string = req.body.content
            const url: string = req.body.url
            const lock: boolean = req.body.lock
            const cost: number = lock === false ? 0 : req.body.cost
            const step: number = lock === false ? 0 : req.body.step ? req.body.step : 11
            const thumbnail: string = req.body.thumbnail
            const adult: string = req.body?.adult
            const contentSecret: boolean = req.body?.contentSecret

            const created = await Post.create({
                type,
                title,
                content,
                url,
                lock,
                cost,
                UserId,
                step,
                thumbnail,
                adult,
                contentSecret
            }, { transaction })

            const post: any = await Post.findOne({
                subQuery: false,
                include: [{
                    model: Comment,
                    as: 'Comments',
                    separate: true,

                }, {
                    model: Wish,
                    separate: true,
                    required: false,
                }, {
                    model: User,
                    as: 'User',
                    required: false,
                    attributes: {
                        exclude: USER_ATTRIBUTE.EXCLUDE,
                    },
                }],
                where: {
                    id: created.id
                }, transaction
            })

            const did = post.Wishes.filter((item: any) => Number(item.UserId) === Number(UserId))
            if (did[0]?.id) {
                post['dataValues'].wishCheck = true
            } else {
                post['dataValues'].wishCheck = false
            }

            return post
        } catch (err) {
            logger.error('createPost')
            logger.error(err)
            return null
        }
    }

    static async updatePostv2(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const PostId: number = req.body.PostId
            const content: string = req.body.content
            const lock: boolean = req.body.lock
            const cost: number = lock === false ? 0 : req.body.step !== 11 && req.body.onlyMember ? -1 : req.body.cost
            const step: number = lock === false ? 0 : req.body.step ? req.body.step : 11
            const adult: string = req.body?.adult
            const contentSecret: boolean = req.body?.contentSecret
            await Post.update({
                content,
                lock,
                cost,
                step,
                adult,
                contentSecret
            }, {
                where: {
                    UserId,
                    id: PostId
                },
                transaction
            })
            return true
        } catch (err) {
            logger.error('createPost')
            logger.error(err)
            return null
        }
    }
    static async updatePost(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const PostId: number = req.body.PostId
            const content: string = req.body.content
            const lock: boolean = req.body.lock
            const cost: number = lock === false ? 0 : req.body.cost
            const step: number = lock === false ? 0 : req.body.step ? req.body.step : 11
            const adult: string = req.body?.adult
            const contentSecret: boolean = req.body?.contentSecret
            await Post.update({
                content,
                lock,
                cost,
                step,
                adult,
                contentSecret
            }, {
                where: {
                    UserId,
                    id: PostId
                },
                transaction
            })
            return true
        } catch (err) {
            logger.error('createPost')
            logger.error(err)
            return null
        }
    }

    static async removeComment(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const CommentId: number = req.body.CommentId
            //CommentId

            const comment: any = await Comment.findOne({
                include: [{ model: Post }],
                where: {
                    id: CommentId
                }
            })
            if (comment?.UserId === UserId || comment?.Post?.UserId === UserId || req?.roles === USER_ROLE.ADMIN_USER || req?.roles === USER_ROLE.CS_USER) {
                await Comment.destroy({
                    where: {
                        //UserId,
                        id: CommentId
                    },
                    transaction
                })
                return true
            } else return false
        } catch (err) {
            logger.error('removeComment')
            logger.error(err)
            return null
        }


    }
    static async removePost(req: any, transaction: any) {
        try {
            const UserId: number = req.id
            const PostId: number = req.body.PostId
            const post: any = await Post.findOne({
                where: {
                    id: PostId,
                }, transaction
            })



            if (req?.roles === USER_ROLE.ADMIN_USER || req?.roles === USER_ROLE.CS_USER) {
                await Post.destroy({
                    where: {
                        id: PostId
                    },
                    transaction
                })
            } else {
                const authority = await Authority.findOne({
                    where: {
                        PostId,
                    }
                })
                const subs = Subscribe.findOne({
                    where: {
                        subscribingId: UserId,
                        step: post?.step,
                    }
                })
                if ((!authority && !subs) || Number(post.step) === 0) {
                    await Post.destroy({
                        where: {
                            UserId,
                            id: PostId
                        },
                        transaction
                    })
                } else {
                    //지우면 안되는 경우
                    const user = await User.findOne({
                        where: {
                            id: post?.UserId
                        }, transaction
                    })
                    slackPostMessage(SLACK_CHANNEL.CS,
                        `게시글 삭제 요청
                        요청자: ${user?.nick}
                        UserId: ${user?.id}
                        link: ${user?.link}
                        PostId: ${post?.id}
                        삭제요청 일시: ${new Date()}
              
                      `
                    )
                    await Post.update({
                        removeState: true,
                        removeApplyedAt: new Date()
                    }, {
                        where: {
                            UserId,
                            id: PostId
                        }, transaction
                    })

                    return false
                }
            }
            return true
        } catch (err) {
            logger.error('removePost')
            logger.error(err)
            return null
        }
    }

    static async postUserListLength(req: any) {
        try {
            let YouId: number = req.query?.YouId
            const link: string = req.query?.link
            const platform: string = req.query?.platform
            if (platform === 'web') {
                const you: any = await UserService.findLinkOne(link)
                YouId = you?.id
            }
            const postLength: number = await Post.count({
                where: {
                    UserId: YouId,
                }
            })
            return postLength
        } catch (err) {
            logger.error('postUserListLength')
            logger.error(err)
            return 0
        }
    }


    static async postListByAssist(req: any) {
        try {
            const UserId: number = req.id
            const pageNum: number = req.query.pageNum
            const pageSize: number = req.query.pageSize
            // const postType: number = req.query.postType
            // const country: string = req.query.country
            let post: any
            post = await Post.findAll({
                subQuery: false,
                include: [{
                    model: Comment,
                    as: 'Comments',
                    separate: true,

                }, {
                    model: Authority,
                    where: {
                        UserId,
                    },
                    required: false,
                }, {
                    model: Wish,
                    separate: true,
                    required: false,
                }, {
                    model: User,
                    as: 'User',
                    required: false,
                    attributes: {
                        exclude: USER_ATTRIBUTE.EXCLUDE,
                    },
                }],
                where: {

                },
                order: [['createdAt', 'DESC']],
                offset: Number(pageNum * pageSize),
                limit: Number(pageSize),
            })

            for await (const list of post) {
                if (list.cost >= -1 && list.lock) {
                    list['dataValues'].free = false
                } else {
                    list['dataValues'].free = true
                }
                // if (/*관리자 cs는 볼수있게 추가해야함*/
                // Number(list.UserId) !== Number(UserId) && list.cost >= -1 && list.lock) {
                // list['dataValues'].url = null
                // }
                const did = list.Wishes.filter((item: any) => Number(item.UserId) === Number(UserId))

                if (did[0]?.id) {
                    list['dataValues'].wishCheck = true
                } else {
                    list['dataValues'].wishCheck = false
                }
            }
            return post
        } catch (err) {
            logger.error('postListAssist')
            logger.error(err)
            return null
        }
    }

    static async postListV2(req: any) {
        try {
            const UserId: number = req.id
            const pageNum: number = req.query.pageNum
            const pageSize: number = req.query.pageSize
            const postType: number = req.query.postType
            const country: string = req.query.country
            const platform: string = req.query?.platform


            let country_attr: any = {}
            if (country === 'ko') {
                country_attr[Op.eq] = country
            } else {
                country_attr[Op.not] = null
            }
            let post: any

            if (Number(postType) === 0) {
                const following = await UserService.getMyAllFollowing(req)
                const userIdList: any = []
                userIdList.push(UserId)
                if (following[0].Followings) {
                    following[0].Followings.forEach((list: any) => {
                        userIdList.push(list?.id)
                    })
                }
                if (platform === 'web') {
                    post = await Post.findAll({
                        subQuery: false,
                        include: [{
                            model: Comment,
                            as: 'Comments',
                            separate: true,

                        }, {
                            model: Authority,
                            where: {
                                UserId,
                            },
                            required: false,
                        }, {
                            model: Wish,
                            separate: true,
                            required: false,
                        }, {
                            model: User,
                            as: 'User',
                            required: false,
                            attributes: {
                                exclude: USER_ATTRIBUTE.EXCLUDE,
                            },
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
                        }],
                        where: {
                            '$User.postShowApp$': false,
                            '$User.Banners.id$': null,
                            '$User.Bannings.id$': null,
                            '$User.country$': country_attr,
                            lock: false,
                            adult: false,
                            UserId: {
                                [Op.in]: userIdList
                            }
                        },
                        group: ['Post.id'],
                        order: [['createdAt', 'DESC']],
                        offset: Number(pageNum * pageSize),
                        limit: Number(pageSize),
                    })
                } else {
                    post = await Post.findAll({
                        subQuery: false,
                        include: [{
                            model: Comment,
                            as: 'Comments',
                            separate: true,

                        }, {
                            model: Authority,
                            where: {
                                UserId,
                            },
                            required: false,
                        }, {
                            model: Wish,
                            separate: true,
                            required: false,
                        }, {
                            model: User,
                            as: 'User',
                            required: false,
                            attributes: {
                                exclude: USER_ATTRIBUTE.EXCLUDE,
                            },
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
                        }],
                        where: {
                            '$User.Banners.id$': null,
                            '$User.Bannings.id$': null,
                            '$User.country$': country_attr,
                            lock: false,
                            adult: false,
                            UserId: {
                                [Op.in]: userIdList
                            }
                        },
                        group: ['Post.id'],
                        order: [['createdAt', 'DESC']],
                        offset: Number(pageNum * pageSize),
                        limit: Number(pageSize),
                    })
                }
            } else if (Number(postType) === 1) {
                if (platform === 'web') {
                    post = await Post.findAll({
                        subQuery: false,
                        include: [{
                            model: Comment,
                            as: 'Comments',
                            separate: true,

                        }, {
                            model: Authority,
                            where: {
                                UserId,
                            },
                            required: false,
                        }, {
                            model: Wish,
                            separate: true,
                            required: false,
                        }, {
                            model: User,
                            as: 'User',
                            required: false,
                            attributes: {
                                exclude: USER_ATTRIBUTE.EXCLUDE,
                            },
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
                        }],
                        where: {
                            '$User.postShowApp$': false,
                            '$User.Banners.id$': null,
                            '$User.Bannings.id$': null,
                            '$User.country$': country_attr,
                            lock: false,
                            adult: false,
                        },
                        group: ['Post.id'],
                        order: [['createdAt', 'DESC']],
                        offset: Number(pageNum * pageSize),
                        limit: Number(pageSize),
                    })
                } else {
                    post = await Post.findAll({
                        subQuery: false,
                        include: [{
                            model: Comment,
                            as: 'Comments',
                            separate: true,

                        }, {
                            model: Authority,
                            where: {
                                UserId,
                            },
                            required: false,
                        }, {
                            model: Wish,
                            separate: true,
                            required: false,
                        }, {
                            model: User,
                            as: 'User',
                            required: false,
                            attributes: {
                                exclude: USER_ATTRIBUTE.EXCLUDE,
                            },
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
                        }],
                        where: {
                            '$User.Banners.id$': null,
                            '$User.Bannings.id$': null,
                            '$User.country$': country_attr,
                            lock: false,
                            adult: false,
                        },
                        group: ['Post.id'],
                        order: [['createdAt', 'DESC']],
                        offset: Number(pageNum * pageSize),
                        limit: Number(pageSize),
                    })
                }

            }

            for await (const list of post) {
                if (/*관리자 cs는 볼수있게 추가해야함*/
                    Number(list.UserId) !== Number(UserId) && list.cost >= -1 && list.lock) {
                    list['dataValues'].url = null
                }
                const did = list.Wishes.filter((item: any) => Number(item.UserId) === Number(UserId))

                if (did[0]?.id) {
                    list['dataValues'].wishCheck = true
                } else {
                    list['dataValues'].wishCheck = false
                }
            }
            return post
        } catch (err) {
            logger.error('postList')
            logger.error(err)
            return null
        }
    }

    static async postListV2Fake(req: any) {
        try {
            const UserId: number = req.id
            const pageNum: number = req.query.pageNum
            const pageSize: number = req.query.pageSize
            const postType: number = req.query.postType
            const country: string = req.query.country
            let country_attr: any = {}
            if (country === 'ko') {
                country_attr[Op.eq] = country
            } else {
                country_attr[Op.not] = null
            }
            let post: any

            if (Number(postType) === 0) {
                const following = await UserService.getMyAllFollowing(req)
                const userIdList: any = []
                userIdList.push(UserId)
                if (following[0].Followings) {
                    following[0].Followings.forEach((list: any) => {
                        userIdList.push(list?.id)
                    })
                }
                post = await Post.findAll({
                    subQuery: false,
                    include: [{
                        model: Comment,
                        as: 'Comments',
                        separate: true,

                    }, {
                        model: Authority,
                        where: {
                            UserId,
                        },
                        required: false,
                    }, {
                        model: Wish,
                        separate: true,
                        required: false,
                    }, {
                        model: User,
                        as: 'User',
                        required: false,
                        attributes: {
                            exclude: USER_ATTRIBUTE.EXCLUDE,
                        },
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
                    }],
                    where: {
                        '$User.Banners.id$': null,
                        '$User.Bannings.id$': null,
                        '$User.country$': country_attr,
                        lock: false,
                        adult: false,
                        UserId: {
                            [Op.in]: [225, 5064, 34045, 6, 30287, 1006]
                        }
                    },
                    group: ['Post.id'],
                    order: [['createdAt', 'DESC']],
                    offset: Number(pageNum * pageSize),
                    limit: Number(pageSize),
                })
            } else if (Number(postType) === 1) {
                post = await Post.findAll({
                    subQuery: false,
                    include: [{
                        model: Comment,
                        as: 'Comments',
                        separate: true,

                    }, {
                        model: Authority,
                        where: {
                            UserId,
                        },
                        required: false,
                    }, {
                        model: Wish,
                        separate: true,
                        required: false,
                    }, {
                        model: User,
                        as: 'User',
                        required: false,
                        attributes: {
                            exclude: USER_ATTRIBUTE.EXCLUDE,
                        },
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
                    }],
                    where: {
                        '$User.Banners.id$': null,
                        '$User.Bannings.id$': null,
                        '$User.country$': country_attr,
                        lock: false,
                        adult: false,
                        UserId: {
                            [Op.in]: [225, 5064, 34045, 6, 30287, 1006]
                        }
                    },
                    group: ['Post.id'],
                    order: [['createdAt', 'DESC']],
                    offset: Number(pageNum * pageSize),
                    limit: Number(pageSize),
                })
            }

            for await (const list of post) {
                if (/*관리자 cs는 볼수있게 추가해야함*/
                    Number(list.UserId) !== Number(UserId) && list.cost >= -1 && list.lock) {
                    list['dataValues'].url = null
                }
                const did = list.Wishes.filter((item: any) => Number(item.UserId) === Number(UserId))
                if (did[0]?.id) {
                    list['dataValues'].wishCheck = true
                } else {
                    list['dataValues'].wishCheck = false
                }
            }
            return post
        } catch (err) {
            logger.error('postList')
            logger.error(err)
            return null
        }
    }
    static async postList(req: any) {
        try {
            const UserId: number = req.id
            const pageNum: number = req.query.pageNum
            const pageSize: number = req.query.pageSize
            const country: string = req.query.country
            let country_attr: any = {}
            if (country === 'ko') {
                country_attr[Op.eq] = country
            } else {
                country_attr[Op.not] = null
            }
            const post: any = await Post.findAll({
                subQuery: false,
                include: [{
                    model: Comment,
                    as: 'Comments',
                    separate: true,

                }, {
                    model: Authority,
                    where: {
                        UserId,
                    },
                    required: false,
                }, {
                    model: Wish,
                    separate: true,
                    required: false,
                }, {
                    model: User,
                    as: 'User',
                    required: false,
                    attributes: {
                        exclude: USER_ATTRIBUTE.EXCLUDE,
                    },
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
                }],
                where: {
                    '$User.Banners.id$': null,
                    '$User.Bannings.id$': null,
                    '$User.country$': country_attr,
                    lock: false,
                    adult: false,
                },
                group: ['Post.id'],
                order: [['createdAt', 'DESC']],
                offset: Number(pageNum * pageSize),
                limit: Number(pageSize),
            })

            for await (const list of post) {
                if (/*관리자 cs는 볼수있게 추가해야함*/

                    Number(list.UserId) !== Number(UserId) && list.cost >= -1 && list.lock) {
                    list['dataValues'].url = null
                }
                const did = list.Wishes.filter((item: any) => Number(item.UserId) === Number(UserId))
                if (did[0]?.id) {
                    list['dataValues'].wishCheck = true
                } else {
                    list['dataValues'].wishCheck = false
                }
            }
            return post
        } catch (err) {
            logger.error('postList')
            logger.error(err)
            return null
        }
    }
    static async postUserList(req: any) {
        try {
            if (req?.id) {
                const UserId: number = req.id
                let YouId: number = req.query?.YouId

                const pageNum: number = req.query.pageNum
                const pageSize: number = req.query.pageSize

                const link: string = req.query?.link
                const platform: string = req.query?.platform
                if (platform === 'web') {
                    const you: any = await UserService.findLinkOne(link)
                    YouId = you?.id
                }

                //구독자인지 화인하고
                const subscribe: any = await Subscribe.findOne({
                    where: {
                        subscriberId: UserId,
                        subscribingId: YouId,
                    }
                })

                const post: any = await Post.findAll({
                    subQuery: false,
                    include: [{
                        model: Comment,
                        as: 'Comments',
                        separate: true,
                    }, {
                        model: Authority,
                        where: {
                            UserId,
                        },
                        required: false,
                    }, {
                        model: Wish,
                        separate: true,
                        required: false,
                    }, {
                        model: User,
                        attributes: {
                            exclude: USER_ATTRIBUTE.EXCLUDE,
                        },
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

                    }],
                    where: {
                        '$User.Banners.id$': null,
                        '$User.Bannings.id$': null,
                        UserId: YouId,
                    },
                    order: [['createdAt', 'DESC']],
                    offset: Number(pageNum * pageSize),
                    limit: Number(pageSize),
                })

                const user = await UserService.findUserOne(req.id)


                const mcn: any = await Mcn.findOne({
                    where: {
                        mcnerId: YouId,
                        mcningId: req.id,
                    }
                })

                for await (const list of post) {
                    list['dataValues'].rContentSecret = list['dataValues'].contentSecret
                    if (
                        !mcn &&
                        user?.roles !== USER_ROLE.CS_USER &&
                        user?.roles !== USER_ROLE.ADMIN_USER &&
                        Number(list.UserId) !== Number(UserId) &&
                        list.cost >= -1 &&
                        list.lock &&
                        (!list?.Authorities[0] &&
                            Number(subscribe?.step ? subscribe?.step : -1) < Number(list?.step))
                    ) {
                        list['dataValues'].url = null
                    } else if (list?.contentSecret) {
                        list['dataValues'].contentSecret = false
                    }
                    /*
                    if (
                        user?.roles !== USER_ROLE.CS_USER &&
                        user?.roles !== USER_ROLE.ADMIN_USER &&
                        (list?.User?.postShowApp || link === '@love_707') && platform === 'web') {
                        list['dataValues'].url = null
                        if (list?.User?.postShowApp && list?.cost === 0 && list?.type !== 0) {
                            list['dataValues'].cost = -1
                        }
                    }
                        */
                    const did = list.Wishes.filter((item: any) => Number(item.UserId) === Number(UserId))
                    if (did[0]?.id) {
                        list['dataValues'].wishCheck = true
                    } else {
                        list['dataValues'].wishCheck = false
                    }
                }
                return post;
            } else {
                let YouId: number = req.query?.YouId

                const pageNum: number = req.query.pageNum
                const pageSize: number = req.query.pageSize

                const link: string = req.query?.link
                const platform: string = req.query?.platform
                if (platform === 'web') {
                    const you: any = await UserService.findLinkOne(link)
                    YouId = you?.id
                }
                const post: any = await Post.findAll({
                    subQuery: false,
                    include: [{
                        model: Comment,
                        as: 'Comments',
                        separate: true,
                    }, {
                        model: Wish,
                        separate: true,
                        required: false,
                    }, {
                        model: User,
                        attributes: {
                            exclude: USER_ATTRIBUTE.EXCLUDE,
                        },
                    }],
                    where: {
                        UserId: YouId,
                    },
                    order: [['createdAt', 'DESC']],
                    offset: Number(pageNum * pageSize),
                    limit: Number(pageSize),
                })
                for await (const list of post) {
                    if (
                        list.cost >= -1 &&
                        list.lock
                    ) {
                        list['dataValues'].url = null
                    }
                    list['dataValues'].wishCheck = false
                }
                return post;
            }
        } catch (err) {
            logger.error('postUserList')
            logger.error(err)
            return null
        }

    }



    static async getPostAndChatGalleryAll(req: any) {
        try {
            const UserId: number = req.id
            const YouId: number = req.query.YouId
            const pageNum: number = req.query.pageNum
            const pageSize: number = req.query.pageSize

            const subscribe: any = await Subscribe.findOne({
                where: {
                    subscriberId: UserId,
                    subscribingId: YouId,
                }
            })


            const mcn: any = await Mcn.findOne({
                where: {
                    mcnerId: YouId,
                    mcningId: UserId,
                }
            })

            let post: any = await Post.findAll({
                subQuery: false,
                include: [{
                    model: Authority,
                    where: {
                        UserId,
                    },
                    required: false,
                }, {
                    model: Wish,
                    where: {
                        UserId,
                    },
                    required: false,
                }, {
                    model: User,
                    attributes: {
                        exclude: USER_ATTRIBUTE.EXCLUDE,
                    },
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
                }],
                where: {
                    '$User.Banners.id$': null,
                    '$User.Bannings.id$': null,
                    UserId: YouId,
                    url: {
                        [Op.not]: null
                    }
                },
                order: [['createdAt', 'DESC']],
                offset: Number(pageNum * pageSize),
                limit: Number(pageSize),
            })
            const user = await UserService.findUserOne(req.id)

            for await (const list of post) {
                if (/*관리자 cs는 볼수있게 추가해야함*/
                    !mcn &&
                    user?.roles !== USER_ROLE.CS_USER &&
                    user?.roles !== USER_ROLE.ADMIN_USER &&
                    Number(list.UserId) !== Number(UserId) && list.cost >= -1 && list.lock &&
                    (!list?.Authorities[0] &&
                        Number(subscribe?.step ? subscribe?.step : -1) < Number(list?.step))
                ) {
                    list['dataValues'].url = null
                } else if (list?.url) {
                    //list['dataValues'].url = await getSeucreObject(list['dataValues'].url)
                }
                const did = list.Wishes.filter((item: any) => Number(item.UserId) === Number(UserId))
                if (did[0]?.id) {
                    list['dataValues'].wishCheck = true
                } else {
                    list['dataValues'].wishCheck = false
                }
            }


            const room: Room | null = await Room.findOne({
                where: {
                    [Op.or]: [{
                        [Op.and]: [
                            { MeId: YouId },
                            { YouId: UserId }
                        ],
                    }, {
                        [Op.and]: [
                            { MeId: UserId },
                            { YouId: YouId }
                        ],
                    }]
                },
            })
            if (!room) return post
            req.query.RoomId = room.id
            const chat: any = await ChatService.getRoomGallery(req)
            post = [...post, ...chat]

            post.sort((a: any, b: any) => {
                return a['dataValues'].createdAt < b['dataValues'].createdAt ? 1 : a['dataValues'].createdAt > b['dataValues'].createdAt ? -1 : 0
            })

            return post;
        } catch (err) {
            logger.error('getPostAndChatGalleryAll')
            logger.error(err)
            return null
        }
    }

    static async postGallery(req: any) {
        try {
            const UserId: number = req.id
            const YouId: number = req.query.YouId
            const pageNum: number = req.query.pageNum
            const pageSize: number = req.query.pageSize


            const subscribe: any = await Subscribe.findOne({
                where: {
                    subscriberId: UserId,
                    subscribingId: YouId,
                }
            })


            const post: any = await Post.findAll({
                subQuery: false,
                include: [{
                    model: Authority,
                    where: {
                        UserId,
                    },
                    required: false,
                }, {
                    model: Wish,
                    where: {
                        UserId,
                    },
                    required: false,
                }, {
                    model: User,
                    attributes: {
                        exclude: USER_ATTRIBUTE.EXCLUDE,
                    },
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
                }],
                where: {
                    '$User.Banners.id$': null,
                    '$User.Bannings.id$': null,
                    UserId: YouId,
                    url: {
                        [Op.not]: null
                    }
                },
                order: [['createdAt', 'DESC']],
                offset: Number(pageNum * pageSize),
                limit: Number(pageSize),
            })

            const user = await UserService.findUserOne(req.id)

            for await (const list of post) {
                if (/*관리자 cs는 볼수있게 추가해야함*/
                    user?.roles !== USER_ROLE.CS_USER &&
                    user?.roles !== USER_ROLE.ADMIN_USER &&
                    Number(list.UserId) !== Number(UserId) && list.cost >= -1 && list.lock && (!list?.Authorities[0] &&
                        Number(subscribe?.step ? subscribe?.step : -1) < Number(list?.step))) {
                    list['dataValues'].url = null
                } else if (list?.url) {
                    //list['dataValues'].url = await getSeucreObject(list['dataValues'].url)
                }
                const did = list.Wishes.filter((item: any) => Number(item.UserId) === Number(UserId))
                if (did[0]?.id) {
                    list['dataValues'].wishCheck = true
                } else {
                    list['dataValues'].wishCheck = false
                }
            }

            return post;
        } catch (err) {
            logger.error('postGallery')
            logger.error(err)
            return null
        }
    }
    static async postInfoNotLogin(req: any) {
        try {

            const PostId: number = req.query.PostId
            const post: any = await Post.findOne({
                subQuery: false,
                include: [{
                    model: User,
                    as: 'User',
                    required: false,
                    attributes: {
                        exclude: USER_ATTRIBUTE.EXCLUDE,
                    },
                }],
                where: {
                    id: PostId,
                },
            })
            if (post) post.url = null
            return post
        } catch (err) {
            logger.error('postDetail')
            logger.error(err)
            return []
        }
    }

    static async postDetail(req: any) {
        try {

            const UserId: number = req.id
            const PostId: number = req.query.PostId
            const platform: string = req.query?.platform

            const post: any = await Post.findOne({
                subQuery: false,
                include: [{
                    model: Comment,
                    as: 'Comments',
                    include: [{
                        model: CommentChild,
                        as: 'CommentChildren'
                    }, {
                        model: User,
                        attributes: {
                            exclude: USER_ATTRIBUTE.EXCLUDE,
                        }
                    }],
                    separate: true,
                }, {
                    model: Authority,
                    where: {
                        UserId,
                    },
                    required: false,
                }, {
                    model: Wish,
                    //where: {
                    //UserId,
                    //},
                    separate: true,
                    required: false,
                }, {
                    model: User,
                    as: 'User',
                    required: false,
                    attributes: {
                        exclude: USER_ATTRIBUTE.EXCLUDE,
                    },
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
                }],
                where: {
                    '$User.Banners.id$': null,
                    '$User.Bannings.id$': null,
                    id: PostId,
                },
            })

            const subscribe: any = await Subscribe.findOne({
                where: {
                    subscriberId: UserId,
                    subscribingId: post.UserId,
                }
            })
            const user = await UserService.findUserOne(req.id)
            post['dataValues'].rContentSecret = post['dataValues'].contentSecret
            if (/*관리자 cs는 볼수있게 추가해야함*/
                user?.roles !== USER_ROLE.CS_USER &&
                user?.roles !== USER_ROLE.ADMIN_USER &&
                Number(post.UserId) !== Number(UserId) && post?.cost >= -1 && post.lock && (!post?.Authorities[0] &&
                    Number(subscribe?.step ? subscribe?.step : -1) < Number(post?.step))) {
                post['dataValues'].url = null
            } else if (post?.contentSecret) {
                post['dataValues'].contentSecret = false
            }
            /*
            if ((post?.User?.postShowApp) && platform === 'web') {
                post['dataValues'].url = null
                if (post?.User?.postShowApp && post?.cost === 0 && post?.type !== 0) {
                    post['dataValues'].cost = -1
                }
            }
                */

            const did = post.Wishes.filter((item: any) => Number(item.UserId) === Number(UserId))
            if (did[0]?.id) {
                post['dataValues'].wishCheck = true
            } else {
                post['dataValues'].wishCheck = false
            }
            return post
        } catch (err) {
            logger.error('postDetail')
            logger.error(err)
            return []
        }
    }

}
export default PostService
