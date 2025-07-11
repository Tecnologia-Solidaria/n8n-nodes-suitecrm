import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

import * as methods from './methods.loadOptions';
import { genericModuleOperations } from './operations/GenericModule.operations';

// Central helpers
import { authenticate, fetchModuleRecords } from './helpers/api';
import { buildQueryParams } from './helpers/query';
import { parseJsonInput } from './helpers/parse';

/**
 * n8n node for generic access to any module of SinergiaCRM (SuiteCRM API).
 * Handles CRUD operations and relationships for any given SuiteCRM module.
 *
 * Key concepts:
 * - Uses dynamic options for module and field listing (see ./methods.loadOptions).
 * - Authentication and HTTP helpers are centralized.
 * - Extensible for new operations and relationship management.
 */
export class SinergiaCRM implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SinergiaCRM',
		name: 'sinergiaCrm',
		icon: 'file:sinergiacrm.svg',
		group: ['transform'],
		version: 1,
		description: 'Generic node to operate with any SinergiaCRM (SuiteCRM API) module.',
		defaults: {
			name: 'SinergiaCRM',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'SinergiaCRMCredentials',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Module',
				name: 'module',
				type: 'options',
				required: true,
				default: '',
				description: 'Select SinergiaCRM module',
				typeOptions: {
					loadOptionsMethod: 'getModules',
				},
				noDataExpression: true,
			},
			...genericModuleOperations,
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Fetch all records using auto-pagination.',
				displayOptions: {
					show: {
						operation: ['getAll'],
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 100,
				description: 'Max records to return (if Return All is active).',
				displayOptions: {
					show: {
						operation: ['getAll'],
						returnAll: [true],
					},
				},
			},
		],
	};

	methods = {
		loadOptions: methods,
	};

	/**
	 * Main execution logic.
	 * Each operation is implemented with error handling and clear extensibility points.
	 */
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Centralized authentication using helper
		const credentials = await this.getCredentials('SinergiaCRMCredentials');
		const { apiUrl, accessToken } = await authenticate(this, credentials);

		const moduleName = this.getNodeParameter('module', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// 1. Get All records
		if (operation === 'getAll') {
			const returnAll = this.getNodeParameter('returnAll', 0, false) as boolean;
			const limit = this.getNodeParameter('limit', 0, 100) as number;
			const options = this.getNodeParameter('options', 0, {}) as any;

			const records = await fetchModuleRecords(
				this,
				apiUrl,
				accessToken,
				moduleName,
				options,
				returnAll,
				limit,
			);

			for (const record of records) {
				returnData.push({ json: record });
			}
		}

		// 2. Get single record by ID
		else if (operation === 'getOne') {
			const recordId = this.getNodeParameter('id', 0) as string;
			try {
				const response = await this.helpers.httpRequest({
					method: 'GET',
					url: `${apiUrl}/V8/module/${moduleName}/${recordId}`,
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
					json: true,
				});
				const record = response.data ?? response;
				returnData.push({ json: record });
			} catch (error: any) {
				throw new Error(`Error retrieving record "${recordId}" from module "${moduleName}": ${error.message}`);
			}
		}

		// 3. Create a new record
		else if (operation === 'create') {
			const attributes = parseJsonInput(this.getNodeParameter('data', 0));
			try {
				const payload = {
					data: {
						type: moduleName,
						attributes,
					},
				};
				const payloadString = JSON.stringify(payload);
				const urlObj = new URL(apiUrl);
				const hostHeader = urlObj.host;

				// Only log for production diagnostics (optional, can be removed)
				// console.log('CREATE payload:', payloadString);

				const response = await this.helpers.httpRequest({
					method: 'POST',
					url: `${apiUrl}/V8/module`,
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
						'Accept': '*/*',
						'Host': hostHeader,
						'Connection': 'keep-alive',
						'Accept-Encoding': 'gzip, deflate, br',
						'User-Agent': 'n8n',
						'Cache-Control': 'no-cache',
						'Content-Length': Buffer.byteLength(payloadString),
					},
					body: payloadString,
					json: false,
				});
				const created = response.data ?? response;
				returnData.push({ json: created });
			} catch (error: any) {
				const apiMsg = error?.response?.body ? JSON.stringify(error.response.body) : error.message;
				throw new Error(`Error creating record in module "${moduleName}": ${apiMsg}`);
			}
		}

		// 4. Update a record
		else if (operation === 'update') {
			const recordId = this.getNodeParameter('id', 0) as string;
			const attributes = parseJsonInput(this.getNodeParameter('data', 0));
			try {
				const payload = {
					data: {
						type: moduleName,
						id: recordId,
						attributes,
					},
				};
				const payloadString = JSON.stringify(payload);
				const urlObj = new URL(apiUrl);
				const hostHeader = urlObj.host;

				const response = await this.helpers.httpRequest({
					method: 'PATCH',
					url: `${apiUrl}/V8/module`,
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
						'Accept': '*/*',
						'Host': hostHeader,
						'Connection': 'keep-alive',
						'Accept-Encoding': 'gzip, deflate, br',
						'User-Agent': 'n8n',
						'Cache-Control': 'no-cache',
						'Content-Length': Buffer.byteLength(payloadString),
					},
					body: payloadString,
					json: false,
				});
				const updated = response.data ?? response;
				returnData.push({ json: updated });
			} catch (error: any) {
				const apiMsg = error?.response?.body ? JSON.stringify(error.response.body) : error.message;
				throw new Error(`Error updating record "${recordId}" in module "${moduleName}": ${apiMsg}`);
			}
		}

		// 5. Delete a record
		else if (operation === 'delete') {
			const recordId = this.getNodeParameter('id', 0) as string;
			try {
				const url = `${apiUrl}/V8/module/${moduleName}/${recordId}`;
				await this.helpers.httpRequest({
					method: 'DELETE',
					url,
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Accept': '*/*',
					},
					json: true,
				});
				returnData.push({ json: { success: true, id: recordId } });
			} catch (error: any) {
				const apiMsg = error?.response?.body ? JSON.stringify(error.response.body) : error.message;
				throw new Error(`Error deleting record "${recordId}" from module "${moduleName}": ${apiMsg}`);
			}
		}

		// 6. Get Relationships of a record (returns related records for a relationship)
		else if (operation === 'getRelationships') {
			const recordId = this.getNodeParameter('id', 0) as string;
			const relationship = this.getNodeParameter('relationship', 0) as string;
			try {
				const url = `${apiUrl}/V8/module/${moduleName}/${recordId}/relationships/${relationship}`;
				const response = await this.helpers.httpRequest({
					method: 'GET',
					url,
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Accept': '*/*',
					},
					json: true,
				});
				const data = response.data ?? response;

				// Standardize: always return an array of results
				if (Array.isArray(data)) {
					for (const rel of data) {
						returnData.push({ json: rel });
					}
				} else {
					returnData.push({ json: data });
				}
			} catch (error: any) {
				const apiMsg = error?.response?.body ? JSON.stringify(error.response.body) : error.message;
				throw new Error(
					`Error retrieving relationship "${relationship}" for record "${recordId}" (${moduleName}): ${apiMsg}`,
				);
			}
		}

		// 7. Connection test fallback
		else {
			return [[{ json: { message: 'Connection OK', token: accessToken } }]];
		}

		return [returnData];
	}
}
