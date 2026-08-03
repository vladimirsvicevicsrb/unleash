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
    db = await dbInit('environment_api_is_oss_serial', getLogger, {
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
    await db.stores.environmentStore.create({
        name: 'customenvironment',
        type: 'production',
        enabled: true,
    });
    await db.stores.environmentStore.create({
        name: 'customenvironment2',
        type: 'production',
        enabled: true,
    });
    await db.stores.environmentStore.create({
        name: 'customenvironment3',
        type: 'production',
        enabled: true,
    });
});

afterAll(async () => {
    await app.destroy();
    await db.destroy();
});

test('querying environments in OSS returns custom environments', async () => {
    await app.request
        .get('/api/admin/environments')
        .expect(200)
        .expect((res) => {
            const names = res.body.environments.map((env) => env.name);
            expect(names).toEqual(
                expect.arrayContaining([
                    'development',
                    'production',
                    'customenvironment',
                    'customenvironment2',
                    'customenvironment3',
                ]),
            );
        });
});

test('querying project environments in OSS returns custom environments', async () => {
    await app.request
        .get('/api/admin/environments/project/default')
        .expect(200)
        .expect((res) => {
            const names = res.body.environments.map((env) => env.name);
            expect(names).toEqual(
                expect.arrayContaining([
                    'development',
                    'production',
                    'customenvironment',
                    'customenvironment2',
                    'customenvironment3',
                ]),
            );
        });
});
