export function looksLikeHtml(text: string): boolean {
	return /^\s*</.test(text) && /<\/[a-zA-Z][a-zA-Z0-9]*\s*>/.test(text);
}
