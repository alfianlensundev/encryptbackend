const mongoose = require('mongoose')
const { typeHelper } = require('../helpers/ModelHelper')

const fileSchema = new mongoose.Schema({
    user_id: typeHelper(String, ''),
    subject: typeHelper(String, ''),
    file_name: typeHelper(String, ''),
    file_extension: typeHelper(String, ''),
    file_size: typeHelper(Number, 0),
    mime_type: typeHelper(String, ''),
    encrypt_status: typeHelper(Number, 0),
    secret_key: typeHelper(String, ''),
    public_key: typeHelper(String, ''),
    time_encryption: typeHelper(mongoose.Decimal128, 0),
    time_decryption: typeHelper(mongoose.Decimal128, 0),
    secret_key_path: typeHelper(String, ''),
    public_key_path: typeHelper(String, ''),
    date_created: typeHelper(Date, Date.now),
    flag_active: typeHelper(Number, 1)
}, {
    versionKey: false
})

exports.modelFile = mongoose.model('files', fileSchema, 'files')