import { DataTypes, Model, type Sequelize } from 'sequelize';

export class User extends Model {
  declare id: number;
  declare username: string;
  declare email: string;
  declare password: string;
  declare mobile: string;
  declare status: boolean;
  declare bio?: string;
  declare image?: string;
  declare created_at: Date;
  declare updated_at: Date;

  static associate(models) {
    this.hasMany(models.Article, { foreignKey: 'userId', onDelete: 'CASCADE' });

    this.belongsToMany(models.Article, {
      through: 'Favorites',
      as: 'favorites',
      foreignKey: 'userId',
      timestamps: false,
    });

    this.belongsToMany(User, {
      through: 'Followers',
      as: 'followers',
      foreignKey: 'userId',
      timestamps: false,
    });
    this.belongsToMany(User, {
      through: 'Followers',
      as: 'following',
      foreignKey: 'followerId',
      timestamps: false,
    });

    this.hasMany(models.Comment, { foreignKey: 'articleId' });
  }

  static initModel(sequelize: Sequelize) {
    User.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        username: {
          type: DataTypes.STRING,
          // allowNull: false,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        mobile: {
          type: DataTypes.STRING,
        },
        password: {
          type: DataTypes.STRING,
        },
        status: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
        },
        role: {
          type: DataTypes.INTEGER,
          defaultValue: 2,
        },
        bio: DataTypes.TEXT,
        image: DataTypes.TEXT,
      },
      {
        sequelize,
        tableName: 'users',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
    );
  }

  toJSON() {
    return {
      ...this.get(),
      // id: undefined,
      password: undefined,
      updatedAt: undefined,
      createdAt: undefined,
    };
  }
}
