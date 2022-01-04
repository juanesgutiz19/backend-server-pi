const jwt = require('jsonwebtoken');
const { response } = require('express');


const validarJWT = (req, res = response, next) => {

    // Se lee el token
    const token = req.header('x-token');

    if ( !token ) {
        return res.status(401).json({
            ok: false,
            msg: 'No hay token en la petición'
        });
    }

    try {

        // Customized for my application
        // const { uid, fullName, username, identification, universityRole } = jwt.verify(token, process.env.JWT_SECRET);
        // req.uid = uid;
        // req.fullName = fullName;
        // req.username = username;
        // req.identification = identification;
        // req.universityRole = universityRole;

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