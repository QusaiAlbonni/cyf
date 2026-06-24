import * as Sentry from "@sentry/nestjs";
import { config } from 'dotenv';

config();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
