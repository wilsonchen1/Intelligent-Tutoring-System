// 用户/学生管理模块路由
const express = require('express');
const router = express.Router();

const {getUsers} = require('../router_handle/userHandler')
// 定义获取用户列表
router.get('/getUsers', getUsers);

// 定义文件下载路由
// router.get('/download/:filename', download);

// // 定义获取文件列表的路由
// router.get('/getFiles', getFilesList);

module.exports = router;
