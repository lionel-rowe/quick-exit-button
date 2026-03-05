import { serveDir } from '@std/http/file-server'
import { watch } from '../scripts/build.ts'

// fire-and-forget, to run in parallel with the server
watch()

Deno.serve({ port: 8000 }, async (req) => {
	const url = new URL(req.url)
	if (url.pathname.startsWith(`/dist/`)) {
		return serveDir(req)
	}

	return new Response(
		await Deno.readTextFile('./demo/index.html'),
		{
			headers: {
				'Content-Type': 'text/html',
			},
		},
	)
})
