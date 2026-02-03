import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "../../lib/utils";
const Progress = React.forwardRef(({ className, value = 0, ...props }, ref) => {
    return (_jsx(ProgressPrimitive.Root, { ref: ref, className: cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className), ...props, children: _jsx(ProgressPrimitive.Indicator, { className: "h-full w-full flex-1 rounded-full bg-primary transition-[transform] duration-300", style: { transform: `translateX(-${100 - Math.max(0, Math.min(100, value))}%)` } }) }));
});
Progress.displayName = "Progress";
export { Progress };
