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

const crearLeccion = async (req, res = response) => {

    // Descomentar para creación de orden
    // const { titulo, modulo, vidasTotales, tipo, puntaje, contenido, pregunta, orden } = req.body;
    const { titulo, modulo, vidasTotales, tipo, puntaje, contenido, pregunta } = req.body;

    try {

        // Comentar para creación con orden
        const orden = await Leccion.countDocuments({ modulo }).exec();

        // Crear pregunta (sin las opciones de pregunta)
        // var objectId = mongoose.Types.ObjectId('507f191e810c19729de860ea');
        // const preguntaDB = new Pregunta({ enunciado: pregunta.enunciado, opciones: [ objectId, objectId ] });

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

            contenidoDB = new Contenido({ clave, valor, valorPreExerciseCode, valorSampleCode, valorSolution, valorSCT, valorHint });

            await contenidoDB.save();
            await Leccion.findByIdAndUpdate(
                leccion._id,
                { $push: { contenido: contenidoDB._id } },
                { new: true }
            );
        };

        const leccionesDeModulo = await Leccion.find({ modulo });

        let puntajeMaximo = 0;

        leccionesDeModulo.forEach((leccion, index) => {
            const { puntaje } = leccion;
            puntajeMaximo = puntajeMaximo + puntaje;
        });

        await Modulo.findByIdAndUpdate(modulo, { puntajeMaximo }, { new: true });

        const usuarios = await Usuario.find({ rol: 'ESTUDIANTE' });
        let seguimientoLeccionDB = {};

        usuarios.forEach(async (usuario) => {
            seguimientoLeccionDB = new SeguimientoLeccion({ usuario: usuario._id, leccion: leccion._id, vidasPerdidas: 0, puntajeObtenido: 0, estado: 'BLOQUEADA' });
            await seguimientoLeccionDB.save();
        });

        // TODO: OPCIONAL - Quienes ya hayan finalizado un módulo (seguimiento módulo aprobado, se deben realizar las respectivas actualizaciones)

        res.json({
            ok: true,
            idLeccion: leccion._id
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        });
    }

}

const obtenerLeccionPorId = async (req, res = response) => {

    const idLeccion = req.params.idLeccion;

    try {
        const leccion = await Leccion.findById(idLeccion).populate([{
            path: "pregunta",
            select: { '__v': 0 },
            populate: {
                path: "opciones",
                select: { 'opcion': 1, 'esCorrecta': 1 }
            }
        },
        {
            path: "modulo",
            select: { 'urlImagen': 0 }
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

        res.json({
            contenidoLeccion: {
                leccionActual: leccion,
                idSiguienteLeccion
            }
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        })
    }
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
            // select: { 'urlImagen': 0 }
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
            if (seguimientoLeccionActual.estado === 'VISTA') {
                numeroLeccionesVistas++;
            }
        }

        const seguimientoModulo = await SeguimientoModulo.findOne({ usuario: uid, modulo: moduloDeLeccionId });

        const seguimientoLeccion = await SeguimientoLeccion.findOne({ usuario: uid, leccion: idLeccion });
        const { vidasPerdidas, estado, puntajeObtenido } = seguimientoLeccion;

        const numeroLeccionesDeModulo = lecciones.length;

        let leccionJSON = leccion.toJSON();
        leccionJSON.modulo.numeroLeccionesVistas = numeroLeccionesVistas;
        leccionJSON.modulo.numeroLecciones = numeroLeccionesDeModulo;
        leccionJSON.modulo.puntajeAcumulado = seguimientoModulo.puntajeAcumulado;
        leccionJSON.estado = estado;
        leccionJSON.puntajeObtenido = puntajeObtenido;

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

const validarLeccionTipoQuizOLectura = async (req, res = response) => {

    const idLeccion = req.params.idLeccion;
    const { uid } = req;

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

            const seguimientoLeccionActual = await SeguimientoLeccion.findOne({ usuario: uid, leccion: _id });
            const { _id: idSeguimientoLeccion } = seguimientoLeccionActual;

            await SeguimientoLeccion.findByIdAndUpdate(idSeguimientoLeccion, { puntajeObtenido: puntaje, estado: 'VISTA' }, { new: true });

            const leccionSiguiente = await Leccion.findOne({ modulo, orden: orden + 1 });

            // Si hay lección siguiente, actualice en usuario la lección siguiente, de lo contrario, del siguiente módulo, de la primera lección, actualícelo en el usuario
            if (leccionSiguiente) {
                await Usuario.findByIdAndUpdate(uid, { leccionActual: leccionSiguiente._id }, { new: true });
                const seguimientoLeccionSiguiente = await SeguimientoLeccion.findOne({ usuario: uid, leccion: leccionSiguiente._id });
                await SeguimientoLeccion.findByIdAndUpdate(seguimientoLeccionSiguiente._id, { estado: 'EN_CURSO' }, { new: true });
            } else {
                const moduloActual = await Modulo.findById(modulo);
                const moduloSiguiente = await Modulo.findOne({ orden: moduloActual.orden + 1 });
                if (moduloSiguiente) {
                    const primeraLeccionModuloSiguiente = await Leccion.findOne({ modulo: moduloSiguiente._id, orden: 0 });
                    await Usuario.findByIdAndUpdate(uid, { leccionActual: primeraLeccionModuloSiguiente._id }, { new: true });
                }
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

        if (tipo === 'QUIZ' && !esCorrecta) {

            if (vidasPerdidas === vidasTotales) {
                await SeguimientoLeccion.findByIdAndUpdate(idSeguimientoLeccion, { estado: 'VISTA' }, { new: true });

                const leccionSiguiente = await Leccion.findOne({ modulo, orden: orden + 1 });

                // Si hay lección siguiente, actualice en usuario la lección siguiente, de lo contrario, del siguiente módulo, de la primera lección, actualícelo en el usuario
                if (leccionSiguiente) {
                    await Usuario.findByIdAndUpdate(uid, { leccionActual: leccionSiguiente._id }, { new: true });
                    const seguimientoLeccionSiguiente = await SeguimientoLeccion.findOne({ usuario: uid, leccion: leccionSiguiente._id });
                    await SeguimientoLeccion.findByIdAndUpdate(seguimientoLeccionSiguiente._id, { estado: 'EN_CURSO' }, { new: true });
                } else {

                    const moduloActual = await Modulo.findById(modulo);
                    const moduloSiguiente = await Modulo.findOne({ orden: moduloActual.orden + 1 });
                    if (moduloSiguiente) {
                        const primeraLeccionModuloSiguiente = await Leccion.findOne({ modulo: moduloSiguiente._id, orden: 0 });
                        await Usuario.findByIdAndUpdate(uid, { leccionActual: primeraLeccionModuloSiguiente._id }, { new: true });
                    }
                }

            } else {
                await SeguimientoLeccion.findByIdAndUpdate(idSeguimientoLeccion, { vidasPerdidas: vidasPerdidas + 1 }, { new: true });
            }

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
                await Usuario.findByIdAndUpdate(uid, { leccionActual: leccionSiguiente._id }, { new: true });
                const seguimientoLeccionSiguiente = await SeguimientoLeccion.findOne({ usuario: uid, leccion: leccionSiguiente._id });
                await SeguimientoLeccion.findByIdAndUpdate(seguimientoLeccionSiguiente._id, { estado: 'EN_CURSO' }, { new: true });
            } else {
                const moduloActual = await Modulo.findById(modulo);
                const moduloSiguiente = await Modulo.findOne({ orden: moduloActual.orden + 1 });
                if (moduloSiguiente) {
                    const primeraLeccionModuloSiguiente = await Leccion.findOne({ modulo: moduloSiguiente._id, orden: 0 });
                    await Usuario.findByIdAndUpdate(uid, { leccionActual: primeraLeccionModuloSiguiente._id }, { new: true });
                }
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

        if (!esCorrecta) {

            if (vidasPerdidas === vidasTotales) {
                await SeguimientoLeccion.findByIdAndUpdate(idSeguimientoLeccion, { estado: 'VISTA' }, { new: true });

                const leccionSiguiente = await Leccion.findOne({ modulo, orden: orden + 1 });

                if (leccionSiguiente) {
                    await Usuario.findByIdAndUpdate(uid, { leccionActual: leccionSiguiente._id }, { new: true });
                    const seguimientoLeccionSiguiente = await SeguimientoLeccion.findOne({ usuario: uid, leccion: leccionSiguiente._id });
                    await SeguimientoLeccion.findByIdAndUpdate(seguimientoLeccionSiguiente._id, { estado: 'EN_CURSO' }, { new: true });
                } else {
                    const moduloActual = await Modulo.findById(modulo);
                    const moduloSiguiente = await Modulo.findOne({ orden: moduloActual.orden + 1 });
                    if (moduloSiguiente) {
                        const primeraLeccionModuloSiguiente = await Leccion.findOne({ modulo: moduloSiguiente._id, orden: 0 });
                        await Usuario.findByIdAndUpdate(uid, { leccionActual: primeraLeccionModuloSiguiente._id }, { new: true });
                    }
                }

            } else {
                await SeguimientoLeccion.findByIdAndUpdate(idSeguimientoLeccion, { vidasPerdidas: vidasPerdidas + 1 }, { new: true });
            }

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

const eliminarLeccionPorId = async (req, res = response) => {

    const idLeccion = req.params.idLeccion;

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
            select: { 'urlImagen': 0 }
        },
        {
            path: "contenido",
            select: { '__v': 0 }
        }
        ]);

        const { tipo, orden, pregunta, contenido, modulo } = leccion;

        if (tipo === 'QUIZ') {

            const { opciones } = pregunta;

            for (opcion of opciones) {
                let opcionBorrada = await OpcionPregunta.findByIdAndRemove(opcion._id);

                console.log('-----opcionBorrada------');
                console.log(opcionBorrada);
            }

            const preguntaBorrada = await Pregunta.findByIdAndRemove(pregunta._id);

            console.log('-------preguntaBorrada-----');
            console.log(preguntaBorrada);

        } else if (tipo === 'LECTURA' || tipo === 'CODIGO') {

            console.log(leccion);

            for (elementoContenido of contenido) {
                const contenidoBorrado = await Contenido.findByIdAndRemove(elementoContenido._id);
                console.log('----contenidoBorrado----');
                console.log(contenidoBorrado);
            }
        } else {
            res.status(400).json({
                ok: false,
                msg: 'El tipo de lección no es válido'
            })

        };

        // Reorganizar el orden de las lecciones
        let numeroLeccionesModulo = await Leccion.countDocuments({ modulo }).exec();
        // Si es igual (se está eliminando la última lección) simplemente no hay que reorganizar porque no hay lecciones posteriores
        if (orden !== numeroLeccionesModulo - 1) {
            const lecciones = await Leccion.find({ modulo });
            console.log('---lecciones---');
            console.log(lecciones);

            for (let i = numeroLeccionesModulo - 1; i > orden; i--) {
                const leccionOrdenActual = lecciones.find(l => l.orden === i);
                await Leccion.findByIdAndUpdate(leccionOrdenActual._id, { orden: i - 1 }, { new: true });
            }
        }

        // Borrado de seguimientos lección asociados a esa lección
        await SeguimientoLeccion.deleteMany({ leccion: leccion._id });

        const leccionBorrada = await Leccion.findByIdAndRemove(leccion._id);
        console.log('----leccionBorrada----');
        console.log(leccionBorrada);

        // Actualización de puntaje máximo del módulo
        const leccionesDeModulo = await Leccion.find({ modulo });
        let puntajeMaximo = 0;
        leccionesDeModulo.forEach((leccionModulo, index) => {
            const { puntaje } = leccionModulo;
            puntajeMaximo = puntajeMaximo + puntaje;
        });
        await Modulo.findByIdAndUpdate(modulo, { puntajeMaximo }, { new: true });

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

const actualizarLeccionPorId = async (req, res = response) => {

    const idLeccion = req.params.idLeccion;

    const { titulo: tituloActualizado, modulo, vidasTotales: vidasTotalesActualizadas, tipo: tipoActualizado, puntaje: puntajeActualizado, contenido: contenidoActualizado, pregunta: preguntaActualizada } = req.body;

    try {

        // Crear un documento con un mongoId específico
        // const leccion = new Leccion({ _id: '507f191e810c19729de860ea', titulo: 'Ensayo', modulo: "61db50d98e5e161c6ca65604", vidasTotales: 0, tipo: 'QUIZ', puntaje: 1, orden: 2000 });
        // await leccion.save();

        // Asegurarme que el modulo que mandan sea el mismo del IdLección
        const leccionCompleta = await Leccion.findById(idLeccion);
        const { modulo: moduloLeccion } = leccionCompleta;

        if (modulo != moduloLeccion) {
            res.status(400).json({
                ok: false,
                msg: 'La lección no pertenece al módulo, no es posible actualizar el módulo'
            })
        } else {

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
                select: { 'urlImagen': 0 }
            },
            {
                path: "contenido",
                select: { '__v': 0 }
            }
            ]);

            const { tipo, orden, pregunta, contenido, modulo } = leccion;

            if (tipo === 'QUIZ') {

                const { opciones } = pregunta;

                for (opcion of opciones) {
                    let opcionBorrada = await OpcionPregunta.findByIdAndRemove(opcion._id);

                    console.log('-----opcionBorrada------');
                    console.log(opcionBorrada);
                }

                const preguntaBorrada = await Pregunta.findByIdAndRemove(pregunta._id);

                console.log('-------preguntaBorrada-----');
                console.log(preguntaBorrada);

            } else if (tipo === 'LECTURA' || tipo === 'CODIGO') {

                console.log(leccion);

                for (elementoContenido of contenido) {
                    const contenidoBorrado = await Contenido.findByIdAndRemove(elementoContenido._id);
                    console.log('----contenidoBorrado----');
                    console.log(contenidoBorrado);
                }
            } else {
                res.status(400).json({
                    ok: false,
                    msg: 'El tipo de lección no es válido'
                })

            };

            // Por ahora no se borrarán los seguimiento lección, esto se dejará intacto. ¿Por qué? Por ahora no tiene sentido que si ya la pasó por solamente una edición se le invalide.
            // await SeguimientoLeccion.deleteMany({ leccion: leccion._id });

            const leccionBorrada = await Leccion.findByIdAndRemove(leccion._id);
            console.log('----leccionBorrada----');
            console.log(leccionBorrada);

            // No es necesario reordenar ya que el orden no es editable, cuando se cree nuevamente, esto se hace con el orden actual
            let leccionActualizada = {};

            if (tipoActualizado === 'QUIZ') {
    
                const preguntaDB = new Pregunta({ enunciado: preguntaActualizada.enunciado });
                await preguntaDB.save();
    
                preguntaActualizada.opciones.forEach(async (item, index) => {
                    const { opcion, esCorrecta } = item;
                    const opcionPregunta = new OpcionPregunta({ opcion, esCorrecta });
                    await opcionPregunta.save();
                    await Pregunta.findByIdAndUpdate(
                        preguntaDB._id,
                        { $push: { opciones: opcionPregunta._id } },
                        { new: true }
                    );
                });
    
                leccionActualizada = new Leccion({ _id: leccion._id, titulo: tituloActualizado, modulo, vidasTotales: vidasTotalesActualizadas, tipo: tipoActualizado, puntaje: puntajeActualizado, orden, pregunta: preguntaDB._id });
                await leccionActualizada.save();
            } else if (tipoActualizado === 'LECTURA') {
    
                let contenidoDB = {};
    
                leccionActualizada = new Leccion({ _id: leccion._id, titulo: tituloActualizado, modulo, vidasTotales: vidasTotalesActualizadas, tipo: tipoActualizado, puntaje: puntajeActualizado, orden });
                await leccionActualizada.save();
    
                contenidoActualizado.forEach(async (item, index) => {
                    const { clave, valor, valorSampleCode } = item;
                    if (clave === 'CODIGO') {
                        contenidoDB = new Contenido({ clave, valor, valorSampleCode, orden: index });
                    } else {
                        contenidoDB = new Contenido({ clave, valor, orden: index });
                    }
                    let contenidoBD = await contenidoDB.save();
                    await Leccion.findByIdAndUpdate(
                        leccionActualizada._id,
                        { $push: { contenido: contenidoBD._id } },
                        { new: true }
                    );
                });
            } else {
    
                let contenidoDB = {};
    
                leccionActualizada = new Leccion({ _id: leccion._id, titulo: tituloActualizado, modulo, vidasTotales: vidasTotalesActualizadas, tipo: tipoActualizado, puntaje: puntajeActualizado, orden });
                await leccionActualizada.save();
    
                const { clave, valor, valorPreExerciseCode, valorSampleCode, valorSolution, valorSCT, valorHint } = contenidoActualizado[0];
    
                contenidoDB = new Contenido({ clave, valor, valorPreExerciseCode, valorSampleCode, valorSolution, valorSCT, valorHint });
    
                await contenidoDB.save();
                await Leccion.findByIdAndUpdate(
                    leccionActualizada._id,
                    { $push: { contenido: contenidoDB._id } },
                    { new: true }
                );
            };

            
            // Actualización de puntaje máximo del módulo
            const leccionesDeModulo = await Leccion.find({ modulo });
            let puntajeMaximo = 0;
            leccionesDeModulo.forEach((leccionModulo, index) => {
                const { puntaje } = leccionModulo;
                puntajeMaximo = puntajeMaximo + puntaje;
            });
            await Modulo.findByIdAndUpdate(modulo, { puntajeMaximo }, { new: true });

        }
        
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
    getLecciones,
    crearLeccion,
    obtenerLeccionPorId,
    obtenerContenidoPorIdLeccion,
    validarLeccionTipoQuizOLectura,
    validarLeccionTipoCodigo,
    eliminarLeccionPorId,
    actualizarLeccionPorId
}