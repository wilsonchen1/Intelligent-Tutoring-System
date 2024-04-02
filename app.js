const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const loginRouter = require('./router/login');
const filesRouter = require('./router/files')
const jwtConfig = require('./jwt_config/index');
const {expressjwt: jwt} = require('express-jwt');
const errorHandler = require('./errHandler');
const joi = require('joi');
const app = express();

app.use(cors());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// 数据库错误的中间件
// app.use(errorHandler.handleDatabaseError);



// 除了登陆注册之外，其余路由都需要带token
app.use(jwt({
    secret: jwtConfig.jwtSecretKey,
    algorithms: ['HS256']
}).unless({
    path: [/^\/api\//]
}));

app.use((req, res, next) => {
    res.cc = (err, status = 1) => {
        res.send({
            status,
            message: err instanceof Error ? err.message : err
        });
    }
    next();
});

app.use('/api', loginRouter, filesRouter);

// 不符合joi验证的报错
app.use((err, req, res, next) => {
    if(err instanceof joi.ValidationError) {
        return res.cc(err);
    };
});

// 全局错误处理器
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        // 特别处理 JWT 认证错误
        return res.status(401).send({message: '无效的token'});
    }
    // 默认情况下，其他错误以500服务器错误响应
    res.status(500).send({message: err.message || '服务器内部错误'});
});

app.listen(3007, (req, res) => {
    console.log('listening on http://localhost:3007');
});