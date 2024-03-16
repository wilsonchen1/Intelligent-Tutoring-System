// errorHandler.js

const handleDatabaseError = (err, req, res, next) => {
    if (err) {
        console.error('数据库查询出错:', err);
        return res.status(500).send({
            message: '数据库查询出错'
        });
    }
    next();
};

module.exports = { handleDatabaseError };
