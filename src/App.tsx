import { Routes, Route } from "react-router-dom"
import Layout from "./layouts/layout"
import IndexPage from "./pages/Index"
import InventoryIndexPage from "./pages/InventoryIndex"
import InventoryProductsIndex from "./pages/InventoryProductsIndex"
import InventoryStockIndexPage from "./pages/InventoryStockIndex"
import PurchasesIndexPage from "./pages/PurchasesIndex"
import SalesIndexPage from "./pages/InventorySalesIndex"
import BranchesIndexPage from "./pages/InventoryBranchesIndex"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><IndexPage /></Layout>} />
      <Route path="/inventory" element={<Layout><InventoryIndexPage /></Layout>} />
      <Route path="/inventory/products" element={<Layout><InventoryProductsIndex /></Layout>} />
      <Route path="/inventory/stock" element={<Layout><InventoryStockIndexPage /></Layout>} />
      <Route path="/inventory/purchases" element={<Layout><PurchasesIndexPage /></Layout>} />
      <Route path="/inventory/sales" element={<Layout><SalesIndexPage /></Layout>} />
      <Route path="/inventory/branches" element={<Layout><BranchesIndexPage /></Layout>} />
    </Routes>
  )
}
