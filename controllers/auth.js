const { response } = require('express');
const { dbconnect } = require('../db/connection');
const { generateCode, respJson, generateJTW } = require('../helpers/generate');
const bcrypt = require('bcryptjs');
const moment = require('moment');



const registerUsers = async (req, res = response) => {

    const code = await generateCode();
    const { referred_code, name, email, cell_phone, password } = req.body;
    let createDateTime = moment().format('YYYY-MM-DD HH:MM');
    // Encriptar password
    const salt = bcrypt.genSaltSync();
    const pass = bcrypt.hashSync(password, salt);

    try {
        const db = dbconnect();
        const { rows } = await db.query('select * from users where email=$1', [email]);
        if (rows.length == 0) {
            try {
                const values = [code, referred_code, name, email, email, cell_phone, pass, createDateTime, 'Inactivo', 1];
                const text = 'INSERT INTO users(referral_code,code_referred,name,email,user_login,cell_phone,password,create_datetime,state,company) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *';

                const resp = await db.query(text, values);

                //  Generar JWT
                let id = resp.rows[0].id;
                const token = await generateJTW(id, name);
                resp.rows[0]["token"] = token;

                // await db.query('update users set token=$1 where id=$2', [token, id])
                await db.query('insert into users_company(user_id,profile,company) values($1,$2,$3)', [id, 4, 1])
                await db.end();

                return respJson(res, 201, true, resp.rows[0]);

            } catch (error) {
                console.log(error.stack)
                return respJson(res, 500, false, error.stack);
            }

        } else {
            return respJson(res, 400, false, "Ya existe registrado un usuario con el mismo email!");
        }

    } catch (err) {
        console.log(err.stack)
        return respJson(res, 500, false, err.stack);
    }
}

const loginUsers = async (req, res = response) => {
    const { email, password } = req.body;
    try {
        const db = dbconnect();
        const { rows } = await db.query("select id,user_login,email,password,state,name from users where email=$1", [email])
        db.end();

        if (rows.length > 0) {
            if (rows[0].state == 'Inactivo') {
                return respJson(res, 400, false, "El usuario está inactivo, actualice su pago o comuníquese con el administrador!")
            }
            const validPass = bcrypt.compareSync(password, rows[0].password);
            if (!validPass) {
                return respJson(res, 400, false, "El usuario o contraseña son incorrectas, ¡verifique por favor!");
            }
            //  Generar JWT
            let id = rows[0].id;
            let name = rows[0].name;
            const token = await generateJTW(id, name);

            return respJson(res, 201, true,
                {
                    id: rows[0].id,
                    email: email,
                    name: rows[0].name,
                    token
                })
        } else {
            return respJson(res, 400, false, "El usuario no existe, ¡verifique por favor!");
        }

    } catch (err) {
        console.log(err)
        return respJson(res, 500, false, err.stack)
    }
}


const registerPay = async (req, res = response) => {

    const dateTime = moment().format('YYYY-MM-DD HH:MM:SS');
    const { email, code_pay } = req.body;
    try {
        const { rows } = await db.query('select u.id, p.code_pay from users u left join users_payments p on u.id=p.user_id where email=$1', [email]);
        let type = "Primera Vez";
        if (rows[0].code_pay !== null) {
            type = "Renovación";
        }
        const id = rows[0].id;

        if (rows.length == 0) {
            return respJson(res, 400, false, "El email no se encuentra registrado, por favor registrarse y volver a intentarlo");
        } else {
            const text = "INSERT INTO users_payments (user_id,code_pay,creation_datetime, type) VALUES ($1, $2, $3, $4)";
            db.query(text, [id, code_pay, dateTime, type], (err, resp) => {
                if (err) {
                    console.log(err.stack)
                    return respJson(res, 500, false, err.stack);
                } else {
                    return respJson(res, 201, true, "Pago registrado con éxito!");
                }
            });
        }
    } catch (err) {
        console.log(err.stack)
        return respJson(res, 500, false, err.stack)
    }

}

const validatePay = async (req, res = response) => {
    const { user, password } = req.body;
    try {

    } catch (error) {

    }

}

const renewToken = async (req, res = response) => {

    const { id, name } = req;

    //generate new JWT
    const token = await generateJTW(id, name);

    res.json({
        ok: true,
        id,
        name,
        token
    });
}

module.exports = {
    registerUsers,
    registerPay,
    validatePay,
    loginUsers,
    renewToken
}


