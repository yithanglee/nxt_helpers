'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Check, Search } from "lucide-react"
import { PHX_ENDPOINT, PHX_HTTP_PROTOCOL } from '@/lib/constants'
import { postData } from '@/lib/svt_utils'


interface DynamicDropdownProps {
  data: any
  input: { key: string }
  newData: string
  name: string
  module: string
  parent: string
  search_queries: string[]
  title_key: string
  selection: string | string[]
}

export default function DynamicDropdown({
  data,
  input,
  newData,
  name,
  module,
  parent,
  search_queries,
  title_key = 'name',
  selection
}: DynamicDropdownProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [title, setTitle] = useState('Selected')
  const [pages, setPages] = useState<{ name: number; href: string }[]>([])

  const cac_url = PHX_HTTP_PROTOCOL + PHX_ENDPOINT
  const itemsPerPage = 100

  const inputName = useCallback((key: string) => `${parent}[${key}]`, [parent])

  const tryPost = async () => {
    const newFormData = { [newData]: query }
    const map = { [module]: { ...newFormData, id: '0' } }
    let url = `${cac_url}/svt_api/${module}`
    try {


     await postData({
        endpoint: url,
        data: map, successCallback: fetchData
      },)



    } catch (error) {
      console.error('Error posting data:', error)
    }
  }
  function buildQueryString(data: any, parentKey: any) {
    return Object.keys(data)
      .map((key): any => {
        const nestedKey = parentKey
          ? `${parentKey}[${encodeURIComponent(key)}]`
          : encodeURIComponent(key);

        if (data[key] != null && typeof data[key] === 'object' && !Array.isArray(data[key])) {
          return buildQueryString(data[key], nestedKey);
        } else if (data[key] == null) {
          return ``;
        } else {
          return `${nestedKey}=${encodeURIComponent(data[key])}`;
        }
      })
      .join('&');
  }
  const fetchData = useCallback(async (pageNumber: number = 1) => {
    const apiData = {
      search: { regex: 'false', value: query.trim() },
      additional_join_statements: data.join_statements,
      additional_search_queries: search_queries,
      draw: '1',
      length: itemsPerPage,
      model: module,
      columns: { 0: { data: 'id', name: 'id' } },
      order: { 0: { column: 0, dir: 'desc' } },
      preloads: JSON.stringify(data.preloads),
      start: (pageNumber - 1) * itemsPerPage
    }

    const queryString = buildQueryString({ ...apiData }, null);

    try {
      const response = await fetch(`${cac_url}/svt_api/${module}?${queryString}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('API request failed')
      }

      const dataList = await response.json()
      setItems(dataList.data)

      const totalPages = Math.ceil(dataList.recordsFiltered / itemsPerPage)
      setPages(Array.from({ length: totalPages }, (_, i) => ({
        name: i + 1,
        href: `?page=${i + 1}`
      })))
    } catch (error) {
      console.error('An error occurred', error)
    }
  }, [cac_url, data.join_statements, data.preloads, itemsPerPage, module, query, search_queries])

  const updateData = (id: string, name: string) => {
    setDropdownOpen(false)
    data[input.key] = id
    setTitle(name)
  }

  useEffect(() => {
    if (typeof selection === 'string') {
      fetchData()
    } else {
      setItems(selection.map(v => ({ id: v, name: v })))
    }
  }, [selection, fetchData])

  useEffect(() => {
    console.log(input)
    if (typeof selection === 'string') {
      const selectedItem = data[input.key.replace('_id', '')]
      if (selectedItem && selectedItem[title_key]) {
        setTitle(selectedItem[title_key])
      } else if (data[input.key]) {
        setTitle(data[input.key])
      } else {
        setTitle('Selected')
      }
    } else {
      setTitle(data[input.key] || 'Selected')
    }
  }, [data, input, title_key, selection])

  return (
    <div>
      <Input
        type="hidden"
        name={inputName(input.key)}
        value={data[input.key]}
        onChange={(e) => data[input.key] = e.target.value}
      />
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button>
            {title}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <div className="p-2">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 opacity-50" />
              <Input
                placeholder="Search..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  fetchData()
                }}
                className="h-8 w-full"
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {items.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onSelect={() => updateData(item.id, item[title_key])}
              >
                {item[title_key]}
              </DropdownMenuItem>
            ))}
          </div>
          {typeof selection === 'string' && (
            <div className="p-2">
              <Button
                size="sm"
                className="w-full"
                onClick={tryPost}
              >
                <Check className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}