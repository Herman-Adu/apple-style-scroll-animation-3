import { toNextJsHandler } from "better-auth/next-js"

import { auth } from "@/lib/auth/adapters/instance"

export const { GET, POST } = toNextJsHandler(auth)
