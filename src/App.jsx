import { useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const products = [
  {
    id: 'air-force-1-07',
    name: 'Air Force 1 ’07',
    category: 'Nike · Clásicos',
    price: 189999,
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
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [copied, setCopied] = useState(false);
  const selectedProduct = products.find((product) => product.id === selectedId);
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

  function openProduct(product) {
    setSelectedId(product.id);
    setQuantity(1);
    setNotice('');
    const url = new URL(window.location.href);
    url.search = `?producto=${encodeURIComponent(product.id)}`;
    window.history.pushState({}, '', url);
  }

  function goToCatalog() {
    setSelectedId(null);
    setNotice('');
    window.history.pushState({}, '', window.location.pathname);
  }

  function addToCart() {
    setNotice(`${quantity} ${quantity === 1 ? 'unidad agregada' : 'unidades agregadas'} al carrito.`);
  }

  async function copyProductLink() {
    await navigator.clipboard.writeText(productUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (selectedProduct) {
    return (
      <main className="page-shell">
        <header className="topbar">
          <button className="brand" onClick={goToCatalog} aria-label="Volver al catálogo">
            <span className="brand-mark">q</span><span>qrmarket<span className="brand-dot">.</span></span>
          </button>
          <span className="top-note">SNEAKERS AUTÉNTICAS · ENVÍOS A TODO EL PAÍS</span>
          <button className="text-button" onClick={goToCatalog}>← Catálogo</button>
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
        <button className="cart-button" onClick={() => setNotice('El carrito se incorpora en el siguiente módulo.')}>Carrito <span className="cart-count">0</span></button>
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
