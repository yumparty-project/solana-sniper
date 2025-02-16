import { expect } from "chai";
import sinon from "sinon";
import { SolanaTrackerAPI } from "../../src/services/solana-tracker";
import { WebSocketService } from "../../src/services/solana-tracker/wss";

describe("SolanaTrackerAPI", () => {
  const WS_URL = "wss://test.example.com";
  let api: SolanaTrackerAPI;
  let wsServiceStub: sinon.SinonStubbedInstance<WebSocketService>;

  beforeEach(() => {
    // Reset the singleton instance
    (SolanaTrackerAPI as any).instance = null;

    // Create stub for WebSocketService
    wsServiceStub = sinon.createStubInstance(WebSocketService);

    // Replace WebSocketService constructor with stub
    const originalWebSocketService =
      require("../../src/services/solana-tracker/wss").WebSocketService;
    sinon
      .stub(originalWebSocketService.prototype)
      .callsFake(() => wsServiceStub);

    // Create new API instance
    api = SolanaTrackerAPI.getInstance(WS_URL);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("getInstance", () => {
    it("should create a singleton instance", () => {
      const instance1 = SolanaTrackerAPI.getInstance(WS_URL);
      const instance2 = SolanaTrackerAPI.getInstance(WS_URL);

      expect(instance1).to.equal(instance2);
    });

    it("should not create new instance when one exists", () => {
      const instance1 = SolanaTrackerAPI.getInstance(WS_URL);
      const instance2 = SolanaTrackerAPI.getInstance("wss://different.url");

      expect(instance1).to.equal(instance2);
    });
  });

  describe("subscribeToLatest", () => {
    it("should join latest room and set callback", () => {
      const callback = () => {};

      api.subscribeToLatest(callback);

      expect(wsServiceStub.joinRoom.calledWith("latest")).to.be.true;
      expect(wsServiceStub.on.calledWith("latest", callback)).to.be.true;
    });
  });

  describe("subscribeToPool", () => {
    it("should join pool room and set callback", () => {
      const poolId = "test-pool-id";
      const callback = () => {};

      api.subscribeToPool(poolId, callback);

      expect(wsServiceStub.joinRoom.calledWith(`pool:${poolId}`)).to.be.true;
      expect(wsServiceStub.on.calledWith(`pool:${poolId}`, callback)).to.be
        .true;
    });
  });

  describe("subscribeToTokenPoolTransactions", () => {
    it("should join transaction room and set callback", () => {
      const tokenAddress = "test-token-address";
      const callback = () => {};

      api.subscribeToTokenPoolTransactions(tokenAddress, callback);

      expect(wsServiceStub.joinRoom.calledWith(`transaction:${tokenAddress}`))
        .to.be.true;
      expect(
        wsServiceStub.on.calledWith(`transaction:${tokenAddress}`, callback)
      ).to.be.true;
    });
  });

  describe("subscribeToTokenPrice", () => {
    it("should join price room and set callback", () => {
      const tokenId = "test-token-id";
      const callback = () => {};

      api.subscribeToTokenPrice(tokenId, callback);

      expect(wsServiceStub.joinRoom.calledWith(`price-by-token:${tokenId}`)).to
        .be.true;
      expect(wsServiceStub.on.calledWith(`price-by-token:${tokenId}`, callback))
        .to.be.true;
    });
  });

  describe("subscribeToWalletTransactions", () => {
    it("should join wallet room and set callback", () => {
      const walletAddress = "test-wallet-address";
      const callback = () => {};

      api.subscribeToWalletTransactions(walletAddress, callback);

      expect(wsServiceStub.joinRoom.calledWith(`wallet:${walletAddress}`)).to.be
        .true;
      expect(wsServiceStub.on.calledWith(`wallet:${walletAddress}`, callback))
        .to.be.true;
    });
  });

  describe("unsubscribe", () => {
    it("should leave room and remove callback", () => {
      const room = "test-room";
      const callback = () => {};

      api.unsubscribe(room, callback);

      expect(wsServiceStub.leaveRoom.calledWith(room)).to.be.true;
      expect(wsServiceStub.off.calledWith(room, callback)).to.be.true;
    });
  });

  describe("disconnect", () => {
    it("should call disconnect on WebSocketService", () => {
      api.disconnect();

      expect(wsServiceStub.disconnect.calledOnce).to.be.true;
    });
  });

  describe("getWebSocketStatus", () => {
    it("should return WebSocket connection status", () => {
      wsServiceStub.isConnected.returns(true);

      const status = api.getWebSocketStatus();

      expect(status).to.be.true;
      expect(wsServiceStub.isConnected.calledOnce).to.be.true;
    });
  });
});
