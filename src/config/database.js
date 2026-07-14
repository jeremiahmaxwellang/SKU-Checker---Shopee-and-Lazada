require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

let mysql = require('mysql2/promise');

const mySqlPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    supportBigNumbers: true, // Handles BIGINT safely
    bigNumberStrings: false  // Converts small enough BIGINTs into standard JS Numbers
});
// password stored in /src/.env

module.exports = mySqlPool;