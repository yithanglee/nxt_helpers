export interface Product {
    id: number
    title: string
    image: string
    discount: string
    voucher: string
    category: string
    sales: string
  }
  
  export interface SortOptions {
    sortBy: 'sales' | 'name' | null
    sortOrder: 'asc' | 'desc'
  }