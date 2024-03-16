// 导入数据库
const mysql = require('mysql');

// 创建与数据库的连接
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'cyhzsqwer123',
    database: 'back_system'
});

module.exports = db;