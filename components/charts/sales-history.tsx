"use client"

import React, { useState, useEffect } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollAreaScrollbar } from '@radix-ui/react-scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DailySalesData {
  day: number
  amount: number
  transactions: number
  online: number
  offline: number
}

interface OutletSalesData {
  outlet: string
  device: string
  organization: string
  data: DailySalesData[]
}

const processData = (data: any[]) => {
  // Create an array of 31 days
  return Array.from({ length: 31 }, (_, i) => {
    const day = i + 1
    const dayData: { [key: string]: any } = { day: day }
    
    // For each outlet, add their online and offline sales for this day
    data.forEach(outlet => {
      if (outlet.outlet) {
        const dayOnline = Number(outlet[`day_${day}_online_sum`]) || 0
        const dayOffline = Number(outlet[`day_${day}_offline_sum`]) || 0
        dayData[`${outlet.outlet}_online`] = dayOnline
        dayData[`${outlet.outlet}_offline`] = dayOffline
      }
    })
    
    return dayData
  })
}

interface SalesHistoryChartProps {
  data: any[]
  year: string
  title: string
  subtitle: string
  onYearMonthChange?: (yearMonth: string) => void
}

const SalesHistoryChart: React.FC<SalesHistoryChartProps> = ({ 
  data, 
  year, 
  title, 
  subtitle,
  onYearMonthChange 
}) => {
  // Filter out entries without outlet names
  const validData = data.filter(d => d.outlet)
  const chartData = processData(validData)
  
  // Get unique outlets for the checkboxes
  const outlets = Array.from(new Set(validData.map(d => d.outlet)))
  const [activeOutlets, setActiveOutlets] = useState<string[]>([])

  // Update active outlets only when outlets list changes
  useEffect(() => {
    if (outlets.length > 0 && activeOutlets.length === 0) {
      setActiveOutlets(outlets)
    }
  }, [outlets.length])

  const handleOutletToggle = (outlet: string) => {
    setActiveOutlets(prev =>
      prev.includes(outlet) ? prev.filter(o => o !== outlet) : [...prev, outlet]
    )
  }

  const handleYearMonthChange = (value: string) => {
    if (onYearMonthChange) {
      onYearMonthChange(value)
    }
  }

  const filteredChartData = chartData.map(dayData => {
    const filteredData: { [key: string]: number | string } = { day: dayData.day }
    activeOutlets.forEach(outlet => {
      filteredData[`${outlet}_online`] = Number(dayData[`${outlet}_online`]) || 0
      filteredData[`${outlet}_offline`] = Number(dayData[`${outlet}_offline`]) || 0
    })
    return filteredData
  })

  // Create chart config with color property instead of theme
  const chartConfig = activeOutlets.reduce((acc, outlet, index) => {
    acc[`${outlet}_online`] = {
      color: `hsl(${index * 30}, 70%, 50%)`,
      label: `${outlet} (QR)`
    }
    acc[`${outlet}_offline`] = {
      color: `hsl(${index * 30}, 70%, 30%)`,
      label: `${outlet} (Cash)`
    }
    return acc
  }, {} as Record<string, { color: string; label: string }>)

  // Calculate daily totals for each outlet
  const outletData = activeOutlets.map(outlet => {
    const dailyValues = Array.from({ length: 31 }, (_, i) => {
      const day = i + 1
      const dayData = filteredChartData.find(d => d.day === day)
      const onlineValue = Number(dayData?.[`${outlet}_online`]) || 0
      const offlineValue = Number(dayData?.[`${outlet}_offline`]) || 0
      return {
        online: onlineValue,
        offline: offlineValue,
        total: onlineValue + offlineValue
      }
    })
    
    const total = dailyValues.reduce((sum, val) => sum + val.total, 0)
    const onlineTotal = dailyValues.reduce((sum, val) => sum + val.online, 0)
    const offlineTotal = dailyValues.reduce((sum, val) => sum + val.offline, 0)
    
    return {
      outlet,
      dailyValues,
      total,
      onlineTotal,
      offlineTotal
    }
  })

  // Calculate daily totals across all outlets
  const dailyTotals = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1
    return activeOutlets.reduce((sum, outlet) => {
      const dayData = filteredChartData.find(d => d.day === day)
      const onlineValue = Number(dayData?.[`${outlet}_online`]) || 0
      const offlineValue = Number(dayData?.[`${outlet}_offline`]) || 0
      return sum + onlineValue + offlineValue
    }, 0)
  })

  // Calculate grand total
  const grandTotal = outletData.reduce((sum, { total }) => sum + total, 0)

  return (
    <Card className="w-full mx-auto">
      <style>
        {`
          .offline-row {
            background-color: rgb(55, 65, 81);
          }
          .offline-row td {
            color: white !important;
          }
          tr:hover {
            background-color: inherit !important;
          }
          .offline-row:hover {
            background-color: rgb(55, 65, 81) !important;
          }
        `}
      </style>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{title} ({year})</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </div>
          <Select value={year} onValueChange={handleYearMonthChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025-01">January 2025</SelectItem>
              <SelectItem value="2025-02">February 2025</SelectItem>
              <SelectItem value="2025-03">March 2025</SelectItem>
              <SelectItem value="2025-04">April 2025</SelectItem>
              <SelectItem value="2025-05">May 2025</SelectItem>
              <SelectItem value="2025-06">June 2025</SelectItem>
              <SelectItem value="2025-07">July 2025</SelectItem>
              <SelectItem value="2025-08">August 2025</SelectItem>
              <SelectItem value="2025-09">September 2025</SelectItem>
              <SelectItem value="2025-10">October 2025</SelectItem>
              <SelectItem value="2025-11">November 2025</SelectItem>
              <SelectItem value="2025-12">December 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full lg:w-1/4">
            <h3 className="text-lg font-semibold mb-2">Outlets</h3>
            <ScrollArea className="h-[480px] " >
           
              {outlets.map(outlet => (
                <div key={outlet} className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id={outlet}
                    checked={activeOutlets.includes(outlet)}
                    onCheckedChange={() => handleOutletToggle(outlet)}
                  />
                  <label
                    htmlFor={outlet}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {outlet}
                  </label>
                </div>
              ))}
            </ScrollArea>
          </div>
          <div className="w-full lg:w-3/4">
            <ChartContainer className="h-[480px] w-full" config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredChartData}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {activeOutlets.map((outlet, index) => (
                    <React.Fragment key={outlet}>
                      <Bar
                        dataKey={`${outlet}_online`}
                        stackId={outlet}
                        fill={`hsl(${index * 30}, 70%, 50%)`}
                        name={`${outlet} (Online)`}
                      />
                      <Bar
                        dataKey={`${outlet}_offline`}
                        stackId={outlet}
                        fill={`hsl(${index * 30}, 70%, 30%)`}
                        name={`${outlet} (Offline)`}
                      />
                    </React.Fragment>
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        <div className="w-full">
          <h3 className="text-lg font-semibold mb-4">Daily Sales Summary</h3>
          <ScrollArea className="w-full whitespace-nowrap " type="scroll">
            <ScrollAreaScrollbar orientation="horizontal" />
            <div className="max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 z-20 bg-background">Outlet</TableHead>
                    <TableHead className="text-right">Type</TableHead>
                    {Array.from({ length: 31 }, (_, i) => (
                      <TableHead key={i + 1} className="text-right">Day {i + 1}</TableHead>
                    ))}
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outletData.map(({ outlet, dailyValues, total, onlineTotal, offlineTotal }) => (
                    <React.Fragment key={outlet}>
                      <TableRow>
                        <TableCell rowSpan={2} className="sticky left-0 z-20 bg-background font-medium">{outlet}</TableCell>
                        <TableCell className="text-right">QR</TableCell>
                        {dailyValues.map((value, i) => (
                          <TableCell key={i} className="text-right">
                            {value.online.toFixed(2)}
                          </TableCell>
                        ))}
                        <TableCell className="text-right font-semibold">
                          {onlineTotal.toFixed(2)}
                        </TableCell>
                      </TableRow>
                      <TableRow className="offline-row">
                        <TableCell className="text-right">Cash</TableCell>
                        {dailyValues.map((value, i) => (
                          <TableCell key={i} className="text-right">
                            {value.offline.toFixed(2)}
                          </TableCell>
                        ))}
                        <TableCell className="text-right font-semibold">
                          {offlineTotal.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                  <TableRow className="bg-muted/50">
                    <TableCell className="sticky left-0 z-20 bg-muted/50 font-bold">Daily Total</TableCell>
                    <TableCell className="text-right font-bold">All</TableCell>
                    {dailyTotals.map((total, i) => (
                      <TableCell key={i} className="text-right font-bold">
                        {total.toFixed(2)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-bold">
                      {grandTotal.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}

export default SalesHistoryChart; 