const jwt = require('jsonwebtoken');
const { response } = require('express');


const validarJWT = (req, res = response, next) => {

    const token = req.header('x-token');

    if ( !token ) {
        return res.status(401).json({
            ok: false,
            msg: 'No hay token en la petición'
        });
    }

    try {

        const { uid, usuarioInstitucional } = jwt.verify(token, process.env.JWT_SECRET);

        req.uid = uid;
        req.usuarioInstitucional = usuarioInstitucional;  

        next();

    } catch (error) {
        return res.status(401).json({
            ok: false,
            msg: 'Token no válido'
        });
    }
};


module.exports = {
    validarJWT
};