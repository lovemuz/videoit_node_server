import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class PartnerExchange extends Model {
    public readonly id!: number;

    public UserId: string;
    public code: string;
    public nick: string;
    public profile: string;
    public link: string;
    public phone: string;

    public exchangePrice: number;
    public totalAmount: number;
    public point: number
    public money: number

    public readonly deletedAt!: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

}
PartnerExchange.init({
    code: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: false,
    },
    exchangePrice: {//실제 환전금액
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
    totalAmount: { //총 차감액
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
    point: {//차감 포인트
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
    money: {//차감 구독머니
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },

    UserId: {//일련번호
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: false,
    },
    nick: {//이름
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: false,


        // charset: 'utf8mb4',
        // collate: 'utf8mb4_general_ci',
    },
    profile: {//프로필
        type: DataTypes.STRING(500),
        allowNull: true,
        unique: false,
    },
    link: {//프로필
        type: DataTypes.STRING(500),
        allowNull: true,
        unique: false,
    },
    phone: {//프로필
        type: DataTypes.STRING(500),
        allowNull: true,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'PartnerExchange',
    tableName: 'partnerExchanges',
    paranoid: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    // charset: 'utf8',
    // collate: 'utf8_general_ci',
});

export const associate = (db: dbType) => {
    // db.PartnerExchange.hasOne(db.User)
};

export default PartnerExchange;
