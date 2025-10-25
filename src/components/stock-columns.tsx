"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { IconArrowsSort, IconSortAscending, IconSortDescending } from "@tabler/icons-react"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Stock = {
  id: string
  currentQuantity: number
  salePrice: number
  sku: string
  productName: string
  warehouseName: string
  totalStockValue: number
}

// Column configuration object for easy reordering and customization
const columnConfig = {
  id: {
    accessorKey: "id",
    header: ({ column }: any) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0"
        >
          ID
          {column.getIsSorted() === "asc" ? (
            <IconSortAscending className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <IconSortDescending className="ml-2 h-4 w-4" />
          ) : (
            <IconArrowsSort className="ml-2 h-4 w-4" />
          )}
        </Button>
      )
    },
    size: 100,
  },
  sku: {
    accessorKey: "sku",
    header: ({ column }: any) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0"
        >
          SKU
          {column.getIsSorted() === "asc" ? (
            <IconSortAscending className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <IconSortDescending className="ml-2 h-4 w-4" />
          ) : (
            <IconArrowsSort className="ml-2 h-4 w-4" />
          )}
        </Button>
      )
    },
    size: 120,
  },
  productName: {
    accessorKey: "productName", 
    header: ({ column }: any) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0"
        >
          Product Name
          {column.getIsSorted() === "asc" ? (
            <IconSortAscending className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <IconSortDescending className="ml-2 h-4 w-4" />
          ) : (
            <IconArrowsSort className="ml-2 h-4 w-4" />
          )}
        </Button>
      )
    },
    size: 200,
  },
  totalStockValue: {
    accessorKey: "totalStockValue",
    header: ({ column }: any) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0"
          >
            Total Stock Value
            {column.getIsSorted() === "asc" ? (
              <IconSortAscending className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <IconSortDescending className="ml-2 h-4 w-4" />
            ) : (
              <IconArrowsSort className="ml-2 h-4 w-4" />
            )}
          </Button>
        </div>
      )
    },
    size: 120,
    cell: ({ row }: any) => {
      const totalStockValue = parseFloat(row.getValue("totalStockValue"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(totalStockValue)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  salePrice: {
    accessorKey: "salePrice",
    header: ({ column }: any) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0"
          >
            Sale Price
            {column.getIsSorted() === "asc" ? (
              <IconSortAscending className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <IconSortDescending className="ml-2 h-4 w-4" />
            ) : (
              <IconArrowsSort className="ml-2 h-4 w-4" />
            )}
          </Button>
        </div>
      )
    },
    size: 120,
    cell: ({ row }: any) => {
      const salePrice = parseFloat(row.getValue("salePrice"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(salePrice)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  warehouseName: {
    accessorKey: "warehouseName",
    header: ({ column }: any) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0"
        >
          Warehouse Name
          {column.getIsSorted() === "asc" ? (
            <IconSortAscending className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <IconSortDescending className="ml-2 h-4 w-4" />
          ) : (
            <IconArrowsSort className="ml-2 h-4 w-4" />
          )}
        </Button>
      )
    },
    size: 300,
  },
  currentQuantity: {
    accessorKey: "currentQuantity",
    header: ({ column }: any) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0"
        >
          Current Quantity
          {column.getIsSorted() === "asc" ? (
            <IconSortAscending className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <IconSortDescending className="ml-2 h-4 w-4" />
          ) : (
            <IconArrowsSort className="ml-2 h-4 w-4" />
          )}
        </Button>
      )
    },
    size: 150,
  },
}

// Define the order of columns here - change this array to reorder columns
const columnOrder: (keyof typeof columnConfig)[] = [
  "sku",     // 1st column
  "productName",    // 2nd column
  "currentQuantity",   // 3rd column
  "salePrice",       // 4th column
  "totalStockValue", // 5th column
  "warehouseName",   // 6th column
  // "id",   // Uncomment to show ID column
]

// Generate the columns array based on the order
export const columns: ColumnDef<Stock>[] = columnOrder.map(key => columnConfig[key])

// Alternative: You can also export individual column configs for more flexibility
export const availableColumns = columnConfig
export const defaultColumnOrder = columnOrder
