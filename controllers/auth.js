const { response } = require('express');
const bcrypt = require('bcryptjs');

const { generarJWT } = require('../helpers/jwt')
const Usuario = require('../models/Usuario');

const { loginMares, obtenerInformacionEstudiantePorCedula } = require('../services/lisService');

const login = async(req, res = response) => {

    const { usuario, contraseña } = req.body;
    
    try {
        let usuarioDB = {};
        // Con usuario y password se busca en la tabla de usuarios
        usuarioDB = await Usuario.findOne({ usuarioInstitucional: usuario });
        // Si está en la tabla de usuarios, se verifica si el password es correcto
        if ( !usuarioDB ) {
            const responseLogin = await loginMares(usuario, contraseña);
            if ( responseLogin.status === 404 ) {
                return res.status(404).json({
                    ok: false,
                    msg: 'Datos inválidos, recuerde usar su cuenta institucional'
                });
            } else if (responseLogin.status === 200) {
                const cedula = responseLogin.data.res;
                const responseStudentInfo = await obtenerInformacionEstudiantePorCedula(cedula);
                if ( responseStudentInfo.status === 200 ) {
                    const { nombreCompleto, facultadCode } = responseStudentInfo.data;
                    if ( facultadCode !== 104 ) {
                        return res.status(400).json({
                            ok: false,
                            msg: 'El usuario no es de la facultad de ingeniería'
                        });
                    } else {
                        //Mandar al crear { user: req.uid, place: placeId, appointmentDate }
                        usuarioDB = new Usuario({ usuarioInstitucional: usuario, nombreCompleto, password: contraseña, urlImagen: "http://loremflickr.com/200/200/", puntajeGlobal: 0, rachaDias: 0, porcentajeProgreso: 0, rol: 'ESTUDIANTE'});
                        
                        const salt = bcrypt.genSaltSync();
                        usuarioDB.password = bcrypt.hashSync( contraseña, salt );
                        
                        await usuarioDB.save();
                    }
                }
            }
        } else {
            const contraseñaEsValida = bcrypt.compareSync( contraseña, usuarioDB.password );

            if ( !contraseñaEsValida ) {
                return res.status(400).json({
                    ok: false,
                    msg: 'La contraseña es incorrecta'
                });
            }
        }

        // Generar JWT - leccionActual Y marcaTemporalUltimaLeccionAprobada podrían ser unidefined, sin embargo, hacen parte del token. Queda pendiente decidir qué campos se necesitan.
        const token = await generarJWT(usuarioDB.id, usuarioDB.usuarioInstitucional, usuarioDB.password, usuarioDB.nombreCompleto, usuarioDB.urlImagen, usuarioDB.puntajeGlobal, usuarioDB.rachaDias, usuarioDB.porcentajeProgreso, usuarioDB.leccionActual, usuarioDB.marcaTemporalUltimaLeccionAprobada, usuarioDB.rol);

        res.json({
            ok: true,
            token
        });

        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        })
    }
}

const renovarToken = async(req, res = response) => {

    const { uid, usuarioInstitucional, contraseña, nombreCompleto, urlImagen, puntajeGlobal, rachaDias, porcentajeProgreso, leccionActual, marcaTemporalUltimaLeccionAprobada, rol } = req;
    console.log( uid, usuarioInstitucional, contraseña, nombreCompleto, urlImagen, puntajeGlobal, rachaDias, porcentajeProgreso, leccionActual, marcaTemporalUltimaLeccionAprobada, rol);
    //Generar JWT
    const token = await generarJWT( uid, usuarioInstitucional, contraseña, nombreCompleto, urlImagen, puntajeGlobal, rachaDias, porcentajeProgreso, leccionActual, marcaTemporalUltimaLeccionAprobada, rol );

    res.json({
        ok: true,
        token
    });
}

module.exports = { 
    login,
    renovarToken
}