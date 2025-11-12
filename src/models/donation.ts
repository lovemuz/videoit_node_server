import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class Donation extends Model {
    public readonly id!: number;
    public donationerId: number;
    public donationingId: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
Donation.init({
    amount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Donation',
    tableName: 'donations',
    paranoid: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
});

export const associate = (db: dbType) => {
};

export default Donation;