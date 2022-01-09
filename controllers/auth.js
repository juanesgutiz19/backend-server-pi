const { response } = require('express');
const bcrypt = require('bcryptjs');
// const moment = require('moment');
const moment = require('moment-timezone');

const { generarJWT } = require('../helpers/jwt')
const Usuario = require('../models/Usuario');
const { generarUrlImagen } = require('../helpers/files-utils');

const { loginMares, obtenerInformacionEstudiantePorCedula } = require('../services/lisService');

const login = async(req, res = response) => {

    const { usuario, contraseña } = req.body;
    
    try {
        let usuarioDB = {};
        usuarioDB = await Usuario.findOne({ usuarioInstitucional: usuario });
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
                        // LOS ARCHIVOS DE CLOUDINARY SOLO PODRÁN TENER EXTENSIÓN JPG
                        const urlImagen = generarUrlImagen( nombreCompleto );
                        // format, toDate
                        // const nowDate = moment().tz('America/Bogota').add(1, 'days').format();
                        // console.log(nowDate);
                        // console.log(typeof nowDate);
                        // const myMomentObject = moment(nowDate, 'YYYY-MM-DD HH:mm:ss');
                        // console.log(myMomentObject);
                        // console.log(typeof myMomentObject);
                        // marcaTemporalUltimaLeccionAprobada: nowDate, 
                        usuarioDB = new Usuario({ usuarioInstitucional: usuario, nombreCompleto, password: contraseña, urlImagen, puntajeGlobal: 0, rachaDias: 0, porcentajeProgreso: 0, rol: 'ESTUDIANTE'});
                        
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
        const token = await generarJWT(usuarioDB.id, usuarioDB.usuarioInstitucional);

        res.json({
            ok: true,
            token
        });

        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        });
    }
}

const renovarToken = async(req, res = response) => {

    const { uid, usuarioInstitucional } = req;

    try {
        
        const token = await generarJWT( uid, usuarioInstitucional );

        const usuario = await Usuario.findOne({ usuarioInstitucional }).select('-password');

        if ( usuario.marcaTemporalUltimaLeccionAprobada ) {
            const fechaHoyDia =  moment().tz('America/Bogota').format('DD');
            const fechaAyerDia = moment().tz('America/Bogota').subtract(1, 'days').format('DD');
            const marcaTemporalUltimaLeccionAprobadaDia = moment(usuario.marcaTemporalUltimaLeccionAprobada, 'YYYY-MM-DD HH:mm:ss').format('DD');
            if ( marcaTemporalUltimaLeccionAprobadaDia !== fechaHoyDia && marcaTemporalUltimaLeccionAprobadaDia !== fechaAyerDia ) {
                await Usuario.findByIdAndUpdate(uid, { rachaDias: 0 }, { new: true });
                usuario.rachaDias = 0;
            }
        }

        res.json({
            ok: true,
            token,
            usuario
        });
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        })
    }
    
    
}

module.exports = { 
    login,
    renovarToken
}