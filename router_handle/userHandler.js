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

// 更新学生成绩
const updateStudentGrades = (account, newGrades) => {
    return new Promise((resolve, reject) => {
        // 检查每个成绩是否在有效范围内
        const { test_1, test_2, test_3, test_final } = newGrades;
        if ([test_1, test_2, test_3, test_final].some(grade => grade < 0 || grade > 100)) {
            return reject(new Error("所有成绩必须在0到100之间"));
        }

        const sql = `
            UPDATE grades
            SET test_1 = ?, test_2 = ?, test_3 = ?, test_final = ?
            WHERE account = ?;
        `;
        db.query(sql, [test_1, test_2, test_3, test_final, account], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

// 获取用户列表
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

const updateGrades = async (req, res, next) => {
    const { account, grades } = req.body;
    if (!account || !grades) {
        return res.status(400).send({ message: '账号和成绩信息不能为空' });
    }

    try {
        const result = await updateStudentGrades(account, grades);
        if (result.affectedRows > 0) {
            res.send({
                status: 0,
                message: '成绩更新成功'
            });
        } else {
            res.send({
                status: 1,
                message: '未找到对应学生或成绩未更改'
            });
        }
    } catch (err) {
        // 捕获由数据验证引发的错误
        if (err.message.includes("成绩必须在0到100之间")) {
            return res.status(400).send({ message: err.message });
        }
        next(err);
    }
}


module.exports = { getUsers, updateGrades };