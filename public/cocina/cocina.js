const $ = (id) => document.getElementById(id);
const money = (n) => '$' + Number(n || 0).toFixed(2);
const ago = (iso) => {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60}m` : `${m}m`;
};

const token = tokens.getEmp();
if (!token) location.href = '/public/login_empleado/login.html';
const rol = localStorage.getItem('rol_emp');
if (rol !== 'COCINERO' && rol !== 'ADMIN') {
  alert('Solo COCINERO/ADMIN'); location.href = '/public/index.html';
}
$('btnOut').onclick = () => { tokens.delEmp(); localStorage.removeItem('rol_emp'); location.href = '/public/index.html'; };

const PREP_KEY = 'cocina-prep-ids';
const getPrep = () => new Set(JSON.parse(localStorage.getItem(PREP_KEY) || '[]'));
const setPrep = (set) => localStorage.setItem(PREP_KEY, JSON.stringify(Array.from(set)));

$('btnRef').onclick = load;
let timer = null;
async function load() {
  try {
    const pedidos = await api('/pedido', { token });
    render(pedidos);
    if (timer) clearTimeout(timer);
    timer = setTimeout(load, 10000);
  } catch (e) {
    console.error(e);
    alert('No se pudo cargar pedidos');
  }
}

const EST = { EN_COCINA: 'EN_COCINA', LISTO: 'LISTO', PAGADO: 'PAGADO' };

function render(pedidos) {
  const colC = $('colCocina');
  const colL = $('colListo');
  colC.innerHTML = ''; colL.innerHTML = '';

  const prepSet = getPrep();

  const enCocina = pedidos.filter(p => p.estado === EST.EN_COCINA || p.estado === EST.PAGADO);
  const listos = pedidos.filter(p => p.estado === EST.LISTO);

  enCocina.forEach(p => {
    colC.appendChild(cardPedido(p, {
      preparing: prepSet.has(p._id),
      onTogglePrep: (on) => {
        if (on) prepSet.add(p._id); else prepSet.delete(p._id);
        setPrep(prepSet);
      },
      onReady: async () => {
        try {
          await api('/pedido/marcar-listo', { method: 'PUT', token, body: { id: p._id } });
          prepSet.delete(p._id); setPrep(prepSet);
          load();
        } catch (e) { alert('No se pudo marcar LISTO: ' + e); }
      }
    }));
  });

  listos.forEach(p => {
    colL.appendChild(cardPedido(p, {
      showReadyDisabled: true
    }));
  });
}

function cardPedido(p, options = {}) {
  const { preparing = false, onTogglePrep, onReady, showReadyDisabled = false } = options;

  const el = document.createElement('div');
  el.className = 'card order' + (preparing ? ' prep' : '');

  const clienteNombre =
    p.cliente?.nombre ||
    p.clienteNombre ||
    (typeof p.cliente === 'string' && !/^[0-9a-fA-F]{24}$/.test(p.cliente) ? p.cliente : null) ||
    '—';

  const itemsHtml = (p.items || []).map(it => `
  <div class="item-row">
    <img class="thumb" src="${it.imagenUrl || '/public/placeholder.png'}" alt="" />
    <span>${it.cantidad} × ${it.nombre || it.sku}</span>
    <span class="muted">${money(it.precio)}</span>
  </div>
`).join('');


  el.innerHTML = `
    <div class="head">
      <div class="id small"><b>ID:</b> ${p._id}</div>
      <div class="time">hace ${ago(p.updatedAt || p.createdAt)}</div>
    </div>
    <div class="meta">
      <div><b>Estado:</b> <span class="badge ${p.estado === EST.LISTO ? 'b-green' : 'b-gold'}">${p.estado}</span></div>
      <div><b>Total:</b> ${money(p.total)}</div>
    </div>
    <div class="small"><b>Cliente:</b> ${clienteNombre}</div>
    <div class="items">${itemsHtml}</div>
    <div class="footer">
      <button class="ghost" data-prep>En preparación</button>
      <button data-ready>Listo</button>
    </div>
  `;

  const bPrep = el.querySelector('[data-prep]');
  const bReady = el.querySelector('[data-ready]');

  if (preparing) bPrep.classList.add('secondary');
  bPrep.onclick = () => {
    const now = !el.classList.contains('prep');
    el.classList.toggle('prep', now);
    bPrep.classList.toggle('secondary', now);
    onTogglePrep && onTogglePrep(now);
  };

  if (showReadyDisabled) {
    bReady.disabled = true;
    bReady.textContent = 'Listo';
  } else {
    bReady.onclick = () => onReady && onReady();
  }

  return el;
}

load();
