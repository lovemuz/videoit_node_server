import jwt from 'jsonwebtoken'
import { User } from '../../models';
export const sign = (user: { id: any; roles: any }) => {
  // access token 발급
  const payload = {
    // access token에 들어갈 payload
    id: user.id,
    roles: user.roles,
  }

  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    // secret으로 sign하여 발급하고 return
    algorithm: 'HS256', // 암호화 알고리즘
    expiresIn: '30m', // 유효기간 //1h or 30m
  })
}
export const refresh = () => {
  // refresh token 발급
  return jwt.sign({}, process.env.JWT_SECRET as string, {
    // refresh token은 payload 없이 발급
    algorithm: 'HS256',
    expiresIn: '14d',
  })
}
export const verify = (token: any) => {
  // access token 검증
  let decoded: any = null
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET as string)
    //if (decoded.id) {
    return {
      ok: true,
      id: decoded.id,
      roles: decoded.roles,
    }
    /*
  } else {
    return {
      ok: false,
    }
  }
  */

  } catch (err: any) {
    return {
      ok: false,
      message: err.message,
    }
  }
}

export const refreshVerify = async (token: any, userId: any) => {
  // refresh token 검증
  try {
    //수정 user 랑 비교해서 같은지
    const user = await User.findOne({ where: { id: userId } })
    const data = user?.refreshToken // refresh token 가져오기
    if (token === data) {
      try {
        jwt.verify(token, process.env.JWT_SECRET as string)
        return true
      } catch (err) {
        return false
      }
    } else {
      return false
    }
  } catch (err) {
    return false
  }
}