const { sequelize } = require('./models');

async function migrate() {
  try {
    console.log('Adding unit column to InvoiceItems...');
    
    try {
      await sequelize.query('ALTER TABLE InvoiceItems ADD COLUMN unit TEXT;');
      console.log('Added unit to InvoiceItems');
    } catch (e) { console.log('unit column might already exist or error:', e.message); }

    console.log('Migration completed.');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await sequelize.close();
  }
}

migrate();