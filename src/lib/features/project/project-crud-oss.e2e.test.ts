import {
    type IUnleashTest,
    setupAppWithAuth,
} from '../../../test/e2e/helpers/test-helper.js';
import dbInit, {
    type ITestDb,
} from '../../../test/e2e/helpers/database-init.js';
import getLogger from '../../../test/fixtures/no-logger.js';
import { TEST_AUDIT_USER } from '../../types/index.js';

let app: IUnleashTest;
let db: ITestDb;

beforeAll(async () => {
    db = await dbInit('project_crud_oss_api_serial', getLogger, {
        isOss: true,
    });
    app = await setupAppWithAuth(
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

    await app.services.userService.createUser(
        {
            email: 'admin@getunleash.io',
            rootRole: 1,
        },
        TEST_AUDIT_USER,
    );

    await app.request
        .post('/auth/demo/login')
        .send({ email: 'admin@getunleash.io' })
        .expect(200);
});

afterAll(async () => {
    await app.destroy();
    await db.destroy();
});

test('creates a new project in OSS mode', async () => {
    const { body } = await app.request
        .post('/api/admin/projects')
        .send({ id: 'my-new-project', name: 'My new project' })
        .expect(201);

    expect(body.id).toBe('my-new-project');
    expect(body.name).toBe('My new project');
});

test('generates a project id when none is given', async () => {
    const { body } = await app.request
        .post('/api/admin/projects')
        .send({ name: 'Project Without Id' })
        .expect(201);

    expect(body.id).toBe('project-without-id');
});

test('lists all projects in OSS mode, not just default', async () => {
    await app.request
        .post('/api/admin/projects')
        .send({ id: 'listed-project', name: 'Listed project' })
        .expect(201);

    const { body } = await app.request.get('/api/admin/projects').expect(200);

    const ids = body.projects.map((project) => project.id);
    expect(ids).toContain('default');
    expect(ids).toContain('listed-project');
});

test('rejects a duplicate project id', async () => {
    await app.request
        .post('/api/admin/projects')
        .send({ id: 'duplicate-project', name: 'Duplicate project' })
        .expect(201);

    await app.request
        .post('/api/admin/projects')
        .send({ id: 'duplicate-project', name: 'Duplicate project' })
        .expect(409);
});

test('validates a project id', async () => {
    await app.request
        .post('/api/admin/projects/validate')
        .send({ id: 'unused-project-id' })
        .expect(200);

    await app.request
        .post('/api/admin/projects/validate')
        .send({ id: 'default' })
        .expect(409);
});

test('updates a project', async () => {
    await app.request
        .post('/api/admin/projects')
        .send({ id: 'update-project', name: 'Before update' })
        .expect(201);

    await app.request
        .put('/api/admin/projects/update-project')
        .send({ name: 'After update', description: 'Updated description' })
        .expect(200);

    const project = await db.stores.projectStore.get('update-project');
    expect(project?.name).toBe('After update');
    expect(project?.description).toBe('Updated description');
});

test('deletes a project', async () => {
    await app.request
        .post('/api/admin/projects')
        .send({ id: 'delete-project', name: 'Delete me' })
        .expect(201);

    await app.request.delete('/api/admin/projects/delete-project').expect(200);

    expect(await db.stores.projectStore.hasProject('delete-project')).toBe(
        false,
    );
});

test('deletes a project via the POST alias', async () => {
    await app.request
        .post('/api/admin/projects')
        .send({ id: 'delete-project-post', name: 'Delete me too' })
        .expect(201);

    await app.request
        .post('/api/admin/projects/delete-project-post/delete')
        .expect(200);

    expect(await db.stores.projectStore.hasProject('delete-project-post')).toBe(
        false,
    );
});

test('refuses to delete the default project', async () => {
    await app.request.delete('/api/admin/projects/default').expect(403);
});

test('supports the full flow: new project, custom environment, flag toggled in that environment', async () => {
    await app.request
        .post('/api/admin/projects')
        .send({ id: 'full-flow', name: 'Full flow' })
        .expect(201);

    await app.request
        .post('/api/admin/environments')
        .send({ name: 'full-flow-env', type: 'development' })
        .expect(201);

    await app.request
        .post('/api/admin/projects/full-flow/environments')
        .send({ environment: 'full-flow-env' })
        .expect(200);

    await app.request
        .post('/api/admin/projects/full-flow/features')
        .send({ name: 'full-flow-flag' })
        .expect(201);

    await app.request
        .post(
            '/api/admin/projects/full-flow/features/full-flow-flag/environments/full-flow-env/strategies',
        )
        .send({ name: 'default' })
        .expect(200);

    await app.request
        .post(
            '/api/admin/projects/full-flow/features/full-flow-flag/environments/full-flow-env/on',
        )
        .expect(200);

    const { body } = await app.request
        .get('/api/admin/projects/full-flow/features/full-flow-flag')
        .expect(200);
    const env = body.environments.find(
        (environment) => environment.name === 'full-flow-env',
    );
    expect(env?.enabled).toBe(true);
});
