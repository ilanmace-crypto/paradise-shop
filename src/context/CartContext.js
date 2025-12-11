import React, { createContext, useState, useContext } from 'react';
import { getProducts } from '../data/products';
import { sendOrderNotification } from '../services/telegram';
import { useUser } from './UserContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

const generateOrderId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const { currentUser, ensureUserWithTelegram, addOrder } = useUser();

  const addToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const addToCartWithFlavor = (product, flavor, quantity) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => 
        item.id === product.id && item.flavor === flavor
      );
      
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id && item.flavor === flavor
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prevItems, { 
        ...product, 
        quantity, 
        flavor: flavor || null 
      }];
    });
  };

  const removeFromCart = (productId, flavor = null) => {
    setCartItems(prevItems => 
      prevItems.filter(item => 
        !(item.id === productId && item.flavor === flavor)
      )
    );
  };

  const updateQuantity = (productId, quantity, flavor = null) => {
    if (quantity <= 0) {
      removeFromCart(productId, flavor);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId && item.flavor === flavor
          ? { ...item, quantity }
          : item
      )
    );
  };

  const checkout = async (customerInfo = {}) => {
    const totalPrice = getTotalPrice();

    // Определяем/создаём пользователя по telegramUsername
    let effectiveUser = currentUser || null;
    const rawTg = (customerInfo.telegramUsername || '').trim();
    if (!effectiveUser && rawTg) {
      const normalized = rawTg.startsWith('@') ? rawTg.slice(1) : rawTg;
      effectiveUser = ensureUserWithTelegram(normalized);
      customerInfo.telegramUsername = normalized;
    }

    const userId = effectiveUser?.id || customerInfo.userId || null;

    // Отправляем уведомление в Telegram
    try {
      await sendOrderNotification(cartItems, totalPrice, {
        ...customerInfo,
        userId,
      });
    } catch (error) {
      console.error('Ошибка при отправке уведомления в Telegram:', error);
      // Не прерываем процесс оформления заказа при ошибке отправки
    }

    const products = getProducts();
    const updatedProducts = products.map(product => {
      const productCopy = { ...product };
      
      cartItems.forEach(item => {
        if (item.id === product.id && item.category === 'liquids' && item.flavor && productCopy.flavors) {
          const currentStock = productCopy.flavors[item.flavor] || 0;
          const newStock = Math.max(0, currentStock - item.quantity);
          
          if (newStock === 0) {
            delete productCopy.flavors[item.flavor];
          } else {
            productCopy.flavors[item.flavor] = newStock;
          }
        }
      });
      
      return productCopy;
    });
    
    // Сохраняем заказ в историю
    try {
      const order = {
        id: generateOrderId(),
        userId,
        telegramUsername: customerInfo.telegramUsername || effectiveUser?.telegramUsername || null,
        paymentMethod: customerInfo.paymentMethod || 'cash',
        items: cartItems,
        totalPrice,
        createdAt: new Date().toISOString(),
      };
      addOrder(order);
    } catch (e) {
      console.error('Ошибка при сохранении заказа в историю', e);
    }

    clearCart();
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const value = {
    cartItems,
    addToCart,
    addToCartWithFlavor,
    removeFromCart,
    updateQuantity,
    checkout,
    getTotalPrice,
    getTotalItems,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
