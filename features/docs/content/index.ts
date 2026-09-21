import type { Doc } from "../schema"
import { serverFirstPlaybook } from "./server-first-playbook"
import { strapiMigrationRunbook } from "./strapi-migration-runbook"
import { strapiContentModeling } from "./strapi-content-modeling"
import { devopsDeployObservability } from "./devops-deploy-observability"
import { commerceCartCheckout } from "./commerce-cart-checkout"
import { positioningAndSelling } from "./positioning-and-selling"

/**
 * The local docs corpus. This is the single source that the api/ seam reads
 * from today; after the Strapi migration the seam reads the CMS instead and
 * this module is retired (see the Strapi Migration Runbook).
 */
export const docs: Doc[] = [
  serverFirstPlaybook,
  strapiMigrationRunbook,
  strapiContentModeling,
  devopsDeployObservability,
  commerceCartCheckout,
  positioningAndSelling,
]
