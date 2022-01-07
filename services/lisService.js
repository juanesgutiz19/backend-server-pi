const axios = require('axios');

const instance = axios.create({
    timeout: 10000,
});

async function loginMares(usuario, contraseña) {
    try {
        // const response = await instance.get(``);
        // return response.data;
        const response = await responseSimulationLogin(usuario, contraseña);
        return response
    } catch (error) {
        return {
            status: error.status,
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

async function obtenerInformacionEstudiantePorCedula(cedulaEstudiante) {
    try {
        // const response = await instance.get(``);
        // return response.data;
        const response = await responseSimulationStudentInformation(cedulaEstudiante);
        return response;
    } catch (error) {
        return {
            status: error.status,
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