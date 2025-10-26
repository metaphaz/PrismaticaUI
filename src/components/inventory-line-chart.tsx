"use client"

import { Line, LineChart, XAxis, YAxis } from "recharts"
import { useState, useEffect } from "react"
import { apiRequest } from "@/lib/config"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"

export const description = "A turnover rate over time line chart"

const chartConfig = {
  sales: {
    label: "Turnover Rate",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

interface SalesDataPoint {
  date: string
  sales: number
  week: string
}

export function InventoryLineChart() {
  const [chartData, setChartData] = useState<SalesDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        // Calculate dates for last year
        const endDate = new Date()
        const startDate = new Date()
        startDate.setFullYear(endDate.getFullYear() - 1)
        
        // Format dates to ISO string format
        const startDateISO = startDate.toISOString()
        const endDateISO = endDate.toISOString()
        
        const response = await apiRequest(`api/inventory/reports/turnover-over-time?interval=WEEK&startDate=${encodeURIComponent(startDateISO)}&endDate=${encodeURIComponent(endDateISO)}`, {
          method: 'GET',
        })
        
        if (response.ok) {
          const data = await response.json()
          
          // Handle different possible response formats
          let salesData: SalesDataPoint[] = []
          
          if (Array.isArray(data)) {
            salesData = data.map((item: any, index: number) => {
              // Handle different date formats and extract turnover rate value
              let sales = 0
              let originalDate = ''
              let week = ''
              
              // Extract the rate value and convert to percentage
              if (typeof item.rate === 'number') {
                sales = item.rate * 100 // Convert decimal to percentage
              } else if (typeof item.turnoverRate === 'number') {
                sales = item.turnoverRate * 100 // Convert decimal to percentage
              } else if (typeof item.percentage === 'number') {
                sales = item.percentage // Already a percentage
              } else if (typeof item.value === 'number') {
                sales = item.value * 100 // Convert decimal to percentage
              } else {
                sales = 0 // Fallback
              }
              
              // Extract and format the date
              if (item.date) {
                originalDate = item.date
                try {
                  const dateObj = new Date(item.date)
                  week = dateObj.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })
                } catch (error) {
                  console.error('Date parsing error:', error)
                  week = `Point ${index + 1}`
                  originalDate = `Point ${index + 1}`
                }
              } else {
                week = `Point ${index + 1}`
                originalDate = `Point ${index + 1}`
              }
              
              return {
                date: originalDate, // Keep the original ISO date string
                sales,
                week // Use formatted date for display
              }
            })
          } else if (data && typeof data === 'object') {
            // If it's an object, try to extract an array
            if (data.data && Array.isArray(data.data)) {
              salesData = data.data.map((item: any, index: number) => ({
                date: item.date || `Week ${index + 1}`,
                sales: (item.turnoverRate || item.rate || item.percentage || item.value || item.sales || item.totalSales || item.count || 0) * (item.percentage ? 1 : 100),
                week: item.week || `Week ${index + 1}`
              }))
            } else if (data.salesData && Array.isArray(data.salesData)) {
              salesData = data.salesData.map((item: any, index: number) => ({
                date: item.date || `Week ${index + 1}`,
                sales: (item.turnoverRate || item.rate || item.percentage || item.value || item.sales || item.totalSales || item.count || 0) * (item.percentage ? 1 : 100),
                week: item.week || `Week ${index + 1}`
              }))
            }
          }
          
          setChartData(salesData)
        } else {
          setError('Failed to fetch turnover data')
          console.error('Failed to fetch turnover data')
        }
      } catch (error) {
        setError('Error fetching turnover data')
        console.error('Error fetching turnover data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSalesData()
  }, [])

  // Calculate Y-axis domain to make variations more visible
  const getYAxisDomain = () => {
    if (chartData.length === 0) return [0, 10]
    
    const values = chartData.map(d => d.sales)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min
    
    // Always use a very tight domain to emphasize variations
    if (range < 2) {
      const center = (min + max) / 2
      const domain = [Math.max(0, center - 2), center + 2]
      return domain
    } else if (range < 10) {
      const domain = [Math.max(0, min - 1), max + 1]
      return domain
    }
    
    // For larger ranges, use minimal padding
    const domain = [Math.max(0, min - range * 0.05), max + range * 0.05]
    return domain
  }

  return (
    <Card className="h-auto">
      <CardHeader className="pb-1 pt-4">
        <CardTitle className="text-base">Turnover Rate Over Time</CardTitle>
        <CardDescription className="text-xs">Last year weekly turnover rates</CardDescription>
      </CardHeader>
      <CardContent className="pb-4 pt-0">
        {isLoading ? (
          <div className="h-[120px] w-full">
            <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-[120px] w-full rounded"></div>
          </div>
        ) : error ? (
          <div className="h-[120px] w-full flex items-center justify-center text-muted-foreground text-xs">
            <p>{error}</p>
          </div>
        ) : (
          <div className="h-[120px] w-full overflow-hidden">
            <ChartContainer config={chartConfig} className="h-[120px] w-full max-h-[120px]">
              <LineChart
                data={chartData}
                width={800}
                height={120}
                margin={{ left: 0, right: 0, top: 10, bottom: 10 }}
              >
                <XAxis 
                  dataKey="week"
                  hide
                />
                <YAxis 
                  hide
                  domain={getYAxisDomain()}
                  type="number"
                />
                <ChartTooltip
                  cursor={{ stroke: "var(--color-sales)", strokeWidth: 1, strokeDasharray: "3 3" }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      // Find the data point using the week label to get the actual full date
                      const dataPoint = chartData.find(d => d.week === label)
                      const originalDate = dataPoint?.date || ''
                      
                      // Format the full date nicely if it's a valid date string
                      let formattedDate = label // fallback to label
                      let weekOfYear = ''
                      
                      try {
                        if (originalDate && originalDate !== label) {
                          const date = new Date(originalDate)
                          formattedDate = date.toLocaleDateString('en-US', { 
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })
                          
                          // Calculate week of year
                          const startOfYear = new Date(date.getFullYear(), 0, 1)
                          const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000
                          weekOfYear = `Week ${Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7)}`
                        }
                      } catch (error) {
                        console.error('Tooltip date formatting error:', error)
                        formattedDate = label
                      }
                      
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-2 text-xs">
                          <p className="font-medium text-xs">{weekOfYear || formattedDate}</p>
                          <p className="text-muted-foreground text-xs">
                            {formattedDate}
                          </p>
                          <p className="text-muted-foreground">
                            Turnover Rate: <span className="font-medium text-foreground">{Number(payload[0].value || 0).toFixed(2)}%</span>
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line
                  dataKey="sales"
                  type="monotone"
                  stroke="var(--color-sales)"
                  strokeWidth={3}
                  dot={{ r: 0, strokeWidth: 0 }}
                  activeDot={{ r: 3, strokeWidth: 0 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
