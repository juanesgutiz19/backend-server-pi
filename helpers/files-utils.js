
const generarUrlImagen = ( nombre ) => {
    const coloresFotosDePerfil = ['blanco', 'rosado'];
    const indiceAleatorio = Math.floor(Math.random() * (1 - 0 + 1) + 0);
    const colorAleatorio = coloresFotosDePerfil[indiceAleatorio];
    const inicialNombre = nombre.charAt(0).toLowerCase();
    const urlImagen = `${process.env.BASE_URL_S3_BUCKET}/profile-pictures/${inicialNombre}-${colorAleatorio}.jpg`;
    return urlImagen;
};

module.exports = {
    generarUrlImagen
}