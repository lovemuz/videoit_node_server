import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class Score extends Model {
    public readonly id!: number;
    public time1: number
    public time2: number
    public time3: number
    public time4: number
    public score1: number
    public score2: number
    public score3: number
    public score4: number
    public score5: number

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

}
Score.init({
    time1: {//15초미만
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
        unique: false,
    },
    time2: {//1분미만
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
        unique: false,
    },
    time3: {//3분미만
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
        unique: false,
    },
    time4: {//3분이상
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
        unique: false,
    },
    score1: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
        unique: false,
    },
    score2: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
        unique: false,
    },
    score3: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
        unique: false,
    },
    score4: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
        unique: false,
    },
    score5: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
        unique: false,
    }
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Score',
    tableName: 'scores',
    paranoid: false,
    charset: 'utf8',
    collate: 'utf8_general_ci',
});

export const associate = (db: dbType) => {
    db.Score.belongsTo(db.User)
};

export default Score;
