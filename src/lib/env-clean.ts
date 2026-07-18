/**
 * Sanitizes environment variables loaded with surrounding quotes.
 * This is especially useful for deployments (like PM2 or Docker) where environment
 * variables might retain double or single quotes from the .env file.
 */
if (typeof process !== "undefined" && process.env) {
  for (const key of Object.keys(process.env)) {
    const val = process.env[key];
    if (val) {
      const trimmed = val.trim();
      if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ) {
        process.env[key] = trimmed.slice(1, -1);
      }
    }
  }
}
export {};
