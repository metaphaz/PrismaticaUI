import { IconTrendingDown, IconTrendingUp, IconBuilding, IconPackage, IconArrowRight } from "@tabler/icons-react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  status: 'active' | 'inactive' | 'maintenance'
  stockDetails?: {
    totalValue: number
    lowStockItems: number
    outOfStockItems: number
    totalItems: number
    totalQuantity: number
  } | null
}

// Function to fetch all stock items for a warehouse (handling pagination)
async function fetchAllStockItems(warehouseId: string) {
  const allItems = []
  let currentPage = 0
  let totalPages = 1

  while (currentPage < totalPages) {
    const response = await fetch(`https://ae8aa5699e02.ngrok-free.app/api/inventory/reports/stock-levels?warehouseId=${warehouseId}&page=${currentPage}&size=100`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    })

    if (!response.ok) {
      break
    }

    const data = await response.json()
    allItems.push(...data.content)
    totalPages = data.totalPages
    currentPage++
  }

  return allItems
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
    // Fetch all stock items for this warehouse
    const stockItems = await fetchAllStockItems(warehouseId)
    
    if (stockItems.length === 0) {
      return {
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalItems: 0,
        totalQuantity: 0
      }
    }
    
    // Calculate aggregated stock statistics
    const totalValue = stockItems.reduce((sum, item) => sum + (item.totalStockValue || 0), 0)
    const totalQuantity = stockItems.reduce((sum, item) => sum + (item.currentQuantity || 0), 0)
    const totalItems = stockItems.length
    const lowStockItems = stockItems.filter(item => item.currentQuantity > 0 && item.currentQuantity <= item.reorderLevel).length
    const outOfStockItems = stockItems.filter(item => item.currentQuantity === 0).length

    return {
      totalValue,
      lowStockItems,
      outOfStockItems,
      totalItems,
      totalQuantity,
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
    
    // Check if data is an array, if not, try to extract array from response
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
      capacity: 50000, // Static capacity for all branches
      currentStock: branch.currentStock || branch.totalStock || 0,
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
  const navigate = useNavigate()

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

  // Function to navigate to branch details page
  const handleBranchClick = (branchId: string) => {
    navigate(`/inventory/branches/${branchId}`)
  }

  // Calculate utilization percentage
  const calculateUtilization = (currentStock: number, capacity: number): number => {
    if (capacity === 0) return 0
    return Math.round((currentStock / capacity) * 100)
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
              </div>
              <CardTitle className="text-xl font-semibold @[250px]/card:text-2xl">
                {branch.name}
              </CardTitle>
              <CardAction>
                <div className="flex items-center justify-between w-full">
                  <Badge variant={trend.variant}>
                    {trend.icon}
                    {utilization}% utilized
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleBranchClick(branch.id)}
                    className="h-8 w-8 p-0"
                  >
                    <IconArrowRight className="h-4 w-4" />
                  </Button>
                </div>
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
