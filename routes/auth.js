/*
   Rutas de usuarios /Auth
   host + /api/auth
*/

const { Router } = require('express');
const { check } = require('express-validator');
const router = Router();

const { registerUsers, registerPay, loginUsers, renewToken } = require('../controllers/auth');
const { validarJWT } = require('../middlewares/validar-jwt');
const { validateFields } = require('../middlewares/validate-fields');


router.post('/register',
    [// middlewares
        check('referred_code', 'El codigo de referido es obligatorio').not().isEmpty(),
        check('name', 'El name es obligatorio').not().isEmpty(),
        check('email', 'El email es obligatorio').isEmail(),
        check('cell_phone', 'El numero de telefono no es valido').isNumeric(),
        check('password', 'El password debe ser de 6 characters').isLength({ min: 6 }),
        validateFields
    ],
    registerUsers);

router.post('/register-pay',
    [// middlewares
        check('email', 'El email es obligatorio').isEmail(),
        check('code_pay', 'El codigo de pago es obligatorio').not().isEmpty(),
        validateFields
    ],
    registerPay);

router.post('/login',
    [// middlewares
        check('email', 'El usuario es obligatorio').isEmail(),
        check('password', 'El password debe ser de 6 characters').isLength({ min: 6 }),
        validateFields
    ],
    loginUsers);

    router.get('/renew', validarJWT, renewToken);

module.exports = router;