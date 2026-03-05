/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
import { escape } from '@std/html'

const teardowns: ((this: QuickExitButton) => void)[] = [
	function () {
		// Open the foreground URL in a new, history-less tab.
		// MUST be done first to avoid popup blockers engaging after navigation/DOM changes.
		open(this.foregroundUrl, '_blank', 'noopener,noreferrer')
	},
	() => {
		// Immediately blank page content and favicon and use a generic title in case of slow
		// internet or if the destination URL fails to load
		document.documentElement.innerHTML = '{{ @include blanked.html }}'
	},
	function () {
		try {
			// Use replace() to obscure history so back button fails
			location.replace(this.backgroundUrl)
		} catch (_e) {
			// If `replace` fails for some reason, fallback to `assign` which
			// at least navigates away, but may leave a history entry
			location.assign(this.backgroundUrl)
		}
	},
]

class QuickExitButton extends HTMLElement {
	constructor() {
		super()
		this.attachShadow({ mode: 'open' })

		this.updateCustomStyles()
		new MutationObserver(() => this.updateCustomStyles()).observe(this, { childList: true, subtree: true })
	}

	updateCustomStyles() {
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

	/**
	 * @param {string} _name
	 * @param {string} oldValue
	 * @param {string} newValue
	 */
	attributeChangedCallback(_name: string, oldValue: string, newValue: string) {
		if (oldValue !== newValue) {
			if (this.isConnected) {
				this.render()
			}
		}
	}

	connectedCallback() {
		// This is a singleton element, so we remove any existing instances if this is added again for some reason
		const $els = [...document.querySelectorAll('quick-exit-button')]
		for (const [i, $el] of $els.entries()) {
			if (i !== $els.length - 1) $el.remove()
		}

		this.render()
		this.setupWindowListeners()
	}

	disconnectedCallback() {
		this.cleanupWindowListeners()
	}

	_handleKeydown: null | ((e: KeyboardEvent) => void) = null

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

	get foregroundUrl() {
		return this.getAttribute('foreground-url') ?? 'https://www.google.com/'
	}

	get backgroundUrl() {
		return this.getAttribute('background-url') ?? 'https://www.wikipedia.org/'
	}

	get buttonLabel() {
		return this.getAttribute('label') ?? 'Quick Exit'
	}

	get shortcutDescription() {
		return this.getAttribute('shortcut-description') ??
			'Or press {#kbd}Esc{/kbd} on your keyboard.'
	}

	get safetyText() {
		return this.getAttribute('safety-text') ??
			'The button above will take you to a safe page. Note that it will {#b}NOT{/b} hide your internet history.'
	}

	get safetyLinkText() {
		return this.getAttribute('safety-link-text') ??
			'Learn how to hide your internet history.'
	}

	get safetyLinkUrl() {
		return (
			this.getAttribute('safety-link-url') ??
				'https://womensaid.org.uk/information-support/what-is-domestic-abuse/cover-your-tracks-online/'
		)
	}

	teardown() {
		/** @type {unknown[]} */
		const errs: unknown[] = []
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
		shadowRoot.innerHTML = '{{ @include template.html }}'

		const getHtmlEl = (selector: string) => {
			const $el = shadowRoot.querySelector(selector)
			assert($el instanceof HTMLElement)
			return $el
		}

		const $toggle = getHtmlEl('.info-toggle')
		const $info = getHtmlEl('.safety-info')
		const $exitbutton = getHtmlEl('.exit-button')

		const $buttonLabel = getHtmlEl('[data-i18n=button-label]')
		const $shortcutDescription = getHtmlEl('[data-i18n=shortcut-description]')
		const $safetyText = getHtmlEl('[data-i18n=safety-text]')
		const $safetyLink = getHtmlEl('[data-i18n=safety-link]')
		assert($safetyLink instanceof HTMLAnchorElement)

		renderRichText($buttonLabel, this.buttonLabel)
		renderRichText($shortcutDescription, this.shortcutDescription)
		renderRichText($safetyText, this.safetyText)
		renderRichText($safetyLink, this.safetyLinkText)
		$safetyLink.href = this.safetyLinkUrl

		/** @param {boolean} val */
		const toggle = (val: boolean) => () => {
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

function assert(condition: boolean, message?: string): asserts condition {
	if (!condition) {
		throw new AssertionError(message ?? 'Assertion failed')
	}
}

class AssertionError extends Error {
	override name = 'AssertionError'
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
