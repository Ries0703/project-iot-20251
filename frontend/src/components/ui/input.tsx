import * as React from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  showSpinner?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, showSpinner, ...props }, ref) => {
    // Internal ref to handle stepUp/stepDown
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Merge external ref with internal ref
    React.useImperativeHandle(ref, () => inputRef.current!)

    const handleStep = (direction: 1 | -1) => {
      if (inputRef.current) {
        // Native stepUp updates the input value
        inputRef.current.stepUp(direction)

        // React 16+ hack: standard dispatchEvent doesn't work on controlled inputs
        // because React swallows the event if the value setter wasn't called.
        // We have to forcefully call the native value setter to notify React.
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set

        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(inputRef.current, inputRef.current.value)
        }

        // Now dispatch the event
        inputRef.current.dispatchEvent(new Event("input", { bubbles: true }))
      }
    }

    // Custom Number Input with Styled Spinner
    if (type === "number" && showSpinner) {
      return (
        <div className="relative">
          <input
            type={type}
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              // Hide native spinners
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
              className
            )}
            ref={inputRef}
            {...props}
          />
          <div className="absolute right-0 top-0 h-full flex flex-col border-l border-input">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => { e.preventDefault(); handleStep(1); }}
              className="flex-1 px-2 hover:bg-accent hover:text-accent-foreground border-b border-input flex items-center justify-center h-1/2 text-muted-foreground rounded-tr-md active:bg-accent/80"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => { e.preventDefault(); handleStep(-1); }}
              className="flex-1 px-2 hover:bg-accent hover:text-accent-foreground flex items-center justify-center h-1/2 text-muted-foreground rounded-br-md active:bg-accent/80"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      )
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={inputRef}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
