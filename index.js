const express = require('express');
require('dotenv').config();
const cors = require('cors');

const app = express();

//Cors
app.use(cors());

//Directorio publico
app.use(express.static('public'));

//Lectura parseo del body
app.use(express.json());

//Rutas
app.use('/api', require('./routes/auth'));
// app.use('/api', require('./routes/settings-admin'));


//Escuchar peticiones
app.listen(process.env.PORT, () => {
    console.log(`Servidor corriendo en el puerto ${process.env.PORT}`)
});