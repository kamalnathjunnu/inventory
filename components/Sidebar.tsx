
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isPathActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') {
      return false;
    }
    return location.pathname.startsWith(path);
  };

  const getLinkClasses = (path: string) => {
    return isPathActive(path)
      ? 'bg-primary/10 text-primary' 
      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5';
  };

  const getIconStyle = (path: string) => {
    return isPathActive(path) ? { fontVariationSettings: "'FILL' 1" } : {};
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-background-dark border-r border-gray-200 dark:border-white/10 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 flex flex-col h-full">
          {/* User Profile / Logo Area */}
          <div className="flex items-center justify-between px-2 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                 <span className="material-symbols-outlined">inventory_2</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm font-bold text-gray-900 dark:text-white">InventorySys</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Admin</p>
              </div>
            </div>
            {/* Close Button (Mobile Only) */}
            <button 
              onClick={onClose}
              className="lg:hidden p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 flex flex-col gap-1 overflow-y-auto">
            <Link to="/" onClick={onClose} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${getLinkClasses('/')}`}>
              <span className="material-symbols-outlined" style={getIconStyle('/')}>dashboard</span>
              <span className="text-sm font-medium">Dashboard</span>
            </Link>

            <Link to="/products" onClick={onClose} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${getLinkClasses('/products')}`}>
              <span className="material-symbols-outlined" style={getIconStyle('/products')}>inventory_2</span>
              <span className="text-sm font-medium">Products</span>
            </Link>

            <Link to="/categories" onClick={onClose} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${getLinkClasses('/categories')}`}>
              <span className="material-symbols-outlined" style={getIconStyle('/categories')}>category</span>
              <span className="text-sm font-medium">Categories</span>
            </Link>

            <Link to="/brands" onClick={onClose} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${getLinkClasses('/brands')}`}>
              <span className="material-symbols-outlined" style={getIconStyle('/brands')}>sell</span>
              <span className="text-sm font-medium">Brands</span>
            </Link>

            <Link to="/warehouses" onClick={onClose} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${getLinkClasses('/warehouses')}`}>
              <span className="material-symbols-outlined" style={getIconStyle('/warehouses')}>warehouse</span>
              <span className="text-sm font-medium">Warehouses</span>
            </Link>

            <Link to="/customers" onClick={onClose} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${getLinkClasses('/customers')}`}>
              <span className="material-symbols-outlined" style={getIconStyle('/customers')}>group</span>
              <span className="text-sm font-medium">Parties</span>
            </Link>

            <Link to="/invoices" onClick={onClose} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${getLinkClasses('/invoices')}`}>
              <span className="material-symbols-outlined" style={getIconStyle('/invoices')}>receipt_long</span>
              <span className="text-sm font-medium">Invoices</span>
            </Link>

            <Link to="/purchase-orders" onClick={onClose} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${getLinkClasses('/purchase-orders')}`}>
              <span className="material-symbols-outlined" style={getIconStyle('/purchase-orders')}>local_shipping</span>
              <span className="text-sm font-medium">Purchase Orders</span>
            </Link>

            <Link to="/purchase-invoices" onClick={onClose} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${getLinkClasses('/purchase-invoices')}`}>
              <span className="material-symbols-outlined" style={getIconStyle('/purchase-invoices')}>request_quote</span>
              <span className="text-sm font-medium">Purchase Invoices</span>
            </Link>
          </nav>

          {/* Bottom Actions */}
          <div className="border-t border-gray-200 dark:border-white/10 pt-4 flex flex-col gap-1 mt-auto">
            {user && (
              <div className="px-3 py-2 mb-2 border-b border-gray-200 dark:border-white/10">
                <p className="text-xs text-gray-500 dark:text-gray-400">Logged in as</p>
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.account?.companyName}</p>
              </div>
            )}
            <Link to="/settings" onClick={onClose} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${getLinkClasses('/settings')}`}>
              <span className="material-symbols-outlined" style={getIconStyle('/settings')}>settings</span>
              <span className="text-sm font-medium">Settings</span>
            </Link>
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
              <span className="material-symbols-outlined">help</span>
              <span className="text-sm font-medium">Help</span>
            </button>
            <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
              <span className="material-symbols-outlined">logout</span>
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
