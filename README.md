# QRMarket MP — avance QM1 a QM6

Tienda de zapatillas de muestra, construida con React, Vite y Express.

## Funcionalidades

- **QM1:** catálogo de zapatillas con fotos, precios y stock.
- **QM2:** ficha de producto con selector de cantidad.
- **QM3:** QR único que abre la ficha de cada producto.
- **QM4:** carrito con cantidades, eliminación, subtotal y persistencia en `localStorage`.
- **QM5:** el backend valida el carrito y crea una preferencia de Checkout Pro; el botón abre el enlace de pago de Mercado Pago.
- **QM6:** se puede mostrar un QR que codifica el mismo enlace Checkout Pro para abrirlo desde otro teléfono.

## Preparar credenciales de prueba

1. Copiar `.env.example` como `.env` en la raíz del proyecto.
2. En el panel de desarrolladores de Mercado Pago, crear una aplicación y copiar su **Access Token de prueba**.
3. Pegar ese token en `MP_ACCESS_TOKEN` dentro de `.env`. No compartir ni subir ese archivo.

## Ejecutar

1. Ejecutar `npm install`.
2. Ejecutar `npm run dev`.
3. Abrir la dirección local que muestra Vite, normalmente `http://localhost:5173`.

El comando de desarrollo levanta el servidor Express en el puerto 3001 y Vite en el 5173; Vite reenvía `/api` al backend.
