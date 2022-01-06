const { response, request } = require('express');
// var mongoose = require('mongoose');

const Leccion = require('../models/Leccion');
const { Pregunta, OpcionPregunta } = require('../models/Pregunta');

const getLecciones = async(req = request, res = response) => {

    // Con el uso de select se puede mostrar específicamente ciertos campos, cuando el valor es 0, no aparecerá.
    const lecciones = await Leccion.find()
                                    .populate({
                                        path: "pregunta",
                                        select: { '_id':0},
                                        populate: {
                                            path: "opciones",
                                            select: { 'opcion':1, '_id':0 }
                                        }
                                    });

    res.json({
        msg: 'Get lecciones',
        lecciones
    });
}

const crearLeccion = async (req, res = response) => {

    const { titulo, pregunta } = req.body;

    // Crear pregunta (sin las opciones de pregunta)
    // var objectId = mongoose.Types.ObjectId('507f191e810c19729de860ea');
    // const preguntaDB = new Pregunta({ enunciado: pregunta.enunciado, opciones: [ objectId, objectId ] });
    
    const preguntaDB = new Pregunta({ enunciado: pregunta.enunciado });
    await preguntaDB.save();

    // Iterar sobre arreglo de opciones de pregunta, de esa forma irlas añadiendo
    // a la pregunta
    pregunta.opciones.forEach( async( item, index ) => {
        // console.log(item);
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


const obtenerContenidoPorIdLeccion = async(req, res = response) => {

    const idLeccion = req.params.idLeccion;

    try {


        
        res.json({
            ok: true,
            msg: "Obtener contenido por id de lección",
            idLeccion
        });

        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        })
    }
}


const validarLeccionTipoQuizOLectura = async(req, res = response) => {

    const idLeccion = req.params.idLeccion;

    // Puede enviarlo o no (OPCIONAL)
    const { idOpcionSeleccionada } = req.body;

    try {

        
        
        res.json({
            ok: true,
            msg: "Validar lección tipo quiz o lectura",
            idLeccion,
            idOpcionSeleccionada
        });

        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        })
    }
}

const validarLeccionTipoCodigo = async(req, res = response) => {

    const idLeccion = req.params.idLeccion;

    // Puede enviarlo o no (OPCIONAL)
    const { esCorrecta } = req.body;

    try {

        
        
        res.json({
            ok: true,
            msg: "Validar lección tipo código",
            idLeccion,
            esCorrecta
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
    obtenerContenidoPorIdLeccion,
    validarLeccionTipoQuizOLectura,
    validarLeccionTipoCodigo
}