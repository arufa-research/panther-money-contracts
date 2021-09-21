// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.6.12;

import "@pooltogether/yield-source-interface/contracts/IYieldSource.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "./IPit.sol";

/// @title A pooltogether yield source for viper pit token
/// @author Steffel Fenix, coco-sha
contract ViperPitSource is IYieldSource, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    /// @notice Interface of the viperPit contract
    IPit public immutable viperPit;

    /// @notice Interface for the viper token
    IERC20 public immutable viperAddr;

    mapping(address => uint256) public balances;

    /// @notice Emitted when asset tokens are redeemed from the yield source
    event RedeemedToken(
        address indexed from,
        uint256 shares,
        uint256 amount
    );

    /// @notice Emitted when asset tokens are supplied to the yield source
    event SuppliedTokenTo(
        address indexed from,
        uint256 shares,
        uint256 amount,
        address indexed to
    );

    constructor(IPit _viperPit, IERC20 _viperAddr) public ReentrancyGuard() {
        require(
            address(_viperPit) != address(0),
            "ViperPitSource/viperPit-not-zero-address"
        );
        require(
            address(_viperAddr) != address(0),
            "ViperPitSource/viperAddr-not-zero-address"
        );

        viperPit = _viperPit;
        viperAddr = _viperAddr;

        _viperAddr.safeApprove(address(_viperPit), type(uint256).max);
    }

    /// @notice Approve VIPER to spend infinite viperPit (xViper)
    /// @dev Emergency function to re-approve max amount if approval amount dropped too low
    /// @return true if operation is successful
    function approveMaxAmount() external returns (bool) {
        address _viperPitAddress = address(viperPit);
        IERC20 viper = viperAddr;

        uint256 allowance = viper.allowance(address(this), _viperPitAddress);

        viper.safeIncreaseAllowance(_viperPitAddress, type(uint256).max.sub(allowance));
        return true;
    }

    /// @notice Returns the ERC20 asset token used for deposits.
    /// @return The ERC20 asset token
    function depositToken() external view override returns (address) {
        return address(viperAddr);
    }

    /// @notice Returns the total balance (in asset tokens).  This includes the deposits and interest.
    /// @return The underlying balance of asset tokens
    function balanceOfToken(address addr) external override returns (uint256) {
        if (balances[addr] == 0) return 0;

        uint256 totalShares = viperPit.totalSupply();
        uint256 viperPitBalance = viperPit.balance();

        return balances[addr].mul(viperPitBalance).div(totalShares);
    }

    /// @notice Allows assets to be supplied on other user's behalf using the `to` param.
    /// @param amount The amount of `token()` to be supplied
    /// @param to The user whose balance will receive the tokens
    function supplyTokenTo(uint256 amount, address to) external override nonReentrant {
        IPit pit = viperPit;
        IERC20 viper = viperAddr;

        viper.safeTransferFrom(msg.sender, address(this), amount);

        uint256 beforeBalance = pit.balanceOf(address(this));

        pit.enter(amount);

        uint256 afterBalance = pit.balanceOf(address(this));
        uint256 balanceDiff = afterBalance.sub(beforeBalance);

        balances[to] = balances[to].add(balanceDiff);
        emit SuppliedTokenTo(msg.sender, balanceDiff, amount, to);
    }

    /// @notice Redeems tokens from the yield source to the msg.sender, it burns yield bearing tokens and returns token to the sender.
    /// @param amount The amount of `token()` to withdraw.  Denominated in `token()` as above.
    /// @dev The maxiumum that can be called for token() is calculated by balanceOfToken() above.
    /// @return The actual amount of tokens that were redeemed. This may be different from the amount passed due to the fractional math involved.
    function redeemToken(uint256 amount) external override nonReentrant returns (uint256) {
        IPit pit = viperPit;
        IERC20 viper = viperAddr;

        uint256 totalShares = pit.totalSupply();
        if (totalShares == 0) return 0;

        uint256 viperPitBalance = pit.balanceOf(address(this));
        if (viperPitBalance == 0) return 0;

        uint256 sushiBeforeBalance = viper.balanceOf(address(this));

        uint256 requiredShares = ((amount.mul(totalShares).add(totalShares))).div(viperPitBalance);
        if (requiredShares == 0) return 0;

        uint256 requiredSharesBalance = requiredShares.sub(1);
        pit.leave(requiredSharesBalance);

        uint256 sushiAfterBalance = viper.balanceOf(address(this));

        uint256 sushiBalanceDiff = sushiAfterBalance.sub(sushiBeforeBalance);

        balances[msg.sender] = balances[msg.sender].sub(requiredSharesBalance);

        viper.safeTransfer(msg.sender, sushiBalanceDiff);
        emit RedeemedToken(msg.sender, requiredSharesBalance, amount);

        return (sushiBalanceDiff);
    }
}
