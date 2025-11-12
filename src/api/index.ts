import express from 'express'
import userApi from './routes/user-api'
import paymentApi from './routes/payment-api'
import rankApi from './routes/rank-api'
import rateLimit from 'express-rate-limit'
import etcApi from './routes/etc-api'
import alarmApi from './routes/alarm-api'
import chatApi from './routes/chat-api'
import donationApi from './routes/donation-api'
import exchangeApi from './routes/exchange-api'
import pointApi from './routes/point-api'
import postApi from './routes/post-api'
import roomApi from './routes/room-api'
import adminApi from './routes/admin-api'
import csApi from './routes/cs-api'
import callApi from './routes/call-api'
import routeApi from './routes/route-api'
import subscribeApi from './routes/subscribe-api'
import secureApi from './routes/secure-api'
import mcnApi from './routes/mcn-api'
import adsApi from './routes/ads-api'
import assistApi from './routes/assist-api'
import referrerApi from './routes/referrer-api'
import onelinkApi from './routes/onelink-api'

const subdomain = require('express-subdomain');


const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 300, // Limit each IP to 100 requests per `window` (here, per 1 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

const router = express.Router()

export default () => {
  //app.use('/',router)

  onelinkApi(router, apiLimiter, subdomain)
  referrerApi(router, apiLimiter, subdomain)
  assistApi(router, apiLimiter, subdomain)
  adsApi(router, apiLimiter, subdomain)
  mcnApi(router, apiLimiter, subdomain)
  secureApi(router, apiLimiter, subdomain)
  subscribeApi(router, apiLimiter, subdomain)
  adminApi(router, apiLimiter, subdomain)
  alarmApi(router, apiLimiter, subdomain)
  callApi(router, apiLimiter, subdomain)
  chatApi(router, apiLimiter, subdomain)
  csApi(router, apiLimiter, subdomain)
  donationApi(router, apiLimiter, subdomain)
  etcApi(router, apiLimiter, subdomain)
  exchangeApi(router, apiLimiter, subdomain)
  paymentApi(router, apiLimiter, subdomain)
  pointApi(router, apiLimiter, subdomain)
  postApi(router, apiLimiter, subdomain)
  rankApi(router, apiLimiter, subdomain)
  roomApi(router, apiLimiter, subdomain)
  userApi(router, apiLimiter, subdomain)
  routeApi(router, subdomain)

  return router
}
