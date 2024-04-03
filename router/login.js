// 登陆注册的路由
const express = require('express');
// joi中间件
const expressJoi = require('@escook/express-joi');
const router = express.Router();
// 导入路由登陆注册处理模块
const {login, register} = require('../router_handle/loginHandler');

// 导入验证规则
const {loginLimit, registerLimit} = require('../limit/login');

router.post('/register', expressJoi(registerLimit), register);
router.post('/login', expressJoi(loginLimit), login);

module.exports = router;