/**
 * Simple inline test for auto-warehouse feature
 * Run with: cd api-tests && node ../test-warehouse-simple.cjs
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function test() {
  console.log('\n=== Testing Auto-Warehouse Creation ===\n');
  
  try {
    // Give server time to start
    console.log('Waiting for server...');
    await sleep(2000);
    
    // Test 1: Check warehouses before
    console.log('\n1. Checking warehouses before product creation...');
    try {
      const res1 = await axios.get(`${BASE_URL}/warehouses`, { timeout: 5000 });
      console.log(`   Found ${res1.data.items?.length || res1.data.length || 0} warehouses`);
    } catch (err) {
      console.log(`   Error: ${err.message}`);
      if (err.code === 'ECONNREFUSED') {
        console.log('   Server is not running! Please start it with: cd server && node server.js');
        return;
      }
    }
    
    // Test 2: Create a product
    console.log('\n2. Creating a simple product...');
    const productData = {
      name: 'Test Product ' + Date.now(),
      sku: 'TEST-' + Date.now(),
      description: 'Test product for auto-warehouse',
      enableBatching: false,
      buyingPrice: 50,
      sellingPrice: 100,
      accountId: 1
    };
    console.log(`   Product: ${productData.name}`);
    
    try {
      const res2 = await axios.post(`${BASE_URL}/products`, productData, { timeout: 5000 });
      console.log(`   ✅ Product created! ID: ${res2.data.data?.id}`);
    } catch (err) {
      console.log(`   ❌ Failed: ${err.response?.data?.error || err.message}`);
    }
    
    // Test 3: Check warehouses after
    console.log('\n3. Checking warehouses after product creation...');
    try {
      const res3 = await axios.get(`${BASE_URL}/warehouses`, { timeout: 5000 });
      const warehouses = res3.data.items || res3.data || [];
      console.log(`   Found ${warehouses.length} warehouses`);
      
      const defaultWh = warehouses.find(w => w.name === 'Default Warehouse');
      if (defaultWh) {
        console.log(`   ✅ Default Warehouse exists! ID: ${defaultWh.id}`);
      } else {
        console.log(`   ℹ️  No "Default Warehouse" found`);
      }
    } catch (err) {
      console.log(`   Error: ${err.message}`);
    }
    
    console.log('\n=== Test Complete ===\n');
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
  }
}

test();
