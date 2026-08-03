import { Test } from '@nestjs/testing';
import { PrismaService } from './prisma/prisma.service';

/**
 * Le graphe de dépendances se résout-il ?
 *
 * `nest build` compile chaque fichier isolément : il ne dit rien du câblage
 * entre modules. Un service oublié dans les `providers`, un module qui n'est
 * pas importé là où on l'injecte, ou un cycle d'imports ne se manifestent
 * qu'au démarrage — donc en production si personne ne lance l'application
 * avant de déployer.
 *
 * Ce test monte l'application entière, avec la seule base de données
 * neutralisée : c'est le câblage qu'on vérifie, pas PostgreSQL.
 */
describe('AppModule', () => {
  const ORIGINAL_ENV = process.env;

  beforeAll(() => {
    // La validation de configuration s'exécute à l'instanciation du module.
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/test',
      JWT_SECRET: 'a'.repeat(64),
      FRONTEND_URL: 'http://localhost:4000',
    };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('résout tous les modules et démarre', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AppModule } = require('./app.module') as {
      AppModule: new () => unknown;
    };

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    await moduleRef.init();
    await moduleRef.close();
  }, 30_000);
});
