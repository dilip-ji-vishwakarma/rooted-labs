/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */
// @jest-environment node
import path from "path";

const CLIENT = process.env.NEXT_PUBLIC_CLIENT_NAME || "";

// Loads frontend.api.config.json from the client folder in this app
const loadClientConfig = async () => {
  const cfgPath = path.join(
    process.cwd(), // <- running from nishify.io
    "src",
    "clients",
    CLIENT,
    "frontend.api.config.json"
  );
  return require(cfgPath);
};

describe("Client mocks smoke", () => {
  let routing: Record<string, any>;

  beforeAll(async () => {
    const cfg = await loadClientConfig();
    routing = cfg?.routing || {};
    expect(typeof routing).toBe("object");
    expect(Object.keys(routing).length).toBeGreaterThan(0);
  });

  const importMock = async (entity: string) => {
    const mod = await import(`@/clients/${CLIENT}/mock/${entity}.ts`);
    return (mod as any).default || (mod as any)[entity] || mod;
  };

  it("can import each entity mock module", async () => {
    for (const entity of Object.keys(routing)) {
      const mock = await importMock(entity);
      expect(typeof mock).toBe("object");
      ["options", "get", "getOne", "post", "update"].forEach((op) => {
        expect(typeof mock[op]).toBe("function");
      });
    }
  });

  it("options returns an array (fields) for each entity", async () => {
    for (const entity of Object.keys(routing)) {
      const mock = await importMock(entity);
      const fields = await mock.options();
      expect(Array.isArray(fields)).toBe(true);
    }
  });

  it("get returns an array; getOne returns an object", async () => {
    for (const entity of Object.keys(routing)) {
      const mock = await importMock(entity);
      const list = await mock.get();
      expect(Array.isArray(list)).toBe(true);
      if (list.length > 0) {
        const one = await mock.getOne(list[0].id ?? 1);
        expect(typeof one).toBe("object");
      } else {
        const one = await mock.getOne(1);
        expect(typeof one).toBe("object");
      }
    }
  });

  it("post and update behave without throwing", async () => {
    for (const entity of Object.keys(routing)) {
      const mock = await importMock(entity);
      const created = await mock.post({ name: "auto" });
      expect(typeof created).toBe("object");
      const updated = await mock.update({ id: created.id ?? 1, name: "auto2" });
      expect(typeof updated).toBe("object");
    }
  });
});
