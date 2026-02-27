/**
 * 统一按钮、下拉等控件的尺寸规格，保证视觉一致。
 * 使用相同 padding / 字号，使并排的按钮与下拉高度一致。
 */

/** 标准控件内边距：与下拉触发器、主次按钮一致 */
export const CONTROL_PADDING = 'px-4 py-2.5'

/** 标准控件文字：与按钮、下拉一致 */
export const CONTROL_TEXT = 'text-sm font-medium'

/** 标准圆角 */
export const CONTROL_ROUNDED = 'rounded-lg'

/** 主按钮基础样式（不含颜色），可与 CONTROL_PADDING / CONTROL_TEXT 组合 */
export const BUTTON_BASE = `${CONTROL_ROUNDED} ${CONTROL_PADDING} ${CONTROL_TEXT}`

/** 下拉触发器与按钮同高：与 BUTTON_BASE 一致 */
export const SELECT_TRIGGER_BASE = `${CONTROL_ROUNDED} ${CONTROL_PADDING} ${CONTROL_TEXT}`
