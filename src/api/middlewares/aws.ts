import AWS, { S3 } from 'aws-sdk'
import fs from 'fs'
//import multer from 'multer'
//import multerS3 from 'multer-s3'
import { S3Client } from '@aws-sdk/client-s3';
import { logger } from '../../config/winston'
import axios from 'axios';
import { addTextWatermark } from "sharp-watermark";
import { CONTAINER_TYPE } from '../../constant/container-constant';

const multer = require('multer')
const multerS3 = require('multer-s3')
const S3BlockReadStream = require('s3-block-read-stream');

const s3: any = AWS.config.update({
    accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
    region: 'ap-northeast-2',
})
const s3Config = new S3Client({
    region: 'ap-northeast-2',
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
    },
})



let ses = new AWS.SES()
//const S3 = new AWS.S3()
const upload = multer({
    storage: multerS3({
        s3: new AWS.S3({}),
        bucket: process.env.BUCKET as string, // 버켓명
        contentType: multerS3.AUTO_CONTENT_TYPE,
        contentLength: 500000000,
        key(req: any, file: any, cb: any) {
            let mimeType
            switch (file.mimetype) {
                case 'application/xml,':
                    mimeType = 'xml'
                    break
                case 'application/pdf':
                    mimeType = 'pdf'
                    break
                case 'audio/ogg,':
                    mimeType = 'ogg'
                    break
                case 'audio/wav':
                    mimeType = 'wav'
                    break
                case 'image/jpeg':
                    mimeType = 'jpeg'
                    break
                case 'image/png':
                    mimeType = 'png'
                    break
                case 'image/jpg':
                    mimeType = 'jpg'
                    break
                case 'image/gif':
                    mimeType = 'gif'
                    break
                case 'image/webp':
                    mimeType = 'webp'
                    break
                case 'image/bmp':
                    mimeType = 'bmp'
                    break
                case 'video/mp4':
                    mimeType = 'mp4'
                    break
                case 'video/avi':
                    mimeType = 'png'
                    break
                case 'video/mov':
                    mimeType = 'mov'
                    break
                case 'video/wmv':
                    mimeType = 'wmv'
                    break
                default:
                    mimeType = 'mp4'
                    break
            }
            cb(
                null,
                `storage/${Date.now()}${Math.random()
                    .toString(36)
                    .substring(2, 12)}${Math.random()
                        .toString(36)
                        .substring(2, 12)}${Math.random()
                            .toString(36)
                            .substring(2, 12)}${Math.random()
                                .toString(36)
                                .substring(2, 12)}${Math.random()
                                    .toString(36)
                                    .substring(2, 12)}${Math.random()
                                        .toString(36)
                                        .substring(2, 12)}${Math.random()
                                            .toString(36)
                                            .substring(2, 12)}${Math.random()
                                                .toString(36)
                                                .substring(2, 12)}.${mimeType}`,
            )
        },
    }),
    limits: { fileSize: 5500 * 1024 * 1024 },//5.5Gb
})


const uploadAuth = multer({
    storage: multerS3({
        s3: new AWS.S3({}),
        bucket: process.env.BUCKET as string, // 버켓명
        contentType: multerS3.AUTO_CONTENT_TYPE,
        contentLength: 500000000,
        key(req: any, file: any, cb: any) {
            const UserId: number = req.id
            let mimeType
            switch (file.mimetype) {
                case 'application/xml,':
                    mimeType = 'xml'
                    break
                case 'application/pdf':
                    mimeType = 'pdf'
                    break
                case 'audio/ogg,':
                    mimeType = 'ogg'
                    break
                case 'audio/wav':
                    mimeType = 'wav'
                    break
                case 'image/jpeg':
                    mimeType = 'jpeg'
                    break
                case 'image/png':
                    mimeType = 'png'
                    break
                case 'image/jpg':
                    mimeType = 'jpg'
                    break
                case 'image/gif':
                    mimeType = 'gif'
                    break
                case 'image/webp':
                    mimeType = 'webp'
                    break
                case 'image/bmp':
                    mimeType = 'bmp'
                    break
                case 'video/mp4':
                    mimeType = 'mp4'
                    break
                case 'video/avi':
                    mimeType = 'png'
                    break
                case 'video/mov':
                    mimeType = 'mov'
                    break
                case 'video/wmv':
                    mimeType = 'wmv'
                    break
                default:
                    mimeType = 'mp4'
                    break
            }
            cb(
                null,
                `storage/${UserId}/${Date.now()}${Math.random()
                    .toString(36)
                    .substring(2, 12)}${Math.random()
                        .toString(36)
                        .substring(2, 12)}${Math.random()
                            .toString(36)
                            .substring(2, 12)}${Math.random()
                                .toString(36)
                                .substring(2, 12)}${Math.random()
                                    .toString(36)
                                    .substring(2, 12)}${Math.random()
                                        .toString(36)
                                        .substring(2, 12)}${Math.random()
                                            .toString(36)
                                            .substring(2, 12)}${Math.random()
                                                .toString(36)
                                                .substring(2, 12)}.${mimeType}`,
            )
        },
    }),
    limits: { fileSize: 5500 * 1024 * 1024 },//5.5Gb
})

const deleteS3 = async (url: string) => {
    const urlKey = `storage` + url.split('storage')[1]
    const s3 = new AWS.S3()
    s3.deleteObject(
        {
            Bucket: process.env.BUCKET as string, // 사용자 버켓 이름
            Key: urlKey, // 버켓 내 경로
        },
        (err, data) => {
            if (err) {
                throw err
            }
            logger.info('s3 deleteObject ', data)
        },
    )
}



const uploadIn = multer({
    storage: multerS3({
        s3: new AWS.S3({}),
        bucket: process.env.BUCKET_IN as string, // 버켓명
        contentType: multerS3.AUTO_CONTENT_TYPE,
        contentLength: 500000000,
        key(req: any, file: any, cb: any) {
            let mimeType
            switch (file.mimetype) {
                case 'application/xml,':
                    mimeType = 'xml'
                    break
                case 'application/pdf':
                    mimeType = 'pdf'
                    break
                case 'audio/ogg,':
                    mimeType = 'ogg'
                    break
                case 'audio/wav':
                    mimeType = 'wav'
                    break
                case 'image/jpeg':
                    mimeType = 'jpeg'
                    break
                case 'image/png':
                    mimeType = 'png'
                    break
                case 'image/jpg':
                    mimeType = 'jpg'
                    break
                case 'image/gif':
                    mimeType = 'gif'
                    break
                case 'image/webp':
                    mimeType = 'webp'
                    break
                case 'image/bmp':
                    mimeType = 'bmp'
                    break
                case 'video/mp4':
                    mimeType = 'mp4'
                    break
                case 'video/avi':
                    mimeType = 'png'
                    break
                case 'video/mov':
                    mimeType = 'mov'
                    break
                case 'video/wmv':
                    mimeType = 'wmv'
                    break
                default:
                    mimeType = 'mp4'
                    break
            }
            cb(
                null,
                `${Date.now()}${Math.random()
                    .toString(36)
                    .substring(2, 12)}${Math.random()
                        .toString(36)
                        .substring(2, 12)}${Math.random()
                            .toString(36)
                            .substring(2, 12)}${Math.random()
                                .toString(36)
                                .substring(2, 12)}${Math.random()
                                    .toString(36)
                                    .substring(2, 12)}${Math.random()
                                        .toString(36)
                                        .substring(2, 12)}${Math.random()
                                            .toString(36)
                                            .substring(2, 12)}${Math.random()
                                                .toString(36)
                                                .substring(2, 12)}.${mimeType}`,
            )
        },
    }),
    limits: { fileSize: 5500 * 1024 * 1024 },//5.5Gb
})


const uploadInAuth = multer({
    storage: multerS3({
        s3: new AWS.S3({}),
        bucket: process.env.BUCKET_IN as string, // 버켓명
        contentType: multerS3.AUTO_CONTENT_TYPE,
        contentLength: 500000000,
        key(req: any, file: any, cb: any) {
            const UserId: number = req.id
            let mimeType
            switch (file.mimetype) {
                case 'application/xml,':
                    mimeType = 'xml'
                    break
                case 'application/pdf':
                    mimeType = 'pdf'
                    break
                case 'audio/ogg,':
                    mimeType = 'ogg'
                    break
                case 'audio/wav':
                    mimeType = 'wav'
                    break
                case 'image/jpeg':
                    mimeType = 'jpeg'
                    break
                case 'image/png':
                    mimeType = 'png'
                    break
                case 'image/jpg':
                    mimeType = 'jpg'
                    break
                case 'image/gif':
                    mimeType = 'gif'
                    break
                case 'image/webp':
                    mimeType = 'webp'
                    break
                case 'image/bmp':
                    mimeType = 'bmp'
                    break
                case 'video/mp4':
                    mimeType = 'mp4'
                    break
                case 'video/avi':
                    mimeType = 'png'
                    break
                case 'video/mov':
                    mimeType = 'mov'
                    break
                case 'video/wmv':
                    mimeType = 'wmv'
                    break
                default:
                    mimeType = 'mp4'
                    break
            }
            cb(
                null,
                `${UserId}/${Date.now()}${Math.random()
                    .toString(36)
                    .substring(2, 12)}${Math.random()
                        .toString(36)
                        .substring(2, 12)}${Math.random()
                            .toString(36)
                            .substring(2, 12)}${Math.random()
                                .toString(36)
                                .substring(2, 12)}${Math.random()
                                    .toString(36)
                                    .substring(2, 12)}${Math.random()
                                        .toString(36)
                                        .substring(2, 12)}${Math.random()
                                            .toString(36)
                                            .substring(2, 12)}${Math.random()
                                                .toString(36)
                                                .substring(2, 12)}.${mimeType}`,
            )
        },
    }),
    limits: { fileSize: 5500 * 1024 * 1024 },//5.5Gb
})

const deleteS3In = async (url: string) => {
    const urlKey = url.split('/')[url.split('/').length - 1]
    const s3 = new AWS.S3()
    s3.deleteObject(
        {
            Bucket: process.env.BUCKET_IN as string, // 사용자 버켓 이름
            Key: urlKey, // 버켓 내 경로
        },
        (err, data) => {
            if (err) {
                throw err
            }
            logger.info('s3 deleteObject ', data)
        },
    )
}




const uploadOut = multer({
    storage: multerS3({
        s3: new AWS.S3({}),
        bucket: process.env.BUCKET_OUT as string, // 버켓명
        contentType: multerS3.AUTO_CONTENT_TYPE,
        contentLength: 500000000,
        key(req: any, file: any, cb: any) {
            let mimeType
            switch (file.mimetype) {
                case 'application/xml,':
                    mimeType = 'xml'
                    break
                case 'application/pdf':
                    mimeType = 'pdf'
                    break
                case 'audio/ogg,':
                    mimeType = 'ogg'
                    break
                case 'audio/wav':
                    mimeType = 'wav'
                    break
                case 'image/jpeg':
                    mimeType = 'jpeg'
                    break
                case 'image/png':
                    mimeType = 'png'
                    break
                case 'image/jpg':
                    mimeType = 'jpg'
                    break
                case 'image/gif':
                    mimeType = 'gif'
                    break
                case 'image/webp':
                    mimeType = 'webp'
                    break
                case 'image/bmp':
                    mimeType = 'bmp'
                    break
                case 'video/mp4':
                    mimeType = 'mp4'
                    break
                case 'video/avi':
                    mimeType = 'png'
                    break
                case 'video/mov':
                    mimeType = 'mov'
                    break
                case 'video/wmv':
                    mimeType = 'wmv'
                    break
                default:
                    mimeType = 'mp4'
                    break
            }
            cb(
                null,
                `${Date.now()}${Math.random()
                    .toString(36)
                    .substring(2, 12)}${Math.random()
                        .toString(36)
                        .substring(2, 12)}${Math.random()
                            .toString(36)
                            .substring(2, 12)}${Math.random()
                                .toString(36)
                                .substring(2, 12)}${Math.random()
                                    .toString(36)
                                    .substring(2, 12)}${Math.random()
                                        .toString(36)
                                        .substring(2, 12)}${Math.random()
                                            .toString(36)
                                            .substring(2, 12)}${Math.random()
                                                .toString(36)
                                                .substring(2, 12)}.${mimeType}`,
            )
        },
    }),
    limits: { fileSize: 5500 * 1024 * 1024 },//5.5Gb
})



const uploadOutAuth = multer({
    storage: multerS3({
        s3: new AWS.S3({}),
        bucket: process.env.BUCKET_OUT as string, // 버켓명
        contentType: multerS3.AUTO_CONTENT_TYPE,
        contentLength: 500000000,
        key(req: any, file: any, cb: any) {
            const UserId: number = req.id
            let mimeType
            switch (file.mimetype) {
                case 'application/xml,':
                    mimeType = 'xml'
                    break
                case 'application/pdf':
                    mimeType = 'pdf'
                    break
                case 'audio/ogg,':
                    mimeType = 'ogg'
                    break
                case 'audio/wav':
                    mimeType = 'wav'
                    break
                case 'image/jpeg':
                    mimeType = 'jpeg'
                    break
                case 'image/png':
                    mimeType = 'png'
                    break
                case 'image/jpg':
                    mimeType = 'jpg'
                    break
                case 'image/gif':
                    mimeType = 'gif'
                    break
                case 'image/webp':
                    mimeType = 'webp'
                    break
                case 'image/bmp':
                    mimeType = 'bmp'
                    break
                case 'video/mp4':
                    mimeType = 'mp4'
                    break
                case 'video/avi':
                    mimeType = 'png'
                    break
                case 'video/mov':
                    mimeType = 'mov'
                    break
                case 'video/wmv':
                    mimeType = 'wmv'
                    break
                default:
                    mimeType = 'mp4'
                    break
            }
            cb(
                null,
                `${UserId}/${Date.now()}${Math.random()
                    .toString(36)
                    .substring(2, 12)}${Math.random()
                        .toString(36)
                        .substring(2, 12)}${Math.random()
                            .toString(36)
                            .substring(2, 12)}${Math.random()
                                .toString(36)
                                .substring(2, 12)}${Math.random()
                                    .toString(36)
                                    .substring(2, 12)}${Math.random()
                                        .toString(36)
                                        .substring(2, 12)}${Math.random()
                                            .toString(36)
                                            .substring(2, 12)}${Math.random()
                                                .toString(36)
                                                .substring(2, 12)}.${mimeType}`,
            )
        },
    }),
    limits: { fileSize: 5500 * 1024 * 1024 },//5.5Gb
})

const deleteS3Out = async (url: string) => {
    const urlKey = url.split('/')[url.split('/').length - 1]
    const s3 = new AWS.S3()
    s3.deleteObject(
        {
            Bucket: process.env.BUCKET_OUT as string, // 사용자 버켓 이름
            Key: urlKey, // 버켓 내 경로
        },
        (err, data) => {
            if (err) {
                throw err
            }
            logger.info('s3 deleteObject ', data)
        },
    )
}

const getSeucreObjectImageS3 = async (url: string, res: any, UserId: number, type: number) => {
    /*
    new S3BlockReadStream(new AWS.S3({ apiVersion: '2006-03-01' }), {
        Bucket: process.env.BUCKET_OUT as string,
        Key: url.split('/')[url.split('/').length - 1]
        // any other params of AWS.S3.getObject method
    }, {
        interval: 1000, // interval for each http request (default is 0 millsecond)
        blockSize: 64 * 1024 * 1024 // download partial content block size at once (default is 64MB)
    })
        .pipe(res);
    return
    */
    const params = {
        Bucket: process.env.BUCKET_OUT as string,
        Key: url.split('/').length === 4 ?
            `${url.split('/')[3]}`
            : `${url.split('/')[3]}/${url.split('/')[4]}`
    }

    try {
        const data: any = await new AWS.S3({ useAccelerateEndpoint: true }).getObject(params).promise()
        //이미지 안뜨면 해당 오류임 메인 사이즈보다 텍스트가 크면 발생하는 문제
        const watermarkedImage = await addTextWatermark(
            data?.Body, // or a buffer
            `ID:${UserId}`,
            {
                // position: 'topLeft',
                // dpi: 400,
                // ratio: 0.1,
                opacity: 0.15,
            }
        )
        if (type === CONTAINER_TYPE.CONTAINER_VIDEO) {
            watermarkedImage.resize(3000, 3000)
        }
        watermarkedImage.on('error', (err: any) => {
            if (err) {
            }
        }).pipe(res)
    }
    catch (err) {
        return res.status(200)
    }
    /*
    new AWS.S3().getObject(params).createReadStream().on('error', async function (err: any) {
        if (err) {
            logger.log(err)
        }
    }).pipe(res)
    */
}


const getSeucreObjectImageS3NoWaterMark = async (url: string, res: any) => {
    const params = {
        Bucket: process.env.BUCKET_OUT as string,
        Key: url.split('/').length === 4 ?
            `${url.split('/')[3]}`
            : `${url.split('/')[3]}/${url.split('/')[4]}`
    }

    try {
        new AWS.S3({ useAccelerateEndpoint: true }).getObject(params).createReadStream().on('error', async function (err: any) {
            if (err) {
                logger.log(err)
            }
        }).pipe(res)
    }
    catch (err) {
        return res.status(200)
    }
}
/*
const getSeucreObjectVideoS3 = async (url: string, res: any) => {
    try {
        const params = {
            Bucket: process.env.BUCKET_OUT as string,
            Key: url.split('/')[url.split('/').length - 1]
        }
        console.log('whats.url')
        console.log(url)
        const objectUrl = await new AWS.S3().getSignedUrlPromise('getObject', params)
        console.log(objectUrl)
        return res.status(200).pipe(objectUrl)
    } catch (err) {
        console.log(err)

    }
}
*/
const getSeucreObject = async (url: string) => {
    const params = {
        Bucket: process.env.BUCKET_OUT as string,
        Key: url.split('/').length === 4 ?
            `${url.split('/')[3]}`
            : `${url.split('/')[3]}/${url.split('/')[4]}`
    }

    const objectUrl = await new AWS.S3({ useAccelerateEndpoint: true }).getSignedUrlPromise('getObject', params)
    return objectUrl
}

const mailgunSimpleEmailService = (fromEmail: string, toEamil: string, title: string, content: string) => {
    try {
        const formData = require('form-data');
        const Mailgun = require('mailgun.js');
        const mailgun = new Mailgun(formData);
        const mg = mailgun.client({ username: 'api', key: process.env.MAILGURN_APIKEY || 'key-yourkeyhere' });
        mg.messages.create('nmoment.live', {
            from: "traveltofindlife@gmail.com",
            to: [toEamil],
            subject: title,
            text: content,
            html: content,
        })
            .then((msg: any) => console.log(msg)) // logs response data
            .catch((err: any) => console.log(err)); // logs any error
    } catch (err) {
        logger.error(err)
        return false
    }
}
const awsSimpleEmailService = (fromEmail: string, toEamil: string, title: string, content: string) => {
    try {
        let params = {
            Destination: {
                ToAddresses: [toEamil], // 받는 사람 이메일 주소
                CcAddresses: [], // 참조
                BccAddresses: [], // 숨은 참조
            },
            Message: {
                Body: {
                    Text: {
                        Data: content, // 본문 내용
                        Charset: 'utf-8', // 인코딩 타입
                    },
                },
                Subject: {
                    Data: title, // 제목 내용
                    Charset: 'utf-8', // 인코딩 타입
                },
            },
            Source: 'nmoment@nmoment.live', // 보낸 사람 주소
            ReplyToAddresses: [fromEmail], // 답장 받을 이메일 주소
        }
        ses.sendEmail(params, function (err, data) {
            if (err) {
                return false
            }
            return true
        })
    } catch (err) {
        logger.error(err)
        return false
    }
}

const smsPublish = (PhoneNumber: string, Message: string) => {
    //const smsAWs: any = new AWS.config.update({ region: 'ap-northeast-1' });
    const AWS2 = require('aws-sdk');
    AWS2.config.update({ region: 'ap-northeast-1' }); //도쿄 리전을 사용함

    const publishTextPromise = new AWS2.SNS({ apiVersion: '2010-03-31' }).publish({
        Message,
        PhoneNumber,
    }).promise();

    publishTextPromise.then(
        function (data: any) {
            logger.info("MessageID is " + data.MessageId);
        }).catch(
            function (err: any) {
                logger.error(err, err.stack);
            });
}

export {
    uploadAuth,
    uploadInAuth,
    uploadOutAuth,
    upload,
    deleteS3,
    uploadIn,
    deleteS3In,
    uploadOut,
    deleteS3Out,
    smsPublish,
    awsSimpleEmailService,
    getSeucreObject,
    getSeucreObjectImageS3,
    mailgunSimpleEmailService,
    getSeucreObjectImageS3NoWaterMark
}