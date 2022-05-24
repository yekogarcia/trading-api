const { response } = require('express');
const { dbconnect } = require('../db/connection');
const jwt = require('jsonwebtoken');

const db = dbconnect();

const generateJTW = (id, name) => {

    return new Promise((resolve, reject) => {
        const payload = { id, name };

        jwt.sign(payload, process.env.SECRET_JWT_SEED, {
            expiresIn: '2h'
        }, (err, token) => {
            if (err) {
                console.log(err);
                reject('Error al generar el token!');
            }
            resolve(token);
        });
    });
}

const generateCode = async () => {
    const alpha = '0123456789ABCDEFGHJYQLOPWMNSXKZ';
    let code = "";
    for (let i = 0; i < 11; i++) {
        const random = alpha.charAt(Math.floor(Math.random() * 30));
        code += random.toString();
    }
    const { rows } = await db.query('select name,code_referred from users where code_referred=$1', [code]);
    if (rows.length == 0) {
        return code;
    }
    generateCode();

}

const respJson = (res, status, k, m) => {
    return res.status(status).json({
        ok: k,
        msg: m
    });
}

module.exports = {
    generateCode,
    respJson,
    generateJTW
}
