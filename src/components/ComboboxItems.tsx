"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

 const itemsPerPageOptions = [
  {
    value: "10",
    label: "10",
  },
  {
    value: "20",
    label: "20",
  },
  {
    value: "30",
    label: "30",
  },
  {
    value: "50",
    label: "50",
  },
  {
    value: "100",
    label: "100",
  },
  {
    value: "300",
    label: "300",
  },
  {
    value: "500",
    label: "500",
  },
  {
    value: "1000",
    label: "1K",
  },
  {
    value: "5000",
    label: "5K",
  },
  {
    value: "10000",
    label: "10K",
  },
]

export function ComboboxItems({ onValueChange, value: initialValue }: { onValueChange?: (value: string) => void, value?: string }) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(initialValue || "10") // Use passed value or default to 10

  // Update local value when initialValue prop changes
  React.useEffect(() => {
    if (initialValue) {
      setValue(initialValue)
    }
  }, [initialValue])

  const handleValueChange = (currentValue: string) => {
    const newValue = currentValue === value ? "" : currentValue
    setValue(newValue)
    setOpen(false)
    // Call the callback function to notify parent component
    if (onValueChange) {
      onValueChange(newValue)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[70px] justify-between"
        >
          {value
            ? itemsPerPageOptions.find((itemsPerPageOptions) => itemsPerPageOptions.value === value)?.label
            : "Select Items Per Page..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandEmpty>No items found.</CommandEmpty>
            <CommandGroup>
              {itemsPerPageOptions.map((itemsPerPageOptions) => (
                <CommandItem
                  key={itemsPerPageOptions.value}
                  value={itemsPerPageOptions.value}
                  onSelect={handleValueChange}
                >
                  {itemsPerPageOptions.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === itemsPerPageOptions.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}