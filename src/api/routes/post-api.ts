import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import { AlarmSetting, Donation, Earn, Mcn, Money, Payment, Post, User } from '../../models/index'
import sequelize from '../../models/sequelize'
import Sequelize from 'sequelize'
import passport from 'passport'
import axios from 'axios'
import { body, query } from 'express-validator';
import { validatorErrorChecker } from '../middlewares/validator'
import { authJWT, authAdminJWT } from '../middlewares/authJWT'
import { logger } from '../../config/winston'
import PostService from '../../services/postService'
import WishService from '../../services/wishService'
import PointService from '../../services/pointService'
import { errorLogGet, errorLogPost } from '../middlewares/logCombine'
import UserService from '../../services/userService'
import { FCMPushNotification } from '../middlewares/fcm-notification'
import { ALARM_TYPE } from '../../constant/alarm-constant'
import AlarmService from '../../services/alarmService'
import { awsSimpleEmailService, mailgunSimpleEmailService } from '../middlewares/aws'
import { COUNTRY_LIST } from '../../constant/country-constant'
import { slackPostMessage } from '../middlewares/slack'
import { SLACK_CHANNEL } from '../../constant/slack-constant'

const router = express.Router()
const Op = Sequelize.Op

export default (app: any, apiLimiter: any, subdomain: any) => {
    if (process.env.DEV_MODE === 'production')
        app.use(subdomain('api', router))
    app.use('/post', router)
    app.use('/post', apiLimiter)
    router.use((req, res, next) => {
        /* res.locals 값추가 가능*/
        next()
    })


    router.get('/postList', [
        query('pageNum').exists(),
        query('pageSize').exists(),
        query('country').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const postList: Post[] = await PostService.postList(req)
            return res.status(200).json({ postList })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.get('/postList/v2', [
        query('pageNum').exists(),
        query('pageSize').exists(),
        query('postType').exists(),
        query('country').exists(),
        query('platform').optional(),
        query('APP_VERSION').optional(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {

            const { country, platform, APP_VERSION } = req.query
            if (country === COUNTRY_LIST.미국 &&
                String(process.env.APP_VERSION) >= String(APP_VERSION) &&
                /*platform === 'android' ||*/ platform === 'ios') {
                const postList: Post[] = await PostService.postListV2Fake(req)
                return res.status(200).json({ postList })
            }
            const postList: Post[] = await PostService.postListV2(req)
            return res.status(200).json({ postList })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


    router.get('/postUserListLengthNotLogin', [
        query('YouId').optional(),
        query('link').optional(),
        query('platform').optional(),
        validatorErrorChecker
    ], async (req: any, res: any, next: any) => {
        try {
            const postLength: number = await PostService.postUserListLength(req)
            return res.status(200).json({ postLength })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.get('/postUserListLength', [
        query('YouId').optional(),
        query('link').optional(),
        query('platform').optional(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const postLength: number = await PostService.postUserListLength(req)
            return res.status(200).json({ postLength })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


    router.get('/postUserList', [
        query('YouId').optional(),
        query('platform').optional(),
        query('link').optional(),
        query('pageNum').exists(),
        query('pageSize').exists(),
        query('country').optional(),
        query('platform').optional(),
        query('APP_VERSION').optional(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const { country, platform, APP_VERSION } = req.query
            if (country === COUNTRY_LIST.미국 &&
                String(process.env.APP_VERSION) >= String(APP_VERSION) &&
                /*platform === 'android' ||*/ platform === 'ios') {
                return res.status(200).json({ postList: [] })
            }
            const postList: Post[] = await PostService.postUserList(req)
            return res.status(200).json({ postList })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.get('/postUserListNotLogin', [
        query('YouId').optional(),
        query('platform').optional(),
        query('link').optional(),
        query('pageNum').exists(),
        query('pageSize').exists(),
        validatorErrorChecker
    ], async (req: any, res: any, next: any) => {
        try {
            const postList: Post[] = await PostService.postUserList(req)
            return res.status(200).json({ postList })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.get('/postGallery', [
        query('YouId').exists(),
        query('pageNum').exists(),
        query('pageSize').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const galleryList: Post[] = await PostService.postGallery(req)
            return res.status(200).json({ galleryList })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.get('/getPostAndChatGalleryAll', [
        query('YouId').exists(),
        query('pageNum').exists(),
        query('pageSize').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const galleryList: any = await PostService.getPostAndChatGalleryAll(req)
            return res.status(200).json({ galleryList })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.get('/postInfoNotLogin', [
        query('PostId').exists(),
        validatorErrorChecker
    ], async (req: any, res: any, next: any) => {
        try {
            const post: Post | null = await PostService.postInfoNotLogin(req)
            return res.status(200).json({ post })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


    router.get('/postDetail', [
        query('PostId').exists(),
        query('platform').optional(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const post: Post | null = await PostService.postDetail(req)
            return res.status(200).json({ post })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


    router.post('/createComment', [
        body('content').exists(),
        body('PostId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const [comment, post]: any = await PostService.createComment(req, transaction)
            const user: any = await UserService.findUserOne(req.id)
            const you: any = await UserService.findUserOne(post.UserId)
            if (you?.AlarmSetting.comment) {
                FCMPushNotification(
                    user?.nick,
                    '새로운 댓글이 달렸어요.',
                    you?.pushToken,
                    user?.profile,
                    {
                        screen: 'Comment',
                        PostId: req.body.PostId.toString(),
                    }
                )
            }
            await transaction.commit()
            return res.status(200).json({ status: 'true', comment })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/removeComment', [
        body('CommentId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const result = await PostService.removeComment(req, transaction)
            if (result) {
                await transaction.commit()
                return res.status(200).json({ status: 'true' })
            }
            else {
                await transaction.rollback()
                return res.status(400).json({ status: 'false' })
            }
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })




    router.post('/updatePost/v2', [
        body('content').exists(),
        body('lock').optional(),
        body('cost').optional(),
        body('step').optional(),
        body('adult').optional(),
        body('contentSecret').optional(),
        body('onlyMember').optional(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const user = await User.findOne({
                where: {
                    id: req.id
                }, transaction
            })
            if (user?.withdrawState) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }
            const post = await PostService.updatePostv2(req, transaction)
            await transaction.commit()
            return res.status(200).json({ status: 'true', post })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/updatePost', [
        body('content').exists(),
        body('lock').optional(),
        body('cost').optional(),
        body('step').optional(),
        body('adult').optional(),
        body('contentSecret').optional(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const post = await PostService.updatePost(req, transaction)
            await transaction.commit()
            return res.status(200).json({ status: 'true', post })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


    router.post('/createPost', [
        body('type').optional(),
        body('title').optional(),
        body('content').exists(),
        body('url').optional(),
        body('lock').optional(),
        body('cost').optional(),
        body('step').optional(),
        body('thumbnail').optional(),
        body('adult').optional(),
        body('contentSecret').optional(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const post = await PostService.createPost(req, transaction)
            //follow 가져오기
            const follower: any = await UserService.getMyFollow(req, transaction)

            const user: any = await UserService.findUserOne(req?.id)
            if (follower?.Followers) {
                follower?.Followers?.forEach((list: any) => {
                    req.app
                        .get('io')
                        .of('/connect')
                        .to(list?.id?.toString())
                        .emit('newPost', { you: user })

                })
            }

            function chunk(data: any = [], size = 1) {
                const arr = [];

                for (let i = 0; i < data.length; i += size) {
                    arr.push(data.slice(i, i + size));
                }

                return arr;
            }
            const newResult = chunk(follower?.Followers, 500)

            newResult?.map((item: any, idx: number) => {
                setTimeout(() => {
                    item?.forEach((list: any) => {
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
                    })
                }, idx * 1500)
            })

            await transaction.commit()
            return res.status(200).json({ status: 'true', post })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


    router.post('/createPost/v2', [
        body('type').optional(),
        body('title').optional(),
        body('content').exists(),
        body('url').optional(),
        body('lock').optional(),
        body('cost').optional(),
        body('step').optional(),
        body('thumbnail').optional(),
        body('adult').optional(),
        body('contentSecret').optional(),
        body('onlyMember').optional(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const post = await PostService.createPostv2(req, transaction)
            //follow 가져오기
            const follower: any = await UserService.getMyFollow(req, transaction)

            const user: any = await UserService.findUserOne(req?.id)
            if (follower?.Followers) {
                follower?.Followers?.forEach((list: any) => {
                    req.app
                        .get('io')
                        .of('/connect')
                        .to(list?.id?.toString())
                        .emit('newPost', { you: user })
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
                })
            }
            await transaction.commit()
            return res.status(200).json({ status: 'true', post })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.put('/updatePost', [
        body('title').optional(),
        body('content').exists(),
        body('PostId').exists(),
        body('url').optional(),
        body('lock').optional(),
        body('cost').optional(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            if ([49648, 41521, 41014, 41017, 41252, 1733, 4266, 22222, 8833, 15842, 1823, 419, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 7661].includes(Number(req?.id))) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }
            //await UserService.tokenUpdate(req, transaction);
            await PostService.updatePost(req, transaction)
            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.delete('/removePost', [
        body('PostId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const user = await User.findOne({
                where: {
                    id: req.id
                }, transaction
            })
            if (user?.withdrawState) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }
            if ([49648, 41521, 41014, 41017, 41252, 1733, 4266, 22222, 8833, 15842, 26086, 1823, 419, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 7661, 27634].includes(Number(req?.id))) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }

            //await UserService.tokenUpdate(req, transaction);
            const result = await PostService.removePost(req, transaction)
            if (!result) {
                await transaction.commit()
                return res.status(200).json({ status: 'claim' })
            } else {
                await transaction.commit()
                return res.status(200).json({ status: 'true' })
            }
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/purchasePost', [
        body('PostId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const PostId: number = req.body?.PostId
            const point: any = await PointService.getMyPoint(req, transaction)
            const post: any = await PostService.getFindPostOne(req, PostId)


            const mcn = await Mcn.findOne({
                where: {
                    mcnerId: req.id,
                    // mcningId: 22275
                }
            })
            if (mcn) {
                await transaction.commit()
                return res.status(200).json({ status: 'mcn' })
            }

            if (Number(post.cost) <= -1) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }
            if (Number(point?.amount) < Number(post?.cost)) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }

            let randomSeed = 1;
            /*
            if ([212].includes(Number(post?.UserId))) {
                randomSeed = Math.floor(Math.random() * 3)
            }
            */
            req.body.randomSeed = randomSeed

            await PostService.purchasePost(req, transaction, post)
            const user: any = await UserService.findUserOne(req?.id)
            const you: any = await UserService.findUserOne(post?.UserId)




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
            if (mcnChk100On.length > 0) {
                await Promise.all(mcnChk100On.map(async (list: any, idx: number) => {
                    const mcnUser = await User.findOne({
                        where: {
                            id: list?.mcningId
                        }, transaction
                    })
                    const amount = post.cost * 83 * 0.01
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
                        mcnerId: post?.UserId,
                    }, transaction
                })
                if (mcnChk) {
                    await Promise.all(mcnChk.map(async (list: any, idx: number) => {
                        const mcnUser = await User.findOne({
                            where: {
                                id: list?.mcningId
                            }, transaction
                        })
                        const amount = post.cost * list?.creatorCharge * 0.01
                        await Money.increment({
                            amount: amount,
                        }, {
                            where: {
                                UserId: mcnUser?.id
                            }, transaction
                        })
                        if (mcnUser?.email?.split('@')[1] !== 'privaterelay.appleid.com')
                            awsSimpleEmailService('traveltofindlife@gmail.com', `${mcnUser?.email}`, 'Post Purchase!', `Congratulation! you earn ${amount} Point By ${you?.nick}`)
                    }))
                }
            }


            if (randomSeed !== 0 && ![49648, 41521, 41014, 41017, 41252, 1733, 4266, 22222, 8833, 15842, 1823, 225, 1853, 270, 848, 417, 2101, 8018, 2814, 1579, 7661].includes(Number(you?.id)) && !mcnHundredList.includes(Number(you?.id))) {
                const donation = await Donation.findOne({
                    where: {
                        donationerId: user?.id,
                        donationingId: you?.id,
                    }, transaction
                })
                if (donation) {
                    await Donation.increment({
                        amount: post.cost,
                    }, {
                        where: {
                            donationerId: user?.id,
                            donationingId: you?.id,
                        },
                        transaction
                    })
                } else {
                    await Donation.create({
                        amount: post.cost,
                        donationerId: user?.id,
                        donationingId: you?.id,
                    }, { transaction })
                }

                await Earn.create({
                    year: new Date().getFullYear(),
                    month: new Date().getMonth() + 1,
                    amount: post.cost,
                    donationerId: user?.id,
                    donationingId: you?.id,
                }, { transaction })

                FCMPushNotification(
                    user?.nick,
                    '포스트를 구매하였습니다.',
                    you?.pushToken,
                    user?.profile,
                    {
                        screen: 'Profile',
                        YouId: you?.id.toString(),
                    }
                )
                await AlarmService.createAlarm(ALARM_TYPE.ALARM_POST, `${user?.nick}님이 포스트를 구매하였습니다.`, you.id, user.id, post?.id, undefined, undefined, transaction)
                /*
                if (you.email) {
                    if (you?.email?.split('@')[1] !== 'privaterelay.appleid.com')
                        awsSimpleEmailService('traveltofindlife@gmail.com', `${you?.email}`, 'Post Purchase!', `Congratulation! you earn ${post?.cost} Point By ${user?.nick}`)
                }
                    */
            }


            slackPostMessage(SLACK_CHANNEL.PAYMENT_LOG,
                `Post Purchase!
                Congratulation! you earn ${post?.cost} Price
                ${user?.nick} -> ${you?.nick}
                UserId:${user?.id}
                link:${user?.link}
                회원가입 날짜:${user?.createdAt?.toLocaleDateString()}

                `
            )
            // awsSimpleEmailService('traveltofindlife@gmail.com', `traveltofindlife@gmail.com`, 'Post Purchase!', `Congratulation! you earn ${post?.cost} Price , ${user?.nick} -> ${you?.nick}`)
            // awsSimpleEmailService('traveltofindlife@gmail.com', `kakabal@naver.com`, 'Post Purchase!', `Congratulation! you earn ${post?.cost} Price , ${user?.nick} -> ${you?.nick}`)



            await transaction.commit()
            return res.status(200).json({ status: 'true', post })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/createWish', [
        body('PostId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            //await UserService.tokenUpdate(req, transaction);
            const wish = await WishService.createWish(req, transaction)
            await transaction.commit()
            return res.status(200).json({ status: 'true', wish })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.delete('/removeWish', [
        body('PostId').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            //await UserService.tokenUpdate(req, transaction);
            const WishId = await WishService.removeWish(req, transaction)
            await transaction.commit()
            return res.status(200).json({ status: 'true', WishId })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })




}
