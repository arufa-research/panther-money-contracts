// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/utils/SafeCastUpgradeable.sol";

import "../registry/RegistryInterface.sol";
import "../prize-pool/yield-source/YieldSourcePrizePoolProxyFactory.sol";
import "./MultipleWinnersBuilder.sol";
import "../sushi-lp/IYieldSource.sol";

contract PoolWithMultipleWinnersBuilder {
  using SafeCastUpgradeable for uint256;

  event YieldSourcePrizePoolWithMultipleWinnersCreated(
    YieldSourcePrizePool indexed prizePool,
    MultipleWinners indexed prizeStrategy
  );

  /// @notice The configuration used to initialize the Compound Prize Pool
  struct YieldSourcePrizePoolConfig {
    IYieldSource yieldSource;
    uint256 maxExitFeeMantissa;
  }

  RegistryInterface public reserveRegistry;
  YieldSourcePrizePoolProxyFactory public yieldSourcePrizePoolProxyFactory;
  MultipleWinnersBuilder public multipleWinnersBuilder;

  constructor (
    RegistryInterface _reserveRegistry,
    YieldSourcePrizePoolProxyFactory _yieldSourcePrizePoolProxyFactory,
    MultipleWinnersBuilder _multipleWinnersBuilder
  ) public {
    require(address(_reserveRegistry) != address(0), "GlobalBuilder/reserveRegistry-not-zero");
    require(address(_yieldSourcePrizePoolProxyFactory) != address(0), "GlobalBuilder/yieldSourcePrizePoolProxyFactory-not-zero");
    require(address(_multipleWinnersBuilder) != address(0), "GlobalBuilder/multipleWinnersBuilder-not-zero");
    reserveRegistry = _reserveRegistry;
    yieldSourcePrizePoolProxyFactory = _yieldSourcePrizePoolProxyFactory;
    multipleWinnersBuilder = _multipleWinnersBuilder;
  }

  function createYieldSourceMultipleWinners(
    YieldSourcePrizePoolConfig memory prizePoolConfig,
    MultipleWinnersBuilder.MultipleWinnersConfig memory prizeStrategyConfig,
    uint8 decimals
  ) external returns (YieldSourcePrizePool) {
    YieldSourcePrizePool prizePool = yieldSourcePrizePoolProxyFactory.create();
    MultipleWinners prizeStrategy = multipleWinnersBuilder.createMultipleWinners(
      prizePool,
      prizeStrategyConfig,
      decimals,
      msg.sender
    );
    prizePool.initializeYieldSourcePrizePool(
      reserveRegistry,
      _tokens(prizeStrategy),
      prizePoolConfig.maxExitFeeMantissa,
      prizePoolConfig.yieldSource
    );
    prizePool.setPrizeStrategy(prizeStrategy);
    prizePool.setCreditPlanOf(
      address(prizeStrategy.ticket()),
      prizeStrategyConfig.ticketCreditRateMantissa.toUint128(),
      prizeStrategyConfig.ticketCreditLimitMantissa.toUint128()
    );
    prizePool.transferOwnership(msg.sender);
    emit YieldSourcePrizePoolWithMultipleWinnersCreated(prizePool, prizeStrategy);
    return prizePool;
  }

  function _tokens(MultipleWinners _multipleWinners) internal view returns (ControlledTokenInterface[] memory) {
    ControlledTokenInterface[] memory tokens = new ControlledTokenInterface[](2);
    tokens[0] = ControlledTokenInterface(address(_multipleWinners.ticket()));
    tokens[1] = ControlledTokenInterface(address(_multipleWinners.sponsorship()));
    return tokens;
  }

}
