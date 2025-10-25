import { useState, useEffect } from "react"
import { columns, type Sale } from "./sales-columns"
import { SalesDataTable } from "./sales-table"
import { AddSalesCard } from "./add-sales-card"

// Function for fetching sales data from API with server-side pagination
async function getSalesData(limit: string = "10", page: number = 1): Promise<{ data: Sale[], totalPages: number, totalElements: number }> {
  try {
    // Convert page from 1-based to 0-based for API
    const apiPage = page - 1
    const size = parseInt(limit)
    
    const response = await fetch(`https://ae8aa5699e02.ngrok-free.app/api/inventory/transactions?page=${apiPage}&size=${size}&types=SALE`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('Sales API Response:', data) // Debug log
    
    // Handle the API response structure
    let transactions = []
    let totalPages = 1
    let totalElements = 0
    
    if (Array.isArray(data)) {
      transactions = data
      totalElements = data.length
      totalPages = Math.ceil(totalElements / size)
    } else if (data && Array.isArray(data.content)) {
      transactions = data.content
      totalPages = data.totalPages || 1
      totalElements = data.totalElements || transactions.length
    } else if (data && Array.isArray(data.data)) {
      transactions = data.data
      totalPages = data.totalPages || 1
      totalElements = data.totalElements || transactions.length
    } else if (data && Array.isArray(data.transactions)) {
      transactions = data.transactions
      totalPages = data.totalPages || 1
      totalElements = data.totalElements || transactions.length
    } else {
      console.warn('Sales API response is not in expected format:', data)
      transactions = []
    }
    
    // Transform API data to match Sale interface
    const sales: Sale[] = transactions.map((transaction: any) => ({
      id: transaction.id || transaction.transactionId || `tx_${Date.now()}_${Math.random()}`,
      productName: transaction.productName || transaction.product?.name || 'Unknown Product',
      sku: transaction.sku || transaction.product?.sku || 'N/A',
      quantity: transaction.quantityChange || transaction.quantity || 0,
      unitPrice: transaction.unitPrice || transaction.transactionAmount || 0,
      totalAmount: (transaction.quantityChange || transaction.quantity || 0) * (transaction.unitPrice || transaction.transactionAmount || 0),
      warehouseName: transaction.warehouseName || transaction.warehouse?.name || 'Unknown Warehouse',
      transactionDate: transaction.transactionDate || transaction.createdAt || new Date().toISOString(),
      supplier: transaction.customer || transaction.reference || 'Unknown Customer',
      transactionType: transaction.type || transaction.transactionType || 'SALE'
    }))
    
    console.log(`Fetched page ${page} with ${sales.length} items. Total pages: ${totalPages}, Total elements: ${totalElements}`)
    
    return {
      data: sales,
      totalPages,
      totalElements
    }
  } catch (error) {
    console.error('Error fetching sales data:', error)
    return {
      data: [],
      totalPages: 1,
      totalElements: 0
    }
  }
}

export function SalesCards() {
  const [data, setData] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [itemsPerPage, setItemsPerPage] = useState<string>("10")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)

  // Function to handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(value)
    setCurrentPage(1)
    fetchData(value, 1)
  }

  // Function to handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchData(itemsPerPage, page)
  }

  // Function to fetch sales data
  const fetchData = async (limit: string = "10", page: number = 1) => {
    try {
      setLoading(true)
      setError(null)
      const result = await getSalesData(limit, page)
      setData(result.data)
      setTotalPages(result.totalPages)
    } catch (err) {
      setError('Failed to load sales data')
      console.error('Error loading sales data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Function to refresh data after new sale is added
  const handleSaleAdded = () => {
    fetchData(itemsPerPage, currentPage)
  }

  useEffect(() => {
    fetchData(itemsPerPage, currentPage)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-lg">Loading sales data...</div>
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
    <div className="w-full h-full min-h-screen p-4 space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Sales</h1>
        <p className="text-muted-foreground">Add new sales and view recent sales transactions</p>
      </div>

      {/* Add Sale Card */}
      <AddSalesCard onSaleAdded={handleSaleAdded} />

      {/* Recent Sales Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Sales</h2>
        <SalesDataTable 
          columns={columns} 
          data={data} 
          onItemsPerPageChange={handleItemsPerPageChange}
          onPageChange={handlePageChange}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  )
}
