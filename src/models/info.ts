import {
  Model, DataTypes, BelongsToManyGetAssociationsMixin,
  HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
  BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
  dbType,
} from './index';
import { sequelize } from './sequelize';

class Info extends Model {
  public readonly id!: number;
  public phone: string;
  public real_birthday: number;
  public real_gender: number;
}
Info.init({
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: false,
  },
  real_birthday: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: false,
  },
  real_gender: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: false,
  },
}, {
  sequelize,
  timestamps: true,
  underscored: false,
  modelName: 'Info',
  tableName: 'infos',
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
  indexes: [
    {
      name: 'info_phone',
      fields: ['phone'],
    },
  ],
});

export const associate = (db: dbType) => {
};

export default Info;
