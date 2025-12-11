const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = new sqlite3.Database(path.join(__dirname, '../database/paradise-shop.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Helper functions
const asyncQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const asyncRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

// Routes

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await asyncQuery('SELECT * FROM products ORDER BY id ASC');
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create product
app.post('/api/products', async (req, res) => {
  try {
    const { name, category, price, description, image, in_stock, flavors } = req.body;
    const result = await asyncRun(
      'INSERT INTO products (name, category, price, description, image, in_stock, flavors) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, category, price, description, image, in_stock, JSON.stringify(flavors || {})]
    );
    
    const newProduct = await asyncQuery('SELECT * FROM products WHERE id = ?', [result.id]);
    res.json(newProduct[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, description, image, in_stock, flavors } = req.body;
    
    await asyncRun(
      'UPDATE products SET name = ?, category = ?, price = ?, description = ?, image = ?, in_stock = ?, flavors = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, category, price, description, image, in_stock, JSON.stringify(flavors || {}), id]
    );
    
    const updatedProduct = await asyncQuery('SELECT * FROM products WHERE id = ?', [id]);
    res.json(updatedProduct[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await asyncRun('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await asyncQuery('SELECT * FROM categories');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const users = await asyncQuery('SELECT * FROM users WHERE username = ?', [username]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Simple password check (in production, use bcrypt)
    if (user.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      is_admin: user.is_admin
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGINT', () => {
  console.log('Closing database connection...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});
