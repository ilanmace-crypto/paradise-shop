const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function initDatabase() {
  try {
    console.log('Initializing database...');

    // Create categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT
      )
    `);

    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        stock INTEGER DEFAULT 0,
        flavors JSONB,
        image TEXT,
        in_stock BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default categories
    const categoriesResult = await pool.query(`
      INSERT INTO categories (name, description) VALUES 
        ('Жидкости', 'Жидкости для вейпинга'),
        ('Картриджи', 'Сменные картриджи'),
        ('Одноразовые', 'Одноразовые вейпы')
      ON CONFLICT DO NOTHING
      RETURNING id
    `);

    console.log('Database initialized successfully!');
    console.log('Categories created:', categoriesResult.rows.length);

    // Insert sample products if table is empty
    const productsCount = await pool.query('SELECT COUNT(*) as count FROM products');
    
    if (parseInt(productsCount.rows[0].count) === 0) {
      console.log('Adding sample products...');
      
      await pool.query(`
        INSERT INTO products (name, description, price, category_id, stock, flavors, in_stock) VALUES 
          ('BLOOD - Сочная малина', 'Жидкость HARD с вкусом сочной малины', 15.00, 1, 0, '{"Сочная малина": 15}', true),
          ('BLOOD - Тропический микс', 'Жидкость HARD с вкусом тропического микса', 15.00, 1, 0, '{"Тропический микс": 17}', true),
          ('Картридж Vaporesso Xros 0.6 2ml (Corex 2.0)', 'Картридж Vaporesso Xros 0.6 2ml с технологией Corex 2.0', 13.00, 2, 1, null, true)
      `);
      
      console.log('Sample products added!');
    }

    await pool.end();
    console.log('Database initialization completed!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
