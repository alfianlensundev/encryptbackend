const mongoose = require('mongoose')

exports.connectDB = async function(){
    try {
        const STRING_URL = 'mongodb://127.0.0.1:27017/db_encrypt'
        await mongoose.connect(STRING_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        console.log(`Mongodb connected to ${STRING_URL}`)
        return true
    } catch(err){
        return err.message
    }
}