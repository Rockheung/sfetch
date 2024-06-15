export {}

declare global {
	interface Headers {
		getSetCookie: () => string[];
	}
}
