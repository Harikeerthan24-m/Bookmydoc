import {
  Logger,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from '@nestjs/config';
import { AppController } from '@app/app.controller';
import { AppService } from '@app/app.service';
import { envSchema } from '@app/env.schema';
import { getConfigOptions } from '@app/common/config/env.config';
import { UiService } from '@app/ui.service';
import { HealthModule } from '@app/common/health/health.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { ExceptionFilter } from '@common/filters/exception.filter';
import { AuthModule } from './auth/auth.module';
import { AuthMiddleware } from './auth/middleware/auth.middleware';
import { RolesGuard } from './auth/guard/roles.guard';
import { FirebaseModule } from './firebase/firebase.module';
import { ProfileModule } from './profile/profile.module';
import { UserModule } from './user/user.module';
import { AvailabilityModule } from './availability/availability.module';
import { BookingModule } from './booking/booking.module';
import { ServiceModule } from './service/service.module';
import { DoctorModule } from './doctor/doctor.module';
import { NotificationModule } from './notification/notification.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot(getConfigOptions(envSchema)),
    ServeStaticModule.forRootAsync({
      useClass: UiService,
    }),
    HealthModule,
    AuthModule,
    FirebaseModule,
    ProfileModule,
    UserModule,
    AvailabilityModule,
    BookingModule,
    ServiceModule,
    DoctorModule,
    NotificationModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    Logger,
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ExceptionFilter,
    },
    {
      provide: 'APP_GUARD',
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/verify-email', method: RequestMethod.POST },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
