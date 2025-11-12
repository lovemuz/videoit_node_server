import { logger } from "../config/winston";
import { sequelize } from "../models";

export default async () => {
  sequelize
    .sync({
      /*force: false */
    })
    .then(() => {
      logger.info("database connecting success");
    })
    .catch((err: any) => {
      logger.error(err);
    });
};
