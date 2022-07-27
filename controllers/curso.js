const { response } = require('express');
const { SeguimientoModulo } = require('../models/Seguimiento');
const { agregarOrdenAContenidoCurso } = require('../helpers/contenido-utils');
const { getPreviousDay } = require('../helpers/date-utils');
const { s3Uploadv2 } = require("../services/s3Service");

const Usuario = require('../models/Usuario');
const Modulo = require('../models/Modulo');
const Racha = require('../models/Racha');
const Recurso = require('../models/Recurso');

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

        const topSinTransformacion = await Usuario.find({ rol: 'ESTUDIANTE' }, `nombreCompleto urlImagen ${seleccionTop}`)
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

        let rachasDeUsuario = await Racha.find({ usuario: uid });

        // Ordenar de la fecha más reciente a la más antigua
        rachasDeUsuario.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        let dias = [];

        let daysBeforeCounter = 6;

        while (daysBeforeCounter >= 0) {
            let puntajeAcumulado = 0;
            let currentDate = getPreviousDay(daysBeforeCounter);
            let rachaUsuarioFecha = await Racha.find({ usuario: uid, fecha: currentDate});
            
            if(rachaUsuarioFecha.length !== 0){
                puntajeAcumulado = rachaUsuarioFecha[0].puntaje;
            } 
            dias.push({
                fecha: currentDate,
                puntajeAcumulado
            })
            daysBeforeCounter--;
        }

        res.json({
            ok: true,
            dias
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        });
    }
}

const guardarRecurso = async (req, res = response) => {

    const idModulo = req.params.idModulo;

    try {

        const modulo = await Modulo.findById(idModulo);

        if(!modulo) {
            return res.status(404).json({
                msg: "No existe el módulo"
            });
        }

        const { carpetaDestinoRecurso } = modulo; 
        const resourcePath = `resources/${carpetaDestinoRecurso}`;
        console.log(resourcePath);
        const s3UploadResults = await s3Uploadv2(req.files, resourcePath);
        const { Location } = s3UploadResults[0];

        const recursoDB = new Recurso({ modulo: idModulo, nombre: req.files[0].originalname, url: Location });
        await recursoDB.save();

        res.json({
            ok: true,
            recurso: recursoDB
        });


    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        })
    }
}

const obtenerRecursosPorIdModulo = async (req, res = response) => {

    const idModulo = req.params.idModulo;

    try {
        const modulo = await Modulo.findById(idModulo);

        if(!modulo) {
            return res.status(404).json({
                msg: "No existe el módulo"
            });
        }

        const recursos = await Recurso.find({modulo: idModulo}, '-modulo');

        res.json({
            ok: true,
            recursos
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
    obtenerRachaUltimosSieteDias,
    guardarRecurso,
    obtenerRecursosPorIdModulo
}