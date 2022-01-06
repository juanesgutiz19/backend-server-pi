/*
    host + /api/curso
*/ 
const { Router } = require('express');
const { check } = require('express-validator');

const { validarCampos } = require('../middlewares/validar-campos');
const { obtenerContenidoCursoDeUsuario, obtenerTopEstudiantesPorClasificacion, obtenerRachaUltimosSieteDias } = require('../controllers/curso');
const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

// Todas las rutas deaquí para abajo tienen que pasar por la validación de JWT
//router.use( validarJWT );

router.get('/contenido', obtenerContenidoCursoDeUsuario );

router.get(
    '/estadisticas/top/:tipoTop', 
    [
        check('tipoTop', 'El tipo de top no está en las opciones posibles (PUNTAJE, RACHA, PORCENTAJE)').isIn(['PUNTAJE', 'RACHA', 'PORCENTAJE']),
        validarCampos
    ],
    obtenerTopEstudiantesPorClasificacion );

router.get('/estadisticas/diasEstudio', obtenerRachaUltimosSieteDias );

module.exports = router;