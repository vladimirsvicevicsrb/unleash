import type { FromSchema } from 'json-schema-to-ts';

export const projectCreatedSchema = {
    $id: '#/components/schemas/projectCreatedSchema',
    type: 'object',
    additionalProperties: false,
    required: ['id', 'name'],
    description: 'Details about the newly created project.',
    properties: {
        id: {
            type: 'string',
            pattern: '[A-Za-z0-9_~.-]+',
            example: 'pet-shop',
            description: "The project's identifier.",
        },
        name: {
            type: 'string',
            minLength: 1,
            example: 'Pet shop',
            description: "The project's name.",
        },
        description: {
            type: 'string',
            nullable: true,
            example: 'This project contains features related to the pet shop.',
            description: "The project's description.",
        },
        mode: {
            type: 'string',
            enum: ['open', 'protected', 'private'],
            example: 'open',
            description:
                'A mode of the project affecting what actions are possible in this project',
        },
        defaultStickiness: {
            type: 'string',
            example: 'userId',
            description:
                'A default stickiness for the project affecting the default stickiness value for variants and Gradual Rollout strategy',
        },
        featureLimit: {
            type: 'integer',
            nullable: true,
            example: 100,
            description:
                'A limit on the number of features allowed in the project. `null` if no limit.',
        },
        environments: {
            type: 'array',
            items: { type: 'string' },
            example: ['production', 'development'],
            description: 'The environments enabled for the project.',
        },
        changeRequestEnvironments: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['name', 'requiredApprovals'],
                properties: {
                    name: {
                        type: 'string',
                        example: 'production',
                        description: 'The environment name',
                    },
                    requiredApprovals: {
                        type: 'integer',
                        example: 1,
                        minimum: 1,
                        description:
                            'The number of approvals required for a change request to be applied in this environment.',
                    },
                },
            },
            description:
                'The list of environments that have change requests enabled.',
        },
    },
    components: {},
} as const;

export type ProjectCreatedSchema = FromSchema<typeof projectCreatedSchema>;
