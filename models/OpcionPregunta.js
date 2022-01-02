const { Schema, model } = require('mongoose');

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

module.exports = model( 'OpcionPregunta', OpcionPreguntaSchema );

