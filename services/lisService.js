const axios = require('axios');
const { capitalizeName } = require('../helpers/string-utils');

const instance = axios.create({
    timeout: 40000,
    headers: {'X-Custom-Header': 'foobar'}
    });

async function loginMares(usuario, contraseña) {
    try {
        const bodyUsuario = {
            usuario,
            clave: contraseña
        }
        const response = await instance.post(`${process.env.BASE_URL_API_LIS}/prod/validarusuariooidxcn`, bodyUsuario);
        dataResponse = response.data;
        dataResponseSinEspaciosAlFinal = dataResponse.trim();
        const arregloResponse = dataResponseSinEspaciosAlFinal.substring(0, 8).split(' ');
        let status = 200;
        if (arregloResponse[0] === 'ERROR') {
            if ( arregloResponse[1] === '01'){
                status = 400;
                message = 'El usuario o clave son incorrectos';
            } else if ( arregloResponse[1] === '02' ) {
                status = 404;
                message = 'Ocurrió un error al validar el usuario, recuerde usar su cuenta institucional';
            }
            return {
                status,
                message
            }
        } 
        return {
            status,
            data: dataResponseSinEspaciosAlFinal
        };
    } catch (error) {
        console.log(error);
        return {
            status: 500,
            message: error.message
        };
    }
}

async function obtenerInformacionEstudiantePorCedula(cedula) {
    try {
        let bodyCedula = {
            cedula
        }
        const responseAcademicInfo = await instance.post(`${process.env.BASE_URL_API_LIS}/test/consultainformacionacademicamares`, bodyCedula);
        const { facultad } = responseAcademicInfo.data[0];
        let data = {};
        let status = 200;
        if ( facultad === "25" ) {
            bodyCedula = {
                cedulas: cedula
            }
            const responsePersonInfo = await instance.post(`${process.env.BASE_URL_API_LIS}/test/consultainfopersonasmares`, bodyCedula);
            const { nombre, primerApellido, segundoApellido } = responsePersonInfo.data[0];
            let nombreCompleto = capitalizeName(`${nombre} ${primerApellido} ${segundoApellido}`.toLowerCase());
            data = {
                nombreCompleto,
                facultadCode: facultad
            }
            return {
                status,
                data
            }
        } 
        return {
            status,
            data: {
                facultadCode: facultad
            }
        }
    } catch (error) {
        return {
            status: 500,
            message: error.message
        };
    }
}

module.exports = {
    loginMares,
    obtenerInformacionEstudiantePorCedula
}