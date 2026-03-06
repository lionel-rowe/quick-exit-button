const $template = document.querySelector('template')
const $el = $template.content.firstElementChild
const code = $template.innerHTML
document.body.insertAdjacentElement('afterbegin', $el.cloneNode(true))

const $pre = document.currentScript.closest('pre')
const $code = document.createElement('code')
$pre.textContent = ''
$pre.append($code)

$code.textContent = code
	.replaceAll(new RegExp(`^${code.match(/[\t ]+/g)[0]}`, 'gm'), '') // remove indentation
	.trim()
