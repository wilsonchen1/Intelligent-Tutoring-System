const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const loginRouter = require('./router/login');
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

app.use('/api', loginRouter);

// 不符合joi验证的报错
app.use((req, res, next) => {
    if(err instanceof joi.ValidationError) {
        return res.cc(err);
    };
});

app.listen(8080, (req, res) => {
    console.log('listening on http://localhost:8080');
});