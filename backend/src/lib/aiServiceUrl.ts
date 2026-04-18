/** Base URL for the Python AI microservice (no trailing slash). */
export function aiServiceBase(): string {
  return (process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
}
