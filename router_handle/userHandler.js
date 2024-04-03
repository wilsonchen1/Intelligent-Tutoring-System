const db = require('../db/index');

const selectUsersAndGrades = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT users.account, users.name, grades.*
            FROM users
            JOIN grades ON users.account = grades.account
            WHERE users.status = 0;
        `;
        db.query(sql, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        })
    });
}

const getUsers = async (req, res, next) => {
    try {
        const rows = await selectUsersAndGrades();
        if(rows && rows.length > 0) {
            res.send({
                results: rows,
                status: 0,
                message: '获取用户列表成功'
            });
        }
    } catch (err) {
        next(err);
    }
}
module.exports = {getUsers}