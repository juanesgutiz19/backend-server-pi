const { Schema, model } = require('mongoose');

const LeccionSchema = Schema({
    titulo: {
        type: String,
        required: [true, 'El título es obligatorio']
    },
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