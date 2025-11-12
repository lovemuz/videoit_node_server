import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class SocialLogin extends Model {
    public readonly id!: number;
    public UserId: number;
    public email: string;
    public sns: string;
    public snsId: string;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

}
SocialLogin.init({
    email: {
        type: DataTypes.STRING(200),
        allowNull: true,
        unique: false,
    },
    sns: {
        type: DataTypes.STRING(200),
        allowNull: true,
        unique: false,
    },
    snsId: {
        type: DataTypes.STRING(200),
        allowNull: true,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'SocialLogin',
    tableName: 'socialLogins',
    paranoid: false,
    charset: 'utf8',
    collate: 'utf8_general_ci',
    indexes: [
        {
            name: 'socialLogin_email',
            fields: ['email'],
        },
        {
            name: 'socialLogin_sns',
            fields: ['sns'],
        },
        {
            name: 'socialLogin_snsId',
            fields: ['snsId'],
        },
    ],
});

export const associate = (db: dbType) => {
    db.SocialLogin.belongsTo(db.User)

};

export default SocialLogin;
