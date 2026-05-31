# Stock Validation — Changes Summary

## Problem
Users could add products to cart, proceed to payment, and pay successfully even when stock was 0 or insufficient. Order creation would then fail after payment was collected. Two users buying simultaneously could also oversell the same stock.

## Solution: Multi-Layer Stock Validation

Stock is now validated at **every stage** of the checkout flow:

### Layer 1: Cart Load (Frontend)
- **File**: [CartDrawer.tsx](file:///home/kushkumarkashyap7280/Desktop/welcona/welcona-35k/components/users/CartDrawer.tsx)
- When cart opens, fetches live stock from DB
- **Auto-removes** items with 0 stock (with toast notification)
- **Caps quantities** to available stock
- Shows ⚠️ warning banner listing all stock issues

### Layer 2: Proceed to Checkout (Frontend)
- Clicking "Proceed to Checkout" calls `/api/products/validate-stock` first
- If any issues found → blocks transition, shows errors, adjusts cart
- Button disabled when stock issues exist or validation in progress

### Layer 3: Before Payment Initiation (Frontend + Backend)
- `handleCheckout` calls `validateStock()` again before creating Razorpay order
- `/api/checkout/razorpay` validates stock server-side before creating payment order
- Returns `409` with `stockIssues` array if insufficient

### Layer 4: Atomic Order Creation (Backend — Race Condition Safe)
- **File**: [checkout/route.ts](file:///home/kushkumarkashyap7280/Desktop/welcona/welcona-35k/app/api/checkout/route.ts)
- Uses `SELECT ... FOR UPDATE` inside a Prisma `$transaction`
- Row-level locks prevent two concurrent orders from overselling
- Stock check + deduction + order creation all happen atomically
- If stock insufficient at this point → transaction rolls back, returns `409`

## Files Changed

| File | Change |
|------|--------|
| [CartDrawer.tsx](file:///home/kushkumarkashyap7280/Desktop/welcona/welcona-35k/components/users/CartDrawer.tsx) | Stock tracking, auto-removal, warnings, validation at each step |
| [checkout/razorpay/route.ts](file:///home/kushkumarkashyap7280/Desktop/welcona/welcona-35k/app/api/checkout/razorpay/route.ts) | Stock validation before Razorpay order creation |
| [checkout/route.ts](file:///home/kushkumarkashyap7280/Desktop/welcona/welcona-35k/app/api/checkout/route.ts) | Atomic `SELECT FOR UPDATE` transaction for race-condition-safe stock deduction |
| [validate-stock/route.ts](file:///home/kushkumarkashyap7280/Desktop/welcona/welcona-35k/app/api/products/validate-stock/route.ts) | **New** — dedicated stock validation API endpoint |
