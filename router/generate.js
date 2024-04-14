const express = require('express');
const router = express.Router();

const { getChapters, generatePaper, getTaskStatus } = require('../router_handle/generate');
router.get('/getChapters', getChapters);
router.post('/generatePaper', generatePaper);
router.post('/getTaskStatus', getTaskStatus);

module.exports = router;