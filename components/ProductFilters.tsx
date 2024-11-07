'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ArrowUpDownIcon } from 'lucide-react'
import type { SortOptions } from '@/lib/types'

export default function ProductFilters() {
  const [sortOptions, setSortOptions] = useState<SortOptions>({ sortBy: null, sortOrder: 'asc' })

  const toggleSort = (type: 'sales' | 'name') => {
    if (sortOptions.sortBy === type) {
      setSortOptions({ ...sortOptions, sortOrder: sortOptions.sortOrder === 'asc' ? 'desc' : 'asc' })
    } else {
      setSortOptions({ sortBy: type, sortOrder: 'asc' })
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4">
      <div className="flex-1">
        <Label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700">
          Category
        </Label>
        <Select>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="stationery">Stationery</SelectItem>
            <SelectItem value="printing">Printing</SelectItem>
            <SelectItem value="furniture">Furniture</SelectItem>
            <SelectItem value="electronics">Electronics</SelectItem>
            <SelectItem value="office-equipment">Office Equipment</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <Label className="mb-1 block text-sm font-medium text-gray-700">Unit Type</Label>
        <RadioGroup defaultValue="units" className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="units" id="units" />
            <Label htmlFor="units">Units</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cartons" id="cartons" />
            <Label htmlFor="cartons">Cartons</Label>
          </div>
        </RadioGroup>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleSort('sales')}
          className={sortOptions.sortBy === 'sales' ? 'bg-gray-200' : ''}
        >
          Sort by Sales
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleSort('name')}
          className={sortOptions.sortBy === 'name' ? 'bg-gray-200' : ''}
        >
          Sort by Name
          <ArrowUpDownIcon className="ml-2 h-4 w-4" />
        </Button>
        <span className="text-sm font-medium text-gray-700">
          {sortOptions.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        </span>
      </div>
    </div>
  )
}