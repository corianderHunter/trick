"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const TIP_VIEWPORT_PADDING = 8;
const TIP_GAP = 8;
const TIP_WIDTH_PX = 288;
const TIP_HEIGHT_ESTIMATE_PX = 140;

export type TipPlacement = "top" | "bottom" | "left" | "right";

function computeTipPlacement(anchorRect: DOMRect): {
  top: number;
  left: number;
  placement: TipPlacement;
} {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cx = anchorRect.left + anchorRect.width / 2;
  const cy = anchorRect.top + anchorRect.height / 2;
  const pad = TIP_VIEWPORT_PADDING;
  const gap = TIP_GAP;
  const W = TIP_WIDTH_PX;
  const H = TIP_HEIGHT_ESTIMATE_PX;

  const fitsTop = anchorRect.top - gap - H >= pad;
  const fitsBottom = anchorRect.bottom + gap + H <= vh - pad;
  const fitsLeft = anchorRect.left - gap - W >= pad;
  const fitsRight = anchorRect.right + gap + W <= vw - pad;

  let placement: TipPlacement;
  let top: number;
  let left: number;

  if (fitsTop) {
    placement = "top";
    top = anchorRect.top - gap;
    left = Math.max(pad + W / 2, Math.min(vw - pad - W / 2, cx));
  } else if (fitsBottom) {
    placement = "bottom";
    top = anchorRect.bottom + gap;
    left = Math.max(pad + W / 2, Math.min(vw - pad - W / 2, cx));
  } else if (fitsRight) {
    placement = "right";
    left = anchorRect.right + gap;
    top = Math.max(pad + H / 2, Math.min(vh - pad - H / 2, cy));
  } else if (fitsLeft) {
    placement = "left";
    left = anchorRect.left - gap;
    top = Math.max(pad + H / 2, Math.min(vh - pad - H / 2, cy));
  } else {
    placement = "top";
    top = Math.max(pad + H, Math.min(vh - pad, anchorRect.top - gap));
    left = Math.max(pad + W / 2, Math.min(vw - pad - W / 2, cx));
  }

  return { top, left, placement };
}

const PLACEMENT_TRANSFORM: Record<TipPlacement, string> = {
  top: "-translate-x-1/2 -translate-y-full",
  bottom: "-translate-x-1/2",
  left: "-translate-x-full -translate-y-1/2",
  right: "-translate-y-1/2",
};

const ARROW_CLASS: Record<TipPlacement, string> = {
  top: "left-1/2 top-full -translate-x-1/2 border-t-white dark:border-t-stone-800",
  bottom:
    "left-1/2 bottom-full -translate-x-1/2 translate-y-full border-b-white dark:border-b-stone-800",
  left: "left-full top-1/2 -translate-y-1/2 border-l-white dark:border-l-stone-800",
  right:
    "right-full top-1/2 -translate-y-1/2 border-r-white dark:border-r-stone-800",
};

type ViewportTipProps = {
  /** 悬浮框内容（文案或 ReactNode） */
  content: React.ReactNode;
  /** 触发 tip 的元素（如信息图标），悬停时显示 */
  children: React.ReactNode;
  /** 触发元素外层 className */
  triggerClassName?: string;
  /** 触发元素激活时 className（如高亮图标） */
  triggerActiveClassName?: string;
};

export function ViewportTip({
  content,
  children,
  triggerClassName = "",
  triggerActiveClassName = "text-amber-500 dark:text-amber-400",
}: ViewportTipProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    placement: TipPlacement;
  } | null>(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const el = anchorRef.current;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setPos(computeTipPlacement(rect));
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      obs.disconnect();
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  return (
    <>
      <span
        ref={anchorRef}
        className={`relative ${triggerClassName}`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <span className={open ? triggerActiveClassName : ""}>{children}</span>
      </span>
      {open &&
        pos &&
        createPortal(
          <div
            className={`fixed z-100 w-72 rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-left text-xs text-stone-600 shadow-lg dark:border-stone-600 dark:bg-stone-800 dark:text-stone-300 ${PLACEMENT_TRANSFORM[pos.placement]}`}
            style={{ top: pos.top, left: pos.left }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
          >
            {content}
            <span
              className={`absolute border-[6px] border-transparent ${ARROW_CLASS[pos.placement]}`}
            />
          </div>,
          document.body
        )}
    </>
  );
}
