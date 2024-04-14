const { 
    createPost,
    createReply,
    listPosts,
    getPostDetails
} = require('../router_handle/postsHandler');
const express = require('express');
const router = express.Router();

router.get('/listPosts', listPosts);
router.get('/getPostDetails/:id', getPostDetails);
router.post('/createPost', createPost);
router.post('/createReply', createReply);

module.exports = router;