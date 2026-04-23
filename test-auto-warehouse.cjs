/**
 * Test script to verify auto-creation of default warehouse when creating products
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAutoWarehouse() {
  console.log('\n🧪 Testing Auto-Create Default Warehouse Feature\n');
  
  try {
    // Step 1: Check current warehouses
    console.log('1️⃣  Checking current warehouses...');
    const warehousesResponse = await axios.get(`${BASE_URL}/warehouses`).catch(err => {
      console.error('Error fetching warehouses:', err.message);
      throw err;
    });
    const existingWarehouses = warehousesResponse.data.items || warehousesResponse.data;
    console.log(`   Found ${existingWarehouses.length} existing warehouse(s)`);
    
    // Step 2: Create a simple product without warehouse/batch data
    console.log('\n2️⃣  Creating product without warehouse data...');
    const productPayload = {
      name: 'Test Product - Auto Warehouse',
      sku: `TEST-AUTO-${Date.now()}`,
      description: 'Testing auto warehouse creation',
      enableBatching: false,
      buyingPrice: 100,
      sellingPrice: 150,
      accountId: 1
      // Note: No batches or warehouses arrays provided
    };
    
    console.log('   Payload:', JSON.stringify(productPayload, null, 2));
    
    const productResponse = await axios.post(`${BASE_URL}/products`, productPayload);
    
    if (productResponse.status === 201) {
      console.log('   ✅ Product created successfully!');
      console.log('   Product ID:', productResponse.data.data?.id || productResponse.data.id);
    }
    
    // Step 3: Check warehouses again
    console.log('\n3️⃣  Checking warehouses after product creation...');
    const newWarehousesResponse = await axios.get(`${BASE_URL}/warehouses`);
    const newWarehouses = newWarehousesResponse.data.items || newWarehousesResponse.data;
    console.log(`   Found ${newWarehouses.length} warehouse(s) now`);
    
    // Find the default warehouse
    const defaultWarehouse = newWarehouses.find(w => w.name === 'Default Warehouse');
    if (defaultWarehouse) {
      console.log('   ✅ Default Warehouse was auto-created!');
      console.log('   Warehouse details:', JSON.stringify(defaultWarehouse, null, 2));
    } else if (newWarehouses.length === 0) {
      console.log('   ⚠️  No warehouses found - default warehouse was not created');
    } else {
      console.log('   ℹ️  Warehouse exists but not named "Default Warehouse"');
    }
    
    // Step 4: Verify product has batch and location
    console.log('\n4️⃣  Verifying product has batch and warehouse location...');
    const productId = productResponse.data.data?.id || productResponse.data.id;
    const productDetailResponse = await axios.get(`${BASE_URL}/products/${productId}`);
    const product = productDetailResponse.data.data || productDetailResponse.data;
    
    if (product.batchRecords && product.batchRecords.length > 0) {
      console.log('   ✅ Product has batch records:', product.batchRecords.length);
      const batch = product.batchRecords[0];
      console.log('   Batch number:', batch.batchNumber);
      
      if (batch.locations && batch.locations.length > 0) {
        console.log('   ✅ Batch has warehouse locations:', batch.locations.length);
        batch.locations.forEach((loc, idx) => {
          console.log(`   Location ${idx + 1}:`, {
            warehouse: loc.warehouseData?.name,
            quantity: loc.quantity
          });
        });
      } else {
        console.log('   ❌ Batch has no warehouse locations');
      }
    } else {
      console.log('   ❌ Product has no batch records');
    }
    
    console.log('\n✅ Test completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data);
    } else {
      console.error('   Error:', error.message);
    }
    console.error('\n');
    process.exit(1);
  }
}

// Run the test
testAutoWarehouse();
