const { Schema, model } = require('mongoose');

const PreguntaSchema = Schema({
    enunciado: {
        type: String,
        required: [true, 'El enunciado es obligatorio']
    },
    opciones: [{
        type: Schema.Types.ObjectId,
        ref: 'OpcionPregunta',
        required: [true, 'Las opciones de pregunta son obligatorias']
    }]
}, { collection: 'preguntas' });

PreguntaSchema.methods.toJSON = function() {
    const { __v, _id, ...pregunta } = this.toObject();
    pregunta.pid = _id;
    return pregunta;
}

const OpcionPreguntaSchema = Schema({
    opcion: {
        type: String,
        required: [true, 'La opción es obligatoria']
    },
    esCorrecta: {
        type: Boolean,
        required: [true, 'Es necesario el atributo esCorrecta']
    }
}, { collection: 'opcionesPregunta' });

OpcionPreguntaSchema.methods.toJSON = function() {
    const { __v, _id, ...opcionPregunta } = this.toObject();
    opcionPregunta.opid = _id;
    return opcionPregunta;
}

// La importación sería: const { Pregunta, OpcionPregunta } = require('../models/Pregunta');
module.exports = {
    Pregunta: model( 'Pregunta', PreguntaSchema ),
    OpcionPregunta: model( 'OpcionPregunta', OpcionPreguntaSchema )
}