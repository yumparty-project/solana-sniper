# solana-sniper

A token sniping tool for Solana, leveraging Jupiter (Raydium, Orca..etc) and Jito MEV for high-performance swaps.

## Prerequisites

- **Node.js** (>=16)
- **TypeScript**

### Install Node.js

**Linux/macOS:**

```sh
curl -fsSL https://fnm.vercel.app/install | bash
fnm install 18
fnm use 18
```

**Windows:**  
[Download Node.js](https://nodejs.org/) and install the latest LTS version.

### Install TypeScript

```sh
# Install TypeScript globally
npm install -g typescript

# Install TypeScript locally
npm install --save-dev typescript
```

## Getting Started

1. **Clone and Install**

```sh
git clone https://github.com/yourusername/solana-sniper.git
cd solana-sniper
npm install
```

2. **Configure Environment**

```sh
cp .env.example .env
```

3. **Set Environment Variables**

Edit your `.env` file:

```
SOLANA_PRIVATE_KEY=your_private_key_here    # Solana wallet private key (base58)
SOLANA_TRACKER_WS=your_websocket_url_here   # WebSocket URL for tracking
SOLANA_TRACKER_HTTP=your_http_url_here     # HTTP URL for other endpoints
SOLANA_TRACKER_API_KEY=your_api_key_here   # Solana Tracker API key
```

## Usage

### CLI Interface

```sh
npm run start
```

### Run Tests

```sh
npm run test
```

## Project Structure

```
solana-sniper/
├── src/
│   ├── services/     # Core services implementation
│   ├── helpers/      # Utility functions
│   └── config/       # Configuration management
├── tests/            # Test suites
└── examples/         # Usage examples
```

## Development

### Key Components

- [Jupiter](https://station.jup.ag/docs): DEX aggregator for optimal swap routes
- [Jito](https://jito-foundation.gitbook.io/mev): Bundle creation and protection against front-running
- [Solana Tracker](https://docs.solanatracker.io/): Real-time network monitoring

### Testing

The project includes comprehensive test suites for:

- Integration tests
- Unit tests
- Service-specific tests

### Security

- **No private key in code**: Private key is stored in environment variables
- **MEV Protection**: Utilizes Jito for protection against front-running
- **Retry Mechanism**: Retries transactions on failure with exponential backoff and priority fee increase

## License

MIT
