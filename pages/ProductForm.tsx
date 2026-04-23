
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import AdjustStockModal from '../components/AdjustStockModal';
import SearchableSelect from '../components/SearchableSelect';
import QuickCreateModal from '../components/QuickCreateModal';
import { getProduct, createProduct, updateProduct, getBrands, getCategories, getWarehouses, createBrand, createCategory, getUnits, getGSTRates, getCESSRates } from '../services/api';

// Interface for batch location
interface BatchLocation {
  warehouse: string;
  quantity: number | '';
}

// Interface for batch
interface Batch {
  id: number;
  batchNumber: string;
  mfgDate: string;
  expDate: string;
  buyingPrice: number | '';
  sellingPrice: number | '';
  buyingPriceTax: boolean;
  sellingPriceTax: boolean;
  locations: BatchLocation[];
}

const ProductForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'inventory' | 'images'>('general');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [gstRates, setGstRates] = useState<any[]>([]);
  const [cessRates, setCessRates] = useState<any[]>([]);
  const [showAlternateUnit, setShowAlternateUnit] = useState(false);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [isCreateBrandModalOpen, setIsCreateBrandModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  
  // Form validation
  const isFormValid = () => {
    // Required fields
    if (!formData.name?.trim()) return false;
    if (!formData.measuringUnit) return false;
    
    // If alternate unit is enabled, validate those fields
    if (showAlternateUnit) {
      if (!formData.altMeasuringUnit) return false;
      if (!formData.conversionRatio || formData.conversionRatio <= 0) return false;
    }
    
    return true;
  };
  
  const [formData, setFormData] = useState<any>({
    id: `new-${Date.now()}`,
    name: '',
    sku: '',
    barcode: '',
    hsn: '',
    category: '',
    brand: '',
    description: '',
    
    // Inventory
    enableBatching: false,
    minStockLevel: 0,
    warehouseInventory: {}, // Simple mode: { 'Warehouse Name': quantity }
    batches: [] as Batch[], // Advanced mode: Array of Batch objects
    
    // Units
    measuringUnit: '',
    altMeasuringUnit: '',
    conversionRatio: '',
    
    // Pricing
    buyingPrice: 0,
    buyingPriceTax: false,
    sellingPrice: 0,
    sellingPriceTax: false,
    
    // Taxes
    gstPercentage: '0',
    cessPercentage: '0',
    taxability: 'Non-GST',
    
    // Batches
    batchNumber: '',
    mfgDate: '',
    expDate: '',
    
    // Computed
    quantity: 0, 
  });

  // --- EFFECT: LOAD DATA ---
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [brandsRes, categoriesRes, warehousesRes, unitsRes, gstRatesRes, cessRatesRes] = await Promise.all([
          getBrands(1, 1000),
          getCategories(1, 1000),
          getWarehouses(1, 1000),
          getUnits(1, 1000),
          getGSTRates(1, 1000),
          getCESSRates(1, 1000)
        ]);
        setBrands(brandsRes.data.items || []);
        setCategories(categoriesRes.data.items || []);
        setWarehouses(warehousesRes.data.items || []);
        setUnits(unitsRes.data.items || []);
        setGstRates(gstRatesRes.data.items || []);
        setCessRates(cessRatesRes.data.items || []);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    };
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      const fetchProduct = async () => {
        try {
          const response = await getProduct(Number(id));
          const product = response.data.data;
          
          // Populate brand and category names from foreign key relationships
          let brandName = product.brand || '';
          let categoryName = product.category || '';
          
          if (product.brandData) {
            brandName = product.brandData.name;
          } else if (product.brandId && brands.length > 0) {
            const brand = brands.find((b: any) => b.id === product.brandId);
            if (brand) brandName = brand.name;
          }
          
          if (product.categoryData) {
            categoryName = product.categoryData.name;
          } else if (product.categoryId && categories.length > 0) {
            const category = categories.find((c: any) => c.id === product.categoryId);
            if (category) categoryName = category.name;
          }
          
          // Populate measuring unit from relationship
          let measuringUnitValue = product.measuringUnit || '';
          if (product.measuringUnitData) {
            measuringUnitValue = `${product.measuringUnitData.name} (${product.measuringUnitData.abbreviation})`;
          }
          
          // Populate alternate measuring unit from relationship
          let altMeasuringUnitValue = product.altMeasuringUnit || '';
          if (product.altMeasuringUnitData) {
            altMeasuringUnitValue = `${product.altMeasuringUnitData.name} (${product.altMeasuringUnitData.abbreviation})`;
          }
          
          // Populate GST data from relationship
          let gstPercentageValue = product.gstPercentage || '0';
          let taxabilityValue = product.taxability || 'Non-GST';
          if (product.gstRateData) {
            gstPercentageValue = product.gstRateData.rate;
            taxabilityValue = product.gstRateData.taxability || 'Non-GST';
          }
          
          // Populate CESS data from relationship
          let cessPercentageValue = product.cessPercentage || '0';
          if (product.cessRateData) {
            cessPercentageValue = product.cessRateData.value;
          }
          
          // Process batches from batchRecords
          let batchesData = product.batches || [];
          if (product.batchRecords && product.batchRecords.length > 0) {
            batchesData = product.batchRecords.map((batch: any) => ({
              id: batch.id,
              batchNumber: batch.batchNumber,
              mfgDate: batch.mfgDate,
              expDate: batch.expDate,
              buyingPrice: batch.buyingPrice || '',
              sellingPrice: batch.sellingPrice || '',
              buyingPriceTax: batch.buyingPriceTax || false,
              sellingPriceTax: batch.sellingPriceTax || false,
              locations: batch.locations ? batch.locations.map((loc: any) => ({
                warehouse: loc.warehouseData ? loc.warehouseData.name : loc.warehouse,
                quantity: loc.quantity || ''
              })) : []
            }));
          }
          
          setFormData({
            name: product.name || '',
            sku: product.sku || '',
            barcode: product.barcode || '',
            brand: brandName,
            category: categoryName,
            description: product.description || '',
            images: product.images || [],
            quantity: product.quantity || 0,
            minStockLevel: product.minStockLevel || 0,
            enableBatching: product.enableBatching || false,
            measuringUnit: measuringUnitValue,
            altMeasuringUnit: altMeasuringUnitValue,
            conversionRatio: product.conversionRatio || '',
            sellingPrice: product.sellingPrice || 0,
            sellingPriceTax: product.sellingPriceTax || false,
            buyingPrice: product.buyingPrice || 0,
            buyingPriceTax: product.buyingPriceTax || false,
            hsn: product.hsn || '',
            gstPercentage: gstPercentageValue,
            taxability: taxabilityValue,
            cessPercentage: cessPercentageValue,
            warehouseInventory: product.warehouseInventory || {},
            batches: batchesData,
            // Store IDs for reference
            brandId: product.brandId,
            categoryId: product.categoryId,
            measuringUnitId: product.measuringUnitId,
            altMeasuringUnitId: product.altMeasuringUnitId,
            gstRateId: product.gstRateId,
            cessRateId: product.cessRateId,
          });
          if (product.images) {
            setImagePreviews(product.images);
          }
          // Check if alternate unit exists to set checkbox state
          if (altMeasuringUnitValue) {
            setShowAlternateUnit(true);
          }
        } catch (error) {
          console.error('Error fetching product:', error);
        }
      };
      fetchProduct();
    }
  }, [id, isEdit, brands, categories]);

  // Recalculate total quantity whenever inventory data changes
  useEffect(() => {
    let total = 0;
    if (formData.enableBatching) {
      // Sum all quantities from all locations in all batches
      formData.batches.forEach((batch: Batch) => {
        batch.locations.forEach(loc => {
          total += Number(loc.quantity) || 0;
        });
      });
    } else {
      // Sum simple warehouse inventory
      Object.values(formData.warehouseInventory).forEach((qty) => {
        total += Number(qty) || 0;
      });
    }
    setFormData((prev: any) => ({ ...prev, quantity: total }));
  }, [formData.enableBatching, formData.batches, formData.warehouseInventory]);


  // --- HANDLERS ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev: any) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
        setFormData((prev: any) => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    } else {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleWarehouseStockChange = (warehouseName: string, stock: string) => {
    const qty = parseInt(stock) || 0;
    setFormData((prev: any) => {
      const updatedInventory = { ...prev.warehouseInventory };
      if (qty <= 0) {
        delete updatedInventory[warehouseName];
      } else {
        updatedInventory[warehouseName] = qty;
      }
      
      // Calculate total quantity
      const totalQty = Object.values(updatedInventory).reduce((acc: number, val: any) => acc + (val || 0), 0);
      
      return { 
        ...prev, 
        warehouseInventory: updatedInventory,
        quantity: totalQty 
      };
    });
  };

  const handleSimpleWarehouseStockChange = (warehouseName: string, stock: string) => {
    const qty = parseInt(stock) || 0;
    setFormData((prev: any) => {
      const updatedInventory = { ...prev.warehouseInventory };
      if (qty <= 0) {
        delete updatedInventory[warehouseName];
      } else {
        updatedInventory[warehouseName] = qty;
      }
      return { ...prev, warehouseInventory: updatedInventory };
    });
  };

  // --- BATCH INVENTORY HANDLERS ---
  const addBatch = () => {
    const newBatch: Batch = {
      id: Date.now(),
      batchNumber: '',
      mfgDate: '',
      expDate: '',
      buyingPrice: formData.buyingPrice, 
      sellingPrice: formData.sellingPrice,
      buyingPriceTax: formData.buyingPriceTax,
      sellingPriceTax: formData.sellingPriceTax,
      locations: []
    };
    setFormData((prev: any) => ({ ...prev, batches: [...prev.batches, newBatch] }));
  };

  const removeBatch = (batchId: number) => {
    setFormData((prev: any) => ({
      ...prev,
      batches: prev.batches.filter((b: Batch) => b.id !== batchId)
    }));
  };

  const updateBatchField = (batchId: number, field: keyof Batch, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      batches: prev.batches.map((b: Batch) => b.id === batchId ? { ...b, [field]: value } : b)
    }));
  };

  const addBatchLocation = (batchId: number) => {
    setFormData((prev: any) => ({
      ...prev,
      batches: prev.batches.map((b: Batch) => {
        if (b.id === batchId) {
          return { ...b, locations: [...b.locations, { warehouse: '', quantity: '' }] };
        }
        return b;
      })
    }));
  };

  const removeBatchLocation = (batchId: number, locIndex: number) => {
    setFormData((prev: any) => ({
      ...prev,
      batches: prev.batches.map((b: Batch) => {
        if (b.id === batchId) {
          const newLocs = [...b.locations];
          newLocs.splice(locIndex, 1);
          return { ...b, locations: newLocs };
        }
        return b;
      })
    }));
  };

  const updateBatchLocation = (batchId: number, locIndex: number, field: keyof BatchLocation, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      batches: prev.batches.map((b: Batch) => {
        if (b.id === batchId) {
          const newLocs = [...b.locations];
          newLocs[locIndex] = { ...newLocs[locIndex], [field]: value };
          return { ...b, locations: newLocs };
        }
        return b;
      })
    }));
  };

  // --- IMAGE HANDLERS ---
  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files) as File[];
    processFiles(files);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      processFiles(files);
    }
  };

  const processFiles = (files: File[]) => {
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // --- TAX HANDLERS ---
  const handleGstChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedRate = gstRates.find(rate => rate.id.toString() === selectedId);
    
    if (selectedRate) {
      setFormData((prev: any) => ({ 
        ...prev, 
        gstPercentage: selectedRate.rate, 
        taxability: selectedRate.taxability 
      }));
    }
  };

  const getGstDropdownValue = () => {
    if (!gstRates.length || !formData.gstPercentage) return '';
    
    const matchingRate = gstRates.find(rate => 
      rate.rate.toString() === formData.gstPercentage.toString() && 
      rate.taxability === formData.taxability
    );
    return matchingRate ? matchingRate.id.toString() : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Look up brandId and categoryId from names
      let brandId = null;
      let categoryId = null;
      
      if (formData.brand) {
        const brand = brands.find((b: any) => b.name === formData.brand);
        brandId = brand ? brand.id : null;
      }
      
      if (formData.category) {
        const category = categories.find((c: any) => c.name === formData.category);
        categoryId = category ? category.id : null;
      }
      
      // Look up measuring unit IDs from formatted strings
      let measuringUnitId = null;
      let altMeasuringUnitId = null;
      
      if (formData.measuringUnit) {
        const unit = units.find((u: any) => 
          `${u.name} (${u.abbreviation})` === formData.measuringUnit
        );
        measuringUnitId = unit ? unit.id : null;
      }
      
      if (formData.altMeasuringUnit) {
        const unit = units.find((u: any) => 
          `${u.name} (${u.abbreviation})` === formData.altMeasuringUnit
        );
        altMeasuringUnitId = unit ? unit.id : null;
      }
      
      // Look up GST rate ID
      let gstRateId = null;
      const matchingGstRate = gstRates.find(rate => 
        rate.rate.toString() === formData.gstPercentage.toString() && 
        rate.taxability === formData.taxability
      );
      if (matchingGstRate) {
        gstRateId = matchingGstRate.id;
      }
      
      // Look up CESS rate ID
      let cessRateId = null;
      const matchingCessRate = cessRates.find(rate => 
        rate.value.toString() === formData.cessPercentage.toString()
      );
      if (matchingCessRate) {
        cessRateId = matchingCessRate.id;
      }
      
      // Transform batches to include warehouseId instead of warehouse name
      const transformedBatches = formData.batches.map((batch: Batch) => ({
        ...batch,
        locations: batch.locations.map((loc: BatchLocation) => {
          const warehouse = warehouses.find((w: any) => w.name === loc.warehouse);
          return {
            warehouseId: warehouse ? warehouse.id : null,
            quantity: Number(loc.quantity) || 0
          };
        })
      }));
      
      // Transform simple warehouse inventory to warehouses array with IDs
      const transformedWarehouses = Object.entries(formData.warehouseInventory || {}).map(([warehouseName, quantity]) => {
        const warehouse = warehouses.find((w: any) => w.name === warehouseName);
        return {
          warehouseId: warehouse ? warehouse.id : null,
          quantity: Number(quantity) || 0
        };
      }).filter(w => w.warehouseId && w.quantity > 0);
      
      // Clean up the payload - convert empty strings to null for numeric fields
      const payload = { 
        ...formData,
        brandId,
        categoryId,
        measuringUnitId,
        altMeasuringUnitId,
        gstRateId,
        cessRateId,
        images: imagePreviews,
        minStockLevel: formData.minStockLevel === '' ? null : Number(formData.minStockLevel),
        conversionRatio: formData.conversionRatio === '' ? null : Number(formData.conversionRatio),
        buyingPrice: formData.buyingPrice === '' ? null : Number(formData.buyingPrice),
        sellingPrice: formData.sellingPrice === '' ? null : Number(formData.sellingPrice),
        gstPercentage: formData.gstPercentage === '' ? 0 : Number(formData.gstPercentage),
        quantity: Number(formData.quantity) || 0,
        batches: transformedBatches,
        warehouses: transformedWarehouses
      };
      
      // Remove fields that should not be sent to API
      delete payload.brand;
      delete payload.category;
      delete payload.measuringUnit;
      delete payload.altMeasuringUnit;
      delete payload.warehouseInventory;
      delete payload.taxability;
      delete payload.cessPercentage;
      
      // Remove the temporary id field for new products
      if (!isEdit) {
        delete payload.id;
      }
      
      if (isEdit && id) {
        await updateProduct(Number(id), payload);
      } else {
        await createProduct(payload);
      }
      navigate('/products');
    } catch (error: any) {
      console.error('Error saving product:', error);
      console.error('Error details:', error.response?.data);
      
      let message = 'Failed to save product';
      
      if (error.response?.status === 409) {
        // Conflict - duplicate SKU/barcode
        message = error.response?.data?.error || 'A product with this SKU or barcode already exists';
      } else if (error.response?.status === 400) {
        // Validation error
        message = error.response?.data?.error || 'Please check all required fields';
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      } else if (error.message) {
        message = error.message;
      }
      
      setErrorMessage(message);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const confirmAdjustment = (id: number, newStock: number, reason: string, warehouse?: string, batchId?: string | number, newBatch?: any) => {
    setFormData((prev: any) => ({ ...prev, quantity: newStock }));
    setIsAdjustModalOpen(false);
  };

  // --- QUICK CREATE HANDLERS ---
  const handleCreateCategory = async (data: { name: string; desc: string }) => {
    const response = await createCategory(data);
    const newCategory = response.data;
    
    // Refresh categories list
    const categoriesRes = await getCategories(1, 1000);
    setCategories(categoriesRes.data.items || []);
    
    // Auto-select the newly created category
    setFormData((prev: any) => ({ ...prev, category: newCategory.name }));
  };

  const handleCreateBrand = async (data: { name: string; desc: string }) => {
    const response = await createBrand(data);
    const newBrand = response.data;
    
    // Refresh brands list
    const brandsRes = await getBrands(1, 1000);
    setBrands(brandsRes.data.items || []);
    
    // Auto-select the newly created brand
    setFormData((prev: any) => ({ ...prev, brand: newBrand.name }));
  };

  // --- RENDER ---

  return (
    <div className="min-h-full pb-24 bg-background-light dark:bg-background-dark">
       {/* Sticky Header with Title and Actions */}
       <div className="sticky top-16 lg:top-0 z-20 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm p-6 lg:p-8 border-b border-gray-200 dark:border-gray-800">
         <div className="max-w-7xl mx-auto flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                <Link to="/" className="hover:text-primary transition-colors">Dashboard</Link>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
                <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
                <span className="text-slate-900 dark:text-white">{isEdit ? 'Edit Product' : 'New Product'}</span>
            </div>
            
            <div className="flex flex-wrap justify-between items-center gap-4">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {isEdit ? 'Edit Product' : 'Create Product'}
              </h1>
              <div className="flex gap-3">
                 <button type="button" onClick={() => navigate('/products')} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700">
                    Cancel
                 </button>
                 {isEdit && (
                    <button 
                      type="button"
                      onClick={() => setIsAdjustModalOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <span className="material-symbols-outlined text-[20px]">inventory</span>
                      Adjust Stock
                    </button>
                 )}
                 <button onClick={handleSubmit} disabled={loading || !isFormValid()} className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? 'Saving...' : 'Save Product'}
                 </button>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-xl w-fit mt-2">
               {[
                 { id: 'general', label: 'General Info', icon: 'info' },
                 { id: 'pricing', label: 'Pricing & Tax', icon: 'payments' },
                 { id: 'inventory', label: 'Inventory', icon: 'warehouse' },
                 { id: 'images', label: 'Others', icon: 'image' }
               ].filter(tab => !isEdit || tab.id !== 'inventory').map(tab => (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)}
                   className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                     activeTab === tab.id 
                       ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' 
                       : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                   }`}
                 >
                   <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                   {tab.label}
                 </button>
               ))}
            </div>
         </div>
       </div>

       {/* Tab Content */}
       <div className="p-6 lg:p-8 max-w-7xl mx-auto">
         
         {/* GENERAL TAB */}
         {activeTab === 'general' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
                   <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Basic Details</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="md:col-span-2">
                           <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Product Name <span className="text-red-500">*</span></label>
                           <input name="name" value={formData.name} onChange={handleChange} type="text" className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-800 p-2.5 focus:ring-2 focus:ring-primary/50" required />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">SKU</label>
                           <input name="sku" value={formData.sku} onChange={handleChange} type="text" className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-800 p-2.5 focus:ring-2 focus:ring-primary/50" />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Measuring Unit <span className="text-red-500">*</span></label>
                           <select name="measuringUnit" value={formData.measuringUnit} onChange={handleChange} required className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-800 p-2.5 focus:ring-2 focus:ring-primary/50">
                             <option value="">Select Unit</option>
                             {units.map(unit => (
                               <option key={unit.id} value={`${unit.name} (${unit.abbreviation})`}>{unit.name} ({unit.abbreviation})</option>
                             ))}
                           </select>
                       </div>
                       <div className="md:col-span-2">
                           <div className="flex items-center gap-2 mb-4">
                               <input 
                                 type="checkbox" 
                                 id="addAlternateUnit" 
                                 checked={showAlternateUnit}
                                 onChange={(e) => {
                                   setShowAlternateUnit(e.target.checked);
                                   if (!e.target.checked) {
                                     setFormData({...formData, altMeasuringUnit: '', conversionRatio: ''});
                                   }
                                 }}
                                 className="rounded text-primary focus:ring-primary"
                               />
                               <label htmlFor="addAlternateUnit" className="text-sm font-medium text-slate-900 dark:text-white cursor-pointer select-none">Add Alternate Unit</label>
                           </div>
                           {showAlternateUnit && (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div>
                                   <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Alternate Unit <span className="text-red-500">*</span></label>
                                   <select name="altMeasuringUnit" value={formData.altMeasuringUnit} onChange={handleChange} required className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-800 p-2.5 focus:ring-2 focus:ring-primary/50">
                                     <option value="">Select Unit</option>
                                     {units.map(unit => (
                                       <option key={unit.id} value={`${unit.name} (${unit.abbreviation})`}>{unit.name} ({unit.abbreviation})</option>
                                     ))}
                                   </select>
                               </div>
                               <div>
                                   <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Conversion Ratio <span className="text-red-500">*</span></label>
                                   <input name="conversionRatio" value={formData.conversionRatio} onChange={handleChange} type="number" placeholder="1 Box = ? Pcs" required className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-800 p-2.5 focus:ring-2 focus:ring-primary/50" />
                               </div>
                             </div>
                           )}
                       </div>
                   </div>
               </div>
            </div>
         )}

         {/* PRICING TAB */}
         {activeTab === 'pricing' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-600">payments</span>
                        Sale Prices (Default)
                      </h3>
                      <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Selling Price</label>
                                <div className="flex rounded-md shadow-sm relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 z-10">
                                        <span className="text-gray-500 sm:text-sm">$</span>
                                    </div>
                                    <input 
                                        name="sellingPrice"
                                        value={formData.sellingPrice}
                                        onChange={handleChange}
                                        type="number" 
                                        placeholder="0.00" 
                                        className="block w-full rounded-l-lg border-gray-300 dark:border-gray-700 border-r-0 pl-7 focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-800 dark:text-white py-2.5"
                                    />
                                    <select
                                        value={formData.sellingPriceTax ? 'tax' : 'no_tax'}
                                        onChange={(e) => setFormData({ ...formData, sellingPriceTax: e.target.value === 'tax' })}
                                        className="-ml-px block w-32 rounded-r-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 sm:text-sm focus:border-primary focus:ring-primary py-2.5 px-3 border-l-0"
                                    >
                                        <option value="no_tax">Excl. Tax</option>
                                        <option value="tax">Incl. Tax</option>
                                    </select>
                                </div>
                             </div>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-orange-600">shopping_cart</span>
                        Purchase Costs (Default)
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Buying Price</label>
                            <div className="flex rounded-md shadow-sm relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 z-10">
                                    <span className="text-gray-500 sm:text-sm">$</span>
                                </div>
                                <input 
                                    name="buyingPrice"
                                    value={formData.buyingPrice}
                                    onChange={handleChange}
                                    type="number" 
                                    placeholder="0.00" 
                                    className="block w-full rounded-l-lg border-gray-300 dark:border-gray-700 border-r-0 pl-7 focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-800 dark:text-white py-2.5"
                                />
                                <select
                                    value={formData.buyingPriceTax ? 'tax' : 'no_tax'}
                                    onChange={(e) => setFormData({ ...formData, buyingPriceTax: e.target.value === 'tax' })}
                                    className="-ml-px block w-32 rounded-r-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 sm:text-sm focus:border-primary focus:ring-primary py-2.5 px-3 border-l-0"
                                >
                                    <option value="no_tax">Excl. Tax</option>
                                    <option value="tax">Incl. Tax</option>
                                </select>
                            </div>
                         </div>
                      </div>
                  </div>
               </div>

               <div className="lg:col-span-1">
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm h-full">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600">account_balance</span>
                        Taxation
                      </h3>
                      <div className="space-y-6">
                          <div>
                              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">HSN Code</label>
                              <input name="hsn" value={formData.hsn} onChange={handleChange} type="text" placeholder="e.g. 8518" className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-800 p-2.5 focus:ring-2 focus:ring-primary/50" />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">GST Rate & Taxability</label>
                              <select 
                                  name="gstPercentage"
                                  value={getGstDropdownValue()}
                                  onChange={handleGstChange}
                                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-800 p-2.5 focus:ring-2 focus:ring-primary/50"
                              >
                                  <option value="">Select GST Rate</option>
                                  {gstRates.map(rate => (
                                    <option key={rate.id} value={rate.id}>{rate.label}</option>
                                  ))}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">CESS Percentage</label>
                              <select 
                                  name="cessPercentage"
                                  value={formData.cessPercentage}
                                  onChange={handleChange}
                                  className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-800 p-2.5 focus:ring-2 focus:ring-primary/50"
                              >
                                  {cessRates.map(rate => (
                                    <option key={rate.id} value={rate.value}>{rate.label}</option>
                                  ))}
                              </select>
                          </div>
                      </div>
                  </div>
               </div>
            </div>
         )}

         {/* INVENTORY TAB */}
         {!isEdit && activeTab === 'inventory' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="lg:col-span-2 space-y-6">
                  {/* Inventory Mode Toggle */}
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex items-center justify-between">
                      <div>
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Batch Tracking</h3>
                          <p className="text-sm text-gray-500">Enable to track batches, manufacturing dates, and expiration dates.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" name="enableBatching" checked={formData.enableBatching} onChange={handleChange} className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                      </label>
                  </div>

                  {/* Mode A: Simple Inventory */}
                  {!formData.enableBatching && (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Warehouse Stock</h3>
                           <div className="text-sm font-medium bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                              Total Stock: {formData.quantity}
                           </div>
                        </div>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                           {warehouses.map(wh => {
                             const stock = formData.warehouseInventory[wh.name] || 0;
                             return (
                               <div key={wh.id} className={`flex items-center justify-between p-3 rounded-lg border ${stock > 0 ? 'border-primary/30 bg-primary/5' : 'border-gray-200 dark:border-gray-700'}`}>
                                  <div className="flex items-center gap-3">
                                     <input 
                                       type="checkbox" 
                                       checked={stock > 0} 
                                       onChange={(e) => handleSimpleWarehouseStockChange(wh.name, e.target.checked ? '1' : '0')}
                                       className="rounded text-primary focus:ring-primary"
                                     />
                                     <span className="text-sm font-medium text-gray-900 dark:text-white">{wh.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                     <span className="text-xs text-gray-500 uppercase">Stock</span>
                                     <input 
                                       type="number" 
                                       value={stock === 0 ? '' : stock} 
                                       placeholder="0"
                                       onChange={(e) => handleSimpleWarehouseStockChange(wh.name, e.target.value)}
                                       className="w-24 text-right rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-1.5 text-sm focus:ring-1 focus:ring-primary"
                                     />
                                  </div>
                               </div>
                             );
                           })}
                        </div>
                    </div>
                  )}

                  {/* Mode B: Batch Inventory */}
                  {formData.enableBatching && (
                    <div className="space-y-4">
                        {/* Batches List */}
                        {formData.batches.map((batch: Batch, index: number) => (
                            <div key={batch.id} className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6 relative group">
                                <div className="absolute top-4 right-4">
                                    <button onClick={() => removeBatch(batch.id)} className="text-gray-400 hover:text-red-500 p-1">
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                                <h3 className="text-base font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                                    Batch #{index + 1}
                                </h3>
                                
                                {/* Batch Details Row */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Batch Number</label>
                                        <input 
                                            type="text" 
                                            value={batch.batchNumber} 
                                            onChange={(e) => updateBatchField(batch.id, 'batchNumber', e.target.value)}
                                            placeholder="e.g. B-001"
                                            className="w-full rounded-md border-slate-300 dark:border-slate-700 bg-gray-50 dark:bg-gray-800 p-2 text-sm focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Mfg Date</label>
                                        <input 
                                            type="date" 
                                            value={batch.mfgDate} 
                                            onChange={(e) => updateBatchField(batch.id, 'mfgDate', e.target.value)}
                                            className="w-full rounded-md border-slate-300 dark:border-slate-700 bg-gray-50 dark:bg-gray-800 p-2 text-sm focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Exp Date</label>
                                        <input 
                                            type="date" 
                                            value={batch.expDate} 
                                            onChange={(e) => updateBatchField(batch.id, 'expDate', e.target.value)}
                                            className="w-full rounded-md border-slate-300 dark:border-slate-700 bg-gray-50 dark:bg-gray-800 p-2 text-sm focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                </div>

                                {/* Batch Pricing Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Buying Price</label>
                                        <div className="flex rounded-md shadow-sm relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 z-10">
                                                <span className="text-gray-500 sm:text-xs">$</span>
                                            </div>
                                            <input 
                                                type="number" 
                                                value={batch.buyingPrice} 
                                                onChange={(e) => updateBatchField(batch.id, 'buyingPrice', e.target.value)}
                                                placeholder={formData.buyingPrice ? `Def: ${formData.buyingPrice}` : '0.00'}
                                                className="block w-full rounded-l-md border-slate-300 dark:border-slate-700 border-r-0 pl-7 focus:ring-primary focus:border-primary text-sm bg-white dark:bg-gray-800 dark:text-white py-2"
                                            />
                                            <select
                                                value={batch.buyingPriceTax ? 'tax' : 'no_tax'}
                                                onChange={(e) => updateBatchField(batch.id, 'buyingPriceTax', e.target.value === 'tax')}
                                                className="-ml-px block w-28 rounded-r-md border border-slate-300 dark:border-slate-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 text-xs focus:border-primary focus:ring-primary py-2 px-2 border-l-0"
                                            >
                                                <option value="no_tax">Excl. Tax</option>
                                                <option value="tax">Incl. Tax</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Selling Price</label>
                                        <div className="flex rounded-md shadow-sm relative">
                                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 z-10">
                                                <span className="text-gray-500 sm:text-xs">$</span>
                                            </div>
                                            <input 
                                                type="number" 
                                                value={batch.sellingPrice} 
                                                onChange={(e) => updateBatchField(batch.id, 'sellingPrice', e.target.value)}
                                                placeholder={formData.sellingPrice ? `Def: ${formData.sellingPrice}` : '0.00'}
                                                className="block w-full rounded-l-md border-slate-300 dark:border-slate-700 border-r-0 pl-7 focus:ring-primary focus:border-primary text-sm bg-white dark:bg-gray-800 dark:text-white py-2"
                                            />
                                            <select
                                                value={batch.sellingPriceTax ? 'tax' : 'no_tax'}
                                                onChange={(e) => updateBatchField(batch.id, 'sellingPriceTax', e.target.value === 'tax')}
                                                className="-ml-px block w-28 rounded-r-md border border-slate-300 dark:border-slate-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 text-xs focus:border-primary focus:ring-primary py-2 px-2 border-l-0"
                                            >
                                                <option value="no_tax">Excl. Tax</option>
                                                <option value="tax">Incl. Tax</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Warehouse Distribution */}
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-slate-100 dark:border-slate-800">
                                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Storage Locations</h4>
                                    <div className="space-y-2">
                                        {batch.locations.map((loc, locIdx) => (
                                            <div key={locIdx} className="flex gap-2 items-center">
                                                <select 
                                                    value={loc.warehouse} 
                                                    onChange={(e) => updateBatchLocation(batch.id, locIdx, 'warehouse', e.target.value)}
                                                    className="flex-1 rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-gray-700 p-2 text-sm"
                                                >
                                                    <option value="">Select Warehouse</option>
                                                    {warehouses.map(wh => <option key={wh.id} value={wh.name}>{wh.name}</option>)}
                                                </select>
                                                <input 
                                                    type="number" 
                                                    value={loc.quantity} 
                                                    onChange={(e) => updateBatchLocation(batch.id, locIdx, 'quantity', e.target.value)}
                                                    placeholder="Qty" 
                                                    className="w-24 rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-gray-700 p-2 text-sm text-right"
                                                />
                                                <button 
                                                    onClick={() => removeBatchLocation(batch.id, locIdx)}
                                                    className="p-2 text-gray-400 hover:text-red-500"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                                </button>
                                            </div>
                                        ))}
                                        <button 
                                            onClick={() => addBatchLocation(batch.id)}
                                            className="text-primary text-sm font-medium flex items-center gap-1 hover:underline mt-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">add</span> Add Location
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button 
                            onClick={addBatch}
                            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 font-medium"
                        >
                            <span className="material-symbols-outlined">add_circle</span> Add New Batch
                        </button>
                    </div>
                  )}
               </div>

               <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Inventory Settings</h3>
                      <div className="flex flex-col gap-4">
                          <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <span className="text-sm text-blue-700 dark:text-blue-200">Total Stock</span>
                              <span className="text-xl font-bold text-blue-700 dark:text-blue-200">{formData.quantity}</span>
                          </div>
                          
                          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                              <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Low Stock Alert Level</label>
                              <input name="minStockLevel" value={formData.minStockLevel} onChange={handleChange} type="number" className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-800 p-2.5 focus:ring-2 focus:ring-primary/50" />
                          </div>
                      </div>
                  </div>
               </div>
            </div>
         )}

         {/* OTHERS TAB */}
         {activeTab === 'images' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
               {/* Description, Category, Brand */}
               <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Additional Information</h3>
                  <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <SearchableSelect 
                            label="Category" 
                            value={formData.category} 
                            options={categories.map(c => c.name)} 
                            onChange={(val) => setFormData({...formData, category: val})}
                            onCreateNew={() => setIsCreateCategoryModalOpen(true)}
                            createNewLabel="Create New Category"
                          />
                          <SearchableSelect 
                            label="Brand" 
                            value={formData.brand} 
                            options={brands.map(b => b.name)} 
                            onChange={(val) => setFormData({...formData, brand: val})}
                            onCreateNew={() => setIsCreateBrandModalOpen(true)}
                            createNewLabel="Create New Brand"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Barcode / EAN</label>
                          <input name="barcode" value={formData.barcode} onChange={handleChange} type="text" placeholder="Enter barcode or EAN number" className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-800 p-2.5 focus:ring-2 focus:ring-primary/50" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Description</label>
                          <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-800 p-2.5 focus:ring-2 focus:ring-primary/50" placeholder="Enter product description..." />
                      </div>
                  </div>
               </div>

               {/* Images */}
               <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Product Images</h3>
                  <div 
                    className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-10 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer text-center"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleImageDrop}
                  >
                      <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">cloud_upload</span>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">Drag and drop images here</p>
                      <p className="text-sm text-gray-500 mb-6">or click to browse files</p>
                      <label className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer shadow-sm">
                          Browse Files
                          <input type="file" multiple accept="image/*" onChange={handleImageSelect} className="hidden" />
                      </label>
                  </div>

                  {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
                          {imagePreviews.map((src, idx) => (
                              <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                                  <img src={src} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <button 
                                        type="button"
                                        onClick={() => removeImage(idx)}
                                        className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm"
                                      >
                                          <span className="material-symbols-outlined text-xl">delete</span>
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
               </div>
            </div>
         )}

       </div>

       {/* Sticky Bottom Action Bar */}
       <div className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg">
         <div className="p-6 ">
           <div className="mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
             {/* Left side - Status info */}
             <div className="text-sm text-gray-500 dark:text-gray-400">
               {loading && (
                 <span className="flex items-center gap-2">
                   <span className="animate-spin material-symbols-outlined text-primary">progress_activity</span>
                   Saving changes...
                 </span>
               )}
             </div>
             
             {/* Right side - Action buttons */}
             <div className="flex gap-3">
             <button 
               type="button" 
               onClick={() => navigate('/products')} 
               className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
             >
               Cancel
             </button>
             <button 
               onClick={handleSubmit} 
               disabled={loading || !isFormValid()}
               className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
             >
               <span className="material-symbols-outlined text-[18px]">save</span>
               {loading ? 'Saving...' : 'Save Product'}
             </button>
           </div>
         </div>
         </div>
       </div>

       <AdjustStockModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        onConfirm={confirmAdjustment}
        product={{ 
            id: Number(formData.id),
            name: formData.name, 
            sku: formData.sku, 
            stock: Number(formData.quantity),
            enableBatching: formData.enableBatching,
            batches: formData.batches,
            warehouseInventory: formData.warehouseInventory
        }}
      />

      <QuickCreateModal
        isOpen={isCreateCategoryModalOpen}
        onClose={() => setIsCreateCategoryModalOpen(false)}
        onSave={handleCreateCategory}
        title="Create New Category"
        entityName="Category"
      />

      <QuickCreateModal
        isOpen={isCreateBrandModalOpen}
        onClose={() => setIsCreateBrandModalOpen(false)}
        onSave={handleCreateBrand}
        title="Create New Brand"
        entityName="Brand"
      />

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-red-500 px-6 py-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-white text-3xl">error</span>
              <h3 className="text-lg font-semibold text-white">Error</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{errorMessage}</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductForm;
