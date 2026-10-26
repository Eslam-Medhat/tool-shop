import {test, expect, Page} from "@playwright/test";
import { LoginPage } from "../src/pages/login-page";
import { ProductPage } from "../src/pages/product-page";
import { NavbarComponent } from "../src/pages/navbar-component";
import { CheckoutPageage } from "../src/pages/checkout-page";


test("Signin then add product to cart and proceed to checkout", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const productPage = new ProductPage(page);
  const navbarComponent = new NavbarComponent(page);
  const checkoutPage = new CheckoutPageage(page);

  // Navigate to the login page and perform login
  await loginPage.navigateToLoginPage();
  await loginPage.login(process.env.USER_EMAIL!, process.env.USER_PASSWORD!);

  // Navigate to the product page and add a product to the cart
  await productPage.navigateToProductPage();
  await productPage.addProductToCart();
  await navbarComponent.clickOnCart();

  // Validate the checkout page
  await checkoutPage.validateCheckoutPage();

  // Fill in billing address and payment details
  await checkoutPage.fillBillingAddress({
    country: "Egypt",
    postalCode: "11511",
    houseNumber: "123",
    street: "Main St",
    city: "Anytown",
    state: "CA",
  });

  await checkoutPage.fillPaymentDetails({
    paymentMethod: "Credit Card",
    creditCardNumber: "4111-1111-1111-1111",
    expirationDate: "12/2030",
    cvv: "123",
    cardHolderName: "Eslam Medhat",
  });

  // Validate order confirmation
  await checkoutPage.validateOrderConfirmation();
});
  