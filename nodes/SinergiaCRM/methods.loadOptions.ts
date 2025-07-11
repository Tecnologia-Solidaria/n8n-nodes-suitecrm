import type { ILoadOptionsFunctions } from 'n8n-workflow';
import * as querystring from 'querystring';

/**
 * Fetch all modules available in the SinergiaCRM instance.
 * Used for the module selector in node properties.
 */
export async function getModules(this: ILoadOptionsFunctions) {
	const credentials = await this.getCredentials('SinergiaCRMCredentials');
	const apiUrl = (credentials.apiUrl as string).replace(/\/$/, '');
	const clientId = credentials.clientId as string;
	const clientSecret = credentials.clientSecret as string;

	const body = querystring.stringify({
		grant_type: 'client_credentials',
		client_id: clientId,
		client_secret: clientSecret,
	});

	const tokenResponse = await this.helpers.httpRequest({
		method: 'POST',
		url: `${apiUrl}/access_token`,
		body,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		json: true,
	});

	if (!tokenResponse.access_token) {
		throw new Error('Could not obtain SinergiaCRM access_token');
	}

	const modulesResponse = await this.helpers.httpRequest({
		method: 'GET',
		url: `${apiUrl}/V8/meta/modules`,
		headers: {
			Authorization: `Bearer ${tokenResponse.access_token}`,
		},
		json: true,
	});

	const modulesObject = modulesResponse.data?.attributes || {};
	const modulesArray = Object.entries(modulesObject).map(([key, value]: [string, any]) => ({
		name: value.label || key,
		value: key,
	}));

	return modulesArray;
}

/**
 * Fetch all fields from the selected module (for dynamic filter dropdowns).
 * Adds a "Custom..." option for manual field names.
 */
export async function getModuleFields(this: ILoadOptionsFunctions) {
	const credentials = await this.getCredentials('SinergiaCRMCredentials');
	const apiUrl = (credentials.apiUrl as string).replace(/\/$/, '');
	const clientId = credentials.clientId as string;
	const clientSecret = credentials.clientSecret as string;
	const module = this.getCurrentNodeParameter('module') as string;

	// Defensive: If no module is selected, return empty array (no error)
	if (!module || typeof module !== 'string' || !module.trim()) {
		return [];
	}

	const body = querystring.stringify({
		grant_type: 'client_credentials',
		client_id: clientId,
		client_secret: clientSecret,
	});

	const tokenResponse = await this.helpers.httpRequest({
		method: 'POST',
		url: `${apiUrl}/access_token`,
		body,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		json: true,
	});

	if (!tokenResponse.access_token) {
		throw new Error('Could not obtain SinergiaCRM access_token');
	}

	const fieldsResponse = await this.helpers.httpRequest({
		method: 'GET',
		url: `${apiUrl}/V8/meta/fields/${module}`,
		headers: {
			Authorization: `Bearer ${tokenResponse.access_token}`,
		},
		json: true,
	});

	const fields = fieldsResponse.data?.attributes || {};
	const fieldOptions = Object.entries(fields).map(([key, value]: [string, any]) => ({
		name: value.label || key,
		value: key,
	}));

	// Add a manual entry for custom fields
	fieldOptions.push({
		name: 'Custom...',
		value: '__custom__',
	});

	return fieldOptions;
}

/**
 * Fetch all available relationships for a given record.
 * Used to populate the relationship selector in "Get Relationships" operations.
 * Returns an array of { name, value } where value is the API relationship key to use.
 */
export async function getAvailableRelationships(this: ILoadOptionsFunctions) {
	const credentials = await this.getCredentials('SinergiaCRMCredentials');
	const apiUrl = (credentials.apiUrl as string).replace(/\/$/, '');
	const clientId = credentials.clientId as string;
	const clientSecret = credentials.clientSecret as string;

	const module = this.getCurrentNodeParameter('module') as string;
	const recordId = this.getCurrentNodeParameter('id') as string;

	if (!module || !recordId) {
		return [];
	}

	// Auth for meta endpoints
	const body = querystring.stringify({
		grant_type: 'client_credentials',
		client_id: clientId,
		client_secret: clientSecret,
	});

	const tokenResponse = await this.helpers.httpRequest({
		method: 'POST',
		url: `${apiUrl}/access_token`,
		body,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		json: true,
	});

	if (!tokenResponse.access_token) {
		throw new Error('Could not obtain SinergiaCRM access_token');
	}

	// Get record, extract relationships object
	const recordResponse = await this.helpers.httpRequest({
		method: 'GET',
		url: `${apiUrl}/V8/module/${module}/${recordId}`,
		headers: {
			Authorization: `Bearer ${tokenResponse.access_token}`,
		},
		json: true,
	});

	const relationshipsObj = recordResponse.data?.relationships || {};
	const relOptions: { name: string; value: string }[] = [];

	for (const [relKey, relValue] of Object.entries(relationshipsObj)) {
		// Type guard to check links.related exists
		if (
			typeof relValue === 'object' &&
			relValue !== null &&
			'related' in ((relValue as any).links || {})
		) {
			const relatedLink = (relValue as any).links.related;
			if (relatedLink) {
				// Only the last segment is required by our API
				const value = relatedLink.split('/').pop();
				relOptions.push({
					name: relKey,
					value: value,
				});
			}
		}
	}

	return relOptions;
}
