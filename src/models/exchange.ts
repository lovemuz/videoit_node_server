import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class Exchange extends Model {
    public readonly id!: number;
    public type: number;
    public typeBusiness: number;
    public state: number;
    public point: number
    public money: number
    public withholdingTax: number
    public accountName: string;
    public accountNumber: string;
    public accountCode: string;
    public registrationName: string;
    public registrationNumber: string;
    public rejectionReason: string;

    public readonly deletedAt!: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

}
Exchange.init({
    type: { // 1 point, 2 money
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: false,
    },
    typeBusiness: {
        type: DataTypes.INTEGER, // 0 주민등록번호, 1 사업자 등록번호 , 2 페이팔
        defaultValue: 0,
        allowNull: false,
        unique: false,
    },
    state: { // 0 신청 , 1 승인 , 2 반려
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
    point: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
    money: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
    withholdingTax: {
        type: DataTypes.INTEGER,
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
    rejectionReason: {
        type: DataTypes.STRING(200),
        allowNull: true,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Exchange',
    tableName: 'exchanges',
    paranoid: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
});

export const associate = (db: dbType) => {
    db.Exchange.belongsTo(db.User)
};

export default Exchange;
