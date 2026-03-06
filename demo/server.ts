import { serveFile } from '@std/http/file-server'
import { join } from '@std/path'
import { watch } from '../scripts/build.ts'

// fire-and-forget, to run in parallel with the server
watch()

Deno.serve({ port: 8000 }, (req) => {
	const url = new URL(req.url)
	let path = url.pathname
	if (path === '/') path = '/index.html'

	return serveFile(
		req,
		join('./docs', path.replace(/(?:\.\w+)?$/, (m) => m || '.html')),
	)
})
