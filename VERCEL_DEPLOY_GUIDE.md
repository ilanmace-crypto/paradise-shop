# Деплой на Vercel + Supabase - Полная инструкция

## Шаг 1: Создание Supabase проекта
1. Зайди на https://supabase.com
2. Нажми "Start your project" → "Sign up with GitHub"
3. Нажми "New Project"
4. **Organization**: Выбери или создай новую
5. **Project name**: `paradise-shop`
6. **Database Password**: Создай надежный пароль (сохрани!)
7. **Region**: Выбери ближайшую (например, East US)
8. Нажми "Create new project"

## Шаг 2: Получение данных Supabase
1. Дождись создания проекта (2-3 минуты)
2. Перейди в Settings → API
3. Скопируй:
   - **Project URL** (что-то вроде `https://xxx.supabase.co`)
   - **anon public key** (длинный ключ)
   - **service_role key** (секретный ключ)

## Шаг 3: Настройка проекта для Supabase
1. Установи Supabase клиент:
```bash
npm install @supabase/supabase-js
```

2. Создай файл `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=твой_anon_ключ
SUPABASE_SERVICE_ROLE_KEY=твой_service_ключ
```

## Шаг 4: Создание таблиц через код
Создай файл `lib/supabase.js`:
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Создай файл `scripts/init-supabase.js`:
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function initDatabase() {
  console.log('Creating tables...')
  
  // Создаем таблицу categories
  const { error: categoriesError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `
  })
  
  if (categoriesError) console.error('Categories error:', categoriesError)
  
  // Создаем таблицу products
  const { error: productsError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        stock INTEGER DEFAULT 0,
        flavors JSONB,
        image TEXT,
        in_stock BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `
  })
  
  if (productsError) console.error('Products error:', productsError)
  
  // Добавляем категории
  const { error: insertCategoriesError } = await supabase
    .from('categories')
    .upsert([
      { name: 'Жидкости', description: 'Жидкости для вейпинга' },
      { name: 'Картриджи', description: 'Сменные картриджи' },
      { name: 'Одноразовые', description: 'Одноразовые вейпы' }
    ], { onConflict: 'name' })
  
  if (insertCategoriesError) console.error('Insert categories error:', insertCategoriesError)
  
  // Добавляем товары
  const { error: insertProductsError } = await supabase
    .from('products')
    .upsert([
      { 
        name: 'BLOOD - Сочная малина', 
        description: 'Жидкость HARD с вкусом сочной малины', 
        price: 15.00, 
        category_id: 1, 
        stock: 0, 
        flavors: { 'Сочная малина': 15 },
        in_stock: true 
      },
      { 
        name: 'BLOOD - Тропический микс', 
        description: 'Жидкость HARD с вкусом тропического микса', 
        price: 15.00, 
        category_id: 1, 
        stock: 0, 
        flavors: { 'Тропический микс': 17 },
        in_stock: true 
      },
      { 
        name: 'Картридж Vaporesso Xros 0.6 2ml (Corex 2.0)', 
        description: 'Картридж Vaporesso Xros 0.6 2ml с технологией Corex 2.0', 
        price: 13.00, 
        category_id: 2, 
        stock: 1, 
        in_stock: true 
      }
    ], { onConflict: 'name' })
  
  if (insertProductsError) console.error('Insert products error:', insertProductsError)
  
  console.log('Database initialized successfully!')
}

initDatabase().catch(console.error)
```

## Шаг 5: Создание API Routes для Vercel
Создай папку `pages/api` и файлы:

`pages/api/products.js`:
```javascript
import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false })
    
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }
  
  if (req.method === 'POST') {
    const { data, error } = await supabase
      .from('products')
      .insert([req.body])
      .select()
    
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data[0])
  }
  
  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
```

`pages/api/categories.js`:
```javascript
import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('id')
    
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }
  
  res.setHeader('Allow', ['GET'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
```

## Шаг 6: Деплой на Vercel
1. Зайди на https://vercel.com
2. Нажми "New Project" → "Import Git Repository"
3. Выбери `ilanmace-crypto/paradise-shop`
4. **Framework Preset**: Vercel автоматически определит React
5. **Environment Variables**: Добавь переменные из `.env.local`
6. Нажми "Deploy"

## Шаг 7: Инициализация базы данных
1. После деплоя зайди в Vercel → Functions
2. Найди функцию и перейди в Logs
3. Или запусти локально:
```bash
node scripts/init-supabase.js
```

## Шаг 8: Проверка работы
1. Фронтенд: `https://paradise-shop.vercel.app`
2. API: `https://paradise-shop.vercel.app/api/products`
3. Категории: `https://paradise-shop.vercel.app/api/categories`

## Преимущества Vercel + Supabase:
- **Полностью бесплатно**
- **Автоматический деплой**
- **Мгновенная работа**
- **Real-time база данных**
- **Авто-создание таблиц через код**
- **Никогда не спит**

## Готово!
Твой проект работает на Vercel с Supabase базой данных!
