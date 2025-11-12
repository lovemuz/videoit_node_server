import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class Account extends Model {
    public readonly id!: number;
    public type: number;
    public businessUrl: string;
    public businessNumber: string;
    public registrationName: string;
    public registrationNumber: string;
    public accountName: string;
    public accountNumber: string;
    public accountCode: string;

    public readonly deletedAt!: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
Account.init({
    type: {
        type: DataTypes.INTEGER, // 0 주민등록번호, 1 사업자 등록번호
        defaultValue: 0,
        allowNull: true,
        unique: false,
    },
    businessNumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: false,
    },
    businessUrl: {
        type: DataTypes.STRING(200),
        allowNull: true,
        unique: false,
    },
    registrationName: {
        type: DataTypes.STRING(10),
        allowNull: true,
        unique: false,
    },
    registrationNumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: false,
    },
    accountName: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: false,
    },
    accountNumber: {
        type: DataTypes.STRING(40),
        allowNull: true,
        unique: false,
    },
    accountCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Account',
    tableName: 'accounts',
    paranoid: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
});

export const associate = (db: dbType) => {
    db.Account.belongsTo(db.User)
};

export default Account;
