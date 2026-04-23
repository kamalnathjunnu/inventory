/**
 * Script to recalculate product quantities from batch locations
 * Run this to fix existing products with incorrect quantity values
 */

const { Product, Batch, BatchLocation, sequelize } = require('./models');

async function recalculateAllProductQuantities() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('Starting product quantity recalculation...');
    
    // Get all products
    const products = await Product.findAll();
    console.log(`Found ${products.length} products to process`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const product of products) {
      // Get all batch locations for this product
      const batchLocations = await BatchLocation.findAll({
        include: [{
          model: Batch,
          where: { productId: product.id },
          required: true
        }]
      });
      
      // Calculate total quantity
      const totalQuantity = batchLocations.reduce((sum, bl) => {
        return sum + parseFloat(bl.quantity || 0);
      }, 0);
      
      // Update product if quantity changed
      if (product.quantity !== totalQuantity) {
        await product.update({ quantity: totalQuantity }, { transaction });
        console.log(`Updated product ${product.id} (${product.name}): ${product.quantity} -> ${totalQuantity}`);
        updated++;
      } else {
        skipped++;
      }
    }
    
    await transaction.commit();
    
    console.log('\n=== Recalculation Complete ===');
    console.log(`Total products: ${products.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped (already correct): ${skipped}`);
    
  } catch (error) {
    await transaction.rollback();
    console.error('Error recalculating product quantities:', error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  recalculateAllProductQuantities()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

module.exports = { recalculateAllProductQuantities };
