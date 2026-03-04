import { serveDir } from '@std/http/file-server'
import { fromFileUrl } from '@std/path'

Deno.serve({ port: 8000 }, async (req) => {
	const url = new URL(req.url)
	const urlRoot = 'static/'
	if (url.pathname.startsWith(`/${urlRoot}`)) {
		console.log(url.pathname)
		const fsRoot = fromFileUrl(new URL('../src/', import.meta.url))

		return serveDir(req, { urlRoot, fsRoot })
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
