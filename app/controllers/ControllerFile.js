const { sendError } = require("../helpers/GeneralHelper")
const path = require('path')
const appDir = path.dirname(require.main.filename);
const fs = require('fs')
const util = require('util')
const { pipeline } = require('stream')
// const pump = util.promisify(pipeline)
// const readFile = util.promisify(fs.readFile) 
// const createFile = util.promisify(fs.writeFile)
// const unlink = util.promisify(fs.unlink)
const NodeRSA = require('node-rsa');
const { modelFile } = require("../models/ModelFile");
const officegen = require('officegen')
const mammoth = require("mammoth");
const HTMLtoDOCX = require('html-to-docx')
const moment = require('moment')
const key = new NodeRSA({b: 512});

exports.getHistoryDashboard = async function(req, reply){
    try {
        const dec = await modelFile.find({flag_active: 1, encrypt_status: 0}, null, {date_created: -1}).limit(5)
        const enc = await modelFile.find({flag_active: 1, encrypt_status: 1}, null, {date_created: -1}).limit(5)

        

        return {
            status: 200,
            message: 'OK',
            data: {
                listDec: dec,
                listEnc: enc
            }
        }
    } catch(err){
        sendError(reply, err.message)
    }
}


exports.getDashboardExt = async function(req, reply){
    try {
        const listfile = await modelFile.find({flag_active: 1, user_id: req.params.userId})

        let ext = {}
        for (const file of listfile){
            console.log(file.file_extension)
            if (ext[file.file_extension] !== undefined){
                ext[file.file_extension] = ext[file.file_extension]+1
            } else {
                ext[file.file_extension] = 1
            }
        }

        
        return {
            status: 200,
            message: 'OK',
            data: Object.keys(ext).map(item => ({
                ext: item,
                total: ext[item],
                persent: (ext[item]/listfile.length)*100
            }))
        }
    } catch(err){
        sendError(reply, err.message)   
    }
} 

exports.getAllFile = async function (req, reply){
    try {
        const {query} = req
        let where = {
            flag_active: 1,
            user_id: req.query.userid,
            encrypt_status: query.encrypted
        }
        const listFile = await modelFile.find(where).lean()

        return {
            status: 200,
            message: "OK",
            data: listFile
        }
    } catch(err){
        sendError(reply, err.message)
    }
}

exports.getAllFolder = async function (req, reply){
    try {
        const listFile = await modelFile.find(where).lean()
        let folder = []
        for (const file of listFile){
            folder.push(file.date_created)
        }

        folder.unique()

        return {
            status: 200,
            message: "OK",
            data: folder
        }
    } catch(err){
        sendError(reply, err.message)
    }
}

exports.uploadFile = async function(req, reply){
    try {
        const timestamp = Math.floor(Date.now() / 1000)
        const userid = req.body.userId.value
        
        if (!fs.existsSync(path.join(appDir, 'files'))) await fs.mkdirSync(path.join(appDir, 'files'))
        if (!fs.existsSync(path.join(appDir, 'files',  userid))) await fs.mkdirSync(path.join(appDir, 'files',  userid))
        if (!fs.existsSync(path.join(appDir, 'files',  userid, 'decrypted'))) await fs.mkdirSync(path.join(appDir, 'files',  userid, 'decrypted'))
        const buffer = await req.body.file.toBuffer()
        
        await fs.writeFileSync(path.join(appDir, 'files', userid, 'decrypted',timestamp+'.'+req.body.file.filename.split('.').pop()), buffer.toString('base64'), 'base64')
        const stats = await fs.statSync(path.join(appDir, 'files', userid, 'decrypted',timestamp+'.'+req.body.file.filename.split('.').pop()))
        
        return {
            code: 200,
            message: 'OK',
            data: {
                extension:req.body.file.filename.split('.').pop(),
                fileName: timestamp+'.'+req.body.file.filename.split('.').pop(),
                mimeType: req.body.file.mimetype,
                fileSize: stats.size,
            }
        }
    } catch(err){
        console.log(err)
        sendError(reply, err.message)
    }
}

exports.uploadFileDec = async function(req, reply){
    try {
        const timestamp = Math.floor(Date.now() / 1000)
        const userid = req.body.userId.value
        
        if (!fs.existsSync(path.join(appDir, 'files'))) await fs.mkdirSync(path.join(appDir, 'files'))
        if (!fs.existsSync(path.join(appDir, 'files',  userid))) await fs.mkdirSync(path.join(appDir, 'files',  userid))
        if (!fs.existsSync(path.join(appDir, 'files',  userid, 'temp_encrypted'))) await fs.mkdirSync(path.join(appDir, 'files',  userid, 'temp_encrypted'))
        const buffer = await req.body.file.toBuffer()
        await fs.writeFileSync(path.join(appDir, 'files', userid, 'temp_encrypted',timestamp+'.'+req.body.file.filename.split('.').pop()), buffer.toString('base64'), 'base64')
        return {
            code: 200,
            message: 'OK',
            data: {
                extension:req.body.file.filename.split('.').pop(),
                mimeType: req.body.file.mimetype,
                fileName: timestamp+'.'+req.body.file.filename.split('.').pop(),
            }
        }
    } catch(err){
        console.log(err)
        sendError(reply, err.message)
    }
}

exports.decryptFile = async function(req, reply){
    try {
        const {userId,fileDetail} = req.body
        const private_key = await fs.readFileSync(path.join(appDir, 'files', userId , 'key', 'private.txt')).toString('utf-8')
        const private = new NodeRSA(private_key)

        const file = await mammoth.extractRawText({path: path.join(appDir, 'files',userId, 'temp_encrypted',fileDetail.fileName)})
        const begin = Date.now();
        const decrypted = private.decrypt(file.value.trim(), 'utf8')

        const data = decrypted.split('decID=>')
        const end = Date.now();

        const timeSpent =(end-begin)/1000;

        if (data.length == 0){
            return {
                code: 201,
                message: 'Invalid File',
                data: null
            }
        }
        const [ID = '', fileName = ''] = data[data.length-1].split('-')

        const {_id, date_created, flag_active,...rest} = await modelFile.findOne({user_id: ID, file_name: fileName}).lean()
        rest.encrypt_status = 0
        rest.time_decryption= timeSpent
    
        return {
            code: 200,
            message: 'OK',
            data: {
                ID,
                fileName,
                files: rest
            }
        }
    } catch(err){
        console.log(err)
        sendError(reply, err.message)
    }
}


exports.saveFileDecrypt = async function (req, reply){
    try {
        await modelFile.create(req.body.files)
        return {
            code: 200,
            message: 'OK',
            data: null
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
    

        let public_key = key.exportKey('public')    
        let private_key = key.exportKey('private')
        
        if (!fs.existsSync(path.join(appDir, 'files',  userId, 'key'))) await fs.mkdirSync(path.join(appDir, 'files',  userId, 'key'))
        if (!fs.existsSync(path.join(appDir, 'files',  userId, 'encrypted'))) await fs.mkdirSync(path.join(appDir, 'files',  userId, 'encrypted'))

        if (fs.existsSync(path.join(appDir, 'files',  userId, 'key', 'private.txt'))){
            public_key = await fs.readFileSync(path.join(appDir, 'files',  userId, 'key', 'public.txt')).toString('utf-8')
            private_key = await fs.readFileSync(path.join(appDir, 'files',  userId, 'key', 'private.txt')).toString('utf-8')
        } else {
            await fs.writeFileSync(path.join(appDir, 'files',  userId, 'key', 'public.txt'), public_key)
            await fs.writeFileSync(path.join(appDir, 'files',  userId, 'key', 'private.txt'),  private_key)
        }

        const public = new NodeRSA(public_key)

        const result = await mammoth.convertToHtml({path: path.join(appDir, 'files', userId, 'decrypted',fileDetail.fileName)})

        const encrypted = public.encrypt(`${result.value}decID=>${userId}-${fileDetail.fileName}`, 'base64', 'utf-8')
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
            data: null
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
        let folder = req.params.encrypt === '1' ? 'encrypted' : 'decrypted'
        reply.sendFile(path.join(file.user_id, folder,file.file_name))
    } catch(err){
        sendError(reply, err.message)
    }
}