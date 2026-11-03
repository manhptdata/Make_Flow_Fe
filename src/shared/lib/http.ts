export function readCookie(name: string) {
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.split("=")[1];
}

export function createIdempotencyKey() {
  return crypto.randomUUID();
}

export function currentMockScenario() {
  return new URLSearchParams(window.location.search).get("scenario") ?? "success";
}
