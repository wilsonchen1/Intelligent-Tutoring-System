// filesHandler.js

const multer = require("multer");
const OSS = require("ali-oss");
const fs = require("fs");
require("dotenv").config();
// 使用 multer 临时保存上传的文件
const upload = multer({ dest: "uploads/" });

// 配置 OSS 客户端
const client = new OSS({
    region: process.env.OSS_REGION,
    accessKeyId: process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    bucket: process.env.OSS_BUCKET,
});

// 函数用于将文件上传到 OSS
async function uploadToOSS(req, res, next) {
    const file = req.file;
    if (!file) {
        return res.status(400).send("No file uploaded.");
    }

    try {
        // 读取文件内容
        const fileContent = fs.readFileSync(file.path);
        // 上传文件到 OSS
        const result = await client.put(file.originalname, fileContent);
        // 删除临时文件
        fs.unlinkSync(file.path);
        // 将 OSS 返回的 URL 保存到请求对象，以便后续使用
        req.fileURL = result.url;
        next(); // 调用下一个中间件或路由处理器
    } catch (err) {
        console.error("Error uploading file to OSS:", err);
        res.status(500).send("Error uploading file.");
    }
}
function download(req, res) {
    const filename = req.params.filename;

    try {
        // 构造文件 URL
        const url = client.signatureUrl(filename, { expires: 3600 }); // 设置 URL 有效时间为 1 小时
        res.redirect(url); // 重定向到文件 URL，触发下载
    } catch (err) {
        console.error("Error generating download URL:", err);
        res.status(500).send("Error downloading file.");
    }
}
module.exports = { upload: [upload.single("file"), uploadToOSS], download };
