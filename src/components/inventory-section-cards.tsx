import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { useState, useEffect } from "react"
import { apiRequest } from "@/lib/config"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function InventorySectionCards() {
  const [totalQuantity, setTotalQuantity] = useState<number | null>(null)
  const [lowStockCount, setLowStockCount] = useState<number | null>(null)
  const [outOfStockCount, setOutOfStockCount] = useState<number | null>(null)
  const [salesLast24Hours, setSalesLast24Hours] = useState<number | null>(null)
  const [purchasesLast24Hours, setPurchasesLast24Hours] = useState<number | null>(null)
  const [returnsLast24Hours, setReturnsLast24Hours] = useState<number | null>(null)
  const [turnoverRateLastMonth, setTurnoverRateLastMonth] = useState<number | null>(null)
  
  // Previous period data for percentage calculations
  const [salesPrevious24Hours, setSalesPrevious24Hours] = useState<number | null>(null)
  const [purchasesPrevious24Hours, setPurchasesPrevious24Hours] = useState<number | null>(null)
  const [returnsPrevious24Hours, setReturnsPrevious24Hours] = useState<number | null>(null)
  const [turnoverRatePreviousMonth, setTurnoverRatePreviousMonth] = useState<number | null>(null)
  
  const [isLoadingTotal, setIsLoadingTotal] = useState(true)
  const [isLoadingLowStock, setIsLoadingLowStock] = useState(true)
  const [isLoadingOutOfStock, setIsLoadingOutOfStock] = useState(true)
  const [isLoadingSales, setIsLoadingSales] = useState(true)
  const [isLoadingPurchases, setIsLoadingPurchases] = useState(true)
  const [isLoadingReturns, setIsLoadingReturns] = useState(true)
  const [isLoadingTurnover, setIsLoadingTurnover] = useState(true)

  // Helper function to calculate percentage change
  const calculatePercentageChange = (current: number | null, previous: number | null): string => {
    if (current === null || previous === null || previous === 0) {
      return '+0.0%'
    }
    const change = ((current - previous) / previous) * 100
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  // Helper function to get trending icon based on change
  const getTrendingIcon = (current: number | null, previous: number | null) => {
    if (current === null || previous === null || previous === 0) {
      return <IconTrendingUp />
    }
    const change = current - previous
    return change >= 0 ? <IconTrendingUp /> : <IconTrendingDown />
  }

  // Fetch total quantity from API
  useEffect(() => {
    const fetchTotalQuantity = async () => {
      try {
        const response = await apiRequest('api/inventory/reports/total-quantity', {
          method: 'GET',
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('Total quantity API response:', data)
          
          // Handle different possible response formats
          let quantity = 0
          if (typeof data === 'number') {
            quantity = data
          } else if (data && typeof data.totalQuantity === 'number') {
            quantity = data.totalQuantity
          } else if (data && typeof data.total === 'number') {
            quantity = data.total
          } else if (data && typeof data.count === 'number') {
            quantity = data.count
          } else {
            console.warn('Unexpected API response format:', data)
          }
          
          setTotalQuantity(quantity)
        } else {
          console.error('Failed to fetch total quantity')
        }
      } catch (error) {
        console.error('Error fetching total quantity:', error)
      } finally {
        setIsLoadingTotal(false)
      }
    }

    fetchTotalQuantity()
  }, [])

  // Fetch low stock count from API
  useEffect(() => {
    const fetchLowStockCount = async () => {
      try {
        const response = await apiRequest('api/inventory/reports/low-stock', {
          method: 'GET',
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('Low stock API response:', data)
          
          // Handle different possible response formats
          let lowStockItems: any[] = []
          let outOfStockItems: any[] = []
          
          if (Array.isArray(data)) {
            // Log the first item to see available properties
            if (data.length > 0) {
              console.log('First item properties:', Object.keys(data[0]))
              console.log('First item:', data[0])
            }
            
            // Try different quantity property names
            lowStockItems = data.filter((item: any) => {
              const qty = item.currentQuantity || 0
              return qty > 0
            })
            outOfStockItems = data.filter((item: any) => {
              const qty = item.currentQuantity || 0
              return qty === 0
            })
          } else if (data && Array.isArray(data.items)) {
            lowStockItems = data.items.filter((item: any) => {
              const qty = item.currentQuantity || 0
              return qty > 0
            })
            outOfStockItems = data.items.filter((item: any) => {
              const qty = item.currentQuantity || 0
              return qty === 0
            })
          } else if (data && Array.isArray(data.products)) {
            lowStockItems = data.products.filter((item: any) => {
              const qty = item.currentQuantity || 0
              return qty > 0
            })
            outOfStockItems = data.products.filter((item: any) => {
              const qty = item.currentQuantity || 0
              return qty === 0
            })
          } else if (typeof data === 'number') {
            // If it returns just a number, assume it's total low stock count
            setLowStockCount(data)
            setOutOfStockCount(0) // Can't determine out of stock from just a number
            setIsLoadingLowStock(false)
            setIsLoadingOutOfStock(false)
            return
          } else if (data && typeof data.lowStockCount === 'number') {
            setLowStockCount(data.lowStockCount)
            setOutOfStockCount(data.outOfStockCount || 0)
            setIsLoadingLowStock(false)
            setIsLoadingOutOfStock(false)
            return
          } else {
            console.warn('Unexpected low stock API response format:', data)
            setLowStockCount(0)
            setOutOfStockCount(0)
            setIsLoadingLowStock(false)
            setIsLoadingOutOfStock(false)
            return
          }
          
          console.log('Low stock items (qty > 0):', lowStockItems.length)
          console.log('Out of stock items (qty = 0):', outOfStockItems.length)
          
          setLowStockCount(lowStockItems.length)
          setOutOfStockCount(outOfStockItems.length)
        } else {
          console.error('Failed to fetch low stock count')
          setLowStockCount(0)
          setOutOfStockCount(0)
        }
      } catch (error) {
        console.error('Error fetching low stock count:', error)
        setLowStockCount(0)
        setOutOfStockCount(0)
      } finally {
        setIsLoadingLowStock(false)
        setIsLoadingOutOfStock(false)
      }
    }

    fetchLowStockCount()
  }, [])

  // Fetch sales in last 24 hours from API
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        // Calculate dates for last 24 hours
        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago
        
        // Calculate dates for previous 24 hours (48-24 hours ago)
        const prevEndDate = startDate
        const prevStartDate = new Date(prevEndDate.getTime() - 24 * 60 * 60 * 1000) // 48 hours ago
        
        // Format dates to ISO string format
        const startDateISO = startDate.toISOString()
        const endDateISO = endDate.toISOString()
        const prevStartDateISO = prevStartDate.toISOString()
        const prevEndDateISO = prevEndDate.toISOString()
        
        console.log('Fetching current sales from:', startDateISO, 'to:', endDateISO)
        console.log('Fetching previous sales from:', prevStartDateISO, 'to:', prevEndDateISO)
        
        // Fetch current period data
        const currentResponse = await apiRequest(`api/inventory/reports/summary?types=SALE&startDate=${encodeURIComponent(startDateISO)}&endDate=${encodeURIComponent(endDateISO)}`, {
          method: 'GET',
        })
        
        // Fetch previous period data
        const previousResponse = await apiRequest(`api/inventory/reports/summary?types=SALE&startDate=${encodeURIComponent(prevStartDateISO)}&endDate=${encodeURIComponent(prevEndDateISO)}`, {
          method: 'GET',
        })
        
        // Parse current period data
        if (currentResponse.ok) {
          const data = await currentResponse.json()
          console.log('Sales 24h API response:', data)
          
          let salesCount = 0
          if (typeof data === 'number') {
            salesCount = data
          } else if (data && typeof data.totalUnits === 'number') {
            salesCount = data.totalUnits
          } else if (data && typeof data.totalTransactions === 'number') {
            salesCount = data.totalTransactions
          } else if (data && typeof data.salesCount === 'number') {
            salesCount = data.salesCount
          } else if (data && typeof data.count === 'number') {
            salesCount = data.count
          } else if (data && typeof data.total === 'number') {
            salesCount = data.total
          } else if (Array.isArray(data)) {
            salesCount = data.length
          } else if (data && Array.isArray(data.transactions)) {
            salesCount = data.transactions.length
          } else if (data && Array.isArray(data.sales)) {
            salesCount = data.sales.length
          } else {
            console.warn('Unexpected sales API response format:', data)
          }
          
          setSalesLast24Hours(salesCount)
        } else {
          console.error('Failed to fetch current sales data')
        }
        
        // Parse previous period data
        if (previousResponse.ok) {
          const prevData = await previousResponse.json()
          console.log('Previous sales 24h API response:', prevData)
          
          let prevSalesCount = 0
          if (typeof prevData === 'number') {
            prevSalesCount = prevData
          } else if (prevData && typeof prevData.totalUnits === 'number') {
            prevSalesCount = prevData.totalUnits
          } else if (prevData && typeof prevData.totalTransactions === 'number') {
            prevSalesCount = prevData.totalTransactions
          } else if (prevData && typeof prevData.salesCount === 'number') {
            prevSalesCount = prevData.salesCount
          } else if (prevData && typeof prevData.count === 'number') {
            prevSalesCount = prevData.count
          } else if (prevData && typeof prevData.total === 'number') {
            prevSalesCount = prevData.total
          } else if (Array.isArray(prevData)) {
            prevSalesCount = prevData.length
          } else if (prevData && Array.isArray(prevData.transactions)) {
            prevSalesCount = prevData.transactions.length
          } else if (prevData && Array.isArray(prevData.sales)) {
            prevSalesCount = prevData.sales.length
          } else {
            console.warn('Unexpected previous sales API response format:', prevData)
          }
          
          setSalesPrevious24Hours(prevSalesCount)
        } else {
          console.error('Failed to fetch previous sales data')
        }
      } catch (error) {
        console.error('Error fetching sales data:', error)
      } finally {
        setIsLoadingSales(false)
      }
    }

    fetchSalesData()
  }, [])

  // Fetch purchases in last 24 hours from API
  useEffect(() => {
    const fetchPurchasesData = async () => {
      try {
        // Calculate dates for last 24 hours
        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago
        
        // Calculate dates for previous 24 hours (48-24 hours ago)
        const prevEndDate = startDate
        const prevStartDate = new Date(prevEndDate.getTime() - 24 * 60 * 60 * 1000) // 48 hours ago
        
        // Format dates to ISO string format
        const startDateISO = startDate.toISOString()
        const endDateISO = endDate.toISOString()
        const prevStartDateISO = prevStartDate.toISOString()
        const prevEndDateISO = prevEndDate.toISOString()
        
        console.log('Fetching current purchases from:', startDateISO, 'to:', endDateISO)
        console.log('Fetching previous purchases from:', prevStartDateISO, 'to:', prevEndDateISO)
        
        // Fetch current period data
        const currentResponse = await apiRequest(`api/inventory/reports/summary?types=PURCHASE&startDate=${encodeURIComponent(startDateISO)}&endDate=${encodeURIComponent(endDateISO)}`, {
          method: 'GET',
        })
        
        // Fetch previous period data
        const previousResponse = await apiRequest(`api/inventory/reports/summary?types=PURCHASE&startDate=${encodeURIComponent(prevStartDateISO)}&endDate=${encodeURIComponent(prevEndDateISO)}`, {
          method: 'GET',
        })
        
        // Parse current period data
        if (currentResponse.ok) {
          const data = await currentResponse.json()
          console.log('Purchases 24h API response:', data)
          
          let purchasesCount = 0
          if (typeof data === 'number') {
            purchasesCount = data
          } else if (data && typeof data.totalUnits === 'number') {
            purchasesCount = data.totalUnits
          } else if (data && typeof data.totalTransactions === 'number') {
            purchasesCount = data.totalTransactions
          } else if (data && typeof data.purchasesCount === 'number') {
            purchasesCount = data.purchasesCount
          } else if (data && typeof data.count === 'number') {
            purchasesCount = data.count
          } else if (data && typeof data.total === 'number') {
            purchasesCount = data.total
          } else if (Array.isArray(data)) {
            purchasesCount = data.length
          } else if (data && Array.isArray(data.transactions)) {
            purchasesCount = data.transactions.length
          } else if (data && Array.isArray(data.purchases)) {
            purchasesCount = data.purchases.length
          } else {
            console.warn('Unexpected purchases API response format:', data)
          }
          
          setPurchasesLast24Hours(purchasesCount)
        } else {
          console.error('Failed to fetch current purchases data')
        }
        
        // Parse previous period data
        if (previousResponse.ok) {
          const prevData = await previousResponse.json()
          console.log('Previous purchases 24h API response:', prevData)
          
          let prevPurchasesCount = 0
          if (typeof prevData === 'number') {
            prevPurchasesCount = prevData
          } else if (prevData && typeof prevData.totalUnits === 'number') {
            prevPurchasesCount = prevData.totalUnits
          } else if (prevData && typeof prevData.totalTransactions === 'number') {
            prevPurchasesCount = prevData.totalTransactions
          } else if (prevData && typeof prevData.purchasesCount === 'number') {
            prevPurchasesCount = prevData.purchasesCount
          } else if (prevData && typeof prevData.count === 'number') {
            prevPurchasesCount = prevData.count
          } else if (prevData && typeof prevData.total === 'number') {
            prevPurchasesCount = prevData.total
          } else if (Array.isArray(prevData)) {
            prevPurchasesCount = prevData.length
          } else if (prevData && Array.isArray(prevData.transactions)) {
            prevPurchasesCount = prevData.transactions.length
          } else if (prevData && Array.isArray(prevData.purchases)) {
            prevPurchasesCount = prevData.purchases.length
          } else {
            console.warn('Unexpected previous purchases API response format:', prevData)
          }
          
          setPurchasesPrevious24Hours(prevPurchasesCount)
        } else {
          console.error('Failed to fetch previous purchases data')
        }
      } catch (error) {
        console.error('Error fetching purchases data:', error)
      } finally {
        setIsLoadingPurchases(false)
      }
    }

    fetchPurchasesData()
  }, [])

  // Fetch returns in last 24 hours from API
  useEffect(() => {
    const fetchReturnsData = async () => {
      try {
        // Calculate dates for last 24 hours
        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago
        
        // Calculate dates for previous 24 hours (48-24 hours ago)
        const prevEndDate = startDate
        const prevStartDate = new Date(prevEndDate.getTime() - 24 * 60 * 60 * 1000) // 48 hours ago
        
        // Format dates to ISO string format
        const startDateISO = startDate.toISOString()
        const endDateISO = endDate.toISOString()
        const prevStartDateISO = prevStartDate.toISOString()
        const prevEndDateISO = prevEndDate.toISOString()
        
        console.log('Fetching current returns from:', startDateISO, 'to:', endDateISO)
        console.log('Fetching previous returns from:', prevStartDateISO, 'to:', prevEndDateISO)
        
        // Fetch current period data
        const currentResponse = await apiRequest(`api/inventory/reports/summary?types=RETURN&startDate=${encodeURIComponent(startDateISO)}&endDate=${encodeURIComponent(endDateISO)}`, {
          method: 'GET',
        })
        
        // Fetch previous period data
        const previousResponse = await apiRequest(`api/inventory/reports/summary?types=RETURN&startDate=${encodeURIComponent(prevStartDateISO)}&endDate=${encodeURIComponent(prevEndDateISO)}`, {
          method: 'GET',
        })
        
        // Parse current period data
        if (currentResponse.ok) {
          const data = await currentResponse.json()
          console.log('Returns 24h API response:', data)
          
          let returnsCount = 0
          if (typeof data === 'number') {
            returnsCount = data
          } else if (data && typeof data.totalUnits === 'number') {
            returnsCount = data.totalUnits
          } else if (data && typeof data.totalTransactions === 'number') {
            returnsCount = data.totalTransactions
          } else if (data && typeof data.returnsCount === 'number') {
            returnsCount = data.returnsCount
          } else if (data && typeof data.count === 'number') {
            returnsCount = data.count
          } else if (data && typeof data.total === 'number') {
            returnsCount = data.total
          } else if (Array.isArray(data)) {
            returnsCount = data.length
          } else if (data && Array.isArray(data.transactions)) {
            returnsCount = data.transactions.length
          } else if (data && Array.isArray(data.returns)) {
            returnsCount = data.returns.length
          } else {
            console.warn('Unexpected returns API response format:', data)
          }
          
          setReturnsLast24Hours(returnsCount)
        } else {
          console.error('Failed to fetch current returns data')
        }
        
        // Parse previous period data
        if (previousResponse.ok) {
          const prevData = await previousResponse.json()
          console.log('Previous returns 24h API response:', prevData)
          
          let prevReturnsCount = 0
          if (typeof prevData === 'number') {
            prevReturnsCount = prevData
          } else if (prevData && typeof prevData.totalUnits === 'number') {
            prevReturnsCount = prevData.totalUnits
          } else if (prevData && typeof prevData.totalTransactions === 'number') {
            prevReturnsCount = prevData.totalTransactions
          } else if (prevData && typeof prevData.returnsCount === 'number') {
            prevReturnsCount = prevData.returnsCount
          } else if (prevData && typeof prevData.count === 'number') {
            prevReturnsCount = prevData.count
          } else if (prevData && typeof prevData.total === 'number') {
            prevReturnsCount = prevData.total
          } else if (Array.isArray(prevData)) {
            prevReturnsCount = prevData.length
          } else if (prevData && Array.isArray(prevData.transactions)) {
            prevReturnsCount = prevData.transactions.length
          } else if (prevData && Array.isArray(prevData.returns)) {
            prevReturnsCount = prevData.returns.length
          } else {
            console.warn('Unexpected previous returns API response format:', prevData)
          }
          
          setReturnsPrevious24Hours(prevReturnsCount)
        } else {
          console.error('Failed to fetch previous returns data')
        }
      } catch (error) {
        console.error('Error fetching returns data:', error)
      } finally {
        setIsLoadingReturns(false)
      }
    }

    fetchReturnsData()
  }, [])

  // Fetch turnover rate for last month from API
  useEffect(() => {
    const fetchTurnoverData = async () => {
      try {
        // Calculate dates for last 30 days (1 month)
        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
        
        // Calculate dates for previous 30 days (60-30 days ago)
        const prevEndDate = startDate
        const prevStartDate = new Date(prevEndDate.getTime() - 30 * 24 * 60 * 60 * 1000) // 60 days ago
        
        // Format dates to ISO string format
        const startDateISO = startDate.toISOString()
        const endDateISO = endDate.toISOString()
        const prevStartDateISO = prevStartDate.toISOString()
        const prevEndDateISO = prevEndDate.toISOString()
        
        console.log('Fetching current turnover rate from:', startDateISO, 'to:', endDateISO)
        console.log('Fetching previous turnover rate from:', prevStartDateISO, 'to:', prevEndDateISO)
        
        // Fetch current period data
        const currentResponse = await apiRequest(`api/inventory/reports/turnover-total?startDate=${encodeURIComponent(startDateISO)}&endDate=${encodeURIComponent(endDateISO)}`, {
          method: 'GET',
        })
        
        // Fetch previous period data
        const previousResponse = await apiRequest(`api/inventory/reports/turnover-total?startDate=${encodeURIComponent(prevStartDateISO)}&endDate=${encodeURIComponent(prevEndDateISO)}`, {
          method: 'GET',
        })
        
        // Parse current period data
        if (currentResponse.ok) {
          const data = await currentResponse.json()
          console.log('Turnover rate API response:', data)
          
          let turnoverRate = 0
          if (typeof data === 'number') {
            turnoverRate = data
          } else if (data && typeof data.turnoverRate === 'number') {
            turnoverRate = data.turnoverRate
          } else if (data && typeof data.totalTurnover === 'number') {
            turnoverRate = data.totalTurnover
          } else if (data && typeof data.rate === 'number') {
            turnoverRate = data.rate
          } else if (data && typeof data.total === 'number') {
            turnoverRate = data.total
          } else if (data && typeof data.value === 'number') {
            turnoverRate = data.value
          } else {
            console.warn('Unexpected turnover API response format:', data)
          }
          
          setTurnoverRateLastMonth(turnoverRate)
        } else {
          console.error('Failed to fetch current turnover rate data')
        }
        
        // Parse previous period data
        if (previousResponse.ok) {
          const prevData = await previousResponse.json()
          console.log('Previous turnover rate API response:', prevData)
          
          let prevTurnoverRate = 0
          if (typeof prevData === 'number') {
            prevTurnoverRate = prevData
          } else if (prevData && typeof prevData.turnoverRate === 'number') {
            prevTurnoverRate = prevData.turnoverRate
          } else if (prevData && typeof prevData.totalTurnover === 'number') {
            prevTurnoverRate = prevData.totalTurnover
          } else if (prevData && typeof prevData.rate === 'number') {
            prevTurnoverRate = prevData.rate
          } else if (prevData && typeof prevData.total === 'number') {
            prevTurnoverRate = prevData.total
          } else if (prevData && typeof prevData.value === 'number') {
            prevTurnoverRate = prevData.value
          } else {
            console.warn('Unexpected previous turnover API response format:', prevData)
          }
          
          setTurnoverRatePreviousMonth(prevTurnoverRate)
        } else {
          console.error('Failed to fetch previous turnover rate data')
        }
      } catch (error) {
        console.error('Error fetching turnover rate data:', error)
      } finally {
        setIsLoadingTurnover(false)
      }
    }

    fetchTurnoverData()
  }, [])
  return (
    <div className="space-y-6">
      {/* Top row - 3 main inventory cards */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Inventory</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoadingTotal ? (
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-32 rounded"></div>
              ) : (
                `${totalQuantity?.toLocaleString() || 0} Items`
              )}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Total stock count across all warehouses <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Real-time inventory levels
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Low Stock Items</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoadingLowStock ? (
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-32 rounded"></div>
              ) : (
                `${lowStockCount?.toLocaleString() || 0} Items`
              )}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Items requiring attention <IconTrendingDown className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Items below minimum stock levels
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Out of Stock Items</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoadingOutOfStock ? (
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-32 rounded"></div>
              ) : (
                `${outOfStockCount?.toLocaleString() || 0} Items`
              )}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Items completely out of stock <IconTrendingDown className="size-4" />
            </div>
            <div className="text-muted-foreground">Items with zero quantity</div>
          </CardFooter>
        </Card>
      </div>

      {/* Bottom row - 4 placeholder cards */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Sales in Last 24 Hours</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoadingSales ? (
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-32 rounded"></div>
              ) : (
                `${salesLast24Hours?.toLocaleString() || 0} Sales`
              )}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {getTrendingIcon(salesLast24Hours, salesPrevious24Hours)}
                {calculatePercentageChange(salesLast24Hours, salesPrevious24Hours)}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Total sales transactions <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">Sales activity in the last 24 hours</div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Purchases in Last 24 Hours</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoadingPurchases ? (
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-32 rounded"></div>
              ) : (
                `${purchasesLast24Hours?.toLocaleString() || 0} Units`
              )}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {getTrendingIcon(purchasesLast24Hours, purchasesPrevious24Hours)}
                {calculatePercentageChange(purchasesLast24Hours, purchasesPrevious24Hours)}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Total purchase transactions <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">Inventory restocking activity</div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Returns in Last 24 Hours</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoadingReturns ? (
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-32 rounded"></div>
              ) : (
                `${returnsLast24Hours?.toLocaleString() || 0} Units`
              )}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {getTrendingIcon(returnsLast24Hours, returnsPrevious24Hours)}
                {calculatePercentageChange(returnsLast24Hours, returnsPrevious24Hours)}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Total return transactions <IconTrendingDown className="size-4" />
            </div>
            <div className="text-muted-foreground">Customer returns and exchanges</div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Turnover Rate (Last Month)</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoadingTurnover ? (
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-32 rounded"></div>
              ) : (
                `${((turnoverRateLastMonth || 0) * 100).toFixed(1)}%`
              )}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {getTrendingIcon(turnoverRateLastMonth, turnoverRatePreviousMonth)}
                {calculatePercentageChange(turnoverRateLastMonth, turnoverRatePreviousMonth)}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Inventory turnover efficiency <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">How often inventory is sold and replaced</div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
