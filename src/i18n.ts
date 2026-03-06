import en from './locales/en.json' with { type: 'json' }

export type I18nData = typeof en

export type I18nKey = keyof I18nData
export const i18nKeys = Object.freeze(Object.keys(en)) as readonly I18nKey[]

export function getString(key: I18nKey, translations: Partial<I18nData>) {
	return Object.hasOwn(translations, key) ? translations[key] ?? en[key] : en[key]
}

type TextInfo = { direction: 'ltr' | 'rtl' }

export function getTextInfoFromLocale(locale: string | Intl.Locale): TextInfo {
	const loc = new Intl.Locale(locale) as Intl.Locale & {
		textInfo?: TextInfo
		getTextInfo?(): TextInfo
	}

	const textInfo = loc.getTextInfo?.() ?? loc.textInfo
	if (textInfo != null) return textInfo

	const { script } = loc.maximize()
	return { direction: script === 'Arab' || script === 'Hebr' ? 'rtl' : 'ltr' }
}
