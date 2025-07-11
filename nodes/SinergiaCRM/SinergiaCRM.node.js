"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SinergiaCRM = void 0;
const GenericModule_operations_1 = require("./operations/GenericModule.operations");
const GenericModule_resource_1 = require("./resources/GenericModule.resource");
class SinergiaCRM {
    constructor() {
        this.description = {
            displayName: 'SinergiaCRM',
            name: 'sinergiaCrm',
            icon: 'file:sinergiacrm.svg',
            group: ['transform'],
            version: 1,
            description: 'Interact with SinergiaCRM API',
            defaults: {
                name: 'SinergiaCRM',
            },
            inputs: ["main" /* NodeConnectionType.Main */],
            outputs: ["main" /* NodeConnectionType.Main */],
            properties: [
                ...GenericModule_operations_1.genericModuleOperations,
                ...GenericModule_resource_1.genericModuleFields,
            ],
        };
    }
    async execute() {
        // Ejemplo simple de ejecución:
        const items = this.getInputData();
        return [items];
    }
}
exports.SinergiaCRM = SinergiaCRM;
