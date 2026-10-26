import { Page, expect } from "@playwright/test";

export class FavoritesPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateToFavoritesPage() {
    await this.page.goto("/account/favorites");
    await expect(this.page.getByTestId("page-title")).toHaveText("Favorites");
  }

  async validateFavorite(favoriteId: string, productName: string) {
    const favorite = this.page.getByTestId(`favorite-${favoriteId}`);
    await expect(favorite).toBeVisible();
    await expect(favorite.getByTestId("product-name")).toHaveText(productName);
  }
}
