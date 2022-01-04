const { Schema, model } = require('mongoose');

const LeccionSchema = Schema({
    titulo: {
        type: String,
        required: [true, 'El título es obligatorio']
    },
    modulo: {
        type: Schema.Types.ObjectId,
        ref: 'Modulo',
        required: [true, 'El módulo es obligatorio']
    },
    vidasTotales: {
        type: Number,
        required: [true, 'Las vidas totales son obligatorias']
    },
    tipo: {
        type: String,
        required: [true, 'El tipo de lección es obligatorio'],
        enum: ['LECTURA','QUIZ','CODIGO']
    },
    puntaje: {
        type: Number,
        required: [true, 'El orden es obligatorio']
    },
    orden: {
        type: Number,
        required: [true, 'El puntaje de la lección es obligatorio']
    },
    contenido: [{
        type: Schema.Types.ObjectId,
        ref: 'Contenido',
        required: [true, 'El contenido es obligatorio']
    }],
    pregunta: {
        type: Schema.Types.ObjectId,
        ref: 'Pregunta'
    }
}, { collection: 'lecciones' });

LeccionSchema.methods.toJSON = function() {
    const { __v, _id, ...leccion } = this.toObject();
    leccion.lid = _id;
    return leccion;
}

module.exports = model( 'Leccion', LeccionSchema );