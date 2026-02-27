"use client";

export type DialogueQuantifyValue = {
  /** 修辞密度 1–5，1=口语化 5=诗性隐喻密集 */
  rhetoricalDensity: number;
  /** 情绪显性度 1–5，1=隐藏 5=外放 */
  emotionalExplicitness: number;
  /** 戏剧张力 1–5 */
  dramaticTension: number;
  /** 节奏结构：碎片 / 平直 / 快节奏 */
  rhythmStructure: "fragment" | "flat" | "fast";
  /** 语域层级，多选 */
  registerLevel: string[];
  /** 叙事显性度 1–5，推进剧情 vs 只表达情绪 */
  narrativeExplicitness: number;
};

const REGISTER_OPTIONS = ["口语", "文艺", "学术", "类型化"] as const;
const RHYTHM_OPTIONS: { value: DialogueQuantifyValue["rhythmStructure"]; label: string }[] = [
  { value: "fragment", label: "碎片" },
  { value: "flat", label: "平直" },
  { value: "fast", label: "快节奏" },
];

const defaultValue: DialogueQuantifyValue = {
  rhetoricalDensity: 3,
  emotionalExplicitness: 3,
  dramaticTension: 3,
  rhythmStructure: "flat",
  registerLevel: [],
  narrativeExplicitness: 3,
};

type ScaleSliderProps = {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (n: number) => void;
};

function ScaleSlider({ label, leftLabel, rightLabel, value, onChange }: ScaleSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-stone-700 dark:text-stone-300">{label}</span>
        <span className="tabular-nums text-amber-600 dark:text-amber-400">{value}</span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-gradient-to-r from-stone-300 via-stone-200 to-amber-400 dark:from-stone-600 dark:via-stone-500 dark:to-amber-500 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-amber-500/30 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-amber-500"
      />
      <div className="flex justify-between text-xs text-stone-500 dark:text-stone-400">
        <span>1 {leftLabel}</span>
        <span>5 {rightLabel}</span>
      </div>
    </div>
  );
}

type DialogueQuantifyProps = {
  value?: Partial<DialogueQuantifyValue> | null;
  onChange: (v: DialogueQuantifyValue) => void;
};

export function DialogueQuantify({ value, onChange }: DialogueQuantifyProps) {
  const v = { ...defaultValue, ...value } as DialogueQuantifyValue;

  const update = (patch: Partial<DialogueQuantifyValue>) => {
    onChange({ ...v, ...patch });
  };

  const toggleRegister = (item: string) => {
    const next = v.registerLevel.includes(item)
      ? v.registerLevel.filter((x) => x !== item)
      : [...v.registerLevel, item];
    update({ registerLevel: next });
  };

  return (
    <div className="space-y-6">
      <ScaleSlider
        label="修辞密度"
        leftLabel="口语化"
        rightLabel="诗性隐喻密集"
        value={v.rhetoricalDensity}
        onChange={(n) => update({ rhetoricalDensity: n })}
      />
      <ScaleSlider
        label="情绪显性度"
        leftLabel="隐藏"
        rightLabel="外放"
        value={v.emotionalExplicitness}
        onChange={(n) => update({ emotionalExplicitness: n })}
      />
      <ScaleSlider
        label="戏剧张力"
        leftLabel="弱"
        rightLabel="强"
        value={v.dramaticTension}
        onChange={(n) => update({ dramaticTension: n })}
      />

      <div className="space-y-2">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">节奏结构</span>
        <div className="flex flex-wrap gap-2">
          {RHYTHM_OPTIONS.map(({ value: val, label: l }) => (
            <button
              key={val}
              type="button"
              onClick={() => update({ rhythmStructure: val })}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${v.rhythmStructure === val
                ? "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-500 dark:bg-amber-900/30 dark:text-amber-200"
                : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 dark:border-stone-600 dark:bg-stone-800 dark:hover:border-stone-500"
                }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">语域层级</span>
        <div className="flex flex-wrap gap-2">
          {REGISTER_OPTIONS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => toggleRegister(item)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${v.registerLevel.includes(item)
                ? "border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-500 dark:bg-amber-900/30 dark:text-amber-200"
                : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 dark:border-stone-600 dark:bg-stone-800 dark:hover:border-stone-500"
                }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <ScaleSlider
        label="叙事显性度"
        leftLabel="只表达情绪"
        rightLabel="推进剧情"
        value={v.narrativeExplicitness}
        onChange={(n) => update({ narrativeExplicitness: n })}
      />
    </div>
  );
}

export { defaultValue as defaultDialogueQuantifyValue };
