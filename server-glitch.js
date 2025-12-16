const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from React app
app.use(express.static(path.join(__dirname, 'build')));

// PostgreSQL connection for production, SQLite for development
let pool;

if (process.env.DATABASE_URL) {
  // Production - PostgreSQL
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
} else {
  // Development - fallback to mock data
  console.log('Using mock data (no database configured)');
}

// Test database connection
if (pool) {
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Database connection error:', err);
    } else {
      console.log('Database connected successfully at:', res.rows[0].now);
    }
  });
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Products CRUD
app.get('/api/products', async (req, res) => {
  try {
    if (!pool) {
      // Fallback to mock data
      return res.json([]);
    }
    
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const { name, description, price, category_id, stock, flavors, image, in_stock } = req.body;
    
    const result = await pool.query(
      `INSERT INTO products (name, description, price, category_id, stock, flavors, image, in_stock) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, description, price, category_id, stock || 0, JSON.stringify(flavors), image, in_stock !== false]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const { id } = req.params;
    const { name, description, price, category_id, stock, flavors, image, in_stock } = req.body;
    
    const result = await pool.query(
      `UPDATE products SET name = $1, description = $2, price = $3, category_id = $4, 
       stock = $5, flavors = $6, image = $7, in_stock = $8 WHERE id = $9 RETURNING *`,
      [name, description, price, category_id, stock || 0, JSON.stringify(flavors), image, in_stock !== false, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Categories
app.get('/api/categories', async (req, res) => {
  try {
    if (!pool) {
      return res.json([
        { id: 1, name: 'Жидкости', description: 'Жидкости для вейпинга' },
        { id: 2, name: 'Картриджи', description: 'Сменные картриджи' },
        { id: 3, name: 'Одноразовые', description: 'Одноразовые вейпы' }
      ]);
    }
    
    const result = await pool.query('SELECT * FROM categories ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
