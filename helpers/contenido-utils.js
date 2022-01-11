
const agregarOrdenAContenidoCurso = ( contenidoCurso ) => {
    return contenidoCurso.map((c) => {
        c = c.toJSON();
        c.orden = c.modulo.orden;
        return c;
    });
  };

module.exports = { agregarOrdenAContenidoCurso }