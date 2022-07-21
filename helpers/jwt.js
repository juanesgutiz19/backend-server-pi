const jwt = require('jsonwebtoken');

const generarJWT = (uid, usuarioInstitucional, rol) => {

    return new Promise((resolve, reject) => {

        const payload = {
            uid, 
            usuarioInstitucional,
            rol
        };

        jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '2h'
        }, (err, token) => {
            if ( err ) {
                console.log(err);
                reject('No se pudo generar el token');
            } else {
                resolve( token );
            }
        });
    });
};


module.exports = {
    generarJWT
};