# Deploy Test Tokens on Unichain Sepolia

## Method 1: Deploy Simple ERC20 Tokens

Create a simple ERC20 contract for testing:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    uint8 private _decimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _decimals = decimals_;
        _mint(msg.sender, initialSupply * 10**decimals_);
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}
```

## Method 2: Use Existing Testnet Tokens

### Common Testnet Token Patterns:
- Many testnets use the same addresses as mainnet
- Some use modified addresses (e.g., 0x1... instead of 0x...)
- Check if Unichain Sepolia has a token bridge

## Method 3: Check Chainlink Documentation

Chainlink often provides testnet token addresses:
- Visit: https://docs.chain.link/data-feeds/price-feeds/addresses
- Look for Unichain Sepolia testnet addresses

## Method 4: Use Token Lists

Check these sources:
- CoinGecko API for testnet addresses
- TokenLists.org for verified token lists
- Uniswap's token lists (if available on Unichain)

## Method 5: Deploy Script

```bash
# Using Foundry
forge create TestToken --constructor-args "USD Coin" "USDC" 6 1000000 --rpc-url <UNICHAIN_SEPOLIA_RPC>
```
