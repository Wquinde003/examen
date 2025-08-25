const $ = (id) => document.getElementById(id);

const btnOut = $('btnOut');
const btnRef = $('btnRef');

const formProducto = $('formProducto');
const imagen = $('imagen');
const preview = $('preview');

const list = $('list');
const sku = $('sku');
const nombre = $('nombre');
const precio = $('precio');
const stock = $('stock');
const msg = $('msg');

const catalogo = $('catalogo');

const menuNombre = $('menuNombre');
const menuPrecio = $('menuPrecio');
const menuSub = $('menuSub');
const menuAhorro = $('menuAhorro');
const btnGuardarMenu = $('btnGuardarMenu');
const menus = $('menus');

const token = tokens.getEmp();
if (!token) location.href = '/public/login_empleado/login.html';
const rol = localStorage.getItem('rol_emp');
if (rol !== 'ADMIN') { alert('Solo ADMIN'); location.href = '/public/index.html'; }

btnOut.onclick = () => { tokens.delEmp(); localStorage.removeItem('rol_emp'); location.href = '/public/index.html'; };

document.querySelectorAll('.tab').forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    $('tab-' + b.dataset.tab).classList.add('active');
  };
});

let productos = [];
let menuItems = [];
const FALLBACK = '/public/placeholder.png';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}
function money(n) { return '$' + Number(n || 0).toFixed(2); }

btnRef.onclick = loadAll;

imagen.onchange = () => {
  const f = imagen.files[0];
  if (!f) { preview.src = ''; return; }
  if (f.size > 2 * 1024 * 1024) { alert('Imagen > 2MB'); imagen.value = ''; return; }
  preview.src = URL.createObjectURL(f);
};

async function loadAll() {
  try {
    productos = await api('/producto', { token });
    renderProductos();
    renderCatalogo();
    await loadMenus();
  } catch (e) { alert('Error cargando: ' + e); }
}

function renderProductos() {
  list.innerHTML = '';
  productos.forEach(p => {
    const it = document.createElement('div');
    it.className = 'item';
    const src = p.imagenUrl || FALLBACK;
    it.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center">
        <img src="${src}" width="56" height="56" style="object-fit:cover;border-radius:10px;border:1px solid #2e3b66">
        <div><b>${p.nombre}</b><br><span class="small">SKU ${p.sku}</span></div>
      </div>
      <div>${money(p.precio)} | stk ${p.stock}</div>`;
    it.onclick = () => {
      sku.value = p.sku; nombre.value = p.nombre; precio.value = p.precio; stock.value = p.stock;
      preview.src = src;
    };
    list.appendChild(it);
  });
}

formProducto.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  try {
    let imagenBase64 = null;
    if (imagen.files[0]) imagenBase64 = await fileToBase64(imagen.files[0]);
    await api('/producto', {
      method: 'POST', token, body: {
        sku: sku.value.trim(),
        nombre: nombre.value.trim(),
        precio: parseFloat(precio.value || 0),
        stock: parseInt(stock.value || 0),
        imagenBase64
      }
    });
    msg.textContent = 'Producto agregado';
    imagen.value = ''; preview.src = '';
    await loadAll();
    formProducto.reset();
  } catch (e) { alert(e); }
});

$('btnUpd').onclick = async () => {
  try {
    let imagenBase64 = null;
    if (imagen.files[0]) imagenBase64 = await fileToBase64(imagen.files[0]);
    await api('/producto', {
      method: 'PUT', token, body: {
        sku: sku.value.trim(),
        nombre: nombre.value.trim(),
        precio: parseFloat(precio.value || 0),
        stock: parseInt(stock.value || 0),
        imagenBase64
      }
    });
    msg.textContent = 'Producto actualizado';
    imagen.value = ''; preview.src = '';
    await loadAll();
  } catch (e) { alert(e); }
};

$('btnDel').onclick = async () => {
  if (!confirm('¿Eliminar producto?')) return;
  try {
    await api('/producto', { method: 'DELETE', token, body: { sku: sku.value.trim() } });
    msg.textContent = 'Producto eliminado';
    imagen.value = ''; preview.src = '';
    await loadAll();
    formProducto.reset();
  } catch (e) { alert(e); }
};

function renderCatalogo() {
  catalogo.innerHTML = '';
  productos.forEach(p => {
    const it = document.createElement('div'); it.className = 'item';
    it.innerHTML = `
      <div style="display:flex;gap:12px;align-items:center">
        <img src="${p.imagenUrl || FALLBACK}" width="48" height="48" style="object-fit:cover;border-radius:8px;border:1px solid #2e3b66">
        <div><b>${p.nombre}</b><div class="small">${money(p.precio)} | ${p.sku}</div></div>
      </div>
      <div><button class="secondary" data-sku="${p.sku}">Añadir</button></div>`;
    catalogo.appendChild(it);
  });
  catalogo.querySelectorAll('button[data-sku]').forEach(b => {
    b.onclick = () => addToMenu(b.dataset.sku);
  });
}

function addToMenu(skuProd) {
  const p = productos.find(x => x.sku === skuProd);
  if (!p) return;
  const i = menuItems.findIndex(x => x.sku === skuProd);
  if (i >= 0) menuItems[i].cantidad += 1;
  else menuItems.push({ sku: p.sku, nombre: p.nombre, precio: p.precio, cantidad: 1 });
  renderMenuBuilder();
}

menuPrecio?.addEventListener('input', renderMenuBuilder);

function renderMenuBuilder() {
  const menuItemsEl = $('menuItems');
  menuItemsEl.innerHTML = '';
  let subtotal = 0;

  menuItems.forEach((it, idx) => {
    const sub = it.precio * it.cantidad; subtotal += sub;
    const row = document.createElement('div'); row.className = 'item';
    row.innerHTML = `
      <div><b>${it.nombre}</b><div class="small">${it.sku} · ${money(it.precio)}</div></div>
      <div class="qty">
        <input type="number" min="1" value="${it.cantidad}" data-i="${idx}">
        <button class="secondary" data-del="${idx}">Quitar</button>
      </div>`;
    menuItemsEl.appendChild(row);
  });

  menuItemsEl.querySelectorAll('input[type=number]').forEach(inp => {
    inp.onchange = () => {
      const i = Number(inp.dataset.i);
      menuItems[i].cantidad = Math.max(1, parseInt(inp.value || 1));
      renderMenuBuilder();
    };
  });
  menuItemsEl.querySelectorAll('button[data-del]').forEach(btn => {
    btn.onclick = () => {
      const i = Number(btn.dataset.del);
      menuItems.splice(i, 1);
      renderMenuBuilder();
    };
  });

  if (menuSub) menuSub.textContent = money(subtotal);
  if (menuAhorro) {
    const pManual = parseFloat(menuPrecio?.value);
    if (!isNaN(pManual) && pManual >= 0) {
      const ahorro = subtotal - pManual;
      menuAhorro.textContent = ahorro > 0
        ? ` · Precio: ${money(pManual)} (ahorras ${money(ahorro)})`
        : ` · Precio: ${money(pManual)}`;
    } else {
      menuAhorro.textContent = '';
    }
  }
}

btnGuardarMenu.onclick = async () => {
  try {
    if (!menuNombre.value.trim()) { alert('Nombre del menú requerido'); return; }
    if (!menuItems.length) { alert('Agrega productos al menú'); return; }

    const pManual = parseFloat(menuPrecio.value);
    const payload = {
      nombre: menuNombre.value.trim(),
      items: menuItems.map(x => ({
        sku: x.sku,
        nombre: x.nombre,
        cantidad: x.cantidad,
        precio: x.precio
      })),
      ...(!isNaN(pManual) && pManual >= 0 ? { precio: pManual } : {})
    };

    await api('/menu', { method: 'POST', token, body: payload });
    menuItems = []; menuNombre.value = ''; menuPrecio.value = '';
    renderMenuBuilder();
    await loadMenus();
    alert('Menú guardado');
  } catch (e) { alert(e); }
};

async function loadMenus() {
  const ms = await api('/menu', { token });
  menus.innerHTML = '';

  ms.forEach((m, idx) => {
    const subtotal = (m.items || []).reduce((a, b) => a + (b.precio * b.cantidad), 0);
    const total = (typeof m.precio === 'number') ? m.precio : subtotal;

    const el = document.createElement('div'); el.className = 'item';
    el.innerHTML = `
      <div>
        <b>${m.nombre}</b>
        <div class="small">${m.items.length} items · ${money(total)}</div>
        <div class="menu-det" id="det-${idx}" style="display:none; margin-top:6px"></div>
      </div>
      <div class="row">
        <button class="secondary" data-view="${idx}">Ver</button>
        <button data-del="${m.nombre}">Eliminar</button>
      </div>`;

    menus.appendChild(el);

    const det = el.querySelector(`#det-${idx}`);
    det.innerHTML = (m.items || []).map(it =>
      `<div class="small">• ${it.cantidad} × ${it.nombre || it.sku} (${it.sku}) · ${money(it.precio)}</div>`
    ).join('');

    el.querySelector('[data-view]').onclick = () => {
      det.style.display = det.style.display === 'none' ? 'block' : 'none';
    };

    el.querySelector('[data-del]').onclick = async () => {
      if (!confirm('¿Eliminar menú?')) return;
      await api('/menu', { method: 'DELETE', token, body: { nombre: m.nombre } });
      await loadMenus();
    };
  });
}

loadAll();
