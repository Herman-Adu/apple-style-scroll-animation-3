// Infrastructure adapter: real Strapi REST backend.

import { authConfig, resolveRole } from "../domain/config";
import { clearSession, establishSession } from "../actions";
import {
  AuthAdapter,
  AuthError,
  ProfileUpdate,
  Session,
  SignInInput,
  SignUpInput,
  User,
  UserProfile,
} from "../domain/types";

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(authConfig.storageKey);
}

function writeToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(authConfig.storageKey, token);
  else window.localStorage.removeItem(authConfig.storageKey);
}

function toUser(raw: unknown): User {
  const user = asRecord(raw);
  const profileRaw = asRecord(user.profile);
  const avatarRaw = asRecord(user.avatar);
  const roleRaw = asRecord(user.role);
  const profile: UserProfile = {
    displayName:
      typeof profileRaw.displayName === "string"
        ? profileRaw.displayName
        : String(user.username ?? ""),
    avatarUrl:
      typeof profileRaw.avatarUrl === "string"
        ? profileRaw.avatarUrl
        : typeof avatarRaw.url === "string"
          ? avatarRaw.url
          : undefined,
    goals: Array.isArray(profileRaw.goals)
      ? profileRaw.goals.filter(
          (goal): goal is string => typeof goal === "string",
        )
      : typeof profileRaw.goal === "string"
        ? [profileRaw.goal]
        : [],
    interests: Array.isArray(profileRaw.interests)
      ? profileRaw.interests.filter(
          (interest): interest is string => typeof interest === "string",
        )
      : [],
    newsletter: Boolean(profileRaw.newsletter),
    bio: typeof profileRaw.bio === "string" ? profileRaw.bio : undefined,
  };
  const strapiRole = String(roleRaw.name ?? roleRaw.type ?? "").toLowerCase();
  const email = String(user.email ?? "");
  const role = strapiRole === "admin" ? "admin" : resolveRole(email);
  return {
    id: String(user.id ?? ""),
    email,
    name: String(user.name ?? user.username ?? email),
    role,
    profile,
    onboardingStatus: String(
      user.onboardingStatus ?? "pending",
    ) as User["onboardingStatus"],
    createdAt: String(user.createdAt ?? new Date().toISOString()),
  };
}

async function api<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<T> {
  if (!authConfig.apiUrl) {
    throw new AuthError("NEXT_PUBLIC_API_URL is not configured.", "network");
  }
  let res: Response;
  try {
    res = await fetch(`${authConfig.apiUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new AuthError("Could not reach the server.", "network");
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new AuthError(
        "Your session has expired. Please sign in again.",
        "unauthenticated",
      );
    }
    const body = await res.json().catch(() => null);
    const bodyRecord = asRecord(body);
    const errorRecord = asRecord(bodyRecord.error);
    const message =
      typeof errorRecord.message === "string"
        ? errorRecord.message
        : "Something went wrong.";
    if (/email|taken|already/i.test(message))
      throw new AuthError(message, "email_taken");
    if (/invalid|password|identifier/i.test(message)) {
      throw new AuthError(
        "Incorrect email or password.",
        "invalid_credentials",
      );
    }
    throw new AuthError(message, "unknown");
  }
  return res.json() as Promise<T>;
}

export function createStrapiAdapter(): AuthAdapter {
  return {
    async getSession(): Promise<Session | null> {
      const token = readToken();
      if (!token) {
        await clearSession();
        return null;
      }
      try {
        const raw = await api<unknown>(
          "/api/users/me?populate=*",
          { method: "GET" },
          token,
        );
        const user = toUser(raw);
        await establishSession({
          id: user.id,
          email: user.email,
          name: user.name,
          strapiJwt: token,
        });
        return { user, token };
      } catch {
        writeToken(null);
        await clearSession();
        return null;
      }
    },

    async signUp(input: SignUpInput): Promise<Session> {
      const data = await api<{ jwt: string; user: unknown }>(
        "/api/auth/local/register",
        {
          method: "POST",
          body: JSON.stringify({
            username: input.email,
            email: input.email,
            password: input.password,
            name: input.name,
          }),
        },
      );
      writeToken(data.jwt);
      const user = toUser(data.user);
      await establishSession({
        id: user.id,
        email: user.email,
        name: user.name,
        strapiJwt: data.jwt,
      });
      return { user, token: data.jwt };
    },

    async signIn(input: SignInInput): Promise<Session> {
      const data = await api<{ jwt: string; user: unknown }>(
        "/api/auth/local",
        {
          method: "POST",
          body: JSON.stringify({
            identifier: input.email,
            password: input.password,
          }),
        },
      );
      writeToken(data.jwt);
      const user = toUser(data.user);
      await establishSession({
        id: user.id,
        email: user.email,
        name: user.name,
        strapiJwt: data.jwt,
      });
      return { user, token: data.jwt };
    },

    async signOut() {
      writeToken(null);
      await clearSession();
    },

    async updateProfile(update: ProfileUpdate): Promise<User> {
      const token = readToken();
      if (!token) throw new AuthError("Not signed in.", "unauthenticated");
      const me = await api<unknown>("/api/users/me", { method: "GET" }, token);
      const meRecord = asRecord(me);
      const meProfile = asRecord(meRecord.profile);
      const raw = await api<unknown>(
        `/api/users/${String(meRecord.id ?? "")}`,
        {
          method: "PUT",
          body: JSON.stringify({ profile: { ...meProfile, ...update } }),
        },
        token,
      );
      return toUser(raw);
    },

    async completeOnboarding(update: ProfileUpdate): Promise<User> {
      const token = readToken();
      if (!token) throw new AuthError("Not signed in.", "unauthenticated");
      const me = await api<unknown>("/api/users/me", { method: "GET" }, token);
      const meRecord = asRecord(me);
      const meProfile = asRecord(meRecord.profile);
      const raw = await api<unknown>(
        `/api/users/${String(meRecord.id ?? "")}`,
        {
          method: "PUT",
          body: JSON.stringify({
            profile: { ...meProfile, ...update },
            onboardingStatus: "complete",
          }),
        },
        token,
      );
      return toUser(raw);
    },

    async listUsers(): Promise<User[]> {
      throw new AuthError(
        "Customer management is not implemented for Strapi yet.",
        "unknown",
      );
    },
    async setUserStatus(): Promise<User> {
      throw new AuthError(
        "Customer management is not implemented for Strapi yet.",
        "unknown",
      );
    },
    async setUserRole(): Promise<User> {
      throw new AuthError(
        "Customer management is not implemented for Strapi yet.",
        "unknown",
      );
    },
    async setUserNewsletter(): Promise<User> {
      throw new AuthError(
        "Customer management is not implemented for Strapi yet.",
        "unknown",
      );
    },
    async setUserOffers(): Promise<User> {
      throw new AuthError(
        "Customer management is not implemented for Strapi yet.",
        "unknown",
      );
    },
    async markOffersRedeemed(): Promise<User> {
      throw new AuthError(
        "Customer management is not implemented for Strapi yet.",
        "unknown",
      );
    },
    async dismissOffer(): Promise<User> {
      throw new AuthError(
        "Customer management is not implemented for Strapi yet.",
        "unknown",
      );
    },
  };
}
