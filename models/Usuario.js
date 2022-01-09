const { Schema, model } = require('mongoose');

// No se puso marcaTemporalUltimaLeccionAprobada ni leccionActual como requerido, estar pendiente para
// determinar si no se necesitan obligatorios.
const UsuarioSchema = Schema({
    usuarioInstitucional: {
        type: String,
        required: [true, 'El usuario institucional es obligatorio'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria']
    },
    nombreCompleto: {
        type: String,
        required: [true, 'El nombre completo es obligatorio']
    },
    urlImagen: {
        type: String,
        required: [true, 'La url de la imagen es obligatoria']
    },
    puntajeGlobal: {
        type: Number,
        required: [true, 'El puntaje global es obligatorio']
    },
    rachaDias: {
        type: Number,
        required: [true, 'La racha en días es obligatoria']
    },
    porcentajeProgreso: {
        type: Number,
        required: [true, 'El porcentaje de progreso es obligatorio']
    },
    leccionActual: {
        type: Schema.Types.ObjectId,
        ref: 'Leccion'
    },
    marcaTemporalUltimaLeccionAprobada: {
        type: String,
    },
    rol: {
        type: String,
        required: [true, 'El rol es obligatorio'],
        enum: ['ESTUDIANTE']
    }
    
}, { collection: 'usuarios' });

UsuarioSchema.method('toJSON', function() {
    const { __v, _id, ...usuario } = this.toObject();
    usuario.uid = _id;
    return usuario;
});

module.exports = model('Usuario', UsuarioSchema);