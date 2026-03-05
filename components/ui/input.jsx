import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-lg border px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 transition-colors border-[var(--border-primary)] bg-[var(--input-bg)] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--text-muted)] focus-visible:ring-[var(--text-muted)]",
        className
      )}
      ref={ref}
      {...props} />
  );
})
Input.displayName = "Input"

export { Input }
