# Clerk Setup Guide

This guide covers the setup and configuration of Clerk Authentication used in this template. 

The application is built as a **Single-user Web3 DApp**, where users sign in with their personal accounts using Clerk, link their decentralized wallet addresses, and claim or withdraw their trading rebates directly. Multi-tenant workspace management (Organizations) and subscription plans (Billing) are **not** required.

---

## Clerk Setup Instructions

To configure Clerk authentication for your local development:

### 1. Create a Clerk Application
1. Go to the [Clerk Dashboard](https://dashboard.clerk.com).
2. Create a new application (e.g., `Zentrix CRM`).
3. Select the authentication methods you wish to support (e.g., Email, Google, GitHub).

### 2. Configure Environment Variables
Copy the keys from your Clerk Dashboard into your `.env.local` file:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Authentication Redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/auth/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/auth/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard/overview"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard/overview"
```

---

## User Metadata & Tier-based RBAC

This project uses Clerk's **User publicMetadata** to store decentralized wallet metadata and user tier roles client-side.

### Available Tiers
- **F0** (Master IB / CM) - Highest tier
- **F1** (Direct Sub-IB) - Mid tier
- **F2** (Retail Client / Trader) - Default tier

### Setting a User Tier in Clerk Dashboard
To test different tiers in development:
1. Navigate to **Users** in the Clerk Dashboard.
2. Select your test user.
3. Scroll down to the **Metadata** section.
4. Under **Public Metadata**, insert the following JSON block:

```json
{
  "tier": "F0"
}
```

Replace `"F0"` with `"F1"` or `"F2"` to verify sidebar navigation and permission-based route visibility dynamically.
