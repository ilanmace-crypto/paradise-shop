import { getProducts as fetchProducts, createProduct as addProduct, updateProduct as modifyProduct, deleteProduct as removeProduct } from '../services/apiService';

export const categories = [
  { id: 'liquids', name: 'Жидкости', description: 'Жидкости для вейпинга' },
  { id: 'cartridges', name: 'Картриджи', description: 'Сменные картриджи' },
  { id: 'disposable', name: 'Одноразовые', description: 'Одноразовые вейпы' }
];

// Тестовые товары удалены по запросу пользователя

// Загрузка всех товаров из API
export const getProducts = async () => {
  try {
    // Сначала пробуем загрузить из API
    const data = await fetchProducts();
    return data.map(product => {
      const normalizedCategoryName = String(product.category_name || '')
        .trim()
        .toLowerCase();

      const normalizedCategoryRaw = String(product.category || '')
        .trim()
        .toLowerCase();

      const categoryIdNum = Number(product.category_id);

      // Map backend category_name to frontend category id
      const matchedCategory = categories.find(
        (cat) => cat.name === product.category_name
      );

      let flavorsParsed = {};
      try {
        flavorsParsed = product.flavors ? JSON.parse(product.flavors) : {};
      } catch (_) {
        // If already object, keep as is
        flavorsParsed = typeof product.flavors === 'object' && product.flavors !== null
          ? product.flavors
          : {};
      }

      // Если категория не проставлена на бэке, но есть вкусы,
      // считаем товар жидкостью, чтобы работал выбор вкуса.
      const hasFlavors = flavorsParsed && Object.keys(flavorsParsed).length > 0;

      const inferredCategory = (() => {
        if (matchedCategory) return matchedCategory.id;

        // Если бэк отдаёт category_id числом (1/2/3), используем его.
        // Числа могут отличаться, поэтому делаем мягкие проверки по имени категории,
        // но чаще всего: 1=Жидкости, 2=Картриджи, 3=Одноразовые.
        if (Number.isFinite(categoryIdNum)) {
          if (categoryIdNum === 2) return 'cartridges';
          if (categoryIdNum === 3) return 'disposable';
          if (categoryIdNum === 1) return 'liquids';
        }

        const haystack = `${normalizedCategoryName} ${normalizedCategoryRaw}`;

        // Синонимы картриджей ("карики", pod, cartridge)
        if (
          haystack.includes('карт') ||
          haystack.includes('кари') ||
          haystack.includes('pod') ||
          haystack.includes('cart') ||
          haystack.includes('cartr')
        ) {
          return 'cartridges';
        }

        if (haystack.includes('однораз') || haystack.includes('dispos')) return 'disposable';
        if (haystack.includes('жидк') || haystack.includes('liquid')) return 'liquids';
        return null;
      })();

      const mappedFromRawCategory = (() => {
        // Иногда бэк отдаёт category как число/строку числа (например 2),
        // а фронт ожидает строковые ids (liquids/cartridges/disposable).
        if (Number.isFinite(categoryIdNum)) {
          if (categoryIdNum === 2) return 'cartridges';
          if (categoryIdNum === 3) return 'disposable';
          if (categoryIdNum === 1) return 'liquids';
        }

        const rawNum = Number(normalizedCategoryRaw);
        if (Number.isFinite(rawNum) && normalizedCategoryRaw !== '') {
          if (rawNum === 2) return 'cartridges';
          if (rawNum === 3) return 'disposable';
          if (rawNum === 1) return 'liquids';
        }

        if (normalizedCategoryRaw === 'cartridges') return 'cartridges';
        if (normalizedCategoryRaw === 'disposable') return 'disposable';
        if (normalizedCategoryRaw === 'liquids') return 'liquids';
        return null;
      })();

      const mappedCategory = inferredCategory || mappedFromRawCategory || (hasFlavors ? 'liquids' : null);

      return {
        ...product,
        category: mappedCategory,
        flavors: flavorsParsed,
      };
    });
  } catch (error) {
    console.warn('API недоступен, возвращаем пустой массив:', error);
    // Если API недоступен, возвращаем пустой массив
    return [];
  }
};

// Создание нового товара
export const createProduct = async (product) => {
  try {
    const data = await addProduct(product);
    const matchedCategory = categories.find(
      (cat) => cat.name === data.category_name
    );
    let flavorsParsed = {};
    try {
      flavorsParsed = data.flavors ? JSON.parse(data.flavors) : {};
    } catch (_) {
      flavorsParsed = typeof data.flavors === 'object' && data.flavors !== null ? data.flavors : {};
    }
    return {
      ...data,
      category: matchedCategory ? matchedCategory.id : (data.category || null),
      flavors: flavorsParsed,
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
    const matchedCategory = categories.find(
      (cat) => cat.name === data.category_name
    );
    let flavorsParsed = {};
    try {
      flavorsParsed = data.flavors ? JSON.parse(data.flavors) : {};
    } catch (_) {
      flavorsParsed = typeof data.flavors === 'object' && data.flavors !== null ? data.flavors : {};
    }
    return {
      ...data,
      category: matchedCategory ? matchedCategory.id : (data.category || null),
      flavors: flavorsParsed,
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
