const mongoose = require('mongoose')
const { typeHelper } = require('../helpers/ModelHelper')

const authSchema = new mongoose.Schema({
    file_name: typeHelper(String, ''),
    file_extension: typeHelper(String, ''),
    file_size: typeHelper(Number, 0),
    encrypt_status: typeHelper(Number, 0),
    secret_key: typeHelper(String, ''),
    public_key: typeHelper(String, ''),
    secret_key_path: typeHelper(String, ''),
    public_key_path: typeHelper(String, ''),
    date_created: typeHelper(Date, Date.now),
    flag_active: typeHelper(Number, 1)
}, {
    versionKey: false
})

exports.modelAuth = mongoose.model('files', authSchema, 'files')