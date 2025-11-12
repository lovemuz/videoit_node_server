import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType
} from './index';
import { sequelize } from './sequelize';

class CommentChild extends Model {
    public readonly id!: number;
    public content: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
CommentChild.init({

    content: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: false,
    },

}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'CommentChild',
    tableName: 'commentChilds',
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
});

export const associate = (db: dbType) => {
    db.CommentChild.belongsTo(db.User)
    db.CommentChild.belongsTo(db.Comment)
    db.CommentChild.belongsTo(db.Post)
};

export default CommentChild;
