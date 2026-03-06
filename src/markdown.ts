import { escape } from '@std/html/entities'

/**
 * A very minimal Markdown renderer. Currently only supports
 * `**strong**`, `_emphasis_`, and `<kbd>keyboard</kbd>` tags.
 */
export function renderMarkdown($el: Element, text: string) {
	const escaped = escape(text)

	$el.innerHTML = escaped
		.replace(/([*_])\1(?<content>.+?)\1\1/g, '<strong>$<content></strong>')
		.replace(/([*_])(?<content>.+?)\1/g, '<em>$<content></em>')
		.replace(
			new RegExp(`${escape('<kbd>')}(.*?)${escape('</kbd>')}`, 'g'),
			'<kbd>$1</kbd>',
		)
}
