import React, { useState, useEffect, useRef } from 'react';

interface AsyncSearchableSelectProps {
  label: string;
  value: string;
  onChange: (val: string, item?: any) => void;
  onSearch: (query: string) => Promise<any[]>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  renderOption?: (item: any) => string;
  renderDisplay?: (item: any) => string;
  error?: string;
}

const AsyncSearchableSelect: React.FC<AsyncSearchableSelectProps> = ({ 
  label, 
  value, 
  onChange, 
  onSearch,
  placeholder = "Search...",
  required = false,
  disabled = false,
  renderOption,
  renderDisplay,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load initial options when dropdown opens
  useEffect(() => {
    if (isOpen && options.length === 0) {
      loadOptions('');
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      loadOptions(search);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search, isOpen]);

  const loadOptions = async (query: string) => {
    setLoading(true);
    try {
      const results = await onSearch(query);
      setOptions(results);
    } catch (error) {
      console.error('Error loading options:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: any) => {
    setSelectedItem(item);
    const displayValue = renderDisplay ? renderDisplay(item) : (renderOption ? renderOption(item) : item);
    onChange(displayValue, item);
    setIsOpen(false);
    setSearch('');
  };

  const displayValue = value || placeholder;

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div 
        className={`w-full rounded-lg border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm p-2.5 flex items-center justify-between ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} focus:ring-2 focus:ring-primary/50`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={!value ? 'text-gray-500 dark:text-gray-400' : ''}>
          {displayValue}
        </span>
        <span className="material-symbols-outlined text-gray-400">
          {isOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
        </span>
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="p-2 sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
              <input 
                type="text" 
                className="w-full pl-8 pr-3 rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm p-2 focus:ring-2 focus:ring-primary/50 dark:text-white"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          
          {loading ? (
            <div className="px-4 py-8 text-sm text-gray-500 dark:text-gray-400 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </div>
            </div>
          ) : options.length === 0 ? (
            <div className="px-4 py-8 text-sm text-gray-500 dark:text-gray-400 text-center">
              {search ? `No results found for "${search}"` : 'No options available'}
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {options.map((item, index) => {
                const optionText = renderOption ? renderOption(item) : item;
                const isSelected = value === (renderDisplay ? renderDisplay(item) : optionText);
                return (
                  <div 
                    key={index}
                    className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700 dark:text-gray-200'}`}
                    onClick={() => handleSelect(item)}
                  >
                    {optionText}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AsyncSearchableSelect;
