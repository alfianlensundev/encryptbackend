const { sendError } = require("../helpers/GeneralHelper")
const path = require('path')
const appDir = path.dirname(require.main.filename);
const fs = require('fs')
const util = require('util')
const { pipeline } = require('stream')
const pump = util.promisify(pipeline)
const readFile = util.promisify(fs.readFile) 
const createFile = util.promisify(fs.writeFile)
const unlink = util.promisify(fs.unlink)
const NodeRSA = require('node-rsa');
const { modelFile } = require("../models/ModelFile");
const { typeHelper } = require("../helpers/ModelHelper");

exports.getAllFile = async function (req, reply){
    try {
        const {query} = req
        
        const listFile = await modelFile.find({flag_active: 1}).lean()

        return {
            status: 200,
            message: "OK",
            data: listFile
        }
    } catch(err){
        sendError(reply, err.message)
    }
}

exports.uploadFile = async function(req, reply){
    try {
        const timestamp = Math.floor(Date.now() / 1000)
        const data = await req.file()
        const userid = data.fields.userId.value
        if (!fs.existsSync(path.join(appDir, 'files'))) await fs.mkdirSync(path.join(appDir, 'files'))
        if (!fs.existsSync(path.join(appDir, 'files',  userid))) await fs.mkdirSync(path.join(appDir, 'files',  userid))
        
        const fileSize = data.file._readableState['length']
        await pump(data.file, fs.createWriteStream(path.join(appDir, 'files', userid ,timestamp+'.'+data.filename.split('.').pop())))
        return {
            code: 200,
            message: 'OK',
            data: {
                extension: data.filename.split('.').pop(),
                fileName: timestamp+'.'+data.filename.split('.').pop(),
                mimeType: data.mimetype,
                fileSize
            }
        }
    } catch(err){
        sendError(reply, err.message)
    }
}

exports.encryptAndSaveFile = async function(req, reply){
    try {
        const {userId, subject,fileDetail} = req.body
        const key = new NodeRSA({b: 512});
        console.log(req.body)
        const file = await readFile(path.join(appDir, 'files', userId, fileDetail.fileName))
        const base64file = file.toString('base64')
        
        const encrypted = key.encrypt(base64file, 'base64')
        await unlink(path.join(appDir, 'files', userId, fileDetail.fileName))
        await createFile(path.join(appDir, 'files', userId, fileDetail.fileName+'.txt'), encrypted)

        await modelFile.create({
            user_id: userId,
            subject,
            file_name: fileDetail.fileName,
            file_extension: fileDetail.extension,
            mime_type: fileDetail.mimeType,
            file_size: fileDetail.fileSize,
            encrypt_status: 1,
            secret_key: '',
            public_key: '',
            secret_key_path: '',
            public_key_path: ''
        })

        return {
            code: 200,
            message: 'OK',
            data: {
                test: ''
            }
        }
    } catch(err){
        console.log(err)
        sendError(reply, err.message)
    }
}



exports.deleteFile = async function(req, reply){
    try {
        const result = await modelFile.updateOne({_id: req.params.fileId}, {flag_active: 0})
        return {
            code: 200,
            message: 'OK',
            data: result
        }
    } catch(err){
        sendError(reply, err.message)
    }
}

exports.downloadFile = async function(req, reply){
    try {
        const file = await modelFile.findOne({_id: req.params.fileId})
        let filename = req.params.encrypt === '1' ? file.file_name+'.txt' : file.file_name
        reply.sendFile(path.join(file.user_id, filename))
    } catch(err){
        sendError(reply, err.message)
    }
}