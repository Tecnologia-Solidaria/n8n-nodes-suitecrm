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
				description: 'Max records to return (if Return All is inactive).',
				displayOptions: {
					show: {
						operation: ['getAll'],
						returnAll: [false],
					},
				},
			},
		],
	};

	methods = {
		loadOptions: methods,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('SinergiaCRMCredentials');
		const { apiUrl, accessToken } = await authenticate(this, credentials); // apiUrl includes /Api

		const moduleName = this.getNodeParameter('module', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

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
		} else if (operation === 'getOne') {
			const recordId = this.getNodeParameter('id', 0) as string;
			const response = await this.helpers.httpRequest({
				method: 'GET',
				url: `${apiUrl}/V8/module/${moduleName}/${recordId}`,
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
				json: true,
			});
			returnData.push({ json: response.data ?? response });
		} else if (operation === 'create') {
			const attributes = parseJsonInput(this.getNodeParameter('data', 0));
			const payload = {
				data: { type: moduleName, attributes },
			};
			const response = await this.helpers.httpRequest({
				method: 'POST',
				url: `${apiUrl}/V8/module`,
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: payload,
				json: true,
			});
			returnData.push({ json: response.data ?? response });
		} else if (operation === 'update') {
			const recordId = this.getNodeParameter('id', 0) as string;
			const attributes = parseJsonInput(this.getNodeParameter('data', 0));
			const payload = {
				data: { type: moduleName, id: recordId, attributes },
			};
			const response = await this.helpers.httpRequest({
				method: 'PATCH',
				url: `${apiUrl}/V8/module`,
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: payload,
				json: true,
			});
			returnData.push({ json: response.data ?? response });
		} else if (operation === 'delete') {
			const recordId = this.getNodeParameter('id', 0) as string;
			await this.helpers.httpRequest({
				method: 'DELETE',
				url: `${apiUrl}/V8/module/${moduleName}/${recordId}`,
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
				json: true,
			});
			returnData.push({ json: { success: true, id: recordId } });
		} else if (operation === 'getRelationships') {
			const recordId = this.getNodeParameter('id', 0) as string;
			const relationship = this.getNodeParameter('relationship', 0) as string;
			const response = await this.helpers.httpRequest({
				method: 'GET',
				url: `${apiUrl}/V8/module/${moduleName}/${recordId}/relationships/${relationship}`,
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
				json: true,
			});
			returnData.push({ json: response.data ?? response });
		}

		return [returnData];
	}
}
