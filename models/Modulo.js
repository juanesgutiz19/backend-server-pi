const { Schema, model } = require('mongoose');

const ModuloSchema = Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del módulo es obligatorio']
    },
    puntajeMaximo: {
        type: Number,
        required: [true, 'El puntaje máximo es obligatorio']
    },
    urlImagen: {
        type: String,
        required: [true, 'La url de la imagen es obligatoria']
    }
}, { collection: 'modulos' });

ModuloSchema.methods.toJSON = function() {
    const { __v, _id, ...modulo } = this.toObject();
    modulo.mid = _id;
    return modulo;
}

module.exports = model( 'Modulo', ModuloSchema );


