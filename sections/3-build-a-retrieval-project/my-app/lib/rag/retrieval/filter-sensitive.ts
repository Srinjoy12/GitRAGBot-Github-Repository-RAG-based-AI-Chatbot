export function filterSensitive(content: string): string {
    return content.replace(/(ghp_[a-zA-Z0-9]{36})/g, "[REDACTED_TOKEN]");
  }
  