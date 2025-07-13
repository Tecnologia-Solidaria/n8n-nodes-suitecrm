export function parseJsonInput(input: unknown): object {
	if (typeof input === 'string') {
		try {
			return JSON.parse(input);
		} catch {
			throw new Error('El campo Data (JSON) debe ser un objeto JSON válido o un string JSON parseable.');
		}
	}
	if (typeof input === 'object' && input !== null) {
		return input as object;
	}
	throw new Error('El campo Data (JSON) debe ser un objeto o un string JSON.');
}
