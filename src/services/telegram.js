// Telegram Bot API сервис для отправки уведомлений о заказах

// Конфигурация бота
const TELEGRAM_CONFIG = {
  botToken: '8232792312:AAFV_F78v1gwwe5Caoy6zQriPOLSCLdRtKc', // Токен вашего бота от @BotFather
  adminChatId: '-4824123962', // ID чата администратора
  apiUrl: 'https://api.telegram.org/bot'
};

/**
 * Форматирует список товаров заказа в читаемый вид
 * @param {Array} cartItems - товары в корзине
 * @returns {string} - отформатированный текст
 */
const formatOrderItems = (cartItems) => {
  return cartItems.map((item, index) => {
    const itemTotal = (item.price * item.quantity).toFixed(2);
    let itemText = `${index + 1}. ${item.name}\n`;
    itemText += `   💰 ${item.price} BYN × ${item.quantity} шт. = ${itemTotal} BYN\n`;
    
    if (item.flavor) {
      itemText += `   🍃 Вкус: ${item.flavor}\n`;
    }
    
    return itemText;
  }).join('\n');
};

/**
 * Форматирует сообщение о новом заказе
 * @param {Array} cartItems - товары в корзине
 * @param {number} totalPrice - общая сумма заказа
 * @param {Object} customerInfo - информация о клиенте (telegramUsername, paymentMethod)
 * @returns {string} - готовое сообщение для отправки
 */
const formatOrderMessage = (cartItems, totalPrice, customerInfo = {}) => {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const timestamp = new Date().toLocaleString('ru-RU', {
    timeZone: 'Europe/Minsk',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const usernameRaw = (customerInfo.telegramUsername || '').trim();
  const username = usernameRaw
    ? (usernameRaw.startsWith('@') ? usernameRaw : `@${usernameRaw}`)
    : null;

  let paymentText = '';
  if (customerInfo.paymentMethod) {
    paymentText = customerInfo.paymentMethod === 'card' ? 'Карта' : 'Наличные';
  }

  let message = `🔔 *НОВЫЙ ЗАКАЗ*\n\n`;
  message += `📅 Дата: ${timestamp}\n`;
  message += `🛍️ Количество товаров: ${totalItems} шт.\n`;
  message += `💸 Общая сумма: ${totalPrice.toFixed(2)} BYN\n`;

  if (username) {
    message += `👤 Клиент: ${username}\n`;
  }

  if (paymentText) {
    message += `💳 Способ оплаты: ${paymentText}\n`;
  }

  message += `\n📦 *Состав заказа:*\n\n`;
  message += formatOrderItems(cartItems);
  message += `\n\n💳 *Итого к оплате: ${totalPrice.toFixed(2)} BYN*\n`;
  message += `\n⚡ *Срочно обработайте заказ!*`;

  return message;
};

/**
 * Отправляет сообщение в Telegram
 * @param {string} message - текст сообщения
 * @returns {Promise<boolean>} - успешность отправки
 */
const sendTelegramMessage = async (message) => {
  try {
    const response = await fetch(
      `${TELEGRAM_CONFIG.apiUrl}${TELEGRAM_CONFIG.botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CONFIG.adminChatId,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        })
      }
    );

    const data = await response.json();
    
    if (data.ok) {
      console.log('✅ Уведомление успешно отправлено в Telegram');
      return true;
    } else {
      console.error('❌ Ошибка отправки в Telegram:', data.description);
      return false;
    }
  } catch (error) {
    console.error('❌ Критическая ошибка при отправке в Telegram:', error);
    return false;
  }
};

/**
 * Основная функция для отправки уведомления о новом заказе
 * @param {Array} cartItems - товары в корзине
 * @param {number} totalPrice - общая сумма заказа
 * @returns {Promise<boolean>} - успешность операции
 */
export const sendOrderNotification = async (cartItems, totalPrice, customerInfo = {}) => {
  // Проверка конфигурации
  if (!TELEGRAM_CONFIG.botToken || TELEGRAM_CONFIG.botToken === 'YOUR_BOT_TOKEN_HERE') {
    console.warn('⚠️ Токен бота не настроен. Укажите ваш токен в TELEGRAM_CONFIG.botToken');
    return false;
  }

  if (!TELEGRAM_CONFIG.adminChatId || TELEGRAM_CONFIG.adminChatId === 'YOUR_ADMIN_CHAT_ID_HERE') {
    console.warn('⚠️ ID администратора не настроен. Укажите ваш ID в TELEGRAM_CONFIG.adminChatId');
    return false;
  }

  if (!cartItems || cartItems.length === 0) {
    console.warn('⚠️ Корзина пуста, уведомление не отправлено');
    return false;
  }

  const message = formatOrderMessage(cartItems, totalPrice, customerInfo);
  return await sendTelegramMessage(message);
};

/**
 * Отправка тестового уведомления для проверки работы бота
 * @returns {Promise<boolean>} - успешность отправки
 */
export const sendTestNotification = async () => {
  const testMessage = `🧪 *Тестовое уведомление*\n\nБот работает корректно!\nВремя: ${new Date().toLocaleString('ru-RU')}`;
  return await sendTelegramMessage(testMessage);
};

/**
 * Получение ID чата пользователя (для настройки adminChatId)
 * @param {string} userToken - токен бота
 * @returns {Promise<string|null>} - ID чата или null в случае ошибки
 */
export const getChatId = async (userToken) => {
  try {
    const response = await fetch(
      `${TELEGRAM_CONFIG.apiUrl}${userToken}/getUpdates`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    const data = await response.json();
    
    if (data.ok && data.result.length > 0) {
      const chatId = data.result[data.result.length - 1].message.chat.id;
      console.log(`📱 Ваш ID чата: ${chatId}`);
      return chatId;
    } else {
      console.error('❌ Не удалось получить ID чата. Убедитесь, что вы отправили сообщение боту.');
      return null;
    }
  } catch (error) {
    console.error('❌ Ошибка при получении ID чата:', error);
    return null;
  }
};

// Функция для обновления конфигурации (если нужно будет менять настройки динамически)
export const updateTelegramConfig = (newConfig) => {
  Object.assign(TELEGRAM_CONFIG, newConfig);
  console.log('📝 Конфигурация Telegram обновлена');
};