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
		location.replace(this.destinationUrl)
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
		return [
			'url',
			'label',
			'theme',
			'safety-text',
			'safety-link-text',
			'safety-link-url',
		]
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
		return this.getAttribute('label') ?? 'Quick Exit'
	}

	get shortcutDescription() {
		return this.getAttribute('shortcut-description') ?? 'Or press "Escape" on your keyboard.'
	}

	get safetyText() {
		return this.getAttribute('safety-text') ??
			'The button above will take you to a safe page. Note that it will NOT hide your internet history.'
	}

	get safetyLinkText() {
		return (
			this.getAttribute('safety-link-text') ??
				'Learn how to hide your internet history.'
		)
	}

	get safetyLinkUrl() {
		return (
			this.getAttribute('safety-link-url') ??
				'https://womensaid.org.uk/information-support/what-is-domestic-abuse/cover-your-tracks-online/'
		)
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
			location.assign(this.destinationUrl)
		}
	}

	render() {
		const { shadowRoot } = this
		assert(shadowRoot != null)

		const style = `
			:host {
				position: fixed;
				top: 20px;
				right: 20px;
				z-index: 2147483647;
				display: flex;
				flex-direction: column;
				align-items: flex-end; /* Right aligned stack */
				gap: 5px;
				font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
			}
			button.exit-btn {
				background-color: ${this.themeColor};
				color: white;
				border: none;
				border-radius: 4px;
				padding: 12px 24px;
				font-size: 16px;
				cursor: pointer;
				box-shadow: 0 4px 6px rgba(0,0,0,0.1);
				white-space: nowrap;
			}
			button.exit-btn .main-text {
				font-weight: bold;
				text-transform: uppercase;
			}
			button.exit-btn:hover {
				filter: brightness(110%);
				transform: translateY(-1px);
				box-shadow: 0 6px 8px rgba(0,0,0,0.15);
			}

			/* Info Toggle Button */
			.info-toggle {
				background: none;
				border: none;
				padding: 0;
				cursor: pointer;
				border-radius: 50%;
				width: 32px;
				height: 32px;
				display: flex;
				align-items: center;
				justify-content: center;
				transition: transform 0.2s;
				margin-right: 4px; /* Slight offset alignment tweaks if needed, or remove */
			}
			.info-toggle:hover, .info-toggle:focus {
				transform: scale(1.1);
			}

			.safety-info {
				font-size: 12px;
				background-color: rgba(255, 255, 255, 0.98);
				color: #333;
				padding: 8px 12px;
				border-radius: 4px;
				box-shadow: 0 2px 8px rgba(0,0,0,0.2);
				max-width: 250px;
				text-align: right;
				line-height: 1.4;
				border: 1px solid #ddd;

				/* Hiding mechanism */
				opacity: 0;
				pointer-events: none;
				transform: translateY(-5px);
				transition: opacity 0.2s, transform 0.2s;
				visibility: hidden;
			}

			/* Show tooltip state managed by JS */
			.safety-info.visible {
				opacity: 1;
				pointer-events: auto;
				transform: translateY(0);
				visibility: visible;
			}

			.safety-info span {
				margin-bottom: 4px;
				display: block;
			}
			.safety-info a {
				color: #0066cc;
				text-decoration: underline;
				display: block;
			}

			@media (max-width: 600px) {
				:host {
					top: 10px;
					right: 10px;
					left: 10px;
					width: auto;
					align-items: stretch;
				}
				button.exit-btn {
					width: 100%;
					flex-grow: 1;
					padding: 14px;
				}
				.safety-info {
					max-width: none;
					text-align: center;
					margin-top: 4px;
				}
			}
		`

		shadowRoot.innerHTML = `
			<style>${style}</style>
			<!-- Exit Button First -->
			<button part="button" class="exit-btn">
				<div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
					<span class="main-text">${this.buttonLabel}</span>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M18 6L6 18" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M6 6L18 18" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</div>
				<div>
					<small style="font-size: 0.5em; display: block; margin-top: 4px;">${this.shortcutDescription}</small>
				</div>
			</button>

			<!-- Info Toggle Second (Underneath) -->
			<button class="info-toggle" aria-label="Safety Information" aria-describedby="safety-msg">
				<svg xmlns="http://www.w3.org/2000/svg" version="1.0" viewBox="0 0 200 200" height="32" width="32">
					<!-- Modified from https://en.wikipedia.org/wiki/File:Icon-round-Question_mark.svg (CC0) -->
					<g fill="#1976d2" >
						<path id="path2382" d="m165.33 113.44a103.61 103.61 0 1 1 -207.22 0 103.61 103.61 0 1 1 207.22 0z" transform="matrix(.93739 0 0 .93739 42.143 -6.3392)" stroke-width="0" />
						<g fill="#fff">
							<path d="m100 0c-55.2 0-100 44.8-100 100-5.0495e-15 55.2 44.8 100 100 100s100-44.8 100-100-44.8-100-100-100zm0 12.812c48.13 0 87.19 39.058 87.19 87.188s-39.06 87.19-87.19 87.19-87.188-39.06-87.188-87.19 39.058-87.188 87.188-87.188zm1.47 21.25c-5.45 0.03-10.653 0.737-15.282 2.063-4.699 1.346-9.126 3.484-12.876 6.219-3.238 2.362-6.333 5.391-8.687 8.531-4.159 5.549-6.461 11.651-7.063 18.687-0.04 0.468-0.07 0.868-0.062 0.876 0.016 0.016 21.702 2.687 21.812 2.687 0.053 0 0.113-0.234 0.282-0.937 1.941-8.085 5.486-13.521 10.968-16.813 4.32-2.594 9.808-3.612 15.778-2.969 2.74 0.295 5.21 0.96 7.38 2 2.71 1.301 5.18 3.361 6.94 5.813 1.54 2.156 2.46 4.584 2.75 7.312 0.08 0.759 0.05 2.48-0.03 3.219-0.23 1.826-0.7 3.378-1.5 4.969-0.81 1.597-1.48 2.514-2.76 3.812-2.03 2.077-5.18 4.829-10.78 9.407-3.6 2.944-6.04 5.156-8.12 7.343-4.943 5.179-7.191 9.069-8.564 14.719-0.905 3.72-1.256 7.55-1.156 13.19 0.025 1.4 0.062 2.73 0.062 2.97v0.43h21.598l0.03-2.4c0.03-3.27 0.21-5.37 0.56-7.41 0.57-3.27 1.43-5 3.94-7.81 1.6-1.8 3.7-3.76 6.93-6.47 4.77-3.991 8.11-6.99 11.26-10.125 4.91-4.907 7.46-8.26 9.28-12.187 1.43-3.092 2.22-6.166 2.46-9.532 0.06-0.816 0.07-3.03 0-3.968-0.45-7.043-3.1-13.253-8.15-19.032-0.8-0.909-2.78-2.887-3.72-3.718-4.96-4.394-10.69-7.353-17.56-9.094-4.19-1.062-8.23-1.6-13.35-1.75-0.78-0.023-1.59-0.036-2.37-0.032zm-10.908 103.6v22h21.998v-22h-21.998z" />
						</g>
					</g>
				</svg>
			</button>

			<!-- Safety Info Box (Third) -->
			<div id="safety-msg" class="safety-info">
				<span>${this.safetyText}</span>
				<a href="${this.safetyLinkUrl}" target="_blank" rel="noopener noreferrer">${this.safetyLinkText}</a>
			</div>
		`

		const $toggle = shadowRoot.querySelector('.info-toggle')
		const $info = shadowRoot.querySelector('.safety-info')
		const $exitBtn = shadowRoot.querySelector('.exit-btn')

		assert($toggle instanceof HTMLElement)
		assert($info instanceof HTMLElement)
		assert($exitBtn instanceof HTMLElement)

		const show = () => $info.classList.add('visible')
		const hide = () => $info.classList.remove('visible')

		$toggle.addEventListener('mouseenter', show)
		$toggle.addEventListener('focus', show)
		$toggle.addEventListener('mouseleave', () =>
			setTimeout(() => {
				if (!shadowRoot.querySelector('.safety-info:hover')) hide()
			}, 100))
		$toggle.addEventListener('blur', hide)

		$info.addEventListener('mouseenter', show)
		$info.addEventListener('mouseleave', hide)

		$toggle.addEventListener('click', (e) => {
			e.stopPropagation()
			if ($info.classList.contains('visible')) hide()
			else show()
		})

		$exitBtn.addEventListener('click', () => this.exit())
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
