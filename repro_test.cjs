const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function run() {
  try {
    // 1. Register Account
    const phone = `999${Date.now().toString().slice(-7)}`;
    const accountData = {
      companyName: `Test Co ${Date.now()}`,
      phone: phone,
      name: 'Test User'
    };
    
    console.log('Registering account...');
    await axios.post(`${BASE_URL}/accounts/register`, accountData);
    
    // 2. Send OTP
    console.log('Sending OTP...');
    await axios.post(`${BASE_URL}/auth/send-otp`, { phone });

    // 3. Verify OTP
    console.log('Verifying OTP...');
    const verifyRes = await axios.post(`${BASE_URL}/auth/verify-otp`, { phone, otp: '123456' });
    const token = verifyRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('Registered & Logged in. Token:', token);

    // 4. Create Units (Box and Piece)
    console.log('Creating units...');
    const pieceRes = await axios.post(`${BASE_URL}/units`, { name: 'Piece', abbreviation: 'pc' }, { headers });
    const boxRes = await axios.post(`${BASE_URL}/units`, { name: 'Box', abbreviation: 'bx' }, { headers });
    const pieceId = pieceRes.data.id;
    const boxId = boxRes.data.id;

    // 5. Create Warehouse
    console.log('Creating warehouse...');
    const whRes = await axios.post(`${BASE_URL}/warehouses`, { name: 'Main WH', location: 'Loc', contactPerson: 'Test', contactNumber: '123' }, { headers });
    const warehouseId = whRes.data.data.id;

    // 6. Create Product with conversion
    console.log('Creating product...');
    const productData = {
      name: `Test Product ${Date.now()}`,
      sku: `SKU-${Date.now()}`,
      measuringUnitId: pieceId,
      altMeasuringUnitId: boxId,
      conversionRatio: 10, // 1 Box = 10 Pieces
      enableBatching: true,
      buyingPrice: 100,
      sellingPrice: 200
    };
    const prodRes = await axios.post(`${BASE_URL}/products`, productData, { headers });
    const productId = prodRes.data.data.id;

    // 7. Add Stock (Batch)
    console.log('Adding stock...');
    
    // Create Supplier
    const supplierRes = await axios.post(`${BASE_URL}/parties`, { name: 'Supplier 1', type: 'supplier', phone: '1234567890' }, { headers });
    const supplierId = supplierRes.data.id;

    // Create PO
    const poData = {
      number: `PO-${Date.now()}`,
      date: '2023-01-01',
      supplierId: supplierId,
      warehouseId: warehouseId,
      items: [{
        productId: productId,
        quantity: 100, // 100 Pieces
        rate: 100,
        amount: 10000
      }]
    };
    const poRes = await axios.post(`${BASE_URL}/purchase-orders`, poData, { headers });
    const poId = poRes.data.data.id;

    // Receive PO
    const receiveData = {
      receivedDate: '2023-01-02',
      receivedItems: [{
        productId: productId,
        quantity: 100,
        warehouseId: warehouseId,
        batches: [{
          batchNumber: 'BATCH-1',
          quantity: 100,
          warehouseId: warehouseId,
          mfgDate: '2023-01-01',
          expDate: '2024-01-01',
          buyingPrice: 100,
          sellingPrice: 200
        }]
      }]
    };
    await axios.post(`${BASE_URL}/purchase-orders/${poId}/receive`, receiveData, { headers });
    console.log('Stock added: 100 Pieces');

    // Get Batch ID
    let batchId;
    try {
        const prodDetailRes = await axios.get(`${BASE_URL}/products/${productId}`, { headers });
        if (prodDetailRes.data && prodDetailRes.data.data && prodDetailRes.data.data.batchRecords && prodDetailRes.data.data.batchRecords.length > 0) {
            const batch = prodDetailRes.data.data.batchRecords.find(b => 
                b.locations && b.locations.some(l => parseFloat(l.quantity) > 0)
            );
            if (batch) {
                batchId = batch.id;
            } else {
                batchId = prodDetailRes.data.data.batchRecords[0].id;
            }
        }
    } catch (e) {
        console.log('Could not get product details', e.message);
    }

    if (!batchId) {
        console.log('Failed to get batch ID. Aborting test.');
        return;
    }

    // 8. Create Invoice with Alternate Unit
    console.log('Creating invoice with alternate unit (Box)...');
    // 1 Box = 10 Pieces.
    // If we sell 1 Box, stock should reduce by 10.
    const invoiceData = {
      invoiceNumber: `INV-${Date.now()}`,
      date: '2023-01-03',
      customer: 'Cash Customer',
      items: [{
        productId: productId,
        product: productData.name,
        qty: 1, // 1 Box
        unit: 'Box', // Alternate Unit Name
        price: 2000, // Price for Box
        total: 2000,
        batchId: batchId,
        warehouseId: warehouseId
      }]
    };
    
    const invRes = await axios.post(`${BASE_URL}/invoices`, invoiceData, { headers });
    const invoiceId = invRes.data.data.id;
    console.log('Invoice created:', invoiceId);

    // 9. Check Stock Transaction
    const prodDetailResAfter = await axios.get(`${BASE_URL}/products/${productId}`, { headers });
    const batchAfter = prodDetailResAfter.data.data.batchRecords.find(b => b.id === batchId);
    const location = batchAfter.locations.find(l => l.warehouseId === warehouseId);
    
    console.log(`Initial Stock: 100. Sold: 1 Box (10 Pieces). Expected Remaining: 90.`);
    console.log(`Actual Remaining: ${location.quantity}`);

    if (parseFloat(location.quantity) === 90) {
      console.log('SUCCESS: Stock adjusted correctly based on alternate unit.');
    } else {
      console.log('FAILURE: Stock adjustment incorrect.');
    }

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    if (error.response && error.response.data) {
        console.error(JSON.stringify(error.response.data, null, 2));
    }
  }
}

run();
