import passport from 'passport'
import LocalStrategy from 'passport-local' //.Strategy
import bcrypt from 'bcrypt'
import Sequelize from 'sequelize'
import { User } from '../models/index'
const Op = Sequelize.Op
import { logger } from '../config/winston'

export default () => {
    passport.use(
        new LocalStrategy.Strategy(
            {
                usernameField: 'link',
                passwordField: 'password',
                session: false,
            },
            async (link: string, password: string, done: any) => {
                try {
                    const exUser: any = await User.findOne({
                        where: { link },
                    })
                    if (exUser) {
                        const result = await bcrypt.compare(password, exUser.password)
                        if (result) {
                            done(null, exUser)
                            return
                        } else {
                            done(null, false, { message: '비밀번호가 다릅니다.' })
                            return

                        }
                    } else {
                        done(null, false, { message: '가입되지 않은 회원입니다.' })
                        return
                    }
                } catch (error) {
                    console.error(error)
                    done(error)
                }
            },
        ),
    )
}