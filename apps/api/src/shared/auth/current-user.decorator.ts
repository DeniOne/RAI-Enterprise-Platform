import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";

/**
 * Universal CurrentUser decorator that works with both REST and GraphQL.
 * Detects context type automatically.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const contextType = context.getType<string>();

    // GraphQL context
    if (contextType === "graphql") {
      const ctx = GqlExecutionContext.create(context);
      return ctx.getContext().req.user;
    }

    // REST (HTTP) context
    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);
