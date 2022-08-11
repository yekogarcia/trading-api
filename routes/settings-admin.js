const { Router } = require('express');
const { check } = require('express-validator');
const router = Router();


const { getDynamicTables } = require('../controllers/admin');
const { validateFields } = require('../middlewares/validate-fields');

router.get('/ad/tb-dynamic',  getDynamicTables);

// router.post('/tb-dynamic',
//     [// middlewares
//         check('referred_code', 'El codigo de referido es obligatorio').not().isEmpty(),
//         check('name', 'El name es obligatorio').not().isEmpty(),
//         check('email', 'El email es obligatorio').isEmail(),
//         check('cell_phone', 'El numero de telefono no es valido').isNumeric(),
//         check('id_plan', 'Tiene que seleccionar un plan').isNumeric(),
//         check('password', 'El password debe ser de 6 characters').isLength({ min: 6 }),
//         validateFields
//     ],
//     registerUsers);