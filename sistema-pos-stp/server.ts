import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import bodyParser from "body-parser";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import multer from "multer";
import * as xlsx from "xlsx";

console.log("Server starting...");

const upload = multer({ storage: multer.memoryStorage() });

const db = new Database("pos_stp.db");

// Initialize Database Schema
// (Moved inside startServer)

import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = 3000;

  try {
    // Initialize Database Schema
    db.exec(`
      CREATE TABLE IF NOT EXISTS store (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        name TEXT NOT NULL,
        nif TEXT,
        address TEXT,
        phone TEXT,
        currency TEXT DEFAULT 'STN',
        tax_rate REAL DEFAULT 0,
        uses_tax INTEGER DEFAULT 0,
        sender_email TEXT,
        sender_password TEXT,
        whatsapp_number TEXT,
        contact_email TEXT
      );
      
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'supervisor', 'cashier')) NOT NULL,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        symbol TEXT
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        barcode TEXT UNIQUE,
        description TEXT,
        type TEXT CHECK(type IN ('base', 'fracionado')) DEFAULT 'base',
        purchase_price REAL,
        sale_price REAL,
        category_id INTEGER,
        supplier_id INTEGER,
        unit_id INTEGER,
        tax_id INTEGER,
        produto_base_id INTEGER,
        unidades_por_base REAL DEFAULT 1,
        stock_base REAL DEFAULT 0,
        stock_fracionado REAL DEFAULT 0,
        min_stock REAL DEFAULT 5,
        is_favorite INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_by INTEGER,
        updated_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
        FOREIGN KEY (unit_id) REFERENCES units(id),
        FOREIGN KEY (tax_id) REFERENCES taxes(id),
        FOREIGN KEY (produto_base_id) REFERENCES products(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        type TEXT CHECK(type IN ('in', 'out', 'adjustment', 'sale', 'fracionamento')) NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        whatsapp TEXT,
        nif TEXT,
        address TEXT,
        bank_coordinates TEXT,
        credit_limit REAL DEFAULT 0,
        balance REAL DEFAULT 0,
        debt REAL DEFAULT 0,
        price_list_id INTEGER
      );

      CREATE TABLE IF NOT EXISTS client_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        type TEXT CHECK(type IN ('deposit', 'debt_payment', 'purchase_balance', 'purchase_credit')) NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        sale_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id INTEGER,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (sale_id) REFERENCES sales(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS proformas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER,
        total REAL NOT NULL,
        total_without_tax REAL NOT NULL,
        total_tax REAL NOT NULL,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS proforma_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        proforma_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity REAL NOT NULL,
        price REAL NOT NULL,
        unit_id INTEGER,
        tax_rate REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        subtotal_without_tax REAL DEFAULT 0,
        FOREIGN KEY (proforma_id) REFERENCES proformas(id),
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (unit_id) REFERENCES units(id)
      );


      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT
      );

      CREATE TABLE IF NOT EXISTS cashier_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        opening_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        closing_time DATETIME,
        opening_balance REAL NOT NULL,
        closing_balance REAL,
        expected_balance REAL,
        counted_balance REAL,
        difference REAL,
        difference_type TEXT,
        justification TEXT,
        status TEXT CHECK(status IN ('open', 'closed')) DEFAULT 'open',
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS cash_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        type TEXT CHECK(type IN ('entry', 'exit')) NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES cashier_sessions(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        client_id INTEGER,
        total REAL NOT NULL,
        total_without_tax REAL DEFAULT 0,
        total_tax REAL DEFAULT 0,
        payment_method TEXT NOT NULL, -- 'cash', 'card', 'transfer', 'other', 'mixed'
        cash_amount REAL DEFAULT 0,
        card_amount REAL DEFAULT 0,
        transfer_amount REAL DEFAULT 0,
        other_amount REAL DEFAULT 0,
        credit_amount REAL DEFAULT 0,
        balance_amount REAL DEFAULT 0,
        change_amount REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES cashier_sessions(id),
        FOREIGN KEY (client_id) REFERENCES clients(id)
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity REAL NOT NULL,
        price REAL NOT NULL,
        unit_id INTEGER,
        tax_rate REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        subtotal_without_tax REAL DEFAULT 0,
        FOREIGN KEY (sale_id) REFERENCES sales(id),
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (unit_id) REFERENCES units(id)
      );

      CREATE TABLE IF NOT EXISTS price_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS taxes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        rate REAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS product_units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        unit_id INTEGER NOT NULL,
        conversion_factor REAL NOT NULL,
        barcode TEXT,
        FOREIGN KEY(product_id) REFERENCES products(id),
        FOREIGN KEY(unit_id) REFERENCES units(id)
      );

      CREATE TABLE IF NOT EXISTS product_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        price_list_id INTEGER NOT NULL,
        unit_id INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY(product_id) REFERENCES products(id),
        FOREIGN KEY(price_list_id) REFERENCES price_lists(id),
        FOREIGN KEY(unit_id) REFERENCES units(id)
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL, -- 'create', 'update', 'delete', 'import', 'backup_import', 'stock_adjustment'
        entity_type TEXT NOT NULL, -- 'product', 'sale', 'backup', etc.
        entity_id TEXT,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS currencies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        symbol TEXT NOT NULL,
        rate REAL DEFAULT 1,
        is_active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS returns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        session_id INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        reason TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (session_id) REFERENCES cashier_sessions(id)
      );

      CREATE TABLE IF NOT EXISTS return_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        return_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity REAL NOT NULL,
        price REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (return_id) REFERENCES returns(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);

    // Ensure missing columns exist (for existing databases)
    const tables = ['clients', 'sales', 'store'];
    for (const table of tables) {
      const columns = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
      const columnNames = columns.map(c => c.name);
      
      if (table === 'store') {
        if (!columnNames.includes('uses_tax')) {
          db.exec("ALTER TABLE store ADD COLUMN uses_tax INTEGER DEFAULT 0");
        }
        if (!columnNames.includes('sender_email')) {
          db.exec("ALTER TABLE store ADD COLUMN sender_email TEXT");
        }
        if (!columnNames.includes('sender_password')) {
          db.exec("ALTER TABLE store ADD COLUMN sender_password TEXT");
        }
        if (!columnNames.includes('whatsapp_number')) {
          db.exec("ALTER TABLE store ADD COLUMN whatsapp_number TEXT");
        }
        if (!columnNames.includes('contact_email')) {
          db.exec("ALTER TABLE store ADD COLUMN contact_email TEXT");
        }
      }
      
      if (table === 'clients') {
        if (!columnNames.includes('address')) {
          db.exec("ALTER TABLE clients ADD COLUMN address TEXT");
        }
      }
      
      if (table === 'sales') {
        if (!columnNames.includes('credit_amount')) {
          db.exec("ALTER TABLE sales ADD COLUMN credit_amount REAL DEFAULT 0");
        }
        if (!columnNames.includes('balance_amount')) {
          db.exec("ALTER TABLE sales ADD COLUMN balance_amount REAL DEFAULT 0");
        }
        if (!columnNames.includes('total_without_tax')) {
          db.exec("ALTER TABLE sales ADD COLUMN total_without_tax REAL DEFAULT 0");
        }
        if (!columnNames.includes('total_tax')) {
          db.exec("ALTER TABLE sales ADD COLUMN total_tax REAL DEFAULT 0");
        }
      }
    }

    // Seed initial data
    const catCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as any;
    if (catCount.count === 0) {
      db.prepare("INSERT INTO categories (name) VALUES (?)").run("Geral");
    }

    const unitsCount = db.prepare("SELECT COUNT(*) as count FROM units").get() as any;
    if (unitsCount.count === 0) {
      const units = ['Saco', 'Unidade', 'Kg', 'Litro', 'Caixa', 'Garrafa'];
      const insertUnit = db.prepare("INSERT INTO units (name) VALUES (?)");
      units.forEach(u => insertUnit.run(u));
    }

    // Migrations for existing database
    try { db.exec("ALTER TABLE products ADD COLUMN type TEXT CHECK(type IN ('base', 'fracionado')) DEFAULT 'base'"); } catch(e) {}
    try { db.exec("ALTER TABLE products ADD COLUMN unit_id INTEGER"); } catch(e) {}
    try { db.exec("ALTER TABLE products ADD COLUMN supplier_id INTEGER"); } catch(e) {}
    try { db.exec("ALTER TABLE products ADD COLUMN produto_base_id INTEGER"); } catch(e) {}
    try { db.exec("ALTER TABLE products ADD COLUMN unidades_por_base REAL DEFAULT 1"); } catch(e) {}
    try { db.exec("ALTER TABLE products ADD COLUMN is_favorite INTEGER DEFAULT 0"); } catch(e) {}
    try { db.exec("ALTER TABLE products ADD COLUMN is_active INTEGER DEFAULT 1"); } catch(e) {}
    try { db.exec("ALTER TABLE products ADD COLUMN description TEXT"); } catch(e) {}
    try { db.exec("ALTER TABLE products ADD COLUMN created_by INTEGER"); } catch(e) {}
    try { db.exec("ALTER TABLE products ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"); } catch(e) {}
    try { db.exec("ALTER TABLE products ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP"); } catch(e) {}
    try { db.exec("ALTER TABLE products ADD COLUMN stock_base REAL DEFAULT 0"); } catch(e) {}
    try { db.exec("ALTER TABLE products ADD COLUMN stock_fracionado REAL DEFAULT 0"); } catch(e) {}
    try { db.exec("ALTER TABLE stock_movements ADD COLUMN unit TEXT"); } catch(e) {}
    try { db.exec("ALTER TABLE units ADD COLUMN symbol TEXT"); } catch(e) {}
    try { db.exec("ALTER TABLE sale_items ADD COLUMN quantity_new REAL"); } catch(e) {}
    try { db.exec("UPDATE sale_items SET quantity_new = CAST(quantity AS REAL)"); } catch(e) {}
    try { db.exec("ALTER TABLE clients ADD COLUMN credit_limit REAL DEFAULT 0"); } catch(e) {}
    try { db.exec("ALTER TABLE clients ADD COLUMN balance REAL DEFAULT 0"); } catch(e) {}
    try { db.exec("ALTER TABLE store ADD COLUMN nif TEXT"); } catch(e) {}
    try { db.exec("ALTER TABLE store ADD COLUMN address TEXT"); } catch(e) {}
    try { db.exec("ALTER TABLE store ADD COLUMN phone TEXT"); } catch(e) {}
    try { db.exec("ALTER TABLE store ADD COLUMN currency TEXT DEFAULT 'STN'"); } catch(e) {}
    try { db.exec("ALTER TABLE store ADD COLUMN tax_rate REAL DEFAULT 0"); } catch(e) {}
    try { db.exec("ALTER TABLE store ADD COLUMN uses_tax INTEGER DEFAULT 0"); } catch(e) {}
    try { db.exec("ALTER TABLE clients ADD COLUMN email TEXT"); } catch(e) {}
    try { db.exec("ALTER TABLE clients ADD COLUMN whatsapp TEXT"); } catch(e) {}
    try { db.exec("ALTER TABLE clients ADD COLUMN nif TEXT"); } catch(e) {}
    try { db.exec("ALTER TABLE clients ADD COLUMN bank_coordinates TEXT"); } catch(e) {}
    try { db.exec("ALTER TABLE clients ADD COLUMN debt REAL DEFAULT 0"); } catch(e) {}
    try { db.exec("ALTER TABLE sales ADD COLUMN credit_amount REAL DEFAULT 0"); } catch(e) {}
    try { db.exec("ALTER TABLE sales ADD COLUMN balance_amount REAL DEFAULT 0"); } catch(e) {}

    try { db.exec("ALTER TABLE products ADD COLUMN base_unit_id INTEGER"); } catch(e) {}
    try { db.exec("ALTER TABLE products ADD COLUMN tax_id INTEGER"); } catch(e) {}
    try { db.exec("ALTER TABLE products ADD COLUMN stock REAL DEFAULT 0"); } catch(e) {}
    try { db.exec("ALTER TABLE sale_items ADD COLUMN unit_id INTEGER"); } catch(e) {}
    try { db.exec("ALTER TABLE sale_items ADD COLUMN tax_rate REAL DEFAULT 0"); } catch(e) {}
    try { db.exec("ALTER TABLE sale_items ADD COLUMN tax_amount REAL DEFAULT 0"); } catch(e) {}
    try { db.exec("ALTER TABLE sale_items ADD COLUMN subtotal_without_tax REAL DEFAULT 0"); } catch(e) {}
    try { db.exec("ALTER TABLE sales ADD COLUMN total_without_tax REAL DEFAULT 0"); } catch(e) {}
    try { db.exec("ALTER TABLE sales ADD COLUMN total_tax REAL DEFAULT 0"); } catch(e) {}
    try { db.exec("ALTER TABLE sales ADD COLUMN transfer_amount REAL DEFAULT 0"); } catch(e) {}
    try { db.exec("ALTER TABLE sales ADD COLUMN other_amount REAL DEFAULT 0"); } catch(e) {}
    try { db.exec("ALTER TABLE cashier_sessions ADD COLUMN expected_balance REAL"); } catch(e) {}
    try { db.exec("ALTER TABLE cashier_sessions ADD COLUMN counted_balance REAL"); } catch(e) {}
    try { db.exec("ALTER TABLE cashier_sessions ADD COLUMN difference REAL"); } catch(e) {}
    try { db.exec("ALTER TABLE cashier_sessions ADD COLUMN difference_type TEXT"); } catch(e) {}
    try { db.exec("ALTER TABLE cashier_sessions ADD COLUMN justification TEXT"); } catch(e) {}
    try { db.exec("ALTER TABLE cashier_sessions ADD COLUMN status TEXT CHECK(status IN ('open', 'closed')) DEFAULT 'open'"); } catch(e) {}

    // Seed initial price list and tax if not exist
    const plCount = db.prepare("SELECT COUNT(*) as count FROM price_lists").get() as any;
    if (plCount.count === 0) {
      db.prepare("INSERT INTO price_lists (name) VALUES (?)").run("Retalho");
      db.prepare("INSERT INTO price_lists (name) VALUES (?)").run("Grosso");
    }

    const taxCount = db.prepare("SELECT COUNT(*) as count FROM taxes").get() as any;
    if (taxCount.count === 0) {
      db.prepare("INSERT INTO taxes (name, rate) VALUES (?, ?)").run("IVA 15%", 15);
      db.prepare("INSERT INTO taxes (name, rate) VALUES (?, ?)").run("Isento", 0);
    }

    const currencyCount = db.prepare("SELECT COUNT(*) as count FROM currencies").get() as any;
    if (currencyCount.count === 0) {
      const currencies = [
        { name: 'Dobra', symbol: 'Db', rate: 1 },
        { name: 'Euro', symbol: '€', rate: 24.5 },
        { name: 'Dólar', symbol: '$', rate: 22.8 },
        { name: 'Libra', symbol: '£', rate: 28.2 }
      ];
      const insertCurrency = db.prepare("INSERT INTO currencies (name, symbol, rate) VALUES (?, ?, ?)");
      currencies.forEach(c => insertCurrency.run(c.name, c.symbol, c.rate));
    }

    // Seed initial admin if not exists
    const adminExists = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
    if (!adminExists) {
      const adminPassword = bcrypt.hashSync('admin123', 10);
      db.prepare(`
        INSERT INTO users (username, password, role, name) 
        VALUES ('admin', ?, 'admin', 'Administrador')
      `).run(adminPassword);
    }
  } catch (dbError) {
    console.error("Database initialization failed:", dbError);
  }

  app.use(cors());
  app.use(bodyParser.json());

  // --- API Routes ---

  // Auth
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
    
    if (user) {
      const isValid = bcrypt.compareSync(password, user.password) || password === user.password;
      if (isValid) {
        if (password === user.password) {
          db.prepare("UPDATE users SET password = ? WHERE id = ?").run(bcrypt.hashSync(password, 10), user.id);
        }
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } else {
        res.status(401).json({ error: "Credenciais inválidas" });
      }
    } else {
      res.status(401).json({ error: "Credenciais inválidas" });
    }
  });

  // Store
  app.get("/api/store", (req, res) => {
    const store = db.prepare("SELECT * FROM store WHERE id = 1").get();
    res.json(store || {});
  });

  app.post("/api/store", (req, res) => {
    const { name, nif, address, phone, currency, tax_rate, uses_tax, sender_email, sender_password, whatsapp_number, contact_email } = req.body;
    db.prepare(`
      INSERT OR REPLACE INTO store (id, name, nif, address, phone, currency, tax_rate, uses_tax, sender_email, sender_password, whatsapp_number, contact_email)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, nif, address, phone, currency, tax_rate, uses_tax ? 1 : 0, sender_email, sender_password, whatsapp_number, contact_email);
    res.json({ success: true });
  });

  // Price Lists
  app.get("/api/price-lists", (req, res) => {
    const lists = db.prepare("SELECT * FROM price_lists ORDER BY name").all();
    res.json(lists);
  });

  app.post("/api/price-lists", (req, res) => {
    const { name } = req.body;
    try {
      const result = db.prepare("INSERT INTO price_lists (name) VALUES (?)").run(name);
      res.json({ id: result.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "Erro ao criar lista de preços" });
    }
  });

  // Taxes
  app.get("/api/taxes", (req, res) => {
    const taxes = db.prepare("SELECT * FROM taxes ORDER BY name").all();
    res.json(taxes);
  });

  app.post("/api/taxes", (req, res) => {
    const { name, rate } = req.body;
    try {
      const result = db.prepare("INSERT INTO taxes (name, rate) VALUES (?, ?)").run(name, rate);
      res.json({ id: result.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "Erro ao criar imposto" });
    }
  });

  // Currencies
  app.get("/api/currencies", (req, res) => {
    const currencies = db.prepare("SELECT * FROM currencies ORDER BY name ASC").all();
    res.json(currencies);
  });

  app.post("/api/currencies", (req, res) => {
    const { name, symbol, rate } = req.body;
    try {
      const result = db.prepare("INSERT INTO currencies (name, symbol, rate) VALUES (?, ?, ?)").run(name, symbol, rate);
      res.json({ id: result.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "Moeda já existe" });
    }
  });

  app.put("/api/currencies/:id", (req, res) => {
    const { name, symbol, rate, is_active } = req.body;
    db.prepare("UPDATE currencies SET name = ?, symbol = ?, rate = ?, is_active = ? WHERE id = ?")
      .run(name, symbol, rate, is_active ?? 1, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/currencies/:id", (req, res) => {
    db.prepare("DELETE FROM currencies WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Products
  app.get("/api/products", (req, res) => {
    const { all } = req.query;
    const whereClause = all === 'true' ? "" : "WHERE p.is_active = 1";
    const products = db.prepare(`
      SELECT p.*, c.name as category_name, s.name as supplier_name, u.name as creator_name, un.name as unit_name
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN units un ON p.base_unit_id = un.id
      ${whereClause}
      ORDER BY p.name ASC
    `).all();
    res.json(products);
  });

  app.get("/api/products/barcode/:code", (req, res) => {
    // Check in products table
    let product = db.prepare(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.barcode = ? AND p.is_active = 1
    `).get(req.params.code);

    // If not found, check in product_units table
    if (!product) {
      const pu = db.prepare(`
        SELECT pu.*, p.*, c.name as category_name
        FROM product_units pu
        JOIN products p ON pu.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE pu.barcode = ? AND p.is_active = 1
      `).get(req.params.code) as any;
      
      if (pu) {
        product = { ...pu, is_unit_barcode: true, unit_id_from_barcode: pu.unit_id };
      }
    }

    res.json(product || null);
  });

  app.get("/api/products/:id", (req, res) => {
    const product = db.prepare(`
      SELECT p.*, c.name as category_name, s.name as supplier_name, u.name as creator_name, un.name as unit_name, un.name as base_unit_name
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN units un ON p.base_unit_id = un.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (product) {
      const units = db.prepare(`
        SELECT pu.*, u.name as unit_name, u.symbol as unit_symbol
        FROM product_units pu
        JOIN units u ON pu.unit_id = u.id
        WHERE pu.product_id = ?
      `).all(req.params.id);

      const prices = db.prepare(`
        SELECT pp.*, pl.name as price_list_name, u.name as unit_name
        FROM product_prices pp
        JOIN price_lists pl ON pp.price_list_id = pl.id
        JOIN units u ON pp.unit_id = u.id
        WHERE pp.product_id = ?
      `).all(req.params.id);

      res.json({ ...product, units, prices });
    } else {
      res.status(404).json({ error: "Produto não encontrado" });
    }
  });

  app.get("/api/product-units", (req, res) => {
    const units = db.prepare(`SELECT * FROM product_units`).all();
    res.json(units);
  });

  app.get("/api/product-prices", (req, res) => {
    const prices = db.prepare(`SELECT * FROM product_prices`).all();
    res.json(prices);
  });

  app.post("/api/products/:id/units", (req, res) => {
    const { unit_id, conversion_factor, barcode } = req.body;
    try {
      db.prepare(`
        INSERT INTO product_units (product_id, unit_id, conversion_factor, barcode)
        VALUES (?, ?, ?, ?)
      `).run(req.params.id, unit_id, conversion_factor, barcode || null);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Erro ao adicionar unidade ao produto" });
    }
  });

  app.post("/api/products/:id/prices", (req, res) => {
    const { price_list_id, unit_id, price } = req.body;
    try {
      db.prepare(`
        INSERT OR REPLACE INTO product_prices (product_id, price_list_id, unit_id, price)
        VALUES (?, ?, ?, ?)
      `).run(req.params.id, price_list_id, unit_id, price);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Erro ao adicionar preço ao produto" });
    }
  });

  app.delete("/api/product-units/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM product_units WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Erro ao remover unidade" });
    }
  });

  app.delete("/api/product-prices/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM product_prices WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Erro ao remover preço" });
    }
  });

  app.get("/api/products/generate-barcode", (req, res) => {
    const lastProduct = db.prepare("SELECT id FROM products ORDER BY id DESC LIMIT 1").get() as any;
    const nextId = (lastProduct?.id || 0) + 1;
    const barcode = `STP${String(nextId).padStart(7, '0')}`;
    res.json({ barcode });
  });

  app.post("/api/products/import", upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum ficheiro enviado" });
    }

    try {
      let data: any[] = [];
      const filename = req.file.originalname.toLowerCase();

      if (filename.endsWith('.json')) {
        const parsedJson = JSON.parse(req.file.buffer.toString('utf-8'));
        // Handle both direct array and object with 'products' array
        data = Array.isArray(parsedJson) ? parsedJson : (parsedJson.products || []);
      } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = xlsx.utils.sheet_to_json(sheet);
      } else {
        return res.status(400).json({ error: "Formato de ficheiro não suportado. Use .json, .xlsx ou .xls" });
      }

      if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ error: "O ficheiro está vazio ou tem um formato inválido" });
      }

      const transaction = db.transaction((products) => {
        let importedCount = 0;
        
        // Prepare statements for lookups/inserts
        const getCat = db.prepare("SELECT id FROM categories WHERE name = ? COLLATE NOCASE");
        const insertCat = db.prepare("INSERT INTO categories (name) VALUES (?)");
        
        const getSup = db.prepare("SELECT id FROM suppliers WHERE name = ? COLLATE NOCASE");
        const insertSup = db.prepare("INSERT INTO suppliers (name) VALUES (?)");
        
        const getUnit = db.prepare("SELECT id FROM units WHERE name = ? COLLATE NOCASE");
        const insertUnit = db.prepare("INSERT INTO units (name) VALUES (?)");

        const getProductByBarcode = db.prepare("SELECT id FROM products WHERE barcode = ?");
        
        const insertProduct = db.prepare(`
          INSERT INTO products (name, barcode, purchase_price, sale_price, category_id, supplier_id, stock_base, min_stock, description, base_unit_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const updateProduct = db.prepare(`
          UPDATE products 
          SET name = ?, purchase_price = ?, sale_price = ?, category_id = ?, supplier_id = ?, stock_base = ?, min_stock = ?, description = ?, base_unit_id = ?
          WHERE barcode = ?
        `);

        for (const row of products) {
          if (!row.name) continue; // Skip rows without a name

          // Helper to get or create related entities
          const getOrCreateId = (name: string, getStmt: any, insertStmt: any) => {
            if (!name) return null;
            const existing = getStmt.get(name);
            if (existing) return existing.id;
            try {
              const res = insertStmt.run(name);
              return res.lastInsertRowid;
            } catch (e) {
              return null;
            }
          };

          const category_id = getOrCreateId(row.category_name || row.categoria, getCat, insertCat);
          const supplier_id = getOrCreateId(row.supplier_name || row.fornecedor, getSup, insertSup);
          const base_unit_id = getOrCreateId(row.unit_name || row.unidade, getUnit, insertUnit);

          const barcode = row.barcode || row.codigo_barras || null;
          const purchase_price = Number(row.purchase_price || row.preco_compra) || 0;
          const sale_price = Number(row.sale_price || row.preco_venda) || 0;
          const stock_base = Number(row.stock_base || row.stock || row.estoque) || 0;
          const min_stock = Number(row.min_stock || row.stock_minimo) || 5;
          const description = row.description || row.descricao || null;

          if (barcode) {
            const existing = getProductByBarcode.get(barcode);
            if (existing) {
              updateProduct.run(row.name, purchase_price, sale_price, category_id, supplier_id, stock_base, min_stock, description, base_unit_id, barcode);
              importedCount++;
              continue;
            }
          }

          insertProduct.run(row.name, barcode, purchase_price, sale_price, category_id, supplier_id, stock_base, min_stock, description, base_unit_id);
          importedCount++;
        }
        return importedCount;
      });

      const count = transaction(data);
      
      // Log import
      db.prepare(`
        INSERT INTO audit_logs (user_id, action, entity_type, details)
        VALUES (?, 'import', 'product', ?)
      `).run(req.body.user_id, `Importação de produtos realizada: ${count} produtos importados.`);

      res.json({ success: true, count, message: `${count} produtos importados com sucesso.` });

    } catch (err: any) {
      console.error("Import error:", err);
      res.status(500).json({ error: "Erro ao processar o ficheiro de importação" });
    }
  });

  app.post("/api/products", (req, res) => {
    const { name, barcode, purchase_price, sale_price, category_id, supplier_id, stock_base, min_stock, is_favorite, description, user_id, unit_id, base_unit_id, tax_id } = req.body;
    
    if (!name) return res.status(400).json({ error: "Nome é obrigatório" });

    try {
      const result = db.prepare(`
        INSERT INTO products (name, barcode, purchase_price, sale_price, category_id, supplier_id, stock_base, min_stock, is_favorite, description, created_by, unit_id, base_unit_id, tax_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(name, barcode || null, Number(purchase_price) || 0, Number(sale_price) || 0, category_id || null, supplier_id || null, Number(stock_base) || 0, Number(min_stock) || 5, is_favorite || 0, description, user_id, unit_id || null, base_unit_id || null, tax_id || null);
      
      // Log creation
      db.prepare(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
        VALUES (?, 'create', 'product', ?, ?)
      `).run(user_id, result.lastInsertRowid, `Produto criado: ${name}`);

      res.json({ id: result.lastInsertRowid });
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: "Código de barras já existe" });
      } else {
        res.status(500).json({ error: "Erro ao criar produto" });
      }
    }
  });

  app.put("/api/products/:id", (req, res) => {
    const { name, barcode, purchase_price, sale_price, category_id, supplier_id, stock_base, min_stock, is_favorite, description, is_active, unit_id, base_unit_id, tax_id, user_id } = req.body;
    try {
      db.prepare(`
        UPDATE products 
        SET name = ?, barcode = ?, purchase_price = ?, sale_price = ?, category_id = ?, supplier_id = ?, stock_base = ?, min_stock = ?, is_favorite = ?, description = ?, is_active = ?, unit_id = ?, base_unit_id = ?, tax_id = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name, barcode || null, purchase_price, sale_price, category_id || null, supplier_id || null, stock_base, min_stock, is_favorite, description, is_active ?? 1, unit_id || null, base_unit_id || null, tax_id || null, user_id, req.params.id);
      
      // Log update
      db.prepare(`
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
        VALUES (?, 'update', 'product', ?, ?)
      `).run(user_id, req.params.id, `Produto atualizado: ${name}`);

      res.json({ success: true });
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: "Código de barras já existe" });
      } else {
        res.status(500).json({ error: "Erro ao atualizar produto" });
      }
    }
  });

  app.post("/api/products/:id/stock", (req, res) => {
    const { quantity, type, reason, user_id, unit } = req.body;
    
    if (isNaN(quantity) || quantity === null) {
      return res.status(400).json({ error: "Quantidade inválida" });
    }

    try {
      const transaction = db.transaction(() => {
        const product = db.prepare("SELECT stock_base FROM products WHERE id = ?").get(req.params.id) as any;
        let currentStock = product ? product.stock_base : 0;

        let diff = quantity;
        if (type === 'adjustment') {
          diff = quantity - currentStock;
          db.prepare("UPDATE products SET stock_base = ? WHERE id = ?").run(quantity, req.params.id);
        } else {
          db.prepare("UPDATE products SET stock_base = stock_base + ? WHERE id = ?").run(quantity, req.params.id);
        }

        db.prepare(`
          INSERT INTO stock_movements (product_id, user_id, type, quantity, unit, reason)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(req.params.id, user_id, type, diff, unit || 'un', reason);

        // Log stock adjustment
        db.prepare(`
          INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
          VALUES (?, 'stock_adjustment', 'product', ?, ?)
        `).run(user_id, req.params.id, `Ajuste de stock: ${diff > 0 ? '+' : ''}${diff}. Motivo: ${reason}`);
      });
      transaction();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "Erro ao atualizar stock" });
    }
  });

  app.get("/api/products/:id/history", (req, res) => {
    const history = db.prepare(`
      SELECT sm.*, u.name as user_name
      FROM stock_movements sm
      JOIN users u ON sm.user_id = u.id
      WHERE sm.product_id = ?
      ORDER BY sm.created_at DESC
      LIMIT 50
    `).all(req.params.id);
    res.json(history);
  });

  app.put("/api/products/:id/status", (req, res) => {
    const { is_active } = req.body;
    db.prepare("UPDATE products SET is_active = ? WHERE id = ?").run(is_active, req.params.id);
    res.json({ success: true });
  });

  app.post("/api/products/bulk-delete", (req, res) => {
    const { ids, user_id } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "Nenhum produto selecionado" });
    }

    try {
      const transaction = db.transaction((productIds) => {
        let deletedCount = 0;
        const checkSales = db.prepare("SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?");
        const deleteProduct = db.prepare("DELETE FROM products WHERE id = ?");
        const deletePrices = db.prepare("DELETE FROM product_prices WHERE product_id = ?");
        const deleteUnits = db.prepare("DELETE FROM product_units WHERE product_id = ?");
        const deleteMovements = db.prepare("DELETE FROM stock_movements WHERE product_id = ?");

        for (const id of productIds) {
          const salesCount = checkSales.get(id) as any;
          if (salesCount.count === 0) {
            deletePrices.run(id);
            deleteUnits.run(id);
            deleteMovements.run(id);
            deleteProduct.run(id);
            deletedCount++;
          }
        }
        return deletedCount;
      });

      const count = transaction(ids);
      
      // Log bulk delete
      db.prepare(`
        INSERT INTO audit_logs (user_id, action, entity_type, details)
        VALUES (?, 'bulk_delete', 'product', ?)
      `).run(user_id, `Eliminação em massa realizada: ${count} produtos eliminados.`);

      if (count < ids.length) {
        res.json({ success: true, message: `${count} produtos eliminados. Alguns produtos não puderam ser eliminados pois têm vendas associadas.` });
      } else {
        res.json({ success: true, message: `${count} produtos eliminados com sucesso.` });
      }
    } catch (err: any) {
      res.status(500).json({ error: "Erro ao eliminar produtos" });
    }
  });

  app.delete("/api/products/:id", (req, res) => {
    try {
      const productId = req.params.id;
      
      // Check if product has sales
      const salesCount = db.prepare("SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?").get(productId) as any;
      if (salesCount.count > 0) {
        return res.status(400).json({ error: "Não é possível eliminar o produto pois já existem vendas associadas. Considere inativar o produto." });
      }

      const deleteTransaction = db.transaction(() => {
        const product = db.prepare("SELECT name FROM products WHERE id = ?").get(productId) as any;
        const productName = product ? product.name : "Desconhecido";

        db.prepare("DELETE FROM product_prices WHERE product_id = ?").run(productId);
        db.prepare("DELETE FROM product_units WHERE product_id = ?").run(productId);
        db.prepare("DELETE FROM stock_movements WHERE product_id = ?").run(productId);
        db.prepare("DELETE FROM products WHERE id = ?").run(productId);

        // Log deletion
        const user_id = req.headers['x-user-id'] || req.body.user_id;
        db.prepare(`
          INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
          VALUES (?, 'delete', 'product', ?, ?)
        `).run(user_id, productId, `Produto eliminado: ${productName}`);
      });
      
      deleteTransaction();
      res.json({ success: true });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Erro ao eliminar produto." });
    }
  });

  app.put("/api/products/:id/favorite", (req, res) => {
    const { is_favorite } = req.body;
    db.prepare("UPDATE products SET is_favorite = ? WHERE id = ?").run(is_favorite, req.params.id);
    res.json({ success: true });
  });

  // Units
  app.get("/api/units", (req, res) => {
    const units = db.prepare("SELECT * FROM units ORDER BY name ASC").all();
    res.json(units);
  });

  app.post("/api/units", (req, res) => {
    const { name, symbol } = req.body;
    try {
      const result = db.prepare("INSERT INTO units (name, symbol) VALUES (?, ?)").run(name, symbol);
      res.json({ id: result.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "Unidade já existe" });
    }
  });

  app.put("/api/units/:id", (req, res) => {
    const { name, symbol } = req.body;
    db.prepare("UPDATE units SET name = ?, symbol = ? WHERE id = ?").run(name, symbol, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/units/:id", (req, res) => {
    db.prepare("DELETE FROM units WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Categories
  app.get("/api/categories", (req, res) => {
    res.json(db.prepare("SELECT * FROM categories").all());
  });

  app.post("/api/categories", (req, res) => {
    const result = db.prepare("INSERT INTO categories (name) VALUES (?)").run(req.body.name);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/categories/:id", (req, res) => {
    db.prepare("UPDATE categories SET name = ? WHERE id = ?").run(req.body.name, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/categories/:id", (req, res) => {
    db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Users
  app.get("/api/users", (req, res) => {
    res.json(db.prepare("SELECT id, username, role, name FROM users").all());
  });

  app.post("/api/users", (req, res) => {
    const { username, password, role, name } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
      const result = db.prepare("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)")
        .run(username, hashedPassword, role, name);
      res.json({ id: result.lastInsertRowid });
    } catch (err) {
      res.status(400).json({ error: "Utilizador já existe" });
    }
  });

  app.put("/api/users/:id", (req, res) => {
    const { name, role, password } = req.body;
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare("UPDATE users SET name = ?, role = ?, password = ? WHERE id = ?")
        .run(name, role, hashedPassword, req.params.id);
    } else {
      db.prepare("UPDATE users SET name = ?, role = ? WHERE id = ?")
        .run(name, role, req.params.id);
    }
    res.json({ success: true });
  });

  app.delete("/api/users/:id", (req, res) => {
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Suppliers
  app.get("/api/suppliers", (req, res) => {
    res.json(db.prepare("SELECT * FROM suppliers").all());
  });

  app.post("/api/suppliers", (req, res) => {
    const { name, phone, email } = req.body;
    const result = db.prepare("INSERT INTO suppliers (name, phone, email) VALUES (?, ?, ?)")
      .run(name, phone, email);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/suppliers/:id", (req, res) => {
    const { name, phone, email } = req.body;
    db.prepare("UPDATE suppliers SET name = ?, phone = ?, email = ? WHERE id = ?")
      .run(name, phone, email, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/suppliers/:id", (req, res) => {
    db.prepare("DELETE FROM suppliers WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Backup & Export
  app.get("/api/backup/export", (req, res) => {
    const tables = ['store', 'users', 'categories', 'products', 'clients', 'suppliers', 'sales', 'sale_items', 'cashier_sessions'];
    const data: any = {};
    for (const table of tables) {
      data[table] = db.prepare(`SELECT * FROM ${table}`).all();
    }
    res.json(data);
  });

  app.post("/api/backup/import", (req, res) => {
    const data = req.body;
    const user_id = req.headers['x-user-id'];

    try {
      db.exec("PRAGMA foreign_keys = OFF");
      const transaction = db.transaction(() => {
        for (const table in data) {
          if (!Array.isArray(data[table]) || data[table].length === 0) continue;
          
          db.prepare(`DELETE FROM ${table}`).run();
          const columns = Object.keys(data[table][0]).join(', ');
          const placeholders = Object.keys(data[table][0]).map(() => '?').join(', ');
          const insert = db.prepare(`INSERT INTO ${table} (${columns}) VALUES (${placeholders})`);
          
          for (const row of data[table]) {
            insert.run(Object.values(row));
          }
        }

        // Log the backup import
        db.prepare(`
          INSERT INTO audit_logs (user_id, action, entity_type, details)
          VALUES (?, 'backup_import', 'system', ?)
        `).run(user_id, `Importação de backup realizada. Tabelas: ${Object.keys(data).join(', ')}`);
      });

      transaction();
      db.exec("PRAGMA foreign_keys = ON");
      res.json({ success: true });
    } catch (err) {
      db.exec("PRAGMA foreign_keys = ON");
      console.error("Erro na importação de backup:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Audit Logs
  app.get("/api/audit-logs", (req, res) => {
    const logs = db.prepare(`
      SELECT al.*, u.name as user_name 
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 500
    `).all();
    res.json(logs);
  });

  app.post("/api/audit-logs/clear", (req, res) => {
    db.prepare("DELETE FROM audit_logs").run();
    res.json({ success: true });
  });

  // Cashier Sessions
  app.get("/api/sessions/active/:userId", (req, res) => {
    const session = db.prepare("SELECT * FROM cashier_sessions WHERE user_id = ? AND status = 'open'").get(req.params.userId);
    res.json(session || null);
  });

  app.post("/api/sessions/open", (req, res) => {
    const { user_id, opening_balance } = req.body;
    const result = db.prepare("INSERT INTO cashier_sessions (user_id, opening_balance) VALUES (?, ?)").run(user_id, opening_balance);
    res.json({ id: result.lastInsertRowid });
  });

  app.post("/api/sessions/close", (req, res) => {
    const { id, closing_balance } = req.body;
    db.prepare("UPDATE cashier_sessions SET closing_time = CURRENT_TIMESTAMP, closing_balance = ?, status = 'closed' WHERE id = ?")
      .run(closing_balance, id);
    res.json({ success: true });
  });

  // Cashier Sessions
  app.get("/api/sessions/active/:userId", (req, res) => {
    const session = db.prepare("SELECT * FROM cashier_sessions WHERE user_id = ? AND status = 'open'").get(req.params.userId);
    res.json(session || null);
  });

  app.post("/api/sessions/open", (req, res) => {
    const { user_id, opening_balance } = req.body;
    
    // Check if user already has an open session
    const existing = db.prepare("SELECT id FROM cashier_sessions WHERE user_id = ? AND status = 'open'").get(user_id);
    if (existing) {
      return res.status(400).json({ error: "Já existe um caixa aberto para este utilizador." });
    }

    const result = db.prepare("INSERT INTO cashier_sessions (user_id, opening_balance, status) VALUES (?, ?, 'open')")
      .run(user_id, opening_balance);
    
    // Audit log
    db.prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, 'session_open', 'cashier_session', ?, ?)")
      .run(user_id, result.lastInsertRowid, `Abertura de caixa com saldo inicial de ${opening_balance}`);

    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/sessions/summary/:sessionId", (req, res) => {
    const sessionId = req.params.sessionId;
    const session = db.prepare("SELECT * FROM cashier_sessions WHERE id = ?").get(sessionId) as any;
    
    if (!session) return res.status(404).json({ error: "Sessão não encontrada" });

    // Sales by payment method
    const sales = db.prepare(`
      SELECT 
        SUM(total) as total_sales,
        SUM(cash_amount) as total_cash,
        SUM(card_amount) as total_card,
        SUM(transfer_amount) as total_transfer,
        SUM(other_amount) as total_other,
        SUM(change_amount) as total_change
      FROM sales 
      WHERE session_id = ?
    `).get(sessionId) as any;

    // Cash movements
    const movements = db.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'entry' THEN amount ELSE 0 END) as total_entries,
        SUM(CASE WHEN type = 'exit' THEN amount ELSE 0 END) as total_exits
      FROM cash_movements
      WHERE session_id = ?
    `).get(sessionId) as any;

    const total_cash_sales = (sales.total_cash || 0) - (sales.total_change || 0);
    const expected_balance = session.opening_balance + total_cash_sales + (movements.total_entries || 0) - (movements.total_exits || 0);

    res.json({
      session,
      sales: {
        total: sales.total_sales || 0,
        cash: total_cash_sales,
        card: sales.total_card || 0,
        transfer: sales.total_transfer || 0,
        other: sales.total_other || 0
      },
      movements: {
        entries: movements.total_entries || 0,
        exits: movements.total_exits || 0
      },
      expected_balance
    });
  });

  app.post("/api/sessions/close", (req, res) => {
    const { session_id, counted_balance, user_id, justification } = req.body;
    console.log("Fecho de caixa solicitado:", { session_id, counted_balance, user_id, justification });
    
    const user = db.prepare("SELECT role FROM users WHERE id = ?").get(user_id) as any;
    if (!user) return res.status(404).json({ error: "Utilizador não encontrado" });

    const summaryRes = db.prepare(`
      SELECT 
        s.opening_balance,
        (SELECT COALESCE(SUM(cash_amount - change_amount), 0) FROM sales WHERE session_id = ?) as cash_sales,
        (SELECT COALESCE(SUM(amount), 0) FROM cash_movements WHERE session_id = ? AND type = 'entry') as entries,
        (SELECT COALESCE(SUM(amount), 0) FROM cash_movements WHERE session_id = ? AND type = 'exit') as exits
      FROM cashier_sessions s
      WHERE s.id = ?
    `).get(session_id, session_id, session_id, session_id) as any;

    const expected_balance = summaryRes.opening_balance + summaryRes.cash_sales + summaryRes.entries - summaryRes.exits;
    const difference = counted_balance - expected_balance;
    
    let difference_type = null;
    if (difference < 0) difference_type = "Quebra de Caixa";
    else if (difference > 0) difference_type = "Sobra de Caixa";

    // Permission check
    if (difference !== 0) {
      if (!justification || justification.trim() === "") {
        return res.status(400).json({ error: "Justificação é obrigatória quando existe diferença no caixa." });
      }

      const absDiff = Math.abs(difference);
      if (user.role === 'cashier' && absDiff > 50) {
        return res.status(403).json({ error: "Operadores não podem fechar caixa com diferenças superiores a 50 STN sem aprovação de um supervisor." });
      }
      // Supervisors can approve larger differences (e.g. up to 500)
      if (user.role === 'supervisor' && absDiff > 500) {
        return res.status(403).json({ error: "Supervisores não podem fechar caixa com diferenças superiores a 500 STN sem aprovação de um administrador." });
      }
    }

    db.prepare(`
      UPDATE cashier_sessions 
      SET closing_time = CURRENT_TIMESTAMP, 
          status = 'closed', 
          expected_balance = ?, 
          counted_balance = ?, 
          difference = ?,
          difference_type = ?,
          justification = ?
      WHERE id = ?
    `).run(expected_balance, counted_balance, difference, difference_type, justification, session_id);

    // Audit log
    db.prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, 'session_close', 'cashier_session', ?, ?)")
      .run(user_id, session_id, `Fecho de caixa. Esperado: ${expected_balance}, Contado: ${counted_balance}, Diferença: ${difference} (${difference_type || 'Nenhuma'}). Justificação: ${justification || 'N/A'}`);

    // Create notification for Admin/Supervisor if there's a difference
    if (Math.abs(difference) > 0.01) {
      const operatorName = db.prepare("SELECT name FROM users WHERE id = ?").get(user_id) as any;
      db.prepare(`
        INSERT INTO notifications (type, title, message, metadata)
        VALUES (?, ?, ?, ?)
      `).run(
        'cash_discrepancy',
        'Divergência de Caixa',
        `O operador ${operatorName?.name || 'Desconhecido'} fechou o caixa com uma diferença de ${difference.toFixed(2)} STN (${difference_type}).`,
        JSON.stringify({ session_id, difference, type: difference_type, operator_id: user_id })
      );
    }

    res.json({ success: true, expected_balance, difference, difference_type });
  });

  app.get("/api/sessions/history", (req, res) => {
    const sessions = db.prepare(`
      SELECT s.*, u.name as user_name 
      FROM cashier_sessions s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.opening_time DESC
    `).all();
    res.json(sessions);
  });

  app.get("/api/sessions/discrepancies", (req, res) => {
    const sessions = db.prepare(`
      SELECT s.*, u.name as user_name 
      FROM cashier_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.difference != 0 AND s.status = 'closed'
      ORDER BY s.closing_time DESC
    `).all();
    res.json(sessions);
  });

  // --- Returns ---
  app.get("/api/sales/:id", (req, res) => {
    const sale = db.prepare(`
      SELECT s.*, c.name as client_name 
      FROM sales s 
      LEFT JOIN clients c ON s.client_id = c.id 
      WHERE s.id = ?
    `).get(req.params.id) as any;
    
    if (!sale) return res.status(404).json({ error: "Venda não encontrada" });
    
    const items = db.prepare(`
      SELECT si.*, p.name as product_name, p.barcode
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `).all(req.params.id);
    
    const returns = db.prepare(`
      SELECT ri.product_id, SUM(ri.quantity) as returned_quantity
      FROM return_items ri
      JOIN returns r ON ri.return_id = r.id
      WHERE r.sale_id = ?
      GROUP BY ri.product_id
    `).all(req.params.id) as any[];

    const returnedMap = returns.reduce((acc, curr) => {
      acc[curr.product_id] = curr.returned_quantity;
      return acc;
    }, {} as Record<number, number>);

    res.json({ ...sale, items, returnedMap });
  });

  app.post("/api/returns", (req, res) => {
    const { sale_id, user_id, session_id, items: providedItems, reason } = req.body;
    
    const sale = db.prepare("SELECT * FROM sales WHERE id = ?").get(sale_id) as any;
    if (!sale) return res.status(404).json({ error: "Venda não encontrada" });

    // If no items provided, return all items from the sale
    let itemsToReturn = providedItems;
    if (!itemsToReturn || itemsToReturn.length === 0) {
      itemsToReturn = db.prepare("SELECT * FROM sale_items WHERE sale_id = ?").all(sale_id);
    }

    if (!itemsToReturn || itemsToReturn.length === 0) {
      return res.status(400).json({ error: "Nenhum item para devolver." });
    }

    const total_amount = itemsToReturn.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0);

    const transaction = db.transaction(() => {
      const returnResult = db.prepare(`
        INSERT INTO returns (sale_id, user_id, session_id, total_amount, reason)
        VALUES (?, ?, ?, ?, ?)
      `).run(sale_id, user_id, session_id || sale.session_id, total_amount, reason);
      const return_id = returnResult.lastInsertRowid;

      for (const item of itemsToReturn) {
        db.prepare(`
          INSERT INTO return_items (return_id, product_id, quantity, price, subtotal)
          VALUES (?, ?, ?, ?, ?)
        `).run(return_id, item.product_id, item.quantity, item.price, item.quantity * item.price);

        // Handle stock return
        const product = db.prepare("SELECT * FROM products WHERE id = ?").get(item.product_id) as any;
        if (product) {
          let conversionFactor = 1;
          if (item.unit_id && item.unit_id !== product.unit_id) {
            const pu = db.prepare("SELECT conversion_factor FROM product_units WHERE product_id = ? AND unit_id = ?").get(item.product_id, item.unit_id) as any;
            if (pu) conversionFactor = pu.conversion_factor;
          }

          const quantityInBase = item.quantity * conversionFactor;
          
          if (product.type === 'fracionado') {
            db.prepare("UPDATE products SET stock_fracionado = stock_fracionado + ? WHERE id = ?").run(quantityInBase, item.product_id);
          } else {
            db.prepare("UPDATE products SET stock_base = stock_base + ? WHERE id = ?").run(quantityInBase, item.product_id);
          }

          db.prepare(`
            INSERT INTO stock_movements (product_id, user_id, type, quantity, reason)
            VALUES (?, ?, 'in', ?, ?)
          `).run(item.product_id, user_id, quantityInBase, `Devolução da venda #${sale_id}: ${reason}`);
        }
      }

      // Refund client if applicable
      if (sale.client_id) {
        const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(sale.client_id) as any;
        if (client) {
          let refundToBalance = 0;
          let refundToDebt = 0;

          // For simplicity, if it's a partial return, we refund balance first then debt
          if (sale.balance_amount > 0) {
            refundToBalance = Math.min(total_amount, sale.balance_amount);
          }
          if (sale.credit_amount > 0) {
            refundToDebt = Math.min(total_amount - refundToBalance, sale.credit_amount);
          }

          if (refundToBalance > 0 || refundToDebt > 0) {
            db.prepare("UPDATE clients SET balance = balance + ?, debt = debt - ? WHERE id = ?")
              .run(refundToBalance, refundToDebt, sale.client_id);
            
            if (refundToBalance > 0) {
              db.prepare("INSERT INTO client_transactions (client_id, type, amount, description, sale_id, user_id) VALUES (?, 'deposit', ?, ?, ?, ?)")
                .run(sale.client_id, refundToBalance, `Estorno por devolução #${sale_id}`, sale_id, user_id);
            }
            if (refundToDebt > 0) {
              db.prepare("INSERT INTO client_transactions (client_id, type, amount, description, sale_id, user_id) VALUES (?, 'debt_payment', ?, ?, ?, ?)")
                .run(sale.client_id, refundToDebt, `Estorno por devolução #${sale_id}`, sale_id, user_id);
            }
          }
        }
      }

      // Record cash movement if cash was paid
      if (sale.cash_amount > 0) {
         const refundCash = Math.min(total_amount, sale.cash_amount);
         db.prepare(`
           INSERT INTO cash_movements (session_id, user_id, type, amount, description)
           VALUES (?, ?, 'exit', ?, ?)
         `).run(session_id || sale.session_id, user_id, refundCash, `Devolução da venda #${sale_id}`);
      }

      db.prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, 'return', 'sale', ?, ?)")
        .run(user_id, sale_id, `Devolução processada. Valor: ${total_amount}. Motivo: ${reason}`);

      return return_id;
    });

    try {
      const return_id = transaction();
      res.json({ success: true, return_id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao processar devolução" });
    }
  });

  app.get("/api/returns", (req, res) => {
    const returns = db.prepare(`
      SELECT r.*, s.total as original_total, u.name as user_name
      FROM returns r
      JOIN sales s ON r.sale_id = s.id
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `).all();
    res.json(returns);
  });

  app.get("/api/reports/returns", (req, res) => {
    const { start, end } = req.query;
    const mostReturned = db.prepare(`
      SELECT p.name, SUM(ri.quantity) as total_quantity, SUM(ri.subtotal) as total_value
      FROM return_items ri
      JOIN products p ON ri.product_id = p.id
      JOIN returns r ON ri.return_id = r.id
      WHERE r.created_at BETWEEN ? AND ?
      GROUP BY p.id
      ORDER BY total_quantity DESC
      LIMIT 10
    `).all(start || '1970-01-01', end || '9999-12-31');

    const summary = db.prepare(`
      SELECT COUNT(*) as count, SUM(total_amount) as total
      FROM returns
      WHERE created_at BETWEEN ? AND ?
    `).get(start || '1970-01-01', end || '9999-12-31');

    res.json({ mostReturned, summary });
  });

  app.post("/api/cash-movements", (req, res) => {
    const { session_id, user_id, type, amount, description } = req.body;
    
    const result = db.prepare("INSERT INTO cash_movements (session_id, user_id, type, amount, description) VALUES (?, ?, ?, ?, ?)")
      .run(session_id, user_id, type, amount, description);
    
    // Audit log
    db.prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, 'cash_movement', 'cash_movement', ?, ?)")
      .run(user_id, result.lastInsertRowid, `Movimento de caixa (${type}): ${amount} - ${description}`);

    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/cash-movements/:sessionId", (req, res) => {
    const movements = db.prepare("SELECT * FROM cash_movements WHERE session_id = ? ORDER BY created_at DESC").all(req.params.sessionId);
    res.json(movements);
  });

  // Proformas
  app.post("/api/proformas", (req, res) => {
    const { client_id, total, total_without_tax, total_tax, user_id, items } = req.body;
    
    console.log(`[API] Creating proforma: total=${total}, items=${items?.length}`);

    const transaction = db.transaction(() => {
      const proformaResult = db.prepare(`
        INSERT INTO proformas (client_id, total, total_without_tax, total_tax, user_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(client_id, total, total_without_tax || 0, total_tax || 0, user_id);
      
      const proformaId = proformaResult.lastInsertRowid;
      
      const insertItem = db.prepare(`
        INSERT INTO proforma_items (proforma_id, product_id, quantity, price, unit_id, tax_rate, tax_amount, subtotal_without_tax)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const item of items) {
        insertItem.run(
          proformaId,
          item.product_id,
          item.quantity,
          item.price,
          item.unit_id || null,
          item.tax_rate || 0,
          item.tax_amount || 0,
          item.subtotal_without_tax || 0
        );
      }
      
      return proformaId;
    });

    try {
      const proformaId = transaction();
      res.json({ success: true, proformaId });
    } catch (error: any) {
      console.error("[API] Error creating proforma:", error);
      res.status(500).json({ error: error.message || "Erro ao gerar fatura proforma" });
    }
  });

  // Sales
  app.post("/api/sales", (req, res) => {
    const { session_id, client_id, total, payment_method, cash_amount, card_amount, transfer_amount, other_amount, credit_amount, balance_amount, change_amount, items, user_id, total_without_tax, total_tax } = req.body;
    
    console.log(`[API] Creating sale: session=${session_id}, total=${total}, items=${items?.length || 0}`);

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error("[API] Sale failed: No items provided");
      return res.status(400).json({ error: "A venda deve conter pelo menos um item." });
    }

    const transaction = db.transaction(() => {
      // Check if session is still open
      const session = db.prepare("SELECT status FROM cashier_sessions WHERE id = ?").get(session_id) as any;
      if (!session || session.status !== 'open') {
        console.error(`[API] Sale failed: session ${session_id} is ${session?.status || 'not found'}`);
        throw new Error("Não é possível realizar vendas com o caixa fechado.");
      }

      // Handle client credit and balance
      if (client_id && (credit_amount > 0 || balance_amount > 0)) {
        const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(client_id) as any;
        if (!client) throw new Error("Cliente não encontrado.");

        let newBalance = client.balance;
        let newDebt = client.debt;

        if (balance_amount > 0) {
          if (balance_amount > newBalance) throw new Error("Saldo insuficiente.");
          newBalance -= balance_amount;
        }

        if (credit_amount > 0) {
          if (newDebt + credit_amount > client.credit_limit) throw new Error("Limite de crédito excedido.");
          newDebt += credit_amount;
        }

        db.prepare("UPDATE clients SET balance = ?, debt = ? WHERE id = ?").run(newBalance, newDebt, client_id);
      }

      const saleResult = db.prepare(`
        INSERT INTO sales (session_id, client_id, total, payment_method, cash_amount, card_amount, transfer_amount, other_amount, credit_amount, balance_amount, change_amount, total_without_tax, total_tax)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(session_id, client_id, total, payment_method, cash_amount, card_amount, transfer_amount || 0, other_amount || 0, credit_amount || 0, balance_amount || 0, change_amount, total_without_tax || 0, total_tax || 0);

      console.log(`[API] Sale created successfully: id=${saleResult.lastInsertRowid}`);
      
      const saleId = saleResult.lastInsertRowid;

      // Record client transactions if applicable
      if (client_id) {
        if (balance_amount > 0) {
          db.prepare(`
            INSERT INTO client_transactions (client_id, type, amount, description, sale_id, user_id) 
            VALUES (?, 'purchase_balance', ?, 'Compra com saldo', ?, ?)
          `).run(client_id, balance_amount, saleId, user_id);
        }
        if (credit_amount > 0) {
          db.prepare(`
            INSERT INTO client_transactions (client_id, type, amount, description, sale_id, user_id) 
            VALUES (?, 'purchase_credit', ?, 'Compra a crédito', ?, ?)
          `).run(client_id, credit_amount, saleId, user_id);
        }
      }
      
      const insertItem = db.prepare(`
        INSERT INTO sale_items (sale_id, product_id, quantity, price, unit_id, tax_rate, tax_amount, subtotal_without_tax)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const insertMovement = db.prepare(`
        INSERT INTO stock_movements (product_id, user_id, type, quantity, unit, reason)
        VALUES (?, ?, 'sale', ?, ?, ?)
      `);
      
      for (const item of items) {
        const product = db.prepare("SELECT * FROM products WHERE id = ?").get(item.product_id) as any;
        
        insertItem.run(saleId, item.product_id, item.quantity, item.price, item.unit_id || null, item.tax_rate || 0, item.tax_amount || 0, item.subtotal_without_tax || 0);
        
        let conversionFactor = 1;
        let unitName = 'un';

        if (item.unit_id && item.unit_id !== product.base_unit_id) {
           const pu = db.prepare("SELECT conversion_factor FROM product_units WHERE product_id = ? AND unit_id = ?").get(item.product_id, item.unit_id) as any;
           if (pu) {
             conversionFactor = pu.conversion_factor;
           }
           const u = db.prepare("SELECT name FROM units WHERE id = ?").get(item.unit_id) as any;
           if (u) unitName = u.name;
        } else if (product.base_unit_id) {
           const u = db.prepare("SELECT name FROM units WHERE id = ?").get(product.base_unit_id) as any;
           if (u) unitName = u.name;
        }

        const quantityToDeduct = item.quantity * conversionFactor;

        // Deduct from base stock
        db.prepare("UPDATE products SET stock_base = stock_base - ? WHERE id = ?").run(quantityToDeduct, item.product_id);
        insertMovement.run(item.product_id, user_id, -quantityToDeduct, unitName, `Venda #${saleId}`);
      }
      
      return saleId;
    });
    
    try {
      const saleId = transaction();
      res.json({ id: saleId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/sales/history", (req, res) => {
    try {
      const sales = db.prepare(`
        SELECT s.*, u.name as user_name, c.name as client_name
        FROM sales s
        LEFT JOIN cashier_sessions cs ON s.session_id = cs.id
        LEFT JOIN users u ON cs.user_id = u.id
        LEFT JOIN clients c ON s.client_id = c.id
        ORDER BY s.created_at DESC
        LIMIT 100
      `).all();
      res.json(sales);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Reports
  app.get("/api/reports/dashboard", (req, res) => {
    const todaySales = db.prepare("SELECT SUM(total) as total FROM sales WHERE date(created_at) = date('now')").get() as any;
    const monthSales = db.prepare("SELECT SUM(total) as total FROM sales WHERE strftime('%m', created_at) = strftime('%m', 'now')").get() as any;
    const lowStock = db.prepare("SELECT COUNT(*) as count FROM products WHERE stock_base <= min_stock").get() as any;
    
    const salesByDay = db.prepare(`
      SELECT date(created_at) as day, SUM(total) as total 
      FROM sales 
      WHERE created_at >= date('now', '-7 days')
      GROUP BY day
      ORDER BY day ASC
    `).all();

    const topProducts = db.prepare(`
      SELECT p.name, SUM(si.quantity) as qty
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      GROUP BY p.id
      ORDER BY qty DESC
      LIMIT 5
    `).all();

    res.json({
      todayTotal: todaySales.total || 0,
      monthTotal: monthSales.total || 0,
      lowStockCount: lowStock.count || 0,
      salesByDay,
      topProducts
    });
  });

  // Clients
  app.get("/api/clients", (req, res) => {
    res.json(db.prepare("SELECT * FROM clients").all());
  });

  app.post("/api/clients", (req, res) => {
    const { name, phone, email, whatsapp, nif, bank_coordinates, credit_limit, balance, debt, price_list_id } = req.body;
    const result = db.prepare("INSERT INTO clients (name, phone, email, whatsapp, nif, bank_coordinates, credit_limit, balance, debt, price_list_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(name, phone, email, whatsapp, nif, bank_coordinates, credit_limit || 0, balance || 0, debt || 0, price_list_id || null);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/clients/:id", (req, res) => {
    const { name, phone, email, whatsapp, nif, bank_coordinates, credit_limit, balance, debt, price_list_id } = req.body;
    db.prepare("UPDATE clients SET name = ?, phone = ?, email = ?, whatsapp = ?, nif = ?, bank_coordinates = ?, credit_limit = ?, balance = ?, debt = ?, price_list_id = ? WHERE id = ?")
      .run(name, phone, email, whatsapp, nif, bank_coordinates, credit_limit, balance, debt, price_list_id || null, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/clients/:id", (req, res) => {
    db.prepare("DELETE FROM clients WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Client Transactions
  app.get("/api/clients/:id/transactions", (req, res) => {
    const transactions = db.prepare(`
      SELECT ct.*, u.name as user_name 
      FROM client_transactions ct
      LEFT JOIN users u ON ct.user_id = u.id
      WHERE ct.client_id = ?
      ORDER BY ct.created_at DESC
    `).all(req.params.id);
    res.json(transactions);
  });

  app.post("/api/clients/:id/transactions", (req, res) => {
    const { type, amount, description, user_id } = req.body;
    const clientId = req.params.id;

    db.exec("BEGIN TRANSACTION");
    try {
      const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(clientId) as any;
      if (!client) throw new Error("Cliente não encontrado");

      let newBalance = client.balance;
      let newDebt = client.debt;

      if (type === 'deposit') {
        newBalance += amount;
      } else if (type === 'debt_payment') {
        if (amount > newDebt) {
          throw new Error("O valor do pagamento é superior à dívida");
        }
        newDebt -= amount;
      } else {
        throw new Error("Tipo de transação inválido");
      }

      db.prepare("UPDATE clients SET balance = ?, debt = ? WHERE id = ?").run(newBalance, newDebt, clientId);
      
      const result = db.prepare(`
        INSERT INTO client_transactions (client_id, type, amount, description, user_id) 
        VALUES (?, ?, ?, ?, ?)
      `).run(clientId, type, amount, description, user_id);

      db.exec("COMMIT");
      res.json({ id: result.lastInsertRowid, balance: newBalance, debt: newDebt });
    } catch (error) {
      db.exec("ROLLBACK");
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/reports/clients-exposure", (req, res) => {
    const clients = db.prepare(`
      SELECT id, name, debt, credit_limit, balance
      FROM clients
      WHERE debt > 0 OR balance > 0
      ORDER BY debt DESC
      LIMIT 50
    `).all();
    res.json(clients);
  });

  app.get("/api/proformas", (req, res) => {
    const proformas = db.prepare(`
      SELECT p.*, c.name as client_name, u.name as user_name
      FROM proformas p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `).all();
    res.json(proformas);
  });

  app.get("/api/proformas/:id", (req, res) => {
    const proforma = db.prepare(`
      SELECT p.*, c.name as client_name, c.nif as client_nif, c.phone as client_phone, c.email as client_email, c.address as client_address
      FROM proformas p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.id = ?
    `).get(req.params.id) as any;

    if (!proforma) return res.status(404).json({ error: "Proforma não encontrada" });

    const items = db.prepare(`
      SELECT pi.*, pr.name as product_name, pr.barcode
      FROM proforma_items pi
      JOIN products pr ON pi.product_id = pr.id
      WHERE pi.proforma_id = ?
    `).all(req.params.id);

    res.json({ ...proforma, items });
  });

  app.post("/api/send-invoice", async (req, res) => {
    const { email, subject, html, store_id } = req.body;
    
    try {
      const store = db.prepare("SELECT sender_email, sender_password FROM store WHERE id = ?").get(store_id || 1) as any;
      
      if (!store || !store.sender_email || !store.sender_password) {
        return res.status(400).json({ error: "Configurações de e-mail do emissor não encontradas." });
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail', // Or use host/port for generic SMTP
        auth: {
          user: store.sender_email,
          pass: store.sender_password
        }
      });

      const mailOptions = {
        from: store.sender_email,
        to: email,
        subject: subject || "Fatura / Recibo",
        html: html
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Erro ao enviar e-mail:", error);
      res.status(500).json({ error: "Erro ao enviar e-mail: " + error.message });
    }
  });

  // --- Vite Setup ---
  app.get("/api/notifications", (req, res) => {
    const notifications = db.prepare("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50").all();
    res.json(notifications);
  });

  app.put("/api/notifications/:id/read", (req, res) => {
    const { id } = req.params;
    db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.put("/api/notifications/read-all", (req, res) => {
    db.prepare("UPDATE notifications SET is_read = 1").run();
    res.json({ success: true });
  });

  // Vite middleware for development (MUST BE LAST)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: process.cwd(),
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
