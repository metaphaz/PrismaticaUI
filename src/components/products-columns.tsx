"use client"

import { type ColumnDef } from "@tanstack/react-table"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Product = {
  id: string
  purchaseCost: number
  salePrice: number
  sku: string
  name: string
  description: string
  category: string
}

// Column configuration object for easy reordering and customization
const columnConfig = {
  id: {
    accessorKey: "id",
    header: "ID",
    size: 100,
  },
  sku: {
    accessorKey: "sku",
    header: "SKU",
    size: 120,
  },
  name: {
    accessorKey: "name", 
    header: "Product Name",
    size: 200,
  },
  purchaseCost: {
    accessorKey: "purchaseCost",
    header: () => <div className="text-right">Purchase Cost</div>,
    size: 120,
    cell: ({ row }: any) => {
      const purchaseCost = parseFloat(row.getValue("purchaseCost"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(purchaseCost)

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  salePrice: {
    accessorKey: "salePrice",
    header: () => <div className="text-right">Sale Price</div>,
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
  description: {
    accessorKey: "description",
    header: "Description",
    size: 300,
  },
  category: {
    accessorKey: "category",
    header: "Category",
    size: 150,
  },
}

// Define the order of columns here - change this array to reorder columns
const columnOrder: (keyof typeof columnConfig)[] = [
  "sku",     // 1st column
  "name",    // 2nd column  
  "purchaseCost",   // 3rd column
  "salePrice",       // 4th column
  "description",
  "category"
  // "id",   // Uncomment to show ID column
]

// Generate the columns array based on the order
export const columns: ColumnDef<Product>[] = columnOrder.map(key => columnConfig[key])

// Alternative: You can also export individual column configs for more flexibility
export const availableColumns = columnConfig
export const defaultColumnOrder = columnOrder