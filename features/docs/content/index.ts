import type { Doc } from "../schema"
import { gettingStartedWithYourDevice } from "./getting-started-with-your-device"
import { caringForYourHeadphones } from "./caring-for-your-headphones"
import { troubleshootingCommonIssues } from "./troubleshooting-common-issues"
import { frequentlyAskedQuestions } from "./frequently-asked-questions"
import { managingTheProductCatalog } from "./managing-the-product-catalog"
import { ordersAndEmailOperations } from "./orders-and-email-operations"
import { companyProfileAndSetup } from "./company-profile-and-setup"
import { emailSystemOverview } from "./email-system-overview"
import { emailTemplatesGuide } from "./email-templates-guide"
import { emailCampaignWalkthrough } from "./email-campaign-walkthrough"
import { emailCustomerMessages } from "./email-customer-messages"
import { systemArchitecture } from "./system-architecture"
import { dataLayerAndDatabase } from "./data-layer-and-database"
import { serverFirstPlaybook } from "./server-first-playbook"
import { strapiMigrationRunbook } from "./strapi-migration-runbook"
import { strapiContentModeling } from "./strapi-content-modeling"
import { devopsDeployObservability } from "./devops-deploy-observability"
import { commerceCartCheckout } from "./commerce-cart-checkout"
import { authenticationAndAccess } from "./authentication-and-access"
import { positioningAndSelling } from "./positioning-and-selling"
import { pricingAndPackaging } from "./pricing-and-packaging"
import { emailSellingPoints } from "./email-selling-points"
import { showcaseAndPortfolio } from "./showcase-and-portfolio"
import { socialAndRecruitmentMarketing } from "./social-and-recruitment-marketing"
import { salesDemoAndObjections } from "./sales-demo-and-objections"
import { productRoadmap } from "./product-roadmap"

/**
 * The local docs corpus. This is the single source that the api/ seam reads
 * from today; after the Strapi migration the seam reads the CMS instead and
 * this module is retired (see the Strapi Migration Runbook).
 */
export const docs: Doc[] = [
  // User guides (public)
  gettingStartedWithYourDevice,
  caringForYourHeadphones,
  troubleshootingCommonIssues,
  frequentlyAskedQuestions,
  // Content management (admin)
  managingTheProductCatalog,
  ordersAndEmailOperations,
  companyProfileAndSetup,
  emailSystemOverview,
  emailTemplatesGuide,
  emailCampaignWalkthrough,
  emailCustomerMessages,
  // Developer & CTO (admin)
  systemArchitecture,
  dataLayerAndDatabase,
  serverFirstPlaybook,
  strapiMigrationRunbook,
  strapiContentModeling,
  devopsDeployObservability,
  commerceCartCheckout,
  authenticationAndAccess,
  positioningAndSelling,
  pricingAndPackaging,
  emailSellingPoints,
  showcaseAndPortfolio,
  socialAndRecruitmentMarketing,
  salesDemoAndObjections,
  productRoadmap,
]
