import { IconTrendingDown, IconTrendingUp, IconBuilding, IconPackage, IconTruck } from "@tabler/icons-react"
import { useState, useEffect } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Branch {
  id: string
  name: string
  location: string
  capacity: number
  currentStock: number
  activeProducts: number
  recentTransactions: number
  status: 'active' | 'inactive' | 'maintenance'
  stockDetails?: {
    totalValue: number
    lowStockItems: number
    outOfStockItems: number
    totalItems: number
    totalQuantity: number
  } | null
}

// Function to fetch stock details for a specific branch
async function getBranchStockDetails(warehouseId: string): Promise<{
  totalValue: number
  lowStockItems: number
  outOfStockItems: number
  totalItems: number
  totalQuantity: number
} | null> {
  try {
    const response = await fetch(`https://ae8aa5699e02.ngrok-free.app/api/inventory/reports/stock-levels?warehouseId=${warehouseId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    })
    
    if (!response.ok) {
      console.warn(`Failed to fetch stock details for warehouse ${warehouseId}`)
      return null
    }
    
    const data = await response.json()
    console.log(`Stock details for warehouse ${warehouseId}:`, data)
    
    // Handle different possible response formats
    let stockItems = []
    if (Array.isArray(data)) {
      stockItems = data
    } else if (data && Array.isArray(data.content)) {
      stockItems = data.content
    } else if (data && Array.isArray(data.data)) {
      stockItems = data.data
    } else if (data && Array.isArray(data.stockItems)) {
      stockItems = data.stockItems
    } else {
      console.warn(`Stock API response for warehouse ${warehouseId} is not in expected format:`, data)
      return null
    }
    
    // Calculate stock metrics
    const totalItems = stockItems.length
    
    // Use the totalStockValue from API if available, otherwise calculate
    const totalValue = stockItems.reduce((sum: number, item: any) => {
      if (item.totalStockValue) {
        return sum + item.totalStockValue
      }
      const quantity = item.currentQuantity || item.quantity || item.currentStock || 0
      const price = item.salePrice || item.unitPrice || item.price || 0
      return sum + (quantity * price)
    }, 0)
    
    const lowStockItems = stockItems.filter((item: any) => {
      const quantity = item.currentQuantity || item.quantity || item.currentStock || 0
      const minStock = item.reorderLevel || item.minStock || item.minimumStock || 0
      return quantity > 0 && quantity <= minStock
    }).length
    
    const outOfStockItems = stockItems.filter((item: any) => {
      const quantity = item.currentQuantity || item.quantity || item.currentStock || 0
      return quantity === 0
    }).length
    
    console.log(`Warehouse ${warehouseId} stock summary:`, {
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      sampleItem: stockItems[0] // Log first item for debugging
    })
    
    return {
      totalValue,
      lowStockItems,
      outOfStockItems,
      totalItems,
      totalQuantity: stockItems.reduce((sum: number, item: any) => {
        return sum + (item.currentQuantity || item.quantity || item.currentStock || 0)
      }, 0)
    }
  } catch (error) {
    console.error(`Error fetching stock details for warehouse ${warehouseId}:`, error)
    return null
  }
}

// Function to fetch branches data from API
async function getBranchesData(): Promise<Branch[]> {
  try {
    const response = await fetch(`https://ae8aa5699e02.ngrok-free.app/api/warehouses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('Branches API Response:', data)
    
    // Handle the API response structure
    let branches = []
    if (Array.isArray(data)) {
      branches = data
    } else if (data && Array.isArray(data.content)) {
      branches = data.content
    } else if (data && Array.isArray(data.data)) {
      branches = data.data
    } else if (data && Array.isArray(data.warehouses)) {
      branches = data.warehouses
    } else {
      console.warn('Branches API response is not in expected format:', data)
      branches = []
    }
    
    // Transform API data to match Branch interface
    const transformedBranches: Branch[] = branches.map((branch: any) => ({
      id: branch.id || branch.warehouseId || `branch_${Date.now()}_${Math.random()}`,
      name: branch.name || branch.warehouseName || 'Unknown Branch',
      location: branch.location || branch.address || 'Unknown Location',
      capacity: 10000, // Static capacity for all branches
      currentStock: branch.currentStock || branch.totalStock || 0,
      activeProducts: branch.activeProducts || branch.productCount || 0,
      recentTransactions: branch.recentTransactions || branch.transactionCount || 0,
      status: branch.status || (branch.isActive ? 'active' : 'inactive') || 'active'
    }))
    
    // Fetch stock details for each branch
    const branchesWithStockDetails = await Promise.all(
      transformedBranches.map(async (branch) => {
        const stockDetails = await getBranchStockDetails(branch.id)
        return {
          ...branch,
          stockDetails
        }
      })
    )
    
    return branchesWithStockDetails
  } catch (error) {
    console.error('Error fetching branches data:', error)
    return []
  }
}

export function BranchesSectionCards() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch branches data
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getBranchesData()
      setBranches(result)
    } catch (err) {
      setError('Failed to load branches data')
      console.error('Error loading branches data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Calculate utilization percentage
  const calculateUtilization = (currentStock: number, capacity: number): number => {
    if (capacity === 0) return 0
    return Math.round((currentStock / capacity) * 100)
  }

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'maintenance':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // Get utilization trend icon and variant
  const getUtilizationTrend = (utilization: number) => {
    if (utilization > 85) {
      return { icon: <IconTrendingUp />, variant: 'destructive' as const, text: 'High utilization' }
    } else if (utilization > 70) {
      return { icon: <IconTrendingUp />, variant: 'default' as const, text: 'Good utilization' }
    } else {
      return { icon: <IconTrendingDown />, variant: 'secondary' as const, text: 'Low utilization' }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-lg">Loading branches data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-lg text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {branches.map((branch) => {
        // Use stock details for more accurate calculation when available
        const currentStockCount = branch.stockDetails?.totalQuantity ?? branch.currentStock
        const utilization = calculateUtilization(currentStockCount, branch.capacity)
        const trend = getUtilizationTrend(utilization)
        
        return (
          <Card key={branch.id} className="@container/card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription className="flex items-center gap-2">
                  <IconBuilding className="size-4" />
                  {branch.location}
                </CardDescription>
                <Badge variant={getStatusVariant(branch.status)}>
                  {branch.status}
                </Badge>
              </div>
              <CardTitle className="text-xl font-semibold @[250px]/card:text-2xl">
                {branch.name}
              </CardTitle>
              <CardAction>
                <Badge variant={trend.variant}>
                  {trend.icon}
                  {utilization}% utilized
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="w-full space-y-1">
                <div className="line-clamp-1 flex justify-between items-center">
                  <span className="flex items-center gap-1 font-medium">
                    <IconPackage className="size-4" />
                    Current Stock
                  </span>
                  <span className="font-medium">{branch.stockDetails?.totalQuantity?.toLocaleString() ?? branch.currentStock.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Capacity</span>
                  <span>{branch.capacity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Active Products</span>
                  <span>{branch.stockDetails?.totalItems ?? branch.activeProducts}</span>
                </div>
                {branch.stockDetails && (
                  <>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Stock Value</span>
                      <span>${branch.stockDetails.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-orange-600">
                      <span>Low Stock Items</span>
                      <span>{branch.stockDetails.lowStockItems}</span>
                    </div>
                    <div className="flex justify-between items-center text-red-600">
                      <span>Out of Stock</span>
                      <span>{branch.stockDetails.outOfStockItems}</span>
                    </div>
                  </>
                )}
                <div className="line-clamp-1 flex justify-between items-center">
                  <span className="flex items-center gap-1 font-medium">
                    <IconTruck className="size-4" />
                    Recent Activity
                  </span>
                  <span className="font-medium">{branch.recentTransactions}</span>
                </div>
              </div>
              <div className="text-muted-foreground text-xs pt-1">
                {trend.text}
              </div>
            </CardFooter>
          </Card>
        )
      })}
      
      {branches.length === 0 && !loading && (
        <div className="col-span-full text-center py-12">
          <IconBuilding className="size-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No branches found</h3>
          <p className="text-muted-foreground">No branch data is available at the moment.</p>
        </div>
      )}
    </div>
  )
}
