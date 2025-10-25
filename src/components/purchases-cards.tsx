import { useState, useEffect } from "react"
import { columns, type Purchase } from "./purchases-columns"
import { PurchasesDataTable } from "./purchases-table"
import { AddPurchaseCard } from "./add-purchase-card"

// Function for fetching purchases data from API
async function getPurchasesData(_limit?: string, _page?: number): Promise<{ data: Purchase[], totalPages: number }> {
  try {
    const response = await fetch(`https://ae8aa5699e02.ngrok-free.app/api/inventory/transactions?page=0&size=1000000&types=PURCHASE`, {
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
    console.log('Purchases API Response:', data) // Debug log
    
    // Handle the API response structure
    let transactions = []
    if (Array.isArray(data)) {
      transactions = data
    } else if (data && Array.isArray(data.content)) {
      transactions = data.content
    } else if (data && Array.isArray(data.data)) {
      transactions = data.data
    } else if (data && Array.isArray(data.transactions)) {
      transactions = data.transactions
    } else {
      console.warn('Purchases API response is not in expected format:', data)
      transactions = []
    }
    
    // Transform API data to match Purchase interface
    const purchases: Purchase[] = transactions.map((transaction: any) => ({
      id: transaction.id || transaction.transactionId || `tx_${Date.now()}_${Math.random()}`,
      productName: transaction.productName || transaction.product?.name || 'Unknown Product',
      sku: transaction.sku || transaction.product?.sku || 'N/A',
      quantity: transaction.quantityChange || transaction.quantity || 0,
      unitPrice: transaction.unitPrice || transaction.transactionAmount || 0,
      totalAmount: (transaction.quantityChange || transaction.quantity || 0) * (transaction.unitPrice || transaction.transactionAmount || 0),
      warehouseName: transaction.warehouseName || transaction.warehouse?.name || 'Unknown Warehouse',
      transactionDate: transaction.transactionDate || transaction.createdAt || new Date().toISOString(),
      supplier: transaction.supplier || transaction.reference || 'Unknown Supplier',
      transactionType: transaction.type || transaction.transactionType || 'PURCHASE'
    }))
    
    return {
      data: purchases,
      totalPages: 1 // Since we're fetching all data at once
    }
  } catch (error) {
    console.error('Error fetching purchases data:', error)
    return {
      data: [],
      totalPages: 1
    }
  }
}

export function PurchasesCards() {
  const [data, setData] = useState<Purchase[]>([])
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

  // Function to fetch purchases data
  const fetchData = async (limit?: string, page?: number) => {
    try {
      setLoading(true)
      setError(null)
      const result = await getPurchasesData(limit, page)
      setData(result.data)
      setTotalPages(result.totalPages)
    } catch (err) {
      setError('Failed to load purchases data')
      console.error('Error loading purchases data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Function to refresh data after new purchase is added
  const handlePurchaseAdded = () => {
    fetchData(itemsPerPage, currentPage)
  }

  useEffect(() => {
    fetchData(itemsPerPage, currentPage)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-lg">Loading purchases data...</div>
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
        <h1 className="text-2xl font-bold">Purchases</h1>
        <p className="text-muted-foreground">Add new purchases and view recent purchase transactions</p>
      </div>
      
      {/* Add Purchase Card */}
      <AddPurchaseCard onPurchaseAdded={handlePurchaseAdded} />
      
      {/* Recent Purchases Table */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Purchases</h2>
        <PurchasesDataTable 
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
