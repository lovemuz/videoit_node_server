import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class Card extends Model {
    public readonly id!: number;
    public card_number: string;
    public expiry: string;
    public birth: string;
    public pwd_2digit: string;
    public name: string;
    public phone: string;
    public email: string;
    public billkeyKorean: string;
    public billkeyForeign: string;

    public billkeyKorean_HK: string;
    public billkeyForeign_HK: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
Card.init({
    card_number: {
        type: DataTypes.STRING(40),
        allowNull: true,
        unique: false,
    },
    expiry: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: false,
    },
    birth: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: false,
    },
    pwd_2digit: {
        type: DataTypes.STRING(10),
        allowNull: true,
        unique: false,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: false,
    },
    phone: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: false,
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: false,
    },
    billkeyKorean: {
        type: DataTypes.STRING(200),
        allowNull: true,
        unique: false,
        defaultValue: '',
    },
    billkeyForeign: {
        type: DataTypes.STRING(200),
        allowNull: true,
        unique: false,
        defaultValue: '',
    },
    billkeyKorean_HK: {
        type: DataTypes.STRING(200),
        allowNull: true,
        unique: false,
        defaultValue: '',
    },
    billkeyForeign_HK: {
        type: DataTypes.STRING(200),
        allowNull: true,
        unique: false,
        defaultValue: '',
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Card',
    tableName: 'cards',
    paranoid: false,
    charset: 'utf8',
    collate: 'utf8_general_ci',
    indexes: [
        {
            name: 'card_billkeyKorean',
            fields: ['billkeyKorean'],
        },
        {
            name: 'card_billkeyForeign',
            fields: ['billkeyForeign'],
        },
        {
            name: 'card_billkeyKorean_HK',
            fields: ['billkeyKorean_HK'],
        },
        {
            name: 'card_billkeyForeign_HK',
            fields: ['billkeyForeign_HK'],
        },
    ],
});

export const associate = (db: dbType) => {
    db.Card.belongsTo(db.User)

};

export default Card;
