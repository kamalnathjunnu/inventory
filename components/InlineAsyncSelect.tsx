import React, { useState, useEffect, useRef } from 'react';

interface InlineAsyncSelectProps {
  value: string;
  onChange: (val: string, item?: any) => void;
  onSearch: (query: string) => Promise<any[]>;
  placeholder?: string;
  disabled?: boolean;
  renderOption?: (item: any) => string;
  renderDisplay?: (item: any) => string;
  className?: string;
}

const InlineAsyncSelect: React.FC<InlineAsyncSelectProps> = ({ 
  value, 
  onChange, 
  onSearch,
  placeholder = "Select...",
  disabled = false,
  renderOption,
  renderDisplay,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
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
    const displayValue = renderDisplay ? renderDisplay(item) : (renderOption ? renderOption(item) : item);
    onChange(displayValue, item);
    setIsOpen(false);
    setSearch('');
  };

  const displayValue = value || placeholder;

  return (
    <div className="relative" ref={wrapperRef}>
      <div 
        className={`cursor-pointer ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={!value ? 'text-gray-400' : ''}>
          {displayValue}
        </span>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-[60] left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl min-w-[200px] max-h-60 overflow-hidden">
          <div className="p-2 sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
              <input 
                type="text" 
                className="w-full pl-8 pr-3 rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm p-1.5 focus:ring-2 focus:ring-primary/50 dark:text-white"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </div>
              </div>
            ) : options.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                {search ? `No results found` : 'No options available'}
              </div>
            ) : (
              options.map((item, index) => {
                const optionText = renderOption ? renderOption(item) : item;
                const isSelected = value === (renderDisplay ? renderDisplay(item) : optionText);
                return (
                  <div 
                    key={index}
                    className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700 dark:text-gray-200'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(item);
                    }}
                  >
                    {optionText}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InlineAsyncSelect;
