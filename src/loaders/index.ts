import expressLoader from './express'
import cronJob from './cronJob'
import sequelizeLoader from './sequelize'
import socketLoader from './socket'
import turnLoader from './turn'

const loaders = async (app: any, server: any) => {
  await sequelizeLoader()
  await expressLoader(app)
  await socketLoader(app, server)
  // await cronJob(app)// rank, 정산
  //await turnLoader()

}
export default loaders
