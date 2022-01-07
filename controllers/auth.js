const { response } = require('express');
const bcrypt = require('bcryptjs');

const { generarJWT } = require('../helpers/jwt')
const Usuario = require('../models/Usuario');

const { loginMares, obtenerInformacionEstudiantePorCedula } = require('../services/lisService');

const login = async(req, res = response) => {

    const { usuario, contraseña } = req.body;
    
    try {
        const responseLogin = await loginMares(usuario, contraseña);
        console.log(responseLogin);

        if( responseLogin.status === 200 ){
            const cedula = responseLogin.data.res;
            const responseInfo = await obtenerInformacionEstudiantePorCedula(cedula);
            console.log(responseInfo);  
        }
        
        // Generar JWT
        // const token = await generarJWT(user.id, user.fullName, user.username, user.identification, user.universityRole);


        res.json({
            ok: true,
            msg: "Login",
            usuario,
            contraseña,
            token: '3r8943jr##io90r4kf'
        });

        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Por favor hable con el administrador'
        })
    }
}

const renovarToken = async(req, res = response) => {

    // const { uid  } = req;
    
    //Generar JWT
    // const token = await generarJWT( uid );

    res.json({
        ok: true,
        msg: "Renovar token",
        // token
    });
}

module.exports = { 
    login,
    renovarToken
}