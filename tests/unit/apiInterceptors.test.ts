import axios from "axios";
import { beforeEach, describe, expect, it } from "vitest";
import { API_ENDPOINTS } from "../../src/services/api/endpoints";
import { setupInterceptors } from "../../src/services/api/interceptors";

describe("setupInterceptors", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "" },
    });
  });

  it("does not redirect to login for public password policy requests that return 401", async () => {
    const instance = axios.create();
    setupInterceptors(instance);

    const errorHandler = (instance.interceptors.response as { handlers: Array<{ rejected?: (error: unknown) => unknown }> }).handlers[0]?.rejected;

    expect(errorHandler).toBeTypeOf("function");

    const error = {
      response: {
        status: 401,
        data: { message: "Unauthorized" },
      },
      config: {
        url: API_ENDPOINTS.PASSWORD_POLICY.BASE,
        method: "get",
        headers: {},
      },
      isAxiosError: true,
      message: "Request failed",
    };

    await expect(errorHandler?.(error as never)).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(window.location.href).toBe("");
  });
});
