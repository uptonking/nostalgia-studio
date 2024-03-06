import { DataTypes, Model, type Sequelize } from 'sequelize';

export class Tag extends Model {
  static associate(models) {
    this.belongsToMany(models.Article, {
      through: 'TagList',
      foreignKey: 'tagName',
      timestamps: false,
    });
  }

  static initModel(sequelize: Sequelize) {
    Tag.init(
      {
        name: {
          type: DataTypes.STRING,
          allowNull: false,
          primaryKey: true,
        },
      },
      {
        sequelize,
        tableName: 'tags',
        // timestamps: false,
      },
    );
  }
}
