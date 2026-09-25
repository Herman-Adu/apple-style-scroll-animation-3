"use client"

import { createAuthClient } from "better-auth/react"

/**
 * Same-origin Better Auth client. With no baseURL it targets the current host's
 * /api/auth, so it works unchanged across localhost, the v0 preview, and
 * production. The `db` auth adapter calls signIn/signUp/signOut here; everything
 * else (profile, admin, offers) goes through server actions.
 */
export const authClient = createAuthClient()

export const { signIn, signUp, signOut } = authClient
