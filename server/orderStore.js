import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const directory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const databasePath = path.join(directory, 'qrmarket.sqlite');
const legacyOrdersPath = path.join(directory, 'orders.json');

fs.mkdirSync(directory, { recursive: true });

const database = new DatabaseSync(databasePath);
database.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    order_json TEXT NOT NULL
  )
`);

function migrateLegacyOrders() {
  if (!fs.existsSync(legacyOrdersPath)) return;
  const existing = database.prepare('SELECT COUNT(*) AS count FROM orders').get().count;
  if (existing > 0) return;

  const legacyOrders = JSON.parse(fs.readFileSync(legacyOrdersPath, 'utf8'));
  const insert = database.prepare('INSERT OR IGNORE INTO orders (id, created_at, order_json) VALUES (?, ?, ?)');
  database.exec('BEGIN');
  try {
    for (const order of Object.values(legacyOrders)) {
      if (!order?.id) continue;
      insert.run(order.id, order.createdAt || new Date().toISOString(), JSON.stringify(order));
    }
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

migrateLegacyOrders();

function parseOrder(row) {
  return row ? JSON.parse(row.order_json) : null;
}

export function saveOrder(order) {
  database.prepare(`
    INSERT INTO orders (id, created_at, order_json) VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET created_at = excluded.created_at, order_json = excluded.order_json
  `).run(order.id, order.createdAt || new Date().toISOString(), JSON.stringify(order));
  return order;
}

export function getOrder(orderId) {
  return parseOrder(database.prepare('SELECT order_json FROM orders WHERE id = ?').get(orderId));
}

export function listOrders() {
  return database.prepare('SELECT order_json FROM orders ORDER BY created_at DESC')
    .all()
    .map(parseOrder);
}

export function updateOrder(orderId, updates) {
  const order = getOrder(orderId);
  if (!order) return null;
  return saveOrder({ ...order, ...updates });
}
