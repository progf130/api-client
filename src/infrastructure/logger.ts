export interface Logger {
  error: (action: string, message: string) => void;
  info: (...messages: string[]) => void;
  warn: (message: string) => void;
}
