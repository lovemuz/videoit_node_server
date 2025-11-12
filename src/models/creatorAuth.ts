import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class CreatorAuth extends Model {
    public readonly id!: number;
    public platformPointCharge: number;
    public platformSubscribeCharge: number;
    public callPrice: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
CreatorAuth.init({
    platformPointCharge: {
        type: DataTypes.INTEGER,
        defaultValue: 70,
        allowNull: true,
        unique: false,
    },
    platformSubscribeCharge: {
        type: DataTypes.INTEGER,
        defaultValue: 70,
        allowNull: true,
        unique: false,
    },
    callPrice: {
        type: DataTypes.INTEGER,
        defaultValue: 1000,
        allowNull: true,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'CreatorAuth',
    tableName: 'creatorAuthes',
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
});

export const associate = (db: dbType) => {
    db.CreatorAuth.belongsTo(db.User)

};

export default CreatorAuth;
