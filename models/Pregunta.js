const { Schema, model } = require('mongoose');

const PreguntaSchema = Schema({
    enunciado: {
        type: String,
        required: [true, 'El enunciado es obligatorio']
    },
    opciones: [{
        type: Schema.Types.ObjectId,
        ref: 'OpcionPregunta'
    }]
}, { collection: 'preguntas' });

PreguntaSchema.methods.toJSON = function() {
    const { __v, _id, ...pregunta } = this.toObject();
    pregunta.pid = _id;
    return pregunta;
}

module.exports = model( 'Pregunta', PreguntaSchema );

