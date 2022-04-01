# Aegis Smart Contracts

## Seting up the environment

Install the required Node dependencies with _yarn_.

```
$ yarn install
```

Then populate the environment with the following environment variables, either through a `.env` file or in any other means.

```
MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/<alchemy-api-key>
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/<alchemy-api-key>
PRIVATE_KEY=<wallet-private-key>
```

## Running tests

```
$ yarn hardhat test
```

## Deploying to chain

For deploying to Mumbai

```
$ yarn hardhat run scripts/deploy-aegis.js --network mumbai
```

For deploying to Polygon mainnet

```
$ yarn hardhat run scripts/deploy-aegis.js --network polygon
```
