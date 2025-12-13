const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Products API
export const getProducts = async () => {
  const response = await fetch(`${API_BASE_URL}/products`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
};

export const createProduct = async (product) => {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(product),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create product');
  }
  
  return response.json();
};

export const updateProduct = async (id, updates) => {
  console.log('Updating product:', id);
  console.log('Update data keys:', Object.keys(updates));
  console.log('Has image field:', 'image' in updates);
  if ('image' in updates) {
    console.log('Image length:', updates.image ? updates.image.length : 'undefined');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    console.log('Update response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Update failed response:', errorText);
      throw new Error(`Failed to update product: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Update successful, result keys:', Object.keys(result));
    return result;
  } catch (error) {
    console.error('Update product error:', error);
    throw error;
  }
};

export const deleteProduct = async (id) => {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete product');
  }
};

// Orders API
export const createOrder = async (order) => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(order),
  });

  if (!response.ok) {
    throw new Error('Failed to create order');
  }

  return response.json();
};

// Categories API
export const getCategories = async () => {
  const response = await fetch(`${API_BASE_URL}/categories`);
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
};

// Auth API - вход с логином и паролем
export const login = async (username, password) => {
  const cleanUsername = String(username || '').trim();
  const cleanPassword = String(password || '').trim();
  
  const payload = { 
    username: cleanUsername, 
    password: cleanPassword 
  };
  
  console.log('LOGIN REQUEST:', {
    username: cleanUsername,
    passwordLength: cleanPassword.length,
    firstChars: cleanPassword.substring(0, 3) + (cleanPassword.length > 3 ? '...' : '')
  });

  const response = await fetch(`${API_BASE_URL}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Debug': 'true'
    },
    credentials: 'same-origin',
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Login failed:', response.status, errorData);
    throw new Error(errorData.error || 'Ошибка при входе');
  }
  
  return response.json();
};

// Health check
export const healthCheck = async () => {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error('Server unavailable');
  }
  return response.json();
};
