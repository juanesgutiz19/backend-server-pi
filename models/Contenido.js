const { Schema, model } = require('mongoose');

const ContenidoSchema = Schema({
    clave: {
        type: String,
        required: [true, 'La clave es obligatoria'],
        enum: ['IMAGEN', 'TEXTO', 'TITULO', 'SUBTITULO', 'LISTA', 'CODIGO']
    },
    valor: {
        type: String,
        required: [true, 'El valor es obligatorio']
    },
    valorPreExerciseCode: {
        type: String,
    },
    valorSampleCode: {
        type: String,
    },
    valorSolution: {
        type: String,
    },
    valorSCT: {
        type: String,
    },
    valorHint: {
        type: String,
    },
    orden: {
        type: Number,
    }
}, { collection: 'contenidos' });

ContenidoSchema.methods.toJSON = function() {
    const { __v, _id, ...contenido } = this.toObject();
    contenido.cid = _id;
    return contenido;
}

module.exports = model( 'Contenido', ContenidoSchema );

