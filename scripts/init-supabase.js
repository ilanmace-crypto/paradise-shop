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
