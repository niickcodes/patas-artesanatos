const API_BASE = '/api';

export async function fetchProducts() {
  const res = await fetch(`${API_BASE}/products`, {
    credentials: 'same-origin',
  });
  if (!res.ok) throw new Error('Falha ao carregar catálogo do PostgreSQL');
  return res.json();
}

export async function registerCustomer(customerData) {
  const res = await fetch(`${API_BASE}/customers/register`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao realizar cadastro.');
  return data;
}

export async function loginCustomer(email, password) {
  const res = await fetch(`${API_BASE}/customers/login`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Usuário não encontrado.');
  return data;
}

export async function logoutCustomerSession() {
  await fetch(`${API_BASE}/customers/logout`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }).catch(() => {});
}

export async function lookupCustomer(email) {
  const res = await fetch(`${API_BASE}/customers/lookup?email=${encodeURIComponent(email)}`, {
    credentials: 'same-origin',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Usuário não encontrado.');
  return data;
}

export async function createUserProduct(productData, customerEmail) {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'x-customer-email': customerEmail || '',
    },
    body: JSON.stringify({
      ...productData,
      createdByEmail: customerEmail,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar produto.');
  return data;
}

export async function deleteProduct(productId, customerEmail = '') {
  const res = await fetch(`${API_BASE}/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'x-customer-email': customerEmail || '',
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao excluir produto.');
  return data;
}

export async function createOrder(orderPayload) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao processar pagamento e pedido.');
  return data;
}

export async function adminLogin(email, password) {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Credenciais inválidas.');
  return data;
}

export async function adminLogout(auth) {
  await fetch(`${API_BASE}/admin/logout`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: getAdminHeaders(auth),
    body: JSON.stringify({}),
  }).catch(() => {});
}

function getAdminHeaders(auth) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth?.token) {
    headers.Authorization = `Bearer ${auth.token}`;
  }
  return headers;
}

export async function fetchDatabaseOverview(auth) {
  const res = await fetch(`${API_BASE}/admin/database`, {
    credentials: 'same-origin',
    headers: getAdminHeaders(auth),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao consultar banco PostgreSQL.');
  return data;
}

export async function executeAdminSql(sql, auth) {
  const res = await fetch(`${API_BASE}/admin/sql`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: getAdminHeaders(auth),
    body: JSON.stringify({ sql }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao executar SQL.');
  return data;
}

export async function createNewProduct(productData, auth) {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: getAdminHeaders(auth),
    body: JSON.stringify(productData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao cadastrar produto.');
  return data;
}

export async function connectExternalPostgres(pgConfig, auth) {
  const res = await fetch(`${API_BASE}/admin/connect-pg`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: getAdminHeaders(auth),
    body: JSON.stringify(pgConfig),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao conectar ao servidor PostgreSQL.');
  return data;
}

export async function fetchAdminOrders(auth) {
  const res = await fetch(`${API_BASE}/admin/orders`, {
    credentials: 'same-origin',
    headers: getAdminHeaders(auth),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao buscar pedidos do PostgreSQL.');
  return data;
}

export async function updateAdminOrderStatus(orderId, status, auth) {
  const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status`, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: getAdminHeaders(auth),
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao atualizar status do pedido.');
  return data;
}

export async function fetchAdminUsers(auth) {
  const res = await fetch(`${API_BASE}/admin/users`, {
    credentials: 'same-origin',
    headers: getAdminHeaders(auth),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao buscar usuários do PostgreSQL.');
  return data;
}

export async function deleteAdminUser(userId, auth) {
  const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
    method: 'DELETE',
    credentials: 'same-origin',
    headers: getAdminHeaders(auth),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao excluir usuário.');
  return data;
}

export async function fetchMyOrders(auth) {
  const res = await fetch(`${API_BASE}/orders/my-orders`, {
    credentials: 'same-origin',
    headers: getAdminHeaders(auth),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao consultar suas compras no PostgreSQL.');
  return data;
}
