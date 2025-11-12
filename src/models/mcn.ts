import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class Mcn extends Model {
    public readonly id!: number;
    public mcnerId: number;
    public mcningId: number;
    public creatorCharge: number;
    public hundred100: boolean
    public eventCh01: boolean

    public showExchange: boolean; //@depecreated
    public code: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

}
Mcn.init({
    creatorCharge: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
        unique: false,
    },
    hundred100: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true,
        unique: false,
    },
    showExchange: {  //@depecreated
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: true,
        unique: false,
    },
    eventCh01: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true,
        unique: false,
    },
    code: {
        type: DataTypes.STRING(50),
        defaultValue: '',
        allowNull: true,
        unique: false,
    },

}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Mcn',
    tableName: 'mcns',
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
});

export const associate = (db: dbType) => {
};

export default Mcn;