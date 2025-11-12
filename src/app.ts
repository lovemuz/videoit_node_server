import express from 'express'
import dotenv, { load } from 'dotenv'
import http from 'http'
import fs from 'fs'
import https from 'https'
import loaders from './loaders/index'
import { logger } from './config/winston'

dotenv.config()
/*
node + let's encrypt ssl 사용시
const options = {
  ca: fs.readFileSync('/etc/letsencrypt/live/도메인/fullchain.pem'),
  key: fs.readFileSync('/etc/letsencrypt/live/도메인/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/도메인/cert.pem'),
}
*/

async function startServer() {
  const app = express()
  app.set('port', process.env.PORT || 5050)

  const server = app
    .listen(app.get('port'), '0.0.0.0', () => {
      logger.info(`
      ################################################
      🛡️ Great Server listening on port: ${app.get('port')} 🛡️
      ################################################
    `)
    })
    .on('error', (err) => {
      logger.error(err)
      process.exit(1)
    })
  /*
  http
    .createServer(function (req, res) {
      res.writeHead(301, {
        Location: 'https://' + req.headers['host'] + req.url,
      })
      res.end()
    })
    .listen(8080)
    */
  //const server = https.createServer(options, app).listen(4430)
  await loaders(app, server)
}

startServer()
