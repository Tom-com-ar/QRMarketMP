# QRMarket MP — avance QM1, QM2 y QM3

Primera versión de la tienda de ejemplo para la actividad. Está hecha con React y Vite. Los productos de muestra viven en `src/App.jsx`.

## Requisitos incluidos

- **QM1 — Catálogo:** grilla de productos con imagen, nombre, precio y stock.
- **QM2 — Página del producto:** detalle, descripción, selector de cantidad y botón con confirmación visual de “Agregar al carrito”. El carrito completo corresponde a QM4 y queda fuera de este avance.
- **QM3 — QR por producto:** cada detalle genera un QR distinto que apunta a la dirección de esa página, por ejemplo `?producto=mate-ceramica`.

## Ejecutar en la computadora

1. Instalar Node.js y npm.
2. Desde esta carpeta ejecutar `npm install`.
3. Ejecutar `npm run dev` y abrir la dirección local que muestra la terminal.

Para que un teléfono pueda abrir el QR, la tienda necesita estar publicada en una dirección accesible por Internet. Mientras se ejecuta localmente, el QR apunta a la dirección local.

## Para explicar en clase

- `products` es el catálogo de datos: cada objeto guarda identificador, nombre, categoría, precio, stock, descripción e imagen.
- La pantalla inicial recorre `products` y dibuja una tarjeta por producto.
- Al elegir una tarjeta, la aplicación guarda su `id` en la URL. Con ese identificador busca los datos y muestra el detalle.
- `QRCodeSVG` convierte esa URL en una imagen QR. Como la URL incluye el identificador, cada producto tiene su propio código.
- `quantity` controla el selector de unidades. El botón muestra una confirmación; todavía no guarda productos en un carrito porque eso es QM4.
