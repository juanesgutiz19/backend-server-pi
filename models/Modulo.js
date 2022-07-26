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
    },
    orden: {
        type: Number,
        required: [true, 'El orden del módulo es obligatorio']
    },
    tamañoVisualizacion: {
        type: String,
        required: [true, 'El tamaño de visualización del módulo es obligatorio'],
        enum: ['moduleSm','moduleLg']
    },
    carpetaDestinoRecurso: {
        type: String,
        required: [true, 'La carpeta de destino del recurso es obligatoria']
    },

}, { collection: 'modulos' });

ModuloSchema.methods.toJSON = function() {
    const { __v, _id, ...modulo } = this.toObject();
    modulo.mid = _id;
    return modulo;
}

module.exports = model( 'Modulo', ModuloSchema );


