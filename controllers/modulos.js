const { response, request } = require('express');
const Leccion = require('../models/Leccion');
const Modulo = require('../models/Modulo');
const { SeguimientoLeccion, SeguimientoModulo } = require('../models/Seguimiento');
const Usuario = require('../models/Usuario');

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

        contenidoModulo.sort((a, b) => (a.orden > b.orden ? 1 : -1));

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
    const { uid } = req;

    try {

        const modulo = await Modulo.findById(idModulo);
        const seguimientoModulo = await SeguimientoModulo.findOne({ usuario: uid, modulo: idModulo });

        const { puntajeMaximo, orden } = modulo;
        const { puntajeAcumulado, _id } = seguimientoModulo;

        let idSeguimientoModulo = _id;
        const porcentajeAprobado = (puntajeAcumulado * 100) / puntajeMaximo;

        let estado = '';
        if (porcentajeAprobado >= 60) {

            estado = 'APROBADO';

            const moduloSiguiente = await Modulo.findOne({ orden: orden + 1 });

            if (moduloSiguiente) {
                const seguimientoModuloSiguiente = await SeguimientoModulo.findOne({ usuario: uid, modulo: moduloSiguiente._id });
                await SeguimientoModulo.findByIdAndUpdate(seguimientoModuloSiguiente._id, { estado: 'EN_CURSO' }, { new: true });
            }

        } else {
            estado = 'REPROBADO';
        }

        await SeguimientoModulo.findByIdAndUpdate(idSeguimientoModulo, { estado }, { new: true });
        const seguimientoModuloResponse = await SeguimientoModulo.findById(_id);


        res.json({
            ok: true,
            seguimientoModulo: seguimientoModuloResponse
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
    const { uid } = req;

    try {

        const modulo = await Modulo.findById(idModulo);
        const seguimientoModulo = await SeguimientoModulo.findOne({ usuario: uid, modulo: idModulo });

        const { puntajeMaximo } = modulo;
        const { puntajeAcumulado } = seguimientoModulo;

        res.json({
            puntajeMaximo,
            puntajeAcumulado
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
    const { uid } = req;

    try {

        const seguimientoModuloActual = await SeguimientoModulo.findOne({ usuario: uid, modulo: idModulo });
        const { _id: idSeguimientoModulo, puntajeAcumulado } = seguimientoModuloActual;
        await SeguimientoModulo.findByIdAndUpdate(idSeguimientoModulo, { puntajeAcumulado: 0, estado: 'EN_CURSO' }, { new: true });

        const modulos = await Modulo.find();

        const totalPuntajeModulos = modulos.reduce((acc, item) => {
            return acc += item.puntajeMaximo;
        }, 0);

        const seguimientosModulos = await SeguimientoModulo.find({ usuario: uid });

        const totalPuntajeSeguimientosModulo = seguimientosModulos.reduce((acc, item) => {
            return acc += item.puntajeAcumulado;
        }, 0);

        const porcentajeProgreso = (totalPuntajeSeguimientosModulo * 100) / totalPuntajeModulos;

        const usuario = await Usuario.findById(uid);
        const { puntajeGlobal } = usuario;

        await Usuario.findByIdAndUpdate(uid, { puntajeGlobal: puntajeGlobal - puntajeAcumulado, porcentajeProgreso }, { new: true });

        let leccionesDeModulo = {};

        // Filtrando las lecciones de un módulo dado
        leccionesDeModulo = await Leccion.find({ modulo: idModulo });
        leccionesDeModulo.forEach(async (leccion, indice) => {
            let estado = '';
            if (leccion.orden === 0) {
                console.log('Entré prrro');
                estado = 'EN_CURSO';
            } else {
                estado = 'BLOQUEADA';
            }

            const seguimientoLeccion = await SeguimientoLeccion.findOne({ usuario: uid, leccion: leccion._id });

            console.log(estado);
            await SeguimientoLeccion.findByIdAndUpdate(seguimientoLeccion._id, { vidasPerdidas: 0, puntajeObtenido: 0, estado }, { new: true });
        });

        res.json({
            ok: true
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