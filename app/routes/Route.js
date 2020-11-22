const { default: fastify } = require("fastify");
const { login, signUp, getAllUser, validateUser } = require("../controllers/ControllerAuth");
const { getAllFile, uploadFile, encryptAndSaveFile, deleteFile, downloadFile, decryptFile, uploadFileDec, saveFileDecrypt } = require("../controllers/ControllerFile");

exports.routeAuth = async (fastify, option) => {
    fastify.post('/login', login)
    fastify.put('/users', signUp)
    fastify.get('/users', getAllUser)
    fastify.post('/users/validate', validateUser)
}

exports.routeFile = async (fastify, option) => {
    fastify.get('/', getAllFile)
    fastify.delete('/:fileId', deleteFile)
    fastify.get('/download/:fileId/:encrypt', downloadFile)
    fastify.put('/upload',  uploadFile)
    fastify.post('/upload',  encryptAndSaveFile)
    fastify.put('/decrypt',  uploadFileDec)
    fastify.post('/decrypt',  decryptFile)
    fastify.put('/decrypt/save',  saveFileDecrypt)
}