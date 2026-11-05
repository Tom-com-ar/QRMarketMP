# QRMarket MP — avance QM1 a QM9

Tienda de zapatillas de muestra, construida con React, Vite y Express.

## Funcionalidades

- **QM1:** catálogo de zapatillas con fotos, precios y stock.
- **QM2:** ficha de producto con selector de cantidad.
- **QM3:** QR único que abre la ficha de cada producto.
- **QM4:** carrito con cantidades, eliminación, subtotal y persistencia en `localStorage`.
- **QM5:** el backend valida el carrito y crea una preferencia de Checkout Pro; el botón abre el enlace de pago de Mercado Pago.
- **QM6:** se puede mostrar un QR que codifica el mismo enlace Checkout Pro para abrirlo desde otro teléfono.
- **QM7:** el backend valida la firma del webhook, consulta el pago directamente en Mercado Pago y actualiza la orden guardada en `server/data/orders.json`.
- **QM8:** el carrito acepta el cupón `CUPON` (50% de descuento); el servidor lo valida y calcula el total antes de crear el pago.
- **QM9:** el carrito calcula el envío por código postal: CABA (1000–1499), $5.000; Gran Buenos Aires (1500–1999), $8.000; interior (2000–9999), $12.000. Desde $250.000 después del cupón, el envío es gratis. El servidor vuelve a calcularlo e incluye su costo en el pago. Son tarifas de demostración, no una cotización de un correo.

## Preparar credenciales de prueba

1. Copiar `.env.example` como `.env` en la raíz del proyecto.
2. En el panel de desarrolladores de Mercado Pago, crear una aplicación y copiar su **Access Token de prueba**.
3. Pegar ese token en `MP_ACCESS_TOKEN` dentro de `.env`. No compartir ni subir ese archivo.

## Ejecutar

1. Ejecutar `npm install`.
2. Ejecutar `npm run dev`.
3. Abrir la dirección local que muestra Vite, normalmente `http://localhost:5173`.

El comando de desarrollo levanta el servidor Express en el puerto 3001 y Vite en el 5173; Vite reenvía `/api` al backend.

## Preparar y probar QM7 en desarrollo

1. Ejecutar `npm run build` para que Express pueda servir la tienda al volver desde Mercado Pago.
2. En una segunda terminal, exponer el puerto del backend con `ngrok http 3001` y copiar su dirección pública HTTPS.
3. Pegar esa dirección sin `/` final en `PUBLIC_BASE_URL` y `FRONTEND_URL` dentro de `.env`.
4. En Mercado Pago Developers, abrir la aplicación y configurar Webhooks para el entorno de prueba. Elegir el evento **Pagos** y usar `https://TU-DIRECCION/api/webhooks/mercadopago`. Copiar la clave secreta generada a `MP_WEBHOOK_SECRET`.
5. Reiniciar `npm run dev`, crear una compra sandbox y usar el panel de Webhooks para simular una notificación de pago con el ID de pago de prueba.
6. Al volver a la tienda, la orden consulta el estado guardado y lo muestra. También se puede consultar `http://localhost:3001/api/orders/ID-DE-ORDEN`.

Importante: Mercado Pago indica que los pagos hechos con credenciales de prueba no envían webhooks automáticamente. Para probar la recepción, hay que usar el simulador de Webhooks en Tus integraciones. Las notificaciones se firman con `x-signature` y se validan con `MP_WEBHOOK_SECRET`.
