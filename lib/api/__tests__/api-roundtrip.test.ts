/* eslint-disable @typescript-eslint/no-require-imports */
// @jest-environment node
import path from "path";
import { fetchEntityData } from "@/lib/api/api";
import { __setMockOverrideForTests } from "@/lib/api/config";

const CLIENT = process.env.NEXT_PUBLIC_CLIENT_NAME || "";

function loadClientConfig() {
  const cfgPath = path.join(
    process.cwd(),
    "src",
    "clients",
    CLIENT,
    "frontend.api.config.json"
  );
  return require(cfgPath);
}

// type Op = 'options' | 'get' | 'getOne' | 'post' | 'update';

const runSuiteForMode = (mode: "mock" | "direct") => {
  describe(`Frontend API — ${mode.toUpperCase()} mode`, () => {
    const isMock = mode === "mock";

    beforeAll(() => {
      // flip all routing via test override
      __setMockOverrideForTests(isMock);
    });

    afterAll(() => {
      __setMockOverrideForTests(null); // clear
    });

    const cfg = loadClientConfig();
    const entities: string[] = Object.keys(cfg?.routing || {});

    it("has at least one entity", () => {
      expect(entities.length).toBeGreaterThan(0);
    });

    for (const entity of entities) {
      describe(`${entity}`, () => {
        it("options works", async () => {
          const res = await fetchEntityData(entity, "options");
          expect(Array.isArray(res)).toBe(true);
        });

        it("get / getOne work", async () => {
          const list = await fetchEntityData(entity, "get");
          expect(Array.isArray(list)).toBe(true);

          const id = list?.[0]?.id ?? 1;
          const one = await fetchEntityData(entity, "getOne", { id });
          expect(typeof one).toBe("object");
        });

        it("post / update work", async () => {
          const created = await fetchEntityData(entity, "post", {
            name: "auto",
          });
          expect(typeof created).toBe("object");
          const updated = await fetchEntityData(entity, "update", {
            ...(created?.id ? { id: created.id } : {}),
            name: "auto2",
          });
          expect(typeof updated).toBe("object");
        });
      });
    }
  });
};

// run both modes
runSuiteForMode("mock");
runSuiteForMode("direct");
