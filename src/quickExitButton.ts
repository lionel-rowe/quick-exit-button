/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
import { renderMarkdown } from './markdown.ts'
import { getString, i18nKeys } from './i18n.ts'

export class QuickExitButton extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({ mode: 'open' })

		this.#updateCustomStyles()
		new MutationObserver(() => this.#updateCustomStyles()).observe(this, { childList: true, subtree: true })
	}

	#styleElements: (HTMLStyleElement | HTMLLinkElement)[] = []

	#updateCustomStyles() {
		this.#styleElements = [...this.querySelectorAll('style, link[rel=stylesheet]' as 'style' | 'link')]
	}

	static get observedAttributes() {
		return i18nKeys
	}

	attributeChangedCallback(_name: string, oldValue: string, newValue: string) {
		if (oldValue !== newValue && this.isConnected) {
			this.#render()
		}
	}

	connectedCallback() {
		// This is a singleton element, so we remove any existing instances if this is added again for some reason
		const $els = [...document.querySelectorAll('quick-exit-button')]
		for (const [i, $el] of $els.entries()) {
			if (i !== $els.length - 1) $el.remove()
		}

		this.#render()
		this.#setupWindowListeners()
	}

	disconnectedCallback() {
		this.#cleanupWindowListeners()
	}

	#ac: AbortController | null = null

	handleEvent(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			this.#teardown()
		}
	}

	#setupWindowListeners() {
		if (typeof AbortController === 'function') {
			this.#ac = new AbortController()
		}
		globalThis.addEventListener('keydown', this, { signal: this.#ac?.signal })
	}

	#cleanupWindowListeners() {
		this.#ac?.abort()
		this.#ac = null
	}

	#teardowns: ((this: QuickExitButton) => void)[] = [
		function () {
			// Open the foreground URL in a new, history-less tab.
			// MUST be done first to avoid popup blockers engaging after navigation/DOM changes.
			open(getString('foreground-url', this), '_blank', 'noopener,noreferrer')
		},
		() => {
			// Immediately blank page content and favicon and use a generic title in case of slow
			// internet or if the destination URL fails to load
			document.documentElement.innerHTML = '{{ @include blanked.html }}'
		},
		function () {
			try {
				// Use replace() to obscure history so back button fails
				location.replace(getString('background-url', this))
			} catch (_e) {
				// If `replace` fails for some reason, fallback to `assign` which
				// at least navigates away, but may leave a history entry
				location.assign(getString('background-url', this))
			}
		},
	]

	#teardown() {
		const errs: unknown[] = []
		for (const fn of this.#teardowns) {
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

	#render() {
		const shadowRoot = this.shadowRoot!
		shadowRoot.innerHTML = '{{ @include template.html }}'

		const $toggle = shadowRoot.querySelector('.info-toggle[data-i18n=safety-information]')!
		const $info = shadowRoot.querySelector('.safety-info') as HTMLElement
		const $exitbutton = shadowRoot.querySelector('.exit-button')!

		const $buttonLabel = shadowRoot.querySelector('[data-i18n=button-label]')!
		const $shortcutDescription = shadowRoot.querySelector('[data-i18n=shortcut-description]')!
		const $safetyText = shadowRoot.querySelector('[data-i18n=safety-text]')!
		const $safetyLink = shadowRoot.querySelector('a[data-i18n=safety-link]' as 'a')!

		renderMarkdown($buttonLabel, getString('label', this))
		renderMarkdown($shortcutDescription, getString('shortcut-description', this))
		renderMarkdown($safetyText, getString('safety-text', this))
		renderMarkdown($safetyLink, getString('safety-link-text', this))

		$safetyLink.href = getString('safety-link-url', this)
		$toggle.ariaLabel = getString('safety-information', this)

		$exitbutton.addEventListener('click', this.#teardown.bind(this))

		const toggle = (val: boolean) => () => {
			$info.hidden = !val
			requestAnimationFrame(() => {
				$info.classList.toggle('visible', val)
			})
		}
		const show = toggle(true)
		const hide = toggle(false)

		for (const $el of [$toggle, $info]) {
			$el.addEventListener('mouseenter', show)
			$el.addEventListener('focusout', () => {
				requestAnimationFrame(() => {
					const focused = shadowRoot.activeElement
					if (!$toggle.contains(focused) && !$info.contains(focused)) {
						hide()
					}
				})
			})
			$el.addEventListener('mouseleave', () =>
				setTimeout(() => {
					if (!$toggle.matches(':hover') && !$info.matches(':hover')) {
						hide()
					}
				}, 100))
		}

		$toggle.addEventListener('focus', show)
		$toggle.addEventListener('click', show)

		// this.#updateCustomStyles()
		this.shadowRoot!.append(...this.#styleElements)
	}
}
