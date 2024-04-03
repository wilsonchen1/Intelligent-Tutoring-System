const joi = require('joi');

const account = joi.string().pattern(/^[A-Z][0-9]{9}$/).min(6).max(12).required();
// 字母数字和特殊字符任意两种
const password = joi.string().pattern(/^(?![a-zA-Z]+$)(?!\d+$)(?![^\da-zA-Z\s]+$).{1,20}$/).required();

const identity = joi.string().valid('student', 'admin').required();

registerLimit = {
    body: {
        account: account,
        password: password,
        identity: identity
    }
}
loginLimit = {
    body: {
        account: account,
        password: password,
    }
}

module.exports = { registerLimit, loginLimit}