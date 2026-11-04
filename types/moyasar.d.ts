export {};

declare global {
  interface Window {
    Moyasar?: {
      init: (options: Record<string, unknown>) => void;
    };
  }
}
