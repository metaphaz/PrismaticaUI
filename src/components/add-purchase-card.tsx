import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"

interface AddPurchaseCardProps {
  onPurchaseAdded: () => void
}

export function AddPurchaseCard({ onPurchaseAdded }: AddPurchaseCardProps) {
  const [formData, setFormData] = useState({
    sku: '',
    currentQuantity: '',
    transactionAmount: '',
    warehouseName: '',
    productId: null as number | null,
    warehouseId: null as number | null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // SKU autocomplete state
  const [skuOptions, setSkuOptions] = useState<any[]>([])
  const [skuQuery, setSkuQuery] = useState('')
  const [showSkuDropdown, setShowSkuDropdown] = useState(false)

  // Warehouse autocomplete state
  const [warehouseOptions, setWarehouseOptions] = useState<any[]>([])
  const [warehouseQuery, setWarehouseQuery] = useState('')
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false)

  // Refs for dropdown management
  const skuDropdownRef = useRef<HTMLDivElement>(null)
  const warehouseDropdownRef = useRef<HTMLDivElement>(null)

  // Fetch SKU options from API
  const fetchSkuOptions = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSkuOptions([])
      setShowSkuDropdown(false)
      return
    }

    try {
      // Fetch from products API to get available SKUs with query parameter
      const response = await fetch(`https://ae8aa5699e02.ngrok-free.app/api/products/search?sku=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Purchase SKU API Response:', data) // Debug log to see the actual response structure
        
        // Check if data is an array, if not, try to extract array from response
        let products = []
        if (Array.isArray(data)) {
          products = data
        } else if (data && Array.isArray(data.content)) {
          // Handle paginated response format with content array
          products = data.content
        } else if (data && Array.isArray(data.products)) {
          products = data.products
        } else if (data && Array.isArray(data.data)) {
          products = data.data
        } else {
          console.warn('Purchase SKU API response is not in expected format:', data)
          setSkuOptions([])
          setShowSkuDropdown(false)
          return
        }
        
        // API already filters results based on the ?sku= query parameter
        setSkuOptions(products)
        setShowSkuDropdown(true)
      } else {
        console.error('Purchase SKU API request failed:', response.status)
        setSkuOptions([])
        setShowSkuDropdown(false)
      }
    } catch (error) {
      console.error('Error fetching Purchase SKU options:', error)
      setSkuOptions([])
      setShowSkuDropdown(false)
    }
  }, [])

  // Fetch warehouse options from API
  const fetchWarehouseOptions = async (query: string) => {
    if (query.length < 1) {
      setWarehouseOptions([])
      setShowWarehouseDropdown(false)
      return
    }

    try {
      const response = await fetch(`https://ae8aa5699e02.ngrok-free.app/api/warehouses/search?name=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        let warehouses = []
        if (Array.isArray(data)) {
          warehouses = data
        } else if (data && Array.isArray(data.content)) {
          warehouses = data.content
        } else if (data && Array.isArray(data.warehouses)) {
          warehouses = data.warehouses
        } else if (data && Array.isArray(data.data)) {
          warehouses = data.data
        }
        
        setWarehouseOptions(warehouses)
        setShowWarehouseDropdown(warehouses.length > 0)
      } else {
        setWarehouseOptions([])
        setShowWarehouseDropdown(false)
      }
    } catch (error) {
      console.error('Error fetching warehouse options:', error)
      setWarehouseOptions([])
      setShowWarehouseDropdown(false)
    }
  }

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (skuDropdownRef.current && !skuDropdownRef.current.contains(event.target as Node)) {
        setShowSkuDropdown(false)
      }
      if (warehouseDropdownRef.current && !warehouseDropdownRef.current.contains(event.target as Node)) {
        setShowWarehouseDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Handle SKU input change with debounced API call
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (skuQuery) {
        fetchSkuOptions(skuQuery)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [skuQuery, fetchSkuOptions])

  // Handle warehouse input change with debounced API call
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (warehouseQuery) {
        fetchWarehouseOptions(warehouseQuery)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [warehouseQuery])

  const resetForm = () => {
    setFormData({
      sku: '',
      currentQuantity: '',
      transactionAmount: '',
      warehouseName: '',
      productId: null,
      warehouseId: null,
    })
    setSkuQuery('')
    setWarehouseQuery('')
    setSkuOptions([])
    setWarehouseOptions([])
    setShowSkuDropdown(false)
    setShowWarehouseDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate that we have the required IDs
      if (!formData.productId || !formData.warehouseId) {
        toast.error('Please select both a product (SKU) and a warehouse from the dropdown options.')
        setIsSubmitting(false)
        return
      }

      const processedData = {
        productId: formData.productId,
        warehouseId: formData.warehouseId,
        quantityChange: parseFloat(formData.currentQuantity) || 0,
        type: 'PURCHASE',
        referenceId: null,
        transactionAmount: parseFloat(formData.transactionAmount) || 0,
      }

      // Use the same API endpoint as the stock add button
      const response = await fetch('https://ae8aa5699e02.ngrok-free.app/api/inventory/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json',
        },
        body: JSON.stringify(processedData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      toast.success("Purchase recorded successfully!")
      resetForm()
      onPurchaseAdded() // Refresh the data
    } catch (error) {
      console.error('Error recording purchase:', error)
      toast.error("Failed to record purchase. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle SKU selection from dropdown
  const handleSkuSelect = (product: any) => {
    setFormData(prev => ({
      ...prev,
      sku: product.sku || product.name,
      productId: product.id
    }))
    setSkuQuery(product.sku || product.name)
    setShowSkuDropdown(false)
  }

  // Handle warehouse selection from dropdown
  const handleWarehouseSelect = (warehouse: any) => {
    setFormData(prev => ({
      ...prev,
      warehouseName: warehouse.name,
      warehouseId: warehouse.id
    }))
    setWarehouseQuery(warehouse.name)
    setShowWarehouseDropdown(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Purchase</CardTitle>
        <CardDescription>
          Record a new purchase transaction and add stock to inventory
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* SKU Field with Autocomplete */}
            <div className="space-y-2 relative">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                type="text"
                placeholder="Search for product SKU..."
                value={skuQuery}
                onChange={(e) => {
                  setSkuQuery(e.target.value);
                  if (e.target.value.length === 0) {
                    setShowSkuDropdown(false);
                  }
                }}
                onFocus={() => {
                  if (skuQuery.length > 0 && skuOptions.length > 0) {
                    setShowSkuDropdown(true);
                  }
                }}
                required
              />
              {showSkuDropdown && skuOptions.length > 0 && (
                <div 
                  ref={skuDropdownRef}
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto"
                >
                  {skuOptions.map((product) => (
                    <div
                      key={product.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => handleSkuSelect(product)}
                    >
                      <div className="font-medium">{product.sku || product.name}</div>
                      <div className="text-gray-600 text-xs">{product.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current Quantity Field */}
            <div className="space-y-2">
              <Label htmlFor="currentQuantity">Quantity</Label>
              <Input
                id="currentQuantity"
                type="number"
                placeholder="Enter quantity"
                value={formData.currentQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, currentQuantity: e.target.value }))}
                required
                min="1"
              />
            </div>

            {/* Transaction Amount Field */}
            <div className="space-y-2">
              <Label htmlFor="transactionAmount">Unit Price</Label>
              <Input
                id="transactionAmount"
                type="number"
                step="0.01"
                placeholder="Enter unit price"
                value={formData.transactionAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, transactionAmount: e.target.value }))}
                required
                min="0"
              />
            </div>

            {/* Warehouse Field with Autocomplete */}
            <div className="space-y-2 relative md:col-span-2 lg:col-span-3">
              <Label htmlFor="warehouse">Warehouse</Label>
              <Input
                id="warehouse"
                type="text"
                placeholder="Search for warehouse..."
                value={warehouseQuery}
                onChange={(e) => {
                  setWarehouseQuery(e.target.value);
                  if (e.target.value.length === 0) {
                    setShowWarehouseDropdown(false);
                  }
                }}
                onFocus={() => {
                  if (warehouseQuery.length > 0 && warehouseOptions.length > 0) {
                    setShowWarehouseDropdown(true);
                  }
                }}
                required
              />
              {showWarehouseDropdown && warehouseOptions.length > 0 && (
                <div 
                  ref={warehouseDropdownRef}
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto"
                >
                  {warehouseOptions.map((warehouse) => (
                    <div
                      key={warehouse.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => handleWarehouseSelect(warehouse)}
                    >
                      <div className="font-medium">{warehouse.name}</div>
                      <div className="text-gray-600 text-xs">{warehouse.address}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Total Amount: ${formData.currentQuantity && formData.transactionAmount ? 
                (parseFloat(formData.currentQuantity) * parseFloat(formData.transactionAmount)).toFixed(2) : 
                '0.00'}
            </div>
            <div className="space-x-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Clear
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Recording..." : "Record Purchase"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
