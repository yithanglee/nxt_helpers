'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { Product, SortOptions } from '@/lib/types'

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [sortOptions, setSortOptions] = useState<SortOptions>({ sortBy: null, sortOrder: 'asc' })

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/products')
        if (!response.ok) throw new Error('Failed to fetch products')
        const data: Product[] = await response.json()
        setProducts(data)
      } catch (error) {
        console.error('Error fetching products:', error)
      }
    }
    fetchProducts()
  }, [])

  const sortedProducts = [...products].sort((a, b) => {
    if (sortOptions.sortBy === 'sales') {
      const aSales = parseInt(a.sales.replace(/[^\d]/g, ''))
      const bSales = parseInt(b.sales.replace(/[^\d]/g, ''))
      return sortOptions.sortOrder === 'asc' ? aSales - bSales : bSales - aSales
    } else if (sortOptions.sortBy === 'name') {
      return sortOptions.sortOrder === 'asc'
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title)
    }
    return 0
  })

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {sortedProducts.map((product) => (
        <Card key={product.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative">
              <img
                alt={product.title}
                className="h-40 w-full object-cover"
                height="160"
                src={product.image}
                style={{
                  aspectRatio: "160/160",
                  objectFit: "cover",
                }}
                width="160"
              />
              <div className="absolute left-2 top-2 rounded-full bg-yellow-500 px-2 py-1 text-xs font-semibold text-white">
                {product.discount}
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-800 line-clamp-3 h-14" title={product.title}>
                {product.title}
              </h3>
              <p className="text-xs text-gray-600 mt-2">{product.category}</p>
              <div className="mt-2">
                <Label htmlFor={`voucher-${product.id}`} className="text-xs">Available Voucher</Label>
                <div className="mt-1 flex space-x-1">
                  <Input id={`voucher-${product.id}`} readOnly value={product.voucher} className="text-xs h-8" />
                  <Button variant="outline" size="sm" className="text-xs h-8">Apply</Button>
                </div>
              </div>
              <div className="mt-2 text-right text-xs font-medium text-gray-500">{product.sales}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}