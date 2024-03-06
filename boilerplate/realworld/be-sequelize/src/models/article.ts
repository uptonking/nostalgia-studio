import { DataTypes, Model, type Sequelize } from 'sequelize';

export class Article extends Model {
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'userId', as: 'author' });

    this.belongsToMany(models.User, {
      through: 'Favorites',
      foreignKey: 'articleId',
      timestamps: false,
    });

    this.belongsToMany(models.Tag, {
      through: 'TagList',
      as: 'tagList',
      foreignKey: 'articleId',
      timestamps: false,
      // todo fix delete tags
      onDelete: 'cascade',
    });

    this.hasMany(models.Comment, {
      foreignKey: 'articleId',
      onDelete: 'cascade',
    });
  }

  static initModel(sequelize: Sequelize) {
    Article.init(
      {
        slug: DataTypes.STRING,
        title: DataTypes.STRING,
        description: DataTypes.TEXT,
        body: DataTypes.TEXT,
      },
      {
        sequelize,
        tableName: 'articles',
      },
    );
  }
}
