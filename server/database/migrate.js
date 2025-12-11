const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://mizyvemhkcwcxjuxlzxg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1penl2ZW1oa2N3Y3hqdXhsenhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzOTc1MzYsImV4cCI6MjA4MDk3MzUzNn0.6cNA5IFKrWi6S9p1VXQno2kd5QAqp_UPPqK9rUM5WGo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// SQLite database connection
const dbPath = path.join(__dirname, '../../database/paradise-shop.db');
const db = new sqlite3.Database(dbPath);

async function migrateProducts() {
  try {
    console.log('Fetching products from Supabase...');
    
    const { data: products, error } = await supabase
      .from('products')
      .select('*');
    
    if (error) {
      console.error('Error fetching from Supabase:', error);
      return;
    }
    
    console.log(`Found ${products.length} products in Supabase`);
    
    for (const product of products) {
      await new Promise((resolve, reject) => {
        const stmt = db.prepare(`
          INSERT INTO products (id, name, category, price, description, image, in_stock, flavors, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run([
          product.id,
          product.name,
          product.category || 'liquids',
          product.price || 0,
          product.description || '',
          product.image || '',
          product.in_stock !== undefined ? product.in_stock : 1,
          JSON.stringify(product.flavors || {}),
          product.created_at || new Date().toISOString(),
          product.updated_at || new Date().toISOString()
        ], function(err) {
          if (err) {
            console.error(`Error inserting product ${product.id}:`, err);
            reject(err);
          } else {
            console.log(`Migrated product: ${product.name}`);
            resolve();
          }
        });
        
        stmt.finalize();
      });
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    db.close();
  }
}

migrateProducts();
