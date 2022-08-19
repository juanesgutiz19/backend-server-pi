/*
    host + /api/lecciones
*/
const { Router } = require('express');
const { check } = require('express-validator');

const { validarCampos } = require('../middlewares/validar-campos');
const { getLecciones,
    crearLeccion,
    obtenerLeccionPorId,
    obtenerContenidoPorIdLeccion,
    validarLeccionTipoQuizOLectura,
    validarLeccionTipoCodigo,
    eliminarLeccionPorId,
    actualizarLeccionPorId } = require('../controllers/lecciones');

const { validarJWT } = require('../middlewares/validar-jwt');

const router = Router();

// Todas las rutas de aquí para abajo tienen que pasar por la validación de JWT
router.use(validarJWT);

router.get('/', getLecciones);

router.post('/',
    [
        check('titulo', 'El titulo es obligatorio').not().isEmpty(),
        check('modulo', 'El modulo es obligatorio').not().isEmpty(),
        check('vidasTotales', 'Las vidasTotales son obligatorias').not().isEmpty(),
        check('tipo', 'El tipo es obligatorio').not().isEmpty(),
        check('puntaje', 'El puntaje es obligatorio').not().isEmpty(),
        validarCampos
    ],
    crearLeccion);

router.get(
    '/:idLeccion',
    [
        check('idLeccion', 'El id de la lección debe ser un mongoID válido').isMongoId(),
        validarCampos
    ],
    obtenerLeccionPorId);

router.get(
    '/:idLeccion/contenido',
    [
        check('idLeccion', 'El id de la lección debe ser un mongoID válido').isMongoId(),
        validarCampos
    ],
    obtenerContenidoPorIdLeccion);

// TODO: Hacer un custom middleware que valide que solo si se envía el idOpcionSeleccionada se valide si es un mongoID válido.
router.post(
    '/:idLeccion/quizLectura/validacion',
    [
        check('idLeccion', 'El id de la lección debe ser un mongoID válido').isMongoId(),
        // check('idOpcionSeleccionada', 'El id de la opción seleccionada debe ser un mongoID válido').isMongoId(),
        validarCampos
    ],
    validarLeccionTipoQuizOLectura);


router.post(
    '/:idLeccion/codigo/validacion',
    [
        check('idLeccion', 'El id de la lección debe ser un mongoID válido').isMongoId(),
        check('esCorrecta', 'esCorrecta es obligatorio').not().isEmpty(),
        check('esCorrecta', 'esCorrecta debe ser un booleano').isBoolean(),
        validarCampos
    ],
    validarLeccionTipoCodigo);

router.delete(
    '/:idLeccion',
    [
        check('idLeccion', 'El id de la lección debe ser un mongoID válido').isMongoId(),
        validarCampos
    ],
    eliminarLeccionPorId);

router.put(
    '/:idLeccion',
    [
        check('idLeccion', 'El id de la lección debe ser un mongoID válido').isMongoId(),
        check('titulo', 'El título es obligatorio').not().isEmpty(),
        check('modulo', 'El modulo es obligatorio').not().isEmpty(),
        check('vidasTotales', 'Las vidas totales son obligatorias').not().isEmpty(),
        check('tipo', 'El tipo es obligatorio').not().isEmpty(),
        check('puntaje', 'El puntaje es obligatorio').not().isEmpty(),
        validarCampos
    ],
    actualizarLeccionPorId);


module.exports = router;