import en from './locales/en.json' with { type: 'json' }

export type I18nKey = keyof typeof en
export const i18nKeys = Object.keys(en) as I18nKey[]

export function getString(key: I18nKey, $el: Element) {
	return $el.getAttribute(key) ?? en[key]
}
