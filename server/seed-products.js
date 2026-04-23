const { Sequelize } = require('sequelize');
const path = require('path');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

// Define Product model (matching your models.js)
const Product = sequelize.define('Product', {
  name: Sequelize.STRING,
  sku: Sequelize.STRING,
  barcode: Sequelize.STRING,
  hsn: Sequelize.STRING,
  category: Sequelize.STRING,
  brand: Sequelize.STRING,
  description: Sequelize.TEXT,
  enableBatching: Sequelize.BOOLEAN,
  minStockLevel: Sequelize.INTEGER,
  warehouseInventory: Sequelize.JSON,
  batches: Sequelize.JSON,
  measuringUnit: Sequelize.STRING,
  altMeasuringUnit: Sequelize.STRING,
  conversionRatio: Sequelize.DECIMAL,
  buyingPrice: Sequelize.DECIMAL,
  buyingPriceTax: Sequelize.BOOLEAN,
  sellingPrice: Sequelize.DECIMAL,
  sellingPriceTax: Sequelize.BOOLEAN,
  gstPercentage: Sequelize.DECIMAL,
  cessPercentage: Sequelize.STRING,
  taxability: Sequelize.STRING,
  images: Sequelize.JSON,
  quantity: Sequelize.INTEGER,
  stock: Sequelize.INTEGER,
  wh: Sequelize.STRING,
  price: Sequelize.STRING,
  cat: Sequelize.STRING
}, {
  tableName: 'Products',
  timestamps: true
});

// Sample products data
const products = [
  { name: 'Samsung Galaxy S23', sku: 'SAM-S23-128', description: 'Samsung Galaxy S23 5G smartphone with 128GB storage', category: 'Electronics', brand: 'Samsung', measuringUnit: 'Piece', buyingPrice: 65000, buyingPriceTax: false, sellingPrice: 79999, sellingPriceTax: true, gstPercentage: 18, cessPercentage: '0', minStockLevel: 5, quantity: 25, enableBatching: false, batches: [], warehouseInventory: [] },
  { name: 'Apple iPhone 15 Pro', sku: 'APL-IP15P-256', description: 'Apple iPhone 15 Pro with 256GB storage and titanium design', category: 'Electronics', brand: 'Apple', measuringUnit: 'Piece', buyingPrice: 115000, buyingPriceTax: false, sellingPrice: 134900, sellingPriceTax: true, gstPercentage: 18, cessPercentage: '0', minStockLevel: 3, quantity: 15, enableBatching: false, batches: [], warehouseInventory: [] },
  { name: 'Sony WH-1000XM5 Headphones', sku: 'SONY-WH1000XM5', description: 'Premium noise-cancelling wireless headphones', category: 'Electronics', brand: 'Sony', measuringUnit: 'Piece', buyingPrice: 22000, buyingPriceTax: false, sellingPrice: 29990, sellingPriceTax: true, gstPercentage: 18, cessPercentage: '0', minStockLevel: 10, quantity: 30, enableBatching: false, batches: [], warehouseInventory: [] },
  { name: 'Dell XPS 15 Laptop', sku: 'DELL-XPS15-I7', description: 'Dell XPS 15 with Intel i7, 16GB RAM, 512GB SSD', category: 'Electronics', brand: 'Dell', measuringUnit: 'Piece', buyingPrice: 135000, buyingPriceTax: false, sellingPrice: 159999, sellingPriceTax: true, gstPercentage: 18, cessPercentage: '0', minStockLevel: 5, quantity: 12, enableBatching: false, batches: [], warehouseInventory: [] },
  { name: 'LG 55" OLED TV', sku: 'LG-OLED55-C3', description: 'LG 55-inch 4K OLED Smart TV with AI ThinQ', category: 'Electronics', brand: 'LG', measuringUnit: 'Piece', buyingPrice: 115000, buyingPriceTax: false, sellingPrice: 139990, sellingPriceTax: true, gstPercentage: 28, cessPercentage: '0', minStockLevel: 3, quantity: 8, enableBatching: false, batches: [], warehouseInventory: [] },
  { name: 'Canon EOS R6 Camera', sku: 'CAN-EOSR6-BODY', description: 'Canon EOS R6 full-frame mirrorless camera body', category: 'Electronics', brand: 'Canon', measuringUnit: 'Piece', buyingPrice: 185000, buyingPriceTax: false, sellingPrice: 219999, sellingPriceTax: true, gstPercentage: 18, cessPercentage: '0', minStockLevel: 2, quantity: 5, enableBatching: false, batches: [], warehouseInventory: [] },
  { name: 'Nescafe Gold Coffee', sku: 'NES-GOLD-200G', description: 'Nescafe Gold premium instant coffee 200g jar', category: 'Food & Beverages', brand: 'Nescafe', measuringUnit: 'Gram', altMeasuringUnit: 'Kilogram', conversionRatio: 1000, buyingPrice: 450, buyingPriceTax: false, sellingPrice: 599, sellingPriceTax: true, gstPercentage: 5, cessPercentage: '0', minStockLevel: 50, quantity: 200, enableBatching: false, batches: [], warehouseInventory: [] },
  { name: 'Fortune Sunflower Oil', sku: 'FOR-SUNOIL-5L', description: 'Fortune refined sunflower oil 5 liter pack', category: 'Food & Beverages', brand: 'Fortune', measuringUnit: 'Liter', altMeasuringUnit: 'Milliliter', conversionRatio: 1000, buyingPrice: 550, buyingPriceTax: false, sellingPrice: 699, sellingPriceTax: true, gstPercentage: 5, cessPercentage: '0', minStockLevel: 30, quantity: 100, enableBatching: false, batches: [], warehouseInventory: [] },
  { name: 'Amul Butter', sku: 'AML-BTR-500G', description: 'Amul pasteurized butter 500g pack', category: 'Food & Beverages', brand: 'Amul', measuringUnit: 'Gram', altMeasuringUnit: 'Kilogram', conversionRatio: 1000, buyingPrice: 240, buyingPriceTax: false, sellingPrice: 299, sellingPriceTax: true, gstPercentage: 12, cessPercentage: '0', minStockLevel: 40, quantity: 150, enableBatching: false, batches: [], warehouseInventory: [] },
  { name: 'Tata Salt', sku: 'TATA-SALT-1KG', description: 'Tata iodized salt 1kg pack', category: 'Food & Beverages', brand: 'Tata', measuringUnit: 'Kilogram', altMeasuringUnit: 'Gram', conversionRatio: 0.001, buyingPrice: 18, buyingPriceTax: false, sellingPrice: 24, sellingPriceTax: true, gstPercentage: 0, cessPercentage: '0', minStockLevel: 100, quantity: 500, enableBatching: false, batches: [], warehouseInventory: [] },
  { name: 'Nike Air Max Shoes', sku: 'NIKE-AIRMAX-90', description: 'Nike Air Max 90 running shoes - Size 9', category: 'Footwear', brand: 'Nike', measuringUnit: 'Pair', buyingPrice: 6500, buyingPriceTax: false, sellingPrice: 8995, sellingPriceTax: true, gstPercentage: 12, cessPercentage: '0', minStockLevel: 10, quantity: 45, enableBatching: false, batches: [], warehouseInventory: [] },
  { name: 'Adidas T-Shirt', sku: 'ADI-TSHIRT-L-BLK', description: 'Adidas performance t-shirt - Large, Black', category: 'Apparel', brand: 'Adidas', measuringUnit: 'Piece', buyingPrice: 800, buyingPriceTax: false, sellingPrice: 1299, sellingPriceTax: true, gstPercentage: 12, cessPercentage: '0', minStockLevel: 20, quantity: 80, enableBatching: false, batches: [], warehouseInventory: [] },
  { name: 'Asian Paints Tractor Emulsion', sku: 'ASP-TRACT-20L-WHT', description: 'Asian Paints Tractor Emulsion white 20 liter', category: 'Home Improvement', brand: 'Asian Paints', measuringUnit: 'Liter', altMeasuringUnit: 'Milliliter', conversionRatio: 1000, buyingPrice: 3200, buyingPriceTax: false, sellingPrice: 4299, sellingPriceTax: true, gstPercentage: 18, cessPercentage: '0', minStockLevel: 10, quantity: 25, enableBatching: false, batches: [], warehouseInventory: [] },
  { name: 'Philips LED Bulb 9W', sku: 'PHI-LED-9W-WHT', description: 'Philips 9W LED bulb cool white B22 base', category: 'Electronics', brand: 'Philips', measuringUnit: 'Piece', altMeasuringUnit: 'Box', conversionRatio: 10, buyingPrice: 125, buyingPriceTax: false, sellingPrice: 179, sellingPriceTax: true, gstPercentage: 18, cessPercentage: '0', minStockLevel: 50, quantity: 200, enableBatching: false, batches: [], warehouseInventory: [] },
  { name: 'Colgate MaxFresh Toothpaste', sku: 'COL-MAXF-150G', description: 'Colgate MaxFresh toothpaste 150g tube', category: 'Personal Care', brand: 'Colgate', measuringUnit: 'Gram', buyingPrice: 85, buyingPriceTax: false, sellingPrice: 115, sellingPriceTax: true, gstPercentage: 18, cessPercentage: '0', minStockLevel: 100, quantity: 350, enableBatching: false, batches: [], warehouseInventory: [] }
];

// Seed function
async function seedProducts() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync the Product model
    await Product.sync();
    console.log('Product table synced.');

    // Check existing products to avoid duplicates
    let addedCount = 0;
    let skippedCount = 0;

    for (const productData of products) {
      const existing = await Product.findOne({ where: { sku: productData.sku } });
      
      if (existing) {
        console.log(`⏭️  Skipped: ${productData.name} (SKU: ${productData.sku}) - already exists`);
        skippedCount++;
      } else {
        await Product.create(productData);
        console.log(`✅ Added: ${productData.name} (SKU: ${productData.sku})`);
        addedCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✨ Product seeding completed!`);
    console.log(`   Added: ${addedCount} products`);
    console.log(`   Skipped: ${skippedCount} products (already exist)`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error seeding products:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the seed function
seedProducts();
