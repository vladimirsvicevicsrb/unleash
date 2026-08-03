import type { FromSchema } from 'json-schema-to-ts';

export const updateEnvironmentSchema = {
    $id: '#/components/schemas/updateEnvironmentSchema',
    type: 'object',
    additionalProperties: false,
    description: 'Data used to update an environment.',
    properties: {
        type: {
            type: 'string',
            example: 'development',
            description:
                'Updates the type of environment (i.e. development or production).',
        },
        sortOrder: {
            type: 'integer',
            example: 2,
            description: 'Changes the sort order of this environment.',
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

export type UpdateEnvironmentSchema = FromSchema<
    typeof updateEnvironmentSchema
>;
