import React, { useState, useEffect, useRef } from 'react';

interface SearchableSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  onCreateNew?: () => void;
  createNewLabel?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  label, 
  value, 
  options, 
  onChange, 
  placeholder = "Select...",
  required = false,
  onCreateNew,
  createNewLabel = "Create New"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [localOptions, setLocalOptions] = useState(options);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = localOptions.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const handleAddNew = () => {
    if (search.trim()) {
      const newValue = search.trim();
      setLocalOptions([...localOptions, newValue]);
      handleSelect(newValue);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div 
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-800 text-slate-900 dark:text-white shadow-sm p-2.5 flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-primary/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={!value ? 'text-gray-500 dark:text-gray-400' : ''}>
          {value || placeholder}
        </span>
        <span className="material-symbols-outlined text-gray-400">arrow_drop_down</span>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="p-2 sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <input 
              type="text" 
              className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm p-2 focus:ring-2 focus:ring-primary/50 dark:text-white"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          {onCreateNew && (
            <div 
              className="px-4 py-2.5 text-sm text-primary cursor-pointer hover:bg-primary/5 dark:hover:bg-primary/10 font-medium flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 bg-primary/5 dark:bg-primary/5"
              onClick={() => {
                setIsOpen(false);
                onCreateNew();
              }}
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              {createNewLabel}
            </div>
          )}
          {filteredOptions.map((opt) => (
            <div 
              key={opt}
              className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${value === opt ? 'text-primary font-medium' : 'text-gray-700 dark:text-gray-200'}`}
              onClick={() => handleSelect(opt)}
            >
              {opt}
            </div>
          ))}
          {filteredOptions.length === 0 && !onCreateNew && search && (
            <div 
              className="px-4 py-2 text-sm text-primary cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 font-medium flex items-center gap-2"
              onClick={handleAddNew}
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add "{search}"
            </div>
          )}
          {filteredOptions.length === 0 && search && onCreateNew && (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;