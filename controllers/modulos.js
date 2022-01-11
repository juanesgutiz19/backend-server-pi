const { response, request } = require('express');
const Leccion = require('../models/Leccion');
const { SeguimientoLeccion } = require('../models/Seguimiento');

const obtenerLeccionesPorIdModulo = async (req, res = response) => {

    const idModulo = req.params.idModulo;
    const { uid } = req;

    try {

        // TODO: Por ahora no se valida si el módulo existe porque sería añadir tiempo de ejecución que puede ser innecesario - DEFINIR
        let contenidoModulo = [];
        const leccionesDeModulo = await Leccion.find({ modulo: idModulo });

        // leccionesDeModulo.forEach(async (item, index) => {

        //     // console.log("LECCION ID---->", item._id);
        //     // console.log("USUARIO ID---->", uid);
        //     const seguimientoLeccion = await SeguimientoLeccion.findOne( { leccion: item._id, usuario: uid } );
        //     // console.log(seguimientoLeccion);
        //     // console.log(seguimientoLeccion.estado);
        //     // let contenidoModuloItem = {
        //     //     idLeccion: item._id,
        //     //     tituloLeccion: item.titulo,
        //     //     orden: item.orden 
        //     // }


        //     // contenidoModulo.push(contenidoModuloItem);
        //     contenidoModulo.push({
        //         idLeccion: item._id,
        //         tituloLeccion: item.titulo,
        //         orden: item.orden 
        //     });
        // });

        for (let leccion of leccionesDeModulo) {

            const seguimientoLeccion = await SeguimientoLeccion.findOne({ leccion: leccion._id, usuario: uid });

            contenidoModulo.push({
                idLeccion: leccion._id,
                tituloLeccion: leccion.titulo,
                orden: leccion.orden, 
                tipo: leccion.tipo,
                estado: seguimientoLeccion.estado
            });
        }

        contenidoModulo.sort((a,b)=> (a.orden > b.orden ? 1 : -1));

        res.json({
            contenidoModulo
        });


    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        })
    }
}

const obtenerEstadoFinalModuloPorId = async (req, res = response) => {

    const idModulo = req.params.idModulo;

    try {

        res.json({
            ok: true,
            msg: "Obtener el estado final de un módulo por id",
            idModulo
        });


    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        })
    }
}

const obtenerPuntuacionPorIdModulo = async (req, res = response) => {

    const idModulo = req.params.idModulo;

    try {

        res.json({
            ok: true,
            msg: "Obtener puntuación por id de módulo",
            idModulo
        });


    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        })
    }
}

const resetearModuloPorId = async (req, res = response) => {

    const idModulo = req.params.idModulo;

    try {

        res.json({
            ok: true,
            msg: "Resetear módulo por id",
            idModulo
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
    obtenerLeccionesPorIdModulo,
    obtenerEstadoFinalModuloPorId,
    obtenerPuntuacionPorIdModulo,
    resetearModuloPorId
}