import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { IconBuilding, IconPackage, IconTrendingUp, IconTrendingDown, IconArrowLeft, IconUsers, IconMapPin, IconCalendar } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface BranchDetails {
  id: string
  name: string
  location: string
  address?: string
  capacity: number
  currentStock: number
  status: 'active' | 'inactive' | 'maintenance'
  createdAt?: string
  manager?: string
  employees?: number
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

// Function to fetch branch details from API
async function getBranchDetails(branchId: string): Promise<BranchDetails | null> {
  try {
    const response = await fetch(`https://ae8aa5699e02.ngrok-free.app/api/warehouses/${branchId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    })
    
    if (!response.ok) {
      console.warn(`Failed to fetch branch details for ${branchId}`)
      return null
    }
    
    const branch = await response.json()
    
    // Fetch all stock items for this warehouse
    const stockItems = await fetchAllStockItems(branchId)
    
    let stockDetails = null
    if (stockItems.length > 0) {
      // Calculate aggregated stock statistics
      const totalValue = stockItems.reduce((sum, item) => sum + (item.totalStockValue || 0), 0)
      const totalQuantity = stockItems.reduce((sum, item) => sum + (item.currentQuantity || 0), 0)
      const totalItems = stockItems.length
      const lowStockItems = stockItems.filter(item => item.currentQuantity > 0 && item.currentQuantity <= item.reorderLevel).length
      const outOfStockItems = stockItems.filter(item => item.currentQuantity === 0).length

      stockDetails = {
        totalValue,
        lowStockItems,
        outOfStockItems,
        totalItems,
        totalQuantity,
      }
    }
    
    // Transform API data to match BranchDetails interface
    return {
      id: branch.id || branchId,
      name: branch.name || 'Unknown Branch',
      location: branch.location || 'Unknown Location',
      address: branch.address,
      capacity: 50000, // Static capacity
      currentStock: stockDetails?.totalQuantity || 0,
      status: 'active', // Default status
      createdAt: branch.createdAt,
      manager: branch.manager,
      employees: branch.employees,
      stockDetails
    }
  } catch (error) {
    console.error('Error fetching branch details:', error)
    return null
  }
}

export default function BranchDetailsIndex() {
  const { branchId } = useParams<{ branchId: string }>()
  const navigate = useNavigate()
  const [branch, setBranch] = useState<BranchDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!branchId) {
      navigate('/inventory/branches')
      return
    }

    const fetchBranchDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getBranchDetails(branchId)
        if (result) {
          setBranch(result)
        } else {
          setError('Branch not found')
        }
      } catch (err) {
        setError('Failed to load branch details')
        console.error('Error loading branch details:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBranchDetails()
  }, [branchId, navigate])

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
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading branch details...</div>
      </div>
    )
  }

  if (error || !branch) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-lg text-red-500">{error || 'Branch not found'}</div>
        <Button onClick={() => navigate('/inventory/branches')}>
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Back to Branches
        </Button>
      </div>
    )
  }

  const currentStockCount = branch.stockDetails?.totalQuantity ?? branch.currentStock
  const utilization = calculateUtilization(currentStockCount, branch.capacity)
  const trend = getUtilizationTrend(utilization)

  return (
        <div className="flex h-screen p-6 gap-6">
      {/* Left Side - Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 pr-4">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/inventory/branches')}
              className="h-8 w-8"
            >
              <IconArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center justify-between w-full">
              <Button
                variant="ghost"
                onClick={() => navigate('/inventory/branches')}
                className="p-0 h-auto text-left"
              >
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{branch.name}</h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  <IconMapPin className="h-4 w-4" />
                  {branch.location}
                </p>
              </div>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Utilization Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilization</CardTitle>
                <IconBuilding className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{utilization}%</div>
                <Badge variant={trend.variant} className="mt-2 text-xs">
                  {trend.icon}
                  {trend.text}
                </Badge>
              </CardContent>
            </Card>

            {/* Stock Count Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Stock</CardTitle>
                <IconPackage className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentStockCount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  of {branch.capacity.toLocaleString()} capacity
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information */}
          <div className="grid grid-cols-1 gap-6">
            {/* Branch Information */}
            <Card>
              <CardHeader>
                <CardTitle>Branch Information</CardTitle>
                <CardDescription>
                  General information about this branch
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Branch ID</p>
                    <p className="text-sm">{branch.id}</p>
                  </div>
                </div>
                
                {branch.address && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Full Address</p>
                    <p className="text-sm">{branch.address}</p>
                  </div>
                )}
                
                {branch.manager && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Manager</p>
                    <p className="text-sm flex items-center gap-2">
                      <IconUsers className="h-4 w-4" />
                      {branch.manager}
                    </p>
                  </div>
                )}
                
                {branch.employees && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Employees</p>
                    <p className="text-sm">{branch.employees} staff members</p>
                  </div>
                )}
                
                {branch.createdAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="text-sm flex items-center gap-2">
                      <IconCalendar className="h-4 w-4" />
                      {new Date(branch.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stock Details */}
            {branch.stockDetails && (
              <Card>
                <CardHeader>
                  <CardTitle>Stock Details</CardTitle>
                  <CardDescription>
                    Detailed stock information and alerts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Stock Value</span>
                      <span className="text-sm font-mono">
                        ${branch.stockDetails.totalValue.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Items</span>
                      <span className="text-sm">{branch.stockDetails.totalItems}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Quantity</span>
                      <span className="text-sm">{branch.stockDetails.totalQuantity.toLocaleString()}</span>
                    </div>
                    
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-orange-600">Low Stock Items</span>
                        <Badge variant="secondary" className="text-orange-600">
                          {branch.stockDetails.lowStockItems}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-red-600">Out of Stock</span>
                        <Badge variant="destructive">
                          {branch.stockDetails.outOfStockItems}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Big Card */}
      <div className="w-1/2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>
              This section is ready for additional content
            </CardDescription>
          </CardHeader>
          <CardContent className="h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-lg">Content coming soon</p>
              <p className="text-sm">This space is reserved for additional branch analytics and tools</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
