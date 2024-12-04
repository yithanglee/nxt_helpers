'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useModel } from '@/lib/provider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Image from "next/image"
import { JSONTree } from 'react-json-tree';
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { genInputs, postData } from '@/lib/svt_utils'
import DynamicForm from './dynaform'
import { PHX_ENDPOINT, PHX_HTTP_PROTOCOL } from '@/lib/constants'
import { ImageIcon, PlusIcon } from 'lucide-react'
import Link from 'next/link'
import SearchInput from './searchInput';
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { DialogOverlay } from '@radix-ui/react-dialog';

// Assuming these are defined in your environment variables

const url = PHX_HTTP_PROTOCOL + PHX_ENDPOINT;
// Type for custom columns
interface CustomCol {
  title: string;

  list: (string | {
    label: string
    hidden?: boolean
    value?: any
    selection?: string | string[]
    multiSelection?: boolean;
    dataList?: any[];
    parentId?: string;
    customCols?: any
    search_queries?: string[]
    newData?: string
    title_key?: string
    boolean?: boolean
    editor?: boolean
    editor2?: boolean
    upload?: boolean
    alt_class?: string
    date?: boolean
  } | CustomSubCol)[]
}
interface CustomSubCol {
  label: string;
  alt_class?: string;
  customCols?: CustomCol[] | null;
  selection: string | string[];
  multiSelection?: boolean;
  dataList?: any[];
  parentId?: string;
  search_queries: string[];
  newData: string;
  title_key: string;
}
interface DataTableProps {
  modelPath?: string
  gridFn?: (item: any) => string
  itemsPerPage?: number
  appendQueries?: Record<any, any>
  showNew?: boolean
  showGrid?: boolean
  canDelete?: boolean
  canEdit?: boolean
  search_queries?: string[]
  join_statements?: Record<any, any>
  model: string
  preloads?: string[] | Record<any, any>
  buttons?: {
    name: string
    onclickFn: (
      item: any, 
      name: string,
      refreshData: () => void, 
      confirmModalFn: (
        bool: boolean, 
        message: string, 
        fn: () => void, 
        opts?: any) => void,
        
        ) => void
    href?: (item: any) => string
    showCondition?: (item: any) => boolean
  }[]
  customCols?: CustomCol[];

  columns: {
    label: string
    data: string
    subtitle?: { label: string, data: string }
    formatDateTime?: boolean
    offset?: number
    isBadge?: boolean
    showImg?: boolean
    showJson?: boolean
    showPreview?: boolean

    showDateTime?: boolean
    color?: { key: string | boolean, value: string }[]
    through?: string[]
    altClass?: string
  }[]
}


export default function DataTable({

  modelPath = '',
  itemsPerPage = 20,
  appendQueries = {},
  showNew = false,
  showGrid = false,
  gridFn = () => { return '/' },
  canDelete = false,
  canEdit = true,
  join_statements = [],
  search_queries = [],
  model,
  preloads = [],
  buttons = [],
  customCols = [],
  columns
}: DataTableProps) {

  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const { data, setData } = useModel();
  const [colInputs, setColInputs] = useState<any[]>([]) // State to hold colInputs
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [searchQuery, setSearchQuery] = useState<Record<string, string>>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [confirmModalMessage, setConfirmModalMessage] = useState('')
  const [confirmModalFunction, setConfirmModalFunction] = useState<(() => void) | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewModal, setPreviewModal] = useState(false)
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  let selectedData = {};
  let isLoading = false, isLoading2 = false;
  let dict: Record<any, any> = {};

  // Fetch colInputs using genInputs inside useEffect
  useEffect(() => {
    const fetchColInputs = async () => {
      isLoading = true;
      const inputs = await genInputs(url, model);
      isLoading = false;
      setColInputs(inputs);
    };

    if (!isLoading && showNew) {

      fetchColInputs();
    }

    const currentParams = new URLSearchParams(searchParams);
    let qp = currentParams.get("page_no");
    console.log(qp);
    if (qp != "") {
      // Set or update the page_no parameter
      let pageNo = parseInt(qp!) || 1;
      setCurrentPage(pageNo);
    }

  }, []);


  useEffect(() => {
    const pageNo = searchParams.get("page_no");
    console.log("Updated page_no:", pageNo);
    const currentParams = new URLSearchParams(searchParams);
    let qp = currentParams.get("page_no");
    console.log(qp);
    if (qp != "") {
      // Set or update the page_no parameter
      let pageNo = parseInt(qp!) || 1;
      setCurrentPage(pageNo);
    }
  }, [searchParams]);

  const buildSearchString = useCallback((query: any) => {
    if (Object.keys(query).length == 0) {
      return {}
    } else {
      const slist = Object.entries(query)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key}=${value}`)
      return slist.join('|') || search_queries.join('|')
    }


  }, [search_queries])

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
  const fetchData = useCallback(async (pageNumber: number) => {

    if (isLoading2) return; // Avoid fetching data while it's already being fetched
    isLoading2 = true;

    setError(null);
    let finalSearchQuery: Record<any, any> = {};
    finalSearchQuery = searchQuery


    try {
      for (const key in finalSearchQuery) {
        if (finalSearchQuery[key] === '') {
          delete finalSearchQuery[key];
        }
      }

    } catch (e) {
      console.error(e)

    }
    const apiData = {
      search: { regex: 'false', value: finalSearchQuery },
      additional_join_statements: JSON.stringify(join_statements),
      additional_search_queries: buildSearchString(searchQuery),
      draw: '1',
      length: itemsPerPage,
      model: model,
      columns: { 0: { data: 'id', name: 'id' } },
      order: { 0: { column: 0, dir: 'desc' } },
      preloads: JSON.stringify(preloads),
      start: (pageNumber - 1) * itemsPerPage,
    };

    const queryString = buildQueryString({ ...apiData, ...appendQueries }, null).replaceAll("&&", "&");
    const blog_url = PHX_HTTP_PROTOCOL + PHX_ENDPOINT;
    console.info(apiData)
    try {
      const response = await fetch(`${blog_url}/svt_api/${model}?${queryString}`, {
        headers: {
          'content-type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const dataList = await response.json();
      setItems(dataList.data);
      setData(dataList.data);
      setTotalPages(Math.ceil(dataList.recordsFiltered / itemsPerPage));
      isLoading2 = false
    } catch (error) {
      console.error('An error occurred', error);
      setError('Failed to fetch data. Please try again.');
    } finally {
      isLoading2 = false;

    }
  },
    [model, searchQuery, appendQueries, preloads, buildSearchString]
  );

  useEffect(() => {
    if (!isLoading2) {
      fetchData(currentPage); // This will automatically fetch data when currentPage or searchQuery changes
    }
  }, [currentPage, searchQuery]); // Trigger only when these states change


  useEffect(() => {

    console.log('searc h queyris')
    console.log(search_queries)

    for (let index = 0; index < search_queries.length; index++) {
      const element = search_queries[index];
      let singleS = element.split("|");
      for (let index2 = 0; index2 < singleS.length; index2++) {
        const sElement = singleS[index2];
        if (sElement.includes("=")) {
          if (sElement.split("=")[1] != 'undefined') {
            dict[sElement.split("=")[0]] = sElement.split("=")[1]
            setSearchQuery(prevQuery => ({ ...prevQuery, [sElement.split("=")[0]]: sElement.split("=")[1] }));

          }
        }
      }
    }
  }, [search_queries]);

  // const updateUrlWithSearch = useCallback(() => {
  //   const searchParam = JSON.stringify(searchQuery)
  //   const newParams = new URLSearchParams(searchParams.toString())
  //   newParams.set('search', searchParam)
  //   console.log(router)
  //   router.replace(`${window.location.pathname}?${newParams.toString()}`, { scroll: false })
  // }, [router, searchParams, searchQuery])


  // const parseSearchFromUrl = useCallback(() => {
  //   const searchParam = searchParams.get('search')
  //   console.log(searchParam)
  //   if (searchParam) {
  //     try {
  //       const parsedSearch = JSON.parse(searchParam)
  //       console.log(parsedSearch)
  //       setSearchQuery(parsedSearch)
  //     } catch (error) {
  //       console.error('Error parsing search query from URL:', error)
  //     }
  //   }
  // }, [searchParams])

  // Effect to update URL when search query changes
  useEffect(() => {
    if (Object.keys(searchQuery).length) {
      // updateUrlWithSearch()
    }
  }, [searchQuery])



  // Modify handleSearch to include URL update
  const handleSearch = (newSearchQuery: any) => {
    console.log('new search qur')
    console.log(newSearchQuery)
    setSearchQuery(newSearchQuery)
    setCurrentPage(1)
    // updateUrlWithSearch()
  }
  // Effect to parse search query from URL on initial load
  // useEffect(() => {
  //   parseSearchFromUrl()
  // }, [parseSearchFromUrl])

  const handleNew = () => {
    setSelectedItem({ ...{ id: "0" }, ...appendQueries })
    setIsModalOpen(true)

  }

  const handleEdit = (item: any) => {

    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleDelete = (item: any) => {
    setSelectedItem(item);
    setConfirmModalMessage("Are you sure you want to delete this item?");
    setConfirmModalFunction(() => async () => {
      (async () => {


        await postData({
          method: "DELETE",
          endpoint: `${PHX_HTTP_PROTOCOL}${PHX_ENDPOINT}/svt_api/${model}/${item.id}`,
        });

        await fetchData(currentPage); // Explicitly await fetchData

        setConfirmModalOpen(false);

        toast({
          title: "Action completed!",
          description: "Your action was successful!",
        });
      })();
    });
    setConfirmModalOpen(true);
  };


  const confirmModalFn = (bool: boolean, message: string, fn: () => void, opts?: any) => {
    setConfirmModalOpen(bool)
    setConfirmModalMessage(message)
    setConfirmModalFunction(() => fn)
  }

  function PaginationComponent({ totalPages, path }: { totalPages: number, path: string }) {
    const searchParams = useSearchParams();
    const handlePaginationClick = (pageNumber: any) => {
      const currentParams = new URLSearchParams(searchParams);
      // Set or update the page_no parameter
      currentParams.set("page_no", pageNumber);
      if (path != '') {
        router.push(`/${path}?${currentParams.toString()}`);
      }

    };

    const getPaginationItems = () => {
      const paginationItems = [];
      const rangeStart = Math.max(1, currentPage - 1);
      const rangeEnd = Math.min(totalPages, currentPage + 1);

      for (let i = rangeStart; i <= rangeEnd; i++) {
        if (i > 0) {
          paginationItems.push(i);
        }
      }

      if (paginationItems.length > 0 && currentPage < totalPages - 1) {
        paginationItems.push(paginationItems[paginationItems.length - 1] + 1);
      } else if (paginationItems.length > 0 && currentPage > 1) {
        paginationItems.unshift(paginationItems[0] - 1);
      }

      return paginationItems;
    };

    return (
      <div className="gap-4 flex flex-col lg:flex-row items-center justify-between  mt-8  ">
        <div>
          <Pagination >
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  color={currentPage === 1 ? 'default' : 'ghost'}
                  onClick={() => {
                    let prv = Math.max(currentPage - 1, 1);
                    handlePaginationClick(prv)
                    setCurrentPage(prv)
                  }
                  }
                />
              </PaginationItem>

              {/* {currentPage > 2 && (
                <>
                  <PaginationItem>
                    <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
                  </PaginationItem>
                  {currentPage > 3 && <PaginationEllipsis />}
                </>
              )} */}

              {getPaginationItems().filter((v) => v > 0).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink

                    isActive={page === currentPage}
                    onClick={() => {
                      setCurrentPage(page)
                      handlePaginationClick(page)
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
{/* 
              {currentPage < totalPages - 1 && (
                <>
                  {currentPage < totalPages - 2 && <PaginationEllipsis />}
                  <PaginationItem>
                    <PaginationLink onClick={() => setCurrentPage(totalPages)}>{totalPages} last</PaginationLink>
                  </PaginationItem>
                </>
              )} */}

              <PaginationItem>
                <PaginationNext
                  color={currentPage === totalPages ? 'default' : 'ghost'}
                  onClick={() => {
                    let nxt = Math.min(currentPage + 1, totalPages);
                    handlePaginationClick(nxt)
                    setCurrentPage(nxt)
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>


        <span className='w-[200px]'>Page {currentPage} of {totalPages}</span>
      </div>
    );
  }


  interface Column {
    altClass?: string;
    data: string
    subtitle?: { label: string, data: string }
    showPreview?: boolean
    formatDate?: boolean
    formatDateTime?: boolean
    through?: string[]
    color?: { key: string | boolean; value: string }[]
    showImg?: boolean
    showJson?: boolean

    isBadge?: boolean
    offset?: number
  }

  const renderCell = (item: any, column: Column) => {


    const url = PHX_HTTP_PROTOCOL + PHX_ENDPOINT

    const badgeColor = (value: string | boolean, conditionList: { key: string | boolean; value: string }[]) => {
      const result = conditionList.find(v => v.key === value)

      return result ? result.value : 'destructive'
    }

    const checkAssoc = (data: any, val: string, through: string[]) => {
      try {
        if (data[through[0]]) {

          if (column.showImg) {

            if (data[through[0]][0]) {
              return (

                <Image
                  className="rounded-lg"
                  src={`${url}${data[through[0]][0][val] ? data[through[0]][0][val] : '/'}`}
                  alt={`Image for ${column.data}`}
                  width={140}
                  height={30}
                />

              )
            } else {
              return <ImageIcon></ImageIcon>
            }
          }

          if (column.showPreview && data[through[0]].length > 0) {
            return (<>
              <Button
                onClick={() => {

                  setImgUrl(`${url}${data[through[0]][0][val]}`)
                  setPreviewModal(true)
                }}
                disabled={false}
              >
                <MagnifyingGlassIcon></MagnifyingGlassIcon>
              </Button>
              <Dialog open={previewModal} onOpenChange={setPreviewModal} aria-labelledby="dialog-title" aria-describedby="dialog-description">
                <DialogContent >
                  <DialogTitle>
                    <h2 id="dialog-title">Image</h2>
                  </DialogTitle>
                  <DialogDescription>
                    <p id="dialog-description">Preview</p>
                  </DialogDescription>
                  {data[through[0]][0][val] && (
                    <Image src={imgUrl!} alt="Preview" width={1200} height={700} />
                  )}

                </DialogContent>
              </Dialog>
            </>)
          }

          return data[through[0]][val]
        } else {
          return ''
        }



      } catch (e) {
        console.error(e)
        return ''
      }
    }

    const formatDate = (date: string, offset: number = 0) => {
      const dt = new Date(date)
      dt.setTime(dt.getTime() + offset * 60 * 60 * 1000)
      return dt.toLocaleDateString('en-GB', {
        timeZone: 'Asia/Kuala_Lumpur',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    const formatDateTime = (date: string, offset: number = 0) => {
      const dt = new Date(date)
      dt.setTime(dt.getTime() + offset * 60 * 60 * 1000)
      return dt.toLocaleString('en-GB', {
        timeZone: 'Asia/Kuala_Lumpur',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }

    let value = item[column.data]


    if (column.subtitle) {
      return (
        <>
          {value}
          <br />
          <small className="font-extralight dark:text-white">
            {item[column.subtitle.data]}
          </small>
        </>
      )
    }



    if (column.formatDate) {
      return formatDate(value, column.offset)
    }

    if (column.formatDateTime) {
      return (<><small>{formatDateTime(value, column.offset)}</small></>)
    }

    if (column.through) {
      return checkAssoc(item, column.data, column.through)
    }

    if (column.color) {

      let showVal = value


      if ([true, false].includes(value)) {
        showVal = value ? 'Yes' : 'No'
      }
      return (
        <Badge className="capitalize" variant={badgeColor(value, column.color) as any}>
          {showVal.replace("_", " ")}
        </Badge>
      )
    }
    if (column.showJson) {

      let theme = {
        scheme: 'bright',
        author: 'chris kempson (http://chriskempson.com)',
        base00: '#000000',
        base01: '#303030',
        base02: '#505050',
        base03: '#b0b0b0',
        base04: '#d0d0d0',
        base05: '#e0e0e0',
        base06: '#f5f5f5',
        base07: '#ffffff',
        base08: '#fb0120',
        base09: '#fc6d24',
        base0A: '#fda331',
        base0B: '#a1c659',
        base0C: '#76c7b7',
        base0D: '#6fb3d2',
        base0E: '#d381c3',
        base0F: '#be643c'
      };
      return (
        <div className="hasJson">
          <JSONTree data={value}
            shouldExpandNodeInitially={(k, d, l) => {

              return false;
            }}
            theme={{
              extend: theme,

              valueLabel: {
                textDecoration: 'underline',
              },

            }}


          />
        </div>

      )

    }

    if (column.showImg) {

      if (value) {
        return (
          <div style={{ width: '120px' }}>
            <Image
              className="rounded-lg"
              src={`${url}${value ? value : '/'}`}
              alt={`Image for ${column.data}`}
              width={120}
              height={80}
            />
          </div>
        )
      } else {
        return (
          <div style={{ width: '120px' }}>
            <ImageIcon></ImageIcon>
          </div>
        )
      }

    }

    if (column.showPreview) {
      return (
        <>
          <Button
            onClick={() => {
              setImgUrl(value)
              setPreviewModal(true)
            }}
            disabled={!value}
          >
            Preview
          </Button>
          <Dialog open={previewModal} onOpenChange={setPreviewModal} aria-labelledby="dialog-title" aria-describedby="dialog-description">
            <DialogContent
              aria-describedby={imgUrl!}
              aria-description={imgUrl!}
            >
              <DialogHeader>
                <DialogTitle>Preview</DialogTitle>
              </DialogHeader>
              {imgUrl && (
                <Image src={`${url}${imgUrl}`} alt="Preview" width={1200} height={700} />
              )}
            </DialogContent>
          </Dialog>
        </>
      )
    }

    if (column.isBadge) {
      return (
        <Badge className="capitalize" variant="default">
          {value ? value.split('_').join(' ') : ''}
        </Badge>
      )
    }


    return value || ''
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (

    <div className="space-y-4">
      <div className="flex space-x-2">
        <SearchInput
          model={model}
          join_statements={join_statements}
          oriSearchQuery={searchQuery}
          searchQueries={search_queries} onSearch={handleSearch} />


        {showNew && <Button onClick={
          handleNew
        }><PlusIcon className="mr-2 h-4 w-4" />New</Button>}
      </div>
      <div className=" rounded-md border">
        {showGrid &&
          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-4'>

            {items.map((item, itemIndex) => (

              <div key={itemIndex} className='col-span-1' >
                <Link href={gridFn(item)}>
                  {columns.map((column, columnIndex) => (
                    <div key={columnIndex} >
                      {column.altClass && <div className={column.altClass}>
                        {renderCell(item, column)}
                      </div>}
                      {!column.altClass && renderCell(item, column)}
                    </div>
                  ))}
                </Link>

              </div>



            ))}

          </div>}

        {!showGrid &&
          <div>
            <div className='lg:hidden '>

              {items.map((item, itemIndex) => (
                <Card key={itemIndex} className='p-0 mb-2'>
                  <div className='grid grid-flow-row auto-rows-max p-4'>
                    {columns.map((column, columnIndex) => (

                      <CardContent className='p-0 ' key={columnIndex}>
                        {item[column.data] != "" && column.altClass && <div className={column.altClass}>
                          {renderCell(item, column)}
                        </div>}
                        {!column.altClass && renderCell(item, column)}
                      </CardContent>
                    ))}
                  </div>

                  <CardFooter className='p-4 overflow-x-scroll w-100'>
                    {canEdit && <Button variant="default" onClick={() => handleEdit(item)}>Edit</Button>}
                    {buttons.map((button, buttonIndex) => {
                      if (button.showCondition && !button.showCondition(item)) {
                        return null;
                      }

                      const buttonProps = {
                        key: buttonIndex,
                        variant: "ghost" as const,
                        onClick: button.onclickFn
                          ? () => button.onclickFn!(item, button.name, () => fetchData(currentPage), confirmModalFn)
                          : undefined
                      };

                      const buttonContent = <span>{button.name}</span>;

                      if (button.href) {
                        const href = typeof button.href === 'function' ? button.href(item) : button.href;
                        return (
                          <Button asChild {...buttonProps}>
                            <Link href={href}>
                              {buttonContent}
                            </Link>
                          </Button>
                        );
                      }

                      return (
                        <Button {...buttonProps}>
                          {buttonContent}
                        </Button>
                      );
                    })}




                    {canDelete && (
                      <Button variant="ghost" onClick={() => handleDelete(item)}>Delete</Button>
                    )}
                  </CardFooter>
                </Card>
              ))}

            </div>
            <div className='hidden lg:block w-full'>
              <Table className=''>
                <TableHeader>
                  <TableRow>
                    {columns.map((column, index) => (
                      <TableHead key={index}>{column.label}</TableHead>
                    ))}
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, itemIndex) => (
                    <TableRow key={itemIndex}>
                      {columns.map((column, columnIndex) => (
                        <TableCell key={columnIndex}>
                          {column.altClass && <div className={column.altClass}>
                            {renderCell(item, column)}
                          </div>}
                          {!column.altClass && renderCell(item, column)}
                        </TableCell>
                      ))}
                      <TableCell>
                        {canEdit && <Button variant="ghost" onClick={() => handleEdit(item)}>Edit</Button>}
                        {buttons.map((button, buttonIndex) => {
                          if (button.showCondition && !button.showCondition(item)) {
                            return null;
                          }

                          const buttonProps = {
                            key: buttonIndex,
                            variant: "ghost" as const,
                            onClick: button.onclickFn
                              ? () => button.onclickFn!(item, button.name, () => fetchData(currentPage), confirmModalFn)
                              : undefined
                          };

                          const buttonContent = <span>{button.name}</span>;

                          if (button.href) {
                            const href = typeof button.href === 'function' ? button.href(item) : button.href;
                            return (
                              <Button asChild {...buttonProps}>
                                <Link href={href}>
                                  {buttonContent}
                                </Link>
                              </Button>
                            );
                          }

                          return (
                            <Button {...buttonProps}>
                              {buttonContent}
                            </Button>
                          );
                        })}




                        {canDelete && (
                          <Button variant="ghost" onClick={() => handleDelete(item)}>Delete</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

          </div>

        }
      </div>
      <PaginationComponent path={modelPath} totalPages={totalPages}></PaginationComponent>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>

        <DialogContent className=''>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <DynamicForm data={selectedItem} inputs={colInputs} customCols={customCols} module={model} postFn={function (): void {
            setIsModalOpen(false)
            fetchData(currentPage);
          }}

          />
        </DialogContent>


      </Dialog>

      <Dialog open={confirmModalOpen} onOpenChange={
        setConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
          </DialogHeader>
          <DialogDescription>{confirmModalMessage}</DialogDescription>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>Cancel</Button>
            <Button onClick={() => confirmModalFunction && confirmModalFunction()}>Confirm</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>

  )
}
