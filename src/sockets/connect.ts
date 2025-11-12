import { Namespace, Socket } from 'socket.io';
import { logger } from '../config/winston';
import { Emitter } from '@socket.io/redis-emitter'
import { authJWT } from '../api/middlewares/authJWT';
import { verify } from '../api/middlewares/jwt-util';

/**
 * @summary 식구 네임스페이스. 밥약속 생성, 식구초대 소켓처리
 */
class ConnectSocket {
    constructor(ConnectNamespace: Namespace) {
        this.initializeSocket(ConnectNamespace);
    }

    private initializeSocket(ConnectNamespace: Namespace) {

        ConnectNamespace.use((socket: any, next: any) => {
            try {
                if (socket.handshake.query) {
                    //accessToken
                    const accessToken = socket.handshake.query.accessToken;
                    //const UserId = socket.handshake.query.UserId;
                    const result = verify(accessToken)
                    if (!result.id) return
                    socket.UserId = result.id;
                    next();
                }
            } catch (err) {
                logger.error(`[Error url - connect socket : ]`)
                logger.error(err)
            }
        });

        ConnectNamespace.on('connection', (socket: any) => {
            if (socket?.UserId) {
                socket.join(socket?.UserId.toString());
                socket.data.UserId = socket?.UserId.toString()
            }
            socket.on('newChat', async (data: any) => {
                try {
                    const MeId: string = data.MeId
                    const YouId: string = data.YouId
                    const room: string = data.room
                    const admin: boolean = data?.admin ? data?.admin : false
                    const notShow: boolean = data?.notShow

                    if (MeId) {
                        ConnectNamespace.to(MeId.toString()).emit('newChat', { room, admin, notShow })
                    }
                    if (YouId) {
                        ConnectNamespace.to(YouId.toString()).emit('newChat', { room, admin, notShow })
                    }
                } catch (err) {
                    logger.error(`[Error url - connect socket : newChat]`)
                    logger.error(err)
                }
            })
            socket.on("tryConnectCall", (data: any) => {
                try {
                    const RoomId: number = data.RoomId
                    const YouId: string = data.YouId;
                    const gender: number = data?.gender
                    const you = data.you
                    const avgTime: number = data.avgTime
                    const avgScore: number = data.avgScore
                    const vip: boolean = data.vip
                    // const gender:number=data.gender
                    if (YouId) {
                        ConnectNamespace.to(YouId.toString()).emit("tryConnectCall", {
                            RoomId,
                            you,
                            avgTime,
                            avgScore,
                            vip,
                            gender
                        });
                    }
                } catch (err) {
                    logger.error(`[Error url - connect socket : tryConnectCall]`)
                    logger.error(err)
                }
            });
            socket.on("acceptConnectCall", (data: any) => {
                try {
                    const otherUserId = data.otherUserId;
                    const RoomId = data.RoomId
                    const YouId = data.YouId;
                    if (YouId) {
                        ConnectNamespace.to(YouId.toString()).emit("acceptConnectCall", {
                            RoomId,
                            otherUserId
                        });
                    }
                } catch (err) {
                    logger.error(`[Error url - connect socket : acceptConnectCall]`)
                    logger.error(err)
                }
            });
            socket.on("stopCall", (data: any) => {
                try {
                    const YouId = data.YouId;
                    if (YouId) {
                        ConnectNamespace.to(YouId.toString()).emit("stopCall");
                    }
                } catch (err) {
                    logger.error(`[Error url - connect socket : stopCall]`)
                    logger.error(err)
                }
            });
            socket.on("denyConnectCall", (data: any) => {
                try {
                    const YouId = data.YouId;
                    if (YouId) {
                        ConnectNamespace.to(YouId.toString()).emit("denyConnectCall");
                    }
                } catch (err) {
                    logger.error(`[Error url - connect socket : denyConnectCall]`)
                    logger.error(err)
                }
            });
            socket.on("newCall", (data: any) => {
                try {
                    let calleeId = data.calleeId;
                    let rtcMessage = data.rtcMessage;
                    if (calleeId) {
                        socket.to(calleeId.toString()).emit("newCall", {
                            callerId: socket.UserId,
                            rtcMessage: rtcMessage,
                        });
                    }
                } catch (err) {
                    logger.error(`[Error url - connect socket : newCall]`)
                    logger.error(err)
                }
            });
            socket.on("answerCall", (data: any) => {
                try {
                    let callerId = data.callerId;
                    let rtcMessage = data.rtcMessage;
                    if (callerId) {
                        socket.to(callerId.toString()).emit("callAnswered", {
                            callee: socket.UserId,
                            rtcMessage: rtcMessage,
                        });
                    }
                } catch (err) {
                    logger.error(`[Error url - connect socket : answerCall]`)
                    logger.error(err)
                }
            });

            socket.on("ICEcandidate", (data: any) => {
                try {
                    let calleeId = data.calleeId;
                    let rtcMessage = data.rtcMessage;
                    if (calleeId) {
                        socket.to(calleeId.toString()).emit("ICEcandidate", {
                            sender: socket.UserId,
                            rtcMessage: rtcMessage,
                        });
                    }
                } catch (err) {
                    logger.error(`[Error url - connect socket : ICEcandidate]`)
                    logger.error(err)
                }
            });
            socket.on('disconnect', (data: any) => {
                try {
                    if (socket?.UserId) {
                        socket.leave(socket?.UserId.toString())
                        socket.data.UserId = ''
                    }
                } catch (err) {
                    logger.error(`[Error url - connect socket : disconnect]`)
                    logger.error(err)
                }
            });
            socket.on("online", (data: any) => {
                //do nothing
            });
        });
    }
}

export default ConnectSocket;