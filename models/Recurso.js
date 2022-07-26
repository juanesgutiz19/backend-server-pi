const { Schema, model } = require('mongoose');

const RecursoSchema = Schema({
    modulo: {
        type: Schema.Types.ObjectId,
        ref: 'Modulo',
        required: [true, 'El módulo es obligatorio']
    },
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio']
    },
    url: {
        type: String,
        required: [true, 'La url del recurso es obligatoria']
    }
}, { collection: 'recursos' });

RecursoSchema.methods.toJSON = function() {
    const { __v, _id, ...recurso } = this.toObject();
    recurso.rid = _id;
    return recurso;
}

module.exports = model( 'Recurso', RecursoSchema );