import { logger } from "../../config/winston"


export const errorLogPost = (req: any, err: any) => {
    logger.error(`[ Error Url - ${req.url} ]`)
    logger.error(`[ Error body - ${JSON.stringify(req.body)} ]`)
    logger.error(err)
    logger.error('')
}

export const errorLogGet = (req: any, err: any) => {
    logger.error(`[ Error Url - ${req.url} ]`)
    logger.error(`[ Error query - ${JSON.stringify(req.query)} ]`)
    logger.error(err)
    logger.error('')
}
