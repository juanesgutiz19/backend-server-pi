/*
    host + /api/modulos
*/
const { Router } = require('express');
const { check } = require('express-validator');
const multer = require("multer");

const { validarCampos } = require('../middlewares/validar-campos');
const { crearModulo,
    actualizarModulo,
    obtenerModulos,
    obtenerLeccionesPorIdModulo,
    obtenerEstadoFinalModuloPorId,
    obtenerPuntuacionPorIdModulo,
    resetearModuloPorId,
    actualizarPuntajeMaximoModulo
} = require('../controllers/modulos');


const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 1000000000, files: 1 },
});

// Todas las rutas de aquí para abajo tienen que pasar por la validación de JWT
router.use(validarJWT);

router.post(
    '/',
    [
        upload.array("imagen"),
        check('nombre', 'El nombre del módulo es obligatorio').not().isEmpty(),
        check('tamanoVisualizacion', 'El tamanoVisualizacion del módulo es obligatorio').not().isEmpty(),
        check('tamanoVisualizacion', 'El tamanoVisualizacion no está en las opciones posibles (moduleLg, moduleSm)').isIn(['moduleLg', 'moduleSm']),
        validarCampos,
    ],
    crearModulo);

router.put(
    '/:idModulo',
    [
        upload.array("imagen"),
        check('nombre', 'El nombre del módulo es obligatorio').not().isEmpty(),
        check('tamanoVisualizacion', 'El tamanoVisualizacion del módulo es obligatorio').not().isEmpty(),
        check('tamanoVisualizacion', 'El tamanoVisualizacion no está en las opciones posibles (moduleLg, moduleSm)').isIn(['moduleLg', 'moduleSm']),
        check('idModulo', 'El id del módulo debe ser un mongoID válido').isMongoId(),
        validarCampos,
    ],
    actualizarModulo);

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