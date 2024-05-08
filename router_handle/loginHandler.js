const db = require('../db/index');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../jwt_config/index');


const queryUser = async (account) => {
    return new Promise((resolve, reject) => {
        const sql = 'select * from users where account = ?';
        db.query(sql, account, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result); 
            };
        });
    });
}

const insertUser = async (account, password, identity) => {
    console.log(identity);
    return new Promise((resolve, reject) => {
        const sql = 'insert into users set ?';
        db.query(sql, {
            account: account,
            password: password,
            create_time: new Date(),
            identity: identity,
        }, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

const generateToken = (user) => {
    const { password, image_url, create_time, update_time, ...userInfo } = user;
    const token = jwt.sign(userInfo, jwtConfig.jwtSecretKey, { expiresIn: '7d' });
    return token;
}

const register = async (req, res, next) => {
    const reqInfo = req.body;
    console.log(reqInfo)
    if(!reqInfo) {
        return res.cc('账号或密码不能为空')
    };

    try {
        const rows = await queryUser(reqInfo.account);
        if(rows && rows.length > 0) {
            res.cc('账号存在')
        };

        // 加密密码。并放入数据库
        const hashPassword = bcrypt.hashSync(reqInfo.password, 10);
        await insertUser(reqInfo.account, hashPassword, reqInfo.identity);

        res.send({
            status: 0,
            message: '账号注册成功，请重新登录'
        });
    } catch (err) {
        next(err);
    };
}

const login = async (req, res, next) => {
    const loginInfo = req.body;
    try {
        // 查询数据库中是否存在这个学号
        const rows = await queryUser(loginInfo.account);
        if(rows.length === 0) {
            return res.cc('账号未注册');
        };
        console.log(rows, 'rows-login')
        // 比对密码
        const compareResult = bcrypt.compareSync(loginInfo.password, rows[0].password);
        if(!compareResult) {
            return res.cc('密码错误')
        };
        // status默认是0，如果是1那么账号失效
        if(rows[0].status === 1) {
            return res.cc('账号失效')
        };
        // 生成token，返回给前端
        const tokenStr = generateToken(rows[0]);
        res.send({
            results: rows[0],
            status: 0,
            message: '登陆成功',
            token: 'Bearer' + tokenStr
        });
    } catch(err) {
        next(err);
    }
}

module.exports = {login, register};