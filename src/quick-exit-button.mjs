// @ts-check
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

/** @type {((this: QuickExitButton) => void)[]} */
const teardowns = [
	function () {
		// Open the primary URL in a new, history-less tab.
		// MUST be done first to avoid popup blockers engaging after navigation/DOM changes.
		open(this.primaryUrl, '_blank', 'noopener,noreferrer')
	},
	() => {
		// Immediately blank page content and favicon and use a generic title in case of slow
		// internet or if the destination URL fails to load
		document.documentElement.innerHTML = `
			<head>
				<meta charset="UTF-8">
				<title>New Tab</title>
				<link rel="icon" href="data:,">
			</head>
			<body></body>
		`
	},
	function () {
		try {
			// Use replace() to obscure history so back button fails
			location.replace(this.secondaryUrl)
		} catch (_e) {
			// If `replace` fails for some reason, fallback to `assign` which
			// at least navigates away, but may leave a history entry
			location.assign(this.secondaryUrl)
		}
	},
]

class QuickExitButton extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({ mode: 'open' })

		this.updateCustomStyles()
		this.addEventListener('slotchange', () => {
			this.updateCustomStyles()
		})
	}

	updateCustomStyles() {
		const { shadowRoot } = this
		assert(shadowRoot != null)

		const customStyleSheets = [...shadowRoot.querySelectorAll('slot')]
			.filter((slot) => slot.name === 'custom-styles')
			.flatMap((slot) => slot.assignedElements())
			.filter((el) => el instanceof HTMLStyleElement || el instanceof HTMLLinkElement)

		shadowRoot.append(...customStyleSheets)
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
		// This is a singleton element, so we remove any existing instances if this is added again for some reason
		const els = [...document.querySelectorAll('quick-exit-button')]
		for (const [i, el] of els.entries()) {
			if (i !== els.length - 1) el.remove()
		}

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
				this.teardown()
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

	get primaryUrl() {
		return this.getAttribute('primary-url') ?? 'https://www.google.com/'
	}

	get secondaryUrl() {
		return this.getAttribute('secondary-url') ?? 'https://www.msn.com/'
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

	teardown() {
		/** @type {unknown[]} */
		const errs = []
		for (const fn of teardowns) {
			try {
				fn.call(this)
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
			.exit-button {
				background-color: ${this.themeColor};
				color: white;
				border: none;
				border-radius: 4px;
				padding: 12px 24px;
				font-size: 16px;
				cursor: pointer;
				white-space: nowrap;
				--scale: 1.03;
			}
			.exit-button .main-text {
				font-weight: bold;
				text-transform: uppercase;
			}

			.exit-button, .info-toggle {
				transition: transform 0.2s;
				box-shadow: 0 4px 6px rgba(0,0,0,0.1);
			}

			.exit-button:hover, .info-toggle:hover {
				box-shadow: 0 6px 8px rgba(0,0,0,0.15);
			}

			.exit-button:hover, .exit-button:focus, .info-toggle:hover, .info-toggle:focus {
				transform: scale(var(--scale, 1.1));
				filter: brightness(110%);
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
				margin-right: 4px; /* Slight offset alignment tweaks if needed, or remove */
				--scale: 1.15;
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
				button.exit-button {
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
			<slot name="custom-styles"></slot>
			<!-- Exit Button -->
			<button part="button" class="exit-button">
				<div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
					<span class="main-text">${this.buttonLabel}</span>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M18 6L6 18" stroke="currentColor" stroke-width="3" />
						<path d="M6 6L18 18" stroke="currentColor" stroke-width="3" />
					</svg>
				</div>
				<div>
					<small style="font-size: 0.5em; display: block; margin-top: 4px;">${this.shortcutDescription}</small>
				</div>
			</button>

			<!-- Info Toggle-->
			<button class="info-toggle" aria-label="Safety Information" aria-describedby="safety-info">
				<svg xmlns="http://www.w3.org/2000/svg" version="1.0" viewBox="0 0 200 200" width="32" height="32">
					<defs>
						<style>
							.bg-circle {
								fill: var(--help-icon-bg, #1976d2);
								stroke: var(--help-icon-fg, #fff);
							}
							.question-mark {
								fill: var(--help-icon-fg, #fff);
							}
						</style>
					</defs>
					<circle class="bg-circle" cx="100" cy="100" r="90" stroke-width="15" />
					<path
						class="question-mark"
						d="M101.47 36.25c-5.45.03-10.653.737-15.282 2.063-4.699 1.346-9.126 3.484-12.876 6.219-3.238 2.362-6.333 5.391-8.687 8.531-4.159 5.549-6.461 11.651-7.063 18.687-.04.468-.07.868-.062.876.016.016 21.702 2.687 21.812 2.687.053 0 .113-.234.282-.937 1.941-8.085 5.486-13.521 10.968-16.813 4.32-2.594 9.808-3.612 15.778-2.969 2.74.295 5.21.96 7.38 2a18.6 18.6 0 0 1 6.94 5.813c1.54 2.156 2.46 4.584 2.75 7.312.08.759.05 2.48-.03 3.219-.23 1.826-.7 3.378-1.5 4.969-.81 1.597-1.48 2.514-2.76 3.812-2.03 2.077-5.18 4.829-10.78 9.407-3.6 2.944-6.04 5.156-8.12 7.343-4.943 5.179-7.191 9.069-8.564 14.719-.905 3.72-1.256 7.55-1.156 13.19.025 1.4.062 2.73.062 2.97v.43h21.598l.03-2.4c.03-3.27.21-5.37.56-7.41.57-3.27 1.43-5 3.94-7.81 1.6-1.8 3.7-3.76 6.93-6.47 4.77-3.991 8.11-6.99 11.26-10.125 4.91-4.907 7.46-8.26 9.28-12.187 1.43-3.092 2.22-6.166 2.46-9.532.06-.816.07-3.03 0-3.968-.45-7.043-3.1-13.253-8.15-19.032-.8-.909-2.78-2.887-3.72-3.718-4.96-4.394-10.69-7.353-17.56-9.094-4.19-1.062-8.23-1.6-13.35-1.75-.78-.023-1.59-.036-2.37-.032 m-10.908 103.6v22h21.998v-22z"
					/>
				</svg>
			</button>

			<!-- Safety Info Box -->
			<div id="safety-info" class="safety-info" hidden>
				<span>${this.safetyText}</span>
				<a href="${this.safetyLinkUrl}" target="_blank" rel="noopener noreferrer">${this.safetyLinkText}</a>
			</div>
		`

		const $toggle = shadowRoot.querySelector('.info-toggle')
		const $info = shadowRoot.querySelector('.safety-info')
		const $exitbutton = shadowRoot.querySelector('.exit-button')

		assert($toggle instanceof HTMLElement)
		assert($info instanceof HTMLElement)
		assert($exitbutton instanceof HTMLElement)

		/** @param {boolean} val */
		const toggle = (val) => () => {
			$info.hidden = !val
			requestAnimationFrame(() => {
				$info.classList.toggle('visible', val)
			})
		}
		const show = toggle(true)
		const hide = toggle(false)

		$toggle.addEventListener('mouseenter', show)
		$toggle.addEventListener('focus', show)
		$toggle.addEventListener('mouseleave', () =>
			setTimeout(() => {
				if (shadowRoot.querySelector('.safety-info:hover') == null) {
					hide()
				}
			}, 100))
		$toggle.addEventListener('blur', hide)

		$info.addEventListener('mouseenter', show)
		$info.addEventListener('mouseleave', hide)

		$toggle.addEventListener('click', (e) => {
			e.stopPropagation()
			if ($info.classList.contains('visible')) {
				hide()
			} else show()
		})

		$exitbutton.addEventListener('click', this.teardown.bind(this))

		this.updateCustomStyles()
	}
}

if (customElements.get('quick-exit-button') == null) {
	if (document.querySelector('quick-exit-button') == null) {
		document.body.insertAdjacentHTML('afterbegin', '<quick-exit-button></quick-exit-button>')
	}
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
