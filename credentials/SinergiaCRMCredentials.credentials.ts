import { ICredentialType, ICredentialTestRequest, INodeProperties } from 'n8n-workflow';

/**
 * Credential definition for SinergiaCRM (SuiteCRM) API.
 * Uses OAuth2 Client Credentials flow (client_id, client_secret).
 * 
 * - Domain URL: Must be the base URL of your instance, excluding "/Api" (e.g. https://example.com)
 * - Client ID/Secret: Provided by the SuiteCRM instance (OAuth2 client).
 */
export class SinergiaCRMCredentials implements ICredentialType {
	name = 'SinergiaCRMCredentials'; // Must exactly match the credential name expected in the node
	displayName = 'SinergiaCRM API';
	documentationUrl = 'https://docs.suitecrm.com/developer/api/developer-setup-guide/json-api/';
	properties: INodeProperties[] = [
		{
			displayName: 'Domain URL',
			name: 'domainUrl',
			type: 'string',
			placeholder: 'https://yourdomain.com',
			description: 'Base URL of your SinergiaCRM instance (do NOT include /Api)',
			required: true,
			default: '',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
	];

	test: ICredentialTestRequest = {
		request: {
			method: 'GET',
			url: '={{$credentials.domainUrl}}',
		},
	};


}
