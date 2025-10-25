import { useState, useEffect } from "react"
import { columns, type Product } from "./products-columns"
import { DataTable } from "./products-table"

async function getData(limit?: string, page?: number): Promise<{ data: Product[], totalPages: number }> {
  try {
    // Build the URL with limit and page parameters
    const baseUrl = 'https://ae8aa5699e02.ngrok-free.app/api/products'
    const params = new URLSearchParams()
    
    if (limit) params.append('size', limit)
    if (page !== undefined) params.append('page', (page - 1).toString()) // Convert to 0-based indexing
    
    const url = `${baseUrl}?${params.toString()}`
    
    // Make API call to fetch data
    const response = await fetch(url, {
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
    const apiResponse = JSON.parse(rawText)
    
    // Extract data and pagination info from API response
    const data = apiResponse.content || apiResponse.data || apiResponse
    const totalPages = apiResponse.totalPages || 1
    
    return { data, totalPages }
  } catch (error) {
    console.error('Error fetching data:', error)
    // Return empty array or fallback data if API fails
    return {
      data: [{
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
      }],
      totalPages: 1
    }
  }
}

export function ProductsCards() {
    const [data, setData] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [itemsPerPage, setItemsPerPage] = useState<string>("10") // Default to 10 items
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [totalPages, setTotalPages] = useState<number>(1)

    // Function to handle items per page change from combobox
    const handleItemsPerPageChange = (value: string) => {
        setItemsPerPage(value)
        setCurrentPage(1) // Reset to first page when changing items per page
        // Fetch new data with the updated limit
        fetchData(value, 1)
    }

    // Function to handle page change from pagination
    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        fetchData(itemsPerPage, page)
    }

    // Separate fetch function to be reusable
    const fetchData = async (limit?: string, page?: number) => {
        try {
            setLoading(true)
            setError(null)
            const result = await getData(limit, page)
            setData(result.data)
            setTotalPages(result.totalPages)
        } catch (err) {
            setError('Failed to load data')
            console.error('Error loading data:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Initial data fetch with default items per page and first page
        fetchData(itemsPerPage, currentPage)
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
            
            <DataTable 
                columns={columns} 
                data={data} 
                onItemsPerPageChange={handleItemsPerPageChange}
                onPageChange={handlePageChange}
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
            />
        </div>
    )
}