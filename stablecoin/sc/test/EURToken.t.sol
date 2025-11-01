// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {EURToken} from "../src/EURToken.sol";

/**
 * @title EURTokenTest
 * @notice Tests unitarios para el contrato EURToken
 */
contract EURTokenTest is Test {
    EURToken public eurt;
    address public owner;
    address public user1;
    address public user2;

    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10 ** 6; // 1M EURT
    uint256 public constant MINT_AMOUNT = 100 * 10 ** 6; // 100 EURT

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);

        // Deploy EURToken
        eurt = new EURToken(owner);

        // Mint tokens iniciales al owner
        eurt.mint(owner, INITIAL_SUPPLY);
    }

    /// @notice Verifica que el deploy del contrato funciona correctamente
    function test_Deploy() public view {
        assertEq(eurt.name(), "EUR Token");
        assertEq(eurt.symbol(), "EURT");
        assertEq(eurt.decimals(), 6);
        assertEq(eurt.owner(), owner);
        assertEq(eurt.balanceOf(owner), INITIAL_SUPPLY);
        assertEq(eurt.totalSupply(), INITIAL_SUPPLY);
    }

    /// @notice Verifica que el owner puede hacer mint
    function test_OwnerCanMint() public {
        eurt.mint(user1, MINT_AMOUNT);

        assertEq(eurt.balanceOf(user1), MINT_AMOUNT);
        assertEq(eurt.totalSupply(), INITIAL_SUPPLY + MINT_AMOUNT);
    }

    /// @notice Verifica que un no-owner no puede hacer mint (debe fallar)
    function test_NonOwnerCannotMint() public {
        vm.prank(user1);
        vm.expectRevert();
        eurt.mint(user2, MINT_AMOUNT);
    }

    /// @notice Verifica que las transferencias funcionan correctamente
    function test_Transfer() public {
        eurt.transfer(user1, MINT_AMOUNT);

        assertEq(eurt.balanceOf(owner), INITIAL_SUPPLY - MINT_AMOUNT);
        assertEq(eurt.balanceOf(user1), MINT_AMOUNT);
    }

    /// @notice Verifica que las aprobaciones funcionan correctamente
    function test_ApproveAndTransferFrom() public {
        eurt.approve(user1, MINT_AMOUNT);
        assertEq(eurt.allowance(owner, user1), MINT_AMOUNT);

        vm.prank(user1);
        eurt.transferFrom(owner, user2, MINT_AMOUNT);

        assertEq(eurt.balanceOf(owner), INITIAL_SUPPLY - MINT_AMOUNT);
        assertEq(eurt.balanceOf(user2), MINT_AMOUNT);
        assertEq(eurt.allowance(owner, user1), 0);
    }

    /// @notice Verifica que el owner puede quemar tokens
    function test_OwnerCanBurn() public {
        eurt.burn(owner, MINT_AMOUNT);

        assertEq(eurt.balanceOf(owner), INITIAL_SUPPLY - MINT_AMOUNT);
        assertEq(eurt.totalSupply(), INITIAL_SUPPLY - MINT_AMOUNT);
    }

    /// @notice Verifica que no se puede transferir más tokens de los disponibles
    function test_CannotTransferInsufficientBalance() public {
        vm.expectRevert();
        eurt.transfer(user1, INITIAL_SUPPLY + 1);
    }

    /// @notice Verifica los decimales del token
    function test_Decimals() public view {
        assertEq(eurt.decimals(), 6);
    }

    /// @notice Verifica que se pueden hacer múltiples mints
    function test_MultipleMints() public {
        eurt.mint(user1, MINT_AMOUNT);
        eurt.mint(user2, MINT_AMOUNT);

        assertEq(eurt.balanceOf(user1), MINT_AMOUNT);
        assertEq(eurt.balanceOf(user2), MINT_AMOUNT);
        assertEq(eurt.totalSupply(), INITIAL_SUPPLY + MINT_AMOUNT * 2);
    }

    /// @notice Verifica que se pueden hacer múltiples burns
    function test_MultipleBurns() public {
        uint256 burnAmount = 100 * 10 ** 6;
        eurt.burn(owner, burnAmount);
        eurt.burn(owner, burnAmount);

        assertEq(eurt.balanceOf(owner), INITIAL_SUPPLY - burnAmount * 2);
        assertEq(eurt.totalSupply(), INITIAL_SUPPLY - burnAmount * 2);
    }
}
