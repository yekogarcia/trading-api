const { response } = require('express');
const jwt = require('jsonwebtoken');

const validarJWT = (req, res = response, next) => {
    //x-tokens headers
    const token = req.header('x-token');
    if (!token) {
        return res.status(401).json({
            ok: false,
            msg: "No existe un token en la petición!"
        });
    }

    try {
        const { id, name } = jwt.verify(
            token,
            process.env.SECRET_JWT_SEED
        );

        req.id = id
        req.name = name

    } catch (error) {
        return res.status(401).json({
            ok: false,
            msg: 'Token no valido!'
        });
    }
    console.log(token);

    next();
}

module.exports = {
    validarJWT
}