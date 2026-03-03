/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
// @ts-check

const DEFAULT_DESTINATION_URL = new URL('https://www.google.com/search')
for (
	const [key, value] of Object.entries({
		q: 'weather',
		// typical of real search, user types "weat" and Google autocompletes to "weather"
		oq: 'weat',
		// no rlz param as it's location specific
		// // &rlz=1C1ONGR_en-GBGB928GB928
		// spoofed gs_lcrp param to make it look like a real Google search but without including any personally identifiable information that could lead to incorrectly personalized search results
		gs_lcrp:
			'QuGumbVhrAgGp506luAMocczYiLrHFruM5XzfAl2x6ld71N4OKZP8E0ZdCzrJY1UqE28GODxHPH4KIuCaqDw0a4R0DqLQGaHAJ9EKi6BDYAbFjoAfGubyZvoGbFs5gLMAAfQo6bMPvXwvFE2ufDlcaw4pRWTjDABr5t4VyA5NxCzQ6wXAZit32qLaherAQ',
		// this is hidden behind the long gs_lcrp param but is a common param in Google search URLs
		sourceid: 'chrome',
		// some legacy param for IE I guess?
		ie: 'UTF-8',
	})
) {
	DEFAULT_DESTINATION_URL.searchParams.set(key, value)
}

/** @type {((this: QuickExitButton) => void)[]} */
const teardowns = [
	() => {
		// Immediately clear page content and use a fake title in case of slow
		// internet or if the destination URL fails to load
		document.head.innerHTML = '<title>Google</title>'
		document.body.innerHTML = ''
	},
	function () {
		// Use replace() to obscure history so back button fails
		globalThis.location.replace(this.destinationUrl)
	},
]

/** @param {QuickExitButton} x */
function teardown(x) {
	/** @type {unknown[]} */
	const errs = []
	for (const fn of teardowns) {
		try {
			fn.call(x)
		} catch (e) {
			// Ignore errors for now and throw later
			errs.push(e)
		}
	}

	if (errs.length) {
		if (typeof AggregateError === 'function') {
			throw new AggregateError(errs, 'Errors occurred during teardown')
		} else {
			throw errs[0]
		}
	}
}

class QuickExitButton extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({ mode: 'open' })
	}

	static get observedAttributes() {
		return ['url', 'label', 'theme']
	}

	/**
	 * @param {string} _name
	 * @param {string} oldValue
	 * @param {string} newValue
	 */
	attributeChangedCallback(_name, oldValue, newValue) {
		if (oldValue !== newValue) {
			if (this.isConnected) {
				this.render()
			}
		}
	}

	connectedCallback() {
		this.render()
		this.setupWindowListeners()
	}

	disconnectedCallback() {
		this.cleanupWindowListeners()
	}

	setupWindowListeners() {
		if (this._handleKeydown) return // Prevent double binding
		/** @type {null | ((e: KeyboardEvent) => void)} */
		this._handleKeydown = (e) => {
			if (e.key === 'Escape') {
				this.exit()
			}
		}
		globalThis.addEventListener('keydown', this._handleKeydown)
	}

	cleanupWindowListeners() {
		if (this._handleKeydown) {
			globalThis.removeEventListener('keydown', this._handleKeydown)
			this._handleKeydown = null
		}
	}

	get destinationUrl() {
		return this.getAttribute('url') ?? DEFAULT_DESTINATION_URL.href
	}

	get buttonLabel() {
		return this.getAttribute('label') ?? 'Quick Exit (Esc)'
	}

	get themeColor() {
		const theme = this.getAttribute('theme') ?? 'red'
		/** @type {{ default: string } & Partial<Record<string, string>>} */
		const themes = {
			default: '#d32f2f', // Red
			red: '#d32f2f',
			orange: '#f57c00', // High visibility orange
			blue: '#1976d2', // Neutral but distinct blue
		}
		return themes[theme] ?? themes.default
	}

	exit() {
		try {
			teardown(this)
		} catch (_e) {
			// Fallback
			globalThis.location.assign(this.destinationUrl)
		}
	}

	render() {
		const { shadowRoot } = this
		assert(shadowRoot != null)

		const style = `
			:host {
				position: fixed;
				bottom: 20px;
				right: 20px;
				z-index: 2147483647;
			}
			button {
				background-color: ${this.themeColor};
				color: white;
				border: none;
				border-radius: 4px;
				padding: 12px 24px;
				font-size: 16px;
				font-weight: bold;
				cursor: pointer;
				box-shadow: 0 4px 6px rgba(0,0,0,0.1);
				text-transform: uppercase;
			}
			button:hover {
				filter: brightness(110%);
				transform: translateY(-1px);
				box-shadow: 0 6px 8px rgba(0,0,0,0.15);
			}
			
			@media (max-width: 600px) {
				:host {
					bottom: 10px;
					right: 10px;
					left: 10px;
					width: auto;
				}
				button {
					width: 100%;
					padding: 14px;
				}
			}
		`

		shadowRoot.innerHTML = `
			<style>${style}</style>
			<button part="button">${this.buttonLabel}</button>
		`

		const $button = shadowRoot.querySelector('button')
		assert($button != null)
		$button.addEventListener('click', () => this.exit())
	}
}

if (!customElements.get('quick-exit-button')) {
	customElements.define('quick-exit-button', QuickExitButton)
}

/**
 * @param {boolean} condition
 * @param {string} [message]
 * @returns {asserts condition}
 */
function assert(condition, message) {
	if (!condition) {
		throw new AssertionError(message ?? 'Assertion failed')
	}
}

class AssertionError extends Error {
	/** @override */
	name = 'AssertionError'
}
