import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getOrder, saveOrder, updateOrder } from './orderStore.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const frontendUrl = (process.env.FRONTEND_URL || process.env.PUBLIC_BASE_URL || '').replace(/\/+$/, '');
const publicBaseUrl = (process.env.PUBLIC_BASE_URL || frontendUrl).replace(/\/+$/, '');
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(currentDir, '..');

const products = {
  'air-force-1-07': { title: "Nike Air Force 1 '07", unit_price: 10000, stock: 8 },
  'jordan-1-retro-high': { title: 'Air Jordan 1 Retro High', unit_price: 249999, stock: 5 },
  'dunk-low-retro': { title: 'Nike Dunk Low Retro', unit_price: 174999, stock: 12 },
  'samba-og': { title: 'adidas Samba OG', unit_price: 159999, stock: 6 },
  'air-max-90': { title: 'Nike Air Max 90', unit_price: 199999, stock: 9 },
  'chuck-taylor-all-star-hi': { title: 'Converse Chuck Taylor All Star Hi', unit_price: 119999, stock: 14 },
};

app.use(express.json({ limit: '20kb' }));
app.use(cors({ origin: frontendUrl || 'http://localhost:5173' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/orders/:orderId', (req, res) => {
  const order = getOrder(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'No se encontró la orden.' });
  return res.json(order);
});

app.post('/api/checkout/preference', async (req, res) => {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(503).json({ error: 'Falta configurar MP_ACCESS_TOKEN en el archivo .env del servidor.' });
  }

  const requestedItems = req.body?.items;
  if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
    return res.status(400).json({ error: 'El carrito está vacío.' });
  }

  const seenIds = new Set();
  const items = [];
  for (const requested of requestedItems) {
    const product = products[requested?.id];
    const quantity = Number(requested?.quantity);
    if (!product || seenIds.has(requested.id)) {
      return res.status(400).json({ error: 'El carrito contiene un producto no válido.' });
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.stock) {
      return res.status(400).json({ error: `La cantidad de ${product.title} supera el stock disponible.` });
    }
    seenIds.add(requested.id);
    items.push({
      id: requested.id,
      title: product.title,
      quantity,
      unit_price: product.unit_price,
      currency_id: 'ARS',
    });
  }

  try {
    const client = new MercadoPagoConfig({ accessToken });
    const preferenceClient = new Preference(client);
    const orderId = `QRM-${randomUUID()}`;
    const orderItems = items.map((item) => ({
      id: item.id,
      title: item.title,
      quantity: item.quantity,
      unitPrice: item.unit_price,
    }));
    const total = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const body = {
      items,
      external_reference: orderId,
    };

    // Mercado Pago rejects localhost return URLs. Add them only for a configured HTTPS site.
    if (frontendUrl.startsWith('https://')) {
      body.back_urls = {
        success: `${frontendUrl}/?pago=success&orden=${encodeURIComponent(orderId)}`,
        pending: `${frontendUrl}/?pago=pending&orden=${encodeURIComponent(orderId)}`,
        failure: `${frontendUrl}/?pago=failure&orden=${encodeURIComponent(orderId)}`,
      };
      body.auto_return = 'approved';
    }
    if (publicBaseUrl.startsWith('https://')) {
      body.notification_url = `${publicBaseUrl}/api/webhooks/mercadopago`;
    }

    const preference = await preferenceClient.create({ body });
    const environment = process.env.MP_ENVIRONMENT || 'sandbox';
    const initPoint = environment === 'sandbox'
      ? preference.sandbox_init_point
      : preference.init_point;

    if (!initPoint) throw new Error(`Mercado Pago no devolvió una URL para el entorno ${environment}.`);
    saveOrder({
      id: orderId,
      items: orderItems,
      total,
      currency: 'ARS',
      status: 'pending',
      preferenceId: preference.id,
      paymentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return res.json({ orderId, preferenceId: preference.id, initPoint });
  } catch (error) {
    console.error('Error al crear preferencia de pago:', error.message);
    return res.status(502).json({ error: 'No se pudo iniciar el pago con Mercado Pago. Revisá las credenciales de prueba.' });
  }
});

function isValidWebhookSignature({ signature, requestId, dataId, secret }) {
  if (!signature || !requestId || !dataId || !secret) return false;
  const parts = Object.fromEntries(signature.split(',').map((part) => {
    const [key, ...valueParts] = part.trim().split('=');
    return [key, valueParts.join('=')];
  }));
  if (!parts.ts || !parts.v1) return false;

  const manifest = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest();
  let received;
  try {
    received = Buffer.from(parts.v1, 'hex');
  } catch {
    return false;
  }
  return received.length === expected.length && timingSafeEqual(received, expected);
}

app.post('/api/webhooks/mercadopago', async (req, res) => {
  const notificationType = req.query.type || req.body?.type;
  if (notificationType && notificationType !== 'payment') return res.sendStatus(200);

  const secret = process.env.MP_WEBHOOK_SECRET;
  const dataId = req.query['data.id'] || req.body?.data?.id;
  const validSignature = isValidWebhookSignature({
    signature: req.headers['x-signature'],
    requestId: req.headers['x-request-id'],
    dataId: dataId == null ? '' : String(dataId),
    secret,
  });
  if (!validSignature) return res.status(401).json({ error: 'Firma de webhook inválida.' });
  if (!process.env.MP_ACCESS_TOKEN) return res.sendStatus(503);

  try {
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const payment = await new Payment(client).get({ id: String(dataId) });
    const orderId = payment.external_reference;
    const order = orderId ? getOrder(orderId) : null;
    if (!order) {
      console.warn('Notificación recibida para una orden que no existe en este proyecto.');
      return res.sendStatus(200);
    }

    const amountMatches = Number(payment.transaction_amount) === order.total;
    const currencyMatches = payment.currency_id === order.currency;
    if (!amountMatches || !currencyMatches) {
      console.error(`Pago ${dataId} no coincide con el total o la moneda de la orden ${orderId}.`);
      return res.sendStatus(200);
    }

    updateOrder(orderId, {
      status: payment.status,
      statusDetail: payment.status_detail || null,
      paymentId: String(payment.id),
      paymentMethod: payment.payment_method_id || null,
      updatedAt: new Date().toISOString(),
    });
    console.log(`Orden ${orderId} actualizada: ${payment.status}.`);
    return res.sendStatus(200);
  } catch (error) {
    console.error('Error al procesar webhook de Mercado Pago:', error.message);
    return res.sendStatus(500);
  }
});

app.use(express.static(path.join(projectDir, 'dist')));

app.listen(port, () => console.log(`Servidor QRMarket listo en http://localhost:${port}`));
