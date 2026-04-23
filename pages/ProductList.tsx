
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';
import AdjustStockModal from '../components/AdjustStockModal';
import StockHistoryModal from '../components/StockHistoryModal';
import ProductDetailsModal from '../components/ProductDetailsModal';
import StockPositionModal from '../components/StockPositionModal';
import { getProducts, deleteProduct as deleteProductApi, updateProduct, createStockAdjustment, getBrands, getCategories } from '../services/api';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  
  // Filter data
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Fetch brands and categories
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [brandsRes, categoriesRes] = await Promise.all([
          getBrands(1, 1000),
          getCategories(1, 1000)
        ]);
        setBrands(brandsRes.data.items || []);
        setCategories(categoriesRes.data.items || []);
      } catch (error) {
        console.error('Error fetching filters:', error);
      }
    };
    fetchFilters();
  }, []);

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
  }, [page, searchTerm, categoryId, brandId]);

  // Adjust Stock State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Stock History State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // View Product Details State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState<any | null>(null);

  // Stock Position State
  const [isStockPositionModalOpen, setIsStockPositionModalOpen] = useState(false);
  const [stockPositionProductId, setStockPositionProductId] = useState<number | null>(null);

  // Fetch products function
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await getProducts(page, perPage, searchTerm, categoryId, brandId);
      setProducts(response.data.items);
      setTotalItems(response.data.totalItems);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId !== null) {
      try {
        await deleteProductApi(deleteId);
        setProducts(products.filter(item => item.id !== deleteId));
        setIsDeleteModalOpen(false);
        setDeleteId(null);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleAdjustClick = (product: typeof products[0]) => {
    // Transform batchRecords to batches format expected by modal
    const transformedProduct = {
      ...product,
      batches: product.batchRecords ? product.batchRecords.map((batch: any) => ({
        id: batch.id,
        batchNumber: batch.batchNumber,
        mfgDate: batch.mfgDate,
        expDate: batch.expDate,
        buyingPrice: batch.buyingPrice,
        sellingPrice: batch.sellingPrice,
        locations: batch.locations ? batch.locations.map((loc: any) => ({
          warehouse: loc.warehouseData ? loc.warehouseData.name : loc.warehouse,
          quantity: loc.quantity
        })) : []
      })) : []
    };
    setSelectedProduct(transformedProduct);
    setIsAdjustModalOpen(true);
  };

  const confirmAdjustment = async (id: number, newStock: number, reason: string, warehouse?: string, batchId?: string | number, newBatch?: any) => {
    try {
      // Find the product to update
      const product = products.find(p => p.id === id);
      if (!product) return;

      // Get current stock to calculate the adjustment quantity
      let currentStock = 0;
      if (product.enableBatching && batchId && batchId !== 'NEW_BATCH' && product.batchRecords) {
        const batch = product.batchRecords.find((b: any) => String(b.id) === String(batchId));
        if (batch) {
          // For batched products, check locations array
          if (batch.locations && Array.isArray(batch.locations)) {
            const loc = batch.locations.find((l: any) => {
              const locWarehouseName = l.warehouseData?.name || l.warehouse;
              return locWarehouseName === warehouse;
            });
            currentStock = Number(loc?.quantity) || 0;
          }
        }
      } else if (warehouse && product.warehouseInventory) {
        currentStock = Number(product.warehouseInventory[warehouse]) || 0;
      } else if (product.wh === warehouse) {
        currentStock = Number(product.stock) || 0;
      }
      
      console.log('Stock adjustment debug:', { 
        warehouse, 
        batchId, 
        currentStock, 
        newStock,
        adjustmentWillBe: newStock - currentStock,
        batchRecords: product.batchRecords 
      });

      // Calculate adjustment quantity (positive for increase, negative for decrease)
      const adjustmentQuantity = newStock - currentStock;

      // Find warehouse ID from warehouse name
      const warehousesResponse = await import('../services/api').then(m => m.getWarehouses(1, 1000));
      const warehouseData = warehousesResponse.data.items?.find((w: any) => w.name === warehouse);
      
      if (!warehouseData) {
        alert('Warehouse not found');
        return;
      }

      // Call stock adjustment API
      const adjustmentPayload: any = {
        productId: id,
        warehouseId: warehouseData.id,
        batchId: (batchId && batchId !== 'NEW_BATCH') ? batchId : null,
        quantity: adjustmentQuantity,
        notes: reason || 'Stock adjustment'
      };
      
      // Add newBatch data if creating a new batch
      if (batchId === 'NEW_BATCH' && newBatch) {
        adjustmentPayload.newBatch = newBatch;
      }
      
      await createStockAdjustment(adjustmentPayload);

      // Refresh the product list to get updated stock
      await fetchProducts();

      setIsAdjustModalOpen(false);
      setSelectedProduct(null);
      console.log(`Stock adjusted for product ${id}. New stock: ${newStock}. Reason: ${reason}. Warehouse: ${warehouse}, Batch: ${batchId}`);
    } catch (error) {
      console.error('Error adjusting stock:', error);
      alert('Failed to adjust stock. Please try again.');
    }
  };

  const handleRowClick = (product: any) => {
    setViewProduct(product);
    setIsViewModalOpen(true);
  };

  const handleStockPositionClick = (productId: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setStockPositionProductId(productId);
    setIsStockPositionModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Product Name', 'SKU', 'Stock', 'Price', 'Brand'];
    const csvRows = [
      headers.join(','),
      ...products.map(product => [
        product.id,
        `"${product.name}"`,
        product.sku,
        product.quantity || 0,
        product.sellingPrice || 0,
        product.brand
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'products_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product List</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage and track your inventory across all warehouses.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleExportCSV}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Export CSV
          </button>
          <Link to="/products/new" className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">add</span>
            Add New Product
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select 
            className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-primary/50"
            value={brandId}
            onChange={(e) => {
              setBrandId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>{brand.name}</option>
            ))}
          </select>
          <select 
            className="bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-sm px-4 py-2 focus:ring-2 focus:ring-primary/50"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Product Name</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">SKU</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Stock</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white">Price</th>
                <th className="px-6 py-4 font-semibold text-gray-900 dark:text-white text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {products.map((item) => (
                <tr 
                  key={item.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(item)}
                >
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.name}</td>
                  <td className="px-6 py-4">{item.sku}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.quantity > 100 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : item.quantity === 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                      {item.quantity || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4">${item.sellingPrice || '0.00'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={(e) => handleStockPositionClick(item.id, e)}
                        title="View Stock Position"
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-500/5 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">warehouse</span>
                      </button>
                      <button 
                        onClick={() => handleAdjustClick(item)}
                        title="Adjust Stock"
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">inventory</span>
                      </button>
                      <Link to={`/products/edit/${item.id}`} className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors" title="Edit">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </Link>
                      <button 
                        onClick={() => handleDeleteClick(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {products.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <p className="text-sm text-gray-500">Showing {(page-1)*perPage+1}-{Math.min(page*perPage, totalItems)} of {totalItems}</p>
            <div className="flex gap-2">
              <button disabled={page===1} onClick={() => setPage(p => Math.max(1, p-1))} className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
              <button disabled={page*perPage >= totalItems} onClick={() => setPage(p => p+1)} className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Delete */}
      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
      />

      {/* Adjust Stock Modal */}
      <AdjustStockModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        onConfirm={confirmAdjustment}
        product={selectedProduct}
      />

      {/* Stock History Modal - Global View (Removed as per request, but can be added back) */}
      
      {/* View Details Modal - Per Product View */}
      <ProductDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        product={viewProduct}
      />

      {/* Stock Position Modal */}
      {stockPositionProductId && (
        <StockPositionModal
          isOpen={isStockPositionModalOpen}
          onClose={() => setIsStockPositionModalOpen(false)}
          productId={stockPositionProductId}
        />
      )}
    </div>
  );
};

export default ProductList;
