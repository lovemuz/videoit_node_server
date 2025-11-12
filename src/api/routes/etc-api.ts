import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import { Declaration, Info, SocialLogin, User } from '../../models/index'
import sequelize from '../../models/sequelize'
import Sequelize from 'sequelize'
import passport from 'passport'
import axios from 'axios'
import { body, query } from 'express-validator';
import { validatorErrorChecker } from '../middlewares/validator'
import { authJWT, authAdminJWT } from '../middlewares/authJWT'
import { logger } from '../../config/winston'
import { createClient } from 'redis';
import { v4 } from 'uuid';
import {
    upload,
    deleteS3,
    awsSimpleEmailService,
    uploadOut,
    uploadIn,
    smsPublish,
    mailgunSimpleEmailService,
    uploadAuth,
    uploadOutAuth,
    uploadInAuth,
} from '../middlewares/aws'
import DeclarationService from '../../services/declarationService'
import UserService from '../../services/userService'
import AuthService from '../../services/authService'
import { setValue, getValue, deleteValue } from '../middlewares/redis'
import { errorLogGet, errorLogPost } from '../middlewares/logCombine'
import bcrypt from 'bcrypt'
import { USER_GENDER } from '../../constant/user-constant'
//import Jimp from 'jimp'


const router = express.Router()
const Op = Sequelize.Op

export default (app: any, apiLimiter: any, subdomain: any) => {
    if (process.env.DEV_MODE === 'production')
        app.use(subdomain('api', router))
    app.use('/etc', router)
    app.use('/etc', apiLimiter)
    router.use((req, res, next) => {
        /* res.locals 값추가 가능*/
        next()
    })


    router.post('/passwordEmailVerification', [
        body('email').exists(),
        body('country').optional(),
        validatorErrorChecker
    ], async (req: any, res: any, next: any) => {
        try {
            const email: string = req.body.email

            //sns유저가 아닐때 
            const user = await User.findOne({
                where: {
                    email,
                    sns: null,
                    snsId: null,
                }
            })
            const slChk = await SocialLogin.findOne({
                where: {
                    UserId: user?.id
                }
            })
            if (user && !slChk) {
                const randomNumber = await AuthService.generate6DigitRandom()
                //문자 api
                await setValue(email, randomNumber.toString(), 60 * 5)
                let title: string = '앤모먼트 이메일 인증 - NMOMENT Email Certification'
                let content: string = `The email verification number is ${randomNumber}`
                awsSimpleEmailService('traveltofindlife@gmail.com', email, title, content)
                return res.status(200).json({ status: 'true' })
            } else {
                return res.status(200).json({ status: 'false' })
            }
        } catch (err) {
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.post('/emailVerification', [
        body('email').exists(),
        body('country').optional(),
        validatorErrorChecker
    ], async (req: any, res: any, next: any) => {
        try {
            const email: string = req.body.email

            const user = await User.findOne({
                where: {
                    email,
                    sns: null,
                    snsId: null,
                }
            })
            if (user) {
                return res.status(200).json({ status: 'false' })
            }

            const randomNumber = await AuthService.generate6DigitRandom()
            //문자 api
            await setValue(email, randomNumber.toString(), 60 * 5)
            let title: string = '앤모먼트 이메일 인증 - NMOMENT Email Certification'
            let content: string = `The email verification number is ${randomNumber}`
            awsSimpleEmailService('traveltofindlife@gmail.com', email, title, content)
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/emailCodeCheck', [
        body('email').exists(),
        body('code').exists(),
        validatorErrorChecker
    ], async (req: any, res: any, next: any) => {

        try {
            const email: string = req.body.email
            const code: string = req.body.code
            const redisCode: string = await getValue(email)

            if (!redisCode) return res.status(200).json({ status: 'expire' })
            if (redisCode.toString() !== code.toString()) return res.status(200).json({ status: 'false' })
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/emailCodeCheckAndUpdatePassword', [
        body('email').exists(),
        body('code').exists(),
        validatorErrorChecker
    ], async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const email: string = req.body.email
            const code: string = req.body.code
            const redisCode: string = await getValue(email)


            if (!redisCode) {
                await transaction.commit()
                return res.status(200).json({ status: 'expire' })
            }

            //count ++ 
            let emailVerifyCount: number = await getValue(`emailVerifyCount:${email}`)
            if (isNaN(emailVerifyCount)) {
                await setValue(`emailVerifyCount:${email}`, 1, 60 * 60)
                emailVerifyCount = 1
            } else {
                const afterNumber = Number(emailVerifyCount) + 1
                await setValue(`emailVerifyCount:${email}`, afterNumber, 60 * 60)
            }
            if (emailVerifyCount >= 5) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }

            if (redisCode.toString() !== code.toString()) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }

            const user = await User.findOne({
                where: {
                    email,
                    sns: null,
                    snsId: null,
                }, transaction
            })
            const slChk = await SocialLogin.findOne({
                where: {
                    UserId: user?.id
                }, transaction
            })
            if (user && !slChk) {
                const tokens = v4().split('-')
                const password: string = `${tokens[0]}${tokens[1]}`
                const hash = await bcrypt.hash(password, 12)

                awsSimpleEmailService('traveltofindlife@gmail.com', email, 'New password is', password)
                //유저 비밀번호 바꾸고 이메일날리기
                await User.update({
                    password: hash
                }, {
                    where: {
                        email,
                        sns: null,
                        snsId: null,
                    }, transaction
                })
                await transaction.commit()
                return res.status(200).json({ status: 'true' })
            }
            else {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/phoneVerification', [
        body('phone').exists(),
        body('country').optional(),
        validatorErrorChecker
    ], async (req: any, res: any, next: any) => {
        try {
            const phone: string = req.body.phone
            const randomNumber = await AuthService.generate6DigitRandom()
            //문자 api
            await setValue(phone, randomNumber.toString(), 60 * 5)
            //let title: string = '앤모먼트 이메일 인증'
            let content: string = `NMOMENT authentication number is [${randomNumber}]`
            //awsSimpleEmailService('traveltofindlife@gmail.com', phone, title, content)
            smsPublish(phone, content)
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.post('/phoneCodeCheckAndUpdatePassword', [
        body('phone').exists(),
        body('code').exists(),
        validatorErrorChecker
    ], async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const phone: string = req.body.phone
            const code: string = req.body.code
            const redisCode: string = await getValue(phone)

            if (!redisCode) {
                await transaction.commit()
                return res.status(200).json({ status: 'expire' })
            }
            if (redisCode.toString() !== code.toString()) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }
            const tokens = v4().split('-')
            const password: string = `${tokens[0]}${tokens[1]}`
            const hash = await bcrypt.hash(password, 12)

            let content: string = `NMOMENT The new password is ${password}`
            //awsSimpleEmailService('traveltofindlife@gmail.com', phone, title, content)
            smsPublish(phone, content)
            //awsSimpleEmailService('traveltofindlife@gmail.com', email, 'New password is', password)
            //유저 비밀번호 바꾸고 이메일날리기
            await User.update({
                password: hash
            }, {
                where: {
                    phone
                }
            })
            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/emailUpdateByCodeCheck', [
        body('email').exists(),
        body('code').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const email: string = req.body.email
            const code: string = req.body.code
            //문자 api
            const redisCode: string = await getValue(email)
            if (!redisCode) {
                await transaction.commit()
                return res.status(200).json({ status: 'expire' })
            }
            if (redisCode.toString() !== code.toString()) {
                await transaction.commit()
                return res.status(200).json({ status: 'false' })
            }
            //이메일 업데이트
            await UserService.updateEmail(req, transaction)
            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })



    router.post('/certifications/v2', [
        body('imp_uid').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            const imp_uid: string = req.body.imp_uid
            const getToken = await axios({
                url: 'https://api.iamport.kr/users/getToken',
                method: 'post',
                headers: { 'Content-Type': 'application/json' },
                data: {
                    imp_key: process.env.DANAL_KEY,
                    imp_secret: process.env.DANAL_SECRET,
                },
            })
            const { access_token } = getToken.data.response // 인증 토큰
            // imp_uid로 인증 정보 조회
            const getCertifications = await axios({
                url: `https://api.iamport.kr/certifications/${imp_uid}`, // imp_uid 전달
                method: 'get', // GET method
                headers: { Authorization: access_token }, // 인증 토큰 Authorization header에 추가
            })
            const certificationsInfo = getCertifications.data.response
            if (!certificationsInfo) return res.status(200).json({ status: 'false' })

            const phone = certificationsInfo?.phone;
            const real_gender =
                certificationsInfo?.gender === "male"
                    ? USER_GENDER.BOY
                    : USER_GENDER.GIRL;
            const real_birthday = Number(
                certificationsInfo?.birthday?.slice(0, 4)
            );
            const UserId: number = req.id

            const info = await Info.findOne({
                where: {
                    phone,
                }, transaction
            })
            if (!info) {
                await Info.create({
                    phone,
                    real_birthday,
                    real_gender
                }, { transaction })

                const userTicketCount: any = await User.findOne({
                    where: {
                        id: UserId,
                    }, transaction
                })
                await User.update({
                    ticket: Number(userTicketCount?.ticket + 1),
                    phone,
                    real_birthday,
                    real_gender
                }, {
                    where: {
                        id: UserId,
                    }, transaction
                })
            } else {
                await User.update({
                    phone,
                    real_birthday,
                    real_gender
                }, {
                    where: {
                        id: UserId,
                    }, transaction
                })
            }
            const user = await User.findOne({
                where: {
                    id: UserId,
                }, transaction
            })
            await transaction.commit()
            return res.status(200).json({ status: 'true', user })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/certifications', [
        body('imp_uid').exists(),
        validatorErrorChecker
    ], async (req: any, res: any, next: any) => {
        try {
            const imp_uid: string = req.body.imp_uid
            const getToken = await axios({
                url: 'https://api.iamport.kr/users/getToken',
                method: 'post',
                headers: { 'Content-Type': 'application/json' },
                data: {
                    imp_key: process.env.DANAL_KEY,
                    imp_secret: process.env.DANAL_SECRET,
                },
            })
            const { access_token } = getToken.data.response // 인증 토큰
            // imp_uid로 인증 정보 조회
            const getCertifications = await axios({
                url: `https://api.iamport.kr/certifications/${imp_uid}`, // imp_uid 전달
                method: 'get', // GET method
                headers: { Authorization: access_token }, // 인증 토큰 Authorization header에 추가
            })
            const certificationsInfo = getCertifications.data.response
            if (!certificationsInfo) return res.status(200).json({ status: 'false' })
            const adultChk = certificationsInfo.birthday.slice(0, 4)
            const date = new Date()
            if (Number(adultChk) <= Number(date.getFullYear() - 19)) {//19 가 스무살 체크
                //성인
                return res.status(200).json({ status: 'true', certificationsInfo })
            } else {
                return res.status(200).json({ status: 'false' })
            }
        } catch (err) {
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })



    router.post('/declaration', [
        body('UserId').optional(),
        body('PostId').optional(),
        body('RoomId').optional(),
        body('url').optional(),
        body('type').exists(),
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        const transaction = await sequelize.transaction()
        try {
            await DeclarationService.createDeclaration(req, transaction)
            await transaction.commit()
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            await transaction.rollback()
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/phoneVerify', [
        body('phone').exists(),
        body('email').optional(),
        body('sns').optional(),
        body('snsId').optional(),
        validatorErrorChecker
    ], async (req: any, res: any, next: any) => {
        try {
            let phone: string = req.body.phone
            phone = phone.toString().replace(/-/g, "").replace(/ /g, "")
            const sns: string = req.body.sns
            const snsId: string = req.body.snsId
            //전화번호 계정 이미 존재하면 return false and sns 계정은 없는것으로 확인했기 때문에 폰이 있어도 넘어가야함
            if (!sns && !snsId) {
                const exUser = await UserService.findUserByPhoneCheck(phone)
                if (exUser) return res.status(200).json({ status: 'false' })
            }
            //전화번호 있으면
            const randomNumber = AuthService.generate6DigitRandom()
            //문자 api
            setValue(phone, (await randomNumber).toString(), 60 * 5)
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.post('/phoneCodeCheck', [
        body('code').exists(),
        body('phone').exists(),
        body('email').optional(),
        body('sns').optional(),
        body('snsId').optional(),
        validatorErrorChecker
    ], async (req: any, res: any, next: any) => {
        try {
            const code: string = req.body.code
            let phone: string = req.body.phone
            phone = phone.toString().replace(/-/g, "").replace(/ /g, "")
            const redisCode: string = await getValue(phone)
            const sns: string = req.body.sns
            const snsId: string = req.body.snsId
            if (!redisCode) return res.status(200).json({ status: 'expire' })
            if (redisCode.toString() !== code.toString()) return res.status(200).json({ status: 'false' })
            else {
                await deleteValue(phone)
            }
            if (sns && snsId) {
                //계정합치고 로그인 그냥 진행시켜야함

            }
            return res.status(200).json({ status: 'true' })
        } catch (err) {
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/addImg', upload.single('file'), async (req: any, res, next) => {
        try {
            const url: string = `${process.env.CLOUD_FRONT_STORAGE}/storage/${req.file.location?.split("/")[
                req.file.location?.split("/").length - 1
            ]}`
            return res.json({ url })
        } catch (err) {
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


    router.post('/addImg/auth', authJWT, uploadAuth.single('file'), async (req: any, res, next) => {
        try {
            const UserId: number = req.id
            const url: string = `${process.env.CLOUD_FRONT_STORAGE}/storage/${UserId}/${req.file.location?.split("/")[
                req.file.location?.split("/").length - 1
            ]}`
            return res.json({ url })
        } catch (err) {
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


    router.post('/addImgSecureImage', uploadOut.single('file'), async (req: any, res, next) => {
        try {
            const url: string = `https://nmoment-container-secure-out.s3.ap-northeast-2.amazonaws.com/${req.file.location?.split("/")[
                req.file.location?.split("/").length - 1
            ]}`
            return res.json({ url })
        } catch (err) {
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/addImgSecureImage/auth', authJWT, uploadOutAuth.single('file'), async (req: any, res, next) => {
        try {
            const UserId: number = req.id
            const url: string = `https://nmoment-container-secure-out.s3.ap-northeast-2.amazonaws.com/${UserId}/${req.file.location?.split("/")[
                req.file.location?.split("/").length - 1
            ]}`
            return res.json({ url })
        } catch (err) {
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


    router.post('/addImgSecureVideo/auth', authJWT, uploadInAuth.single('file'), async (req: any, res, next) => {
        try {
            const UserId: number = req.id
            const url: string = `https://nmoment-container-secure-out.s3.ap-northeast-2.amazonaws.com/${UserId}/${req.file.location?.split("/")[
                req.file.location?.split("/").length - 1
            ]}.m3u8`
            return res.json({ url })
        } catch (err) {
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    router.post('/addImgSecureVideo', uploadIn.single('file'), async (req: any, res, next) => {
        try {
            const url: string = `https://nmoment-container-secure-out.s3.ap-northeast-2.amazonaws.com/${req.file.location?.split("/")[
                req.file.location?.split("/").length - 1
            ]}.m3u8`
            return res.json({ url })
        } catch (err) {
            errorLogPost(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


}
