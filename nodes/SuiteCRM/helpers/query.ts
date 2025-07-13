/**
 * Builds query parameters for SuiteCRM API v8.
 * Handles filters and pagination, supporting both standard and custom fields,
 * and only allows API-supported filter operators.
 *
 * @param options    Query options from node parameters (pageSize, pageNumber, filters)
 * @param pageNumber Page number to request (starts at 1)
 * @returns          Query string object to be spread into the httpRequest call
 */
export function buildQueryParams(
	options: {
		pageSize?: number;
		pageNumber?: number;
		filters?: {
			Filter?: Array<{
				field: string;
				customField?: string;
				operator?: string;
				value: string;
			}>;
		};
	},
	pageNumber: number,
): Record<string, any> {
	const qs: Record<string, any> = {};
	qs['page[size]'] = options.pageSize || 20;
	qs['page[number]'] = pageNumber;

	// List of operators supported by SuiteCRM v8 API
	const SUPPORTED_OPERATORS: Record<string, string> = {
		eq: 'EQ',
		neq: 'NEQ',
		gt: 'GT',
		gte: 'GTE',
		lt: 'LT',
		lte: 'LTE',
	};

	if (options.filters && Array.isArray(options.filters.Filter)) {
		for (const f of options.filters.Filter) {
			let fieldName = f.field;
			// If user chose "Custom..." field, use the custom field name
			if (fieldName === '__custom__' && f.customField && f.customField.trim()) {
				fieldName = f.customField.trim();
			}
			const opKey = (f.operator || 'eq').toLowerCase();
			const opApi = SUPPORTED_OPERATORS[opKey];
			if (!opApi) continue; // Skip unsupported operators
			if (fieldName && f.value) {
				qs[`filter[${fieldName}][${opApi}]`] = f.value;
			}
		}
	}
	return qs;
}
