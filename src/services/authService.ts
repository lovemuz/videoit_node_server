import { User } from '../models/index'
import bcrypt from 'bcrypt'
import { logger } from '../config/winston'
import { awsSimpleEmailService } from '../api/middlewares/aws'

class AuthService {
    constructor() { }

    static async sendEmail(toEamil: string, fromEmail: string, title: string, content: string) {
        awsSimpleEmailService(toEamil, fromEmail, title, content)
    }

    static async generate6DigitRandom() {
        const min = 100000;
        const max = 999999;
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        return randomNumber;
    }

}
export default AuthService