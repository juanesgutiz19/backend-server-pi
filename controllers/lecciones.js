const { response, request } = require('express');
const moment = require('moment-timezone');

const Leccion = require('../models/Leccion');
const Contenido = require('../models/Contenido');
const { Pregunta, OpcionPregunta } = require('../models/Pregunta');
const { SeguimientoLeccion, SeguimientoModulo } = require('../models/Seguimiento');
const Usuario = require('../models/Usuario');
const Modulo = require('../models/Modulo');
const Racha = require('../models/Racha');

const getLecciones = async (req = request, res = response) => {

    // Con el uso de select se puede mostrar específicamente ciertos campos, cuando el valor es 0, no aparecerá.
    const lecciones = await Leccion.find()
        .populate({
            path: "pregunta",
            select: { '_id': 0 },
            populate: {
                path: "opciones",
                select: { 'opcion': 1, '_id': 0 }
            }
        });

    res.json({
        msg: 'Get lecciones',
        lecciones
    });
}

const crearLeccionOld = async (req, res = response) => {

    const { titulo, pregunta } = req.body;

    // Crear pregunta (sin las opciones de pregunta)
    // var objectId = mongoose.Types.ObjectId('507f191e810c19729de860ea');
    // const preguntaDB = new Pregunta({ enunciado: pregunta.enunciado, opciones: [ objectId, objectId ] });

    const preguntaDB = new Pregunta({ enunciado: pregunta.enunciado });
    await preguntaDB.save();

    // Iterar sobre arreglo de opciones de pregunta, de esa forma irlas añadiendo
    // a la pregunta
    pregunta.opciones.forEach(async (item, index) => {
        const { opcion, esCorrecta } = item;
        const opcionPregunta = new OpcionPregunta({ opcion, esCorrecta });
        await opcionPregunta.save();
        await Pregunta.findByIdAndUpdate(
            preguntaDB._id,
            { $push: { opciones: opcionPregunta._id } },
            { new: true }
        );
    });

    // Crear lección (sin la pregunta) y asignar pregunta a la respectiva lección

    const leccion = new Leccion({ titulo, pregunta: preguntaDB._id });
    await leccion.save();

    res.json({
        msg: 'Crear lecciones',
        leccion
    });
}

const crearLeccion = async (req, res = response) => {

    const { titulo, modulo, vidasTotales, tipo, puntaje, orden, contenido, pregunta } = req.body;

    // Crear pregunta (sin las opciones de pregunta)
    // var objectId = mongoose.Types.ObjectId('507f191e810c19729de860ea');
    // const preguntaDB = new Pregunta({ enunciado: pregunta.enunciado, opciones: [ objectId, objectId ] });



    // Iterar sobre arreglo de opciones de pregunta, de esa forma irlas añadiendo
    // a la pregunta
    let leccion = {};
    if (tipo === 'QUIZ') {
        const preguntaDB = new Pregunta({ enunciado: pregunta.enunciado });
        await preguntaDB.save();

        pregunta.opciones.forEach(async (item, index) => {
            const { opcion, esCorrecta } = item;
            const opcionPregunta = new OpcionPregunta({ opcion, esCorrecta });
            await opcionPregunta.save();
            await Pregunta.findByIdAndUpdate(
                preguntaDB._id,
                { $push: { opciones: opcionPregunta._id } },
                { new: true }
            );
        });

        // Crear lección (sin la pregunta) y asignar pregunta a la respectiva lección

        leccion = new Leccion({ titulo, modulo, vidasTotales, tipo, puntaje, orden, pregunta: preguntaDB._id });
        await leccion.save();
    } else if (tipo === 'LECTURA') {
        let contenidoDB = {};

        leccion = new Leccion({ titulo, modulo, vidasTotales, tipo, puntaje, orden });
        await leccion.save();

        contenido.forEach(async (item, index) => {
            const { clave, valor, valorSampleCode } = item;
            if (clave === 'CODIGO') {
                contenidoDB = new Contenido({ clave, valor, valorSampleCode, orden: index });
            } else {
                contenidoDB = new Contenido({ clave, valor, orden: index });
            }
            let contenidoBD = await contenidoDB.save();
            await Leccion.findByIdAndUpdate(
                leccion._id,
                { $push: { contenido: contenidoBD._id } },
                { new: true }
            );
        });
    } else {
        let contenidoDB = {};

        leccion = new Leccion({ titulo, modulo, vidasTotales, tipo, puntaje, orden });
        await leccion.save();

        const { clave, valor, valorPreExerciseCode, valorSampleCode, valorSolution, valorSCT, valorHint } = contenido[0];


        if (clave === 'CODIGO') {
            contenidoDB = new Contenido({ clave, valor, valorPreExerciseCode, valorSampleCode, valorSolution, valorSCT, valorHint });
        }
        await contenidoDB.save();
        await Leccion.findByIdAndUpdate(
            leccion._id,
            { $push: { contenido: contenidoDB._id } },
            { new: true }
        );
    };


    res.json({
        msg: 'Crear lecciones',
        leccion
    });
}


const obtenerContenidoPorIdLeccion = async (req, res = response) => {

    const idLeccion = req.params.idLeccion;
    const { uid } = req;

    try {
        const leccion = await Leccion.findById(idLeccion).populate([{
            path: "pregunta",
            select: { '__v': 0 },
            populate: {
                path: "opciones",
                select: { 'opcion': 1 }
            }

        },
        {
            path: "modulo",
            select: { 'urlImagen': 0, 'orden': 0 }
        },
        {
            path: "contenido",
            select: { '__v': 0 }
        }
        ]);

        const moduloDeLeccionId = leccion.modulo._id;
        const lecciones = await Leccion.find({ modulo: moduloDeLeccionId });

        let idSiguienteLeccion = null;
        if (leccion.orden < lecciones.length - 1) {
            const ordenSiguienteLeccion = leccion.orden + 1;
            const siguienteLeccion = lecciones.find(l => l.orden === ordenSiguienteLeccion);
            idSiguienteLeccion = siguienteLeccion._id;
        }

        let numeroLeccionesVistas = 0;
        for (let leccion of lecciones) {
            let seguimientoLeccionActual = await SeguimientoLeccion.findOne({ usuario: uid, leccion: leccion._id });
            if ( seguimientoLeccionActual.estado === 'VISTA' ){
                numeroLeccionesVistas++;
            }
        }

        const seguimientoLeccion = await SeguimientoLeccion.findOne({ usuario: uid, leccion: idLeccion });
        const { vidasPerdidas } = seguimientoLeccion;
    
        let leccionJSON = leccion.toJSON();
        leccionJSON.modulo.numeroLeccionesVistas = numeroLeccionesVistas;

        res.json({
            leccion: leccionJSON,
            vidasPerdidas,
            idSiguienteLeccion
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        })
    }
}

// TODO: Actualizar puntaje global
const validarLeccionTipoQuizOLectura = async (req, res = response) => {

    const idLeccion = req.params.idLeccion;
    const { uid } = req;

    // Puede enviarlo o no (OPCIONAL)
    const { idOpcionSeleccionada } = req.body;

    try {

        const leccion = await Leccion.findById(idLeccion);
        const usuario = await Usuario.findById(uid);

        const { tipo, puntaje, _id, modulo, orden, vidasTotales } = leccion;
        const { marcaTemporalUltimaLeccionAprobada, rachaDias } = usuario;
        const fechaHoy = moment().tz('America/Bogota');
        const fechaHoyDia = fechaHoy.format('DD');
        const fechaHoyCompleta = fechaHoy.format('YYYY-MM-DD');
        let esCorrecta = false;

        if (tipo === 'QUIZ') {
            const opcionPregunta = await OpcionPregunta.findById(idOpcionSeleccionada);
            const { esCorrecta: esRespuestaCorrecta } = opcionPregunta;
            esCorrecta = esRespuestaCorrecta;
        }

        if ((tipo === 'LECTURA') || ((tipo === 'QUIZ') && (esCorrecta))) {
            let flagAumentarRachaDias = 0;
            if (marcaTemporalUltimaLeccionAprobada) {
                const marcaTemporalUltimaLeccionAprobadaDia = moment(marcaTemporalUltimaLeccionAprobada, 'YYYY-MM-DD').format('DD');
                if (marcaTemporalUltimaLeccionAprobadaDia !== fechaHoyDia) {
                    flagAumentarRachaDias = 1;
                }
                // Si es hoy, no es necesario hacer la actualización ya que solo se está teniendo en cuenta AÑO/MES/DIA
            } else {
                flagAumentarRachaDias = 1;
            }
            if (flagAumentarRachaDias === 1) {
                await Usuario.findByIdAndUpdate(uid, { rachaDias: rachaDias + 1, marcaTemporalUltimaLeccionAprobada: fechaHoyCompleta }, { new: true });
            }

            // TODO: Explorar más adelante el servicio findOneAndUpdate.
            const seguimientoLeccionActual = await SeguimientoLeccion.findOne({ usuario: uid, leccion: _id });
            const { _id: idSeguimientoLeccion } = seguimientoLeccionActual;

            await SeguimientoLeccion.findByIdAndUpdate(idSeguimientoLeccion, { puntajeObtenido: puntaje, estado: 'VISTA' }, { new: true });

            const leccionSiguiente = await Leccion.findOne({ modulo, orden: orden + 1 });

            if (leccionSiguiente) {
                const seguimientoLeccionSiguiente = await SeguimientoLeccion.findOne({ usuario: uid, leccion: leccionSiguiente._id });
                await SeguimientoLeccion.findByIdAndUpdate(seguimientoLeccionSiguiente._id, { estado: 'EN_CURSO' }, { new: true });
            }

            const seguimientoModuloActual = await SeguimientoModulo.findOne({ usuario: uid, modulo });
            const { _id: idSeguimientoModulo, puntajeAcumulado } = seguimientoModuloActual;
            await SeguimientoModulo.findByIdAndUpdate(idSeguimientoModulo, { puntajeAcumulado: puntajeAcumulado + puntaje }, { new: true });


            const modulos = await Modulo.find();

            const totalPuntajeModulos = modulos.reduce((acc, item) => {
                return acc += item.puntajeMaximo;
            }, 0);

            const seguimientosModulos = await SeguimientoModulo.find({ usuario: uid });

            const totalPuntajeSeguimientosModulo = seguimientosModulos.reduce((acc, item) => {
                return acc += item.puntajeAcumulado;
            }, 0);

            const porcentajeProgreso = (totalPuntajeSeguimientosModulo * 100) / totalPuntajeModulos;

            await Usuario.findByIdAndUpdate(uid, { porcentajeProgreso, puntajeGlobal: totalPuntajeSeguimientosModulo }, { new: true });

            const racha = await Racha.findOne({ usuario: uid, fecha: fechaHoyCompleta });

            if (racha) {
                await Racha.findByIdAndUpdate(racha._id, { puntaje: racha.puntaje + puntaje }, { new: true });
            } else {
                const rachaDB = new Racha({ usuario: uid, puntaje, fecha: fechaHoyCompleta });
                await rachaDB.save();
            }

            if (tipo === 'LECTURA') {
                return res.json({
                    ok: true
                });
            }
        }

        const seguimientoLeccionActual = await SeguimientoLeccion.findOne({ usuario: uid, leccion: _id });
        const { vidasPerdidas, _id: idSeguimientoLeccion } = seguimientoLeccionActual;
        let vidasPerdidasResponse = vidasPerdidas;

        // Revisar después
        if (tipo === 'QUIZ' && !esCorrecta) {

            if (vidasPerdidas === vidasTotales) {
                await SeguimientoLeccion.findByIdAndUpdate(idSeguimientoLeccion, { estado: 'VISTA' }, { new: true });

                const leccionSiguiente = await Leccion.findOne({ modulo, orden: orden + 1 });

                if (leccionSiguiente) {
                    const seguimientoLeccionSiguiente = await SeguimientoLeccion.findOne({ usuario: uid, leccion: leccionSiguiente._id });
                    await SeguimientoLeccion.findByIdAndUpdate(seguimientoLeccionSiguiente._id, { estado: 'EN_CURSO' }, { new: true });
                }
            } else {
                await SeguimientoLeccion.findByIdAndUpdate(idSeguimientoLeccion, { vidasPerdidas: vidasPerdidas + 1 }, { new: true });
            }

            // TODO: Revisar después qué enviar en vidasPerdidas si vidasPerdidas === vidasTotales (verificar si está correcto así)
            vidasPerdidasResponse = vidasPerdidasResponse + 1;
        }

        if (tipo !== 'LECTURA' && tipo !== 'QUIZ') {
            return res.status(400).json({
                ok: false,
                msg: 'El tipo de lección debe ser LECTURA o QUIZ'
            });
        }

        res.json({
            ok: true,
            esCorrecta,
            vidasPerdidas: vidasPerdidasResponse
        });


    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        });
    }
}

const validarLeccionTipoCodigo = async (req, res = response) => {

    const idLeccion = req.params.idLeccion;
    const { uid } = req;

    const { esCorrecta } = req.body;

    try {

        const leccion = await Leccion.findById(idLeccion);
        const usuario = await Usuario.findById(uid);

        const { tipo, puntaje, _id, modulo, orden, vidasTotales } = leccion;
        const { marcaTemporalUltimaLeccionAprobada, rachaDias } = usuario;
        const fechaHoy = moment().tz('America/Bogota');
        const fechaHoyDia = fechaHoy.format('DD');
        const fechaHoyCompleta = fechaHoy.format('YYYY-MM-DD');

        if (esCorrecta) {

            let flagAumentarRachaDias = 0;
            if (marcaTemporalUltimaLeccionAprobada) {
                const marcaTemporalUltimaLeccionAprobadaDia = moment(marcaTemporalUltimaLeccionAprobada, 'YYYY-MM-DD').format('DD');
                if (marcaTemporalUltimaLeccionAprobadaDia !== fechaHoyDia) {
                    flagAumentarRachaDias = 1;
                }
                // Si es hoy, no es necesario hacer la actualización ya que solo se está teniendo en cuenta AÑO/MES/DIA
            } else {
                flagAumentarRachaDias = 1;
            }
            if (flagAumentarRachaDias === 1) {
                await Usuario.findByIdAndUpdate(uid, { rachaDias: rachaDias + 1, marcaTemporalUltimaLeccionAprobada: fechaHoyCompleta }, { new: true });
            }

            const seguimientoLeccionActual = await SeguimientoLeccion.findOne({ usuario: uid, leccion: _id });
            const { _id: idSeguimientoLeccion } = seguimientoLeccionActual;

            await SeguimientoLeccion.findByIdAndUpdate(idSeguimientoLeccion, { puntajeObtenido: puntaje, estado: 'VISTA' }, { new: true });

            const leccionSiguiente = await Leccion.findOne({ modulo, orden: orden + 1 });

            if (leccionSiguiente) {
                const seguimientoLeccionSiguiente = await SeguimientoLeccion.findOne({ usuario: uid, leccion: leccionSiguiente._id });
                await SeguimientoLeccion.findByIdAndUpdate(seguimientoLeccionSiguiente._id, { estado: 'EN_CURSO' }, { new: true });
            }

            const seguimientoModuloActual = await SeguimientoModulo.findOne({ usuario: uid, modulo });
            const { _id: idSeguimientoModulo, puntajeAcumulado } = seguimientoModuloActual;
            await SeguimientoModulo.findByIdAndUpdate(idSeguimientoModulo, { puntajeAcumulado: puntajeAcumulado + puntaje }, { new: true });


            const modulos = await Modulo.find();

            const totalPuntajeModulos = modulos.reduce((acc, item) => {
                return acc += item.puntajeMaximo;
            }, 0);

            const seguimientosModulos = await SeguimientoModulo.find({ usuario: uid });

            const totalPuntajeSeguimientosModulo = seguimientosModulos.reduce((acc, item) => {
                return acc += item.puntajeAcumulado;
            }, 0);

            const porcentajeProgreso = (totalPuntajeSeguimientosModulo * 100) / totalPuntajeModulos;

            await Usuario.findByIdAndUpdate(uid, { porcentajeProgreso, puntajeGlobal: totalPuntajeSeguimientosModulo }, { new: true });

            const racha = await Racha.findOne({ usuario: uid, fecha: fechaHoyCompleta });

            if (racha) {
                await Racha.findByIdAndUpdate(racha._id, { puntaje: racha.puntaje + puntaje }, { new: true });
            } else {
                const rachaDB = new Racha({ usuario: uid, puntaje, fecha: fechaHoyCompleta });
                await rachaDB.save();
            }
        }

        const seguimientoLeccionActual = await SeguimientoLeccion.findOne({ usuario: uid, leccion: _id });
        const { vidasPerdidas, _id: idSeguimientoLeccion } = seguimientoLeccionActual;
        let vidasPerdidasResponse = vidasPerdidas;

        if ( !esCorrecta ) {

            if (vidasPerdidas === vidasTotales) {
                await SeguimientoLeccion.findByIdAndUpdate(idSeguimientoLeccion, { estado: 'VISTA' }, { new: true });

                const leccionSiguiente = await Leccion.findOne({ modulo, orden: orden + 1 });

                if (leccionSiguiente) {
                    const seguimientoLeccionSiguiente = await SeguimientoLeccion.findOne({ usuario: uid, leccion: leccionSiguiente._id });
                    await SeguimientoLeccion.findByIdAndUpdate(seguimientoLeccionSiguiente._id, { estado: 'EN_CURSO' }, { new: true });
                }
            } else {
                await SeguimientoLeccion.findByIdAndUpdate(idSeguimientoLeccion, { vidasPerdidas: vidasPerdidas + 1 }, { new: true });
            }

            // TODO: Revisar después qué enviar en vidasPerdidas si vidasPerdidas === vidasTotales (verificar si está correcto así)
            vidasPerdidasResponse = vidasPerdidasResponse + 1;
        }

        if (tipo !== 'CODIGO') {
            return res.status(400).json({
                ok: false,
                msg: 'El tipo de lección debe ser CODIGO'
            });
        }

        res.json({
            ok: true,
            esCorrecta,
            vidasPerdidas: vidasPerdidasResponse
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
    getLecciones,
    crearLeccionOld,
    crearLeccion,
    obtenerContenidoPorIdLeccion,
    validarLeccionTipoQuizOLectura,
    validarLeccionTipoCodigo
}