import { Global, Module } from '@nestjs/common';
import { SetupService } from './setup.service';
import { SetupController } from './setup.controller';
import { SetupStateService } from './setup-state.service';
import { SetupGuard } from './setup.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Première installation du logiciel.
 *
 * Global : `SetupGuard` est enregistré en `APP_GUARD` dans `AppModule` et
 * s'applique donc à des contrôleurs de tous les modules. Il doit pouvoir
 * injecter `SetupStateService` sans que chaque module métier ait à importer
 * `SetupModule`.
 */
@Global()
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SetupController],
  providers: [SetupService, SetupStateService, SetupGuard],
  exports: [SetupService, SetupStateService],
})
export class SetupModule {}
