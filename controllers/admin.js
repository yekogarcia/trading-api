const { response } = require('express');
const { dbconnect } = require('../db/connection');
const { respJson } = require('../helpers/generate');
const moment = require('moment');



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
        console.log(table);
        const db = dbconnect();
        await db.query(`UPDATE ${table} SET state='${state}'WHERE id=$1`, [id]);
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
        const { rows } = await db.query(`SELECT u.*, u.id as key,p.title as plan FROM users u left join plans p ON p.id = u.id_plans `);
        await db.end();
        return res.status(200).json({
            ok: true,
            data: rows
        });
    } catch (error) {
        console.log(error.stack);
    }
}

const getUsers = async (req, res = response) => {
    try {
        const db = dbconnect();
        const { rows } = await db.query(`SELECT u.*,p.name as profile, u.id as key FROM users u left join users_company c on u.id=c.user_id
        left join profiles p ON p.id = c.profile`);
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
    getPaymentsUsers
}