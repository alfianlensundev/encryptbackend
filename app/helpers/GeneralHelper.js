const { default: fastify } = require("fastify")

exports.sendError = (reply,message) => reply.code(500).send({error: true, message})