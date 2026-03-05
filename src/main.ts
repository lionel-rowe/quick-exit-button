import { QuickExitButton } from './quickExitButton.ts'

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
