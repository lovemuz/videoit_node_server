import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType
} from './index';
import { sequelize } from './sequelize';

class Payment extends Model {
    public readonly id!: number;
    public price: number;
    public type: number;
    public platform: string;
    public imp_uid: string;
    public merchant_uid: string;
    public refund: boolean;

    public readonly deletedAt!: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
Payment.init({ //실물 결제 내역
    price: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
    platform: { //APP ,WEB
        type: DataTypes.STRING(10),
        allowNull: true,
        unique: false,
    },
    imp_uid: {
        type: DataTypes.STRING(200),
        defaultValue: '',
        allowNull: true,
        unique: false,
    },
    merchant_uid: {
        type: DataTypes.STRING(200),
        defaultValue: '',
        allowNull: true,
        unique: false,
    },
    type: { // 1 point , 2 subscribe
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
    refund: {
        //0 no ,1 yes
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true,
        unique: false,
    },

}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Payment',
    tableName: 'payments',
    paranoid: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
});

export const associate = (db: dbType) => {
    db.Payment.belongsTo(db.User)
};

export default Payment;
