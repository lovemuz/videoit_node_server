import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType, Container
} from './index';
import { sequelize } from './sequelize';

class Comment extends Model {
    public readonly id!: number;
    public content: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
Comment.init({
    content: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Comment',
    tableName: 'comments',
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
});

export const associate = (db: dbType) => {
    db.Comment.belongsTo(db.User)
    db.Comment.belongsTo(db.Post)
    db.Comment.hasMany(db.CommentChild)
};

export default Comment;
