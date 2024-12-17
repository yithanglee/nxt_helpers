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
import { ChevronDown, Check, Search, ChevronsUpDown } from "lucide-react"
import { PHX_ENDPOINT, PHX_HTTP_PROTOCOL } from '@/lib/constants'
import { postData } from '@/lib/svt_utils'
import { cn } from '@/lib/utils'

import { ScrollArea } from '@radix-ui/react-scroll-area'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'


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
  multiSelection: boolean
  join_statements: Record<string, string>[]
  preloads: string[]
  value: string[]
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
  selection,
  multiSelection = false,
  join_statements,
  preloads,
  value
}: DynamicDropdownProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [chosenList, setChosenList] = useState<any[]>([])
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
      additional_join_statements: JSON.stringify(join_statements),
      additional_search_queries: search_queries,
      draw: '1',
      length: itemsPerPage,
      model: module,
      columns: { 0: { data: 'id', name: 'id' } },
      order: { 0: { column: 0, dir: 'desc' } },
      preloads: JSON.stringify(preloads),
      start: (pageNumber - 1) * itemsPerPage
    }

    console.log(apiData)

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
  }, [cac_url, join_statements, data.preloads, itemsPerPage, module, query, search_queries])

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



  const [selectedValues, setSelectedValues] = useState<string[]>(value || [])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    setSelectedValues(value || [])
  }, [value])

  const handleSelect = (currentValue: string) => {
    const updatedValues = selectedValues.includes(currentValue)
      ? selectedValues.filter((val) => val !== currentValue)
      : [...selectedValues, currentValue]
    setSelectedValues(updatedValues)
    console.log(input)
    console.log(data)
    console.log(newData)
    console.log(updatedValues)
    // data[input.key] = updatedValues

    data = { ...data, [input.key]: updatedValues }
    console.log(data)
    // onChange(updatedValues)
  }



  let filteredDataList: any[] = []

  if (items.length > 0) {
    console.log(items)
    filteredDataList = items.filter((item) => {
      try {
        if (title_key.includes('.')) {
          const [key, subKey] = title_key.split('.')
          return item[key][subKey].toLowerCase().includes(searchTerm.toLowerCase())
        } else {
          return item[title_key].toLowerCase().includes(searchTerm.toLowerCase())
        }
      } catch (e) {
        console.error(e)
      }


    })

  }

  const label = input.key.replace('_id', '')
  let alt_class = ''
  if (multiSelection) {
    alt_class = 'w-full lg:w-1/3 mx-4 my-2'
  }

  return (
    <div>
      {multiSelection && <div className={cn("flex flex-col space-y-2", alt_class)}>

        <Input
          id={`${label}-search`}
          placeholder={`Search ${selection}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Input
          type="hidden"
          name={inputName(input.key)}
          value={selectedValues}
        />
        <ScrollArea className="h-[200px] border rounded-md p-2 ">
          <div className="space-y-2">
            {filteredDataList.map((item) => (
              <div key={item.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`${label}-${item.id}`}
                  checked={selectedValues.includes(item.id)}
                  onCheckedChange={() => handleSelect(item.id)}
                />
                <Label
                  htmlFor={`${label}-${item.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {title_key.includes('.') ? (
                    <>
                      {item[title_key.split('.')[0]][title_key.split('.')[1]]} id: {item['id']}
                    </>
                  ) : (
                    <>
                      {item[title_key]} id: {item['id']}
                    </>
                  )}


                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="text-sm text-muted-foreground">
          {selectedValues.length} item(s) selected
        </div>
      </div>}
      {!multiSelection && <><Input
        type="hidden"
        name={inputName(input.key)}
        value={data[input.key]}
        onChange={(e) => data[input.key] = e.target.value} /><DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
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
                  className="h-8 w-full" />
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {title_key.includes(".") && <div>
                {items.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                  onSelect={() => updateData(item.id, item[title_key.split(".")[0]][title_key.split(".")[1]])}
                >
                  {item[title_key.split(".")[0]][title_key.split(".")[1]]} id: {item['id']}
                </DropdownMenuItem>
                ))}
              </div>}
              {!title_key.includes(".") && items.map((item) => (
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
        </DropdownMenu></>}

    </div>
  )
}