import { escape } from '@std/html/entities'

export function renderRichText($el: Element, text: string) {
	const re = /\{\s*(?<place>[#/])(?<tag>\w+)\s*\}/g

	let innerHtml = ''
	let i = 0

	for (const part of text.matchAll(re)) {
		innerHtml += escape(text.slice(i, part.index)) // Text before the tag
		const { place, tag } = part.groups!
		if (/^(kbd|b|i|strong|em)$/i.test(tag)) {
			innerHtml += `<${place === '/' ? '/' : ''}${tag.toLowerCase()}>`
		}
		i = part.index + part[0].length
	}

	innerHtml += escape(text.slice(i)) // Text after the last tag

	$el.innerHTML = innerHtml
}
