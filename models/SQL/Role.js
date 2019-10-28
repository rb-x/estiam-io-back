const Sequelize = require('sequelize')
const db = require('../../config/databaseAuth/db')

module.exports = db.sequelize.define(
        'role', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: Sequelize.STRING
            },
            {
                timestamps: false
            }
        )