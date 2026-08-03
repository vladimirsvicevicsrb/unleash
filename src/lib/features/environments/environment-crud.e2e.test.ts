import {
    type IUnleashTest,
    setupAppWithCustomConfig,
} from '../../../test/e2e/helpers/test-helper.js';
import dbInit, {
    type ITestDb,
} from '../../../test/e2e/helpers/database-init.js';
import getLogger from '../../../test/fixtures/no-logger.js';

let app: IUnleashTest;
let db: ITestDb;

beforeAll(async () => {
    db = await dbInit('environment_crud_api_serial', getLogger, {
        isOss: true,
    });
    app = await setupAppWithCustomConfig(
        db.stores,
        {
            experimental: {
                flags: {
                    strictSchemaValidation: true,
                },
            },
            isOss: true,
        },
        db.rawDatabase,
    );
});

afterAll(async () => {
    await app.destroy();
    await db.destroy();
});

test('creates a new environment', async () => {
    const { body } = await app.request
        .post('/api/admin/environments')
        .send({ name: 'my-custom-env', type: 'development' })
        .expect(201);

    expect(body.name).toBe('my-custom-env');
    expect(body.type).toBe('development');
    expect(body.enabled).toBe(true);
    expect(body.protected).toBe(false);

    const { body: allEnvs } = await app.request
        .get('/api/admin/environments')
        .expect(200);
    const names = allEnvs.environments.map((env) => env.name);
    expect(names).toContain('my-custom-env');
});

test('rejects creating an environment with a duplicate name', async () => {
    await app.request
        .post('/api/admin/environments')
        .send({ name: 'duplicate-env', type: 'development' })
        .expect(201);

    await app.request
        .post('/api/admin/environments')
        .send({ name: 'duplicate-env', type: 'development' })
        .expect(409);
});

test('rejects creating an environment with a URL-unfriendly name', async () => {
    await app.request
        .post('/api/admin/environments')
        .send({ name: 'not a url friendly name', type: 'development' })
        .expect(400);
});

test('validates environment names', async () => {
    await app.request
        .post('/api/admin/environments/validate')
        .send({ name: 'a-brand-new-env' })
        .expect(204);

    await app.request
        .post('/api/admin/environments/validate')
        .send({ name: 'production' })
        .expect(409);
});

test('updates an environment', async () => {
    await app.request
        .post('/api/admin/environments')
        .send({ name: 'update-me', type: 'development' })
        .expect(201);

    const { body } = await app.request
        .put('/api/admin/environments/update/update-me')
        .send({ type: 'production', sortOrder: 42 })
        .expect(200);

    expect(body.type).toBe('production');
    expect(body.sortOrder).toBe(42);
});

test('deletes an environment', async () => {
    await app.request
        .post('/api/admin/environments')
        .send({ name: 'delete-me', type: 'development' })
        .expect(201);

    await app.request.delete('/api/admin/environments/delete-me').expect(200);

    await app.request.get('/api/admin/environments/delete-me').expect(404);
});

test('refuses to delete a protected environment', async () => {
    await db.stores.environmentStore.create({
        name: 'protected-env',
        type: 'production',
        enabled: true,
    });
    await db
        .rawDatabase('environments')
        .update({ protected: true })
        .where({ name: 'protected-env' });

    await app.request
        .delete('/api/admin/environments/protected-env')
        .expect(403);
});

test('clones an environment including project links, features, and strategies', async () => {
    await app.request
        .post('/api/admin/projects/default/features')
        .send({ name: 'clone-source-flag' })
        .expect(201);

    await app.request
        .post(
            '/api/admin/projects/default/features/clone-source-flag/environments/development/strategies',
        )
        .send({ name: 'flexibleRollout', parameters: { rollout: '50' } })
        .expect(200);

    const { body } = await app.request
        .post('/api/admin/environments/development/clone')
        .send({
            name: 'development-clone',
            type: 'development',
            projects: ['default'],
        })
        .expect(201);

    expect(body.name).toBe('development-clone');

    const projectEnvs =
        await db.stores.projectStore.getEnvironmentsForProject('default');
    expect(projectEnvs.map((env) => env.environment)).toContain(
        'development-clone',
    );

    const strategies =
        await db.stores.featureStrategiesStore.getStrategiesForFeatureEnv(
            'default',
            'clone-source-flag',
            'development-clone',
        );
    expect(strategies).toHaveLength(1);
    expect(strategies[0].strategyName).toBe('flexibleRollout');
});

test('cloning from a non-existing environment yields 404', async () => {
    await app.request
        .post('/api/admin/environments/i-do-not-exist/clone')
        .send({ name: 'clone-of-nothing', type: 'development' })
        .expect(404);
});
