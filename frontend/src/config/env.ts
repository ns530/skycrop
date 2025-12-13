/**
 * Environment configuration
 * Handles both Vite (import.meta.env) and Jest (process.env) environments
 */

interface EnvConfig {
  API_BASE_URL: string;
  MODE: string;
  IS_DEV: boolean;
  IS_PROD: boolean;
}

/**
 * Get environment configuration
 * Works in both browser (Vite) and Node.js (Jest) environments
 */
export const getEnvConfig = (): EnvConfig => {
  // Check if we're in Node.js environment (Jest)
  const isNodeEnv =
    typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV === "test";

  if (isNodeEnv) {
    return {
      API_BASE_URL:
        process.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1",
      MODE: process.env.MODE || "test",
      IS_DEV: false,
      IS_PROD: false,
    };
  }

  // Browser environment - use eval to bypass Jest parser
  // This won't be parsed by Jest since it's in a string
  try {
    const meta = eval("import.meta.env");
    return {
      API_BASE_URL: meta?.VITE_API_BASE_URL || "/api/v1",
      MODE: meta?.MODE || "development",
      IS_DEV: meta?.DEV === true,
      IS_PROD: meta?.PROD === true,
    };
  } catch {
    // Fallback for any errors
    return {
      API_BASE_URL: "/api/v1",
      MODE: "development",
      IS_DEV: false,
      IS_PROD: false,
    };
  }
};

// Export singleton config
export const env = getEnvConfig();
