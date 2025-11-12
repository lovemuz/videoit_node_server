import {
    Model, DataTypes, BelongsToManyGetAssociationsMixin,
    HasManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    BelongsToManyAddAssociationMixin,
} from 'sequelize';
import {
    dbType,
} from './index';
import { sequelize } from './sequelize';

class PointHistory extends Model {
    public readonly id!: number;
    public type: number;
    public plusOrMinus: boolean;
    public amount: number;

    public readonly deletedAt!: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}
PointHistory.init({
    type: {
        // 0 영상통화 , 1 채팅 , 2, 출석체크, 3.선물 구매 , 4. 환전 , 5. 게시글 구매
        type: DataTypes.INTEGER,
        defaultValue: true,
        allowNull: true,
        unique: false,
    },
    plusOrMinus: { // plus -> true , minus- >false
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: true,
        unique: false,
    },
    amount: {
        type: DataTypes.INTEGER,
        defaultValue: true,
        allowNull: true,
        unique: false,
    },
}, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'PointHistory',
    tableName: 'pointHistorys',
    paranoid: true,
    charset: 'utf8',
    collate: 'utf8_general_ci',
});

export const associate = (db: dbType) => {
    db.PointHistory.belongsTo(db.User)
};

export default PointHistory;
