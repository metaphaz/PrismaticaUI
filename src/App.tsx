import { Routes, Route } from "react-router-dom"
import Layout from "./layouts/layout"
import InventoryIndexPage from "./pages/InventoryIndex"
import InventoryProductsIndex from "./pages/InventoryProductsIndex"
import InventoryStockIndexPage from "./pages/InventoryStockIndex"
import PurchasesIndexPage from "./pages/PurchasesIndex"
import SalesIndexPage from "./pages/InventorySalesIndex"
import BranchesIndexPage from "./pages/InventoryBranchesIndex"
import BranchDetailsIndex from "./pages/BranchDetailsIndex"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><InventoryIndexPage /></Layout>} />
      <Route path="/products" element={<Layout><InventoryProductsIndex /></Layout>} />
      <Route path="/stock" element={<Layout><InventoryStockIndexPage /></Layout>} />
      <Route path="/purchases" element={<Layout><PurchasesIndexPage /></Layout>} />
      <Route path="/sales" element={<Layout><SalesIndexPage /></Layout>} />
      <Route path="/branches" element={<Layout><BranchesIndexPage /></Layout>} />
      <Route path="/branches/:branchId" element={<Layout><BranchDetailsIndex /></Layout>} />
    </Routes>
  )
}
