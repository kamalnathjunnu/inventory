import React from 'react';

interface InvoiceDetailsSectionProps {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  errors?: { [key: string]: string };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  title: string;
  invoiceNumberLabel: string;
  invoiceNumberPlaceholder: string;
  dateLabel: string;
  dueDateLabel: string;
}

const InvoiceDetailsSection: React.FC<InvoiceDetailsSectionProps> = ({
  invoiceNumber,
  date,
  dueDate,
  errors = {},
  onChange,
  title,
  invoiceNumberLabel,
  invoiceNumberPlaceholder,
  dateLabel,
  dueDateLabel,
}) => {
  return (
    <div className="lg:col-span-5">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 h-full">
        <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
          <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">receipt_long</span>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">{title}</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-900 dark:text-white">
              {invoiceNumberLabel} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input 
                type="text" 
                name="invoiceNumber"
                value={invoiceNumber}
                onChange={onChange}
                className={`w-full h-10 px-3 pr-8 rounded-md border ${errors.invoiceNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm shadow-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none font-mono`}
                placeholder={invoiceNumberPlaceholder}
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-900 dark:text-white">
              {dateLabel} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input 
                type="date" 
                name="date"
                value={date}
                onChange={onChange}
                max="9999-12-31"
                className={`w-full h-10 px-3  rounded-md border ${errors.date ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm shadow-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none`}
              />
              {/* <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500 dark:text-gray-400 text-[18px] pointer-events-none">calendar_today</span> */}
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-900 dark:text-white">{dueDateLabel}</label>
            <div className="relative">
              <input 
                type="date" 
                name="dueDate"
                value={dueDate}
                onChange={onChange}
                max="9999-12-31"
                className="w-full h-10 px-3  rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm shadow-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              />
              {/* <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500 dark:text-gray-400 text-[18px] pointer-events-none">event_upcoming</span> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsSection;
