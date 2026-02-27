"use client";

export type VisualQuantifyValue = {
  /** 色彩饱和度 0–100，暗淡/灰色 — 明亮/鲜艳 */
  colorSaturation: number;
  /** 构图对称性 0–100，不对称 — 对称 */
  compositionSymmetry: number;
  /** 镜头运动：静态 / 推拉 / 跟拍 */
  cameraMovement: "static" | "dolly" | "follow";
  /** 光影强度 0–100 */
  lightShadowIntensity: number;
  /** 景深感 0–100，前景/背景分离 */
  depthOfField: number;
  /** 场景类型，多选 */
  sceneType: string[];
};

const SCENE_OPTIONS = ["室内", "室外", "夜景", "城市", "自然"] as const;
const CAMERA_OPTIONS: { value: VisualQuantifyValue["cameraMovement"]; label: string }[] = [
  { value: "static", label: "静态" },
  { value: "dolly", label: "推拉" },
  { value: "follow", label: "跟拍" },
];

const defaultValue: VisualQuantifyValue = {
  colorSaturation: 50,
  compositionSymmetry: 50,
  cameraMovement: "static",
  lightShadowIntensity: 50,
  depthOfField: 50,
  sceneType: [],
};

type PercentSliderProps = {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (n: number) => void;
};

const sliderTrackClass =
  "h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-stone-300 via-stone-200 to-amber-400 dark:from-stone-600 dark:via-stone-500 dark:to-amber-500 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-amber-500/30 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-amber-500";

function PercentSlider({ label, leftLabel, rightLabel, value, onChange }: PercentSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-stone-700 dark:text-stone-300">{label}</span>
        <span className="tabular-nums text-amber-600 dark:text-amber-400">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={sliderTrackClass}
      />
      <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400">
        <span>0 {leftLabel}</span>
        <span>100 {rightLabel}</span>
      </div>
    </div>
  );
}

type VisualQuantifyProps = {
  value?: Partial<VisualQuantifyValue> | null;
  onChange: (v: VisualQuantifyValue) => void;
};

export function VisualQuantify({ value, onChange }: VisualQuantifyProps) {
  const v = { ...defaultValue, ...value } as VisualQuantifyValue;

  const update = (patch: Partial<VisualQuantifyValue>) => {
    onChange({ ...v, ...patch });
  };

  const toggleScene = (item: string) => {
    const next = v.sceneType.includes(item)
      ? v.sceneType.filter((x) => x !== item)
      : [...v.sceneType, item];
    update({ sceneType: next });
  };

  return (
    <div className="space-y-6">
      <PercentSlider
        label="色彩饱和度"
        leftLabel="暗淡/灰色"
        rightLabel="明亮/鲜艳"
        value={v.colorSaturation}
        onChange={(n) => update({ colorSaturation: n })}
      />
      <PercentSlider
        label="构图对称性"
        leftLabel="不对称"
        rightLabel="对称"
        value={v.compositionSymmetry}
        onChange={(n) => update({ compositionSymmetry: n })}
      />

      <div className="space-y-2">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">镜头运动</span>
        <div className="flex flex-wrap gap-2">
          {CAMERA_OPTIONS.map(({ value: val, label: l }) => (
            <button
              key={val}
              type="button"
              onClick={() => update({ cameraMovement: val })}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${v.cameraMovement === val
                  ? "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-500 dark:bg-amber-900/30 dark:text-amber-200"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 dark:border-stone-600 dark:bg-stone-800 dark:hover:border-stone-500"
                }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <PercentSlider
        label="光影强度"
        leftLabel="弱"
        rightLabel="强"
        value={v.lightShadowIntensity}
        onChange={(n) => update({ lightShadowIntensity: n })}
      />
      <PercentSlider
        label="景深感"
        leftLabel="弱"
        rightLabel="前景/背景分离"
        value={v.depthOfField}
        onChange={(n) => update({ depthOfField: n })}
      />

      <div className="space-y-2">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">场景类型</span>
        <div className="flex flex-wrap gap-2">
          {SCENE_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleScene(item)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${v.sceneType.includes(item)
                  ? "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-500 dark:bg-amber-900/30 dark:text-amber-200"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 dark:border-stone-600 dark:bg-stone-800 dark:hover:border-stone-500"
                }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export { defaultValue as defaultVisualQuantifyValue };
