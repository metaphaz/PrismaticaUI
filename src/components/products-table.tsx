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
import { IconPlus, IconColumns } from "@tabler/icons-react"

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
    name: '',
    sku: '',
    salePrice: '',
    purchaseCost: '',
    description: '',
    category: '',
  })

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Convert string values to appropriate types
      const processedData: Record<string, any> = {}
      Object.entries(formData).forEach(([key, value]) => {
        // Convert price fields to numbers
        if (key === 'salePrice' || key === 'purchaseCost') {
          processedData[key] = parseFloat(value) || 0
        } else {
          processedData[key] = value
        }
      })

      // Make API call to create new item
      const response = await fetch('https://ae8aa5699e02.ngrok-free.app/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(processedData),
      })
      
      if (response.ok) {
        console.log('Item created successfully')
        onOpenChange(false)
        // Reset form
        setFormData({
          name: '',
          sku: '',
          salePrice: '',
          purchaseCost: '',
          description: '',
          category: '',
        })
        // Refresh the page after successful creation
        window.location.reload()
      } else {
        console.error('Failed to create item')
      }
    } catch (error) {
      console.error('Error creating item:', error)
    }
  }

  const handleCancel = () => {
    // Reset form and close dialog
    setFormData({
      name: '',
      sku: '',
      salePrice: '',
      purchaseCost: '',
      description: '',
      category: '',
    })
    onOpenChange(false)
  }

  const formFields = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'sku', label: 'SKU', type: 'text' },
    { key: 'salePrice', label: 'Sale Price', type: 'number' },
    { key: 'purchaseCost', label: 'Purchase Cost', type: 'number' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'category', label: 'Category', type: 'text' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
          <DialogDescription>
            Add a new product to the database. Fill in all the required fields.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
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
            <Button type="submit">Add Item</Button>
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

      // Make API call to update the item
      const response = await fetch(`https://ae8aa5699e02.ngrok-free.app/api/products/${(item as any).id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(processedData),
      })
      
      if (response.ok) {
        console.log('Item updated successfully')
        setOpen(false)
        // Refresh the page after successful update
        window.location.reload()
      } else {
        console.error('Failed to update item')
      }
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  const handleCancel = () => {
    // Reset form data to original values when canceling
    setFormData(initializeFormData())
    setOpen(false)
  }

  // Define which fields should be editable - customize this array as needed
  const editableFields = [
    { key: 'sku', label: 'SKU', type: 'text' },
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'salePrice', label: 'Sale Price', type: 'number' },
    { key: 'purchaseCost', label: 'Purchase Cost', type: 'number' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'category', label: 'Category', type: 'text' },
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
          <DialogTitle>Edit Item</DialogTitle>
          <DialogDescription>
            Make changes to the item information here. Click save when you're done.
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function DataTable<TData, TValue>({
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
                  Add Item
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