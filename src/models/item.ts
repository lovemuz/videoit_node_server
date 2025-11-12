import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class Item extends Model {
    public readonly id!: number;
    public candy_count: number;
    public rose_count: number;
    public cake_count: number;
    public ring_count: number;
    public crown_count: number;
    public heart_count: number;
    public readonly deletedAt!: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
Item.init({
    candy_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
        unique: false,
    },
    rose_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
        unique: false,
    },
    cake_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
        unique: false,
    },
    ring_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
        unique: false,
    },
    crown_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
        unique: false,
    },
    heart_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: true,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Item',
    tableName: 'items',
    paranoid: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
});

export const associate = (db: dbType) => {
    db.Item.belongsTo(db.User)
};

export default Item;
