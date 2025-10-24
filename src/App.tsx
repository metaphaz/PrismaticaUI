import { Routes, Route } from "react-router-dom"
import Layout from "./layouts/layout"
import IndexPage from "./pages/Index"
import InventoryIndexPage from "./pages/InventoryIndex"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><IndexPage /></Layout>} />
      <Route path="/inventory" element={<Layout><InventoryIndexPage /></Layout>} />
    </Routes>
  )
}
