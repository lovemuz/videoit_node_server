import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class AdsCount extends Model {
    public readonly id!: number;
    public count: number;
    public year: number;
    public month: number;
    public day: number;
    public adCode: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
AdsCount.init({
    adCode: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: false,
    },
    count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        unique: false,
    },
    year: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        unique: false,
    },
    month: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        unique: false,
    },
    day: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'AdsCount',
    tableName: 'adsCounts',
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
});

export const associate = (db: dbType) => {
};

export default AdsCount;