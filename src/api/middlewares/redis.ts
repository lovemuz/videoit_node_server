import { createClient, createCluster } from "redis";
import { logger } from "../../config/winston";

const redisClient: any =
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

const subClient: any = redisClient.duplicate();

Promise.all([redisClient.connect(), subClient.connect()]).then(() => {
  redisClient.on("error", (err: any) =>
    logger.error(`Redis Client Error!\n${err}`)
  );
  redisClient.on("connect", () => logger.info("Redis Connected"));
});

export const setValueNonExpire = (key: any, value: any) =>
  redisClient.set(key, value);
export const setValue = (key: any, value: any, expire: any) =>
  redisClient.set(key, value, { EX: expire });
export const getValue = (key: any) => redisClient.get(key);
export const deleteValue = (key: any) => redisClient.del(key);
