const FALLBACK = '/public/placeholder.png';
const MENU_FALLBACK = '/public/placeholder.png';
const CART_KEY = 'cart_cli_v1';

const $ = (id) => document.getElementById(id);
const money = (n) => '$' + Number(n || 0).toFixed(2);

const token = tokens.getCli();
if (!token) location.href = '/public/login_cliente/login.html';

const btnOut = $('btnOut');
if (btnOut) {
  btnOut.onclick = () => { tokens.delCli(); location.href = '/public/index.html'; };
}
const btnRef = $('btnRef');
if (btnRef) btnRef.onclick = load;

let productos = [];
let cart = readCart();

function readCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  catch { return []; }
}
function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCart();
}
function cartIndex(sku) { return cart.findIndex(i => i.sku === sku); }

function addToCart(prod, qty = 1) {
  qty = Math.max(1, parseInt(qty || 1, 10));
  const i = cartIndex(prod.sku);
  if (i >= 0) {
    cart[i].cantidad += qty;
  } else {
    cart.push({
      sku: String(prod.sku),
      nombre: String(prod.nombre),
      precio: Number(prod.precio || 0),
      cantidad: qty,
      imagenUrl: prod.imagenUrl || (prod.isMenu ? MENU_FALLBACK : FALLBACK),
      isMenu: !!prod.isMenu
    });
  }
  saveCart();
}
function setQty(sku, qty) {
  qty = Math.max(1, parseInt(qty || 1, 10));
  const i = cartIndex(sku);
  if (i >= 0) { cart[i].cantidad = qty; saveCart(); }
}
function incQty(sku, step = 1) {
  const i = cartIndex(sku);
  if (i >= 0) { cart[i].cantidad = Math.max(1, cart[i].cantidad + step); saveCart(); }
}
function removeItem(sku) {
  cart = cart.filter(i => i.sku !== sku);
  saveCart();
}
function clearCart() {
  cart = [];
  saveCart();
}
function totalCart() {
  return cart.reduce((a, b) => a + b.precio * b.cantidad, 0);
}

function renderCatalogo(list = productos) {
  const cat = $('catalogo');
  const empty = $('emptyCat');
  if (!cat || !empty) return;

  cat.innerHTML = '';
  if (!list.length) { empty.hidden = false; return; }
  empty.hidden = true;

  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'p-card';

    const img = document.createElement('img');
    img.src = p.imagenUrl || (p.isMenu ? MENU_FALLBACK : FALLBACK);
    img.alt = p.nombre;

    const info = document.createElement('div');
    info.className = 'p-info';
    const badge = p.isMenu ? `<span class="badge-menu">Menú</span>` : '';
    const skuLine = `SKU ${p.sku} · ${money(p.precio)}`;
    info.innerHTML = `<b>${p.nombre}${badge ? ' ' + badge : ''}</b>
                      <div class="meta">${skuLine}</div>`;

    const actions = document.createElement('div');
    actions.className = 'p-actions';

    const stepper = document.createElement('div');
    stepper.className = 'stepper';
    const minus = document.createElement('button'); minus.textContent = '–';
    const qty = document.createElement('input'); qty.type = 'number'; qty.min = '1'; qty.value = '1';
    const plus = document.createElement('button'); plus.textContent = '+';
    minus.onclick = () => qty.value = Math.max(1, parseInt(qty.value || 1, 10) - 1);
    plus.onclick = () => qty.value = Math.max(1, parseInt(qty.value || 1, 10) + 1);
    stepper.append(minus, qty, plus);

    const add = document.createElement('button');
    add.className = 'btn';
    add.textContent = 'Añadir';
    add.onclick = () => addToCart(p, qty.value);

    actions.append(stepper, add);
    card.append(img, info, actions);
    cat.appendChild(card);
  });
}

function renderCart() {
  const cont = $('cart');
  const empty = $('emptyCart');
  const tot = $('total');
  const btnClear = $('btnClear');
  const btnOrder = $('btnOrder');
  if (!cont) return;

  cont.innerHTML = '';
  if (!cart.length) {
    if (empty) empty.hidden = false;
    if (tot) tot.textContent = '$0.00';
    if (btnClear) btnClear.disabled = true;
    if (btnOrder) btnOrder.disabled = true;
    return;
  }

  if (empty) empty.hidden = true;
  if (btnClear) btnClear.disabled = false;
  if (btnOrder) btnOrder.disabled = false;

  cart.forEach(i => {
    const el = document.createElement('div');
    el.className = 'c-item';

    const img = document.createElement('img');
    img.src = i.imagenUrl || (i.isMenu ? MENU_FALLBACK : FALLBACK);
    img.alt = i.nombre;

    const info = document.createElement('div');
    info.className = 'c-info';
    const badge = i.isMenu ? `<span class="badge-menu">Menú</span>` : '';
    info.innerHTML = `<b>${i.nombre}${badge ? ' ' + badge : ''}</b>
                      <div class="meta">SKU ${i.sku}</div>`;

    const actions = document.createElement('div');
    actions.className = 'c-actions';

    const stepper = document.createElement('div');
    stepper.className = 'stepper';
    const minus = document.createElement('button'); minus.textContent = '–';
    const qty = document.createElement('input'); qty.type = 'number'; qty.min = '1'; qty.value = i.cantidad;
    const plus = document.createElement('button'); plus.textContent = '+';
    minus.onclick = () => { setQty(i.sku, (parseInt(qty.value || 1, 10) - 1)); };
    plus.onclick = () => { setQty(i.sku, (parseInt(qty.value || 1, 10) + 1)); };
    qty.onchange = () => { setQty(i.sku, qty.value); };
    stepper.append(minus, qty, plus);

    const del = document.createElement('button');
    del.className = 'icon';
    del.title = 'Quitar';
    del.textContent = '✕';
    del.onclick = () => removeItem(i.sku);

    const price = document.createElement('div');
    price.className = 'price';
    price.textContent = money(i.precio * i.cantidad);

    actions.append(stepper, del, price);
    el.append(img, info, actions);
    cont.appendChild(el);
  });

  if (tot) tot.textContent = money(totalCart());
}

const btnClear = $('btnClear');
if (btnClear) {
  btnClear.onclick = () => {
    if (!cart.length) return;
    if (confirm('¿Vaciar carrito?')) clearCart();
  };
}

const q = $('q');
if (q) {
  q.addEventListener('input', (e) => {
    const v = e.target.value.trim().toLowerCase();
    if (!v) return renderCatalogo(productos);
    const filtered = productos.filter(p =>
      p.nombre.toLowerCase().includes(v) ||
      String(p.sku).toLowerCase().includes(v)
    );
    renderCatalogo(filtered);
  });
}

const btnOrder = $('btnOrder');
if (btnOrder) {
  btnOrder.onclick = async () => {
    if (!cart.length) return;
    try {
      const payload = {
        items: cart.map(i => ({
          sku: i.sku,
          nombre: i.nombre,
          cantidad: i.cantidad,
          precio: i.precio,
          imagenUrl: i.imagenUrl || null,
        }))
      };
      await api('/pedido', { method: 'POST', token, body: payload });
      clearCart();
      location.href = '/public/tracking/tracking.html';
    } catch (e) {
      alert('No se pudo crear el pedido: ' + (e.message || e));
    }
  };
}

function normalizeProductos(data) {
  return (data || []).map(p => ({
    sku: String(p.sku),
    nombre: String(p.nombre),
    precio: Number(p.precio || 0),
    imagenUrl: p.imagenUrl || null,
    isMenu: false
  }));
}

function normalizeMenus(ms) {
  return (ms || []).map(m => {
    const total = (m.items || []).reduce(
      (a, it) => a + Number(it.precio || 0) * Math.max(1, Number(it.cantidad || 1)),
      0
    );
    const sku = 'MENU-' + String(m.nombre || 'MENU')
      .trim().toUpperCase().replace(/\s+/g, '-');
    return {
      sku,
      nombre: String(m.nombre || 'Menú') + ' (Menú)',
      precio: total,
      imagenUrl: m.imagenUrl || null,
      isMenu: true
    };
  });
}

async function load() {
  try {
    const [prods, menus] = await Promise.all([
      api('/producto', { token }),
      api('/menu', { token })
    ]);
    const p1 = normalizeProductos(prods);
    const p2 = normalizeMenus(menus);

    productos = [...p2, ...p1];
    renderCatalogo(productos);
  } catch (e) {
    console.error(e);
    alert('No se pudo cargar el catálogo: ' + (e.message || e));
  }
  renderCart();
}

load();
