import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class Subscribe extends Model {
    public readonly id!: number;
    public subscriberId: number;
    public subscribingId: number;
    public subscribeCount: number;
    public step: number;
    public lastPrice: number;
    public subscribeState: Boolean;
    public subscribedAt: Boolean;
    public billkeyKorean: string;
    public billkeyForeign: string;
    public billkeyKorean_HK: string;
    public billkeyForeign_HK: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
Subscribe.init({
    subscribeCount: {//구독횟수
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: true,
        unique: false,
    },
    step: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
    lastPrice: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
        unique: false,
    },
    /*
    subscribePreCancel: {// true, 미리 취소, false, 취소안함
        type: DataTypes.BOOLEAN,
        defaultValue:false,
        allowNull: true,
        unique: false,
    },
    */
    subscribeState: {//구독 여부 -> 0 취소 , 1구독중
        type: DataTypes.BOOLEAN,
        allowNull: true,
        unique: false,
    },
    subscribedAt: {//구독 마지막으로 한 날짜
        type: DataTypes.DATE,
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
    modelName: 'Subscribe',
    tableName: 'subscribes',
    paranoid: false,
    charset: 'utf8',
    collate: 'utf8_general_ci',
    indexes: [
        {
            name: 'subscribe_subscribedAt',
            fields: ['subscribedAt'],
        }
    ],
});

export const associate = (db: dbType) => {
    db.Subscribe.belongsTo(db.FanStep)
};

export default Subscribe;
