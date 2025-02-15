# solana-sniper

A token sniping tool for Solana, leveraging Jupiter (Raydium, Orca..etc) and Jito MEV for high-performance swaps.

## Prerequisites

Ensure you have **Node.js (>=16)** and **TypeScript** installed.

### Install Node.js (if not already installed)

- **Linux/macOS:**
  ```sh
  curl -fsSL https://fnm.vercel.app/install | bash
  fnm install 18
  fnm use 18
  ```
- **Windows:**  
  [Download Node.js](https://nodejs.org/) and install the latest LTS version.

### Install TypeScript

```sh
// Install TypeScript globally
npm install -g typescript

// Install TypeScript locally
npm install --save-dev typescript
```

## Configuration

You can clone the repository and install the dependencies:

```sh
git clone https://github.com/yourusername/solana-sniper.git
cd solana-sniper
npm install
```

Create a `.env` file and add your configuration:

```
SOLANA_PRIVATE_KEY=your_private_key_here
JITO_AUTH_KEY=your_jito_key_here
```

## Usage

For testing purposes, you can start the CLI:

```sh
npm run start
```

For running tests:

```sh
npm run test
```

## License

MIT
