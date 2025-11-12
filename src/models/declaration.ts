import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class Declaration extends Model {
    public readonly id!: number;
    public url: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
Declaration.init({
    url: {
        type: DataTypes.STRING(200),
        allowNull: true,
        unique: false,
    },
    type: {  // 0 영상통화,  1 유저 , 2 게시글, 3 채팅
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Declaration',
    tableName: 'declarations',
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
});

export const associate = (db: dbType) => {
    db.Declaration.belongsTo(db.User) // 신고 당한 사람 
    db.Declaration.belongsTo(db.Post)
    db.Declaration.belongsTo(db.Room)
};

export default Declaration;
