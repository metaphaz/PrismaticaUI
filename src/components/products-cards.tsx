import { useState, useEffect } from "react"
import { columns, type Product, availableColumns, defaultColumnOrder } from "./products-columns"
import { DataTable } from "./products-table"
import { type ColumnDef } from "@tanstack/react-table"

async function getData(): Promise<Product[]> {
  try {
    // Make API call to fetch data
    const response = await fetch('https://ae8aa5699e02.ngrok-free.app/api/products?page=0&size=31', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true', // Add this header for ngrok
        'Accept': 'application/json',
      },
      mode: 'cors', // Explicitly set CORS mode
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    // Get the raw text first, then parse as JSON
    const rawText = await response.text()
    const data = JSON.parse(rawText)['content']
    return data
  } catch (error) {
    console.error('Error fetching data:', error)
    // Return empty array or fallback data if API fails
    return [{
      id: "728ed52f",
      purchaseCost: 100,
      salePrice: 150,
      sku: "B2",
      name: "Apple",
      description: "A juicy red apple",
      category: "Fruits",
    },
    {
      id: "489e1d42",
      purchaseCost: 125,
      salePrice: 175,
      sku: "A1",
      name: "Banana",
      description: "A ripe banana",
      category: "Fruits",
    },
    {
      id: "629e1f45",
      purchaseCost: 75,
      salePrice: 100,
      sku: "C3",
      name: "Cherry",
      description: "A bunch of cherries",
      category: "Fruits",
    },]
  }
}

export function ProductsCards() {
    const [data, setData] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    // Dynamic column management
    const [columnOrder, setColumnOrder] = useState(defaultColumnOrder)
    const [dynamicColumns, setDynamicColumns] = useState<ColumnDef<Product>[]>(columns)

    // Function to reorder columns
    const reorderColumns = (newOrder: (keyof typeof availableColumns)[]) => {
        const newColumns = newOrder.map(key => availableColumns[key])
        setColumnOrder(newOrder)
        setDynamicColumns(newColumns)
    }

    // Function to toggle column visibility
    const toggleColumn = (columnKey: keyof typeof availableColumns) => {
        if (columnOrder.includes(columnKey)) {
            // Remove column
            const newOrder = columnOrder.filter(key => key !== columnKey)
            reorderColumns(newOrder)
        } else {
            // Add column
            const newOrder = [...columnOrder, columnKey]
            reorderColumns(newOrder)
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                setError(null)
                const result = await getData()
                setData(result)
            } catch (err) {
                setError('Failed to load data')
                console.error('Error loading data:', err)
            } finally {
                setLoading(false)
            }
        }
        
        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-32">
                <div className="text-lg">Loading...</div>
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
        <div className="w-full h-full min-h-screen p-4">
            {/* Column Management Controls - Uncomment to enable dynamic column controls */}
            {/* 
            <div className="mb-4 p-4 border rounded">
                <h3 className="font-semibold mb-2">Column Controls:</h3>
                <div className="flex gap-2 flex-wrap">
                    {Object.keys(availableColumns).map((key) => (
                        <button
                            key={key}
                            onClick={() => toggleColumn(key as keyof typeof availableColumns)}
                            className={`px-3 py-1 rounded text-sm ${
                                columnOrder.includes(key as keyof typeof availableColumns)
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-700'
                            }`}
                        >
                            {key.toUpperCase()}
                        </button>
                    ))}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                    Current order: {columnOrder.join(' → ')}
                </div>
            </div>
            */}
            
            <DataTable columns={dynamicColumns} data={data} />
        </div>
    )

    // Example of how to programmatically reorder columns:
    // reorderColumns(['name', 'price', 'sku'])  // This would put Name first, then Price, then SKU
    
    // Example of how to toggle a column:
    // toggleColumn('id')  // This would show/hide the ID column
}