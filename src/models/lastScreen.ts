import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class LastScreen extends Model {
    public readonly id!: number;
    public name: string;
    public changedAt: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

}
LastScreen.init({
    name: {
        type: DataTypes.STRING(200),
        allowNull: true,
        unique: false,
    },
    changedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'LastScreen',
    tableName: 'lastScreens',
    paranoid: false,
    charset: 'utf8',
    collate: 'utf8_general_ci',
    /*indexes: [
        {
            name: 'lastScreen_changedAt',
            fields: ['changedAt'],
        },
    ],
    */
});

export const associate = (db: dbType) => {
    db.LastScreen.belongsTo(db.User)
};

export default LastScreen;
