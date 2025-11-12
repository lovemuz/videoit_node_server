import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import { Chat, Post, Rank, User } from '../../models/index'
import sequelize from '../../models/sequelize'
import Sequelize from 'sequelize'
import passport from 'passport'
import axios from 'axios'
import { body, query } from 'express-validator';
import { validatorErrorChecker } from '../middlewares/validator'
import { authJWT, authAdminJWT } from '../middlewares/authJWT'
import { logger } from '../../config/winston'
import RankService from '../../services/rankService'
import { errorLogGet } from '../middlewares/logCombine'
import PostService from '../../services/postService'
import { verify } from '../middlewares/jwt-util'
import ChatService from '../../services/chatService'
import { getSeucreObjectImageS3 } from '../middlewares/aws'

const router = express.Router()
const Op = Sequelize.Op

export default (app: any, apiLimiter: any, subdomain: any) => {
    if (process.env.DEV_MODE === 'production')
        app.use(subdomain('api', router))
    app.use('/secure', router)
    app.use('/secure', apiLimiter)
    router.use((req, res, next) => {
        /* res.locals 값추가 가능*/
        next()
    })
    router.get('/chat', [
        query('ChatId').exists(),
        query('accessToken').exists(),
        validatorErrorChecker
    ], async (req: any, res: any, next: any) => {
        try {
            const accessToken: string = req.query.accessToken
            const result = verify(accessToken)
            if (!result.id) {
                return res.status(200).json({ status: 'error' })
            }
            const UserId: number = result.id
            const ChatId: number = req.query.ChatId
            const chat: Chat = await ChatService.getFindSecureChatOne(UserId, ChatId)
            return res.status(200).json({ status: 'true', chat, UserId })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    router.get('/post', [
        query('PostId').exists(),
        query('accessToken').exists(),
        validatorErrorChecker
    ], async (req: any, res: any, next: any) => {
        try {
            const accessToken: string = req.query.accessToken
            const result = verify(accessToken)
            if (!result.id) {
                return res.status(200).json({ status: 'error' })
            }
            const UserId: number = result?.id
            const PostId: number = req.query.PostId
            const post: Post = await PostService.getFindSecurePostOne(UserId, PostId)
            return res.status(200).json({ status: 'true', post, UserId })
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })


    //add water mark
    router.get('/post/image/:PostId', [
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            if (!req.id) return res.status(400).json({ status: 'error' })
            const PostId: number = req.params.PostId
            const UserId: number = req.id
            const post: Post = await PostService.getFindSecurePostOne(UserId, PostId)
            if (post?.url) {
                getSeucreObjectImageS3(post?.url, res, UserId, post?.type)
            } else {
                return res.status(200)
            }
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    //add water mark
    router.get('/chat/image/:ChatId', [
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const UserId: number = req.id
            const ChatId: number = req.params.ChatId
            const chat: Chat = await ChatService.getFindSecureChatOne(UserId, ChatId)
            if (chat?.url) {
                getSeucreObjectImageS3(chat?.url, res, UserId, chat?.type)
            } else {
                return res.status(200)
            }
            //return res.status(200).json({})
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    //add water mark
    router.get('/post/video/:PostId', [
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            if (!req.id) return res.status(400).json({ status: 'error' })
            const PostId: number = req.params.PostId
            const post: Post = await PostService.getFindSecurePostOne(req, PostId)
            if (post?.thumbnail) {
                getSeucreObjectImageS3(post?.thumbnail, res, req.id, post?.type)
            } else {
                return res.status(200)
            }
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })

    //add water mark
    router.get('/chat/video/:ChatId', [
        validatorErrorChecker
    ], authJWT, async (req: any, res: any, next: any) => {
        try {
            const UserId: number = req.id
            const ChatId: number = req.params.ChatId
            const chat: Chat = await ChatService.getFindSecureChatOne(UserId, ChatId)
            if (chat?.thumbnail) {
                getSeucreObjectImageS3(chat?.thumbnail, res, UserId, chat?.type)
            } else {
                return res.status(200)
            }
            //return res.status(200).json({})
        } catch (err) {
            errorLogGet(req, err)
            return res.status(400).json({ status: 'error' })
        }
    })
    /*
        router.get('/post/video/:PostId', [
            // validatorErrorChecker
        ], authJWT, async (req: any, res: any, next: any) => {
            try {
                if (!req.id) return res.status(400).json({ status: 'error' })
                const PostId: number = req.params.PostId
                const post: Post = await PostService.getFindSecurePostOne(req, PostId)
                getSeucreObjectVideoS3(post?.url, res)
            } catch (err) {
                console.error(`[ Error Url - /secure${req.url} ]`)
                console.error(`[ Error query - ${JSON.stringify(req.query)} ]`)
                console.error(err)
                //errorLogGet(req, err)
                return res.status(400).json({ status: 'error' })
            }
        })
        router.get('/post/image/:PostId', [
            validatorErrorChecker
        ], authJWT, async (req: any, res: any, next: any) => {
            try {
                if (!req.id) return res.status(400).json({ status: 'error' })
                const PostId: number = req.params.PostId
                const post: Post = await PostService.getFindSecurePostOne(req, PostId)
                getSeucreObjectImageS3(post?.url, res)
            } catch (err) {
                errorLogGet(req, err)
                return res.status(400).json({ status: 'error' })
            }
        })
    
        router.get('/chat/:ChatId', [
            validatorErrorChecker
        ], async (req: any, res: any, next: any) => {
            try {
                const UserId: number = req.id
                const ChatId: number = req.params.ChatId
                return res.status(200).json({})
            } catch (err) {
                errorLogGet(req, err)
                return res.status(400).json({ status: 'error' })
            }
        })
        */
}
