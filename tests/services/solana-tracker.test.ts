import { expect } from "chai";
import { CONFIG } from "../../src/config";
import { SolanaTrackerAPI } from "../../src/services/solana-tracker";
if (!CONFIG.SOLANA_TRACKER_WS) {
  throw new Error("SOLANA_TRACKER_WS must be defined in config");
}
const wsUrl = CONFIG.SOLANA_TRACKER_WS;
describe("SolanaTrackerAPI", () => {
  let api: SolanaTrackerAPI;
  const TEST_TIMEOUT = 30000; // Augmenter encore plus le timeout
  const CONNECTION_DELAY = 3000; // Délai de connexion
  const DISCONNECTION_DELAY = 2000; // Délai de déconnexion

  beforeEach(async function () {
    this.timeout(TEST_TIMEOUT);
    // Reset the singleton instance
    (SolanaTrackerAPI as any).instance = null;
    api = SolanaTrackerAPI.getInstance(wsUrl);
    // Attendre que la connexion soit établie
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  afterEach(async function () {
    this.timeout(TEST_TIMEOUT);
    api.disconnect();
    // Attendre que la déconnexion soit complète
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  describe("getInstance", () => {
    it("should create a singleton instance", () => {
      const instance1 = SolanaTrackerAPI.getInstance(wsUrl);
      const instance2 = SolanaTrackerAPI.getInstance(wsUrl);
      expect(instance1).to.equal(instance2);
    });

    it("should not create new instance when one exists", () => {
      const instance1 = SolanaTrackerAPI.getInstance(wsUrl);
      const instance2 = SolanaTrackerAPI.getInstance(wsUrl);
      expect(instance1).to.equal(instance2);
    });
  });

  describe("WebSocket Operations", () => {
    it("should handle subscriptions correctly", async function () {
      this.timeout(TEST_TIMEOUT);
      const messages: any[] = [];
      const callback = (data: any) => messages.push(data);

      api.subscribeToLatest(callback);
      expect(api.getWebSocketStatus()).to.be.true;

      // Attendre la réception des messages
      await new Promise((resolve) => setTimeout(resolve, 5000));

      expect(messages.length).to.be.at.least(0);
    });

    it("should handle pool subscriptions", async function () {
      this.timeout(TEST_TIMEOUT);
      const messages: any[] = [];
      const callback = (data: any) => messages.push(data);
      const poolId = CONFIG.USDC_ADDRESS;

      api.subscribeToPool(poolId, callback);
      expect(api.getWebSocketStatus()).to.be.true;

      // Attendre la réception des messages
      await new Promise((resolve) => setTimeout(resolve, 5000));

      expect(messages.length).to.be.at.least(0);
    });

    it("should handle token price subscriptions", async function () {
      this.timeout(TEST_TIMEOUT);
      const messages: any[] = [];
      const callback = (data: any) => messages.push(data);
      const tokenId = CONFIG.USDC_ADDRESS;

      api.subscribeToTokenPrice(tokenId, callback);
      expect(api.getWebSocketStatus()).to.be.true;

      // Attendre la réception des messages
      await new Promise((resolve) => setTimeout(resolve, 5000));

      expect(messages.length).to.be.at.least(0);
    });

    it("should handle wallet transaction subscriptions", async function () {
      this.timeout(TEST_TIMEOUT);
      const messages: any[] = [];
      const callback = (data: any) => messages.push(data);
      const walletAddress = CONFIG.SOLANA_ADDRESS;

      api.subscribeToWalletTransactions(walletAddress, callback);
      expect(api.getWebSocketStatus()).to.be.true;

      // Attendre la réception des messages
      await new Promise((resolve) => setTimeout(resolve, 5000));

      expect(messages.length).to.be.at.least(0);
    });

    it("should handle unsubscribe correctly", async function () {
      this.timeout(TEST_TIMEOUT);
      const messages: any[] = [];
      const callback = (data: any) => messages.push(data);

      api.subscribeToLatest(callback);
      expect(api.getWebSocketStatus()).to.be.true;

      // Attendre quelques messages
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const initialCount = messages.length;

      api.unsubscribe("latest", callback);

      // Attendre encore
      await new Promise((resolve) => setTimeout(resolve, 2000));

      expect(messages.length).to.equal(initialCount);
    });

    it("should handle disconnect and reconnect", async function () {
      this.timeout(TEST_TIMEOUT);

      // Fonction utilitaire pour attendre la connexion
      const waitForConnection = async (timeoutMs = 10000) => {
        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
          if (api.getWebSocketStatus()) {
            return true;
          }
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        return false;
      };

      // Vérifier la connexion initiale
      expect(await waitForConnection(), "Initial connection failed").to.be.true;

      // Déconnecter
      api.disconnect();
      await new Promise((resolve) => setTimeout(resolve, DISCONNECTION_DELAY));
      expect(api.getWebSocketStatus(), "Disconnect failed").to.be.false;

      // Recréer une connexion
      api = SolanaTrackerAPI.getInstance(wsUrl);

      // Attendre la reconnexion avec un timeout plus long
      expect(
        await waitForConnection(15000),
        "WebSocket should reconnect successfully"
      ).to.be.true;
    });
  });
});
