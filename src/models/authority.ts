import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class Authority extends Model {
    public readonly id!: number;
    public UserId: number
    public PostId: number
    public ChatId: number
    public readonly deletedAt!: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

}
Authority.init({

}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Authority',
    tableName: 'authoritys',
    paranoid: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',

});

export const associate = (db: dbType) => {
    db.Authority.belongsTo(db.User)
    db.Authority.belongsTo(db.Post)
    db.Authority.belongsTo(db.Chat)

};

export default Authority;
