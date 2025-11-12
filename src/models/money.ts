import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class Money extends Model {
    public readonly id!: number;
    public amount: number;

    public readonly deletedAt!: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
Money.init({
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
    modelName: 'Money',
    tableName: 'moneys',
    paranoid: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
});

export const associate = (db: dbType) => {
    db.Money.belongsTo(db.User)
};

export default Money;
