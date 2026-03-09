export class AuthManager {
  private apiKey: string | undefined;
  private bearerToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  getAuthHeader(): string | null {
    if (this.bearerToken && Date.now() < this.tokenExpiry) {
      return `Bearer ${this.bearerToken}`;
    }
    if (this.apiKey) {
      return `Bearer ${this.apiKey}`;
    }
    return null;
  }

  setBearerToken(token: string, expiresInMs: number): void {
    this.bearerToken = token;
    this.tokenExpiry = Date.now() + expiresInMs;
  }

  isAuthenticated(): boolean {
    return !!(this.apiKey || (this.bearerToken && Date.now() < this.tokenExpiry));
  }
}
