import { InventorySectionCards } from "@/components/inventory-section-cards"
import { InventoryLineChart } from "@/components/inventory-line-chart"
import { InventoryActionCard } from "@/components/inventory-action-card"


export default function InventoryIndexPage() {
  return (
    <div className="space-y-6">
      <InventorySectionCards />
      <div className="px-4 lg:px-6">
        <InventoryLineChart />
      </div>
      <div className="px-4 lg:px-6">
        <InventoryActionCard />
      </div>
    </div>
  )
}
