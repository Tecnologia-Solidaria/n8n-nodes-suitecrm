import type { IExecuteFunctions } from 'n8n-workflow';
import * as querystring from 'querystring';
import { buildQueryParams } from './query';

/**
 * Handles OAuth2 client_credentials authentication against SinergiaCRM (SuiteCRM API).
 * Returns the sanitized apiUrl and the valid accessToken.
 * Throws if the access token cannot be obtained.
 */
export async function authenticate(
	node: IExecuteFunctions,
	credentials: any,
): Promise<{ apiUrl: string; accessToken: string }> {
	const apiUrl = (credentials.apiUrl as string).replace(/\/$/, '');
	const clientId = credentials.clientId as string;
	const clientSecret = credentials.clientSecret as string;

	const body = querystring.stringify({
		grant_type: 'client_credentials',
		client_id: clientId,
		client_secret: clientSecret,
	});

	const tokenResponse = await node.helpers.httpRequest({
		method: 'POST',
		url: `${apiUrl}/access_token`,
		body,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		json: true,
	});

	if (!tokenResponse.access_token) {
		throw new Error('Could not obtain access_token from SinergiaCRM');
	}

	return { apiUrl, accessToken: tokenResponse.access_token };
}

/**
 * Retrieves records from any given module, supporting both single-page and paginated "return all" modes.
 * Handles automatic pagination if returnAll is true, up to the given limit.
 * 
 * @param node         n8n context
 * @param apiUrl       Base API URL
 * @param accessToken  Valid Bearer token
 * @param moduleName   Module to query
 * @param options      Query/filter/pagination options
 * @param returnAll    Whether to fetch all pages up to limit
 * @param limit        Maximum number of records to return
 */
export async function fetchModuleRecords(
	node: IExecuteFunctions,
	apiUrl: string,
	accessToken: string,
	moduleName: string,
	options: any,
	returnAll: boolean,
	limit: number,
): Promise<any[]> {
	let pageNumber = 1;
	const pageSize = options.pageSize || 20;
	let totalFetched = 0;
	let hasMore = true;
	const allRecords: any[] = [];

	if (returnAll) {
		while (hasMore && totalFetched < limit) {
			const qs = buildQueryParams(options, pageNumber);
			const response = await node.helpers.httpRequest({
				method: 'GET',
				url: `${apiUrl}/V8/module/${moduleName}`,
				qs,
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
				json: true,
			});
			const records = response.data || response;
			if (Array.isArray(records) && records.length > 0) {
				for (const record of records) {
					if (totalFetched >= limit) break;
					allRecords.push(record);
					totalFetched++;
				}
				if (records.length < pageSize || totalFetched >= limit) {
					hasMore = false;
				} else {
					pageNumber++;
				}
			} else {
				hasMore = false;
			}
		}
	} else {
		const qs = buildQueryParams(options, options.pageNumber || 1);
		const response = await node.helpers.httpRequest({
			method: 'GET',
			url: `${apiUrl}/V8/module/${moduleName}`,
			qs,
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
			json: true,
		});
		const records = response.data || response;
		if (Array.isArray(records)) {
			allRecords.push(...records);
		} else if (typeof records === 'object') {
			allRecords.push(records);
		} else {
			allRecords.push({ result: records });
		}
	}
	return allRecords;
}
