/*
   Rutas de usuarios /Auth
   host + /api/auth
*/

const { Router } = require('express');
const { check } = require('express-validator');
const router = Router();

const { registerUsers, registerPay, loginUsers, renewToken, getPlans, getMethodsPay } = require('../controllers/auth');
const { getDynamicTables, setDynamicTables, getParamsTable, getAllTables, deleteRowTables,
    updateStateRow, getSelectDinamic, addRowDynamic, getPaymentsUsers, getUsers, getEstudents, registerUsersAdmin, getProfiles, getAcadamiesProfile } = require('../controllers/admin');

const { validarJWT } = require('../middlewares/validar-jwt');
const { validateFields } = require('../middlewares/validate-fields');
const { uploadFiles, uploads, getFiles } = require('../controllers/upload');


router.post('/auth/register',
    [// middlewares
        check('referred_code', 'El codigo de referido es obligatorio').not().isEmpty(),
        check('name', 'El name es obligatorio').not().isEmpty(),
        check('email', 'El email es obligatorio').isEmail(),
        check('cell_phone', 'El numero de telefono no es valido').isNumeric(),
        check('id_plan', 'Tiene que seleccionar un plan').isNumeric(),
        check('password', 'El password debe ser de 6 characters').isLength({ min: 6 }),
        validateFields
    ],
    registerUsers);
    
    router.post('/auth/register-pay',
    [// middlewares
    check('email', 'El email es obligatorio').isEmail(),
    check('code_pay', 'El codigo de pago es obligatorio').not().isEmpty(),
    check('method_pay', 'El metodo de pago es obligatorio').not().isEmpty(),
    validateFields
],
registerPay);

router.post('/auth/login',
[// middlewares
        check('profile', 'El perfil es obligatorio').not().isEmpty(),
        check('email', 'El usuario es obligatorio').isEmail(),
        check('password', 'El password debe ser de 6 characters').isLength({ min: 6 }),
        validateFields
    ],
    loginUsers);
    
router.post('/ad/add-tbdynamic',
[// middlewares
check('table_name', 'El nombre de la tabla es obligatorio').not().isEmpty(),
check('name', 'El nombre es obligatorio').not().isEmpty(),
validateFields
],
setDynamicTables);

router.post('/ad/add-rowdynamic',
[// middlewares
check('table', 'El nombre de la tabla es obligatorio').not().isEmpty(),
validateFields
],
addRowDynamic);
router.post('/ad/upload',
uploads,
uploadFiles
);

router.delete('/ad/delete-row',
[// middlewares
check('table', 'El nombre de la tabla es obligatorio').not().isEmpty(),
        check('id', 'El id es obligatorio').not().isEmpty(),
        validateFields
    ],
    deleteRowTables);
    
    router.put('/ad/update-state',
    [// middlewares
    check('state', 'El estado  es obligatorio').not().isEmpty(),
    check('table', 'El nombre de la tabla es obligatorio').not().isEmpty(),
    check('id', 'El id es obligatorio').not().isEmpty(),
    validateFields
],
updateStateRow);

router.post('/ad/add-user',
    [// middlewares
        check('name', 'El name es obligatorio').not().isEmpty(),
        check('email', 'El email es obligatorio').isEmail(),
        check('profile', 'Tiene que seleccionar un perfile').isNumeric(),
        check('password', 'El password debe ser de 6 characters').isLength({ min: 6 }),
        validateFields
    ],
    registerUsersAdmin);


router.get('/auth/renew', validarJWT, renewToken);
router.get('/auth/plans', getPlans);
router.get('/auth/methods-pay', getMethodsPay);
router.get('/ad/tb-dynamic/:type', getDynamicTables);
router.get('/ad/params-tb/:table', getParamsTable);
router.get('/ad/tables', getAllTables);
router.get('/ad/select/:table', getSelectDinamic);
router.get('/ad/estudents', getEstudents);
router.get('/ad/users', getUsers);
router.get('/ad/payments-users', getPaymentsUsers);
router.get('/ad/profiles', getProfiles);
router.get('/ad/academies', getAcadamiesProfile);

router.get('/ad/:folder/:url', getFiles);

module.exports = router;