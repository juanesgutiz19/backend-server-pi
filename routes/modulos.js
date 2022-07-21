/*
    host + /api/modulos
*/
const { Router } = require('express');
const { check } = require('express-validator');

const { validarCampos } = require('../middlewares/validar-campos');
const { obtenerModulos,
    obtenerLeccionesPorIdModulo,
    obtenerEstadoFinalModuloPorId,
    obtenerPuntuacionPorIdModulo,
    resetearModuloPorId,
    actualizarPuntajeMaximoModulo
} = require('../controllers/modulos');

const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

// Todas las rutas deaquí para abajo tienen que pasar por la validación de JWT
router.use(validarJWT);

router.get(
    '/',
    [],
    obtenerModulos);

router.get(
    '/:idModulo/lecciones',
    [
        check('idModulo', 'El id del módulo debe ser un mongoID válido').isMongoId(),
        validarCampos
    ],
    obtenerLeccionesPorIdModulo);

router.get(
    '/:idModulo/estadoFinal',
    [
        check('idModulo', 'El id del módulo debe ser un mongoID válido').isMongoId(),
        validarCampos
    ],
    obtenerEstadoFinalModuloPorId);

router.get(
    '/:idModulo/puntuacion',
    [
        check('idModulo', 'El id del módulo debe ser un mongoID válido').isMongoId(),
        validarCampos
    ],
    obtenerPuntuacionPorIdModulo);

router.post(
    '/:idModulo/reset',
    [
        check('idModulo', 'El id del módulo debe ser un mongoID válido').isMongoId(),
        validarCampos
    ],
    resetearModuloPorId);

router.put(
    '/:idModulo/puntajeMaximoModulo',
    [
        check('idModulo', 'El id del módulo debe ser un mongoID válido').isMongoId(),
        validarCampos
    ],
    actualizarPuntajeMaximoModulo);

module.exports = router;