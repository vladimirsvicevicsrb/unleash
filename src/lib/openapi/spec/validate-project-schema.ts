import type { FromSchema } from 'json-schema-to-ts';

export const validateProjectSchema = {
    $id: '#/components/schemas/validateProjectSchema',
    type: 'object',
    additionalProperties: false,
    required: ['id'],
    description: 'Data used to validate a new project.',
    properties: {
        id: {
            type: 'string',
            example: 'pet-shop',
            description: 'The project ID to validate',
        },
    },
    components: {},
} as const;

export type ValidateProjectSchema = FromSchema<typeof validateProjectSchema>;
