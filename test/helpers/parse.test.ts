// test/helpers/parse.test.ts
import { describe, expect, it } from 'vitest';
import { parseJsonInput } from '../../nodes/SuiteCRM/helpers/parse';

describe('parseJsonInput', () => {
	it('passes through plain objects unchanged', () => {
		expect(parseJsonInput({ name: 'Juan' })).toEqual({ name: 'Juan' });
	});

	it('parses a valid JSON string', () => {
		expect(parseJsonInput('{"name":"Juan"}')).toEqual({ name: 'Juan' });
	});

	it('returns undefined for an invalid JSON string', () => {
		expect(parseJsonInput('{invalid')).toBeUndefined();
	});

	it('returns undefined for non-object, non-string input', () => {
		expect(parseJsonInput(42)).toBeUndefined();
		expect(parseJsonInput(null)).toBeUndefined();
		expect(parseJsonInput(undefined)).toBeUndefined();
		expect(parseJsonInput(true)).toBeUndefined();
	});
});
