import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { IconBuilding, IconPackage, IconTrendingUp, IconTrendingDown, IconArrowLeft, IconUsers, IconMapPin, IconCalendar } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { apiRequest } from "@/lib/config"

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

interface PurchaseOrder {
  sku: string
  productName: string
  quantityToOrder: number
  priority: string
  aiComment: string
}

interface ProductDetails {
  productId: string
  purchaseCost: number
}

// Function to fetch AI insights for a specific branch
async function getAIInsights(branchId: string): Promise<string | null> {
  try {
    const response = await apiRequest(`api/ai/analysis/store/${branchId}/report`, {
      method: 'GET',
    })
    
    if (!response.ok) {
      console.warn(`Failed to fetch AI insights for branch ${branchId}`)
      return null
    }
    
    // Get the response as text, not JSON
    const data = await response.text()
    return data || 'No insights available'
  } catch (error) {
    console.error('Error fetching AI insights:', error)
    return null
  }
}

// Function to fetch purchase orders for a specific branch
async function getPurchaseOrders(branchId: string): Promise<PurchaseOrder[]> {
  try {
    const response = await apiRequest(`api/ai/analysis/store/${branchId}/json`, {
      method: 'GET',
    })
    
    if (!response.ok) {
      console.warn(`Failed to fetch purchase orders for branch ${branchId}`)
      return []
    }
    
    const data = await response.json()
    return data.purchaseOrders || []
  } catch (error) {
    console.error('Error fetching purchase orders:', error)
    return []
  }
}

// Function to fetch product details by SKU
async function getProductDetails(sku: string): Promise<ProductDetails | null> {
  try {
    const response = await apiRequest(`api/products/search?sku=${sku}&page=0&size=100000`, {
      method: 'GET',
    })
    
    if (!response.ok) {
      console.warn(`Failed to fetch product details for SKU ${sku}`)
      return null
    }
    
    const data = await response.json()
    // Assuming the API returns an array of products and we want the first match
    const product = data.content?.[0] || data[0]
    
    if (!product) {
      console.warn(`No product found for SKU ${sku}`)
      return null
    }
    
    return {
      productId: product.id || product.productId,
      purchaseCost: product.purchaseCost || product.cost || 0
    }
  } catch (error) {
    console.error('Error fetching product details:', error)
    return null
  }
}

// Function to create a purchase transaction
async function createPurchaseTransaction(
  productId: string,
  warehouseId: string,
  quantityChange: number,
  transactionAmount: number
): Promise<boolean> {
  try {
    const transactionData = {
      productId,
      warehouseId,
      quantityChange,
      type: 'PURCHASE',
      referenceId: 'string',
      transactionAmount
    }
    
    const response = await apiRequest('api/inventory/transaction', {
      method: 'POST',
      body: JSON.stringify(transactionData)
    })
    
    if (!response.ok) {
      console.error(`Failed to create transaction for product ${productId}`)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error creating purchase transaction:', error)
    return false
  }
}

// Function to fetch all stock items for a warehouse (handling pagination)
async function fetchAllStockItems(warehouseId: string) {
  const allItems = []
  let currentPage = 0
  let totalPages = 1

  while (currentPage < totalPages) {
    const response = await apiRequest(`api/inventory/reports/stock-levels?warehouseId=${warehouseId}&page=${currentPage}&size=100`, {
      method: 'GET',
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
    const response = await apiRequest(`api/warehouses/${branchId}`, {
      method: 'GET',
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
  const [aiInsights, setAiInsights] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(true)
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isTextComplete, setIsTextComplete] = useState(false)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [purchaseOrdersLoading, setPurchaseOrdersLoading] = useState(false)
  const [isProcessingOrders, setIsProcessingOrders] = useState(false)
  const aiRequestMade = useRef(false)
  const typingTimeoutRef = useRef<number | null>(null)

  // Typewriter effect for AI insights
  const startTypewriter = (text: string) => {
    setDisplayedText('')
    setIsTyping(true)
    setIsTextComplete(false)
    setAiLoading(false)
    
    let index = 0
    const typeNextChar = () => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1))
        index++
        typingTimeoutRef.current = window.setTimeout(typeNextChar, 10)
      } else {
        setIsTyping(false)
        setIsTextComplete(true)
        console.log('✅ Typewriter effect completed - full text is now displayed')
        // Fetch purchase orders when typewriter completes
        fetchPurchaseOrders()
      }
    }
    typeNextChar()
  }

  // Convert markdown to HTML
  const formatMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/\n/g, '<br />') // Line breaks
  }

  // Fetch purchase orders
  const fetchPurchaseOrders = async () => {
    if (!branchId) return
    
    try {
      setPurchaseOrdersLoading(true)
      const orders = await getPurchaseOrders(branchId)
      setPurchaseOrders(orders)
      
      // Pre-select all orders by default
      const allSkus = new Set(orders.map(order => order.sku))
      setSelectedOrders(allSkus)
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
    } finally {
      setPurchaseOrdersLoading(false)
    }
  }

  // Handle checkbox changes
  const handleOrderSelection = (sku: string, checked: boolean) => {
    const newSelection = new Set(selectedOrders)
    if (checked) {
      newSelection.add(sku)
    } else {
      newSelection.delete(sku)
    }
    setSelectedOrders(newSelection)
  }

  // Handle placing orders
  const handlePlaceOrders = async () => {
    if (!branchId || selectedOrders.size === 0) return
    
    setIsProcessingOrders(true)
    
    try {
      const selectedOrderItems = purchaseOrders.filter(order => selectedOrders.has(order.sku))
      let successCount = 0
      let failureCount = 0
      const successfulSkus: string[] = []
      
      for (const order of selectedOrderItems) {
        console.log(`Processing order for SKU: ${order.sku}`)
        
        // Fetch product details
        const productDetails = await getProductDetails(order.sku)
        if (!productDetails) {
          console.error(`Failed to get product details for SKU: ${order.sku}`)
          failureCount++
          continue
        }
        
        // Calculate transaction amount
        const transactionAmount = productDetails.purchaseCost * (order.quantityToOrder + 1)
        
        // Create purchase transaction
        const success = await createPurchaseTransaction(
          productDetails.productId,
          branchId,
          order.quantityToOrder + 1,
          transactionAmount
        )
        
        if (success) {
          console.log(`✅ Successfully created transaction for SKU: ${order.sku}`)
          successCount++
          successfulSkus.push(order.sku)
        } else {
          console.error(`❌ Failed to create transaction for SKU: ${order.sku}`)
          failureCount++
        }
      }
      
      // Show results
      if (successCount > 0) {
        console.log(`🎉 Successfully processed ${successCount} orders`)
        
        // Remove successfully processed orders from the list
        const updatedOrders = purchaseOrders.filter(order => !successfulSkus.includes(order.sku))
        setPurchaseOrders(updatedOrders)
        
        // Clear selections after successful orders
        setSelectedOrders(new Set())
        
        // Refresh branch details to show updated stock levels
        await refreshBranchDetails()
      }
      
      if (failureCount > 0) {
        console.warn(`⚠️ Failed to process ${failureCount} orders`)
        alert(`Warning: ${failureCount} orders failed to process. Check console for details.`)
      }
      
    } catch (error) {
      console.error('Error processing orders:', error)
      alert('An error occurred while processing orders. Please try again.')
    } finally {
      setIsProcessingOrders(false)
    }
  }

  // Function to refresh branch details after successful orders
  const refreshBranchDetails = async () => {
    if (!branchId) return
    
    try {
      console.log('🔄 Refreshing branch details after successful orders...')
      const branchResult = await getBranchDetails(branchId)
      
      if (branchResult) {
        setBranch(branchResult)
        console.log('✅ Branch details refreshed successfully')
      }
    } catch (error) {
      console.error('Error refreshing branch details:', error)
    }
  }

  useEffect(() => {
    if (!branchId) {
      navigate('/branches')
      return
    }

    // Reset AI request flag when branchId changes
    aiRequestMade.current = false
    setAiInsights(null)
    setAiLoading(true)
    setDisplayedText('')
    setIsTyping(false)
    setIsTextComplete(false)
    setPurchaseOrders([])
    setSelectedOrders(new Set())
    setPurchaseOrdersLoading(false)
    setIsProcessingOrders(false)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    const fetchBranchDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch branch details first
        const branchResult = await getBranchDetails(branchId)
        
        if (branchResult) {
          setBranch(branchResult)
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

    const fetchAIInsights = async () => {
      // Prevent multiple calls to AI endpoint
      if (aiRequestMade.current) {
        return
      }
      aiRequestMade.current = true

      try {
        setAiLoading(true)
        // Fetch AI insights separately, after branch details
        const aiResult = await getAIInsights(branchId)
        if (aiResult) {
          setAiInsights(aiResult)
          startTypewriter(aiResult)
        } else {
          setAiInsights(null)
          setAiLoading(false)
        }
      } catch (err) {
        console.error('Error loading AI insights:', err)
        setAiInsights(null)
        setAiLoading(false)
      }
    }

    fetchBranchDetails()
    
    // Fetch AI insights after a delay, but only once
    const timeoutId = setTimeout(() => {
      fetchAIInsights()
    }, 500)

    // Cleanup function to cancel the timeout if component unmounts or branchId changes
    return () => {
      clearTimeout(timeoutId)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      aiRequestMade.current = false
    }
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
        <Button onClick={() => navigate('/branches')}>
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
              onClick={() => navigate('/branches')}
              className="h-8 w-8"
            >
              <IconArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center justify-between w-full">
              <Button
                variant="ghost"
                onClick={() => navigate('/branches')}
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

          {/* Purchase Orders Card - Shows when AI analysis is complete */}
          {isTextComplete && (
            <Card>
              <CardHeader>
                <CardTitle>Recommended Purchase Orders</CardTitle>
                <CardDescription>
                  AI-recommended products to order based on current stock levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                {purchaseOrdersLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-sm text-muted-foreground">Loading purchase recommendations...</div>
                  </div>
                ) : purchaseOrders.length > 0 ? (
                  <div className="space-y-4">
                    {/* Table Header */}
                    <div className="grid grid-cols-6 gap-4 text-xs font-medium text-muted-foreground border-b pb-2">
                      <div>Select</div>
                      <div>SKU</div>
                      <div>Product Name</div>
                      <div>Quantity</div>
                      <div>Priority</div>
                      <div>AI Comment</div>
                    </div>
                    
                    {/* Table Rows */}
                    <div className="space-y-2">
                      {purchaseOrders.map((order) => (
                        <div key={order.sku} className="grid grid-cols-6 gap-4 text-sm items-center py-2 border-b border-gray-100">
                          <div>
                            <Checkbox
                              checked={selectedOrders.has(order.sku)}
                              onCheckedChange={(checked) => handleOrderSelection(order.sku, checked as boolean)}
                            />
                          </div>
                          <div className="font-mono text-xs">{order.sku}</div>
                          <div className="truncate">{order.productName}</div>
                          <div className="font-medium">{order.quantityToOrder + 1}</div>
                          <div>
                            <Badge 
                              variant={
                                order.priority === 'High' ? 'destructive' : 
                                order.priority === 'Medium' ? 'default' : 
                                'secondary'
                              }
                              className="text-xs"
                            >
                              {order.priority}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground truncate" title={order.aiComment}>
                            {order.aiComment}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Order Button */}
                    <div className="flex justify-end pt-4">
                      <Button 
                        disabled={selectedOrders.size === 0 || isProcessingOrders}
                        onClick={handlePlaceOrders}
                      >
                        {isProcessingOrders ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Processing...
                          </>
                        ) : (
                          `Order Products (${selectedOrders.size})`
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <div className="text-2xl mb-2">📦</div>
                    <p className="text-sm">No purchase recommendations available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Right Side - AI Insights */}
      <div className="w-1/2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>AI Insights & Analysis</CardTitle>
            <CardDescription>
              Intelligent analysis and recommendations for this branch
            </CardDescription>
          </CardHeader>
          <CardContent className="h-full overflow-y-auto">
            {aiLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-sm text-muted-foreground">Loading AI insights...</div>
              </div>
            ) : aiInsights ? (
              <div className="prose prose-sm max-w-none">
                <div 
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: formatMarkdown(displayedText) 
                  }}
                />
                {isTyping && (
                  <span className="inline-block w-2 h-5 bg-gray-400 animate-pulse ml-1" />
                )}
                {isTextComplete && (
                  <div className="mt-2 text-xs text-green-600 opacity-50">
                    ✓ Analysis complete
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground h-32 flex items-center justify-center">
                <div>
                  <div className="text-4xl mb-2">🤖</div>
                  <p className="text-sm">No AI insights available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
