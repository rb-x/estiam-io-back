const Sequelize = require('sequelize')
const db = {}
const sequelize = new Sequelize("myblog", process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT_TYPE,
    operatorAliases: false,

    pool: {
        max: 5,
        min: 0,
        aquire: 3000,
        idle: 10000
    }
})
db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db