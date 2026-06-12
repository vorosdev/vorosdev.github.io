export function formatDate(date: Date, locale = 'es-ES'): string {
	return new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	}).format(date);
}

export function formatDateShort(date: Date, locale = 'es-ES'): string {
	return new Intl.DateTimeFormat(locale, {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	}).format(date);
}
