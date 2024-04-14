const db = require('../db/index');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
// 在node环境执行python代码
const { spawn } = require('child_process');


const getChaptersWithKnowledgePoints = async () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT c.chapter_id, c.chapter_name, kp.knowledge_point_id, kp.knowledge_point_name, kp.knowledge_point_label
            FROM chapters c
            JOIN knowledge_points kp ON c.chapter_id = kp.chapter_id
            ORDER BY c.chapter_id, kp.knowledge_point_id
        `;
        db.query(sql, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        })
    });
}

const getChapters = async (req, res, next) => {
    try {
        const rows = await getChaptersWithKnowledgePoints();
        // 处理数据
        const chapters = rows.reduce((acc, row) => {
            // 查找当前章节是否已经在累积结果中
            let chapter = acc.find(chap => chap.chapter_id === row.chapter_id);
            if (!chapter) {
            // 如果当前章节还不在累积结果中，则添加它
                chapter = {
                    chapter_id: row.chapter_id,
                    chapter_name: row.chapter_name,
                    knowledgePoints: []
                };
                acc.push(chapter);
            }
            // 向当前章节添加知识点
            chapter.knowledgePoints.push({
                knowledge_point_id: row.knowledge_point_id,
                knowledge_point_name: row.knowledge_point_name,
                knowledge_point_label: row.knowledge_point_label
            });
            return acc;
        }, []);
        
        res.send({
            status: 0,
            results: chapters,
            message: '章节及知识点'
        });
    } catch (err) {
        console.error('Error fetching chapters with knowledge points:', err);
        next(err);
    }
}

// 用于记录生成进度
const taskStatus = {}

const generatePaper = async (req, res, next) => {
    // 唯一任务id
    const taskId = Date.now().toString(36) + Math.random().toString(36);
    res.send({ status: 'success', taskId, message: '正在生成中, 请耐心等待1-2分钟' });
    taskStatus[taskId] = { status: 'generating', message: 'generating' };

    try {
        const { knowledgePoints } = req.body;
        const singleBlock = knowledgePoints.join(',') + '\n';

        // 重复这个字符串10次
        const dataToWrite = Array(10).fill(singleBlock).join('');
        console.log(dataToWrite)
        // const dataToWrite = knowledgePoints.join('\n');
        const inputFilePath = path.join(__dirname, '../python_modules/data_input.txt');
        fs.writeFileSync(inputFilePath, dataToWrite, { encoding: 'utf8' });

        // 定义输出文件路径
        const outputFilePath = path.join(__dirname, '../python_modules/data_output_aigc_text_wenxinyiyan4.txt');
        const parsedOutputFilePath = path.join(__dirname, '../python_modules/data_parsed.txt');

         // 调用第一个Python脚本（请求eb4）
        await runPythonScript(path.join(__dirname, '../python_modules/wenxin_api_cs_answer.py'), [inputFilePath, outputFilePath]);

        // 调用第二个Python脚本（解析eb4返回的结果）
        await runPythonScript(path.join(__dirname, '../python_modules/parse_eb4_result.py'), [outputFilePath, parsedOutputFilePath]);

        // 读取解析后的结果文件并返回给客户端
        const parsedOutput = fs.readFileSync(parsedOutputFilePath, { encoding: 'utf8' });
        
        // 返回客户端成功的消息
        taskStatus[taskId] = { status: 'complete', message: 'Success to generate paper' };

        // 把生成的试卷结果存入数据库
        insertIntoDatabase(parsedOutput);

    } catch (error) {
        console.error('Error during paper generation:', error);
        taskStatus[taskId] = { status: 'error', message: 'Failed to generate paper.' };
    }
}

// 函数用于运行Python脚本
function runPythonScript(scriptName, args) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', [scriptName, ...args]);
        pythonProcess.on('close', (code) => {
        if (code !== 0) {
            reject(new Error(`Python script ${scriptName} exited with code ${code}`));
        } else {
            resolve();
            }
        });

        pythonProcess.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });
        
        pythonProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });
        
        pythonProcess.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });
    });
}

// 试卷插入数据库
const insertIntoDatabase = (text) => {

    // 解析题目文本
    const questions = text.trim().split('\n\n').map((q, index) => {
        const lines = q.split('\n');
        const questionNum = index + 1;
        const questionText = lines.slice(1, lines.length - 2).join('\n');
        const answer = lines[lines.length - 2].split(': ')[1];
        const explanation = lines[lines.length - 1].split(': ')[1];

        return {
            questionNum,
            questionText,
            answer,
            explanation,
        };
    });

    console.log(questions);
}

// 任务状态查询接口
const getTaskStatus = (req, res) => {
    const { taskId } = req.body;
    
    const status = taskStatus[taskId];
    console.log(status);
    if (status) {
        res.send(status);
    } else {
        res.status(404).send({ status: 'error', message: 'Task not found' });
    }
};
  
module.exports = { getChapters, generatePaper, getTaskStatus };