# Welcona MVP Notes

This document captures the current ecommerce flow, the known faults that need to be fixed, and the expected behavior for the MVP.

## Current Structure Assessment

The current route structure is generally good.

- Public pages already exist for home, about, products, login, and signup.
- User dashboard pages already exist for cart, checkout, orders, profile, and settings.
- Admin pages already exist for products, categories, orders, and admins.
- Checkout and payment flow are already connected to Razorpay.

The main issues are not route organization. The main issues are checkout correctness, stock handling, payment method modeling, and homepage merchandising.

## Current Faults That Need To Change

### 1. Stock is validated too late

Right now stock is checked at final order placement time. That means a user can add a quantity to cart, proceed to checkout, try to pay, and only then see that stock is not available.

This is a poor buying experience and can also cause avoidable payment failures.

### 2. Cart updates are not enforcing stock strongly enough on the server

The cart UI disables quantity increase when the current product quantity is reached, but the backend must still enforce this strictly.

Server-side cart actions should reject or clamp quantities that exceed available stock.

### 3. Order creation is not atomic

Order creation, stock decrement, and cart clearing should happen in a single database transaction.

Without a transaction, two users can potentially buy the same stock at the same time, causing overselling or inconsistent data.

### 4. Online payment status is too loosely modeled

The current approach treats non-COD orders as completed after the current online flow, but the real payment status should depend on verified payment data.

Payment must only be treated as successful after server-side Razorpay verification passes.

### 5. Payment method choices are too granular in the app UI

The app currently asks users to select payment sub-types such as card, UPI, and netbanking before Razorpay checkout.

This is not ideal because Razorpay itself presents the final payment methods, and the user may choose a different method inside the Razorpay modal.

Example:

- User selects UPI in the app
- User actually pays by card in Razorpay

Because of that, the app should not over-model payment sub-methods at the checkout selection step.

### 6. Delivery availability is not modeled yet

Some orders may not be serviceable due to:

- pincode coverage
- distance
- parcel size or weight
- external logistics limitations

This is especially important if COD is only available in some cases.

### 7. Homepage is too minimal for a commerce business

The current homepage is mostly a hero section.

For a factory-direct bath fittings business, the homepage should also guide buyers using category shortcuts, featured products, offers, and trust-building sections.

### 8. Operational flows are still missing

The business still needs clearer thinking around:

- shipping and logistics handling
- warranty and service flow
- customer support flow
- delivery status granularity

These are real product requirements, but they do not all need to be solved in the first MVP.

## Expected MVP Behavior

The MVP should focus on reliable product browsing, safe stock handling, and trusted order creation.

### Product and Homepage

- Home page should introduce the brand clearly.
- Home page should surface the two current categories: showers and taps.
- Home page should include popular products, discounted products, and trust signals.
- Product listing should remain searchable and filterable.

### Cart

- User should not be able to add more quantity than available stock.
- Quantity updates should be validated on the server every time.
- If stock changes after an item is added, the cart should reflect the problem before payment starts.

### Checkout

- User selects address first.
- System checks whether delivery is available for that address.
- System determines which payment options are actually allowed.
- User should generally see only two payment choices:
	- Online Payment
	- Cash on Delivery

Razorpay should handle the detailed online options such as card, UPI, and netbanking.

### Razorpay Payment Flow

Expected flow:

1. Frontend requests checkout order from backend.
2. Backend recalculates cart total from database and creates a Razorpay order.
3. Backend returns Razorpay order details to frontend.
4. Frontend opens Razorpay checkout.
5. Razorpay returns payment result to frontend.
6. Frontend sends payment identifiers and signature to backend.
7. Backend verifies the signature using the Razorpay secret.
8. Only after successful verification should the app create the final order.

Important rule:

The frontend must never be trusted as proof of payment. Payment success must be confirmed by the backend.

### Order Creation

Expected server behavior at final order placement:

1. Re-read cart from database.
2. Re-check stock for every item.
3. Recalculate totals on the server.
4. Create order, create order items, decrement stock, and clear cart in one transaction.
5. Return created order id.

### Order Status for MVP

Simple status flow is enough for now:

- PENDING
- CONFIRMED
- SHIPPED
- DELIVERED
- CANCELLED

More detailed statuses such as PACKED or OUT_FOR_DELIVERY can be added later if required by operations.

## Recommended Changes For MVP

### Priority 1: Stock correctness

- Validate stock in add-to-cart server action.
- Validate stock in update-cart server action.
- Show stock issues before payment begins.
- Use database transaction for final order creation.

### Priority 2: Payment correctness

- Simplify payment selection to Online Payment vs Cash on Delivery.
- Keep Razorpay as the source of truth for actual online payment method used.
- Verify every payment on the backend before creating order.

### Priority 3: Delivery applicability

- Add serviceability check based on selected address.
- Return allowed payment methods based on delivery rules.
- Disable COD where delivery policy does not allow it.

### Priority 4: Home page merchandising

- Add category cards for showers and taps.
- Add popular products section.
- Add offers or discounts section.
- Add trust strip such as warranty, support, factory-direct positioning, and dispatch cues.

## What Can Wait Until Later

These are important, but they should not block MVP launch:

- dedicated delivery boy module
- porter integration improvements
- detailed shipment tracking workflow
- warranty ticketing system
- post-purchase service management
- advanced support tooling
- richer admin merchandising controls such as manual featured product flags

## Product Decisions To Confirm With Factory Owner

These decisions should be confirmed with the business owner before deeper implementation:

- Is COD allowed everywhere or only in selected areas?
- Does parcel size or weight affect delivery eligibility?
- Are all shipments handled through Porter or mixed logistics?
- What are the exact warranty terms by product type?
- What support channels should appear on the site?
- Which products should be shown as featured or promoted on the homepage?

## Practical MVP Summary

For the MVP, the correct goal is:

- stable homepage
- good product discovery
- reliable cart behavior
- secure Razorpay flow
- transaction-safe order creation
- stock accuracy

If those are working properly, the business can start taking real orders while broader logistics, warranty, and support systems are planned separately.
