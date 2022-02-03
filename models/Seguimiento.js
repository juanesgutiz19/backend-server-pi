const { Schema, model } = require('mongoose');

const SeguimientoModulo = Schema({
    modulo: {
        type: Schema.Types.ObjectId,
        ref: 'Modulo',
        required: [true, 'El módulo es obligatorio']
    },
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El usuario es obligatorio']
    },
    puntajeAcumulado: {
        type: Number,
        required: [true, 'El puntaje acumulado es obligatorio']
    },
    estado: {
        type: String,
        required: [true, 'El estado es obligatorio'],
        enum: ['APROBADO','REPROBADO','EN_CURSO', 'BLOQUEADO']
    }
}, { collection: 'seguimientosModulos' });

SeguimientoModulo.methods.toJSON = function() {
    const { __v, _id, ...seguimientoModulo } = this.toObject();
    seguimientoModulo.smid = _id;
    return seguimientoModulo;
}

const SeguimientoLeccion = Schema({
    leccion: {
        type: Schema.Types.ObjectId,
        ref: 'Leccion',
        required: [true, 'La lección es obligatoria']
    },
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El usuario es obligatorio']
    },
    vidasPerdidas: {
        type: Number,
        required: [true, 'Las vidas perdidas son obligatorias']
    },
    puntajeObtenido: {
        type: Number,
        required: [true, 'El puntaje obtenido es obligatorio']
    },
    estado: {
        type: String,
        required: [true, 'El estado es obligatorio'],
        enum: ['VISTA', 'EN_CURSO', 'BLOQUEADA']
    }
}, { collection: 'seguimientosLecciones' });

SeguimientoLeccion.methods.toJSON = function() {
    const { __v, _id, ...seguimientoLeccion } = this.toObject();
    seguimientoLeccion.slid = _id;
    return seguimientoLeccion;
}

// La importación sería: const { SeguimientoLeccion, SeguimientoModulo } = require('../models/Seguimiento');
module.exports = {
    SeguimientoLeccion: model( 'SeguimientoLeccion', SeguimientoLeccion ),
    SeguimientoModulo: model( 'SeguimientoModulo', SeguimientoModulo )
}