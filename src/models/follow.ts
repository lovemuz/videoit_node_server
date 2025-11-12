import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class Follow extends Model {
    public readonly id!: number;
    public followerId: number;
    public followingId: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

}
Follow.init({
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Follow',
    tableName: 'follows',
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
});

export const associate = (db: dbType) => {
};

export default Follow;
