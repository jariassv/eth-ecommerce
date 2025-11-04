// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {ExchangeRateOracle} from "../src/ExchangeRateOracle.sol";
import {MockUSDToken} from "../src/mocks/MockUSDToken.sol";
import {MockEURToken} from "../src/mocks/MockEURToken.sol";

contract ExchangeRateOracleTest is Test {
    ExchangeRateOracle oracle;
    MockUSDToken usdt;
    MockEURToken eurt;
    
    address owner = address(0x1);
    address user = address(0x2);
    
    // Rate inicial: 1 EUR = 1.10 USD
    uint256 constant INITIAL_RATE = 1_100_000; // 1.10 en 6 decimales
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy tokens
        usdt = new MockUSDToken(owner);
        eurt = new MockEURToken(owner);
        
        // Deploy oracle con rate inicial: 1 EUR = 1.10 USD
        oracle = new ExchangeRateOracle(
            owner,
            address(usdt),
            address(eurt),
            INITIAL_RATE
        );
        
        vm.stopPrank();
    }
    
    function test_Deploy() public {
        assertEq(oracle.getRate(), INITIAL_RATE);
        assertEq(oracle.usdtToken(), address(usdt));
        assertEq(oracle.eurtToken(), address(eurt));
        assertTrue(oracle.isRateValid());
        
        (uint256 minRate, uint256 maxRate) = oracle.getRateLimits();
        assertEq(minRate, 8e5); // 0.8
        assertEq(maxRate, 15e5); // 1.5
    }
    
    function test_ConvertEURTtoUSDT() public {
        // 100 EUR = 110 USD
        uint256 eurtAmount = 100 * 1e6; // 100 EURT
        uint256 usdtAmount = oracle.convertEURTtoUSDT(eurtAmount);
        
        assertEq(usdtAmount, 110 * 1e6); // 110 USDT
    }
    
    function test_ConvertUSDTtoEURT() public {
        // 110 USD = 100 EUR
        uint256 usdtAmount = 110 * 1e6; // 110 USDT
        uint256 eurtAmount = oracle.convertUSDTtoEURT(usdtAmount);
        
        assertEq(eurtAmount, 100 * 1e6); // 100 EURT
    }
    
    function test_ConvertEURTtoUSDT_RoundDown() public {
        // 99 EUR = 108.9 USD, debe redondear a 108900000 (108.9)
        uint256 eurtAmount = 99 * 1e6; // 99 EURT
        uint256 usdtAmount = oracle.convertEURTtoUSDT(eurtAmount);
        
        // 99 * 1.10 = 108.9
        assertEq(usdtAmount, 108_900_000);
    }
    
    function test_ConvertUSDTtoEURT_RoundDown() public {
        // 109 USD = 99.0909... EUR, debe redondear hacia abajo
        uint256 usdtAmount = 109 * 1e6; // 109 USDT
        uint256 eurtAmount = oracle.convertUSDTtoEURT(usdtAmount);
        
        // 109 * 1e6 / 1.1e6 = 99.090909... -> redondea a 99.090909
        // Con 6 decimales: 99.090909 * 1e6 = 99_090_909
        assertEq(eurtAmount, 99_090_909);
    }
    
    function test_UpdateRate() public {
        vm.startPrank(owner);
        
        // Cambiar rate a 1.15
        uint256 newRate = 1_150_000;
        oracle.updateRate(newRate);
        
        assertEq(oracle.getRate(), newRate);
        
        // Verificar conversión con nuevo rate
        uint256 eurtAmount = 100 * 1e6;
        uint256 usdtAmount = oracle.convertEURTtoUSDT(eurtAmount);
        assertEq(usdtAmount, 115 * 1e6);
        
        vm.stopPrank();
    }
    
    function test_UpdateRate_NonOwner() public {
        vm.startPrank(user);
        vm.expectRevert();
        oracle.updateRate(1_200_000);
        vm.stopPrank();
    }
    
    function test_UpdateRate_InvalidRate_Zero() public {
        vm.startPrank(owner);
        vm.expectRevert("ExchangeRateOracle: rate must be positive");
        oracle.updateRate(0);
        vm.stopPrank();
    }
    
    function test_UpdateRate_InvalidRate_TooLow() public {
        vm.startPrank(owner);
        vm.expectRevert("ExchangeRateOracle: rate out of range");
        oracle.updateRate(7e5); // 0.7, menor que 0.8
        vm.stopPrank();
    }
    
    function test_UpdateRate_InvalidRate_TooHigh() public {
        vm.startPrank(owner);
        vm.expectRevert("ExchangeRateOracle: rate out of range");
        oracle.updateRate(16e5); // 1.6, mayor que 1.5
        vm.stopPrank();
    }
    
    function test_RateValidity_Valid() public {
        assertTrue(oracle.isRateValid());
        
        // Avanzar 12 horas
        vm.warp(block.timestamp + 12 hours);
        assertTrue(oracle.isRateValid());
    }
    
    function test_RateValidity_Invalid() public {
        // Avanzar 25 horas
        vm.warp(block.timestamp + 25 hours);
        assertFalse(oracle.isRateValid());
    }
    
    function test_GetTimeSinceLastUpdate() public {
        uint256 timeElapsed = oracle.getTimeSinceLastUpdate();
        assertEq(timeElapsed, 0);
        
        // Avanzar 1 hora
        vm.warp(block.timestamp + 1 hours);
        timeElapsed = oracle.getTimeSinceLastUpdate();
        assertEq(timeElapsed, 1 hours);
    }
    
    function test_GetRateLimits() public {
        (uint256 minRate, uint256 maxRate) = oracle.getRateLimits();
        assertEq(minRate, 8e5); // 0.8
        assertEq(maxRate, 15e5); // 1.5
    }
    
    function test_Constructor_InvalidUSDTAddress() public {
        vm.expectRevert("ExchangeRateOracle: invalid USDT address");
        new ExchangeRateOracle(
            owner,
            address(0),
            address(eurt),
            INITIAL_RATE
        );
    }
    
    function test_Constructor_InvalidEURTAddress() public {
        vm.expectRevert("ExchangeRateOracle: invalid EURT address");
        new ExchangeRateOracle(
            owner,
            address(usdt),
            address(0),
            INITIAL_RATE
        );
    }
    
    function test_Constructor_InvalidInitialRate() public {
        vm.expectRevert("ExchangeRateOracle: invalid initial rate");
        new ExchangeRateOracle(
            owner,
            address(usdt),
            address(eurt),
            0
        );
    }
    
    function test_Constructor_RateOutOfRange() public {
        vm.expectRevert("ExchangeRateOracle: rate out of range");
        new ExchangeRateOracle(
            owner,
            address(usdt),
            address(eurt),
            7e5 // 0.7, fuera de rango
        );
    }
    
    function test_Event_RateUpdated() public {
        vm.startPrank(owner);
        
        uint256 oldRate = oracle.getRate();
        uint256 newRate = 1_200_000;
        
        vm.expectEmit(true, true, true, true);
        emit ExchangeRateOracle.RateUpdated(oldRate, newRate, block.timestamp);
        
        oracle.updateRate(newRate);
        
        vm.stopPrank();
    }
    
    function test_ConvertEURTtoUSDT_LargeAmount() public {
        // 1,000,000 EUR = 1,100,000 USD
        uint256 eurtAmount = 1_000_000 * 1e6;
        uint256 usdtAmount = oracle.convertEURTtoUSDT(eurtAmount);
        
        assertEq(usdtAmount, 1_100_000 * 1e6);
    }
    
    function test_ConvertUSDTtoEURT_LargeAmount() public {
        // 1,100,000 USD = 1,000,000 EUR
        uint256 usdtAmount = 1_100_000 * 1e6;
        uint256 eurtAmount = oracle.convertUSDTtoEURT(usdtAmount);
        
        assertEq(eurtAmount, 1_000_000 * 1e6);
    }
}

