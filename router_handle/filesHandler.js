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
    const fileName = decodeURIComponent(file.originalname);
    // 检查文件大小
    const FILE_SIZE_THRESHOLD = 10 * 1024 * 1024; // 10MB
    const fileStat = fs.statSync(file.path);
    const fileSize = fileStat.size;

    // if (fileSize > FILE_SIZE_THRESHOLD) {
    //     // 文件大于10MB，执行分片上传
    //     await multipartUpload(file, fileName);
    // } else {
    //     // 文件小于或等于10MB，执行直接上传
    //     await directUpload(file, fileName);
    // }
    // 先不管大小文件了，统一上传不分片
    await directUpload(file, fileName);
    // 删除临时文件
    fs.unlinkSync(file.path);
    res.send({ message: 'File uploaded successfully.' });
    next(); // 调用下一个中间件或路由处理器
}

// 直接上传小文件
async function directUpload(file, filename) {
    try {
        const fileContent = fs.readFileSync(file.path);
        await client.put(filename, fileContent);
        // 保存文件URL等操作...
    } catch (err) {
        console.error("Error uploading file to OSS:", err);
        // 处理错误...
    }
}

// 分片上传大文件
// async function multipartUpload(file, filename) {
//     try {
//         const filePath = file.path;
//         const fileSize = fs.statSync(filePath).size;
//         const uploadId = (await client.initMultipartUpload(filename)).uploadId;
//         const partSize = 10 * 1024 * 1024; // 分片大小，例如 10MB
//         const parts = Math.ceil(fileSize / partSize);

//         const partETags = [];
//         for (let i = 0; i < parts; i++) {
//             const start = i * partSize;
//             const end = Math.min(start + partSize, fileSize);
//             const partBuffer = fs.readFileSync(filePath, {start, end: end - 1});
            
//             const result = await client.uploadPart(filename, uploadId, i + 1, partBuffer);
//             partETags.push({partNumber: i + 1, eTag: result.res.headers.etag});
//         }

//         await client.completeMultipartUpload(filename, uploadId, partETags.map(etag => ({ETag: etag.eTag, PartNumber: etag.partNumber})));
//     } catch (err) {
//         console.error("Error during multipart upload to OSS:", err);
//         if (uploadId) {
//             await client.abortMultipartUpload(filename, uploadId);
//         }
//         throw err; // Re-throw the error to be caught by the outer error handler
//     }
// }

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


// 函数用于从 OSS 获取文件列表
async function getFilesList(req, res) {
    try {
        // 使用 list 方法获取文件列表
        // 可以通过 options 参数定制返回的列表，例如设置 prefix 来获取某个子目录下的文件
        const result = await client.list({
            'max-keys': 10 // 示例：限制返回的文件数量为10，你可以根据需要调整
        });
        // 返回文件列表给客户端
        res.send({
            success: true,
            data: result.objects.map(file => ({
                name: file.name,
                url: client.signatureUrl(file.name, {expires: 3600}) // 生成带签名的URL，方便直接访问或下载
            }))
        });
    } catch (err) {
        console.error("Error getting file list from OSS:", err);
        res.status(500).send("Error getting file list.");
    }
}

module.exports = { upload: [upload.single("file"), uploadToOSS], download, getFilesList };
