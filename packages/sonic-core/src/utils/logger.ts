/**
 * Core logger for the audio engine.
 */
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[SonicCore] [INFO] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[SonicCore] [WARN] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[SonicCore] [ERROR] ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    // Basic debug check
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
        console.debug(`[SonicCore] [DEBUG] ${message}`, ...args);
    }
  }
};
