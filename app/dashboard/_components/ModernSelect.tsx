"use client";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, Check } from "lucide-react";
import React from "react";

interface ModernSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export function ModernSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  className = "",
}: ModernSelectProps) {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger
        className={`inline-flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-50 focus:border-orange-400 data-[placeholder]:text-gray-500 ${className}`}
        aria-label={placeholder}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon asChild>
          <ChevronDown size={16} className="text-gray-500 opacity-50" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          position="popper"
          sideOffset={8}
        >
          <Select.ScrollUpButton className="flex h-6 cursor-default items-center justify-center bg-white text-gray-700" />

          <Select.Viewport className="p-1">
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="relative flex h-8 sm:h-9 select-none items-center px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded cursor-pointer outline-none hover:bg-orange-50 focus:bg-orange-50 data-[highlighted]:bg-orange-50 transition-colors data-[state=checked]:bg-orange-100 data-[state=checked]:text-orange-700 data-[state=checked]:font-medium"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator asChild>
                  <Check size={16} className="ml-auto flex-shrink-0 text-orange-500" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>

          <Select.ScrollDownButton className="flex h-6 cursor-default items-center justify-center bg-white text-gray-700" />
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
