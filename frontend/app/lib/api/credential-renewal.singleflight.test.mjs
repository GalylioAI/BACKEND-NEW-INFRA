import assert from "node:assert/strict";
import { describe, it } from "node:test";

describe("credential renewal single-flight lock", () => {
  it("runs the underlying operation only once for concurrent callers", async () => {
    let renewalPromise = null;
    let fetchCount = 0;

    const renewCredentials = () => {
      if (!renewalPromise) {
        renewalPromise = (async () => {
          fetchCount += 1;
          await new Promise((resolve) => setTimeout(resolve, 25));
          return { access_token: "token" };
        })().finally(() => {
          renewalPromise = null;
        });
      }
      return renewalPromise;
    };

    const [first, second] = await Promise.all([
      renewCredentials(),
      renewCredentials(),
    ]);

    assert.equal(fetchCount, 1);
    assert.equal(first.access_token, "token");
    assert.equal(second.access_token, "token");
  });
});
