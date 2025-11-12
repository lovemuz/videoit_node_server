/*
import { Namespace, Socket } from 'socket.io';
import { Emitter } from '@socket.io/redis-emitter'
import { logger } from '../config/winston';
import { verify } from '../api/middlewares/jwt-util';

class CallSocket {
    constructor(CallNamespace: Namespace) {
        this.initializeSocket(CallNamespace);
    }

    private initializeSocket(CallNamespace: Namespace) {
        CallNamespace.use((socket: any, next: any) => {
            try {
                if (socket.handshake.query) {
                    const accessToken = socket.handshake.query.accessToken;
                    const result = verify(accessToken)
                    if (!result.id) return
                    const CallId = socket.handshake.query.CallId;
                    socket.CallId = CallId;
                    next();
                }
            } catch (err) {
                logger.error(`[Error url - chat socket : ]`)
                logger.error(err)
            }
        });

        CallNamespace.on('connection', (socket: any) => {
            if (socket?.CallId) {
                socket.join(socket?.CallId.toString());
            }
            socket.on('newGift', (data: any) => {
                try {
                    const gift = data.gift
                    if (socket.CallId) {
                        CallNamespace.to(socket.CallId.toString()).emit('newGift', { gift })
                    }
                } catch (err) {
                    logger.error(`[Error url - chat socket : updateChat]`)
                    logger.error(err)
                }
            });
            socket.on('disconnect', (data: any) => {
                try {
                    if (socket?.CallId) {
                        socket.leave(socket?.CallId.toString())
                    }
                } catch (err) {
                    logger.error(`[Error url - chat socket : disconnect]`)
                    logger.error(err)
                }
            });

        });
    }
}

export default CallSocket;
*/