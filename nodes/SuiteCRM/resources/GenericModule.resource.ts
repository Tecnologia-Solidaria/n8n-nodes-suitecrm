import type { INodeProperties } from 'n8n-workflow';

/**
 * Defines the main resource selector for SuiteCRM modules.
 * This property allows the user to choose the SuiteCRM module
 * on which CRUD operations and queries will be performed.
 */
export const genericModuleResource: INodeProperties[] = [
	{
		displayName: 'Module',
		name: 'moduleName',
		type: 'options',
		default: '',
		required: true,
		noDataExpression: true,
		description: 'Select the module to operate on',
		typeOptions: {
			loadOptionsMethod: 'getModules', // Loads module list dynamically via metadata
		},
	},
];
