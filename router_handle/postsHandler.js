const db = require('../db/index');

// ------------------------------功能函数-------------------------------
// 插入新帖子
const insertPost = async (userId, title, content) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO posts (user_id, title, content, create_time) VALUES (?, ?, ?, NOW())';
        db.query(sql, [userId, title, content], (err, result) => {
            if (err) reject(err);
            else resolve(result.insertId);  // 返回新插入的帖子ID
        });
    });
};

// 插入回复
const insertReply = async (postId, userId, content) => {
    return new Promise((resolve, reject) => {
        const sql = 'INSERT INTO replies (post_id, user_id, content, create_time) VALUES (?, ?, ?, NOW())';
        db.query(sql, [postId, userId, content], (err, result) => {
            if (err) reject(err);
            else resolve(result.insertId);  // 返回新插入的回复ID
        });
    });
};

// 获取所有帖子列表
const getAllPosts = async () => {
    return new Promise((resolve, reject) => {
        const sql = `
        SELECT 
            p.id as post_id, p.title, p.content, p.create_time, 
            u.account as author, 
            r.id as reply_id, r.content as reply_content, r.create_time as reply_time, ru.account as replier 
        FROM 
            posts p 
            JOIN users u ON p.user_id = u.id
            LEFT JOIN replies r ON p.id = r.post_id 
            LEFT JOIN users ru ON r.user_id = ru.id 
        ORDER BY 
            p.create_time DESC, r.create_time ASC`;
        db.query(sql, (err, results) => {
            if (err) {
                reject(err);
                console.error('Database query error:', err);
            } else {
                // 对结果进行组装，构建每个帖子及其回复的结构
                const posts = {};
                results.forEach(row => {
                    if (!posts[row.post_id]) {
                        posts[row.post_id] = {
                            id: row.post_id,
                            title: row.title,
                            content: row.content,
                            author: row.author,
                            create_time: row.create_time,
                            replies: []
                        };
                    }
                    if (row.reply_id) {
                        posts[row.post_id].replies.push({
                            id: row.reply_id,
                            content: row.reply_content,
                            replier: row.replier,
                            create_time: row.reply_time
                        });
                    }
                });
                // 由于对象（在ECMAScript 2015及以后版本中的普通对象）在迭代属性时保持插入顺序，
                // 这意味着最初插入到对象中的属性（帖子）将首先被迭代。因此，虽然数据库返回的结果是按照创建时间排序的，
                // 但在你的代码中通过 posts[row.post_id] 插入时，是按照它们首次出现的顺序（也就是它们在数据库中的原始id顺序）插入的。
                resolve(Object.values(posts).sort((a, b) => new Date(b.create_time) - new Date(a.create_time)));
            }
        });
    });
};


// 获取单个帖子的详细信息，包括回复
const getPostById = async (postId) => {
    console.log('Requested postId:', postId);

    return new Promise((resolve, reject) => {
        // const sql = 'SELECT p.id, p.title, p.content, u.account as author, p.create_time, r.content as reply_content, r.create_time as reply_time, ru.account as replier FROM posts p LEFT JOIN replies r ON p.id = r.post_id LEFT JOIN users ru ON r.user_id = ru.id WHERE p.id = ? ORDER BY r.create_time';
        // const sql = 'SELECT p.id, p.title, p.content, u.account as author, p.create_time, r.content as reply_content, r.create_time as reply_time, ru.account as replier FROM posts p JOIN users u ON p.user_id = u.idLEFT JOIN replies r ON p.id = r.post_id LEFT JOIN users ru ON r.user_id = ru.id WHERE p.id = ? ORDER BY r.create_time DESC;'
        const sql = `SELECT 
        p.id, 
        p.title, 
        p.content, 
        u.account as author, 
        p.create_time, 
        r.content as reply_content, 
        r.create_time as reply_time, 
        ru.account as replier 
      FROM 
        posts p 
        JOIN users u ON p.user_id = u.id
        LEFT JOIN replies r ON p.id = r.post_id 
        LEFT JOIN users ru ON r.user_id = ru.id 
      WHERE 
        p.id = ? 
      ORDER BY 
        r.create_time DESC;`
        db.query(sql, [postId], (err, results) => {
            if (err) {
                reject(err);
                console.error('Database query error:', err);
            }
            else resolve(results);
        });
    });
};


// ------------API------------------

// 创建新帖子
const createPost = async (req, res, next) => {
    const { user_id, title, content } = req.body;
    if (!title || !content) return res.cc('标题和内容不能为空');

    try {
        const postId = await insertPost(user_id, title, content);
        res.send({ status: 0, message: '帖子创建成功', postId });
    } catch (err) {
        next(err);
    }
};

// 创建回复
const createReply = async (req, res, next) => {
    const { post_id, user_id, content } = req.body;
    if (!content) return res.cc('回复内容不能为空');

    try {
        const replyId = await insertReply(post_id, user_id, content);
        res.send({ status: 0, message: '回复成功', replyId });
    } catch (err) {
        next(err);
    }
};

// 获取所有帖子
const listPosts = async (req, res, next) => {
    try {
        const posts = await getAllPosts();
        res.send({ status: 0, message: '获取帖子列表成功', posts });
    } catch (err) {
        console.log(err);
        next(err);
    }
};

// 获取单个帖子的详细信息
const getPostDetails = async (req, res, next) => {
    const { id } = req.params;
    console.log(id,'id');

    try {
        const postDetails = await getPostById(id);
        res.send({ status: 0, message: '获取帖子详细信息成功', postDetails });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createPost,
    createReply,
    listPosts,
    getPostDetails
}