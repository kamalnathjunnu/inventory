const { sequelize, Product, Brand, Category, Warehouse, Customer, Invoice, PurchaseOrder, Unit, GSTRate, CESSRate } = require('./models');

const seed = async () => {
  await sequelize.sync({ force: true });

  await Product.bulkCreate([
    { name: 'Wireless Bluetooth Headphones', sku: 'SKU-001-WBH', stock: 1200, wh: 'Warehouse A', price: '$99.99', buyingPrice: '$45.00', cat: 'Electronics', brand: 'AudioTech', description: 'High-fidelity wireless headphones.', hsn: '8518', enableBatching: true },
    { name: 'Organic Cotton T-Shirt', sku: 'SKU-002-OCT', stock: 85, wh: 'Warehouse B', price: '$25.00', buyingPrice: '$8.00', cat: 'Apparel', brand: 'EcoWear', description: '100% organic cotton t-shirt.', hsn: '6109', enableBatching: false },
    { name: 'Smart Coffee Maker', sku: 'SKU-003-SCM', stock: 0, wh: 'Warehouse A', price: '$149.00', buyingPrice: '$80.00', cat: 'Home Goods', brand: 'BrewMaster', description: 'WiFi-enabled coffee maker.', hsn: '8516', enableBatching: true },
    { name: 'Ergonomic Office Chair', sku: 'SKU-004-EOC', stock: 250, wh: 'Warehouse C', price: '$299.50', buyingPrice: '$150.00', cat: 'Furniture', brand: 'ComfortSeating', description: 'Fully adjustable office chair.', hsn: '9401', enableBatching: false }
  ]);

  await Brand.bulkCreate([
    { name: 'Acme Corporation', desc: 'Premium hardware supplier' },
    { name: 'Global Tech', desc: 'Leading technology solutions' },
    { name: 'Innovate Solutions', desc: 'Eco-friendly packaging' },
    { name: 'Sunrise Goods', desc: 'High-quality consumer products' }
  ]);

  await Category.bulkCreate([
    { name: 'Camera Accessories', desc: 'Accessories for digital and film cameras.' },
    { name: 'Laptops & Notebooks', desc: 'High-performance laptops for professional use.' },
    { name: 'Smartphones', desc: 'Latest models from top brands.' },
    { name: 'Audio Equipment', desc: 'Headphones, speakers, and professional audio gear.' }
  ]);

  await Warehouse.bulkCreate([
    { name: 'New York Central', location: 'New York, NY', contactPerson: 'John Manager', contactNumber: '(212) 555-1234' },
    { name: 'Los Angeles West', location: 'Los Angeles, CA', contactPerson: 'Sarah Lead', contactNumber: '(310) 555-5678' },
    { name: 'Chicago Midwest', location: 'Chicago, IL', contactPerson: 'Mike Ops', contactNumber: '(312) 555-9012' },
    { name: 'Houston South', location: 'Houston, TX', contactPerson: 'Emily Log', contactNumber: '(713) 555-3456' }
  ]);

  await Customer.bulkCreate([
    { name: 'Eleanor Vance', email: 'eleanor.v@example.com', phone: '(555) 010-1234', address: 'Austin, TX' },
    { name: 'Marcus Holloway', email: 'marcus.h@example.com', phone: '(555) 011-5678', address: 'San Francisco, CA' },
    { name: 'Isabella Rossi', email: 'isabella.r@example.com', phone: '(555) 012-9012', address: 'Miami, FL' }
  ]);

  await Invoice.bulkCreate([
    { number: '#INV-00123', customer: 'Liam Johnson', date: 'Jun 21, 2024', total: '$2,450.00', status: 'Paid' },
    { number: '#INV-00122', customer: 'Olivia Smith', date: 'Jun 15, 2024', total: '$1,200.50', status: 'Sent' },
    { number: '#INV-00121', customer: 'Noah Brown', date: 'May 30, 2024', total: '$5,800.00', status: 'Overdue' },
    { number: '#INV-00120', customer: 'Emma Davis', date: 'Jun 25, 2024', total: '$320.00', status: 'Draft' }
  ]);

  await PurchaseOrder.bulkCreate([
    { number: 'PO-2024-00128', supplier: 'Acme Corporation', date: 'Jul 26, 2024', total: '$5,157.00', status: 'Received' },
    { number: 'PO-2024-00127', supplier: 'Globex Inc.', date: 'Jul 25, 2024', total: '$1,230.50', status: 'Sent' },
    { number: 'PO-2024-00126', supplier: 'Stark Industries', date: 'Jul 24, 2024', total: '$8,900.00', status: 'Draft' }
  ]);

  await Unit.bulkCreate([
    { name: 'Piece', abbreviation: 'pc' },
    { name: 'Box', abbreviation: 'box' },
    { name: 'Kilogram', abbreviation: 'kg' },
    { name: 'Gram', abbreviation: 'g' },
    { name: 'Liter', abbreviation: 'L' },
    { name: 'Milliliter', abbreviation: 'mL' },
    { name: 'Meter', abbreviation: 'm' },
    { name: 'Centimeter', abbreviation: 'cm' },
    { name: 'Square Meter', abbreviation: 'sqm' },
    { name: 'Dozen', abbreviation: 'dzn' },
    { name: 'Pack', abbreviation: 'pack' },
    { name: 'Carton', abbreviation: 'ctn' },
    { name: 'Bottle', abbreviation: 'btl' },
    { name: 'Can', abbreviation: 'can' },
    { name: 'Pair', abbreviation: 'pr' }
  ]);

  await GSTRate.bulkCreate([
    { rate: '0', label: 'Non-GST Supply', taxability: 'Non-GST' },
    { rate: '0', label: 'GST 0% (Nil Rated)', taxability: 'Nil Rated' },
    { rate: '0', label: 'GST 0% (Exempt)', taxability: 'Exempt' },
    { rate: '5', label: 'GST 5%', taxability: 'Taxable' },
    { rate: '12', label: 'GST 12%', taxability: 'Taxable' },
    { rate: '18', label: 'GST 18%', taxability: 'Taxable' },
    { rate: '28', label: 'GST 28%', taxability: 'Taxable' }
  ]);

  await CESSRate.bulkCreate([
    { value: '0', label: '0%' },
    { value: '1', label: '1%' },
    { value: '3', label: '3%' },
    { value: '12', label: '12%' },
    { value: '12+2900', label: '12% + ₹2900/1000' }
  ]);

  console.log('Database seeded!');
};

seed();
