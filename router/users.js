// 用户/学生管理模块路由
const express = require('express');
const router = express.Router();

const {getUsers, updateGrades} = require('../router_handle/userHandler')
// 定义获取用户列表
router.get('/getUsers', getUsers);

router.patch('/updateGrades', updateGrades);

module.exports = router;
