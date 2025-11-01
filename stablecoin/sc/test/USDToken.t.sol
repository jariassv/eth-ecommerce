// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {USDToken} from "../src/USDToken.sol";

/**
 * @title USDTokenTest
 * @notice Tests unitarios para el contrato USDToken
 */
contract USDTokenTest is Test {
    USDToken public usdt;
    address public owner;
    address public user1;
    address public user2;

    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10 ** 6; // 1M USDT
    uint256 public constant MINT_AMOUNT = 100 * 10 ** 6; // 100 USDT

    /**
     * @dev Setup inicial para cada test
     */
    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        // Deploy USDToken
        usdt = new USDToken(owner);

        // Mint tokens iniciales al owner
        usdt.mint(owner, INITIAL_SUPPLY);
    }

    /// @notice Verifica que el deploy del contrato funciona correctamente
    function test_Deploy() public view {
        assertEq(usdt.name(), "USD Token");
        assertEq(usdt.symbol(), "USDT");
        assertEq(usdt.decimals(), 6);
        assertEq(usdt.owner(), owner);
        assertEq(usdt.balanceOf(owner), INITIAL_SUPPLY);
        assertEq(usdt.totalSupply(), INITIAL_SUPPLY);
    }

    /// @notice Verifica que el owner puede hacer mint
    function test_OwnerCanMint() public {
        usdt.mint(user1, MINT_AMOUNT);

        assertEq(usdt.balanceOf(user1), MINT_AMOUNT);
        assertEq(usdt.totalSupply(), INITIAL_SUPPLY + MINT_AMOUNT);
    }

    /// @notice Verifica que un no-owner no puede hacer mint (debe fallar)
    function test_NonOwnerCannotMint() public {
        vm.prank(user1);
        vm.expectRevert();
        usdt.mint(user2, MINT_AMOUNT);
    }

    /// @notice Verifica que las transferencias funcionan correctamente
    function test_Transfer() public {
        usdt.transfer(user1, MINT_AMOUNT);

        assertEq(usdt.balanceOf(owner), INITIAL_SUPPLY - MINT_AMOUNT);
        assertEq(usdt.balanceOf(user1), MINT_AMOUNT);
    }

    /// @notice Verifica que las aprobaciones funcionan correctamente
    function test_ApproveAndTransferFrom() public {
        usdt.approve(user1, MINT_AMOUNT);
        assertEq(usdt.allowance(owner, user1), MINT_AMOUNT);

        vm.prank(user1);
        usdt.transferFrom(owner, user2, MINT_AMOUNT);

        assertEq(usdt.balanceOf(owner), INITIAL_SUPPLY - MINT_AMOUNT);
        assertEq(usdt.balanceOf(user2), MINT_AMOUNT);
        assertEq(usdt.allowance(owner, user1), 0);
    }

    /// @notice Verifica que el owner puede quemar tokens
    function test_OwnerCanBurn() public {
        usdt.burn(owner, MINT_AMOUNT);

        assertEq(usdt.balanceOf(owner), INITIAL_SUPPLY - MINT_AMOUNT);
        assertEq(usdt.totalSupply(), INITIAL_SUPPLY - MINT_AMOUNT);
    }

    /// @notice Verifica que no se puede transferir más tokens de los disponibles
    function test_CannotTransferInsufficientBalance() public {
        vm.expectRevert();
        usdt.transfer(user1, INITIAL_SUPPLY + 1);
    }

    /// @notice Verifica los decimales del token
    function test_Decimals() public view {
        assertEq(usdt.decimals(), 6);
    }

    /// @notice Verifica que se pueden hacer múltiples mints
    function test_MultipleMints() public {
        usdt.mint(user1, MINT_AMOUNT);
        usdt.mint(user2, MINT_AMOUNT);

        assertEq(usdt.balanceOf(user1), MINT_AMOUNT);
        assertEq(usdt.balanceOf(user2), MINT_AMOUNT);
        assertEq(usdt.totalSupply(), INITIAL_SUPPLY + MINT_AMOUNT * 2);
    }

    /// @notice Verifica que se pueden hacer múltiples burns
    function test_MultipleBurns() public {
        uint256 burnAmount = 100 * 10 ** 6;
        usdt.burn(owner, burnAmount);
        usdt.burn(owner, burnAmount);

        assertEq(usdt.balanceOf(owner), INITIAL_SUPPLY - burnAmount * 2);
        assertEq(usdt.totalSupply(), INITIAL_SUPPLY - burnAmount * 2);
    }
}

