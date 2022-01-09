/*
    host + /api/auth
*/ 
const { Router } = require('express');
const { check } = require('express-validator');

const { validarCampos } = require('../middlewares/validar-campos');
const { login, renovarToken } = require('../controllers/auth');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

router.post(
    '/',
    [
        check('usuario', 'El usuario es obligatorio').not().isEmpty(),
        check('contraseña', 'La contraseña es obligatoria').not().isEmpty(),
        validarCampos
    ],
    login);

router.get('/renovarToken', validarJWT, renovarToken);

module.exports = router;