export const cartKeys = {
  all: ["cart"] as const,
  scoped: (authId: string | null, localityVersion: string) =>
    [...cartKeys.all, authId ?? "anon", localityVersion] as const,
};