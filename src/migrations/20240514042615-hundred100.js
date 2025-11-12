'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    /*
    await queryInterface.addColumn('mcns', 'hundred100', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: true,
      unique: false,
    });
    await queryInterface.addColumn('users', 'ticket', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: true,
      unique: false,
    });
    */
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
