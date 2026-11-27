import "server-only";

export function dashboardFeatures() {
  return {
    dashboard: process.env.DASHBOARD_ENABLED === "true",
    forms: process.env.PAGE_FORMS_ENABLED === "true",
    analytics: process.env.PAGE_ANALYTICS_ENABLED === "true" && (process.env.PAGE_ANALYTICS_SECRET?.length ?? 0) >= 32,
    collaboration: process.env.ORGANIZATION_INVITATIONS_ENABLED === "true",
  };
}
