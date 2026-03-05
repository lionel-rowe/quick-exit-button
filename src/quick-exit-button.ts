/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
import { escape } from '@std/html/entities'

class QuickExitButton extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({ mode: 'open' })

		this.#updateCustomStyles()
		new MutationObserver(() => this.#updateCustomStyles()).observe(this, { childList: true, subtree: true })
	}

	#updateCustomStyles() {
		this.shadowRoot!.append(...this.querySelectorAll('style, link[rel=stylesheet]'))
	}

	static get observedAttributes() {
		return [
			'url',
			'label',
			'safety-text',
			'safety-link-text',
			'safety-link-url',
		]
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

	#handleKeydown: null | ((e: KeyboardEvent) => void) = null

	#setupWindowListeners() {
		if (this.#handleKeydown) return // Prevent double binding
		this.#handleKeydown = (e) => {
			if (e.key === 'Escape') {
				this.#teardown()
			}
		}
		globalThis.addEventListener('keydown', this.#handleKeydown)
	}

	#cleanupWindowListeners() {
		if (this.#handleKeydown) {
			globalThis.removeEventListener('keydown', this.#handleKeydown)
			this.#handleKeydown = null
		}
	}

	get #foregroundUrl() {
		return this.getAttribute('foreground-url') ?? 'https://www.google.com/'
	}

	get #backgroundUrl() {
		return this.getAttribute('background-url') ?? 'https://www.wikipedia.org/'
	}

	get #buttonLabel() {
		return this.getAttribute('label') ?? 'Quick Exit'
	}

	get #shortcutDescription() {
		return this.getAttribute('shortcut-description') ??
			'Or press {#kbd}Esc{/kbd} on your keyboard.'
	}

	get #safetyText() {
		return this.getAttribute('safety-text') ??
			'The button above will take you to a safe page. Note that it will {#b}NOT{/b} hide your internet history.'
	}

	get #safetyLinkText() {
		return this.getAttribute('safety-link-text') ??
			'Learn how to hide your internet history.'
	}

	get #safetyLinkUrl() {
		return (
			this.getAttribute('safety-link-url') ??
				'https://womensaid.org.uk/information-support/what-is-domestic-abuse/cover-your-tracks-online/'
		)
	}

	#teardowns: ((this: QuickExitButton) => void)[] = [
		function () {
			// Open the foreground URL in a new, history-less tab.
			// MUST be done first to avoid popup blockers engaging after navigation/DOM changes.
			open(this.#foregroundUrl, '_blank', 'noopener,noreferrer')
		},
		() => {
			// Immediately blank page content and favicon and use a generic title in case of slow
			// internet or if the destination URL fails to load
			document.documentElement.innerHTML = '{{ @include blanked.html }}'
		},
		function () {
			try {
				// Use replace() to obscure history so back button fails
				location.replace(this.#backgroundUrl)
			} catch (_e) {
				// If `replace` fails for some reason, fallback to `assign` which
				// at least navigates away, but may leave a history entry
				location.assign(this.#backgroundUrl)
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

		const $toggle = shadowRoot.querySelector('.info-toggle')!
		const $info = shadowRoot.querySelector('.safety-info') as HTMLElement
		const $exitbutton = shadowRoot.querySelector('.exit-button')!

		const $buttonLabel = shadowRoot.querySelector('[data-i18n=button-label]')!
		const $shortcutDescription = shadowRoot.querySelector('[data-i18n=shortcut-description]')!
		const $safetyText = shadowRoot.querySelector('[data-i18n=safety-text]')!
		const $safetyLink = shadowRoot.querySelector('a[data-i18n=safety-link]')! as HTMLAnchorElement

		renderRichText($buttonLabel, this.#buttonLabel)
		renderRichText($shortcutDescription, this.#shortcutDescription)
		renderRichText($safetyText, this.#safetyText)
		renderRichText($safetyLink, this.#safetyLinkText)
		$safetyLink.href = this.#safetyLinkUrl

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

		this.#updateCustomStyles()
	}
}

if (customElements.get('quick-exit-button') == null) {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', insertSingleton)
	} else {
		insertSingleton()
	}
	customElements.define('quick-exit-button', QuickExitButton)
}

function insertSingleton() {
	if (document.querySelector('quick-exit-button') == null) {
		document.body.insertAdjacentHTML('afterbegin', '<quick-exit-button></quick-exit-button>')
	}
}

function renderRichText($el: Element, richText: string) {
	const re = /\{\s*(?<place>[#/])(?<tag>\w+)\s*\}/g

	let innerHtml = ''
	let i = 0

	for (const part of richText.matchAll(re)) {
		innerHtml += escape(richText.slice(i, part.index)) // Text before the tag
		const { place, tag } = part.groups!
		if (/^(kbd|b|i|strong|em)$/i.test(tag)) {
			innerHtml += `<${place === '/' ? '/' : ''}${tag.toLowerCase()}>`
		}
		i = part.index + part[0].length
	}

	innerHtml += escape(richText.slice(i)) // Text after the last tag

	$el.innerHTML = innerHtml
}
