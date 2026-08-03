import type { FromSchema } from 'json-schema-to-ts';

export const createProjectSchema = {
    $id: '#/components/schemas/createProjectSchema',
    type: 'object',
    additionalProperties: false,
    required: ['name'],
    description:
        'Data used to create a new [project](https://docs.getunleash.io/concepts/projects).',
    properties: {
        id: {
            type: 'string',
            pattern: '[A-Za-z0-9_~.-]*',
            example: 'pet-shop',
            description:
                'The project’s identifier. If this property is not present or is an empty string, Unleash will generate the project id automatically. This property is deprecated.',
            deprecated: true,
        },
        name: {
            type: 'string',
            pattern: '^(?!\\s*$).+',
            example: 'Pet shop',
            description:
                'The project’s name. The name must contain at least one non-whitespace character.',
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
        environments: {
            type: 'array',
            items: { type: 'string' },
            example: ['production', 'development'],
            description:
                'A list of environments that should be enabled for this project. If this property is missing, Unleash will default to enabling all non-deprecated environments for the project. An empty list will result in no environment enabled for the project.',
        },
        changeRequestEnvironments: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                required: ['name'],
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
                'A list of environments that should have change requests enabled. If the list includes environments not in the `environments` list, they will still have change requests enabled. Has no effect in open-source Unleash.',
        },
    },
    components: {},
} as const;

export type CreateProjectSchema = FromSchema<typeof createProjectSchema>;
