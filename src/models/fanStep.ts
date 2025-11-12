import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType, Benifit, Subscribe
} from './index';
import { sequelize } from './sequelize';

class FanStep extends Model {
    public readonly id!: number;
    public step: number;
    public title: string;
    public detail: string;
    public price: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly Benifits?: Benifit[];
    public readonly Subscribes?: Subscribe[];
}
FanStep.init({
    step: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
    title: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: false,
    },
    duration: { //0 아직 없음 , //1 이전기간 30일 , 2 모두 열람가능
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'FanStep',
    tableName: 'fanSteps',
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
});

export const associate = (db: dbType) => {
    db.FanStep.belongsTo(db.User)
    db.FanStep.hasMany(db.Benifit)
    db.FanStep.hasMany(db.Subscribe)

};

export default FanStep;
