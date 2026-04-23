
export interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  warehouse: string;
  batchNumber: string;
  buyingPrice: number;
  sellingPrice: number;
  category: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Invoice {
  id: string;
  number: string;
  customer: string;
  date: string;
  dueDate: string;
  total: number;
  totalTax: number;
  totalCGST?: number;
  totalSGST?: number;
  totalIGST?: number;
  totalCESS?: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
}

export interface PurchaseOrder {
  id: string;
  number: string;
  supplier: string;
  date: string;
  requiredBy: string;
  total: number;
  status: 'Draft' | 'Sent' | 'Received' | 'Canceled';
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Brand {
  id: string;
  name: string;
  description: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  contactPerson: string;
  contactNumber: string;
}
