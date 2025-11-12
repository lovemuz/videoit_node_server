import passport from 'passport'
import { User } from '../models/index'
import { logger } from '../config/winston'
import local from './localStrategy'

export default () => {
  passport.serializeUser((user: any, done) => {
    done(null, user.id)
  })
  passport.deserializeUser<any>(async (id, done) => {
    try {
      const user = await User.findOne({
        where: {
          id
        }
      });
      if (!user) return done(new Error('no user'));
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
  local()
}
