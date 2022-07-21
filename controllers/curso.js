const { response } = require('express');
const { SeguimientoModulo } = require('../models/Seguimiento');
const { agregarOrdenAContenidoCurso } = require('../helpers/contenido-utils');

const Usuario = require('../models/Usuario');
const Racha = require('../models/Racha');
const moment = require('moment-timezone');

const obtenerContenidoCursoDeUsuario = async (req, res = response) => {

    const { uid } = req;

    try {
        const seguimientoModuloUsuario = await SeguimientoModulo.find({ usuario: uid }, '-_id')
            .populate('modulo', 'nombre puntajeMaximo urlImagen orden tamañoVisualizacion');

        const contenidoCursoConOrden = agregarOrdenAContenidoCurso(seguimientoModuloUsuario);

        contenidoCursoConOrden.sort((a, b) => (a.orden > b.orden ? 1 : -1));

        res.json({
            ok: true,
            contenidoCurso: contenidoCursoConOrden
        });


    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        })
    }
}

const obtenerTopEstudiantesPorClasificacion = async (req, res = response) => {

    const tipoTop = req.params.tipoTop;
    const { limit = 10 } = req.query;

    try {

        let seleccionTop = '';
        let criterioOrdenamiento = {};

        if (tipoTop === 'PUNTAJE') {
            seleccionTop = 'puntajeGlobal';
            criterioOrdenamiento = { puntajeGlobal: -1 };
        } else if (tipoTop === 'RACHA') {
            seleccionTop = 'rachaDias';
            criterioOrdenamiento = { rachaDias: -1 };
        } else if (tipoTop == 'PORCENTAJE') {
            seleccionTop = 'porcentajeProgreso';
            criterioOrdenamiento = { porcentajeProgreso: -1 };
        }

        const topSinTransformacion = await Usuario.find({}, `nombreCompleto urlImagen ${seleccionTop}`)
            .sort(criterioOrdenamiento)
            .limit(Number(limit))
            .exec();

        const top = topSinTransformacion.map(user => {
            return {
                nombreCompleto: user.nombreCompleto,
                urlImagen: user.urlImagen,
                valor: user.puntajeGlobal || user.rachaDias || user.porcentajeProgreso || 0
            };
        });

        res.json({
            ok: true,
            top
        });


    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        })
    }
}


const obtenerRachaUltimosSieteDias = async (req, res = response) => {

    const { uid } = req;

    try {

        const usuario = await Usuario.findById(uid);
        const { rachaDias } = usuario;

        // if ( rachaDias === 0) {
        //     return res.json({
        //         msg: 'La racha es 0'
        //     });
        // }

        let rachasDeUsuario = await Racha.find({ usuario: uid });

        // Ordenar de la fecha más reciente a la más antigua
        rachasDeUsuario.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        let numeroElementos = 0;
        if ( rachaDias > 0 && rachaDias <= 7 ) {
            numeroElementos = rachaDias;
        } else {
            numeroElementos = 7
        }

        rachasDeUsuarioUltimosSieteDias = rachasDeUsuario.slice(0, numeroElementos);

        res.json({
            ok: true,
            dias: rachasDeUsuarioUltimosSieteDias
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
    obtenerContenidoCursoDeUsuario,
    obtenerTopEstudiantesPorClasificacion,
    obtenerRachaUltimosSieteDias
}