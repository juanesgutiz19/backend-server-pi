const { response } = require('express');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');

const { generarJWT } = require('../helpers/jwt')
const Usuario = require('../models/Usuario');
const Modulo = require('../models/Modulo');
const Leccion = require('../models/Leccion');
const { SeguimientoLeccion, SeguimientoModulo } = require('../models/Seguimiento');

const { generarUrlImagen } = require('../helpers/files-utils');

const { loginMares, obtenerInformacionEstudiantePorCedula } = require('../services/lisService');

const login = async (req, res = response) => {

    const { usuario: usuarioService, contraseña: contraseñaService } = req.body;

    let usuario = usuarioService.toLowerCase();
    let contraseña = contraseñaService.toLowerCase();

    try {
        let usuarioDB = {};
        usuarioDB = await Usuario.findOne({ usuarioInstitucional: usuario });
        if (!usuarioDB) {
            const responseLogin = await loginMares(usuario, contraseña);
            if (responseLogin.status === 404) {
                return res.status(404).json({
                    msg: responseLogin.message
                });
            } else if (responseLogin.status === 400) {
                return res.status(400).json({
                    msg: responseLogin.message
                });
                
            } else if (responseLogin.status === 200) {
                const cedula = responseLogin.data;
                const responseStudentInfo = await obtenerInformacionEstudiantePorCedula(cedula);
                if (responseStudentInfo.status === 200) {

                    const { facultadCode } = responseStudentInfo.data;
                    if (facultadCode !== '25') {
                        return res.status(400).json({
                            ok: false,
                            msg: 'El usuario no es de la facultad de ingeniería'
                        });
                    }
                    else {
                        const urlImagen = generarUrlImagen(usuario);
                        usuarioDB = new Usuario({ usuarioInstitucional: usuario, nombreCompleto: usuario, password: contraseña, urlImagen, puntajeGlobal: 0, rachaDias: 0, porcentajeProgreso: 0, rol: 'ESTUDIANTE' });

                        const salt = bcrypt.genSaltSync();
                        usuarioDB.password = bcrypt.hashSync(contraseña, salt);

                        await usuarioDB.save();

                        const modulos = await Modulo.find({});

                        let estado = '';
                        let seguimientoModuloDB = {};
                        let seguimientoLeccionDB = {};
                        let leccionesDeModulo = {};
                        modulos.forEach(async (item, index) => {
                            if (item.orden === 0) {
                                estado = 'EN_CURSO';
                            } else {
                                estado = 'BLOQUEADO';
                            }
                            seguimientoModuloDB = new SeguimientoModulo({ usuario: usuarioDB._id, modulo: item._id, puntajeAcumulado: 0, estado });

                            await seguimientoModuloDB.save();

                            leccionesDeModulo = await Leccion.find({ modulo: item._id });

                            leccionesDeModulo.forEach(async (leccion, indice) => {
                                if (item.orden === 0 && leccion.orden === 0) {
                                    await Usuario.findByIdAndUpdate(usuarioDB._id, { leccionActual: leccion._id }, { new: true });
                                    estado = 'EN_CURSO';
                                } else {
                                    estado = 'BLOQUEADA';
                                }
                                seguimientoLeccionDB = new SeguimientoLeccion({ usuario: usuarioDB._id, leccion: leccion._id, vidasPerdidas: 0, puntajeObtenido: 0, estado });

                                await seguimientoLeccionDB.save();

                            });
                        });
                    }
                }
            }
        } else {
            const contraseñaEsValida = bcrypt.compareSync(contraseña, usuarioDB.password);

            if (!contraseñaEsValida) {
                return res.status(400).json({
                    ok: false,
                    msg: 'La contraseña es incorrecta'
                });
            }
        }

        const token = await generarJWT(usuarioDB.id, usuarioDB.usuarioInstitucional, usuarioDB.rol);

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

const renovarToken = async (req, res = response) => {

    const { uid, usuarioInstitucional } = req;

    try {

        const token = await generarJWT(uid, usuarioInstitucional);

        const usuario = await Usuario.findOne({ usuarioInstitucional }).select('-password');

        if (usuario.marcaTemporalUltimaLeccionAprobada) {
            const fechaHoyDia = moment().tz('America/Bogota').format('DD');
            const fechaAyerDia = moment().tz('America/Bogota').subtract(1, 'days').format('DD');

            const marcaTemporalUltimaLeccionAprobadaDia = moment(usuario.marcaTemporalUltimaLeccionAprobada, 'YYYY-MM-DD').format('DD');
            if (marcaTemporalUltimaLeccionAprobadaDia !== fechaHoyDia && marcaTemporalUltimaLeccionAprobadaDia !== fechaAyerDia) {
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