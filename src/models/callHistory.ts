import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class CallHistory extends Model {
    public readonly id!: number;
    public time: number

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
CallHistory.init({ //채팅, 영상통화, 선물 등?  
    time: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'CallHistory',
    tableName: 'callHistorys',
    paranoid: false,
    charset: 'utf8',
    collate: 'utf8_general_ci',
    indexes: [
        {
            name: 'callHistory_createdAt',
            fields: ['createdAt'],
        },
    ],
});

export const associate = (db: dbType) => {
    db.CallHistory.belongsTo(db.User)
    db.CallHistory.belongsTo(db.User, {
        as: 'CallHistoriesByCreatedAt',
        foreignKey: {
            name: 'UserIdByCreatedAt',
        }
    })

};

export default CallHistory;
