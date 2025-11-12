import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class Point extends Model {
    public readonly id!: number;
    public amount: number;

    public readonly deletedAt!: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
Point.init({
    amount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Point',
    tableName: 'points',
    paranoid: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
});

export const associate = (db: dbType) => {
    db.Point.belongsTo(db.User)
};

export default Point;
