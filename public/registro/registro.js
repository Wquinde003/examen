btn.onclick = async () => {
  try {
    await api('/cliente', {
      method: 'POST',
      body: {
        cedula: cedula.value.trim(),
        nombre: nombre.value.trim(),
        email: email.value.trim(),
        contrasena: pass.value
      }
    });
    alert('Cuenta creada, ahora inicia sesión');
    location.href = '/public/login_cliente/login.html';
  } catch (e) { alert('Error: ' + e); }
};
