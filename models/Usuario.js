const { Schema, model } = require('mongoose');

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
        type: Number
    },
    rachaDias: {
        type: Number
    },
    porcentajeProgreso: {
        type: Number
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
        enum: ['ESTUDIANTE', 'ADMIN']
    }
    
}, { collection: 'usuarios' });

UsuarioSchema.method('toJSON', function() {
    const { __v, _id, ...usuario } = this.toObject();
    usuario.uid = _id;
    return usuario;
});

module.exports = model('Usuario', UsuarioSchema);