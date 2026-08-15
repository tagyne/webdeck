import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      data-slot="spinner"
      className={cn("size-4 animate-spin", className)}
      aria-label="Loading"
      role="status"
      {...props}
    />
  )
}

export { Spinner }
