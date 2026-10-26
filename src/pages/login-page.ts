import { Page, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateToLoginPage() {
    await this.page.goto("/auth/login");
  }

  async login(username: string, password: string) {
    await this.page.getByTestId("email").fill(username);
    await this.page.getByTestId("password").fill(password);
    await this.page.getByTestId("login-submit").click();
    await expect(this.page).toHaveURL("/account");
  }
}
