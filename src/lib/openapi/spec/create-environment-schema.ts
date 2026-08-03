import type { FromSchema } from 'json-schema-to-ts';

export const createEnvironmentSchema = {
    $id: '#/components/schemas/createEnvironmentSchema',
    type: 'object',
    additionalProperties: false,
    required: ['name', 'type'],
    description: 'Data used to create a new environment.',
    properties: {
        name: {
            type: 'string',
            pattern: '^[a-zA-Z0-9~_.-]+$',
            example: 'my-environment',
            description:
                'The name of the environment. Must be URL-friendly and unique. Cannot be changed later.',
        },
        type: {
            type: 'string',
            example: 'development',
            description:
                "The [type of environment](https://docs.getunleash.io/concepts/environments#environment-types) (i.e. 'development' or 'production').",
        },
        enabled: {
            type: 'boolean',
            example: true,
            description:
                'Newly created environments are enabled by default. Set this property to `false` to create the environment in a disabled state.',
        },
        sortOrder: {
            type: 'integer',
            example: 7,
            description:
                'Defines where in the list of environments to place this environment. The list uses an ascending sort, so lower numbers are shown first. You can change this value later.',
        },
        requiredApprovals: {
            type: 'integer',
            nullable: true,
            minimum: 1,
            example: 1,
            description:
                'The number of approvals required before a change request can be applied in this environment.',
        },
    },
    components: {},
} as const;

export type CreateEnvironmentSchema = FromSchema<
    typeof createEnvironmentSchema
>;
