export class Logger {
  private service: string;
  private version: string;

  constructor(service: string, version: string) {
    this.service = service;
    this.version = version;
  }

  info(message: string, traceId: string): void {
    this.write("INFO", message, traceId);
  }

  warn(message: string, traceId: string): void {
    this.write("WARN", message, traceId);
  }

  error(message: string, traceId: string): void {
    this.write("ERROR", message, traceId);
  }

  private write(level: "INFO" | "WARN" | "ERROR", message: string, traceId: string): void {
    const record = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      version: this.version,
      trace_id: traceId,
      message
    };

    process.stdout.write(`${JSON.stringify(record)}\n`);
  }
}
