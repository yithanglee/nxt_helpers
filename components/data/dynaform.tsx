'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { GridIcon } from "lucide-react"
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/auth'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,

} from '@/components/ui/dropdown-menu';
import DynamicDropdown from './dynadropdown'
import { PHX_ENDPOINT, PHX_HTTP_PROTOCOL } from '@/lib/constants'
import { useToast } from '@/hooks/use-toast'
import { Separator } from '@/components/ui/separator'
// Dynamically import TinyMCE to avoid SSR issues
// const TinyMCEditor = dynamic(() => import('@tinymce/tinymce-react').then(mod => mod.Editor), { ssr: false })

// Assuming these are defined in your environment variables


interface DynamicInputProps {
  input: any
  keyName: string | { label: string;[key: string]: any }
  module: string
  data: any
  onChange: (key: string, value: any) => void
}

const DynamicInput: React.FC<DynamicInputProps> = ({ input, keyName, module, data, onChange }) => {

  const key = typeof keyName === 'string' ? { label: keyName } : keyName
  const inputKey = input?.key || (typeof keyName === 'string' ? keyName : keyName.label)
  let value = data ? data[inputKey] : '';

  if (inputKey.includes(".")) {
    let inputKeys = inputKey.split(".")
    try {
      value = data[inputKeys[0]][inputKeys[1]]
    } catch (e) {

    }

  }
  const altClassName = key.alt_class || 'w-full lg:w-1/3 mx-4 my-2'
  const altName = key.alt_name || inputKey.replace('_', ' ')

  const inputName = useCallback((key: string) => {

    if (key.includes(".")) {

      let subkeys = key.split(".")


      return `${module}[${subkeys[0]}][${subkeys[1]}]`
    } else {
      return `${module}[${key}]`
    }



  }, [module])

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
      <div className="{altClassName}">
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
  if (key.date) {
    return (
      <div className="w-full sm:w-1/3 mx-4 my-2">
        <Label className="space-y-2">
          <span className="capitalize">{altName}</span>
          <Input
            type="date"

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
    if (input == null) {
      console.log("no input")
      return ('')
    }

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
          preloads={key.preloads}
          search_queries={key.search_queries}
          title_key={key.title_key}
          selection={key.selection}
          join_statements={key.join_statements}
          multiSelection={key.multiSelection}
          value={key.dataList}

        />
      </div>
    )
  }

  return (
    <div className={altClassName}>
      <Label className="space-y-2">
        <span className="capitalize">{altName}</span>
        <Input className='rounded-md'
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
  customCols: { title: string; description?: string; list: (string | { label: string;[key: string]: any })[] }[]
  module: string
  postFn: (e: any) => void
  showNew?: boolean
  style?: string
}

export default function DynamicForm({ data, inputs, customCols, module, postFn, showNew = false, style }: DynamicFormProps) {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [formData, setFormData] = useState(data)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState('')
  console.log(data, "form data")
  console.log(customCols, "customCols")
  useEffect(() => {
    if (customCols.length > 0) {
      setSelectedTab(customCols[0].title)
    }
  }, [customCols])

  const handleInputChange = useCallback((key: string, value: any) => {
    setFormData((prevData: any) => {
      // Split the key by '.' to check if it refers to a nested property
      const keys = key.split('.');

      if (keys.length === 1) {
        // If there is no dot, it's a top-level property
        return { ...prevData, [key]: value };
      } else {
        // Destructure the keys for the nested property
        const [mainKey, subKey] = keys;
        return {
          ...prevData,
          [mainKey]: {
            ...prevData[mainKey],
            [subKey]: value
          }
        };
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    console.log("user")
    console.log(user)

    try {
      const response = await fetch(`${PHX_HTTP_PROTOCOL}${PHX_ENDPOINT}/svt_api/${module}`, {
        method: 'POST',
        body: formData,
        headers: {

          'authorization': `Basic ${user?.token}`
        }
      })

      if (response.ok) {
        postFn(await response.json())
        setIsModalOpen(false)
        console.log("postFn toast")
        toast({
          title: "Action Completed",
          description: "Your action was successful!",
        })
      } else {
        console.error('Form submission failed')
        toast({
          variant: "default",
          title: "Something went wrong!",
          description: "Your action was unsuccessful!",
        })
      }
    } catch (error) {
      console.error('An error occurred during form submission:', error)
    }
  }
  useEffect(() => {

    setFormData(data)
  }, [])

  const renderForm = () => (

    <form onSubmit={handleSubmit} id="currentForm" className="flex flex-col space-y-6 overflow-y-auto h-[80vh] lg:h-full">

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList >
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
      <div >
        <Button className="ml-3" type="submit">Submit</Button>
      </div>

    </form>

  )
  const renderAlternativeForm = () => (
    <form onSubmit={handleSubmit} id="currentForm" className="flex flex-col space-y-6">
      <div className='grid grid-cols-9'>
        <div className="col-span-full lg:col-span-2 pr-8 pt-4">
          {customCols.map((col) => (
            <div
              key={col.title}
              className={`p-2 rounded-md cursor-pointer ${selectedTab === col.title ? 'bg-gray-200' : 'bg-white'}`}
              onClick={() => setSelectedTab(col.title)}
            >
              <div className="flex items-center gap-2  hover:underline">

                {col.title}
              </div>
            </div>
          ))}
        </div>
        <div className="col-span-full lg:col-span-6 p-4 flex flex-col gap-4">

          {customCols.map((col) => (
            <div
              key={col.title}
              className={`${selectedTab === col.title ? 'block' : 'hidden'}`}
            >
              <div className='text-lg font-bold'>{col.title} </div>

              <div className='text-sm text-gray-500 mb-8'>Information here are available only to you</div>
              <Separator />
              <div className='h-2'></div>
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
            </div>
          ))}
        </div>
        <div className="lg:col-span-1"></div>
      </div>

      <div >
        <Button className="ml-3" type="submit">Submit</Button>
      </div>
    </form>
  )

  console.log("rendering form...")
  try {
    console.log(formData)
  } catch (e) {
    console.error(e)
  }



  if (style === 'flat') {
    return renderAlternativeForm()
  } else {
    return renderForm()
  }
}
