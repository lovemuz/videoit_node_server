import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class Benifit extends Model {
    public readonly id!: number;
    public content: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
Benifit.init({
    content: {
        type: DataTypes.STRING(200),
        allowNull: true,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Benifit',
    tableName: 'benifits',
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
});

export const associate = (db: dbType) => {
    db.Benifit.belongsTo(db.User)
    db.Benifit.belongsTo(db.FanStep)
};

export default Benifit;
