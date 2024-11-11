"use client"

import React from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"


type Data = Record<any, any>[];
interface MemberJoinChartProps {
    data: Data;
    year: string ;
    title: string;
    subtitle: string;
}
const MemberJoinChart: React.FC<MemberJoinChartProps> = ({ data, year , title, subtitle}) => {

  if (!data || data.length === 0) {
    return <div>No data available</div>
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>{title} ({year})</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            count: {
              label: "New Members",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[120px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="month"
                stroke="#888888"
                fontSize={12}
                tickLine={true}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
              <ChartTooltip />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
export default MemberJoinChart;