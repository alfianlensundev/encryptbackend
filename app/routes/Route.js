const { default: fastify } = require("fastify");
const { login, signUp, getAllUser, validateUser } = require("../controllers/ControllerAuth");
const { getAllFile, uploadFile, encryptAndSaveFile } = require("../controllers/ControllerFile");

exports.routeAuth = async (fastify, option) => {
    fastify.post('/login', login)
    fastify.put('/users', signUp)
    fastify.get('/users', getAllUser)
    fastify.post('/users/validate', validateUser)
}

exports.routeFile = async (fastify, option) => {
    fastify.get('/', getAllFile)
    fastify.put('/upload',  uploadFile)
    fastify.post('/upload',  encryptAndSaveFile)
}