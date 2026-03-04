import { HttpException, HttpStatus } from "@nestjs/common";

export class BudgetExceededError extends HttpException {
  constructor(
    message: string,
    public readonly techMapId: string,
    public readonly limitRub: number,
    public readonly projectedRub: number,
  ) {
    super(
      {
        statusCode: HttpStatus.FORBIDDEN,
        error: "BudgetExceeded",
        message,
        techMapId,
        limitRub,
        projectedRub,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
