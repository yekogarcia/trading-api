const { response } = require('express');
const { dbconnect } = require('../db/connection');
const { respJson } = require('../helpers/generate');
const moment = require('moment');
const bcrypt = require('bcryptjs');



const getDynamicTables = async (req, res = response) => {

    try {
        const db = dbconnect();
        let where = "";
        let params = [];
        if (req.params.type == "services") {
            where = 'where state=$1';
            params = ['ACTIVO'];
        }
        const { rows } = await db.query('select *,id as key from yk_tables_dinamyc ' + where, params);
        await db.end();
        return res.status(200).json({
            ok: true,
            data: rows
        });
    } catch (err) {
        console.log(err.stack)
        return respJson(res, 500, false, err.stack)
    }

}

const getParamsTable = async (req, res = response) => {
    try {
        const db = dbconnect();
        const { rows } = await db.query("select cols.table_name,cols.column_name,data_type,pg_catalog.col_description(c2.oid,cols.ordinal_position::int) from information_schema.columns cols inner join pg_catalog.pg_class c on  c.relname=cols.table_name inner join pg_catalog.pg_class c2 on c2.relname=cols.table_name where cols.table_name=$1", [req.params.table]);
        if (rows.length > 0) {
            db.query("select *,id as key from " + rows[0].table_name).then(r => {
                db.end();
                return res.status(200).json({
                    ok: true,
                    data: r.rows,
                    params: rows
                });
            });
        }
    } catch (err) {
        console.log(err.stack)
        return respJson(res, 500, false, err.stack)
    }

}

const getAllTables = async (req, res = response) => {
    try {
        const db = dbconnect();
        const { rows } = await db.query("SELECT tablename FROM pg_catalog.pg_tables where schemaname='public'");
        await db.end();
        return res.status(200).json({
            ok: true,
            data: rows
        });
    } catch (err) {
        console.log(err.stack)
        return respJson(res, 500, false, err.stack)
    }

}

const setDynamicTables = async (req, res = response) => {
    const dateTime = moment().format('YYYY-MM-DD HH:MM');
    const { table_name, name, id, columns } = req.body;
    try {
        const db = dbconnect();
        if (id) {
            const { rows } = await db.query('update yk_tables_dinamyc set name=$1,date_time=$2 where id=$3  RETURNING *', [name, dateTime, id]);
            await db.end();
            setComentColumns(columns, table_name);
            return res.status(200).json({
                ok: true,
                data: rows
            });

        } else {
            const { rows } = await db.query('insert into yk_tables_dinamyc (table_name, name,date_time) VALUES ($1, $2, $3) RETURNING *', [table_name, name, dateTime]);
            await db.end();
            console.log(rows);
            return res.status(200).json({
                ok: true,
                data: rows
            });
        }
    } catch (err) {
        console.log(err.stack)
        return respJson(res, 500, false, err.stack)
    }
}

const setComentColumns = (cols, table, res = response) => {
    try {
        const db = dbconnect();
        console.log(table);
        cols.forEach(col => {
            const comment = `{"visible": "${col.visible}", "required": "${col.required}","type_input": "${col.type_input}","tabla": "${col.tabla}","label": "${col.label}"}`;
            db.query(`COMMENT ON COLUMN ${table}.${col.column} IS '${comment}'`);
            console.log(comment);
        });
        db.end();
    } catch (error) {
        console.log(error.stack);
    }
}

const deleteRowTables = async (req, res = response) => {
    const { id, table } = req.body;
    try {
        console.log(table);
        const db = dbconnect();
        await db.query(`DELETE FROM ${table} WHERE id=$1`, [id]);
        await db.end();
        return res.status(200).json({
            ok: true,
        });
    } catch (error) {
        console.log(error.stack);
    }
}

const updateStateRow = async (req, res = response) => {
    const { id, table, state } = req.body;
    try {
        const createDateTime = moment().format('YYYY-MM-DD HH:MM');
        const db = dbconnect();
        await db.query(`UPDATE ${table} SET state='${state}', activate_datetime='${createDateTime}' WHERE id=$1`, [id]);
        await db.end();
        return res.status(200).json({
            ok: true,
        });
    } catch (error) {
        console.log(error.stack);
    }
}

const getSelectDinamic = async (req, res = response) => {
    const table = req.params.table;
    try {
        console.log(table);
        const db = dbconnect();
        const { rows } = await db.query(`SELECT * FROM ${table} `);
        await db.end();
        return res.status(200).json({
            ok: true,
            data: rows
        });
    } catch (error) {
        console.log(error.stack);
    }
}


const addRowDynamic = async (req, res = response) => {
    const { table } = req.body;
    try {
        // console.log(req.body);
        const db = dbconnect();
        const id = req.body.id;
        delete req.body.table;
        delete req.body.id;
        let keys = Object.keys(req.body);
        let values = Object.values(req.body);
        if (!id) {
            keys = keys.toString();
            let vals = "";
            let cont = 1;
            for (let i = 0; i < values.length; i++) {
                if (i == 0) {
                    vals += "$" + cont;
                } else {
                    vals += ",$" + cont;
                }
                cont++;
            }
            const { rows } = await db.query(`INSERT INTO  ${table} (${keys}) VALUES (${vals}) RETURNING *`, values);
            await db.end();
            return res.status(200).json({
                ok: true,
                data: rows
            });
        } else {
            let set = "";
            let cont = 1;
            for (let i = 0; i < keys.length; i++) {
                if (i == 0) {
                    set += keys[i] + "=$" + cont;
                } else {
                    set += "," + keys[i] + "=$" + cont;
                }
                cont++;
            }
            const { rows } = await db.query(`UPDATE  ${table} SET ${set} WHERE id=${id}  RETURNING *`, values);
            await db.end();
            return res.status(200).json({
                ok: true,
                data: rows
            });
        }
    } catch (error) {
        console.log(error.stack);
    }
}

const getEstudents = async (req, res = response) => {
    try {
        const db = dbconnect();
        const { rows } = await db.query(`SELECT u.*, u.id as key,p.title as plan FROM users u left join plans p ON p.id = u.id_plans left join users_company c  on c.user_id=u.id where c.profile=4`);
        await db.end();
        return res.status(200).json({
            ok: true,
            data: rows
        });
    } catch (error) {
        console.log(error.stack);
    }
}
// const getAcademiesUser = async (dat) => {
//     const db = dbconnect();
//     try {
//         for (let i = 0; i < dat.length; i++) {
//             const academy = dat[i].academy;
//             const ids = academy.join(',');
//             console.log(ids);
//             if (ids) {
//                 const { rows } = await db.query(`SELECT id as key,name FROM academies where id in ( ${ids} ) `);
//                 // console.log(rows);
//                 rows.forEach((r) => {
//                     console.log(r);
//                     dat[i].academy.push(r);
//                 })
//                 dat[i].academy = rows;
//             }
//         }
//         await db.end();
//         return dat;

//     } catch (error) {
//         console.log(error);
//     }
// }

const getUsers = async (req, res = response) => {
    try {
        const db = dbconnect();
        const { rows } = await db.query(`SELECT u.*,p.name as profile_text,c.profile, u.id as key FROM users u left join users_company c on u.id=c.user_id
        left join profiles p ON p.id = c.profile where c.profile <>4`);
        await db.end();
        return res.status(200).json({
            ok: true,
            data: rows
        });
    } catch (error) {
        console.log(error.stack);
    }
}

const getPaymentsUsers = async (req, res = response) => {
    try {
        const db = dbconnect();
        const { rows } = await db.query('select p.*,p.id as key, m.name as method,u.name,u.id_plans,d.title,d.price from users_payments p left join payments_methods m on p.method_pay=m.id left join users u on u.id=p.id_user left join plans d on u.id_plans=d.id ');
        return res.status(200).json({
            ok: true,
            data: rows
        });
    } catch (err) {
        console.log(err.stack)
        return respJson(res, 500, false, err.stack)
    }
}
const getProfiles = async (req, res = response) => {
    try {
        const db = dbconnect();
        const { rows } = await db.query('select *, id as key from profiles where id<>4');
        return res.status(200).json({
            ok: true,
            data: rows
        });
    } catch (err) {
        console.log(err.stack)
        return respJson(res, 500, false, err.stack)
    }
}

const getAcadamiesProfile = async (req, res = response) => {
    try {
        const db = dbconnect();
        const { rows } = await db.query('select *, id as key from academies ');
        return res.status(200).json({
            ok: true,
            data: rows
        });
    } catch (err) {
        console.log(err.stack)
        return respJson(res, 500, false, err.stack)
    }
}

const registerUsersAdmin = async (req, res = response) => {

    const { id, name, email, cell_phone, password, profile, academy,photo_profile } = req.body;
    console.log(req.body);
    let createDateTime = moment().format('YYYY-MM-DD HH:MM');
    // Encriptar password
    const salt = bcrypt.genSaltSync();
    const pass = bcrypt.hashSync(password, salt);

    try {
        const db = dbconnect();
        if (id == '') {
            if (rows.length == 0) {
                try {
                    const { rows } = await db.query('select u.* from users u inner join users_company c on (u.id=c.user_id) where u.email=$1 and c.profile=$2', [email, profile]);

                    const values = [name, email.toLowerCase(), email.toLowerCase(), cell_phone, pass, createDateTime, 'INACTIVO', 1, academy,photo_profile];

                    const text = 'INSERT INTO users(name,email,user_login,cell_phone,password,create_datetime,state,company,academy,photo_profile) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9,$10) RETURNING *';

                    const resp = await db.query(text, values);

                    //  Generar Id
                    let id = resp.rows[0].id;
                    // await db.query('update users set token=$1 where id=$2', [token, id])
                    await db.query('insert into users_company(user_id,profile,company) values($1,$2,$3)', [id, profile, 1])
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
        } else {
            try {
                const values = [name, email.toLowerCase(), email.toLowerCase(), cell_phone, academy,photo_profile, id];
                let text = 'UPDATE users SET name=$1,email=$2,user_login=$3,cell_phone=$4,academy=$5,photo_profile=$6';

                if (password != "password") {
                    values.push(pass);
                    text += ',password=$8';
                }
                text += ' WHERE id=$7 RETURNING *'

                const { rows } = await db.query(text, values);

                await db.query('UPDATE users_company SET profile=$1 WHERE id=$2', [profile, id])
                await db.end();
                console.log(values);

                return respJson(res, 201, true, rows[0]);


            } catch (error) {
                console.log(error.stack);
                return respJson(res, 500, false, error.stack);
            }

        }


    } catch (err) {
        console.log(err.stack)
        return respJson(res, 500, false, err.stack);
    }
}


module.exports = {
    getDynamicTables,
    setDynamicTables,
    getParamsTable,
    getAllTables,
    deleteRowTables,
    updateStateRow,
    getSelectDinamic,
    addRowDynamic,
    getEstudents,
    getUsers,
    getPaymentsUsers,
    registerUsersAdmin,
    getProfiles,
    getAcadamiesProfile
}