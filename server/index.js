import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const port = Number(process.env.PORT || 3001);
const frontendUrl = process.env.FRONTEND_URL || '';
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
    const body = {
      items,
      external_reference: `QRM-${Date.now()}`,
    };

    // Mercado Pago rejects localhost return URLs. Add them only for a configured HTTPS site.
    if (frontendUrl.startsWith('https://')) {
      body.back_urls = {
        success: `${frontendUrl}/?pago=success`,
        pending: `${frontendUrl}/?pago=pending`,
        failure: `${frontendUrl}/?pago=failure`,
      };
      body.auto_return = 'approved';
    }

    const preference = await preferenceClient.create({ body });
    const environment = process.env.MP_ENVIRONMENT || 'sandbox';
    const initPoint = environment === 'sandbox'
      ? preference.sandbox_init_point
      : preference.init_point;

    if (!initPoint) throw new Error(`Mercado Pago no devolvió una URL para el entorno ${environment}.`);
    return res.json({ preferenceId: preference.id, initPoint });
  } catch (error) {
    console.error('Error al crear preferencia de pago:', error.message);
    return res.status(502).json({ error: 'No se pudo iniciar el pago con Mercado Pago. Revisá las credenciales de prueba.' });
  }
});

app.use(express.static(path.join(projectDir, 'dist')));

app.listen(port, () => console.log(`Servidor QRMarket listo en http://localhost:${port}`));
