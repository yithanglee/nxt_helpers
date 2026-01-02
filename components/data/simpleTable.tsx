'use client'

import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type SimpleTableColumn = {
  label: string
  data: string
  formatDateTime?: boolean
  offset?: number
  render?: (row: any) => React.ReactNode
  emptyValue?: React.ReactNode
  className?: string
}

export default function SimpleTable({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data',
}: {
  columns: SimpleTableColumn[]
  data: any[]
  isLoading?: boolean
  emptyMessage?: string
}) {
  const getValue = (row: any, path: string) => {
    if (!path) return undefined
    // support dot-path access, e.g. "outlet.name"
    return path.split('.').reduce((acc: any, key: string) => (acc == null ? undefined : acc[key]), row)
  }

  const formatDateTime = (value: any, offsetHours = 0) => {
    if (!value) return ''
    const dt = new Date(value)
    if (Number.isFinite(offsetHours) && offsetHours !== 0) {
      dt.setTime(dt.getTime() + offsetHours * 60 * 60 * 1000)
    }
    if (Number.isNaN(dt.getTime())) return String(value)
    return dt.toLocaleString()
  }

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>
  }

  if (!data || data.length === 0) {
    return <div className="text-sm text-muted-foreground">{emptyMessage}</div>
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c.label}>{c.label}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={row?.id ?? `${i}`}>
              {columns.map((c, j) => {
                const content = c.render
                  ? c.render(row)
                  : c.formatDateTime
                    ? formatDateTime(getValue(row, c.data), c.offset ?? 0)
                    : (getValue(row, c.data) ?? c.emptyValue ?? '')

                return (
                  <TableCell key={`${c.data}-${j}`} className={c.className}>
                    {content}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}


