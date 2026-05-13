"use client";

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type MouseEvent,
} from "react";
import { cn } from "@/lib/utils";

type DropdownContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerId: string;
};

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdownContext() {
  const context = useContext(DropdownContext);

  if (!context) {
    throw new Error("DropdownMenu components must be used within DropdownMenu");
  }

  return context;
}

function composeHandlers<T extends MouseEvent<HTMLElement>>(first?: (event: T) => void, second?: (event: T) => void) {
  return (event: T) => {
    first?.(event);
    if (!event.defaultPrevented) {
      second?.(event);
    }
  };
}

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerId = useMemo(() => `dropdown-trigger-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    const onClose = () => setOpen(false);
    window.addEventListener("keydown", onClose);
    return () => window.removeEventListener("keydown", onClose);
  }, []);

  return <DropdownContext.Provider value={{ open, setOpen, triggerId }}>{children}</DropdownContext.Provider>;
}

export function DropdownMenuTrigger({ asChild = false, children }: { asChild?: boolean; children: ReactNode }) {
  const { open, setOpen, triggerId } = useDropdownContext();

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<HTMLAttributes<HTMLElement>>;

    return cloneElement(child, {
      id: child.props.id || triggerId,
      onClick: composeHandlers(child.props.onClick, () => setOpen(!open)),
      "aria-expanded": open,
      "aria-haspopup": true,
    });
  }

  return (
    <button type="button" id={triggerId} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({ align = "start", className, children }: HTMLAttributes<HTMLDivElement> & { align?: "start" | "end" }) {
  const { open } = useDropdownContext();

  if (!open) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute z-50 mt-2 min-w-56 rounded-md border border-border bg-card p-1 shadow-lg",
        align === "end" && "right-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ asChild = false, className, children, ...props }: HTMLAttributes<HTMLDivElement> & { asChild?: boolean }) {
  const { setOpen } = useDropdownContext();

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<HTMLAttributes<HTMLElement>>;

    return cloneElement(child, {
      onClick: composeHandlers(child.props.onClick, () => setOpen(false)),
    });
  }

  return (
    <div
      role="menuitem"
      className={cn("cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted", className)}
      onClick={() => setOpen(false)}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className, ...props }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={cn("my-1 border-border", className)} {...props} />;
}
