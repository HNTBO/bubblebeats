let counter = 0;

/** Generate a simple unique ID */
export function generateId(): string {
  return `b${Date.now()}-${counter++}`;
}
