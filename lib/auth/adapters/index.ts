// Factory: resolves the active adapter from config. This is the single seam where
// a concrete backend is chosen; everything upstream depends only on AuthAdapter.

import { authConfig } from "../config"
import { AuthAdapter } from "../types"
import { createLocalAdapter } from "./local"
import { createStrapiAdapter } from "./strapi"

let instance: AuthAdapter | null = null

export function getAuthAdapter(): AuthAdapter {
  if (instance) return instance
  switch (authConfig.provider) {
    case "strapi":
      instance = createStrapiAdapter()
      break
    case "local":
    default:
      instance = createLocalAdapter()
      break
  }
  return instance
}
