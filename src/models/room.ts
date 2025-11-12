import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import { dbType, Chat, User, UserRoom } from './index';
import { sequelize } from './sequelize';

class Room extends Model {
    public readonly id!: number;
    public lastChatDate: Date;
    public MeId: number;
    public YouId: number
    public firstCost: boolean;
    public calling: boolean;
    public callingAt: Date;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public readonly Chats?: Chat[];
    public readonly UserRooms?: UserRoom[];
}
Room.init({
    lastChatDate: {
        type: DataTypes.DATE,
        allowNull: true,
        unique: false,
    },
    callingAt: {
        type: DataTypes.DATE,
        allowNull: true,
        unique: false,
    },
    calling: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true,
        unique: false,
    },
    firstCost: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true,
        unique: false,
    },
    MeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
    YouId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Room',
    tableName: 'rooms',
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    indexes: [
        {
            name: 'room_lastChatDate',
            fields: ['lastChatDate'],
        },
        {
            name: 'room_MeId',
            fields: ['MeId'],
        },
        {
            name: 'room_YouId',
            fields: ['YouId'],
        },
        {
            name: 'room_callingAt',
            fields: ['callingAt'],
        },
    ],
});

export const associate = (db: dbType) => {
    db.Room.hasMany(db.Chat)
    db.Room.hasMany(db.UserRoom)
    db.Room.hasMany(db.UserRoom, {
        as: 'MyUserRoom',
        foreignKey: {
            name: 'MyRoomId',
        }
    })
};

export default Room;