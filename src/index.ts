/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import axios, { Axios, AxiosHeaders, AxiosPromise, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

type Serializable = string | number | boolean | null | undefined | Serializable[] | { [key: string]: Serializable };

const convertAxiosHeaderToHeaders = (headers: AxiosHeaders): Headers => {
	const headersObj = new Headers();
	if (typeof headers.toJSON === 'function') {
		const headersObj = headers.toJSON();
		for (const key in headersObj) {
			if (Object.prototype.hasOwnProperty.call(headersObj, key)) {
				const value = headersObj[key];
				switch (typeof value) {
					case 'string':
						headers.set(key, value);
						break;
					case 'object':
						if (Array.isArray(value)) {
							value.forEach(v => headers.append(key, v));
						}
						break;
				}
			}
		}
	}
	return headersObj;
}

const convertHeadersToAxiosHeaders = (headers: Headers): AxiosHeaders => {
	const headersObj = new AxiosHeaders();

	for (const [key, value] of headers.entries()) {
		if (key === 'set-cookie') {
			headersObj.set('set-cookie', headers.getSetCookie().join(', '));
			continue;
		}
		headersObj.set(key, value);
	}
	return headersObj;
}

const fetchAdapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
	const request = new Request(config.url!, {
		method: config.method,
		headers: convertAxiosHeaderToHeaders(config.headers),
		body: config.data,
		redirect: 'manual',
	});
	const res = await fetch(request);

	return {
		data: await res.text(),
		status: res.status,
		statusText: res.statusText,
		headers: convertHeadersToAxiosHeaders(res.headers),
		config,
	}
}

const iAxios = axios.create({
	adapter: fetchAdapter,
	maxRedirects: 0,
	withCredentials: true,
	validateStatus: _ => true,
	transformRequest: _ => _,
	transformResponse: _ => _,
});




// import handleProxy from './proxy';
// import handleRedirect from './redirect';
// import apiRouter from './router';

// nTitleNo=126410663&nApiLevel=10&nPlaylistIdx=0

// Export a default object containing event handlers
export default {
	// The fetch handler is invoked when this worker receives a HTTP(S) request
	// and should return a Response (optionally wrapped in a Promise)
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		try {
			const requestConfig = await request.json<AxiosRequestConfig>();
			const res = await iAxios.request(requestConfig);
			console.log(typeof res.headers['set-cookie'])
			const headers = new Headers();
			if (typeof res.headers.toJSON === 'function') {
				const headersObj = res.headers.toJSON();
				for (const key in headersObj) {
					if (Object.prototype.hasOwnProperty.call(headersObj, key)) {
						const value = headersObj[key];
						switch (typeof value) {
							case 'string':
								headers.set(key, value);
								break;
							case 'object':
								if (Array.isArray(value)) {
									value.forEach(v => headers.append(key, v));
								}
								break;
						}
					}
				}
			} else {

			}
			headers.set('X-From-Saxios', res.headers['content-type']);
      return new Response(res.data, {
				statusText: res.statusText,
				status: res.status,
				headers,
			});
    } catch (error) {
			if (error instanceof Error) {
				return new Response(error.stack,{
					status: 400
				});
			}

			return new Response('An unknown error occurred',{
				status: 500
			});
    }
	}
};
