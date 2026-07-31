import TurndownService from 'turndown';
import { looksLikeHtml } from './looksLikeHtml';

const turndown = new TurndownService({
	headingStyle: 'atx',
	bulletListMarker: '-',
	codeBlockStyle: 'fenced'
});

turndown.keep(['input', 'label']);

export function normalizeMarkdown(text: string): string {
	if (!text) return '';
	if (looksLikeHtml(text)) {
		return turndown.turndown(text);
	}
	return text;
}
