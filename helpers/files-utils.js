
const generarUrlImagen = ( nombre ) => {
    const coloresFotosDePerfil = ['azul', 'verde', 'naranja', 'rojo', 'amarillo'];
    const indiceAleatorio = Math.floor(Math.random() * (1 - 0 + 1) + 0);
    const colorAleatorio = coloresFotosDePerfil[indiceAleatorio];
    const inicialNombre = nombre.charAt(0).toLowerCase();
    const urlImagen = `${process.env.BASE_URL_S3_BUCKET}/profile-pictures/${inicialNombre}-${colorAleatorio}.jpg`;
    return urlImagen;
};

module.exports = {
    generarUrlImagen
}