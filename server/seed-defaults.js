const { sequelize, Unit, GSTRate, CESSRate } = require('./models');

// Default Units - Common measurement units used in Indian inventory
const defaultUnits = [
  { name: 'Piece', abbreviation: 'PCS' },
  { name: 'Box', abbreviation: 'BOX' },
  { name: 'Kilogram', abbreviation: 'KG' },
  { name: 'Gram', abbreviation: 'GM' },
  { name: 'Liter', abbreviation: 'LTR' },
  { name: 'Milliliter', abbreviation: 'ML' },
  { name: 'Meter', abbreviation: 'MTR' },
  { name: 'Centimeter', abbreviation: 'CM' },
  { name: 'Dozen', abbreviation: 'DZN' },
  { name: 'Pair', abbreviation: 'PR' },
  { name: 'Set', abbreviation: 'SET' },
  { name: 'Carton', abbreviation: 'CTN' },
  { name: 'Packet', abbreviation: 'PKT' },
  { name: 'Bundle', abbreviation: 'BDL' },
  { name: 'Roll', abbreviation: 'ROL' },
  { name: 'Bag', abbreviation: 'BAG' },
  { name: 'Bottle', abbreviation: 'BTL' },
  { name: 'Can', abbreviation: 'CAN' },
  { name: 'Drum', abbreviation: 'DRM' },
  { name: 'Quintal', abbreviation: 'QTL' },
  { name: 'Tonne', abbreviation: 'TON' },
  { name: 'Square Meter', abbreviation: 'SQM' },
  { name: 'Square Feet', abbreviation: 'SFT' },
  { name: 'Cubic Meter', abbreviation: 'CBM' },
  { name: 'Cubic Feet', abbreviation: 'CFT' }
];

// GST Rates - Standard GST slabs in India
const defaultGSTRates = [
  { rate: '0', label: '0% GST', taxability: 'Exempt' },
  { rate: '0.25', label: '0.25% GST', taxability: 'Taxable' },
  { rate: '3', label: '3% GST', taxability: 'Taxable' },
  { rate: '5', label: '5% GST', taxability: 'Taxable' },
  { rate: '12', label: '12% GST', taxability: 'Taxable' },
  { rate: '18', label: '18% GST', taxability: 'Taxable' },
  { rate: '28', label: '28% GST', taxability: 'Taxable' }
];

// CESS Rates - Common CESS percentages
const defaultCESSRates = [
  { value: '0', label: 'No CESS' },
  { value: '1', label: '1% CESS' },
  { value: '2', label: '2% CESS' },
  { value: '3', label: '3% CESS' },
  { value: '5', label: '5% CESS' },
  { value: '10', label: '10% CESS' },
  { value: '12', label: '12% CESS' },
  { value: '15', label: '15% CESS' }
];

async function seedDefaults() {
  try {
    console.log('🌱 Starting default data seeding...\n');

    // Sync database
    await sequelize.sync();

    // Check if data already exists
    const existingUnits = await Unit.count();
    const existingGST = await GSTRate.count();
    const existingCESS = await CESSRate.count();

    // Seed Units
    if (existingUnits === 0) {
      console.log('📦 Seeding Units...');
      await Unit.bulkCreate(defaultUnits);
      console.log(`✓ Created ${defaultUnits.length} units\n`);
    } else {
      console.log(`⚠ Units table already has ${existingUnits} records. Skipping.\n`);
    }

    // Seed GST Rates
    if (existingGST === 0) {
      console.log('💰 Seeding GST Rates...');
      await GSTRate.bulkCreate(defaultGSTRates);
      console.log(`✓ Created ${defaultGSTRates.length} GST rates\n`);
    } else {
      console.log(`⚠ GSTRate table already has ${existingGST} records. Skipping.\n`);
    }

    // Seed CESS Rates
    if (existingCESS === 0) {
      console.log('📊 Seeding CESS Rates...');
      await CESSRate.bulkCreate(defaultCESSRates);
      console.log(`✓ Created ${defaultCESSRates.length} CESS rates\n`);
    } else {
      console.log(`⚠ CESSRate table already has ${existingCESS} records. Skipping.\n`);
    }

    console.log('✅ Default data seeding completed successfully!\n');
    console.log('Summary:');
    console.log(`  Units: ${await Unit.count()}`);
    console.log(`  GST Rates: ${await GSTRate.count()}`);
    console.log(`  CESS Rates: ${await CESSRate.count()}\n`);
    
    // Only exit if called directly
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error seeding default data:', error);
    // Only exit if called directly
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedDefaults();
}

module.exports = { seedDefaults, defaultUnits, defaultGSTRates, defaultCESSRates };
