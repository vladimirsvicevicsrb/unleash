import type { Request, Response } from 'express';
import Controller from '../../routes/controller.js';
import type { IUnleashServices } from '../../services/index.js';
import type { IUnleashConfig } from '../../types/option.js';
import type EnvironmentService from '../project-environments/environment-service.js';
import { ADMIN, NONE } from '../../types/permissions.js';
import type { OpenApiService } from '../../services/openapi-service.js';
import { createRequestSchema } from '../../openapi/util/create-request-schema.js';
import {
    createResponseSchema,
    resourceCreatedResponseSchema,
} from '../../openapi/util/create-response-schema.js';
import {
    environmentsSchema,
    type EnvironmentsSchema,
} from '../../openapi/spec/environments-schema.js';
import {
    environmentSchema,
    type EnvironmentSchema,
} from '../../openapi/spec/environment-schema.js';
import type { SortOrderSchema } from '../../openapi/spec/sort-order-schema.js';
import {
    emptyResponse,
    getStandardResponses,
} from '../../openapi/util/standard-responses.js';
import {
    environmentsProjectSchema,
    type EnvironmentsProjectSchema,
} from '../../openapi/spec/environments-project-schema.js';
import type { CreateEnvironmentSchema } from '../../openapi/spec/create-environment-schema.js';
import type { UpdateEnvironmentSchema } from '../../openapi/spec/update-environment-schema.js';
import type { CloneEnvironmentSchema } from '../../openapi/spec/clone-environment-schema.js';
import type { NameSchema } from '../../openapi/spec/name-schema.js';
import { serializeDates } from '../../types/serialize-dates.js';
import type { IAuthRequest } from '../../routes/unleash-types.js';
import type { WithTransactional } from '../../db/transaction.js';

interface EnvironmentParam {
    name: string;
}

interface ProjectParam {
    projectId: string;
}

export class EnvironmentsController extends Controller {
    private openApiService: OpenApiService;

    private service: WithTransactional<EnvironmentService>;

    constructor(
        config: IUnleashConfig,
        {
            transactionalEnvironmentService,
            openApiService,
        }: Pick<
            IUnleashServices,
            'transactionalEnvironmentService' | 'openApiService'
        >,
    ) {
        super(config);
        this.openApiService = openApiService;
        this.service = transactionalEnvironmentService;

        this.route({
            method: 'post',
            path: '',
            handler: this.createEnvironment,
            permission: ADMIN,
            middleware: [
                openApiService.validPath({
                    tags: ['Environments'],
                    operationId: 'createEnvironment',
                    release: { stable: '8.0.3' },
                    summary: 'Create an environment',
                    description:
                        'Creates a new environment with the provided name and type.',
                    requestBody: createRequestSchema('createEnvironmentSchema'),
                    responses: {
                        201: resourceCreatedResponseSchema('environmentSchema'),
                        ...getStandardResponses(400, 401, 403, 409),
                    },
                }),
            ],
        });

        this.route({
            method: 'post',
            path: '/validate',
            handler: this.validateEnvironmentName,
            permission: NONE,
            middleware: [
                openApiService.validPath({
                    tags: ['Environments'],
                    operationId: 'validateEnvironmentName',
                    release: { stable: '8.0.3' },
                    summary: 'Validate an environment name',
                    description:
                        'Validates that the provided environment name is URL-friendly and not already in use.',
                    requestBody: createRequestSchema('nameSchema'),
                    responses: {
                        204: emptyResponse,
                        ...getStandardResponses(400, 401, 409),
                    },
                }),
            ],
        });

        this.route({
            method: 'put',
            path: '/update/:name',
            handler: this.updateEnvironment,
            permission: ADMIN,
            middleware: [
                openApiService.validPath({
                    tags: ['Environments'],
                    operationId: 'updateEnvironment',
                    release: { stable: '8.0.3' },
                    summary: 'Update the environment with `name`',
                    description:
                        'Updates the type and/or sort order of the environment with `name`.',
                    requestBody: createRequestSchema('updateEnvironmentSchema'),
                    responses: {
                        200: createResponseSchema('environmentSchema'),
                        ...getStandardResponses(400, 401, 403, 404),
                    },
                }),
            ],
        });

        this.route({
            method: 'delete',
            path: '/:name',
            acceptAnyContentType: true,
            handler: this.deleteEnvironment,
            permission: ADMIN,
            middleware: [
                openApiService.validPath({
                    tags: ['Environments'],
                    operationId: 'removeEnvironment',
                    release: { stable: '8.0.3' },
                    summary: 'Delete the environment with `name`',
                    description:
                        'Deletes the environment with `name`. Protected environments can not be deleted.',
                    responses: {
                        200: emptyResponse,
                        ...getStandardResponses(401, 403, 404),
                    },
                }),
            ],
        });

        this.route({
            method: 'post',
            path: '/:name/clone',
            handler: this.cloneEnvironment,
            permission: ADMIN,
            middleware: [
                openApiService.validPath({
                    tags: ['Environments'],
                    operationId: 'cloneEnvironment',
                    release: { stable: '8.0.3' },
                    summary: 'Clone the environment with `name`',
                    description:
                        'Creates a new environment based on the environment with `name`, copying enabled features and strategies for the selected projects.',
                    requestBody: createRequestSchema('cloneEnvironmentSchema'),
                    responses: {
                        201: resourceCreatedResponseSchema('environmentSchema'),
                        ...getStandardResponses(400, 401, 403, 404, 409),
                    },
                }),
            ],
        });

        this.route({
            method: 'get',
            path: '',
            handler: this.getAllEnvironments,
            permission: NONE,
            middleware: [
                openApiService.validPath({
                    tags: ['Environments'],
                    summary: 'Get all environments',
                    description:
                        'Retrieves all environments that exist in this Unleash instance.',
                    release: { stable: '4.13.0' },
                    operationId: 'getAllEnvironments',
                    responses: {
                        200: createResponseSchema('environmentsSchema'),
                        ...getStandardResponses(401, 403),
                    },
                }),
            ],
        });

        this.route({
            method: 'get',
            path: '/:name',
            handler: this.getEnvironment,
            permission: NONE,
            middleware: [
                openApiService.validPath({
                    tags: ['Environments'],
                    release: { stable: '4.12.0' },
                    operationId: 'getEnvironment',
                    summary: 'Get the environment with `name`',
                    description:
                        'Retrieves the environment with `name` if it exists in this Unleash instance',
                    responses: {
                        200: createResponseSchema('environmentSchema'),
                        ...getStandardResponses(401, 403, 404),
                    },
                }),
            ],
        });

        this.route({
            method: 'get',
            path: '/project/:projectId',
            handler: this.getProjectEnvironments,
            permission: NONE,
            middleware: [
                openApiService.validPath({
                    tags: ['Environments'],
                    release: { stable: '4.18.0' },
                    operationId: 'getProjectEnvironments',
                    summary: 'Get the environments available to a project',
                    description:
                        'Gets the environments that are available for this project. An environment is available for a project if enabled in the [project configuration](https://docs.getunleash.io/concepts/environments#enable-an-environment)',
                    responses: {
                        200: createResponseSchema('environmentsProjectSchema'),
                        ...getStandardResponses(401, 403, 404),
                    },
                }),
            ],
        });

        this.route({
            method: 'put',
            path: '/sort-order',
            handler: this.updateSortOrder,
            permission: ADMIN,
            middleware: [
                openApiService.validPath({
                    tags: ['Environments'],
                    summary: 'Update environment sort orders',
                    description:
                        'Updates sort orders for the named environments. Environments not specified are unaffected.',
                    release: { stable: '4.13.0' },
                    operationId: 'updateSortOrder',
                    requestBody: createRequestSchema('sortOrderSchema'),
                    responses: {
                        200: emptyResponse,
                        ...getStandardResponses(401, 403, 404),
                    },
                }),
            ],
        });

        this.route({
            method: 'post',
            path: '/:name/on',
            acceptAnyContentType: true,
            handler: this.toggleEnvironmentOn,
            permission: ADMIN,
            middleware: [
                openApiService.validPath({
                    tags: ['Environments'],
                    summary: 'Toggle the environment with `name` on',
                    description:
                        'Makes it possible to enable this environment for a project. An environment must first be globally enabled using this endpoint before it can be enabled for a project',
                    release: { stable: '4.12.0' },
                    operationId: 'toggleEnvironmentOn',
                    responses: {
                        204: emptyResponse,
                        ...getStandardResponses(401, 403, 404),
                    },
                }),
            ],
        });

        this.route({
            method: 'post',
            path: '/:name/off',
            acceptAnyContentType: true,
            handler: this.toggleEnvironmentOff,
            permission: ADMIN,
            middleware: [
                openApiService.validPath({
                    tags: ['Environments'],
                    summary: 'Toggle the environment with `name` off',
                    description:
                        'Removes this environment from the list of available environments for projects to use',
                    release: { stable: '4.12.0' },
                    operationId: 'toggleEnvironmentOff',
                    responses: {
                        204: emptyResponse,
                        ...getStandardResponses(401, 403, 404),
                    },
                }),
            ],
        });
    }

    async createEnvironment(
        req: IAuthRequest<unknown, unknown, CreateEnvironmentSchema>,
        res: Response<EnvironmentSchema>,
    ): Promise<void> {
        const environment = await this.service.transactional((service) =>
            service.createEnvironment(req.body, req.audit),
        );
        this.openApiService.respondWithValidation(
            201,
            res,
            environmentSchema.$id,
            serializeDates(environment),
            { location: `environments/${environment.name}` },
        );
    }

    async validateEnvironmentName(
        req: Request<unknown, unknown, NameSchema>,
        res: Response,
    ): Promise<void> {
        await this.service.validateEnvironmentName(req.body.name);
        res.status(204).end();
    }

    async updateEnvironment(
        req: IAuthRequest<EnvironmentParam, unknown, UpdateEnvironmentSchema>,
        res: Response<EnvironmentSchema>,
    ): Promise<void> {
        const environment = await this.service.transactional((service) =>
            service.updateEnvironment(req.params.name, req.body, req.audit),
        );
        this.openApiService.respondWithValidation(
            200,
            res,
            environmentSchema.$id,
            serializeDates(environment),
        );
    }

    async deleteEnvironment(
        req: IAuthRequest<EnvironmentParam>,
        res: Response,
    ): Promise<void> {
        await this.service.transactional((service) =>
            service.deleteEnvironment(req.params.name, req.audit),
        );
        res.status(200).end();
    }

    async cloneEnvironment(
        req: IAuthRequest<EnvironmentParam, unknown, CloneEnvironmentSchema>,
        res: Response<EnvironmentSchema>,
    ): Promise<void> {
        const environment = await this.service.transactional((service) =>
            service.cloneEnvironment(req.params.name, req.body, req.audit),
        );
        this.openApiService.respondWithValidation(
            201,
            res,
            environmentSchema.$id,
            serializeDates(environment),
            { location: `environments/${environment.name}` },
        );
    }

    async getAllEnvironments(
        _req: Request,
        res: Response<EnvironmentsSchema>,
    ): Promise<void> {
        this.openApiService.respondWithValidation(
            200,
            res,
            environmentsSchema.$id,
            { version: 1, environments: await this.service.getAll() },
        );
    }

    async updateSortOrder(
        req: Request<unknown, unknown, SortOrderSchema>,
        res: Response,
    ): Promise<void> {
        await this.service.updateSortOrder(req.body);
        res.status(200).end();
    }

    async toggleEnvironmentOn(
        req: Request<EnvironmentParam>,
        res: Response,
    ): Promise<void> {
        const { name } = req.params;
        await this.service.toggleEnvironment(name, true);
        res.status(204).end();
    }

    async toggleEnvironmentOff(
        req: Request<EnvironmentParam>,
        res: Response,
    ): Promise<void> {
        const { name } = req.params;
        await this.service.toggleEnvironment(name, false);
        res.status(204).end();
    }

    async getEnvironment(
        req: Request<EnvironmentParam>,
        res: Response<EnvironmentSchema>,
    ): Promise<void> {
        this.openApiService.respondWithValidation(
            200,
            res,
            environmentSchema.$id,
            await this.service.get(req.params.name),
        );
    }

    async getProjectEnvironments(
        req: Request<ProjectParam>,
        res: Response<EnvironmentsProjectSchema>,
    ): Promise<void> {
        const environments = await this.service.getProjectEnvironments(
            req.params.projectId,
        );
        this.openApiService.respondWithValidation(
            200,
            res,
            environmentsProjectSchema.$id,
            {
                version: 1,
                environments,
            },
        );
    }
}
