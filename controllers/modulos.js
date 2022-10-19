const { response } = require('express');
const Leccion = require('../models/Leccion');
const Modulo = require('../models/Modulo');
const { SeguimientoLeccion, SeguimientoModulo } = require('../models/Seguimiento');
const Usuario = require('../models/Usuario');
const { s3Uploadv2 } = require("../services/s3Service");

const { uuid } = require('uuidv4');

const crearModulo = async (req, res = response) => {

    const { nombre, tamanoVisualizacion, carpetaDestinoRecurso } = req.body;

    try {

        const s3UploadResults = await s3Uploadv2(req.files);
        const { Location: urlImagen } = s3UploadResults[0];

        const numeroDeModulos = await Modulo.countDocuments({}).exec();
        const moduloDB = new Modulo({ nombre, puntajeMaximo: 0, urlImagen, orden: numeroDeModulos, tamañoVisualizacion: tamanoVisualizacion, carpetaDestinoRecurso });
        await moduloDB.save();

        const usuarios = await Usuario.find({ rol: 'ESTUDIANTE' });
        let seguimientoModuloDB = {};

        usuarios.forEach(async (usuario) => {
            seguimientoModuloDB = new SeguimientoModulo({ usuario: usuario._id, modulo: moduloDB._id, puntajeAcumulado: 0, estado: 'BLOQUEADO' });
            await seguimientoModuloDB.save();
        });

        console.log(req.files);

        res.json({
            ok: true,
            modulo: moduloDB
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        });
    }
}

const actualizarModulo = async (req, res = response) => {

    const idModulo = req.params.idModulo;

    const { nombre, tamanoVisualizacion } = req.body;

    try {

        console.log('req.files', req.files);

        let dataToUpdate = { nombre, tamañoVisualizacion: tamanoVisualizacion };

        let indexFieldName = req.files.findIndex(f => f.fieldname === "imagen");
        if (indexFieldName !== -1) {

            console.log(uuid());

            // const modulo = await Modulo.findById(idModulo);
            // const { urlImagen } = modulo;
            // let urlImagenSplitted = urlImagen.split('/module-pictures/');
            // let nombreModulo = urlImagenSplitted[1];
            // const { buffer } = req.files[indexFieldName];
            // const fileArrayObject = [{
            //     originalname: nombreModulo,
            //     buffer
            // }];


            const { buffer, originalname } = req.files[indexFieldName];
            const fileArrayObject = [{
                originalname: `${uuid()}-${originalname}`,
                buffer
            }];


            console.log('fileArrayObject', fileArrayObject);
            const s3UploadResults = await s3Uploadv2(fileArrayObject);
            console.log('s3UploadResults', s3UploadResults);
            const { Location } = s3UploadResults[0];

            dataToUpdate.urlImagen = Location;
        }

        console.log('dataToUpdate', dataToUpdate);

        const moduloDB = await Modulo.findByIdAndUpdate(idModulo, dataToUpdate, { new: true });

        res.json({
            ok: true,
            modulo: moduloDB
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        });
    }
}

const obtenerModulos = async (req, res = response) => {

    const { uid } = req;

    try {

        const usuario = await Usuario.findById(uid);
        const { rol } = usuario;

        if (rol !== 'ADMIN') {
            res.status(401).json({
                ok: false,
                msg: 'No estás autorizado para acceder a este servicio'
            });
        } else {

            const modulos = await Modulo.find({}, '-puntajeMaximo');

            modulos.sort((a, b) => (a.orden > b.orden ? 1 : -1));

            for (let i = 0; i < modulos.length; i++) {
                const numeroLeccionesModulo = await Leccion.countDocuments({ modulo: modulos[i]._id }).exec();
                modulos[i] = modulos[i].toJSON();
                modulos[i].numeroLecciones = numeroLeccionesModulo;
            }

            res.json({
                ok: true,
                modulos
            });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        });
    }
}

const obtenerLeccionesPorIdModulo = async (req, res = response) => {

    const idModulo = req.params.idModulo;
    const { uid } = req;

    try {

        // TODO: Por ahora no se valida si el módulo existe porque sería añadir tiempo de ejecución que puede ser innecesario - DEFINIR
        let contenidoModulo = [];
        const leccionesDeModulo = await Leccion.find({ modulo: idModulo });

        for (let leccion of leccionesDeModulo) {

            let seguimientoLeccion = {};
            seguimientoLeccion = await SeguimientoLeccion.findOne({ leccion: leccion._id, usuario: uid });

            if (!seguimientoLeccion) {
                seguimientoLeccion = new SeguimientoLeccion({ usuario: uid, leccion: leccion._id, vidasPerdidas: 0, puntajeObtenido: 0, estado: 'BLOQUEADA' });
                await seguimientoLeccion.save();
            }

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

                const leccionSiguiente = await Leccion.findOne({ orden: 0, modulo: moduloSiguiente._id });

                const seguimientoLeccionSiguiente = await SeguimientoLeccion.findOne({ leccion: leccionSiguiente._id, usuario: uid });
                await SeguimientoLeccion.findByIdAndUpdate(seguimientoLeccionSiguiente._id, { estado: 'EN_CURSO' }, { new: true });

                await Usuario.findByIdAndUpdate(uid, { leccionActual: leccionSiguiente._id }, { new: true });
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

        leccionesDeModulo = await Leccion.find({ modulo: idModulo });
        leccionesDeModulo.forEach(async (leccion, indice) => {
            let estado = '';
            if (leccion.orden === 0) {
                estado = 'EN_CURSO';
                await Usuario.findByIdAndUpdate(uid, { leccionActual: leccion._id }, { new: true });
            } else {
                estado = 'BLOQUEADA';
            }

            const seguimientoLeccion = await SeguimientoLeccion.findOne({ usuario: uid, leccion: leccion._id });

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

const actualizarPuntajeMaximoModulo = async (req, res = response) => {

    const idModulo = req.params.idModulo;

    try {

        const leccionesDeModulo = await Leccion.find({ modulo: idModulo });

        let puntajeMaximo = 0;

        leccionesDeModulo.forEach((leccion, index) => {
            const { puntaje } = leccion;
            puntajeMaximo = puntajeMaximo + puntaje;
        });

        await Modulo.findByIdAndUpdate(idModulo, { puntajeMaximo }, { new: true });

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

const obtenerPuntajeMaximoPorIdModulo = async (req, res = response) => {

    const idModulo = req.params.idModulo;

    try {

        const modulo = await Modulo.findById(idModulo);

        if (!modulo) {
            return res.status(404).json({
                msg: "No existe el módulo"
            });
        }

        const leccionesLectura = await Leccion.find({ modulo: idModulo, tipo: "LECTURA" });

        const puntajeLeccionesLectura = leccionesLectura.reduce((acc, item) => {
            return acc += item.puntaje;
        }, 0);

        const leccionesTipoCodigo = await Leccion.find({ modulo: idModulo, tipo: "CODIGO" });

        const puntajeLeccionesCodigo = leccionesTipoCodigo.reduce((acc, item) => {
            return acc += item.puntaje;
        }, 0);

        const leccionesTipoQuiz = await Leccion.find({ modulo: idModulo, tipo: "QUIZ" });

        const puntajeLeccionesQuiz = leccionesTipoQuiz.reduce((acc, item) => {
            return acc += item.puntaje;
        }, 0);


        const { puntajeMaximo } = modulo;

        res.json({
            puntajeTotal: puntajeMaximo,
            puntajeLeccionesLectura,
            puntajeLeccionesCodigo,
            puntajeLeccionesQuiz,
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        })
    }
}

const obtenerLeccionesPorIdModuloAdmin = async (req, res = response) => {

    const idModulo = req.params.idModulo;
    const { page = 0, pageSize = 10} = req.query;

    try {

        const totalElements =  await Leccion.find({ modulo: idModulo }).countDocuments();

        const lecciones = await Leccion.find({ modulo: idModulo }, `-modulo -vidasTotales -contenido`)
            .sort({ orden: 1 })
            .skip(Number(page * pageSize))
            .limit(Number(pageSize))
            .exec();

        const modulo = await Modulo.findById(idModulo);

        res.json({
            lecciones,
            totalElements,
            nombreModulo: modulo.nombre
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
    crearModulo,
    actualizarModulo,
    obtenerModulos,
    obtenerLeccionesPorIdModulo,
    obtenerEstadoFinalModuloPorId,
    obtenerPuntuacionPorIdModulo,
    resetearModuloPorId,
    actualizarPuntajeMaximoModulo,
    obtenerPuntajeMaximoPorIdModulo,
    obtenerLeccionesPorIdModuloAdmin
}