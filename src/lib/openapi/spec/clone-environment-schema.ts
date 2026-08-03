import type { FromSchema } from 'json-schema-to-ts';

export const cloneEnvironmentSchema = {
    $id: '#/components/schemas/cloneEnvironmentSchema',
    type: 'object',
    additionalProperties: false,
    required: ['name'],
    description: 'Data used to clone an existing environment.',
    properties: {
        name: {
            type: 'string',
            pattern: '^[a-zA-Z0-9~_.-]+$',
            example: 'my-cloned-environment',
            description:
                'The name of the new cloned environment. Cannot be changed later.',
        },
        type: {
            type: 'string',
            example: 'development',
            description:
                'The type of the new environment (i.e. development or production).',
        },
        projects: {
            type: 'array',
            items: {
                type: 'string',
            },
            example: ['my-project'],
            description:
                'A list of projects that should be included in the cloned environment.',
        },
        clonePermissions: {
            type: 'boolean',
            example: true,
            description:
                'Copies the RBAC permissions from the source environment if true. Has no effect in open-source Unleash, which does not have environment-scoped permissions.',
        },
    },
    components: {},
} as const;

export type CloneEnvironmentSchema = FromSchema<typeof cloneEnvironmentSchema>;
