import { createRequestHandler } from "react-router";
import { apiRoutes } from "./api/routes";

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

// 创建主应用
export default {
  fetch(request, env, ctx) {
    // 检查是否是API请求
    if (request.url.startsWith(`${new URL(request.url).origin}/api`)) {
      // 处理API请求
      return apiRoutes.fetch(request, env, ctx);
    }
    
    // 处理React Router请求
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
