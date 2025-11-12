import { Namespace, Socket } from 'socket.io';
import { Emitter } from '@socket.io/redis-emitter'
import { logger } from '../config/winston';
import { verify } from '../api/middlewares/jwt-util';

/**
 * @summary 식구 네임스페이스. 밥약속 생성, 식구초대 소켓처리
 */
class ChatSocket {
    constructor(ChatNamespace: Namespace) {
        this.initializeSocket(ChatNamespace);
    }

    private initializeSocket(ChatNamespace: Namespace) {
        ChatNamespace.use((socket: any, next: any) => {
            try {
                if (socket.handshake.query) {
                    const accessToken = socket.handshake.query.accessToken;
                    const result = verify(accessToken)
                    if (!result.id) return
                    const RoomId = socket.handshake.query.RoomId;
                    socket.RoomId = RoomId;
                    next();
                }
            } catch (err) {
                logger.error(`[Error url - chat socket : ]`)
                logger.error(err)
            }
        });

        ChatNamespace.on('connection', (socket: any) => {
            if (socket?.RoomId) {
                socket.join(socket?.RoomId.toString());
            }
            socket.on('updateChat', (data: any) => {
                try {
                    const chat = data.chat
                    if (socket.RoomId) {
                        ChatNamespace.to(socket.RoomId.toString()).emit('updateChat', { chat })
                    }
                } catch (err) {
                    logger.error(`[Error url - chat socket : updateChat]`)
                    logger.error(err)
                }
            });
            socket.on('endCall', (data: any) => {
                try {
                    if (socket.RoomId) {
                        ChatNamespace.to(socket.RoomId.toString()).emit('endCall')
                    }
                } catch (err) {
                    logger.error(`[Error url - chat socket : endCall]`)
                    logger.error(err)
                }
            });
            socket.on('streamOk', (data: any) => {
                try {
                    if (socket.RoomId) {
                        const youId = data.youId
                        ChatNamespace.to(socket.RoomId.toString()).emit('streamOk', { youId })
                    }
                } catch (err) {
                    logger.error(`[Error url - chat socket : streamOk]`)
                    logger.error(err)
                }
            });
            socket.on('callGift', (data: any) => {
                try {
                    const code: string = data?.code
                    const count: number = data?.count
                    if (socket.RoomId) {
                        ChatNamespace.to(socket.RoomId.toString()).emit('callGift', { code, count })
                    }
                } catch (err) {
                    logger.error(`[Error url - chat socket : callGift]`)
                    logger.error(err)
                }
            });
            socket.on('readPropagation', (data: any) => {
                try {
                    const lastRead: number = data?.lastRead
                    const MeId: number = data?.MeId
                    if (socket.RoomId) {
                        ChatNamespace.to(socket.RoomId.toString()).emit('readPropagation', { lastRead, MeId })
                    }
                } catch (err) {
                    logger.error(`[Error url - chat socket : readPropagation]`)
                    logger.error(err)
                }
            });
            socket.on('updateRoom', (data: any) => {
                try {
                    const room = data.room
                    if (socket.RoomId) {
                        ChatNamespace.to(socket.RoomId.toString()).emit('updateRoom', room)
                    }
                } catch (err) {
                    logger.error(`[Error url - chat socket : updateRoom]`)
                    logger.error(err)
                }
            });
            socket.on('disconnect', (data: any) => {
                try {
                    if (socket?.RoomId) {
                        socket.leave(socket?.RoomId.toString())
                    }
                } catch (err) {
                    logger.error(`[Error url - chat socket : disconnect]`)
                    logger.error(err)
                }
            });

        });
    }
}

export default ChatSocket;