import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class Rank extends Model {
    public readonly id!: number;
    public UserId: number;
    public rank: number;
    public gender: number;
    public country: string
    public type: number;
    public date: number;
    public past: boolean

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

}
Rank.init({
    UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: false,
    },
    rank: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
    gender: {
        type: DataTypes.INTEGER, //1 여자 ,2 남자
        allowNull: true,
        unique: false,
    },
    country: {
        type: DataTypes.STRING(10),
        allowNull: true,
        unique: false,
    },
    type: {
        type: DataTypes.INTEGER, //1 영상 ,2 별선물,3 포인트
        allowNull: true,
        unique: false,
    },
    date: {
        type: DataTypes.INTEGER, //1 일간 ,2 주간,3 월간
        allowNull: true,
        unique: false,
    },
    past: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true,
        unique: false,
    }
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Rank',
    tableName: 'ranks',
    paranoid: false,
    charset: 'utf8',
    collate: 'utf8_general_ci',
    indexes: [
        {
            name: 'rank_UserId',
            fields: ['UserId'],
        }
    ],
});

export const associate = (db: dbType) => {
};

export default Rank;
