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
import { Edit, ImageIcon, MoreVertical, PlusIcon, Trash2 } from 'lucide-react'
import Link from 'next/link'
import SearchInput from './searchInput';
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { DialogOverlay } from '@radix-ui/react-dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

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
    preloads?: string[]
    dataList?: any[];
    parentId?: string;
    customCols?: any
    search_queries?: string[]
    join_statements?: Record<any, string>[]
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
  preloads?: string[]
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
    formatMessage?: boolean
    replaceFn?: (v: string) => string
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
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [confirmModalMessage, setConfirmModalMessage] = useState('')
  const [confirmModalFunction, setConfirmModalFunction] = useState<(() => void) | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewModal, setPreviewModal] = useState(false)

  const [isLoading3, setIsLoading3] = useState(true)
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [sortColumn, setSortColumn] = useState('')
  const [sortOrder, setSortOrder] = useState('asc')
  const router = useRouter()
  const searchParams = useSearchParams()
  let selectedData = {};
  let isLoading = false, isLoading2 = false;
  let dict: Record<any, any> = {};

  const [order_statements, setOrderStatements] = useState<any[]>([])

  function buildSearchString(query: any) {
    if (Object.keys(query).length === 0) {
      return {};
    } else {
      const slist = Object.entries(query)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key}=${value}`);
      return slist.join('|') || search_queries.join('|');
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




  const handleSort = useCallback((column: { label: string; data: string; subtitle?: { label: string; data: string; }; formatDateTime?: boolean; offset?: number; isBadge?: boolean; showImg?: boolean; showJson?: boolean; showPreview?: boolean; showDateTime?: boolean; color?: { key: string | boolean; value: string; }[]; through?: string[]; altClass?: string; }): void => {
    const newSortColumn = column.through ? `${column.through[0]}.${column.data}` : column.data;
    setSortColumn(newSortColumn);
    const newSortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newSortOrder);
    setOrderStatements([{ column: newSortColumn, dir: newSortOrder }])
    setHasLoadedSearchQueries(true);
    // neeed to get existing join statement to get the mapping...


  }, [sortOrder, sortColumn, order_statements]);



  const fetchData = useCallback(async (pageNumber: number) => {

    console.log("fetching data")
    console.log(searchQuery)

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


    let dataColumns: any = {}

    for (let index = 0; index < columns.length; index++) {
      const element = columns[index];
      if (element.through && element.through.length > 0) {
        dataColumns[index] = { data: 'id', name: 'id' }
      } else {
        dataColumns[index] = { data: element.data, name: element.label }
      }
    }

    const apiData = {
      search: { regex: 'false', value: finalSearchQuery },
      additional_join_statements: JSON.stringify(join_statements),
      additional_search_queries: buildSearchString(searchQuery),
      additional_order_statements: JSON.stringify(order_statements),
      draw: '1',
      length: itemsPerPage,
      model: model,
      columns: dataColumns,
      order: { 0: { column: 0, dir: 'desc' } },
      preloads: JSON.stringify(preloads),
      start: (pageNumber - 1) * itemsPerPage,
    };

    const queryString = buildQueryString({ ...apiData, ...appendQueries }, null).replaceAll("&&", "&");

    console.log("from fetch data")
    console.log(appendQueries)

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

      if (dataList.data.data) {
        setItems(dataList.data.data);
        setData(dataList.data.data);
        console.log(dataList.data.data)
        setTotalPages(Math.ceil(dataList.data.recordsFiltered / itemsPerPage));
      } else {
        setItems(dataList.data);
        setData(dataList.data);
        setTotalPages(Math.ceil(dataList.recordsFiltered / itemsPerPage));
      }
      isLoading2 = false
    } catch (error) {
      console.error('An error occurred', error);
      setError('Failed to fetch data. Please try again.');
    } finally {
      isLoading2 = false;

    }
  },
    [model, searchQuery, appendQueries, preloads, order_statements]
  );
  const [hasLoadedSearchQueries, setHasLoadedSearchQueries] = useState(false);

  useEffect(() => {
    // const pageNo = searchParams.get("page_no");
    console.log("Updated page_no:", currentPage);
    // const currentParams = new URLSearchParams(searchParams);
    // let qp = currentParams.get("page_no");
    // console.log(qp);
    // if (qp != "") {
    //   // Set or update the page_no parameter
    //   let pageNo = parseInt(qp!) || 1;
    //   console.log("page no")
    //   console.log(pageNo)
    //   setCurrentPage(pageNo);
    // }
    setHasLoadedSearchQueries(true);
  }, [currentPage]);


  const [prevCurrentPage, setPrevCurrentPage] = useState(currentPage);
  useEffect(() => {

    console.log("has currentPagees")

    console.log(currentPage)

    if (search_queries.length > 0 && hasLoadedSearchQueries == true) {

      console.log("fetching data from 2nd use effect when has loaded search queries")
      fetchData(currentPage);
      setHasLoadedSearchQueries(false);
    } else if (search_queries.length == 0 && !isLoading2) {


      console.log("fetching data from 2nd use effect")
      console.log(search_queries)
      fetchData(currentPage);
    } else {
      console.log("fetching data from 2nd use effect probably wut current page")


      if (currentPage !== prevCurrentPage) {

        fetchData(currentPage);
      }


      // fetchData(currentPage);
      // setHasLoadedSearchQueries(false);
    }
    setPrevCurrentPage(currentPage);
  }, [searchQuery, order_statements, currentPage]);


  useEffect(() => {
    if (search_queries.length > 0) {
      const newDict: Record<string, string> = {};

      for (const query of search_queries) {
        const singleS = query.split("|");
        for (const sElement of singleS) {
          if (sElement.includes("=")) {
            const [key, value] = sElement.split("=");
            if (value !== 'undefined') {
              newDict[key] = value;
            }
          }
        }
      }

      // Only update if there are actual changes
      if (Object.keys(newDict).length > 0) {
        dict = newDict;
        console.log("possible from here 1st?")
        console.log(search_queries)
        setSearchQuery(newDict);
        setHasLoadedSearchQueries(true);
      }
    }

    console.log(search_queries)
  }, [search_queries]);




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
    if (qp) {
      let pageNo = parseInt(qp) || 1;
      console.log("initial page no")
      setCurrentPage(pageNo);
    }

    if (!isLoading2 && Object.keys(dict).length === 0) {
      console.log("call from 1st use efftect")
      fetchData(currentPage);
    }
  }, []);



  const handleSearch = (newSearchQuery: any) => {
    console.log('new search qur')
    console.log(newSearchQuery)
    setSearchQuery(newSearchQuery)
    setHasLoadedSearchQueries(true);
    setCurrentPage(1)
    // updateUrlWithSearch()
  }

  const _handleNew = () => {
    console.log(items, "items")
    if (customCols && customCols.length > 0) {
      customCols[0].list.forEach((item: any) => {
        if (item.multiSelection) {
          item.dataList = items.map((v: any) => {
            return v[item.label];
          });
        }
      });
    }
    setEditingRowId(null)
  }
  const handleNew = () => {
    console.log(items, "items")
    if (customCols && customCols.length > 0) {
      customCols[0].list.forEach((item: any) => {
        if (item.multiSelection) {
          item.dataList = items.map((v: any) => {
            return v[item.label];
          });
        }
      });
    }
    setSelectedItem({ ...{ id: "0" }, ...appendQueries })
    setIsModalOpen(true)

  }

  const handleEdit = (item: any) => {
    if (customCols && customCols.length > 0) {
      customCols[0].list.forEach((item: any) => {
        if (item.multiSelection) {
          item.dataList = items;
        }
      });
    }
    setEditingRowId(item.id)
  }

  const handleCancelEdit = () => {
    setEditingRowId(null)
  }

  const handleSaveEdit = () => {
    setEditingRowId(null)
    fetchData(currentPage)
  }

  const handleDelete = (item: any) => {
    setEditingRowId(null)
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

              {currentPage > 3 && (
                <>
                  <PaginationItem>
                    <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
                  </PaginationItem>
                  {currentPage > 2 && <PaginationEllipsis />}
                </>
              )}

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

              {currentPage < totalPages - 3 && (
                <>
                  {currentPage < totalPages - 1 && <PaginationEllipsis />}
                  <PaginationItem>
                    <PaginationLink onClick={() => setCurrentPage(totalPages)}>{totalPages}</PaginationLink>
                  </PaginationItem>
                </>
              )}

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
    label?: string;
    altClass?: string;
    data: string
    subtitle?: { label: string, data: string }
    formatMessage?: boolean
    replaceFn?: (v: string) => string
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

          return <>
            <div className="hidden flex items-center gap-2">
              <span className="font-light text-gray-500">{column.label} : </span>
              <span className="font-bold">{data[through[0]][val]}</span>
            </div>
            <div className="block">
              {data[through[0]][val]}
            </div>
          </>
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
          <div className="flex flex-col items-start gap-0">
            <span>{value}</span>

            <small className="font-extralight dark:text-white">
              {item[column.subtitle.data]}
            </small>
          </div>

        </>
      )
    }

    if (column.formatMessage) {
      return column.replaceFn ? column.replaceFn(value) : value
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
        <div>
          <div className="hidden flex items-center gap-2">
            <span>{column.label}</span>
            <Badge className="capitalize" variant={badgeColor(value, column.color) as any}>
              {showVal.replace("_", " ")}
            </Badge>
          </div>
          <div className="block">
            <Badge className="capitalize" variant={badgeColor(value, column.color) as any}>
              {showVal.replace("_", " ")}
            </Badge>
          </div>
        </div>

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

  function renderCaret(column: { label: string; data: string; subtitle?: { label: string; data: string; }; formatDateTime?: boolean; offset?: number; isBadge?: boolean; showImg?: boolean; showJson?: boolean; showPreview?: boolean; showDateTime?: boolean; color?: { key: string | boolean; value: string; }[]; through?: string[]; altClass?: string; }): React.ReactNode {
    if (sortColumn === column.data) {
      return sortOrder === 'asc' ? '▲' : '▼'
    } else if (column.through && sortColumn === column.through[0] + '.' + column.data) {
      return sortOrder === 'asc' ? '▲' : '▼'
    }
    return '-'
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
      <div className=" rounded-md ">
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
            <div className='overflow-x-scroll w-screen'>
              <table className="lg:hidden w-full table-fixed">
                <thead>
                  <tr>
                    <th className="px-2 py-2 text-left break-words w-[80px] ">Actions</th>
                    
                    
                    {columns.map((column, index) => (
                      <th
                        key={index}
                        className={`px-2 py-2 text-left break-words ${index === 0 ? 'w-[80px]' : 'w-[240px]'} cursor-pointer`}
                        onClick={() => handleSort(column)}
                      >
                        {column.label}
                        <span className="caret">
                          {renderCaret(column)}
                        </span>
                      </th>
                    ))}
                    
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, itemIndex) => (
                    <React.Fragment key={itemIndex}>
                      <tr>
                      <td className="px-2 py-1 break-words w-[80px] overflow-hidden text-ellipsis">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 px-2">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="flex flex-col justify-center items-start">
                              {buttons.map((button, buttonIndex) => {
                                if (button.showCondition && !button.showCondition(item)) {
                                  return null;
                                }

                                const buttonContent = <span>{button.name}</span>;

                                if (button.href) {
                                  const href = typeof button.href === 'function' ? button.href(item) : button.href;
                                  return (
                                    <Button key={buttonIndex} variant="ghost" asChild>
                                      <Link href={href}>
                                        <DropdownMenuItem>
                                          {buttonContent}
                                        </DropdownMenuItem>
                                      </Link>
                                    </Button>
                                  );
                                }

                                return (
                                  <Button 
                                    key={buttonIndex}
                                    variant="ghost"
                                    onClick={button.onclickFn
                                      ? () => button.onclickFn!(item, button.name, () => fetchData(currentPage), confirmModalFn)
                                      : undefined}
                                  >
                                    <DropdownMenuItem>
                                      {buttonContent}
                                    </DropdownMenuItem>
                                  </Button>
                                );
                              })}

                              {canEdit && 
                                <Button variant="ghost" onClick={() => handleEdit(item)}>
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                </Button>
                              }
                              {canDelete && 
                                <Button variant="ghost" onClick={() => handleDelete(item)}>
                                  <DropdownMenuItem>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </Button>
                              }
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                        {columns.map((column, columnIndex) => (
                          <td key={columnIndex} className="px-2 py-1 break-words overflow-hidden ">
                            {item[column.data] != "" && column.altClass && <div className={`${column.altClass} truncate`}>
                              {renderCell(item, column)}
                            </div>}
                            {!column.altClass && <div className="truncate">
                              {renderCell(item, column)}
                            </div>}
                          </td>
                        ))}
                       
                      </tr>
                      {editingRowId === item.id && (
                        <tr>
                          <td colSpan={columns.length + 1} className="p-0">
                            <div className="p-2 border rounded-md bg-gray-50 w-[300px] lg:w-full ">
                              <DynamicForm 
                                data={item} 
                                inputs={colInputs} 
                                customCols={customCols} 
                                module={model} 
                                postFn={handleSaveEdit}
                                style="flat"
                              />
                              <div className="flex justify-end gap-2 mt-4 px-2">
                                <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                            
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>



            <div className='hidden lg:block w-full'>
              <Table className=''>
                <TableHeader>
                  <TableRow>
                    {columns.map((column, index) => (
                      <TableHead className='cursor-pointer' key={index} onClick={() => handleSort(column)}>{column.label}

                        <span className="caret">
                          {renderCaret(column)}
                        </span>
                      </TableHead>
                    ))}
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, itemIndex) => (
                    <React.Fragment key={itemIndex}>
                      <TableRow>
                        {columns.map((column, columnIndex) => (
                          <TableCell key={columnIndex}>
                            {column.altClass && <div className={column.altClass}>
                              {renderCell(item, column)}
                            </div>}
                            {!column.altClass && renderCell(item, column)}
                          </TableCell>
                        ))}
                        <TableCell>
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

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 px-2">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="flex flex-col justify-center items-start">
                              {canEdit &&
                                <Button variant="ghost" onClick={() => handleEdit(item)}>
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                </Button>
                              }
                              {canDelete &&
                                <Button variant="ghost" onClick={() => handleDelete(item)}>
                                  <DropdownMenuItem>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </Button>
                              }
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      {editingRowId === item.id && (
                        <TableRow>
                          <TableCell colSpan={columns.length + 1}>
                            <div className="p-0">
                              <div className="p-2 border rounded-md bg-gray-50 w-[300px] lg:w-full mx-auto">
                                <DynamicForm 
                                  data={item} 
                                  inputs={colInputs} 
                                  customCols={customCols} 
                                  module={model} 
                                  postFn={handleSaveEdit}
                                  style="flat"
                                />
                                <div className="flex justify-end gap-2 mt-4 px-2">
                                  <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                                  
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
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

      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
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
