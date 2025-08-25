const $ = (id) => document.getElementById(id);
const money = (n) => '$' + Number(n || 0).toFixed(2);

const token = tokens.getEmp();
if (!token) location.href = '/public/login_empleado/login.html';

const rol = localStorage.getItem('rol_emp');
if (rol !== 'REPARTIDOR' && rol !== 'ADMIN') {
  alert('Solo REPARTIDOR/ADMIN');
  location.href = '/public/index.html';
}

const EMP_CED = localStorage.getItem('emp_cedula') || '';

const RUTA_KEY = 'repartidor-ruta-ids';
const getRutaSet = () => new Set(JSON.parse(localStorage.getItem(RUTA_KEY) || '[]'));
const saveRutaSet = (s) => localStorage.setItem(RUTA_KEY, JSON.stringify([...s]));

const EST = { DESPACHADO: 'DESPACHADO', ENTREGA_PENDIENTE: 'ENTREGA_PENDIENTE', ENTREGADO: 'ENTREGADO' };
const badge = (estado) => {
  const map = { DESPACHADO: 'b-teal', ENTREGA_PENDIENTE: 'b-gold', ENTREGADO: 'b-green' };
  return `<span class="badge ${map[estado] || 'b-gray'}">${estado}</span>`;
};

function wireHeader() {
  $('btnRef').onclick = load;
  $('btnOut').onclick = () => {
    tokens.delEmp();
    localStorage.removeItem('rol_emp');
    location.href = '/public/index.html';
  };
}

let timer = null;
async function load() {
  try {
    const estados = 'DESPACHADO,ENTREGA_PENDIENTE,ENTREGADO';
    const qs = `/pedido?estado=${encodeURIComponent(estados)}${EMP_CED ? `&repartidorCedula=${encodeURIComponent(EMP_CED)}` : ''}`;
    let pedidos = await api(qs, { token });

    pedidos = (pedidos || []).filter(p =>
      (p.estado === EST.DESPACHADO || p.estado === EST.ENTREGA_PENDIENTE || p.estado === EST.ENTREGADO) &&
      (!EMP_CED || p?.reparto?.repartidor?.cedula === EMP_CED)
    );

    const s = getRutaSet();
    pedidos.forEach(p => {
      if (p.estado !== EST.DESPACHADO && s.has(p._id)) s.delete(p._id);
    });
    saveRutaSet(s);

    render(pedidos);

    if (timer) clearTimeout(timer);
    timer = setTimeout(load, 10000);
  } catch (e) {
    console.error('Error cargando pedidos:', e);
    alert('No se pudo cargar pedidos: ' + (e.message || e));
  }
}


async function confirmarEntrega(p) {
  if (!confirm('¿Confirmar entrega de este pedido?')) return;
  try {
    await api('/pedido/confirmar-entrega', {
      method: 'PUT',
      token,
      body: { id: p._id }
    });

    const s = getRutaSet(); s.delete(p._id); saveRutaSet(s);
    load();
  } catch (e) {
    console.error(e);
    alert('No se pudo confirmar la entrega: ' + (e.message || e));
  }
}

function render(pedidos) {
  const cont = $('pedidos');
  cont.innerHTML = '';

  const rutaSet = getRutaSet();

  (pedidos || []).forEach(p => {
    const el = document.createElement('div');
    el.className = 'order card';

    const left = document.createElement('div');
    left.className = 'left';

    const clienteNombre =
      p?.cliente?.nombre ||
      p?.clienteNombre ||
      (typeof p?.cliente === 'string' && !/^[0-9a-fA-F]{24}$/.test(p.cliente) ? p.cliente : null) ||
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
        <div><b>Estado:</b> ${badge(p.estado)}</div>
        <div class="total"><b>Total:</b> ${money(p.total)}</div>
      </div>
      <div class="small"><b>Cliente:</b> ${clienteNombre}</div>
      <div class="items" style="margin-top:6px">${itemsHtml}</div>
    `;

    const right = document.createElement('div');
    right.className = 'right';

    const steps = document.createElement('div');
    steps.className = 'progress-steps';
    steps.innerHTML = `
      <div class="rail">
        <span class="dot"></span>
        <span class="bar"></span>
        <span class="dot"></span>
      </div>
      <div class="labels"><span>En ruta</span><span>Entregado</span></div>
    `;

    const chip = document.createElement('div');
    chip.className = 'chip small';

    const bRuta = document.createElement('button');
    bRuta.className = 'secondary';

    const bEnt = document.createElement('button');
    bEnt.textContent = 'Confirmar entrega';

    const hint = document.createElement('div');
    hint.className = 'hint';

    const isDesp = p.estado === EST.DESPACHADO;
    const isPend = p.estado === EST.ENTREGA_PENDIENTE;
    const isDone = p.estado === EST.ENTREGADO;

    const enRutaLocal = rutaSet.has(p._id);

    if (isDesp) {
      el.classList.toggle('route', enRutaLocal);
      steps.classList.toggle('route', enRutaLocal);

      chip.textContent = enRutaLocal ? 'En ruta' : '—';
      bRuta.textContent = enRutaLocal ? 'En ruta' : 'Marcar "En ruta"';
      bRuta.setAttribute('aria-pressed', enRutaLocal ? 'true' : 'false');
      bRuta.disabled = false;

      bRuta.onclick = () => {
        const now = !rutaSet.has(p._id);
        if (now) rutaSet.add(p._id); else rutaSet.delete(p._id);
        saveRutaSet(rutaSet);

        el.classList.toggle('route', now);
        steps.classList.toggle('route', now);
        chip.textContent = now ? 'En ruta' : '—';
        bRuta.textContent = now ? 'En ruta' : 'Marcar "En ruta"';
        bRuta.setAttribute('aria-pressed', now ? 'true' : 'false');

        bEnt.disabled = !now;
        hint.textContent = now
          ? 'Listo para confirmar la entrega.'
          : 'Primero marca el pedido "En ruta".';
      };

      bEnt.disabled = !enRutaLocal;
      bEnt.onclick = () => confirmarEntrega(p);

      hint.textContent = enRutaLocal
        ? 'Listo para confirmar la entrega.'
        : 'Primero marca el pedido "En ruta".';
    }

    if (isPend) {
      chip.textContent = 'Entrega registrada';
      bRuta.textContent = 'En ruta';
      bRuta.disabled = true;
      bEnt.disabled = true;
      hint.textContent = 'Esperando confirmación del cliente.';
      el.classList.add('route');
      steps.classList.add('route');
    }

    if (isDone) {
      chip.textContent = 'Entregado';
      bRuta.textContent = 'En ruta';
      bRuta.disabled = true;
      bEnt.disabled = true;
      hint.textContent = 'Confirmado por el cliente.';
      el.classList.add('route');
      steps.classList.add('route');
    }

    right.appendChild(steps);
    right.appendChild(chip);
    right.appendChild(bRuta);
    right.appendChild(bEnt);
    right.appendChild(hint);

    el.appendChild(left);
    el.appendChild(right);
    cont.appendChild(el);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  wireHeader();
  load();
});
