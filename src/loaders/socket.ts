import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient, createCluster } from "redis";
import ChatSocket from "../sockets/chat";
import ConnectSocket from "../sockets/connect";
import { logger } from "../config/winston";

export default async (app: any, server: any) => {
  const io = new Server(server, {
    transports: ["websocket"],
    //pingInterval: 1000 * 60 * 5,
    //pingTimeout: 1000 * 60 * 3,
  });

  const pubClient: any =
    process.env.DEV_MODE === "production"
      ? createCluster({
          rootNodes: [
            {
              url: "rediss://videoit-redis-0001-001.videoit-redis.sgsnge.apn2.cache.amazonaws.com:6379",
            },
            {
              url: "rediss://videoit-redis-0001-002.videoit-redis.sgsnge.apn2.cache.amazonaws.com:6379",
            },
            {
              url: "rediss://videoit-redis-0001-003.videoit-redis.sgsnge.apn2.cache.amazonaws.com:6379",
            },
          ],
          defaults: {
            socket: {
              tls: true, // ✅ Valkey TLS 활성화 필수
            },
          },
        })
      : process.env.DEV_MODE === "development"
      ? createClient({
          url: "redis://nmoment-dev-redis.j4gutn.ng.0001.apn2.cache.amazonaws.com:6379",
        })
      : createClient({ url: process.env.REDIS_ENDPOINT_LOCAL });
  const subClient: any = pubClient.duplicate();

  const key = `VIVID_${process.env.DEV_MODE}`;

  await Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    //@ts-ignore
    io.adapter(createAdapter(pubClient, subClient, { key })); // 외부 Redis 클라이언트 사용
    app.set("io", io);
  });
  io.of("/").adapter.on("error", function (err) {
    logger.error(err);
  });

  //new CallSocket(io.of('/call'))
  new ChatSocket(io.of("/chat"));
  new ConnectSocket(io.of("/connect"));
};
