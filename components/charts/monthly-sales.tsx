"use client"

import React, { useState, useEffect } from 'react'
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface MonthlySalesData {
  outlet: string | null
  device: string
  organization: string
  amount: string
  transactions: number
  year: string
  jan: string
  feb: string
  mar: string
  apr: string
  may: string
  jun: string
  jul: string
  aug: string
  sep: string
  oct: string
  nov: string
  dec: string
  [key: string]: string | number | null
}

const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

const processData = (data: MonthlySalesData[]) => {
  return months.map(month => {
    const monthData: { [key: string]: number | string } = { month: month.toUpperCase() }
    
    // Group by outlet and sum the amounts for each month
    const outlets = new Set(data.map(d => d.outlet || 'Unassigned'))
    outlets.forEach(outlet => {
      const amount = data
        .filter(d => (d.outlet || 'Unassigned') === outlet)
        .reduce((sum, d) => {
          const monthValue = d[month as keyof MonthlySalesData]
          return sum + Number(monthValue || 0)
        }, 0)
      monthData[outlet] = amount
    })
    
    return monthData
  })
}

interface MonthlySalesChartProps {
  data: MonthlySalesData[]
  year: string
  title?: string
  subtitle?: string
}

const MonthlySalesChart: React.FC<MonthlySalesChartProps> = ({ 
  data = [],
  year,
  title = "Monthly Sales by Outlet",
  subtitle = "View monthly sales trends across all outlets"
}) => {
  console.log('data', data)
  // Filter data for the selected year
  const yearData = data.filter(d => d.year === year)
  const chartData = processData(yearData)
  
  // Get unique outlets
  const outlets = Array.from(new Set(yearData.map(d => d.outlet || 'Unassigned')))
  const [activeOutlets, setActiveOutlets] = useState<string[]>([])

  // Initialize active outlets
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

  // Create chart config
  const chartConfig = activeOutlets.reduce((acc, outlet, index) => {
    acc[outlet] = {
      color: `hsl(${index * 15}, 70%, 50%)`,
      label: outlet
    }
    return acc
  }, {} as Record<string, { color: string; label: string }>)

  // Calculate totals for the summary table
  const outletTotals = activeOutlets.map(outlet => {
    const monthlyValues = months.map(month => 
      chartData.find(d => d.month === month.toUpperCase())?.[outlet] as number || 0
    )
    
    const total = monthlyValues.reduce((sum, val) => sum + val, 0)
    
    return {
      outlet,
      monthlyValues,
      total
    }
  })

  const monthlyTotals = months.map((_, index) => 
    activeOutlets.reduce((sum, outlet) => 
      sum + (outletTotals.find(o => o.outlet === outlet)?.monthlyValues[index] || 0), 0
    )
  )

  const grandTotal = outletTotals.reduce((sum, { total }) => sum + total, 0)

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>{title} ({year})</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full lg:w-1/4">
            <h3 className="text-lg font-semibold mb-2">Outlets</h3>
            <ScrollArea className="h-[480px]">
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
                <LineChart data={chartData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {activeOutlets.map((outlet, index) => (
                    <Line
                      key={outlet}
                      type="monotone"
                      dataKey={outlet}
                      stroke={`hsl(${index * 15}, 70%, 50%)`}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>

        <div className="w-full">
          <h3 className="text-lg font-semibold mb-4">Monthly Sales Summary</h3>
          <ScrollArea className="w-full">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 z-20 bg-background">Outlet</TableHead>
                    {months.map(month => (
                      <TableHead key={month} className="text-right min-w-[100px]">
                        {month.toUpperCase()}
                      </TableHead>
                    ))}
                    <TableHead className="text-right min-w-[100px]">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outletTotals.map(({ outlet, monthlyValues, total }) => (
                    <TableRow key={outlet}>
                      <TableCell className="sticky left-0 z-20 bg-background font-medium">
                        {outlet}
                      </TableCell>
                      {monthlyValues.map((value, i) => (
                        <TableCell key={i} className="text-right">
                          {value.toFixed(2)}
                        </TableCell>
                      ))}
                      <TableCell className="text-right font-semibold">
                        {total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50">
                    <TableCell className="sticky left-0 z-20 bg-muted/50 font-bold">
                      Monthly Total
                    </TableCell>
                    {monthlyTotals.map((total, i) => (
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
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}

export default MonthlySalesChart; 