const { sendError } = require("../helpers/GeneralHelper")
const path = require('path')
const appDir = path.dirname(require.main.filename);
const fs = require('fs')

exports.getAllFile = async function (req, reply){
    try {

    } catch(err){
        sendError(reply, err.message)
    }
}

exports.uploadFile = async function(req, reply){
    try {
        if (!fs.existsSync(path.join(appDir, 'files', 'original_files'))) await fs.mkdirSync(path.join(appDir, 'files', 'original_files'))
        if (!req.isMultipart()) {
            reply.code(400).send(new Error('Request is not multipart'))
            return
        }
        
    } catch(err){
        sendError(reply, err.message)
    }
}

exports.encryptAndSaveFile = async function(req, reply){
    try {

    } catch(err){
        sendError(reply, err.message)
    }
}
