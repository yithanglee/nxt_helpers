"use client"

import React, { useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"

interface LoanData {
  month: string
  count: number
}

interface CategoryData {
  category: string
  code: string
  data: LoanData[]
}



const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

const processData = (data: CategoryData[]) => {
  return months.map(month => {
    const monthData: { [key: string]: number | string } = { month }
    data.forEach(category => {
      const monthCount = category.data.find(d => d.month === month)?.count || 0
      monthData[category.code] = monthCount
    })
    return monthData
  })
}




interface LoanHistoryChartProps {
    data: CategoryData[];
    year: string ;
    title: string;
    subtitle: string;
}

const LoanHistoryChart: React.FC<LoanHistoryChartProps> = ({ data, year, title, subtitle }) => {
  const chartData = processData(data)
  const [activeCategories, setActiveCategories] = useState<string[]>(data.map(c => c.code))

  const handleCategoryToggle = (code: string) => {
    setActiveCategories(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  const filteredChartData = chartData.map(monthData => {
    const filteredData: { [key: string]: number | string } = { month: monthData.month }
    activeCategories.forEach(category => {
      filteredData[category] = monthData[category] || 0
    })
    return filteredData
  })

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>{title} ({year})</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full lg:w-1/4">
            <h3 className="text-lg font-semibold mb-2">Categories</h3>
            <ScrollArea className="h-[480px]">
              {data.map(category => (
                <div key={category.code} className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id={category.code}
                    checked={activeCategories.includes(category.code)}
                    onCheckedChange={() => handleCategoryToggle(category.code)}
                  />
                  <label
                    htmlFor={category.code}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {category.category} ({category.code})
                  </label>
                </div>
              ))}
            </ScrollArea>
          </div>
          <div className="w-full lg:w-3/4">
            <ChartContainer className="h-[480px] w-full" config={{
              count: {
                label: "Loan by categories",
                color: "hsl(var(--chart-1))",
              },
            }}  >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredChartData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {activeCategories.map((category, index) => (
                    <Bar
                      key={category}
                      dataKey={category}
                      stackId="a"
                      fill={`hsl(${index * 15}, 70%, 50%)`}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default LoanHistoryChart;