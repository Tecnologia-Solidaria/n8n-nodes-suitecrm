// test/SuitecrmTrigger.node.test.ts
import { describe, expect, it } from 'vitest';
import { SuitecrmTrigger } from '../nodes/SuiteCRM/SuitecrmTrigger.node';

describe('SuitecrmTrigger', () => {
	it('expone un nodo de polling con la descripción correcta', () => {
		const node = new SuitecrmTrigger();

		expect(node.description.name).toBe('suitecrmTrigger');
		expect(node.description.displayName).toBe('SuiteCRM Trigger');
		expect(node.description.group).toEqual(['trigger']);
		expect(node.description.inputs).toEqual([]);
		expect(node.description.outputs).toContain('main');
		expect(node.description.polling).toBe(true);
	});

	it('define la credencial suitecrmOAuth2Api como obligatoria', () => {
		const node = new SuitecrmTrigger();

		expect(node.description.credentials).toEqual([
			{
				name: 'suitecrmOAuth2Api',
				required: true,
			},
		]);
	});

	it('incluye los parámetros de módulos, eventos y cadencia', () => {
		const node = new SuitecrmTrigger();
		const names = node.description.properties.map((property) => property.name);

		expect(names).toEqual(
			expect.arrayContaining(['module', 'events', 'checkInterval', 'numberHours', 'numberDays', 'cronExpression']),
		);

		const checkInterval = node.description.properties.find((property) => property.name === 'checkInterval');
		expect(checkInterval?.type).toBe('options');
		expect(checkInterval?.default).toBe('everyPoll');
	});

	it('mantiene eventos limitados a created y updated', () => {
		const node = new SuitecrmTrigger();
		const events = node.description.properties.find((property) => property.name === 'events');

		expect(events?.default).toEqual(['created', 'updated']);
	});

	it('delega el poll a las operaciones del trigger', async () => {
		const node = new SuitecrmTrigger();
		expect(node.poll).toBeDefined();
		expect(node.methods?.loadOptions).toBeDefined();
	});

	it('no es usable como herramienta (solo el nodo principal lo es)', () => {
		const node = new SuitecrmTrigger();
		expect(node.description.usableAsTool).toBeUndefined();
	});
});
