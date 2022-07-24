const express = require('express');
const cors = require('cors');
const multer = require('multer');

const { dbConnection } = require('../database/config');

class Server {

    constructor() {
        this.app  = express();
        this.port = process.env.PORT;
        this.authPath = '/api/auth'
        this.leccionesPath = '/api/lecciones';
        this.cursoPath = '/api/curso';
        this.modulosPath = '/api/modulos';
        
        // Conexión a BD 
        this.mongoConnection();

        // Middlewares
        this.middlewares();

        // Rutas de mi aplicación
        this.routes();
    }

    async mongoConnection() {
        await dbConnection();
    }

    middlewares() {

        // CORS
        this.app.use( cors() );

        // Lectura y parseo del body
        this.app.use( express.json() );

        // Directorio Público
        this.app.use( express.static('public') );

    }

    routes() {
        this.app.use( this.leccionesPath, require('../routes/lecciones'));
        this.app.use( this.authPath, require('../routes/auth'));
        this.app.use( this.cursoPath, require('../routes/curso') );
        this.app.use( this.modulosPath, require('../routes/modulos') );
    }

    listen() {
        this.app.listen( this.port, () => {
            console.log('Servidor corriendo en puerto', this.port );
        });
    }

}




module.exports = Server;
