const express = require("express");
const { Pool } = require('pg');

const dbconnect = () => {
    const pool = new Pool({
        user: 'yekog',
        host: 'localhost',
        password: 'yekog',
        database: 'trading',
        port: '5432'
    });
    return pool;
}


module.exports = {
    dbconnect
}