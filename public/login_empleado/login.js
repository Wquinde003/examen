btn.onclick = async () => {
  try {
    const data = await api('/auth/empleado/login', {
      method: 'POST', body: {
        email: email.value.trim(), contrasena: pass.value
      }
    });
    tokens.setEmp(data.token);
    localStorage.setItem('rol_emp', data.rol);
    switch (data.rol) {
      case 'ADMIN': location.href = '/public/productos/producto.html'; break;
      case 'CAJERO': location.href = '/public/cajero/cajero.html'; break;
      case 'COCINERO': location.href = '/public/cocina/cocina.html'; break;
      case 'REPARTIDOR': location.href = '/public/repartidor/repartidor.html'; break;
      default: location.href = '/public/index.html';
    }
  } catch (e) { alert('Error: ' + e); }
};
