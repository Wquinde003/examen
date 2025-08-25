btn.onclick = async () => {
  try {
    const data = await api('/auth/cliente/login', {
      method: 'POST',
      body: { email: email.value.trim(), contrasena: pass.value }
    });
    tokens.setCli(data.token);
    location.href = '/public/menu/menu.html';
  } catch (e) { alert('Error: ' + e); }
};
