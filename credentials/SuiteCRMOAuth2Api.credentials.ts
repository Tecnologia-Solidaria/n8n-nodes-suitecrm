import { ICredentialType, INodeProperties, ICredentialTestRequest } from 'n8n-workflow';

export class SuiteCRMOAuth2Api implements ICredentialType {
	name = 'suitecrmOAuth2Api';

	displayName = 'SuiteCRM OAuth2 API';

	icon = 'file:suitecrm.svg' as const;

	documentationUrl = 'https://docs.suitecrm.com/developer/api/developer-setup-guide/json-api/';

	extends = ['oAuth2Api'];

	properties: INodeProperties[] = [
		{
			displayName: 'Domain URL',
			name: 'domainUrl',
			type: 'string',
			default: '',
			required: true,
			description: 'Base URL of your SuiteCRM instance (e.g. https://yourdomain.com) without trailing slash.',
			placeholder: 'https://yourdomain.com',
		},
		{
			displayName: 'Client ID',
			name: 'clientId',
			type: 'string',
			default: '',
			required: true,
			description: 'OAuth2 Client ID from SuiteCRM (Admin → OAuth2 Clients).',
		},
		{
			displayName: 'Client Secret',
			name: 'clientSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'OAuth2 Client Secret associated with the Client ID.',
		},
	];

	authenticate = {
		type: 'oauth2',
		properties: {
			tokenType: 'Bearer',
			grantType: 'client_credentials',
			clientAuthentication: 'body',
			tokenRequestContentType: 'form',
			accessTokenUrl: '={{$credentials.domainUrl}}/Api/access_token',
		},
	} as unknown as ICredentialType['authenticate'];

	test: ICredentialTestRequest = {
		request: {
			method: 'GET',
			url: '={{$credentials.domainUrl}}',
		},
	};
}
