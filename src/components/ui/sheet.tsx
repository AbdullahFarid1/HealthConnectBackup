"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  );
}

export function SheetContent({
  className,
  children,
  side = "left",
  onClose,
}: {
  className?: string;
  children: React.ReactNode;
  side?: "left" | "right";
  onClose: () => void;
}) {
  return (
    <div
      className={cn(
        "fixed top-0 z-50 flex h-full w-72 flex-col bg-background shadow-2xl transition-transform duration-300",
        side === "left" ? "left-0" : "right-0",
        className
      )}
    >
      <button
        onClick={onClose}
        className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      {children}
    </div>
  );
}
