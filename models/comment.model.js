const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Comment = sequelize.define(
  'Comment',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },

    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: 'comments',
    timestamps: true,
  }
);

module.exports = Comment;