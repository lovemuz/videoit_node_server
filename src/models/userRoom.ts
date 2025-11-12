import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import { dbType, Chat, Room } from './index';
import { sequelize } from './sequelize';

class UserRoom extends Model {
    public readonly id!: number;
    public meShow: number;
    public meOutChatId: number;
    public meLastReadChatId: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public readonly Rooms?: Room[];
}
UserRoom.init({
    meShow: {
        //0 false , 1 true
        type: DataTypes.INTEGER,
        defaultValue: true,
        allowNull: true,
        unique: false,
    },
    //채팅방을 나갔을때 마지막으로 읽은 채팅
    meOutChatId: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
        unique: false,
    },
    //마지막으로 읽은 채팅
    meLastReadChatId: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'UserRoom',
    tableName: 'userRooms',
    paranoid: false,
    charset: 'utf8',
    collate: 'utf8_general_ci',
});

export const associate = (db: dbType) => {
    db.UserRoom.belongsTo(db.User)
    db.UserRoom.belongsTo(db.Room)
    db.UserRoom.belongsTo(db.Room, {
        as: 'MyUserRoom',
        foreignKey: {
            name: 'MyRoomId',
        }
    })
};

export default UserRoom;