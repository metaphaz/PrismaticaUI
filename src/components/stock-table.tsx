"use client"

import * as React from "react"
import { useState } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ComboboxItems } from "./ComboboxItems"
import { IconPlus, IconColumns, IconFilter, IconTrash } from "@tabler/icons-react"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onItemsPerPageChange?: (value: string) => void
  onPageChange?: (page: number) => void
  currentPage?: number
  totalPages?: number
  itemsPerPage?: string
  onAddItem?: () => void
}

// Dynamic Add Item Dialog Component
function AddItemDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [formData, setFormData] = useState<Record<string, any>>({
    sku: '',
    currentQuantity: '',
    warehouseName: '',
    transactionAmount: '',
    productId: null,
    warehouseId: null,
  })

  // SKU autocomplete state
  const [skuOptions, setSkuOptions] = useState<any[]>([])
  const [skuQuery, setSkuQuery] = useState('')
  const [showSkuDropdown, setShowSkuDropdown] = useState(false)
  const [isLoadingSku, setIsLoadingSku] = useState(false)

  // Warehouse autocomplete state
  const [warehouseOptions, setWarehouseOptions] = useState<any[]>([])
  const [warehouseQuery, setWarehouseQuery] = useState('')
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false)
  const [isLoadingWarehouse, setIsLoadingWarehouse] = useState(false)

  // Fetch SKU options from API
  const fetchSkuOptions = async (query: string) => {
    if (query.length < 1) {
      setSkuOptions([])
      setShowSkuDropdown(false)
      return
    }

    setIsLoadingSku(true)
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
        console.log('API Response:', data) // Debug log to see the actual response structure
        
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
          console.warn('API response is not in expected format:', data)
          setSkuOptions([])
          setShowSkuDropdown(false)
          return
        }
        
        // API already filters results based on the ?sku= query parameter
        setSkuOptions(products)
        setShowSkuDropdown(true)
      }
    } catch (error) {
      console.error('Error fetching SKU options:', error)
    } finally {
      setIsLoadingSku(false)
    }
  }

  // Fetch warehouse options from API
  const fetchWarehouseOptions = async (query: string) => {
    if (query.length < 1) {
      setWarehouseOptions([])
      setShowWarehouseDropdown(false)
      return
    }

    setIsLoadingWarehouse(true)
    try {
      // Fetch from warehouses API to get available warehouses with query parameter
      const response = await fetch(`https://ae8aa5699e02.ngrok-free.app/api/warehouses/search?name=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Warehouse API Response:', data) // Debug log to see the actual response structure
        
        // Check if data is an array, if not, try to extract array from response
        let warehouses = []
        if (Array.isArray(data)) {
          warehouses = data
        } else if (data && Array.isArray(data.content)) {
          // Handle paginated response format with content array
          warehouses = data.content
        } else if (data && Array.isArray(data.warehouses)) {
          warehouses = data.warehouses
        } else if (data && Array.isArray(data.data)) {
          warehouses = data.data
        } else {
          console.warn('Warehouse API response is not in expected format:', data)
          setWarehouseOptions([])
          setShowWarehouseDropdown(false)
          return
        }
        
        // API already filters results based on the ?name= query parameter
        setWarehouseOptions(warehouses)
        setShowWarehouseDropdown(true)
      }
    } catch (error) {
      console.error('Error fetching warehouse options:', error)
    } finally {
      setIsLoadingWarehouse(false)
    }
  }

  // Handle SKU input change with debounced API call
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (skuQuery) {
        fetchSkuOptions(skuQuery)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [skuQuery])

  // Handle warehouse input change with debounced API call
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (warehouseQuery) {
        fetchWarehouseOptions(warehouseQuery)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [warehouseQuery])

  // Handle SKU selection from dropdown
  const handleSkuSelect = (selectedProduct: any) => {
    setFormData(prev => ({
      ...prev,
      sku: selectedProduct.sku || '',
      productId: selectedProduct.id || selectedProduct.productId || null,
    }))
    setSkuQuery(selectedProduct.sku || '')
    setShowSkuDropdown(false)
  }

  // Handle warehouse selection from dropdown
  const handleWarehouseSelect = (selectedWarehouse: any) => {
    setFormData(prev => ({
      ...prev,
      warehouseName: selectedWarehouse.name || selectedWarehouse.warehouseName || '',
      warehouseId: selectedWarehouse.id || selectedWarehouse.warehouseId || null,
    }))
    setWarehouseQuery(selectedWarehouse.name || selectedWarehouse.warehouseName || '')
    setShowWarehouseDropdown(false)
  }

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }))

    // Special handling for SKU field
    if (key === 'sku') {
      setSkuQuery(value)
      if (value.length === 0) {
        setShowSkuDropdown(false)
      }
    }

    // Special handling for warehouse field
    if (key === 'warehouseName') {
      setWarehouseQuery(value)
      if (value.length === 0) {
        setShowWarehouseDropdown(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Prepare data for API with productId, warehouseId, and quantityChange
      const processedData = {
        productId: formData.productId,
        warehouseId: formData.warehouseId,
        quantityChange: parseFloat(formData.currentQuantity) || 0,
        type: 'PURCHASE',
        referenceId: null,
        transactionAmount: parseFloat(formData.transactionAmount) || 0,
      }

      console.log('Sending data to API:', processedData) // Debug log

      // Validate that we have the required IDs
      if (!processedData.productId || !processedData.warehouseId) {
        alert('Please select both a product (SKU) and a warehouse from the dropdown options.')
        return
      }

      // Make API call to create new item - using inventory endpoint
      const response = await fetch('https://ae8aa5699e02.ngrok-free.app/api/inventory/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(processedData),
      })
      
      if (response.ok) {
        console.log('Stock item created successfully')
        onOpenChange(false)
        // Reset form
        setFormData({
          sku: '',
          currentQuantity: '',
          warehouseName: '',
          transactionAmount: '',
          productId: null,
          warehouseId: null,
        })
        // Reset SKU autocomplete state
        setSkuQuery('')
        setSkuOptions([])
        setShowSkuDropdown(false)
        // Reset warehouse autocomplete state
        setWarehouseQuery('')
        setWarehouseOptions([])
        setShowWarehouseDropdown(false)
        // Refresh the page after successful creation
        window.location.reload()
      } else {
        console.error('Failed to create stock item')
      }
    } catch (error) {
      console.error('Error creating stock item:', error)
    }
  }

  const handleCancel = () => {
    // Reset form data when canceling
    setFormData({
      sku: '',
      currentQuantity: '',
      warehouseName: '',
      transactionAmount: '',
      productId: null,
      warehouseId: null,
    })
    // Reset SKU autocomplete state
    setSkuQuery('')
    setSkuOptions([])
    setShowSkuDropdown(false)
    // Reset warehouse autocomplete state
    setWarehouseQuery('')
    setWarehouseOptions([])
    setShowWarehouseDropdown(false)
    onOpenChange(false)
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if ((showSkuDropdown || showWarehouseDropdown) && !target.closest('.relative')) {
        setShowSkuDropdown(false)
        setShowWarehouseDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSkuDropdown, showWarehouseDropdown])

  const formFields = [
    { key: 'currentQuantity', label: 'New Quantity', type: 'number' },
    { key: 'transactionAmount', label: 'Transaction Amount', type: 'number' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Stock Item</DialogTitle>
          <DialogDescription>
            Add a new stock item to the inventory. Select a SKU and enter quantity and warehouse information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* SKU Field with Autocomplete */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sku" className="text-right">
                SKU
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="sku"
                  value={formData.sku || ''}
                  onChange={(e) => handleInputChange('sku', e.target.value)}
                  placeholder="Start typing to search SKU..."
                  className="w-full"
                  type="text"
                  required
                />
                {isLoadingSku && (
                  <div className="absolute right-2 top-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  </div>
                )}
                {showSkuDropdown && skuOptions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {skuOptions.map((option, index) => (
                      <div
                        key={option.id || index}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleSkuSelect(option)}
                      >
                        <div className="font-medium text-sm">{option.sku}</div>
                        <div className="text-gray-600 text-xs">{option.name}</div>
                        <div className="text-gray-500 text-xs">${option.salePrice}</div>
                        <div className="text-gray-400 text-xs">ID: {option.id || option.productId}</div>
                      </div>
                    ))}
                  </div>
                )}
                {showSkuDropdown && skuOptions.length === 0 && !isLoadingSku && skuQuery.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="px-4 py-2 text-gray-500 text-sm">No matching SKUs found</div>
                  </div>
                )}
              </div>
            </div>

            {/* Warehouse Field with Autocomplete */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="warehouseName" className="text-right">
                Warehouse
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="warehouseName"
                  value={formData.warehouseName || ''}
                  onChange={(e) => handleInputChange('warehouseName', e.target.value)}
                  placeholder="Start typing to search warehouse..."
                  className="w-full"
                  type="text"
                  required
                />
                {isLoadingWarehouse && (
                  <div className="absolute right-2 top-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  </div>
                )}
                {showWarehouseDropdown && warehouseOptions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {warehouseOptions.map((option, index) => (
                      <div
                        key={option.id || index}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleWarehouseSelect(option)}
                      >
                        <div className="font-medium text-sm">{option.name || option.warehouseName}</div>
                        {option.location && <div className="text-gray-600 text-xs">{option.location}</div>}
                        {option.address && <div className="text-gray-500 text-xs">{option.address}</div>}
                        <div className="text-gray-400 text-xs">ID: {option.id || option.warehouseId}</div>
                      </div>
                    ))}
                  </div>
                )}
                {showWarehouseDropdown && warehouseOptions.length === 0 && !isLoadingWarehouse && warehouseQuery.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="px-4 py-2 text-gray-500 text-sm">No matching warehouses found</div>
                  </div>
                )}
              </div>
            </div>

            {/* Other Form Fields */}
            {formFields.map((field) => (
              <div key={field.key} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={field.key} className="text-right">
                  {field.label}
                </Label>
                <Input
                  id={field.key}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  className="col-span-3"
                  type={field.type}
                  step={field.type === 'number' ? '0.01' : undefined}
                  required
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Add Stock Item</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Dynamic Edit Dialog Component
function EditDialog<TData>({ item }: { item: TData }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isDeleting, setIsDeleting] = useState(false)

  // Function to initialize form data with current item values
  const initializeFormData = () => {
    const data: Record<string, any> = {}
    Object.entries(item as Record<string, any>).forEach(([key, value]) => {
      data[key] = value?.toString() || ''
    })
    return data
  }

  // Reset form data whenever dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Reset form data to original values when opening
      setFormData(initializeFormData())
    }
    setOpen(newOpen)
  }

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Convert string values back to appropriate types
      const processedData: Record<string, any> = {}
      Object.entries(formData).forEach(([key, value]) => {
        // Try to convert to number if it looks like a number
        if (typeof (item as Record<string, any>)[key] === 'number') {
          processedData[key] = parseFloat(value) || 0
        } else {
          processedData[key] = value
        }
      })

      // Make API call to update the item - using inventory endpoint
      const response = await fetch(`https://ae8aa5699e02.ngrok-free.app/api/inventory/${(item as any).id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(processedData),
      })
      
      if (response.ok) {
        console.log('Stock item updated successfully')
        setOpen(false)
        // Refresh the page after successful update
        window.location.reload()
      } else {
        console.error('Failed to update stock item')
      }
    } catch (error) {
      console.error('Error updating stock item:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this stock item? This action cannot be undone.')) {
      return
    }
    
    setIsDeleting(true)
    try {
      const response = await fetch(`https://ae8aa5699e02.ngrok-free.app/api/inventory/${(item as any).id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      })
      
      if (response.ok) {
        console.log('Stock item deleted successfully')
        setOpen(false)
        // Refresh the page after successful deletion
        window.location.reload()
      } else {
        console.error('Failed to delete stock item')
        alert('Failed to delete stock item. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting stock item:', error)
      alert('Error deleting stock item. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to original values when canceling
    setFormData(initializeFormData())
    setOpen(false)
  }

  // Define which fields should be editable - customize this array as needed
  const editableFields = [
    { key: 'name', label: 'Stock Name', type: 'text' },
    { key: 'sku', label: 'SKU', type: 'text' },
    { key: 'salePrice', label: 'Sale Price', type: 'number' },
    { key: 'currentQuantity', label: 'Current Quantity', type: 'number' },
    { key: 'warehouseName', label: 'Warehouse Name', type: 'text' },
  ]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Stock Item</DialogTitle>
          <DialogDescription>
            Make changes to the stock item information here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {editableFields.map((field) => (
              <div key={field.key} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={field.key} className="text-right">
                  {field.label}
                </Label>
                <Input
                  id={field.key}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  className="col-span-3"
                  type={field.type}
                  step={field.type === 'number' ? '0.01' : undefined}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between gap-2">
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <IconTrash className="mr-2 h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit">Save changes</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function StockDataTable<TData, TValue>({
  columns,
  data,
  onItemsPerPageChange,
  onPageChange,
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = "10",
  onAddItem,
}: DataTableProps<TData, TValue>) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState("")

  const handleAddClick = () => {
    setAddDialogOpen(true)
    if (onAddItem) {
      onAddItem()
    }
  }

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  })

  return (
    <div className="w-full h-full">
      {/* Filtering and Controls */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">
          {/* Global filter input */}
          <Input
            placeholder="Filter all columns..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(String(event.target.value))}
            className="max-w-sm"
          />
          
          {/* SKU specific filter */}
          <Input
            placeholder="Filter by SKU..."
            value={(table.getColumn("sku")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("sku")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Column visibility dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <IconColumns className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Items per page and Add button */}
          <div className="flex items-center space-x-2">
            <ComboboxItems 
              value={itemsPerPage}
              onValueChange={onItemsPerPageChange}
            />
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={handleAddClick}
                  size="sm"
                  className="ml-2"
                >
                  <IconPlus className="h-4 w-4 mr-2" />
                  Add Stock Item
                </Button>
              </DialogTrigger>
              <AddItemDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
            </Dialog>
          </div>
        </div>
      </div>

      <div className="overflow-auto rounded-md border">
        <Table>
          <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
                <TableCell>
                  <EditDialog item={row.original} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-center space-x-2 py-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => onPageChange && onPageChange(Math.max(1, currentPage - 1))}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {/* Page Numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    onClick={() => onPageChange && onPageChange(pageNum)}
                    isActive={currentPage === pageNum}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => onPageChange && onPageChange(Math.min(totalPages, currentPage + 1))}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
