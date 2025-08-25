const $ = (id) => document.getElementById(id);

const token = tokens.getCli();
if (!token) location.href = '/public/login_cliente/login.html';

$('btnOut').onclick = () => { tokens.delCli(); location.href = '/public/index.html'; };
$('btnRef').onclick = load;

const FALLBACK = '/public/placeholder.png';
const money = (n) => '$' + Number(n || 0).toFixed(2);

const EST = {
  CREADO: 'CREADO',
  PAGADO: 'PAGADO',
  EN_COCINA: 'EN_COCINA',
  LISTO: 'LISTO',
  DESPACHADO: 'DESPACHADO',
  ENTREGA_PENDIENTE: 'ENTREGA_PENDIENTE',
  ENTREGADO: 'ENTREGADO'
};

const badge = (e) => {
  const map = {
    CREADO: 'b-gray',
    PAGADO: 'b-blue',
    EN_COCINA: 'b-gold',
    LISTO: 'b-green',
    DESPACHADO: 'b-teal',
    ENTREGA_PENDIENTE: 'b-teal',
    ENTREGADO: 'b-green'
  };
  return `<span class="badge ${map[e] || 'b-gray'}">${e}</span>`;
};

async function confirmarRecepcion(id) {
  if (!confirm('¿Confirmar que ya recibiste este pedido?')) return;
  try {
    await api('/pedido/confirmar-recepcion', {
      method: 'PUT',
      token,
      body: { id }
    });
    load();
  } catch (e) {
    alert('No se pudo confirmar la recepción: ' + (e.message || e));
  }
}

let timer = null;

async function load() {
  try {
    const pedidos = await api('/pedido/mis', { token });
    render(Array.isArray(pedidos) ? pedidos : []);
    if (timer) clearTimeout(timer);
    timer = setTimeout(load, 10000);
  } catch (e) {
    console.error(e);
    alert('No se pudo cargar tus pedidos: ' + (e.message || e));
  }
}

function render(pedidos) {
  const cont = $('lista');
  cont.innerHTML = '';

  if (!pedidos.length) {
    const d = document.createElement('div');
    d.className = 'card';
    d.textContent = 'Aún no tienes pedidos.';
    cont.appendChild(d);
    return;
  }

  pedidos.forEach(p => {
    const cover = (p.items || []).find(it => it.imagenUrl)?.imagenUrl || FALLBACK;

    const itemsHtml = (p.items || []).map(it => `
      <div class="item-row">
        <img class="thumb" src="${it.imagenUrl || FALLBACK}" alt="">
        <span>${it.cantidad} × ${it.nombre || it.sku}</span>
        <span class="muted">${money(it.precio)}</span>
      </div>`).join('');

    let actionsHtml = '';
    if (p.estado === EST.ENTREGA_PENDIENTE) {
      actionsHtml = `
        <div class="row gap" style="margin-top:10px">
          <button class="btn" data-act="confirm" data-id="${p._id}">Confirmar recepción</button>
          <div class="hint">El repartidor marcó la entrega. Confirma si ya la recibiste.</div>
        </div>`;
    } else if (p.estado === EST.ENTREGADO) {
      const f = p?.reparto?.fechaRecepcionCliente ? new Date(p.reparto.fechaRecepcionCliente).toLocaleString() : '';
      actionsHtml = `<div class="chip small" style="margin-top:10px">Entregado ${f ? '· ' + f : ''}</div>`;
    }

    const el = document.createElement('div');
    el.className = 'card order';
    el.innerHTML = `
      <div class="order-head">
        <img class="cover" src="${cover}" alt="">
        <div class="head-info">
          <div class="id"><b>ID:</b> ${p._id}</div>
          <div class="state">${badge(p.estado)}</div>
        </div>
        <div class="total"><b>Total:</b> ${money(p.total)}</div>
      </div>

      <div class="small muted" style="margin:6px 0 2px">
        Creado: ${p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}
      </div>

      <div class="items">${itemsHtml}</div>

      ${actionsHtml}
    `;

    const btn = el.querySelector('[data-act="confirm"]');
    if (btn) {
      btn.onclick = () => confirmarRecepcion(btn.getAttribute('data-id'));
    }

    cont.appendChild(el);
  });
}

(function addInlineStyles(){
  const css = `
    .order-head{display:flex;align-items:center;gap:12px;margin-bottom:8px}
    .order .cover{width:48px;height:48px;border-radius:10px;border:1px solid #2e3b66;object-fit:cover}
    .order .head-info{flex:1}
    .order .total{min-width:110px;text-align:right}
    .item-row{display:flex;align-items:center;gap:10px;justify-content:space-between;padding:6px 0;border-top:1px dashed #273355}
    .item-row:first-child{border-top:0}
    .thumb{width:26px;height:26px;border-radius:6px;border:1px solid #2e3b66;object-fit:cover}
    .muted{color:#9aa3b2}
    .row.gap{display:flex;align-items:center;gap:10px}
    .hint{color:#9aa3b2;font-size:12px}
    .chip{display:inline-block;padding:6px 10px;border-radius:999px;background:#0f1b3d;border:1px solid #2e3b66}
  `;
  const style = document.createElement('style');
  style.innerHTML = css;
  document.head.appendChild(style);
})();

load();
