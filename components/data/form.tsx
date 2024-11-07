'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GridIcon } from "lucide-react"
import { useAuth } from '@/lib/auth'
import DynamicDropdown from './dynadropdown'
import { PHX_ENDPOINT, PHX_HTTP_PROTOCOL } from '@/lib/constants'

// const TinyMCEditor = dynamic(() => import('@tinymce/tinymce-react').then(mod => mod.Editor), { ssr: false })

interface DynamicInputProps {
  input: any
  keyName: string | { label: string; [key: string]: any }
  module: string
  data: any
  onChange: (key: string, value: any) => void
}

const DynamicInput: React.FC<DynamicInputProps> = ({ input, keyName, module, data, onChange }) => {
  console.log(data)
  const key = typeof keyName === 'string' ? { label: keyName } : keyName
  const inputKey = input?.key || (typeof keyName === 'string' ? keyName : keyName.label)
  const value = data[inputKey]
  const altName = key.alt_name || inputKey.replace('_', ' ')

  const inputName = useCallback((key: string) => `${module}[${key}]`, [module])

  const handleChange = useCallback((newValue: any) => {
    onChange(inputKey, newValue)
  }, [inputKey, onChange])

  function handleFileChange(e: any) {
    console.log(e); 
  }

  if (key.hidden) {
    return <Input type="hidden" name={inputName(inputKey)} value={key.value} />
  }
  // if (key.label == 'id') {
  //   return <Input type="hidden" name={inputName(inputKey)} value={key.value} />
  // }

  if (key.expose) {
    return (
      <div className="w-full sm:w-1/3 mx-4 my-2">
        <Label className="space-y-2">
          <span className="capitalize">{altName}</span>
          <Input 
            type="text" 
            name={inputName(inputKey)} 
            value={value || ''} 
            onChange={(e) => handleChange(e.target.value)} 
          />
        </Label>
      </div>
    )
  }

  if (key.numeric) {
    return (
      <div className="w-full sm:w-1/3 mx-4 my-2">
        <Label className="space-y-2">
          <span className="capitalize">{altName}</span>
          <Input 
            type="number" 
            step="0.1" 
            name={inputName(inputKey)} 
            value={value || ''} 
            onChange={(e) => handleChange(e.target.value)} 
          />
        </Label>
      </div>
    )
  }

  if (key.editor) {
    return (
      <div className="w-full mx-4 my-2">
        <Label className="space-y-2 mb-3">
          <span className="capitalize">{altName}</span>
          <Input type="hidden" name={inputName(inputKey)} value={value || ''} />
        </Label>
        {/* <TinyMCEditor
          apiKey="your-tinymce-api-key"
          value={value || ''}
          onEditorChange={(content: any) => handleChange(content)}
        /> */}
      </div>
    )
  }

  if (key.editor2) {
    // For simplicity, we'll use a textarea for the second editor type
    return (
      <div className="w-full mx-4 my-2">
        <Label className="mb-2 capitalize">{altName}</Label>
        <Textarea
          placeholder="Content"
          className="editable"
          rows={12}
          name={inputName(inputKey)}
          value={value || ''}
          onChange={(e: { target: { value: any } }) => handleChange(e.target.value)}
        />
      </div>
    )
  }

  if (key.boolean) {
    return (
      <div className="w-full mx-4 my-2">
        <Label className="space-y-2">
          <Checkbox
            id={inputKey}
            checked={value === true}
            name={inputName(inputKey)}
            onCheckedChange={(checked) => handleChange(checked)}
          />
          <span className="ms-2 capitalize text-xl">{altName}</span>
        </Label>
      </div>
    )
  }


  if (key.upload) {
    return (
      <div className="w-full mx-4 my-2">
        <Label className="space-y-4 " >
          <span className="capitalize">{altName}</span>
        </Label>
        <div className='h-2'></div>
        <Input type="file" id={inputKey} name={inputName(inputKey)} onChange={handleFileChange} />
        {value && value instanceof File && (
          <div className="mt-2 text-sm text-gray-600">Selected File: {value.name}</div>
        )}
      </div>
    );
  }

  if (key.selection) {

    return (
      <div className="w-full mx-4 my-2">
        <Label className="space-y-4 " >
          <span className="capitalize">{altName}</span>
        </Label>
        <div className='h-2'></div>
      <DynamicDropdown
        data={data}
        input={input}
        newData={key.newData}
        name={inputName(inputKey)}
        module={key.selection}
        parent={module}
        search_queries={key.search_queries}
        title_key={key.title_key}
        selection={key.selection}
      />
      </div>
    )
  }


  return (
    <div className="w-full sm:w-1/3 mx-4 my-2">
      <Label className="space-y-2">
        <span className="capitalize">{altName}</span>
        <Input 
          type="text" 
          name={inputName(inputKey)} 
          value={value || ''} 
          onChange={(e) => handleChange(e.target.value)} 
        />
      </Label>
    </div>
  )
}

interface DynamicFormProps {
  data: any
  inputs: any[]
  customCols: { title: string; list: (string | { label: string; [key: string]: any })[] }[]
  module: string
  postFn: () => void
  showNew?: boolean
  style?: string
}

export default function DynamicForm({ data, inputs, customCols, module, postFn, showNew = false, style }: DynamicFormProps) {
  const { user, logout } = useAuth()
  console.log(user)
  const [formData, setFormData] = useState(data)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState('')

  useEffect(() => {
    if (customCols.length > 0) {
      setSelectedTab(customCols[0].title)
    }
  }, [customCols])

  const handleInputChange = useCallback((key: string, value: any) => {
    setFormData((prevData: any) => ({ ...prevData, [key]: value }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
  
    try {
      const response = await fetch(`${PHX_HTTP_PROTOCOL}${PHX_ENDPOINT}/svt_api/${module}`, {
        method: 'POST',
        body: formData,
        headers: {
          
          'authorization': `Basic ${user?.token}`
        }
      })

      

      if (response.ok) {
        postFn()
        setIsModalOpen(false)
      } else {
        console.error('Form submission failed')
      }
    } catch (error) {
      console.error('An error occurred during form submission:', error)
    }
  }

  const renderForm = () => (
    <form onSubmit={handleSubmit} id="currentForm" className="flex flex-col space-y-6">
      <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">{module} Form</h3>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          {customCols.map((col) => (
            <TabsTrigger key={col.title} value={col.title}>
              <div className="flex items-center gap-2">
                <GridIcon size={16} />
                {col.title}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>
        {customCols.map((col) => (
          <TabsContent key={col.title} value={col.title}>
            <div className="flex flex-wrap w-full gap-2">
              {col.list.map((key, index) => (
                <DynamicInput
                  key={index}
                  input={inputs.find(input => input.key === (typeof key === 'string' ? key : key.label))}
                  keyName={key}
                  module={module}
                  data={formData}
                  onChange={handleInputChange}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      
      <Button type="submit">Submit</Button>
    </form>
  )

  return (
    <div className="space-y-4">
      {renderForm()}
    </div>
  )
}