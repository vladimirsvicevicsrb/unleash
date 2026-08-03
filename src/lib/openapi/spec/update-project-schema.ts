import type { FromSchema } from 'json-schema-to-ts';

export const updateProjectSchema = {
    $id: '#/components/schemas/updateProjectSchema',
    type: 'object',
    additionalProperties: false,
    required: ['name'],
    description: 'Data used to update a project.',
    properties: {
        name: {
            type: 'string',
            pattern: '^(?!\\s*$).+',
            example: 'Pet shop',
            description:
                'The new name of the project. The name must contain at least one non-whitespace character.',
        },
        description: {
            type: 'string',
            nullable: true,
            example: 'This project contains features related to the pet shop.',
            description: 'A new description for the project',
        },
        mode: {
            type: 'string',
            enum: ['open', 'protected', 'private'],
            example: 'open',
            description:
                'A mode of the project affecting what actions are possible in this project. Has no effect in open-source Unleash.',
        },
        defaultStickiness: {
            type: 'string',
            example: 'userId',
            description:
                'A default stickiness for the project affecting the default stickiness value for variants and Gradual Rollout strategy',
        },
    },
    components: {},
} as const;

export type UpdateProjectSchema = FromSchema<typeof updateProjectSchema>;
