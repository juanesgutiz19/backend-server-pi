const { response, request } = require('express');

const obtenerLeccionesPorIdModulo = async(req, res = response) => {

    const idModulo = req.params.idModulo;

    try {

        res.json({
            ok: true,
            msg: "Obtener lecciones por id de módulo",
            idModulo
        });

        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        })
    }
}

const obtenerEstadoFinalModuloPorId = async(req, res = response) => {

    const idModulo = req.params.idModulo;

    try {
        
        res.json({
            ok: true,
            msg: "Obtener el estado final de un módulo por id",
            idModulo
        });

        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        })
    }
}

const obtenerPuntuacionPorIdModulo = async(req, res = response) => {

    const idModulo = req.params.idModulo;

    try {
        
        res.json({
            ok: true,
            msg: "Obtener puntuación por id de módulo",
            idModulo
        });

        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        })
    }
}

const resetearModuloPorId = async(req, res = response) => {

    const idModulo = req.params.idModulo;

    try {
        
        res.json({
            ok: true,
            msg: "Resetear módulo por id",
            idModulo
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
    obtenerLeccionesPorIdModulo,
    obtenerEstadoFinalModuloPorId,
    obtenerPuntuacionPorIdModulo,
    resetearModuloPorId
}