const db = require("../model")
const pengguna = db.pengguna
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const config = require("../config/auth")
const AktivitasPengguna = db.aktivitas_pengguna

exports.signup = async(req, res) => {
    const today = new Date()
    const tanggal = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}`
    const total = await Pengguna.count()
    const incId = (total + 1).toString().padStart(2, '0')
    
    try {
        let Pengguna = await Pengguna.create({
            idpengguna: req.body.idpengguna + tanggal + 'B' + incId,
            username: req.body.username,
            password: bcrypt.hashSync(req.body.password, 8),
            namapengguna: req.body.namapengguna,
            idrole: req.body.idrole,
            status: 'Aktif',
            foto: req.body.foto
        })

        const result = await pengguna.save()
        console.log(pengguna)
        if(result){
            res.status(200).send({
                message: "Pengguna telah ditambahkan"
            })
        }
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
}

exports.login = async(req, res) => {
    try {
        const pengguna = await Pengguna.findOne({
            where: {
                username: req.body.username
            }
        })

        if(!pengguna){
            return res.status(404).send({ message: "Pengguna tidak ditemukan" })
        }

        let passwordisValid = bcrypt.compareSync(
            req.body.password,
            pengguna.password
        )

        if(!passwordisValid){
            return res.status(401).send({
                message: "Password salah"
            })
        }

        const token = jwt.sign({ idpengguna: pengguna.idpengguna, idrole: pengguna.idrole }, config.secret, {
            algorithm: "HS256",
            allowInsecureKeySizes: true,
            expiresIn: 86400
        })

        req.session.token = token
        req.session.idpengguna = pengguna.idpengguna

        const today = new Date()
        const tanggal = today.toISOString().slice(0, 10)
        const waktu = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()

        await AktivitasPengguna.create({
            idpengguna: pengguna.idpengguna,
            aktivitas: 'Login',
            tanggal: tanggal,
            waktu: waktu
        })

        res.status(200).send({
            idpengguna: pengguna.idpengguna,
            username: pengguna.username,
            accessToken: token
        })

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
}

exports.inShift = async(req, res) => {
    try {
        const today = new Date()
        const tanggal = today.toISOString().slice(0, 10)
        const waktu = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()
        const jam = today.getHours()

        if(jam >= 11 && jam < 18) {
            const shift = 1
            req.session.shift = shift
        }
        else if(jam >= 18 && jam <= 23){
            const shift = 2
            req.session.shift = shift
        }

        console.log(req.session)

        await AktivitasPengguna.create({
            idpengguna: req.session.idpengguna,
            aktivitas: 'Akses Shift',
            tanggal: tanggal,
            waktu: waktu
        })

        res.status(200).send({ message: "Masuk Shift" })

    } catch (error) {
        res.status(500).send({ message: error.message })
    }
}

exports.logout = async(req, res) => {
    if(req.session){
        const today = new Date()
        const tanggal = today.toISOString().slice(0, 10)
        const waktu = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()

        AktivitasPengguna.create({
            idpengguna: req.session.idpengguna,
            aktivitas: 'Logout',
            tanggal: tanggal,
            waktu: waktu
        })

        req.session = null
        req.status(200).send({ message: 'Berhasil logout' })
    }
    else{
        res.status(500).send({ message: 'Gagal logout'})
    }
}