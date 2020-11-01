const { routeAuth, routeFile } = require('./app/routes/Route')
const { connectDB } = require('./app/config/mongodb')

const fastify = require('fastify')({ logger: false })

fastify.register(require("fastify-multipart"));
fastify.register(require('fastify-cors'), { 
    origin: '*',
    methods: ["GET", "PUT", "POST", "DELETE"],
})

fastify.get('/', async (request, reply) => {
    return {
        message: 'Welcome To Encrypt API'
    }
})

fastify.register(routeAuth, {prefix: '/auth'})
fastify.register(routeFile, {prefix: '/files'})

const start = async () => {
    try {
        await fastify.listen(2000, '0.0.0.0')
        console.log(`server listening on http://${fastify.server.address().address}:${fastify.server.address().port}`)
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}
connectDB().then(status => {
    if (status === true){
        start() 
    } else{
        console.log('Cant Start Server')
        console.log(status)
    }
    
})
