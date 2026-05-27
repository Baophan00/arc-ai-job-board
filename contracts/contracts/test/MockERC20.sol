// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// ⚠️  FOR LOCAL HARDHAT TESTING ONLY — DO NOT DEPLOY TO MAINNET OR ANY LIVE TESTNET ⚠️
//
// This contract is a thin wrapper around OpenZeppelin ERC20 that exposes an
// unrestricted `mint` function.  Shipping it to a real network would let anyone
// print unlimited tokens, destroying any token economics.

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    /**
     * @param name_   Human-readable token name  (e.g. "Mock USDC")
     * @param symbol_ Token ticker symbol         (e.g. "mUSDC")
     */
    constructor(string memory name_, string memory symbol_)
        ERC20(name_, symbol_)
    {}

    /**
     * @notice Mint `amount` tokens to `to`.
     * @dev    No access control — callable by anyone in tests.
     *         This is intentional: tests need to seed balances freely.
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
