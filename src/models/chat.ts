import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import { dbType, Container, Authority } from './index';
import { sequelize } from './sequelize';

class Chat extends Model {
    public readonly id!: number;
    public url: string;
    public thumbnail: string;
    public content: string;
    public type: number;
    public cost: number;
    public lock: boolean
    public adult: boolean;
    public removeState: Boolean
    public removeApplyedAt: Date;
    public purchasePossibledAt: Date;
    public readonly deletedAt!: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly Containers?: Container[];
    public readonly Authoritys?: Authority[];
}
Chat.init({
    cost: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
    adult: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true,
        unique: false,
    },
    purchasePossibledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        unique: false,
    },
    url: {
        type: DataTypes.STRING(200),
        allowNull: true,
        unique: false,
    },
    thumbnail: {
        type: DataTypes.STRING(200),
        allowNull: true,
        unique: false,
    },
    lock: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true,
        unique: false,
    },
    content: {
        type: DataTypes.STRING(200),
        allowNull: true,
        unique: false,
    },
    type: {
        //0 일반채팅, 1 이미지 , 4 동영상, 2 파일 ,3 링크 , 5 관리자 alert ,6 선물
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
    removeState: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true,
        unique: false,
    },
    removeApplyedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Chat',
    tableName: 'chats',
    paranoid: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    indexes: [
        {
            name: 'chat_url',
            fields: ['url'],
        },
        {
            name: 'chat_createdAt',
            fields: ['createdAt'],
        },
    ],
});

export const associate = (db: dbType) => {
    db.Chat.belongsTo(db.Room)
    db.Chat.belongsTo(db.User)
    db.Chat.hasMany(db.Container)
    db.Chat.hasMany(db.Authority)

};

export default Chat;