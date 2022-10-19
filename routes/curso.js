/*
    host + /api/curso
*/
const { Router } = require('express');
const { check } = require('express-validator');
const multer = require("multer");

const { validarCampos } = require('../middlewares/validar-campos');
const { obtenerContenidoCursoDeUsuario,
    obtenerTopEstudiantesPorClasificacion,
    obtenerRachaUltimosSieteDias,
    guardarRecurso,
    obtenerRecursosPorIdModulo,
    borrarModulo
} = require('../controllers/curso');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 1000000000, files: 1 },
});

// Todas las rutas de aquí para abajo tienen que pasar por la validación de JWT
router.use(validarJWT);

router.get('/contenido', obtenerContenidoCursoDeUsuario);

router.get(
    '/estadisticas/top/:tipoTop',
    [
        check('tipoTop', 'El tipo de top no está en las opciones posibles (PUNTAJE, RACHA, PORCENTAJE)').isIn(['PUNTAJE', 'RACHA', 'PORCENTAJE']),
        validarCampos
    ],
    obtenerTopEstudiantesPorClasificacion);

router.get('/estadisticas/diasEstudio', obtenerRachaUltimosSieteDias);

router.post(
    '/modulos/:idModulo/recursos',
    [
        upload.array("recurso"),
        check('idModulo', 'El id del módulo debe ser un mongoID válido').isMongoId(),
        validarCampos
    ],
    guardarRecurso);

router.get(
    '/modulos/:idModulo/recursos',
    [
        check('idModulo', 'El id del módulo debe ser un mongoID válido').isMongoId(),
        validarCampos
    ],
    obtenerRecursosPorIdModulo);

router.delete(
    '/modulos/:idModulo',
    [
        check('idModulo', 'El id del módulo debe ser un mongoID válido').isMongoId(),
        validarCampos
    ],
    borrarModulo);

module.exports = router;