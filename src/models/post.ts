import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType, Wish, Container, Authority, Comment, CommentChild,
} from './index';
import { sequelize } from './sequelize';

class Post extends Model {
    public readonly id!: number;
    public type: number;
    public title: string
    public content: string
    public contentSecret: boolean
    public url: string
    public thumbnail: string
    public pin: boolean
    public lock: boolean
    public cost: number
    public step: number;
    public adult: boolean;
    public removeState: Boolean
    public removeApplyedAt: Date;


    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public readonly Wishes?: Wish[];
    public readonly Containers?: Container[];
    public readonly Authoritys?: Authority[];
    public readonly Comments?: Comment[];
    public readonly CommentChilds?: CommentChild[];


}
Post.init({
    adult: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true,
        unique: false,
    },
    type: {
        //1 이미지 , 4 동영상
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
    title: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: false,
    },
    content: {
        type: DataTypes.STRING(1000),
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
    step: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
        unique: false,
    },
    contentSecret: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true,
        unique: false,
    },
    pin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true,
        unique: false,
    },
    lock: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true,
        unique: false,
    },
    cost: {
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
    modelName: 'Post',
    tableName: 'posts',
    paranoid: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    indexes: [
        {
            name: 'post_url',
            fields: ['url'],
        },
        {
            name: 'post_createdAt',
            fields: ['createdAt'],
        }
    ],
});

export const associate = (db: dbType) => {
    db.Post.belongsTo(db.User)
    db.Post.hasMany(db.Wish)
    db.Post.hasMany(db.Container)
    db.Post.hasMany(db.Authority)
    db.Post.hasMany(db.Comment)
    db.Post.hasMany(db.CommentChild)
};

export default Post;
