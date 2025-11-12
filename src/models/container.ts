import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import { dbType } from './index';
import { sequelize } from './sequelize';

class Container extends Model {
    public readonly id!: number;
    public url: string;
    public content: string;
    public type: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
Container.init({
    url: {
        type: DataTypes.STRING(200),
        allowNull: true,
        unique: false,
    },
    content: {
        type: DataTypes.STRING(200),
        allowNull: true,
        unique: false,
    },
    type: {
        //0 일반채팅, 1 이미지 , 4 동영상, 2 파일 ,3 링크 , 5 관리자 alert
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Container',
    tableName: 'containers',
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    indexes: [
        {
            name: 'container_url',
            fields: ['url'],
        },
    ],
});

export const associate = (db: dbType) => {
    db.Container.belongsTo(db.Chat)
    db.Container.belongsTo(db.Post)
};

export default Container;