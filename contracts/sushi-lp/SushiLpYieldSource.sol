// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.6.12;

import "@pooltogether/yield-source-interface/contracts/IYieldSource.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "./IMiniChef.sol";
import "./IUniswapRouterV2.sol";

/// @title A pooltogether yield source for lp chef token
/// @author Steffel Fenix, coco-sha
contract SushiLpYieldSource is IYieldSource, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    /// @notice Interface of the minichef contract
    IMiniChef public immutable miniChef;

    /// @notice Interface for the lp token (sushi/wone)
    IERC20 public immutable lp;

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

    address public constant SUSHISWAPV2ROUTER = 0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506;
    address public constant ONE = 0xcF664087a5bB0237a0BAd6742852ec6c8d69A27a;
    address public constant SUSHI = 0xbec775cb42abfa4288de81f387a9b1a3c4bc552a;
    uint256 public constant MAX_PPM = 10**6;
    uint32 public slippage_tolerance = 5000;

    constructor(IMiniChef _miniChef, IERC20 _lpAddr) public ReentrancyGuard() {
        require(
            address(_miniChef) != address(0),
            "miniChefSource/miniChef-not-zero-address"
        );
        require(
            address(_lpAddr) != address(0),
            "miniChefSource/lpAddr-not-zero-address"
        );

        miniChef = _miniChef;
        lpAddr = _lpAddr;

        _lpAddr.safeApprove(address(_miniChef), type(uint256).max);
    }

    /// @notice Approve lp to spend infinite miniChef (xlp)
    /// @dev Emergency function to re-approve max amount if approval amount dropped too low
    /// @return true if operation is successful
    function approveMaxAmount() external returns (bool) {
        address _miniChefAddress = address(miniChef);
        IERC20 lp = lpAddr;

        uint256 allowance = lp.allowance(address(this), _miniChefAddress);

        lp.safeIncreaseAllowance(_miniChefAddress, type(uint256).max.sub(allowance));
        return true;
    }

    /// @notice Returns the ERC20 asset token used for deposits.
    /// @return The ERC20 asset token
    function depositToken() external view override returns (address) {
        return address(lpAddr);
    }

    /// @notice Returns the total balance (in asset tokens).  This includes the deposits and interest.
    /// @return The underlying balance of asset tokens
    function balanceOfToken(address addr) external override returns (uint256) {
        if (balances[addr] == 0) return 0;

        uint256 totalShares = miniChef.totalSupply();
        uint256 miniChefBalance = lpAddr.balanceOf(address(miniChef));

        return balances[addr].mul(miniChefBalance).div(totalShares);
    }

    /// @notice Allows assets to be supplied on other user's behalf using the `to` param.
    /// @param amount The amount of `token()` to be supplied
    /// @param to The user whose balance will receive the tokens
    function supplyTokenTo(uint256 amount, address to) external override nonReentrant {
        IMiniChef chef = miniChef;
        IERC20 lp = lpAddr;

        lp.safeTransferFrom(msg.sender, address(this), amount);

        uint256 beforeBalance = chef.balanceOf(address(this));

        chef.deposit(7, amount, to);

        uint256 afterBalance = chef.balanceOf(address(this));
        uint256 balanceDiff = afterBalance.sub(beforeBalance);

        balances[to] = balances[to].add(balanceDiff);
        emit SuppliedTokenTo(msg.sender, balanceDiff, amount, to);
    }

    /// @notice Redeems tokens from the yield source to the msg.sender, it burns yield bearing tokens and returns token to the sender.
    /// @param amount The amount of `token()` to withdraw.  Denominated in `token()` as above.
    /// @dev The maxiumum that can be called for token() is calculated by balanceOfToken() above.
    /// @return The actual amount of tokens that were redeemed. This may be different from the amount passed due to the fractional math involved.
    function redeemToken(uint256 amount) external override nonReentrant returns (uint256) {
        IMiniChef chef = miniChef;
        IERC20 lp = lpAddr;

        uint256 totalShares = chef.totalSupply();
        if (totalShares == 0) return 0;

        uint256 miniChefBalance = chef.balanceOf(address(chef));
        if (miniChefBalance == 0) return 0;

        uint256 sushiBeforeBalance = lp.balanceOf(address(this));

        uint256 requiredShares = ((amount.mul(totalShares).add(totalShares))).div(miniChefBalance);
        if (requiredShares == 0) return 0;

        uint256 requiredSharesBalance = requiredShares.sub(1);
        chef.withdraw(7, amount, address(this));

        uint256 sushiAfterBalance = lp.balanceOf(address(this));

        uint256 sushiBalanceDiff = sushiAfterBalance.sub(sushiBeforeBalance);

        balances[msg.sender] = balances[msg.sender].sub(requiredSharesBalance);

        lp.safeTransfer(msg.sender, sushiBalanceDiff);
        emit RedeemedToken(msg.sender, requiredSharesBalance, amount);

        return (sushiBalanceDiff);
    }

    /// @notice harvest rewards convert them back to lp token
    function harvest() {
        chef.harvest(7, address(this));

        uint256 earned_sushi = IERC20Upgradeable(SUSHI).balanceOf(address(this));
        if (earned_sushi > 0) {
            address[] memory path = new address[](2);
            path[0] = SUSHI;
            path[1] = ONE;
            // swap Sushi to One
            IUniswapRouterV2(SUSHISWAPV2ROUTER).swapExactTokensForTokens(
                earned_crv,
                0,
                path,
                address(this),
                now
            );
        }
        // TODO: optimize adding liquidity
        // convert 50% WONE to SUSHI
         _path = new address[](2);
         _path[0] = ONE;
         _path[1] = SUSHI;
        IUniswapRouterV2(SUSHISWAPV2ROUTER).swapExactTokensForTokens(
            IERC20Upgradeable(ONE).balanceOf(address(this)).mul(500000).div(MAX_PPM),
            0, 
            _path,
            address(this),
            now
        );

        // convert to Sushi/Wone LP Tokens
        uint256 _sushiAmt = IERC20Upgradeable(SUSHI).balanceOf(address(this));
        uint256 _oneAmt = IERC20Upgradeable(ONE).balanceOf(address(this));
        IUniswapRouterV2(SUSHISWAPV2ROUTER).addLiquidity(
            SUSHI,
            ONE,
            _sushiAmt,
            _oneAmt,
            _sushiAmt.mul(MAX_PPM - slippage_tolerance).div(MAX_PPM),
            _oneAmt.mul(MAX_PPM - slippage_tolerance).div(MAX_PPM),
            address(this),
            now
        );
    
    }
}
