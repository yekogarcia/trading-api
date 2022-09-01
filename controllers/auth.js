const { response } = require('express');
const { dbconnect } = require('../db/connection');
const { generateCode, respJson, generateJTW } = require('../helpers/generate');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const { json } = require('express/lib/response');



const registerUsers = async (req, res = response) => {

    const code = await generateCode();
    const { referred_code, name, email, cell_phone, password, id_plan } = req.body;
    let createDateTime = moment().format('YYYY-MM-DD HH:MM');
    // Encriptar password
    const salt = bcrypt.genSaltSync();
    const pass = bcrypt.hashSync(password, salt);

    try {
        const db = dbconnect();
        const { rows } = await db.query('select * from users u inner join users_company c on (u.id=c.user_id) where u.email=$1 and c.profile=$2', [email, 4]);
        if (rows.length == 0) {
            try {
                const values = [code, referred_code.toUpperCase(), name, email.toLowerCase(), email.toLowerCase(), cell_phone, pass, createDateTime, 'INACTIVO', 1, id_plan];
                const text = 'INSERT INTO users(referral_code,code_referred,name,email,user_login,cell_phone,password,create_datetime,state,company,id_plans) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *';

                const resp = await db.query(text, values);

                //  Generar JWT
                let id = resp.rows[0].id;
                const token = await generateJTW(id, name);
                resp.rows[0]["token"] = token;

                // await db.query('update users set token=$1 where id=$2', [token, id])
                await db.query('insert into users_company(user_id,profile,company) values($1,$2,$3)', [id, 4, 1])
                await db.end();

                // console.log(resp.rows[0]);
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
    const { profile, email, password } = req.body;
    try {
        const db = dbconnect();
        const sql = "select u.id,user_login,email,password,state,name,profile from users u inner join users_company c on c.user_id=u.id where u.email=$1 and c.profile=$2";
        const { rows } = await db.query(sql, [email.toLowerCase(), profile])
        db.end();

        if (rows.length > 0) {
            if (rows[0].state == 'INACTIVO') {
                return respJson(res, 400, false, "El usuario está inactivo, actualice su pago o comuníquese con el administrador!")
            }
            const validPass = bcrypt.compareSync(password, rows[0].password);
            if (!validPass) {
                return respJson(res, 400, false, "El usuario u contraseña son incorrectas, ¡verifique por favor!");
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

    const dateTime = moment().format('YYYY-MM-DD HH:MM');
    const { email, code_pay, method_pay } = req.body;
    try {
        const db = dbconnect();
        const { rows } = await db.query('select u.id, p.code_pay from users u left join users_payments p on u.id=p.id_user where u.email=$1', [email.toLowerCase()]);
        let type = "Primera Vez";
        if (rows[0].code_pay !== null) {
            type = "Renovación";
        }
        const id = rows[0].id;

        if (rows.length == 0) {
            return respJson(res, 400, false, "El email no se encuentra registrado, por favor registrarse y volver a intentarlo");
        } else {
            const text = "INSERT INTO users_payments (id_user,code_pay,creation_datetime, type, email, method_pay,state) VALUES ($1, $2, $3, $4, $5, $6, $7)";
            db.query(text, [id, code_pay, dateTime, type, email.toLowerCase(),method_pay, 'PENDIENTE'], (err, resp) => {
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

const getPlans = async (req, res = response) => {

    try {
        const db = dbconnect();
        const { rows } = await db.query('select p.*,c.abbreviation from plans p inner join type_coins c on (p.moneda=c.id) where p.state=$1 order by id ', ["ACTIVO"]);
        return res.status(200).json({
            ok: true,
            data: rows
        });
    } catch (err) {
        console.log(err.stack)
        return respJson(res, 500, false, err.stack)
    }

}

const getMethodsPay = async (req, res = response) => {

    try {
        const db = dbconnect();
        const { rows } = await db.query('select * from payments_methods');
        return res.status(200).json({
            ok: true,
            data: rows
        });
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
    renewToken,
    getPlans,
    getMethodsPay
}


