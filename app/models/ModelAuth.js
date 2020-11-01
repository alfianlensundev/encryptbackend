const mongoose = require('mongoose')
const { typeHelper } = require('../helpers/ModelHelper')

const authSchema = new mongoose.Schema({
    password: typeHelper(String, null),
    full_name: typeHelper(String, ''),
    email: typeHelper(String, null),
    user_type: typeHelper(Number, 1),
    login_attempt: typeHelper(Number, 0),
    times_blocked: typeHelper(Number, 0),
    last_login: typeHelper(Date, Date.now),
    date_created: typeHelper(Date, Date.now),
    account_status: typeHelper(Number, 0),
    flag_active: typeHelper(Number, 1)  
}, {
    versionKey: false
})

exports.modelAuth = mongoose.model('auth_users', authSchema, 'auth_users')