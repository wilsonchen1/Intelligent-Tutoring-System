// 文件模块路由
const express = require('express');
const router = express.Router();
const { upload, download, getFilesList } = require('../router_handle/filesHandler'); // 调整路径以匹配你的项目结构

// 定义文件上传路由
router.post('/upload', upload);

// 定义文件下载路由
router.get('/download/:filename', download);

// 定义获取文件列表的路由
router.get('/getFiles', getFilesList);

module.exports = router;
