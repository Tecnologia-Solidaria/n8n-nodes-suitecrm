import type {
	IExecuteFunctions,
	IHttpRequestOptions,
	IDataObject,
	IHttpRequestMethods,
} from 'n8n-workflow';

/**
 * Helper to perform authenticated HTTP requests against the SuiteCRM API,
 * using n8n credentials system.
 *
 * @param this - The n8n execution context (IExecuteFunctions)
 * @param method - HTTP method (GET, POST, PATCH, etc.)
 * @param endpoint - Full endpoint URL to call
 * @param body - Request body, defaults to empty object
 * @param qs - Query string params, defaults to empty object
 * @param headers - Additional headers, defaults to empty object
 * @returns API response object (parsed JSON)
 * @throws Error with clear message in case of failure
 */
export async function suiteCrmApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	headers: IDataObject = {},
): Promise<any> {
	const options: IHttpRequestOptions = {
		method,
		url: endpoint,
		body: Object.keys(body).length ? body : undefined,
		qs: Object.keys(qs).length ? qs : undefined,
		headers: {
			'Content-Type': 'application/json',
			...(headers || {}),
		},
	};
	try {
		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'SuiteCRMCredentials',
			options,
		);
		return response;
	} catch (error: any) {
		throw new Error(
			`[SuiteCRM] Error in ${method} ${endpoint}: ${error.message}`,
		);
	}
}
