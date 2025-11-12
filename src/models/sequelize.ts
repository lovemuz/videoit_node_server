import { Sequelize } from 'sequelize';
import config from '../config/config';

const env = process.env.DEV_MODE as ('production' | 'localhost' | 'development') || 'localhost';
const { database, username, password } = config[env];
const sequelize = new Sequelize(database, username, password, config[env]);

//const sequelize = new Sequelize(database as unknown as any,username as unknown as any, password, config[env] as unknown as any );

export { sequelize };
export default sequelize;