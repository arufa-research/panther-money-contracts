// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMiniChef is IERC20 {
  /// @notice Deposit LP tokens to MCV2 for SUSHI allocation.
  /// @param pid The index of the pool. See `poolInfo`.
  /// @param amount LP token amount to deposit.
  /// @param to The receiver of `amount` deposit benefit.
  function deposit(uint256 pid, uint256 amount, address to) external;

   /// @notice Withdraw LP tokens from MCV2.
  /// @param pid The index of the pool. See `poolInfo`.
  /// @param amount LP token amount to withdraw.
  /// @param to Receiver of the LP tokens.
  function withdraw(uint256 pid, uint256 amount, address to) external;

  /// @notice Harvest proceeds for transaction sender to `to`.
  /// @param pid The index of the pool. See `poolInfo`.
  /// @param to Receiver of SUSHI rewards.
  function harvest(uint256 pid, address to) external;
}