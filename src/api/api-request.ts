import { APIRequestContext } from "@playwright/test";

export class ApiRequest {
  readonly request: APIRequestContext;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  apiUrl = "https://api.practicesoftwaretesting.com";

  async login(username: string, password: string) {
    return await this.request.post(`${this.apiUrl}/users/login`, {
      data: {
        email: username,
        password: password,
      },
    });
  }

  async getProducts(access_token: string) {
    return await this.request.get(`${this.apiUrl}/products`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
    });
  }

  async getProduct(productId: string) {
    return await this.request.get(`${this.apiUrl}/products/${productId}`);
  }

  async getFavorites(access_token: string) {
    return await this.request.get(`${this.apiUrl}/favorites`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
  }

  async addFavorite(access_token: string, productId: string) {
    return await this.request.post(`${this.apiUrl}/favorites`, {
      headers: { Authorization: `Bearer ${access_token}` },
      data: { product_id: productId },
    });
  }

  async deleteFavorite(access_token: string, favoriteId: string) {
    return await this.request.delete(
      `${this.apiUrl}/favorites/${favoriteId}`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
  }
}
