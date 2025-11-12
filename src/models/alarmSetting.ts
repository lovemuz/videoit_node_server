import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class AlarmSetting extends Model {
    public readonly id!: number;
    public news: boolean;
    public comment: boolean;
    public gift: boolean;
    public call: boolean;
    public chat: boolean;
    public follow: boolean;
    public post: boolean;
    public creatorPush: boolean;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
AlarmSetting.init({
    news: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: true,
        unique: false,
    },
    comment: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: true,
        unique: false,
    },
    gift: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: true,
        unique: false,
    },
    call: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: true,
        unique: false,
    },
    chat: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: true,
        unique: false,
    },
    follow: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: true,
        unique: false,
    },
    post: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: true,
        unique: false,
    },
    creatorPush: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: true,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'AlarmSetting',
    tableName: 'alarmSettings',
    paranoid: false,
    charset: 'utf8',
    collate: 'utf8_general_ci',
});

export const associate = (db: dbType) => {
    db.AlarmSetting.belongsTo(db.User)
};

export default AlarmSetting;
