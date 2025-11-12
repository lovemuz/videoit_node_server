import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class InAppRefund extends Model {
    public readonly id!: number;
    public phone: string;
    public amount: number;
    public platform: string;

    // public real_birthday: number;
    // public real_gender: number;
}
InAppRefund.init({
    phone: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: false,
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
    platform: {
        type: DataTypes.STRING(10),
        allowNull: true,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'InAppRefund',
    tableName: 'inAppRefunds',
    paranoid: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    indexes: [
        {
            name: 'inAppRefund_phone',
            fields: ['phone'],
        },
    ],
});

export const associate = (db: dbType) => {
};

export default InAppRefund;
