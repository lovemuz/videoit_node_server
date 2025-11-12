import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class Block extends Model {
    public readonly id!: number;
    public phone: string;
    public email: string;
    public token: string;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
Block.init({
    phone: {
        type: DataTypes.STRING(40),
        allowNull: true,
        unique: false,
    },
    email: {
        type: DataTypes.STRING(40),
        allowNull: true,
        unique: false,
    },
    token: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Block',
    tableName: 'blocks',
    paranoid: false,
    charset: 'utf8',
    collate: 'utf8_general_ci',
    indexes: [
        {
            name: 'block_phone',
            fields: ['phone'],
        },
        {
            name: 'block_email',
            fields: ['email'],
        },
        {
            name: 'block_token',
            fields: ['token'],
        },
    ],
});

export const associate = (db: dbType) => {

};

export default Block;
