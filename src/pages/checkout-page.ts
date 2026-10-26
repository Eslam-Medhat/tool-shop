import { Page, expect } from "@playwright/test";

export interface BillingAddress {
  country: string;
  postalCode: string;
  houseNumber: string;
  street: string;
  city: string;
  state: string;
}

export interface PaymentDetails {
  paymentMethod: string;
  creditCardNumber: string;
  expirationDate: string;
  cvv: string;
  cardHolderName: string;
}

export class CheckoutPageage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async validateCheckoutPage() {
    await expect(this.page.getByTestId("product-title")).toHaveCount(1);
    await expect(this.page.getByTestId("cart-quantity")).toHaveCount(1);
    await this.page.getByTestId("proceed-1").click();
    await this.page.getByTestId("proceed-2").click();
  }

  async fillBillingAddress(address: BillingAddress) {
    await this.page
      .getByTestId("country")
      .selectOption({ label: address.country });
    await this.page.getByTestId("postal_code").fill(address.postalCode);
    await this.page.getByTestId("house_number").fill(address.houseNumber);
    await this.page.getByTestId("street").fill(address.street);
    await this.page.getByTestId("city").fill(address.city);
    await this.page.getByTestId("state").fill(address.state);
    await this.page.getByTestId("proceed-3").click();
  }

  async fillPaymentDetails(paymentDetails: PaymentDetails) {
    await this.page
      .getByTestId("payment-method")
      .selectOption({ label: paymentDetails.paymentMethod });
    await this.page
      .getByTestId("credit_card_number")
      .fill(paymentDetails.creditCardNumber);
    await this.page
      .getByTestId("expiration_date")
      .fill(paymentDetails.expirationDate);
    await this.page.getByTestId("cvv").fill(paymentDetails.cvv);
    await this.page
      .getByTestId("card_holder_name")
      .fill(paymentDetails.cardHolderName);
    await this.page.getByTestId("finish").click();
  }

  async validateOrderConfirmation() {
    await expect(
      this.page.getByTestId("payment-success-message"),
    ).toContainText("Payment was successful");
  }
}
