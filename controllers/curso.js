const { response } = require('express');
const { SeguimientoModulo } = require('../models/Seguimiento');
const { agregarOrdenAContenidoCurso } = require('../helpers/contenido-utils');

const Usuario = require('../models/Usuario');


const obtenerContenidoCursoDeUsuario = async (req, res = response) => {

    const { uid } = req;

    try {
        const seguimientoModuloUsuario = await SeguimientoModulo.find({ usuario: uid }, '-_id')
            .populate('modulo', 'nombre puntajeMaximo urlImagen orden');

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

    try {

        // El id del usuario se extrae del token

        res.json({
            ok: true,
            msg: "Obtener racha últimos siete días"
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