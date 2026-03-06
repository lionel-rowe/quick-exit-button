const LS_PREFIX = 'quickExitButton'

type Data = {
	safetyInfoClosed: boolean
}

export const ls = {
	set<K extends keyof Data>(key: K, value: Data[K]) {
		localStorage.setItem(`${LS_PREFIX}::${key}`, JSON.stringify(value))
	},

	get<K extends keyof Data>(key: K): Data[K] | undefined {
		const item = localStorage.getItem(`${LS_PREFIX}::${key}`)
		if (item == null) return undefined
		try {
			return JSON.parse(item) as Data[K]
		} catch (e) {
			console.error(e)
			return undefined
		}
	},
}
