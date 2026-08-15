import * as React from "react"
import type { VariantProps } from "class-variance-authority"

import { Button, buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type LoadingButtonProps = React.ComponentProps<typeof Button> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean
    loadingLabel?: React.ReactNode
  }

function LoadingButton({
  children,
  disabled,
  loading = false,
  loadingLabel,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || loading} {...props}>
      {loading ? <Spinner data-icon="inline-start" /> : null}
      <span aria-live="polite">{loading ? (loadingLabel ?? children) : children}</span>
    </Button>
  )
}

export { LoadingButton }
