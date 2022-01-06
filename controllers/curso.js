const { response } = require('express');

const obtenerContenidoCursoDeUsuario = async(req, res = response) => {
    
    try {
        
        // El id del usuario se extrae del token

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