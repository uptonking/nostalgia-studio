import { DataTypes, Model, type Sequelize } from 'sequelize';

export class Comment extends Model {
  declare userId: number;

  static associate(models) {
    this.belongsTo(models.Article, { foreignKey: 'articleId' });
    this.belongsTo(models.User, { as: 'author', foreignKey: 'userId' });
  }

  static initModel(sequelize: Sequelize) {
    Comment.init(
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: DataTypes.INTEGER,
        },
        body: DataTypes.TEXT,
      },
      {
        sequelize,
        tableName: 'comments',
      },
    );
  }

  toJSON() {
    return {
      ...this.get(),
      articleId: undefined,
      userId: undefined,
    };
  }
}
