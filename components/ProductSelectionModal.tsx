import React, { useState, useEffect } from 'react';
import { getProducts } from '../services/api';
import { CURRENCY_SYMBOL } from '../constants';
import BatchSelectionModal from './BatchSelectionModal';

interface ProductSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingItems?: any[];
  onSelectProducts: (selectedProducts: any[]) => void;
  skipBatchSelection?: boolean;
}

const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  existingItems = [],
  onSelectProducts,
  skipBatchSelection = false
}) => {
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [selectedProductsData, setSelectedProductsData] = useState<Map<number, any>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [products, setProducts] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Batch selection state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [pendingBatchProducts, setPendingBatchProducts] = useState<any[]>([]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch products from server
  useEffect(() => {
    if (!isOpen) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await getProducts(currentPage, itemsPerPage, debouncedSearch);
        const fetchedProducts = response.data.items || [];
        setProducts(fetchedProducts);
        setTotalItems(fetchedProducts.length);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isOpen, currentPage, itemsPerPage, debouncedSearch]);

  // Initialize selections from existing items
  useEffect(() => {
    if (isOpen) {
      const initialSelected = new Set<number>();
      const initialSelectedData = new Map<number, any>();

      existingItems.forEach((item: any) => {
        const productId = Number(item.productId);
        if (!Number.isNaN(productId) && productId > 0) {
          initialSelected.add(productId);
          initialSelectedData.set(productId, {
            ...(item.productData || {}),
            id: productId,
            name: item.product,
            batchId: item.batchId || null,
            batch: item.batch || item.batchNumber || '',
            warehouseId: item.warehouseId || null,
            warehouse: item.warehouse || '',
            quantity: item.qty || 1
          });
        }
      });

      setSelectedProducts(initialSelected);
      setSelectedProductsData(initialSelectedData);
    }
  }, [isOpen, existingItems]);

  // Merge fetched product details into selected item cache while preserving existing selection config.
  useEffect(() => {
    if (!isOpen || products.length === 0 || selectedProducts.size === 0) return;

    setSelectedProductsData(prev => {
      const merged = new Map(prev);
      products.forEach((product) => {
        if (selectedProducts.has(product.id)) {
          const existingValue = merged.get(product.id);
          const existing = (existingValue && typeof existingValue === 'object') ? existingValue : {};
          merged.set(product.id, { ...product, ...existing });
        }
      });
      return merged;
    });
  }, [isOpen, products, selectedProducts]);

  const handlePageChange = (page: number) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (!isOpen) return null;

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const toggleProduct = (productId: number, product: any) => {
    const newSelected = new Set(selectedProducts);
    const newSelectedData = new Map(selectedProductsData);
    
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
      newSelectedData.delete(productId);
      setSelectedProducts(newSelected);
      setSelectedProductsData(newSelectedData);
    } else {
      // Skip batch selection for purchase orders or when explicitly disabled
      if (product.enableBatching && !skipBatchSelection) {
        setPendingBatchProducts([product]);
        setIsBatchModalOpen(true);
      } else {
        newSelected.add(productId);
        newSelectedData.set(productId, product);
        setSelectedProducts(newSelected);
        setSelectedProductsData(newSelectedData);
      }
    }
  };

  const handleBatchConfirm = (configuredProducts: any[]) => {
    const newSelected = new Set(selectedProducts);
    const newSelectedData = new Map(selectedProductsData);
    
    configuredProducts.forEach(p => {
      const productWithQty = { ...p, quantity: 1 };
      newSelected.add(p.id);
      newSelectedData.set(p.id, productWithQty);
    });
    
    setSelectedProducts(newSelected);
    setSelectedProductsData(newSelectedData);
    setIsBatchModalOpen(false);
    setPendingBatchProducts([]);
  };

  const toggleAll = () => {
    const currentPageIds = products.map(p => p.id);
    const allCurrentSelected = currentPageIds.every(id => selectedProducts.has(id));
    
    const newSelected = new Set(selectedProducts);
    const newSelectedData = new Map(selectedProductsData);
    
    if (allCurrentSelected) {
      // Deselect all on current page
      currentPageIds.forEach(id => {
        newSelected.delete(id);
        newSelectedData.delete(id);
      });
      setSelectedProducts(newSelected);
      setSelectedProductsData(newSelectedData);
    } else {
      // Select all on current page
      const productsToSelect = products.filter(p => !selectedProducts.has(p.id));
      const batchProducts = productsToSelect.filter(p => p.enableBatching);
      const simpleProducts = productsToSelect.filter(p => !p.enableBatching);
      
      // Add simple products immediately
      simpleProducts.forEach(product => {
        newSelected.add(product.id);
        newSelectedData.set(product.id, product);
      });
      
      // If skipBatchSelection, add batch products directly without modal
      if (skipBatchSelection) {
        batchProducts.forEach(product => {
          newSelected.add(product.id);
          newSelectedData.set(product.id, product);
        });
      }
      
      setSelectedProducts(newSelected);
      setSelectedProductsData(newSelectedData);
      
      // Open modal for batch products only if not skipping
      if (batchProducts.length > 0 && !skipBatchSelection) {
        setPendingBatchProducts(batchProducts);
        setIsBatchModalOpen(true);
      }
    }
  };

  const handleAdd = () => {
    const productsToAdd = Array.from(selectedProductsData.values()).map((p: any) => ({
      ...p,
      quantity: 1
    }));
    onSelectProducts(productsToAdd);
    setSearchTerm('');
    onClose();
  };

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleClose}>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl border border-gray-200 dark:border-gray-800 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined text-primary">shopping_bag</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Select Products</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-gray-500">close</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products by name, SKU, or category..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="p-3 w-12">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && products.every(p => selectedProducts.has(p.id))}
                    onChange={toggleAll}
                    className="rounded text-primary focus:ring-primary"
                  />
                </th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Product Name</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">SKU</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Category</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300">Brand</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Stock Available</th>
                <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <span className="animate-spin material-symbols-outlined">progress_activity</span>
                      Loading products...
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    {searchTerm ? 'No products found matching your search.' : 'No products available.'}
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr 
                    key={product.id} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${
                      selectedProducts.has(product.id) ? 'bg-primary/5 dark:bg-primary/10' : ''
                    }`}
                    onClick={() => toggleProduct(product.id, product)}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => toggleProduct(product.id, product)}
                        className="rounded text-primary focus:ring-primary"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                      {product.description && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">{product.description}</div>
                      )}
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">{product.sku || '-'}</td>
                    <td className="p-3">
                      {product.category && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {product.category}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-400">{product.brand || '-'}</td>
                    <td className="p-3 text-right">
                      <span className={`font-medium ${
                        (product.quantity || 0) <= (product.minStockLevel || 0) 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {product.quantity || 0}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium text-gray-900 dark:text-white">
                      {CURRENCY_SYMBOL}{Number(product.sellingPrice || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {endIndex} of {totalItems} products
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="First page"
              >
                <span className="material-symbols-outlined text-sm">first_page</span>
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <span className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Last page"
              >
                <span className="material-symbols-outlined text-sm">last_page</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedProducts.size > 0 && (
              <span className="font-medium text-primary">
                {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-5 py-2.5 rounded-lg font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={selectedProducts.size === 0}
              className="px-5 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              Add {selectedProducts.size > 0 ? `${selectedProducts.size} ` : ''}Product{selectedProducts.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>

      <BatchSelectionModal
        isOpen={isBatchModalOpen}
        onClose={() => {
          setIsBatchModalOpen(false);
          setPendingBatchProducts([]);
        }}
        products={pendingBatchProducts}
        onConfirm={handleBatchConfirm}
      />
    </div>
  );
};

export default ProductSelectionModal;
