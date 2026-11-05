import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');
const storePath = path.join(directory, 'orders.json');

function readOrders() {
  try {
    return JSON.parse(fs.readFileSync(storePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

function writeOrders(orders) {
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(orders, null, 2), 'utf8');
}

export function saveOrder(order) {
  const orders = readOrders();
  orders[order.id] = order;
  writeOrders(orders);
  return order;
}

export function getOrder(orderId) {
  return readOrders()[orderId] || null;
}

export function listOrders() {
  return Object.values(readOrders());
}

export function updateOrder(orderId, updates) {
  const orders = readOrders();
  if (!orders[orderId]) return null;
  orders[orderId] = { ...orders[orderId], ...updates };
  writeOrders(orders);
  return orders[orderId];
}
