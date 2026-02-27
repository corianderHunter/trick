"use client";

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Label,
  Field,
} from "@headlessui/react";
import { SELECT_TRIGGER_BASE } from "@/lib/control-classes";

export type SelectorOption = {
  id: string;
  label: string;
  description?: string;
};

type StyleSelectorProps = {
  label: string;
  options: SelectorOption[];
  value?: string;
  onChange: (id: string) => void;
  placeholder?: string;
  /** 为 true 时标签与下拉同一行，适合放在头部等紧凑区域 */
  inlineLabel?: boolean;
};

const StyleSelector = ({
  label,
  options,
  value,
  onChange,
  placeholder = "请选择",
  inlineLabel = false,
}: StyleSelectorProps) => {
  const selectedOption = options.find((o) => o.id === value) ?? null;

  return (
    <Field className={inlineLabel ? "flex items-center gap-2" : undefined}>
      <Label
        className={
          inlineLabel
            ? "shrink-0 text-sm font-medium text-stone-700 dark:text-stone-300"
            : "mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300"
        }
      >
        {label}
      </Label>
      <Listbox
        value={selectedOption}
        onChange={(opt) => opt && onChange(opt.id)}
        by="id"
      >
        <div className={`relative ${inlineLabel ? "min-w-0 flex-1" : ""}`}>
          <ListboxButton className={`flex w-full items-center justify-between border border-stone-200 bg-white text-left shadow-sm transition-colors hover:border-stone-300 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 dark:border-stone-600 dark:bg-stone-800 dark:hover:border-stone-500 ${SELECT_TRIGGER_BASE}`}>
            <span
              className={
                selectedOption
                  ? "text-stone-900 dark:text-stone-100"
                  : "text-stone-500 dark:text-stone-400"
              }
            >
              {selectedOption?.label ?? placeholder}
            </span>
            <svg
              className="h-5 w-5 shrink-0 text-stone-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </ListboxButton>
          <ListboxOptions
            anchor="bottom"
            transition
            className="z-20 mt-1 max-h-52 w-(--button-width) overflow-auto rounded-lg border border-stone-200 bg-white py-1 shadow-lg transition duration-100 ease-out data-closed:scale-95 data-closed:opacity-0 dark:border-stone-600 dark:bg-stone-800 [--anchor-gap:4px]"
          >
            {options.length === 0 ? (
              <ListboxOption
                value={null}
                disabled
                className="cursor-not-allowed px-3 py-1.5 text-sm text-stone-400 dark:text-stone-500"
              >
                暂无数据
              </ListboxOption>
            ) : (
              options.map((option) => (
                <ListboxOption
                  key={option.id}
                  value={option}
                  className="cursor-pointer px-3 py-1.5 text-sm transition-colors data-focus:bg-stone-50 data-selected:bg-amber-50 data-selected:text-amber-800 dark:data-focus:bg-stone-700 dark:data-selected:bg-amber-900/30 dark:data-selected:text-amber-200"
                >
                  <span className="block font-medium">{option.label}</span>
                  {option.description && (
                    <span className="mt-0.5 block text-xs leading-tight text-stone-500 dark:text-stone-400">
                      {option.description}
                    </span>
                  )}
                </ListboxOption>
              ))
            )}
          </ListboxOptions>
        </div>
      </Listbox>
    </Field>
  );
};

export default StyleSelector;
