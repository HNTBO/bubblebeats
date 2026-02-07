export default {
  providers: [
    {
      // Set this to your Clerk Frontend API URL (Issuer URL from JWT Templates)
      // e.g. "https://your-app.clerk.accounts.dev"
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
