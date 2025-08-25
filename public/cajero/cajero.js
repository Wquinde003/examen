const $ = (id) => document.getElementById(id);
const money = (n) => '$' + Number(n || 0).toFixed(2);

let repartidores = [];
async function loadRepartidores() {
  try {
    repartidores = await api('/pedido/repartidores', { token });
  } catch (e) {
    console.error(e);
    repartidores = [];
  }
}

const token = tokens.getEmp();
if (!token) location.href = '/public/login_empleado/login.html';
const rol = localStorage.getItem('rol_emp');
if (rol !== 'CAJERO' && rol !== 'ADMIN') {
  alert('Solo CAJERO/ADMIN');
  location.href = '/public/index.html';
}
$('btnOut').onclick = () => {
  tokens.delEmp();
  localStorage.removeItem('rol_emp');
  location.href = '/public/index.html';
};

$('btnRef').onclick = load;
let timer = null;
async function load() {
  try {
    await loadRepartidores();
    const pedidos = await api('/pedido', { token });
    render(pedidos);
    if (timer) clearTimeout(timer);
    timer = setTimeout(load, 10000);
  } catch (e) {
    console.error(e);
    alert('No se pudo cargar pedidos');
  }
}

const EST = {
  CREADO: 'CREADO',
  PAGADO: 'PAGADO',
  EN_COCINA: 'EN_COCINA',
  LISTO: 'LISTO',
  DESPACHADO: 'DESPACHADO'
};
function canPay(p) { return p.estado === EST.CREADO; }
function canDispatch(p) { return p.estado === EST.LISTO && (p.reparto?.asignado === true); }

function badge(estado) {
  const map = { CREADO: 'b-gray', PAGADO: 'b-blue', EN_COCINA: 'b-gold', LISTO: 'b-green', DESPACHADO: 'b-teal' };
  return `<span class="badge ${map[estado] || 'b-gray'}">${estado}</span>`;
}

async function registrarPago(p) {
  const metodo = prompt('Método de pago (EFECTIVO/TARJETA)', 'EFECTIVO');
  if (!metodo) return;
  const monto = prompt(`Monto recibido (total ${money(p.total)})`, p.total);
  if (monto === null) return;

  try {
    await api('/pedido/pagar', { method: 'PUT', token, body: { id: p._id, metodo, monto: Number(monto) } });
    await api('/pedido/a-cocina', { method: 'PUT', token, body: { id: p._id } });
    load();
  } catch (e) {
    alert('No se pudo registrar el pago: ' + e);
  }
}

async function asignarRepartidor(pedidoId, cedula) {
  try {
    await api('/pedido/asignar-repartidor', { method: 'PUT', token, body: { id: pedidoId, cedula } });
    load();
  } catch (e) {
    alert('No se pudo asignar repartidor: ' + e);
  }
}

async function despachar(p) {
  try {
    await api('/pedido/despachar', { method: 'PUT', token, body: { id: p._id } });
    load();
  } catch (e) {
    alert('No se pudo despachar: ' + e);
  }
}

function render(pedidos) {
  const cont = $('pedidos');
  cont.innerHTML = '';

  pedidos.forEach(p => {
    const el = document.createElement('div');
    el.className = 'card order';

    const cover =
      (p.items?.find(it => it.imagenUrl)?.imagenUrl) ||
      '/public/placeholder.png';
    const left = document.createElement('div');
    left.className = 'left';

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


    left.innerHTML = `
      <div class="id small"><b>ID:</b> ${p._id}</div>
      <div class="meta">
        <div><b>Estado:</b> ${badge(p.estado || 'CREADO')}</div>
        <div class="total">Total: ${money(p.total)}</div>
      </div>
      <div class="small"><b>Cliente:</b> ${clienteNombre}</div>
      <div class="items" style="margin-top:6px">${itemsHtml}</div>
    `;

    const right = document.createElement('div');
    right.className = 'actions';

    const bPay = document.createElement('button');
    bPay.textContent = 'Registrar Pago';
    bPay.disabled = !canPay(p);
    bPay.onclick = () => registrarPago(p);
    right.appendChild(bPay);

    if (p.estado === EST.LISTO) {
      const row = document.createElement('div');
      row.className = 'row';
      row.style.gap = '8px';
      row.style.marginTop = '8px';

      const sel = document.createElement('select');
      sel.style.minWidth = '240px';

      const opt0 = document.createElement('option');
      opt0.value = '';
      opt0.textContent = '— Seleccionar repartidor —';
      sel.appendChild(opt0);

      repartidores.forEach(r => {
        const o = document.createElement('option');
        o.value = r.cedula;
        o.textContent = `${r.nombre} (${r.cedula})`;
        if (p?.reparto?.repartidor?.cedula === r.cedula) o.selected = true;
        sel.appendChild(o);
      });

      const bAsg = document.createElement('button');
      bAsg.className = 'secondary';
      bAsg.textContent = p?.reparto?.asignado ? 'Reasignar' : 'Asignar';
      bAsg.onclick = () => {
        const cedula = sel.value;
        if (!cedula) return alert('Selecciona un repartidor');
        asignarRepartidor(p._id, cedula);
      };

      row.appendChild(sel);
      row.appendChild(bAsg);
      right.appendChild(row);
    }

    const bDesp = document.createElement('button');
    bDesp.textContent = 'Despachar';
    bDesp.disabled = !canDispatch(p);
    bDesp.onclick = () => despachar(p);
    right.appendChild(bDesp);

    const h = document.createElement('div');
    h.className = 'hint';

    if (p.estado === EST.CREADO) {
      h.textContent = 'Primero registra el pago.';
    } else if (p.estado === EST.PAGADO || p.estado === EST.EN_COCINA) {
      h.textContent = 'Cocina debe marcarlo LISTO.';
    } else if (p.estado === EST.LISTO && !(p.reparto?.asignado)) {
      h.textContent = 'Asigna un repartidor para despachar.';
    } else if (p.estado === EST.DESPACHADO) {
      const rep = p?.reparto?.repartidor?.nombre;
      h.textContent = rep ? `Despachado · Repartidor: ${rep}` : 'Despachado';
    }
    if (h.textContent) right.appendChild(h);

    el.appendChild(left);
    el.appendChild(right);
    cont.appendChild(el);
  });
}

load();
