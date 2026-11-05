export const FREE_SHIPPING_THRESHOLD = 250000;

export function getShippingQuote(postalCode, merchandiseTotal) {
  const code = String(postalCode || '').trim();
  if (!/^\d{4}$/.test(code) || Number(code) < 1000 || Number(code) > 9999) return null;

  let zone;
  let baseCost;
  if (Number(code) <= 1499) {
    zone = 'CABA';
    baseCost = 5000;
  } else if (Number(code) <= 1999) {
    zone = 'Gran Buenos Aires';
    baseCost = 8000;
  } else {
    zone = 'Interior del país';
    baseCost = 12000;
  }

  const freeShipping = merchandiseTotal >= FREE_SHIPPING_THRESHOLD;
  return {
    postalCode: code,
    zone,
    cost: freeShipping ? 0 : baseCost,
    freeShipping,
  };
}
