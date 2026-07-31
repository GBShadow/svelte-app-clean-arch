import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export const MD_RENDER_ALLOWED_TAGS = [
	'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
	'p', 'br', 'hr',
	'strong', 'em', 'del', 's', 'sub', 'sup',
	'ul', 'ol', 'li',
	'blockquote', 'pre', 'code',
	'a', 'img',
	'table', 'thead', 'tbody', 'tr', 'th', 'td',
	'input', 'label'
];

export const MD_RENDER_ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
	...sanitizeHtml.defaults.allowedAttributes,
	a: ['href', 'title'],
	img: ['src', 'alt', 'title'],
	code: ['class'],
	input: ['type', 'checked', 'disabled'],
	li: ['class']
};

export function renderMarkdownSafe(markdown: string): string {
	if (!markdown) return '';
	const html = marked.parse(markdown, { async: false }) as string;
	return sanitizeHtml(html, {
		allowedTags: MD_RENDER_ALLOWED_TAGS,
		allowedAttributes: MD_RENDER_ALLOWED_ATTRIBUTES,
		allowedSchemes: ['http', 'https'],
		disallowedTagsMode: 'discard'
	});
}
