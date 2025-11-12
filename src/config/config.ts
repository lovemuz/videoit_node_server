import dotenv from 'dotenv'
dotenv.config()


interface IConfigGroup {
  localhost: any;
  development: any;
  production: any;
}

const config: IConfigGroup = {
  localhost: {
    username: 'root',
    password: process.env.SEQUELIZE_LOCALHOST_PASSWORD as string,
    database: process.env.SEQUELIZE_LOCALHOST_DATABASE as string,
    host: '127.0.0.1',
    dialect: 'mysql',
    logging: console.log,
  },
  development: {
    username: 'admin',
    password: process.env.SEQUELIZE_DEVELOP_PASSWORD as string,
    database: process.env.SEQUELIZE_DEVELOP_DATABASE as string,
    host: process.env.SEQUELIZE_DEVELOP_ENDPOINT as string,
    port: process.env.SEQUELIZE_DEVELOP_PORT as string,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 100,
      min: 0,
      acquire: 60000,
      idle: 5000,
    },
  },
  production: {
    username: 'admin',
    password: process.env.SEQUELIZE_PASSWORD as string,
    database: process.env.SEQUELIZE_DATABASE as string,
    host: process.env.SEQUELIZE_ENDPOINT as string,
    port: process.env.SEQUELIZE_PORT as string,
    /*
    replication: {
      read: [
        {
          host: process.env.SEQUELIZE_ENDPOINT as string,
          username: 'admin',
          password: process.env.SEQUELIZE_PASSWORD as string,
          database: process.env.SEQUELIZE_DATABASE as string,
        },
        {
          host: process.env.SEQUELIZE_READ1_ENDPOINT as string,
          username: 'admin',
          password: process.env.SEQUELIZE_PASSWORD as string,
          database: process.env.SEQUELIZE_DATABASE as string,
        },
      ],
      write: {
        host: process.env.SEQUELIZE_ENDPOINT as string,
        username: 'admin',
        password: process.env.SEQUELIZE_PASSWORD as string,
        database: process.env.SEQUELIZE_DATABASE as string,
      },
    },
    */
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 100,
      min: 0,
      acquire: 60000,
      idle: 5000,
    },
  },
}
export default config;