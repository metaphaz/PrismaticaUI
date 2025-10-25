"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import PrismAgentsIcon from "@/assets/PrismAgents.jpeg"

export function InventoryActionCard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [insights, setInsights] = useState("")
  const [displayedText, setDisplayedText] = useState("")

  const handleGetInsights = async () => {
    setIsDialogOpen(true)
    setIsLoading(true)
    setInsights("")
    setDisplayedText("")

    try {
      // Replace with your actual API endpoint
      const response = await fetch('https://ae8aa5699e02.ngrok-free.app/api/ai/generate-inventory-summary', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      })

      if (response.ok) {
        const insightText = await response.text() // Get text instead of JSON
        setInsights(insightText)
        
        // Animate text display
        let currentIndex = 0
        const animateText = () => {
          if (currentIndex < insightText.length) {
            setDisplayedText(insightText.substring(0, currentIndex + 1))
            currentIndex++
            setTimeout(animateText, 20) // Faster speed (20ms per character)
          }
        }
        animateText()
      } else {
        setInsights("Sorry, we couldn't fetch insights at the moment. Please try again later.")
        setDisplayedText("Sorry, we couldn't fetch insights at the moment. Please try again later.")
      }
    } catch (error) {
      console.error('Error fetching insights:', error)
      setInsights("An error occurred while fetching insights. Please check your connection and try again.")
      setDisplayedText("An error occurred while fetching insights. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <>
      <Card className="w-full">
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            {/* Image as standalone element */}
            <div className="flex-shrink-0">
              <img 
                src={PrismAgentsIcon} 
                alt="Prism Agents" 
                className="max-w-64 max-h-48 rounded-lg object-contain"
              />
            </div>
            
            {/* Content section */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-4xl font-semibold text-foreground">
                    Optimize Inventory Management
                  </h3>
                  <p className="text-lg text-muted-foreground">
                    Get AI-powered insights to improve your inventory turnover rate
                  </p>
                  <p className="text-lg text-muted-foreground">
                    Reduce costs and increase efficiency with smart recommendations
                  </p>
                </div>
                
                {/* Button positioned bottom right */}
                <div className="flex-shrink-0 self-end">
                  <Button 
                    size="lg" 
                    className="ml-4 text-xl"
                    onClick={handleGetInsights}
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : "Get Insights"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[1400px] h-[70vh] max-h-none">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">
              AI Inventory Insights
            </DialogTitle>
            <DialogDescription>
              AI-powered recommendations for your inventory management
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 p-6 bg-muted/50 rounded-lg h-[calc(70vh-120px)] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-muted-foreground">Analyzing your inventory data...</span>
              </div>
            ) : (
              <div className="text-lg leading-relaxed prose prose-lg max-w-none dark:prose-invert">
                <ReactMarkdown 
                  components={{
                    h1: ({children}) => <h1 className="text-3xl font-bold mb-4 text-foreground">{children}</h1>,
                    h2: ({children}) => <h2 className="text-2xl font-semibold mb-3 text-foreground">{children}</h2>,
                    h3: ({children}) => <h3 className="text-xl font-semibold mb-2 text-foreground">{children}</h3>,
                    p: ({children}) => <p className="mb-3 text-lg text-foreground">{children}</p>,
                    strong: ({children}) => <strong className="font-bold text-foreground">{children}</strong>,
                    ul: ({children}) => <ul className="list-disc pl-6 mb-3">{children}</ul>,
                    li: ({children}) => <li className="mb-2 text-lg text-foreground">{children}</li>,
                  }}
                >
                  {displayedText}
                </ReactMarkdown>
                {displayedText.length < insights.length && (
                  <span className="animate-pulse">|</span>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
