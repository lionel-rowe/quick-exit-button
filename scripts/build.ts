import { replaceAllAsync } from '@std/regexp/unstable-replace-all-async'
import { debounce } from '@std/async/debounce'
import { extname, join } from '@std/path'
import { format } from '@std/fmt/bytes'
import { cyan, gray } from '@std/fmt/colors'
import { minify } from 'minify'

const IN_DIR = './src'
const OUT_PATH = './dist/quick-exit-button.js'

const DEBOUNCE_MS = 200

const buildJs = debounce(async () => {
	const args = ['bundle']

	args.push('--minify')
	args.push('--platform', 'browser')
	args.push('--format', 'iife')

	args.push(join(IN_DIR, 'main.ts'))

	const { stdout, stderr } = await new Deno.Command(
		Deno.execPath(),
		{ args, stdout: 'piped', stderr: 'piped' },
	).spawn().output()

	const code = new TextDecoder().decode(stdout)

	const blob = new Blob(
		[
			'// @ts-nocheck build output\n',
			'// deno-lint-ignore-file\n',
			// escape all quote types to ensure safe interpolation into any quote context
			await includeIncludes(code, (content) =>
				JSON.stringify(content).slice(1, -1)
					.replaceAll(/['`]/g, "\\'")
					.replaceAll(
						/[\u2028\u2029]/gi,
						(m) => String.raw`\u${m.charCodeAt(0).toString(16).padStart(4, '0')}`,
					)),
		],
	)

	await Deno.writeFile(OUT_PATH, blob.stream())

	if (stderr.length > 0) {
		const lines = new TextDecoder().decode(stderr).split('\n')
		for (const line of lines) {
			if (line.includes('experimental')) continue
			await new Blob([line, '\n']).stream().pipeTo(
				Deno.stderr.writable,
				{ preventClose: true },
			)
		}
	}

	// deno-lint-ignore no-console
	console.info(`Wrote to ${cyan(OUT_PATH)} (${gray(format(blob.size))})`)
}, DEBOUNCE_MS)

function includeIncludes(str: string, sanitizer?: (content: string) => string): Promise<string> {
	return replaceAllAsync(
		str,
		// e.g. {{ @include ./src/styles.css }}
		/\{\{\s*@include\s+(?<path>\S+)\s*\}\}/g,
		async (...args) => {
			const { path } = args.find((arg) => typeof arg === 'object' && arg != null) as { path: string }
			let content = await Deno.readTextFile(join(IN_DIR, path!))

			content = await includeIncludes(content) // recursively include nested includes

			const ext = extname(path).slice(1)

			if (ext === 'css' || ext === 'html') {
				content = await minify[ext](content)
			}

			return sanitizer == null ? content : sanitizer(content)
		},
	)
}

export async function watch() {
	buildJs()
	for await (const event of Deno.watchFs(IN_DIR)) {
		if (event.kind === 'modify') {
			const hasWatchedPaths = event.paths.some((path) => /^\.(?:m?[jt]s|css|txt)$/.test(extname(path)))
			if (hasWatchedPaths) buildJs()
		}
	}
}

if (import.meta.main) {
	await watch()
}
