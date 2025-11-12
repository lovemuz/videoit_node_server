import { logger } from '../../config/winston'
import { USER_ROLE } from '../../constant/user-constant'
import { verify } from './jwt-util'

const authJWT = (req: any, res: any, next: any) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split('Bearer ')[1] // header에서 access token을 가져옵니다.
    const result = verify(token) // token을 검증합니다.

    if (result.ok) {
      // token이 검증되었으면 req에 값을 세팅하고, 다음 콜백함수로 갑니다.
      req.id = result.id
      req.roles = result.roles

      if (USER_ROLE.isBanRole(result.roles)) {
        res.status(400).send({
          ok: false,
          message: 'ban authorization', // jwt가 만료되었다면 메세지는 'jwt expired'입니다.
        })
      }
      next()
    } else {
      // 검증에 실패하거나 토큰이 만료되었다면 클라이언트에게 메세지를 담아서 응답합니다.
      res.status(401).send({
        ok: false,
        message: result.message, // jwt가 만료되었다면 메세지는 'jwt expired'입니다.
      })
    }
  } else {
    res.status(401).send({
      ok: false,
      message: 'header 값이업음', // jwt가 만료되었다면 메세지는 'jwt expired'입니다.
    })
  }
}

const authCsJWT = (req: any, res: any, next: any) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split('Bearer ')[1] // header에서 access token을 가져옵니다.
    const result = verify(token) // token을 검증합니다.
    if (result.ok) {
      // token이 검증되었으면 req에 값을 세팅하고, 다음 콜백함수로 갑니다.
      req.id = result.id
      req.roles = result.roles
      if (!USER_ROLE.isAdminRole(req.roles) && !USER_ROLE.isCsRole(req.roles)) {
        res.status(400).send({
          ok: false,
          message: 'cs authorization', // jwt가 만료되었다면 메세지는 'jwt expired'입니다.
        })
      }
      next()
    } else {
      // 검증에 실패하거나 토큰이 만료되었다면 클라이언트에게 메세지를 담아서 응답합니다.
      res.status(401).send({
        ok: false,
        message: result.message, // jwt가 만료되었다면 메세지는 'jwt expired'입니다.
      })
    }
  } else {
    res.status(401).send({
      ok: false,
      message: 'header 값이업음', // jwt가 만료되었다면 메세지는 'jwt expired'입니다.
    })
  }
}


const authAssistJWT = (req: any, res: any, next: any) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split('Bearer ')[1] // header에서 access token을 가져옵니다.
    const result = verify(token) // token을 검증합니다.
    if (result.ok) {
      // token이 검증되었으면 req에 값을 세팅하고, 다음 콜백함수로 갑니다.
      req.id = result.id
      req.roles = result.roles
      if (!USER_ROLE.isAdminRole(req.roles) && !USER_ROLE.isCsRole(req.roles) && !USER_ROLE.isAssistRole(req.roles)) {
        res.status(400).send({
          ok: false,
          message: 'cs authorization', // jwt가 만료되었다면 메세지는 'jwt expired'입니다.
        })
      }
      next()
    } else {
      // 검증에 실패하거나 토큰이 만료되었다면 클라이언트에게 메세지를 담아서 응답합니다.
      res.status(401).send({
        ok: false,
        message: result.message, // jwt가 만료되었다면 메세지는 'jwt expired'입니다.
      })
    }
  } else {
    res.status(401).send({
      ok: false,
      message: 'header 값이업음', // jwt가 만료되었다면 메세지는 'jwt expired'입니다.
    })
  }
}

const authCompanyJWT = (req: any, res: any, next: any) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split('Bearer ')[1] // header에서 access token을 가져옵니다.
    const result = verify(token) // token을 검증합니다.
    if (result.ok) {
      // token이 검증되었으면 req에 값을 세팅하고, 다음 콜백함수로 갑니다.
      req.id = result.id
      req.roles = result.roles
      if (!USER_ROLE.isCompanyRole(req.roles) && !USER_ROLE.isAdminRole(req.roles) && !USER_ROLE.isCsRole(req.roles)) {
        res.status(400).send({
          ok: false,
          message: 'cs authorization', // jwt가 만료되었다면 메세지는 'jwt expired'입니다.
        })
      }
      next()
    } else {
      // 검증에 실패하거나 토큰이 만료되었다면 클라이언트에게 메세지를 담아서 응답합니다.
      res.status(401).send({
        ok: false,
        message: result.message, // jwt가 만료되었다면 메세지는 'jwt expired'입니다.
      })
    }
  } else {
    res.status(401).send({
      ok: false,
      message: 'header 값이업음', // jwt가 만료되었다면 메세지는 'jwt expired'입니다.
    })
  }
}

const authReferrerJWT = (req: any, res: any, next: any) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split('Bearer ')[1] // header에서 access token을 가져옵니다.
    const result = verify(token) // token을 검증합니다.
    if (result.ok) {
      // token이 검증되었으면 req에 값을 세팅하고, 다음 콜백함수로 갑니다.
      req.id = result.id
      req.roles = result.roles
      if (!USER_ROLE.isREFERRALRole(req.roles) && !USER_ROLE.isAdminRole(req.roles) && !USER_ROLE.isCsRole(req.roles)) {
        res.status(400).send({
          ok: false,
          message: 'cs authorization', // jwt가 만료되었다면 메세지는 'jwt expired'입니다.
        })
      }
      next()
    } else {
      // 검증에 실패하거나 토큰이 만료되었다면 클라이언트에게 메세지를 담아서 응답합니다.
      res.status(401).send({
        ok: false,
        message: result.message, // jwt가 만료되었다면 메세지는 'jwt expired'입니다.
      })
    }
  } else {
    res.status(401).send({
      ok: false,
      message: 'header 값이업음', // jwt가 만료되었다면 메세지는 'jwt expired'입니다.
    })
  }
}

const authAdminJWT = (req: any, res: any, next: any) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split('Bearer ')[1] // header에서 access token을 가져옵니다.
    const result = verify(token) // token을 검증합니다.
    if (result.ok) {
      // token이 검증되었으면 req에 값을 세팅하고, 다음 콜백함수로 갑니다.
      req.id = result.id
      req.roles = result.roles
      if (!USER_ROLE.isAdminRole(req.roles)) {
        res.status(400).send({
          ok: false,
          message: 'admin authorization', // jwt가 만료되었다면 메세지는 'jwt expired'입니다.
        })
      }
      next()
    } else {
      // 검증에 실패하거나 토큰이 만료되었다면 클라이언트에게 메세지를 담아서 응답합니다.
      res.status(401).send({
        ok: false,
        message: result.message, // jwt가 만료되었다면 메세지는 'jwt expired'입니다.
      })
    }
  } else {
    res.status(401).send({
      ok: false,
      message: 'header 값이업음', // jwt가 만료되었다면 메세지는 'jwt expired'입니다.
    })
  }
}

export {
  authJWT,
  authCsJWT,
  authAdminJWT,
  authCompanyJWT,
  authAssistJWT,
  authReferrerJWT
}
