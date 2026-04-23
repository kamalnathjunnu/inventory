
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import ProductList from './pages/ProductList';
import ProductForm from './pages/ProductForm';
import InvoiceList from './pages/InvoiceList';
import InvoiceForm from './pages/InvoiceForm';
import InvoiceView from './pages/InvoiceView';
import PurchaseOrderList from './pages/PurchaseOrderList';
import PurchaseOrderForm from './pages/PurchaseOrderForm';
import PurchaseOrderView from './pages/PurchaseOrderView';
import PurchaseInvoiceList from './pages/PurchaseInvoiceList';
import PurchaseInvoiceForm from './pages/PurchaseInvoiceForm';
import PurchaseInvoiceView from './pages/PurchaseInvoiceView';
import ReceiveItemsPage from './pages/ReceiveItemsPage';
import CustomerList from './pages/CustomerList';
import CustomerForm from './pages/CustomerForm';
import CategoryList from './pages/CategoryList';
import CategoryForm from './pages/CategoryForm';
import BrandList from './pages/BrandList';
import BrandForm from './pages/BrandForm';
import WarehouseList from './pages/WarehouseList';
import WarehouseForm from './pages/WarehouseForm';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Auth Layout (for login/register pages - no sidebar)
function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Main Layout (with sidebar)
function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-sans">
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white dark:bg-background-dark border-b border-gray-200 dark:border-white/10 px-4 h-16 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg focus:outline-none"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">inventory_2</span>
              <span className="font-bold text-lg">InventorySys</span>
            </div>
         </div>
      </div>

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 pt-16 lg:pt-0 transition-all duration-300">
        {children}
      </div>
    </div>
  );
}

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
          <Route path="/register" element={<AuthLayout><Register /></AuthLayout>} />
          <Route path="/verify-otp" element={<AuthLayout><VerifyOTP /></AuthLayout>} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><MainLayout><Navigate to="/products" replace /></MainLayout></ProtectedRoute>} />
          
          <Route path="/products" element={<ProtectedRoute><MainLayout><ProductList /></MainLayout></ProtectedRoute>} />
          <Route path="/products/new" element={<ProtectedRoute><MainLayout><ProductForm /></MainLayout></ProtectedRoute>} />
          <Route path="/products/edit/:id" element={<ProtectedRoute><MainLayout><ProductForm /></MainLayout></ProtectedRoute>} />

          <Route path="/invoices" element={<ProtectedRoute><MainLayout><InvoiceList /></MainLayout></ProtectedRoute>} />
          <Route path="/invoices/new" element={<ProtectedRoute><MainLayout><InvoiceForm /></MainLayout></ProtectedRoute>} />
          <Route path="/invoices/edit/:id" element={<ProtectedRoute><MainLayout><InvoiceForm /></MainLayout></ProtectedRoute>} />
          <Route path="/invoices/view/:id" element={<ProtectedRoute><MainLayout><InvoiceView /></MainLayout></ProtectedRoute>} />

          <Route path="/purchase-orders" element={<ProtectedRoute><MainLayout><PurchaseOrderList /></MainLayout></ProtectedRoute>} />
          <Route path="/purchase-orders/new" element={<ProtectedRoute><MainLayout><PurchaseOrderForm /></MainLayout></ProtectedRoute>} />
          <Route path="/purchase-orders/edit/:id" element={<ProtectedRoute><MainLayout><PurchaseOrderForm /></MainLayout></ProtectedRoute>} />
          <Route path="/purchase-orders/view/:id" element={<ProtectedRoute><MainLayout><PurchaseOrderView /></MainLayout></ProtectedRoute>} />
          <Route path="/purchase-orders/receive/:id" element={<ProtectedRoute><MainLayout><ReceiveItemsPage /></MainLayout></ProtectedRoute>} />

          <Route path="/purchase-invoices" element={<ProtectedRoute><MainLayout><PurchaseInvoiceList /></MainLayout></ProtectedRoute>} />
          <Route path="/purchase-invoices/new" element={<ProtectedRoute><MainLayout><PurchaseInvoiceForm /></MainLayout></ProtectedRoute>} />
          <Route path="/purchase-invoices/edit/:id" element={<ProtectedRoute><MainLayout><PurchaseInvoiceForm /></MainLayout></ProtectedRoute>} />
          <Route path="/purchase-invoices/view/:id" element={<ProtectedRoute><MainLayout><PurchaseInvoiceView /></MainLayout></ProtectedRoute>} />

          <Route path="/customers" element={<ProtectedRoute><MainLayout><CustomerList /></MainLayout></ProtectedRoute>} />
          <Route path="/customers/new" element={<ProtectedRoute><MainLayout><CustomerForm /></MainLayout></ProtectedRoute>} />
          <Route path="/customers/edit/:id" element={<ProtectedRoute><MainLayout><CustomerForm /></MainLayout></ProtectedRoute>} />

          <Route path="/categories" element={<ProtectedRoute><MainLayout><CategoryList /></MainLayout></ProtectedRoute>} />
          <Route path="/categories/new" element={<ProtectedRoute><MainLayout><CategoryForm /></MainLayout></ProtectedRoute>} />
          <Route path="/categories/edit/:id" element={<ProtectedRoute><MainLayout><CategoryForm /></MainLayout></ProtectedRoute>} />

          <Route path="/brands" element={<ProtectedRoute><MainLayout><BrandList /></MainLayout></ProtectedRoute>} />
          <Route path="/brands/new" element={<ProtectedRoute><MainLayout><BrandForm /></MainLayout></ProtectedRoute>} />
          <Route path="/brands/edit/:id" element={<ProtectedRoute><MainLayout><BrandForm /></MainLayout></ProtectedRoute>} />

          <Route path="/warehouses" element={<ProtectedRoute><MainLayout><WarehouseList /></MainLayout></ProtectedRoute>} />
          <Route path="/warehouses/new" element={<ProtectedRoute><MainLayout><WarehouseForm /></MainLayout></ProtectedRoute>} />
          <Route path="/warehouses/edit/:id" element={<ProtectedRoute><MainLayout><WarehouseForm /></MainLayout></ProtectedRoute>} />

          <Route path="/settings" element={<ProtectedRoute><MainLayout><Settings /></MainLayout></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;

