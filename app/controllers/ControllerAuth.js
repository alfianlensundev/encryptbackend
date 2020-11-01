const bcrypt = require("bcrypt")
const { sendError } = require("../helpers/GeneralHelper")
const { modelAuth } = require("../models/ModelAuth")

exports.login = async function(req, reply){
    try {
        const timestamp = Math.floor(Date.now() / 1000)
        const {email = null, password = null} = req.body        
        const user = await modelAuth.findOne({email, flag_active: 1})
        if (user === null){
            return {
                code: 201,
                message: 'User tidak terdaftar',
                data: null
            }
        }

        if (user.account_status === 0){
            return {
                code: 202,
                message: 'User belum di validasi admin',
                data: null
            }
        }
        if (user.times_blocked > timestamp){
            return {
                code: 203,
                message: 'User anda di blokir setelah salah password 3 kali',
                data: {
                    sisa_waktu_blokir: user.times_blocked-timestamp
                }
            }
        }

        if (user.login_attempt > 3){
            return {
                code: 204,
                message: 'Anda telah salah password sebanyak 3 kali',
                data: {
                    sisa_waktu_blokir: user.times_blocked-timestamp
                }
            }
        }

        await modelAuth.updateOne({login_attempt: user.login_attempt+1})
        

        if (bcrypt.compareSync(password, user.password)){
            await modelAuth.updateOne({_id: user._id}, {last_login: new Date(), login_attempt: 0})
            return {
                code: 200,
                message: "Login Berhasil",
                data: {
                    fullname: user.full_name,
                    email: user.email,
                    user_type: user.user_type,
                    _id: user._id
                }
            }
        } else {
            if (user.login_attempt+1 >= 3){
                await modelAuth.updateOne({_id: user._id}, {
                    times_blocked: timestamp+900
                })
            }
            return {
                code: 205,
                message: 'Password Salah',
                data: null
            }
        }
    } catch(err){
        sendError(reply, err.message)       
    }
}

exports.signUp = async function(req, reply){
    try {
        const {email = null, fullname = '',password = null} = req.body

        if (password == null) throw new Error('Password tidak boleh kosong')
        const checkEmailExist = await modelAuth.findOne({email, flag_active: 1})
        if (checkEmailExist !== null) return {
            code: 201,
            message: 'Email sudah pernah terdaftar',
            data: {
                email: checkEmailExist.email,
                date_created: checkEmailExist.date_created
            }
        }

        await modelAuth.create({
            email,
            full_name: fullname,
            password: bcrypt.hashSync(password , 10)  
        })

        return {
            code: 200,
            message: "ok",
            data: {
                email,
                fullname
            }
        }
    } catch(err){
        sendError(reply, err.message)
    }
}

exports.getAllUser = async function (req, reply) {
    try {
        const listuser = await modelAuth.find({flag_active: 1}, null , {date_created: -1}).lean()

        return {
            code: 200,
            message: 'OK',
            data: listuser.map(({password, ...u}) => u)
        }
    } catch(err){
        sendError(reply, err.message)   
    }
}

exports.validateUser = async function (req, reply) {
    try {
        await modelAuth.updateOne({_id: req.body.IDUser}, {account_status: req.body.account_status, flag_active: req.body.account_status === 1 ? 1 : 0})

        return {
            code: 200,
            message: 'OK',
            data: null
        }
    } catch(err){
        sendError(reply, err.message)   
    }
}