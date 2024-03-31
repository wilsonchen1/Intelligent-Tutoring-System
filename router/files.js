const express = require('express');
const router = express.Router();
const { upload, download } = require('../router_handle/filesHandler'); // 调整路径以匹配你的项目结构

// 定义文件上传路由
router.post('/upload', upload, function (req, res) {
  // 文件上传成功后，上传到 OSS 的 URL 在 req.fileURL 中可用
  res.send({ message: 'File uploaded successfully.', url: req.fileURL });
});

// 定义文件下载路由
router.get('/download/:filename', download);

module.exports = router;
