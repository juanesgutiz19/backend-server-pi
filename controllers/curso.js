const { response } = require('express');
const { SeguimientoModulo } = require('../models/Seguimiento');
const { agregarOrdenAContenidoCurso } = require('../helpers/contenido-utils');



const obtenerContenidoCursoDeUsuario = async (req, res = response) => {

    const { uid } = req;

    try {
        const seguimientoModuloUsuario = await SeguimientoModulo.find({ usuario: uid }, '-_id')
            .populate('modulo', 'nombre puntajeMaximo urlImagen orden');

        const contenidoCursoConOrden = agregarOrdenAContenidoCurso(seguimientoModuloUsuario);

        contenidoCursoConOrden.sort((a,b)=> (a.orden > b.orden ? 1 : -1))

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

    try {


        res.json({
            ok: true,
            msg: "Obtener top estudiantes por clasificación",
            tipoTop
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