import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class Earn extends Model {
    public readonly id!: number;
    public amount: number;
    public year: number;
    public month: number;
    public donationerId: number;
    public donationingId: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
Earn.init({
    donationerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: false,
    },
    donationingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: false,
    },
    amount: {
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
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Earn',
    tableName: 'earns',
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    indexes: [
        {
            name: 'earn_donationerId',
            fields: ['donationerId'],
        },
        {
            name: 'earn_donationingId',
            fields: ['donationingId'],
        },

    ],
});

export const associate = (db: dbType) => {
};

export default Earn;