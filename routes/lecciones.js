
const { Router } = require('express');

const { leccionesGet,
        leccionesPost } = require('../controllers/lecciones');

const router = Router();


router.get('/', leccionesGet );

router.post('/', leccionesPost );






module.exports = router;