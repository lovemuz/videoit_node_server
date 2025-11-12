import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class Wish extends Model {
    public readonly id!: number;
    public did: boolean
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

}
Wish.init({
    did: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: true,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Wish',
    tableName: 'Wishes',
    paranoid: false,
    charset: 'utf8',
    collate: 'utf8_general_ci',
});

export const associate = (db: dbType) => {
    db.Wish.belongsTo(db.Post)
    db.Wish.belongsTo(db.User)
};

export default Wish;
