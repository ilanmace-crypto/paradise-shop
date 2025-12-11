import { getProducts as fetchProducts, createProduct as addProduct, updateProduct as modifyProduct, deleteProduct as removeProduct } from '../services/apiService';

export const categories = [
  { id: 'liquids', name: 'Жидкости', description: 'Жидкости для вейпинга' },
  { id: 'cartridges', name: 'Картриджи', description: 'Сменные картриджи' },
  { id: 'disposable', name: 'Одноразовые', description: 'Одноразовые вейпы' }
];

// Загрузка всех товаров из API
export const getProducts = async () => {
  try {
    const data = await fetchProducts();
    return data.map(product => ({
      ...product,
      flavors: product.flavors ? JSON.parse(product.flavors) : {}
    }));
  } catch (error) {
    console.error('Error loading products from API:', error);
    throw error;
  }
};

// Создание нового товара
export const createProduct = async (product) => {
  try {
    const data = await addProduct(product);
    return {
      ...data,
      flavors: data.flavors ? JSON.parse(data.flavors) : {}
    };
  } catch (error) {
    console.error('Error creating product in API:', error);
    throw error;
  }
};

// Обновление товара
export const updateProduct = async (id, updates) => {
  try {
    const data = await modifyProduct(id, updates);
    return {
      ...data,
      flavors: data.flavors ? JSON.parse(data.flavors) : {}
    };
  } catch (error) {
    console.error('Error updating product in API:', error);
    throw error;
  }
};

// Удаление товара
export const deleteProduct = async (id) => {
  try {
    await removeProduct(id);
  } catch (error) {
    console.error('Error deleting product in API:', error);
    throw error;
  }
};
