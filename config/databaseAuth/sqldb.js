var mysql = require('mysql');

var con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: 3307,
    password: process.env.DB_PASSWORD,
    database: "myblog"
});


module.exports = {
    connect: con.connect(function (err) {
        if (err) throw err;
        con.query("SELECT * FROM users", function (err, result, fields) {
            if (err) throw err;
            console.log(result);
        });
    })

}