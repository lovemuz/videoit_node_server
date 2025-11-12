import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class Alarm extends Model {
    public readonly id!: number;
    public type: number;
    public url: string;
    public content: string;
    public read: Boolean;
    public YouId: number;
    public PostId: number;
    public RoomId: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
Alarm.init({
    type: { // 1 포스트 ,2 선물 ,3 공지 , 
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
    url: {
        type: DataTypes.STRING(200),
        allowNull: true,
        unique: false,
    },
    read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true,
        unique: false,
    },
    content: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: false,
    },
    YouId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
    PostId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
    RoomId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Alarm',
    tableName: 'alarms',
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    indexes: [
        {
            name: 'alarm_YouId',
            fields: ['YouId'],
        },
        {
            name: 'alarm_PostId',
            fields: ['PostId'],
        },
        {
            name: 'alarm_RoomId',
            fields: ['RoomId'],
        },

    ],
});

export const associate = (db: dbType) => {
    db.Alarm.belongsTo(db.User)
};

export default Alarm;
