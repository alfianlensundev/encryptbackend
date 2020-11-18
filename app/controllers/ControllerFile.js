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
const officegen = require('officegen')
const mammoth = require("mammoth");

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
        const userid = '5fb3e51d1a77b57245f3949e'
        // const userid = data.fields.userId.value
        if (!fs.existsSync(path.join(appDir, 'files'))) await fs.mkdirSync(path.join(appDir, 'files'))
        if (!fs.existsSync(path.join(appDir, 'files',  userid))) await fs.mkdirSync(path.join(appDir, 'files',  userid))
        if (!fs.existsSync(path.join(appDir, 'files',  userid, 'decrypted'))) await fs.mkdirSync(path.join(appDir, 'files',  userid, 'decrypted'))
        
        const fileSize = data.file._readableState['length']
        await pump(data.file, fs.createWriteStream(path.join(appDir, 'files', userid, 'decrypted',timestamp+'.'+data.filename.split('.').pop())))
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
        console.log(err)
        sendError(reply, err.message)
    }
}

exports.encryptAndSaveFile = async function(req, reply){
    try {
        const {userId, subject,fileDetail} = req.body
        const begin = Date.now();
        const key = new NodeRSA({b: 512});
        if (!fs.existsSync(path.join(appDir, 'files',  userId, 'encrypted'))) await fs.mkdirSync(path.join(appDir, 'files',  userId, 'encrypted'))
        // const file = await readFile(path.join(appDir, 'files', userId, 'decrypted',fileDetail.fileName))
        // const base64file = file.toString('base64')
        const result = await mammoth.convertToHtml({path: path.join(appDir, 'files', userId, 'decrypted',fileDetail.fileName)})
        const encrypted = key.encrypt(result.value, 'base64')
        const end = Date.now();
        const timeSpent =(end-begin)/1000;
        let docx = officegen('docx')
        let paragraph = docx.createP()
        paragraph.addText(encrypted)
        let out = fs.createWriteStream(path.join(appDir, 'files',userId, 'encrypted',fileDetail.fileName))
        docx.generate(out)

        await modelFile.create({
            user_id: userId,
            subject: subject.trim().length > 0 ? subject : fileDetail.fileName,
            file_name: fileDetail.fileName,
            file_extension: fileDetail.extension,
            mime_type: fileDetail.mimeType,
            file_size: fileDetail.fileSize,
            encrypt_status: 1,
            time_encryption: timeSpent,
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
        let filename = req.params.encrypt === '1' ? file.file_name : file.file_name
        reply.sendFile(path.join(file.user_id, 'encrypted',filename))
    } catch(err){
        sendError(reply, err.message)
    }
}