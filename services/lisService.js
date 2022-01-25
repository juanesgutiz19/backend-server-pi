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

let responseSimulationLogin = (usuario, contraseña) => {

    return new Promise((resolve, reject) => {

        if ( contraseña.length > 5) {
            reject({
                status: 500,
                message: "La contraseña no puede tener más de 5 caracteres"
            });
            return;
        }
        
        let status;
        if( usuario === "juan.gutierrez41" && contraseña === "12345"){
            status = 200;
            resolve({
                status,
                data: {
                    res: '1152225177'
                }
            });
        } else if ( usuario === "juan.rios27" && contraseña === "12345" ){
            status = 200;
            resolve({
                status,
                data: {
                    res: '123456789'
                }
            });
        } else {
            status = 404;
            resolve({
                status,
                data: {
                    res: ''
                }
            });
        }
    });
}

async function obtenerInformacionEstudiantePorCedula(cedula) {
    try {
        let bodyCedula = {
            cedula
        }
        const responseAcademicInfo = await instance.post(`${process.env.BASE_URL_API_LIS}/prod/consultainformacionacademicamares`, bodyCedula);
        console.log(responseAcademicInfo);
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

let responseSimulationStudentInformation = (id) => {

    return new Promise((resolve, reject) => {

        if ( id.length < 5) {
            reject({
                status: 500,
                message: "El id no puede tener menos de 5 carácteres"
            });
            return;
        }
        
        let status;
        if( id === "1152225177"){
            status = 200;
            resolve({
                status,
                data: {
                    nombreCompleto: "JUAN ESTEBAN GUTIÉRREZ ZULUAGA",
                    // 104: Facultad de Ingeniería
                    facultadCode: 104
                }
            });
        } else if ( id === "123456789" ) {
            status = 200;
            resolve({
                status,
                data: {
                    // 106: Facultad de Ciencias Económicas
                    nombreCompleto: "JUAN FERNANDO RÍOS FRANCO",
                    facultadCode: 106
                }
            });
        } else {
            status = 404;
            resolve({
                status,
                data: {}
            });
        }
    });
}


module.exports = {
    loginMares,
    obtenerInformacionEstudiantePorCedula
}