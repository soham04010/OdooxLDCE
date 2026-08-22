"use client";

import { useState } from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * A themed replacement for `<input type="date">`.
 *
 * The native date input paints its calendar as browser chrome, which no
 * stylesheet can reach — hence the mismatched square popup. This renders
 * the shadcn Calendar inside a Popover instead, so it picks up the brand
 * palette, the radius scale and the popover animation.
 *
 * Value is always the ISO `yyyy-MM-dd` string the API expects. Pass `name`
 * to keep it working with plain FormData submits (a hidden input carries
 * the value); pass `value` / `onChange` for controlled use. Both together
 * is fine.
 */
export function DatePicker({
  value,
  onChange,
  name,
  id,
  placeholder = "Pick a date",
  required = false,
  disabled = false,
  className,
}: {
  value?: string;
  onChange?: (isoDate: string) => void;
  name?: string;
  id?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState("");

  // Controlled when a value prop is supplied, uncontrolled otherwise.
  const current = value ?? internal;

  const selected = (() => {
    if (!current) return undefined;
    const d = parse(current, "yyyy-MM-dd", new Date());
    return isValid(d) ? d : undefined;
  })();

  const commit = (date: Date | undefined) => {
    const iso = date ? format(date, "yyyy-MM-dd") : "";
    if (value === undefined) setInternal(iso);
    onChange?.(iso);
    if (date) setOpen(false);
  };

  return (
    <>
      {name && (
        <input type="hidden" name={name} value={current} required={required} />
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              id={id}
              disabled={disabled}
              aria-label={selected ? format(selected, "d MMMM yyyy") : placeholder}
              className={cn(
                "flex h-11 w-full items-center justify-between rounded-lg border border-border bg-background px-3 text-sm transition",
                "hover:border-ring focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                "disabled:pointer-events-none disabled:opacity-50",
                !selected && "text-muted-foreground",
                className
              )}
            >
              <span>
                {selected ? format(selected, "d MMM yyyy") : placeholder}
              </span>
              <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          }
        />

        <PopoverContent className="w-auto overflow-hidden rounded-xl p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={commit}
            defaultMonth={selected}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </>
  );
}
