
const { Router } = require('express');

const { getLecciones,
        crearLeccion } = require('../controllers/lecciones');

const router = Router();


router.get('/', getLecciones );

router.post('/', crearLeccion );


module.exports = router;