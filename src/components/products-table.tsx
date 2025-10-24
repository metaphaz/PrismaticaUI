"use client"

import { useState } from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
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

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
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

  // Get all keys from the item (excluding id for editing)
  const editableKeys = Object.keys(item as Record<string, any>).filter(key => key !== 'id')

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
            {editableKeys.map((key) => (
              <div key={key} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={key} className="text-right capitalize">
                  {key}
                </Label>
                <Input
                  id={key}
                  value={formData[key] || ''}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="col-span-3"
                  type={typeof (item as Record<string, any>)[key] === 'number' ? 'number' : 'text'}
                  step={typeof (item as Record<string, any>)[key] === 'number' ? '0.01' : undefined}
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
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full h-full">
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
    </div>
  )
}