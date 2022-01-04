const { Schema, model } = require('mongoose');

const RachaSchema = Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El usuario es obligatorio']
    },
    puntaje: {
        type: Number,
        required: [true, 'El puntaje es obligatorio']
    },
    fecha: {
        type: Date,
        required: [true, 'La fecha es obligatoria']
    }
}, { collection: 'rachas' });

RachaSchema.methods.toJSON = function() {
    const { __v, _id, ...racha } = this.toObject();
    racha.rid = _id;
    return racha;
}

module.exports = model( 'Racha', RachaSchema );

