export class GraphError extends Error {
  helpText?: string;
  constructor(msg: string, helpText?: string) {
    super(msg);
    this.helpText = helpText;
  }
}
