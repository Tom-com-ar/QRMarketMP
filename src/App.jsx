import { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getShippingQuote } from './shipping.js';

const products = [
  {
    id: 'air-force-1-07',
    name: 'Air Force 1 ’07',
    category: 'Nike · Clásicos',
    price: 10000,
    stock: 8,
    image: 'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto%2Cu_9ddf04c7-2a9a-4d76-add1-d15af8f0263d%2Cc_scale%2Cfl_relative%2Cw_1.0%2Ch_1.0%2Cfl_layer_apply/b7d9211c-26e7-431a-ac24-b0540fb3c00f/AIR%2BFORCE%2B1%2B%2707.png',
    description: 'Un ícono que no necesita presentación: cuero suave, amortiguación Air y una silueta que combina con todo.',
    color: 'arena',
  },
  {
    id: 'jordan-1-retro-high',
    name: 'Air Jordan 1 Retro High',
    category: 'Jordan · Íconos',
    price: 249999,
    stock: 5,
    image: 'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto%2Cu_126ab356-44d8-4a06-89b4-fcdcc8df0245%2Cc_scale%2Cfl_relative%2Cw_1.0%2Ch_1.0%2Cfl_layer_apply/a4ab0300-a514-4e86-b5be-d2ac53ef1ea8/AIR%2BJORDAN%2B1%2BRETRO%2BHIGH%2BOG.png',
    description: 'La silueta de básquet que cambió la cultura sneaker. Capellada de cuero y perfil high en gris, blanco y azul.',
    color: 'lavanda',
  },
  {
    id: 'dunk-low-retro',
    name: 'Dunk Low Retro',
    category: 'Nike · Streetwear',
    price: 174999,
    stock: 12,
    image: 'https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto%2Cu_9ddf04c7-2a9a-4d76-add1-d15af8f0263d%2Cc_scale%2Cfl_relative%2Cw_1.0%2Ch_1.0%2Cfl_layer_apply/3caf27f3-76b0-469a-b938-121a6e96c189/NIKE%2BDUNK%2BLOW%2BRETRO.png',
    description: 'Dunk Low Retro en blanco, verde y suela gum. Inspiradas en las canchas de los 80 y adoptadas por la calle.',
    color: 'rosa',
  },
  {
    id: 'samba-og',
    name: 'Samba OG',
    category: 'Adidas · Terrace',
    price: 159999,
    stock: 6,
    image: 'https://assets.adidas.com/images/w_500%2Cf_auto%2Cq_auto/ac44a2bb02354483afb9e9c11aff08e8_9366/SAMBA_OG_SHOES_White_KJ7435_01_00_standard.jpg',
    description: 'Nacidas para el fútbol sala y convertidas en un básico urbano. Perfil bajo, detalles retro y suela de goma.',
    color: 'celeste',
  },
  {
    id: 'air-max-90',
    name: 'Air Max 90',
    category: 'Nike · Retro',
    price: 199999,
    stock: 9,
    image: 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto%2Cq_auto%3Aeco%2Cu_9ddf04c7-2a9a-4d76-add1-d15af8f0263d%2Cc_scale%2Cfl_relative%2Cw_1.0%2Ch_1.0%2Cfl_layer_apply/b18d3d86-7257-4e9b-8aa8-5f9d5b3d92b9/AIR%2BMAX%2B90.png',
    description: 'Air Max 90 blanca y gris, con cámara Max Air visible y suela Waffle inspirada en el running de los 90.',
    color: 'arena',
  },
  {
    id: 'chuck-taylor-all-star-hi',
    name: 'Chuck Taylor All Star Hi',
    category: 'Converse · Clásicos',
    price: 119999,
    stock: 14,
    image: 'https://c.static-nike.com/a/images/t_PDP_1280_v1/f_auto/toqshuuheqdl3ljzobnc/converse-chuck-taylor-all-star-high-top-unisex-shoe-xX439O.jpg',
    description: 'La clásica Chuck Taylor de lona negra, con caña alta, parche All Star y suela de goma blanca.',
    color: 'lavanda',
  },
];

const money = (amount) => new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
}).format(amount);

function App() {
  const [selectedId, setSelectedId] = useState(() => new URLSearchParams(window.location.search).get('producto'));
  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('vista') || (params.has('producto') ? 'product' : 'catalog');
  });
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [shippingMessage, setShippingMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [payment, setPayment] = useState(null);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [returnedOrder, setReturnedOrder] = useState(null);
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('qrmarket-cart') || '[]'); }
    catch { return []; }
  });
  const selectedProduct = products.find((product) => product.id === selectedId);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.id);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
  const cartDiscount = appliedCoupon ? Math.round(cartTotal * appliedCoupon.percentage / 100) : 0;
  const checkoutTotal = cartTotal - cartDiscount;
  const shippingQuote = shippingPostalCode
    ? getShippingQuote(shippingPostalCode, checkoutTotal)
    : null;
  const finalTotal = checkoutTotal + (shippingQuote?.cost || 0);
  const visibleProducts = activeFilter === 'Todos'
    ? products
    : products.filter((product) => product.category.toLowerCase().includes(activeFilter.toLowerCase()));

  const productUrl = useMemo(() => {
    if (!selectedProduct) return '';
    const url = new URL(window.location.href);
    url.search = `?producto=${encodeURIComponent(selectedProduct.id)}`;
    url.hash = '';
    return url.toString();
  }, [selectedProduct]);

  useEffect(() => {
    localStorage.setItem('qrmarket-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get('orden');
    if (!orderId) return undefined;
    let active = true;
    let attempts = 0;
    let timer;
    const refreshOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
        if (response.ok) {
          const order = await response.json();
          if (!active) return;
          setReturnedOrder(order);
          if (order.status !== 'pending' || attempts >= 7) return;
        }
      } catch {
        if (!active) return;
      }
      attempts += 1;
      timer = window.setTimeout(refreshOrder, 2500);
    };
    refreshOrder();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  function openProduct(product) {
    setSelectedId(product.id);
    setView('product');
    setQuantity(1);
    setNotice('');
    const url = new URL(window.location.href);
    url.search = `?producto=${encodeURIComponent(product.id)}`;
    window.history.pushState({}, '', url);
  }

  function goToCatalog() {
    setSelectedId(null);
    setView('catalog');
    setNotice('');
    window.history.pushState({}, '', window.location.pathname);
  }

  function addToCart() {
    const inCart = cart.find((item) => item.id === selectedProduct.id)?.quantity || 0;
    const added = Math.min(quantity, selectedProduct.stock - inCart);
    if (added <= 0) {
      setNotice('Ya alcanzaste el stock disponible de este modelo.');
      return;
    }
    setCart((items) => {
      const existing = items.find((item) => item.id === selectedProduct.id);
      return existing
        ? items.map((item) => item.id === selectedProduct.id ? { ...item, quantity: Math.min(selectedProduct.stock, item.quantity + added) } : item)
        : [...items, { id: selectedProduct.id, quantity: added }];
    });
    setNotice(`${added} ${added === 1 ? 'par agregado' : 'pares agregados'} al carrito.`);
  }

  function openCart() {
    setSelectedId(null);
    setView('cart');
    setNotice('');
    window.history.pushState({}, '', `${window.location.pathname}?vista=carrito`);
  }

  function applyCoupon(event) {
    event.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (code === 'CUPON') {
      setAppliedCoupon({ code, percentage: 50 });
      setCouponInput(code);
      setCouponMessage('Cupón aplicado: 50% de descuento.');
      return;
    }
    setAppliedCoupon(null);
    setCouponMessage('Ese código no es válido. Revisá e intentá otra vez.');
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponMessage('Se quitó el cupón.');
  }

  function calculateShipping(event) {
    event.preventDefault();
    const quote = getShippingQuote(postalCode, checkoutTotal);
    if (!quote) {
      setShippingPostalCode('');
      setShippingMessage('Ingresá un código postal válido de 4 dígitos (del 1000 al 9999).');
      return;
    }
    setShippingPostalCode(quote.postalCode);
    setShippingMessage('');
  }

  async function createCheckout() {
    setCreatingPayment(true);
    setNotice('');
    try {
      const response = await fetch('/api/checkout/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(({ id, quantity }) => ({ id, quantity })),
          couponCode: appliedCoupon?.code || null,
          postalCode: shippingPostalCode,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo iniciar el pago.');
      setPayment(data);
      setView('payment');
      window.history.pushState({}, '', `${window.location.pathname}?vista=pago`);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setCreatingPayment(false);
    }
  }

  function changeCartQuantity(product, amount) {
    setCart((items) => items.map((item) => item.id === product.id
      ? { ...item, quantity: Math.max(0, Math.min(product.stock, item.quantity + amount)) }
      : item).filter((item) => item.quantity > 0));
  }

  function removeFromCart(productId) {
    setCart((items) => items.filter((item) => item.id !== productId));
  }

  async function copyProductLink() {
    await navigator.clipboard.writeText(productUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (view === 'cart') {
    return (
      <main className="page-shell">
        <header className="topbar">
          <button className="brand" onClick={goToCatalog}><span className="brand-mark">q</span><span>qrmarket<span className="brand-dot">.</span></span></button>
          <span className="top-note">TU SELECCIÓN</span>
          <button className="text-button" onClick={goToCatalog}>← Seguir mirando</button>
        </header>
        <section className="cart-page">
          <p className="eyebrow">QRMARKET · TU PEDIDO</p>
          <div className="cart-title-row"><h1>Tu carrito<span>.</span></h1><span className="product-count">{cartCount} {cartCount === 1 ? 'par' : 'pares'}</span></div>
          {cart.length === 0 ? (
            <div className="empty-cart"><span className="empty-cart-mark">＋</span><h2>Está un poco vacío por acá.</h2><p>Explorá la colección y sumá tu próximo par.</p><button className="primary-button empty-cart-button" onClick={goToCatalog}>Ver zapatillas <span>↗</span></button></div>
          ) : (
            <div className="cart-layout">
              <div className="cart-items">
                {cart.map((item) => {
                  const product = products.find((entry) => entry.id === item.id);
                  if (!product) return null;
                  return <article className="cart-item" key={item.id}>
                    <button className="cart-item-image" onClick={() => openProduct(product)} aria-label={`Ver ${product.name}`}><img src={product.image} alt={product.name} /></button>
                    <div className="cart-item-info"><p className="eyebrow">{product.category}</p><button className="cart-item-name" onClick={() => openProduct(product)}>{product.name}</button><span className="cart-item-stock">{product.stock} disponibles</span><button className="remove-item" onClick={() => removeFromCart(product.id)}>Quitar</button></div>
                    <div className="cart-item-end"><strong>{money(product.price * item.quantity)}</strong><div className="quantity-control cart-quantity"><button onClick={() => changeCartQuantity(product, -1)} aria-label={`Restar ${product.name}`}>−</button><span>{item.quantity}</span><button onClick={() => changeCartQuantity(product, 1)} aria-label={`Sumar ${product.name}`} disabled={item.quantity >= product.stock}>+</button></div></div>
                  </article>;
                })}
              </div>
              <aside className="cart-summary"><p className="eyebrow">RESUMEN</p><div><span>Subtotal</span><strong>{money(cartTotal)}</strong></div>
                <form className="coupon-form" onSubmit={applyCoupon}>
                  <label htmlFor="coupon-code">Cupón de descuento</label>
                  <div className="coupon-controls"><input id="coupon-code" value={couponInput} onChange={(event) => setCouponInput(event.target.value)} placeholder="Ingresá tu código" aria-describedby="coupon-help" readOnly={Boolean(appliedCoupon)} /><button type="submit" disabled={!couponInput.trim() || Boolean(appliedCoupon)}>Aplicar</button></div>
                </form>
                {couponMessage && <p className={`coupon-message ${appliedCoupon ? 'coupon-success' : ''}`} role="status">{couponMessage}{appliedCoupon && <button type="button" onClick={removeCoupon}>Quitar</button>}</p>}
                {appliedCoupon && <div className="coupon-discount"><span>Descuento ({appliedCoupon.code})</span><strong>− {money(cartDiscount)}</strong></div>}
                <form className="shipping-form" onSubmit={calculateShipping}>
                  <label htmlFor="postal-code">Calculá el envío por código postal</label>
                  <div className="shipping-controls"><input id="postal-code" inputMode="numeric" maxLength={4} value={postalCode} onChange={(event) => { setPostalCode(event.target.value.replace(/\D/g, '').slice(0, 4)); setShippingPostalCode(''); setShippingMessage(''); }} placeholder="Ej.: 1000" /><button type="submit" disabled={postalCode.length !== 4}>Calcular</button></div>
                  {shippingMessage && <small className="shipping-error" role="alert">{shippingMessage}</small>}
                  {shippingQuote && <small className="shipping-result" role="status">{shippingQuote.zone} · {shippingQuote.freeShipping ? 'Envío gratis por superar $250.000' : money(shippingQuote.cost)}</small>}
                </form>
                <div className="shipping-total-row"><span>Envío</span><strong>{shippingQuote ? (shippingQuote.cost ? money(shippingQuote.cost) : 'Gratis') : 'A calcular'}</strong></div>
                <div className="cart-total"><span>Total</span><strong>{money(finalTotal)}</strong></div><p className="cart-summary-note">El envío es gratis en compras desde $250.000. Pago seguro con Mercado Pago.</p>{notice && <p className="notice" role="alert">{notice}</p>}<button className="primary-button" onClick={createCheckout} disabled={creatingPayment || !shippingQuote}>{creatingPayment ? 'Conectando…' : 'Continuar al pago'} <span>↗</span></button></aside>
            </div>
          )}
        </section>
        <footer className="footer"><span>QRMarket · Selección sneaker</span><span>Modelos icónicos, todos los días.</span></footer>
      </main>
    );
  }

  if (view === 'payment' && payment) {
    return (
      <main className="page-shell">
        <header className="topbar"><button className="brand" onClick={openCart}><span className="brand-mark">q</span><span>qrmarket<span className="brand-dot">.</span></span></button><span className="top-note">PAGO SEGURO · MERCADO PAGO</span><button className="text-button" onClick={openCart}>← Volver al carrito</button></header>
        <section className="payment-page">
          <p className="eyebrow">QRMARKET · CHECKOUT</p>
          <h1>¿Cómo querés<br /><em>pagar?</em></h1>
          <div className="payment-options">
            <article className="payment-option payment-redirect"><span className="payment-step">01 / CHECKOUT PRO</span><h2>Continuar en Mercado Pago</h2><p>Se abre el entorno seguro de Mercado Pago para elegir cómo pagar.</p><button className="primary-button" onClick={() => window.location.assign(payment.initPoint)}>Ir a Mercado Pago <span>↗</span></button></article>
            <article className="payment-option payment-qr"><span className="payment-step">02 / PAGO CON QR</span><h2>Escaneá para continuar</h2><p>Escaneá este código con la cámara del teléfono y abrí el enlace de pago.</p><div className="payment-qr-box"><QRCodeSVG value={payment.initPoint} size={192} bgColor="#ffffff" fgColor="#161719" level="H" includeMargin /></div><small>Preferencia {payment.preferenceId}</small></article>
          </div>
          <p className="payment-footnote">El QR abre el mismo Checkout Pro de Mercado Pago. La confirmación del pago ocurre en Mercado Pago.</p>
        </section>
        <footer className="footer"><span>QRMarket · Selección sneaker</span><span>Modelos icónicos, todos los días.</span></footer>
      </main>
    );
  }

  if (selectedProduct && view === 'product') {
    return (
      <main className="page-shell">
        <header className="topbar">
          <button className="brand" onClick={goToCatalog} aria-label="Volver al catálogo">
            <span className="brand-mark">q</span><span>qrmarket<span className="brand-dot">.</span></span>
          </button>
          <span className="top-note">SNEAKERS AUTÉNTICAS · ENVÍOS A TODO EL PAÍS</span>
          <div className="detail-header-actions"><button className="cart-button" onClick={openCart}>Carrito <span className="cart-count">{cartCount}</span></button><button className="text-button" onClick={goToCatalog}>← Catálogo</button></div>
        </header>
        <section className="detail-layout">
          <div className="detail-photo-wrap">
            <img className="detail-photo" src={selectedProduct.image} alt={selectedProduct.name} />
            <span className={`photo-sticker ${selectedProduct.color}`}>THE<br />SNEAKER<br />EDIT</span>
          </div>
          <div className="detail-copy">
            <p className="eyebrow">{selectedProduct.category} <span>·</span> Pieza seleccionada</p>
            <h1>{selectedProduct.name}</h1>
            <p className="detail-price">{money(selectedProduct.price)}</p>
            <p className="detail-description">{selectedProduct.description}</p>
            <p className="stock"><span className="stock-dot" /> {selectedProduct.stock} disponibles</p>
            <div className="purchase-row">
              <label className="quantity-control">
                <span className="sr-only">Cantidad</span>
                <button onClick={() => setQuantity((n) => Math.max(1, n - 1))} aria-label="Restar una unidad">−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity((n) => Math.min(selectedProduct.stock, n + 1))} aria-label="Sumar una unidad">+</button>
              </label>
              <button className="primary-button" onClick={addToCart}>Agregar al carrito <span>↗</span></button>
            </div>
            {notice && <p className="notice" role="status">{notice}</p>}
            <div className="qr-panel">
              <div className="qr-heading"><span className="qr-icon">⌗</span><div><strong>Tu QR de este producto</strong><small>Escanealo para volver a esta página</small></div></div>
              <div className="qr-box"><QRCodeSVG value={productUrl} size={142} bgColor="#fffdf9" fgColor="#252c27" level="H" includeMargin /></div>
              <span className="qr-caption">QR único · {selectedProduct.id}</span>
              <div className="qr-actions"><button onClick={copyProductLink}>{copied ? 'Enlace copiado ✓' : 'Copiar enlace'}</button></div>
            </div>
          </div>
        </section>
        <footer className="footer"><span>QRMarket · Selección sneaker</span><span>Modelos icónicos, todos los días.</span></footer>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#inicio"><span className="brand-mark">q</span><span>qrmarket<span className="brand-dot">.</span></span></a>
        <span className="top-note">SNEAKERS AUTÉNTICAS · ENVÍOS A TODO EL PAÍS</span>
        <button className="cart-button" onClick={openCart}>Carrito <span className="cart-count">{cartCount}</span></button>
      </header>
      <section className="hero" id="inicio">
        <div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line" /> QRMARKET PRESENTA · DROP 001</p>
          <h1>Tu próximo par.<br /><em>Está acá.</em></h1>
          <p className="hero-description">Los modelos que hicieron historia, las siluetas que siguen marcando la calle. Encontrá tu próximo par.</p>
          <a href="#productos" className="hero-link">Ver colección <span>↓</span></a>
        </div>
        <div className="hero-art"><img src={products[0].image} alt="Nike Air Force 1 '07 blanca" /><span className="hero-note">STEP INTO<br />YOUR NEXT</span><span className="hero-index">DROP 001 — 2026</span></div>
        <span className="hero-scribble" aria-hidden="true">✳</span>
      </section>
      {returnedOrder && <section className={`order-status order-${returnedOrder.status}`} role="status"><span className="order-status-mark">{returnedOrder.status === 'approved' ? '✓' : '↻'}</span><div><strong>{returnedOrder.status === 'approved' ? 'Pago confirmado' : returnedOrder.status === 'pending' ? 'Esperando confirmación del pago' : `Estado del pago: ${returnedOrder.status}`}</strong><small>Orden {returnedOrder.id} · Total {money(returnedOrder.total)}</small></div></section>}
      <section className="catalog" id="productos">
        <div className="section-heading"><div><p className="eyebrow">SELECCIÓN QRMARKET · BUENOS AIRES</p><h2>Modelos que pisan fuerte<span>.</span></h2></div><span className="product-count">{visibleProducts.length} modelos</span></div>
        <nav className="catalog-filters" aria-label="Filtrar zapatillas por marca">
          {['Todos', 'Nike', 'Jordan', 'Adidas', 'Converse'].map((brand) => <button key={brand} className={activeFilter === brand ? 'active' : ''} onClick={() => setActiveFilter(brand)}>{brand === 'Todos' ? 'Todas' : brand}</button>)}
        </nav>
        {notice && <p className="notice catalog-notice" role="status">{notice}</p>}
        <div className="product-grid">
          {visibleProducts.map((product, index) => (
            <article className="product-card" key={product.id}>
              <button className="product-image-button" onClick={() => openProduct(product)} aria-label={`Ver ${product.name}`}>
                <img src={product.image} alt={product.name} loading="lazy" />
                <span className="product-number">0{index + 1}</span><span className="view-arrow">↗</span>
              </button>
              <div className="product-meta"><span>{product.category}</span><span>{product.stock} disponibles</span></div>
              <button className="product-title" onClick={() => openProduct(product)}>{product.name}<span>{money(product.price)}</span></button>
              <button className="quick-add" onClick={() => openProduct(product)}>Ver producto <span>↗</span></button>
            </article>
          ))}
        </div>
      </section>
      <section className="maker-note"><span className="maker-star">✳</span><p>De la cancha a la calle.<br /><em>Encontrá tu próximo clásico.</em></p><span className="maker-sign">QRMarket<br />sneaker club</span></section>
      <footer className="footer"><span>QRMarket · Selección sneaker</span><span>Modelos icónicos, todos los días.</span></footer>
    </main>
  );
}

export default App;
