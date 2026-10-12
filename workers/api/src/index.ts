import { createApiApp } from './app';

const app = createApiApp();

export default {
  fetch(request: Request, env: any, ctx: any) {
    return app.fetch(request, env, ctx);
  }
};
