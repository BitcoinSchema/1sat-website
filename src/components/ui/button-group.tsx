import * as React from "react"
import { cn } from "@/lib/utils"

const ButtonGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    orientation?: "horizontal" | "vertical"
  }
>(({ className, orientation = "horizontal", ...props }, ref) => (
  <div
    ref={ref}
    role="group"
    className={cn(
      "inline-flex",
      orientation === "horizontal" ? "flex-row" : "flex-col",
      "[&>button]:rounded-none",
      "[&>button:first-child]:rounded-l-md",
      "[&>button:last-child]:rounded-r-md",
      orientation === "vertical" && "[&>button:first-child]:rounded-t-md [&>button:first-child]:rounded-l-none",
      orientation === "vertical" && "[&>button:last-child]:rounded-b-md [&>button:last-child]:rounded-r-none",
      className
    )}
    {...props}
  />
))
ButtonGroup.displayName = "ButtonGroup"

const ButtonGroupSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    orientation?: "horizontal" | "vertical"
  }
>(({ className, orientation = "horizontal", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-border",
      orientation === "horizontal" ? "w-px h-full" : "h-px w-full",
      className
    )}
    {...props}
  />
))
ButtonGroupSeparator.displayName = "ButtonGroupSeparator"

const ButtonGroupText = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center px-3 text-sm",
      className
    )}
    {...props}
  />
))
ButtonGroupText.displayName = "ButtonGroupText"

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText }
