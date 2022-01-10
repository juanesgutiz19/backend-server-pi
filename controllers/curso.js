const { response } = require('express');
const { SeguimientoModulo } = require('../models/Seguimiento');
const Modulo = require('../models/Modulo');

var mongoose = require('mongoose');


const obtenerContenidoCursoDeUsuario = async(req, res = response) => {

    const { uid } = req;
    
    try {
        

        // El id del usuario se extrae del token
        // const seguimientoModuloUsuario = await SeguimientoModulo.find( { usuario: uid } );
        // console.log(seguimientoModuloUsuario.length);
        const modulos = await Modulo.find( {} );
        // console.log(modulos);

        modulos.forEach(async (item, index) => {
            console.log(item._id.toString());
            const idModulo = item._id;
            // const idModuloString = idModulo.toString();

            // let objectId = mongoose.Types.ObjectId(idModuloString);
            // console.log('------------------');
            // const uidMongo = mongoose.Types.ObjectId(uid);
            // console.log(uid, objectId);


            const seguimientoModuloUsuario = await SeguimientoModulo.find( { usuario: uid, modulo: idModulo } );
            console.log(index, seguimientoModuloUsuario);

        });
        res.json({
            ok: true,
            msg: "Obtener contenido curso por usuario"
        });

        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        })
    }
}

const obtenerTopEstudiantesPorClasificacion = async(req, res = response) => {
    
    const tipoTop = req.params.tipoTop;

    try {
        

        res.json({
            ok: true,
            msg: "Obtener top estudiantes por clasificación",
            tipoTop
        });

        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        })
    }
}


const obtenerRachaUltimosSieteDias = async(req, res = response) => {
    
    try {
        
        // El id del usuario se extrae del token

        res.json({
            ok: true,
            msg: "Obtener racha últimos siete días"
        });

        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        })
    }
}


module.exports = {
    obtenerContenidoCursoDeUsuario,
    obtenerTopEstudiantesPorClasificacion,
    obtenerRachaUltimosSieteDias
}