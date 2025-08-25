const API = '';

const storage = {
  set(key, val){ localStorage.setItem(key, JSON.stringify(val)); },
  get(key){
    const v = localStorage.getItem(key);
    try { return JSON.parse(v); } catch { return v; }
  },
  del(key){ localStorage.removeItem(key); }
};

const tokens = {
  setCli(t){ storage.set('token_cli', t); },
  getCli(){ return storage.get('token_cli'); },
  delCli(){ storage.del('token_cli'); },

  setEmp(t){ storage.set('token_emp', t); },
  getEmp(){ return storage.get('token_emp'); },
  delEmp(){ storage.del('token_emp'); },
};

function joinUrl(base, endpoint){
  if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;
  return (base || '') + endpoint;
}

async function api(endpoint, { method = 'GET', body, token } = {}){
  const url = joinUrl(API, endpoint);
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const raw = await res.text();

  let parsed = null;
  if (raw) {
    try { parsed = JSON.parse(raw); } 
    catch {
    }
  }

  if (!res.ok) {
    const serverMsg =
      (parsed && (parsed.error || parsed.message)) ||
      raw ||
      res.statusText;

    throw new Error(`HTTP ${res.status} – ${serverMsg}`);
  }

  if (!raw) return null;

  return (parsed && (parsed.data ?? parsed)) || parsed;
}

async function apiGet (endpoint, opts={}) {
  return api(endpoint, { ...opts, method: 'GET' });
}
async function apiPost(endpoint, body, opts={}) {
  return api(endpoint, { ...opts, method: 'POST', body });
}
async function apiPut (endpoint, body, opts={}) {
  return api(endpoint, { ...opts, method: 'PUT', body });
}
async function apiDel (endpoint, body, opts={}) {
  return api(endpoint, { ...opts, method: 'DELETE', body });
}
