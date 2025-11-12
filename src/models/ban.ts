import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class Ban extends Model {
    public readonly id!: number;
    public banningId: number;
    public bannerId: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
Ban.init({
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Ban',
    tableName: 'bans',
    paranoid: false,
    charset: 'utf8',
    collate: 'utf8_general_ci',
});

export const associate = (db: dbType) => {

};

export default Ban;
