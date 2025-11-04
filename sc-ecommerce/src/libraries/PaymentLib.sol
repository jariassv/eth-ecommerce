// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Types.sol";
import "./InvoiceLib.sol";
import "./ProductLib.sol";
import "./CompanyLib.sol";

// Interface del oráculo
interface IExchangeRateOracle {
    function convertUSDTtoEURT(uint256 usdtAmount) external view returns (uint256);
    function convertEURTtoUSDT(uint256 eurtAmount) external view returns (uint256);
    function isRateValid() external view returns (bool);
    function usdtToken() external view returns (address);
    function eurtToken() external view returns (address);
}

/**
 * @title PaymentLib
 * @dev Librería para procesamiento de pagos con multimoneda (USDT y EURT)
 */
library PaymentLib {
    // Storage layout
    struct Storage {
        address usdTokenAddress; // Dirección del contrato USDToken
        address eurtTokenAddress; // Dirección del contrato EURToken
        IExchangeRateOracle oracle; // Oráculo de tasa de cambio
    }

    // Storage slot
    bytes32 private constant STORAGE_SLOT = keccak256("payment.lib.storage");

    /**
     * @dev Obtener el storage de la librería
     */
    function _getStorage() private pure returns (Storage storage s) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            s.slot := slot
        }
    }

    /**
     * @dev Inicializar la dirección del token de pago y el oráculo
     * @param usdTokenAddress Dirección del contrato USDToken
     * @param eurtTokenAddress Dirección del contrato EURToken
     * @param oracleAddress Dirección del contrato ExchangeRateOracle
     */
    function initialize(
        Storage storage self,
        address usdTokenAddress,
        address eurtTokenAddress,
        address oracleAddress
    ) internal {
        require(usdTokenAddress != address(0), "PaymentLib: invalid USDT address");
        require(eurtTokenAddress != address(0), "PaymentLib: invalid EURT address");
        require(oracleAddress != address(0), "PaymentLib: invalid oracle address");
        self.usdTokenAddress = usdTokenAddress;
        self.eurtTokenAddress = eurtTokenAddress;
        self.oracle = IExchangeRateOracle(oracleAddress);
        
        // Validar que el oráculo tiene las direcciones correctas
        require(
            self.oracle.usdtToken() == usdTokenAddress,
            "PaymentLib: oracle USDT mismatch"
        );
        require(
            self.oracle.eurtToken() == eurtTokenAddress,
            "PaymentLib: oracle EURT mismatch"
        );
    }

    /**
     * @dev Procesar un pago
     * @param customerAddress Dirección del cliente que paga
     * @param invoiceId ID de la factura
     * @param invoiceStorage Storage de InvoiceLib
     * @param companyStorage Storage de CompanyLib
     * @return success True si el pago fue exitoso
     * @return paymentTokenAddress Dirección del token usado para el pago
     */
    function processPayment(
        Storage storage self,
        address customerAddress,
        uint256 invoiceId,
        InvoiceLib.Storage storage invoiceStorage,
        CompanyLib.Storage storage companyStorage
    ) internal returns (bool success, address paymentTokenAddress) {
        require(self.usdTokenAddress != address(0), "PaymentLib: token not initialized");
        
        Types.Invoice memory invoice = InvoiceLib.getInvoice(invoiceStorage, invoiceId);
        
        require(invoice.customerAddress == customerAddress, "PaymentLib: invalid customer");
        require(!invoice.isPaid, "PaymentLib: invoice already paid");
        require(invoice.totalAmount > 0, "PaymentLib: invalid amount");

        // Determinar el token de pago (si es address(0), usar USDT por defecto para backward compatibility)
        address tokenAddress = invoice.paymentToken == address(0) 
            ? self.usdTokenAddress 
            : invoice.paymentToken;
        
        // Validar que el token es soportado
        require(
            tokenAddress == self.usdTokenAddress || tokenAddress == self.eurtTokenAddress,
            "PaymentLib: unsupported payment token"
        );

        // Obtener información de la empresa
        Types.Company memory company = CompanyLib.getCompany(companyStorage, invoice.companyId);
        require(company.isActive, "PaymentLib: company not active");

        // Transferir tokens del cliente a la empresa
        IERC20 token = IERC20(tokenAddress);
        
        require(
            token.balanceOf(customerAddress) >= invoice.totalAmount,
            "PaymentLib: insufficient balance"
        );

        require(
            token.allowance(customerAddress, address(this)) >= invoice.totalAmount,
            "PaymentLib: insufficient allowance"
        );

        // Realizar la transferencia
        success = token.transferFrom(
            customerAddress,
            company.companyAddress,
            invoice.totalAmount
        );

        require(success, "PaymentLib: transfer failed");
        paymentTokenAddress = tokenAddress;

        return (success, paymentTokenAddress);
    }

    /**
     * @dev Obtener la dirección del token de pago USDT
     * @return address Dirección del contrato USDToken
     */
    function getTokenAddress(Storage storage self) internal view returns (address) {
        return self.usdTokenAddress;
    }

    /**
     * @dev Obtener la dirección del token EURT
     * @return address Dirección del contrato EURToken
     */
    function getEURTTokenAddress(Storage storage self) internal view returns (address) {
        return self.eurtTokenAddress;
    }

    /**
     * @dev Verificar si el oráculo está válido
     * @return bool True si el rate es válido
     */
    function isOracleValid(Storage storage self) internal view returns (bool) {
        return address(self.oracle) != address(0) && self.oracle.isRateValid();
    }

    /**
     * @dev Verificar si un cliente tiene saldo suficiente
     * @param customerAddress Dirección del cliente
     * @param amount Monto requerido
     * @param tokenAddress Dirección del token a verificar (USDT o EURT)
     * @return bool True si tiene saldo suficiente
     */
    function hasSufficientBalance(
        Storage storage self,
        address customerAddress,
        uint256 amount,
        address tokenAddress
    ) internal view returns (bool) {
        if (tokenAddress == address(0)) {
            tokenAddress = self.usdTokenAddress; // Default a USDT
        }
        if (tokenAddress == address(0)) return false;
        IERC20 token = IERC20(tokenAddress);
        return token.balanceOf(customerAddress) >= amount;
    }

    /**
     * @dev Verificar si un cliente tiene allowance suficiente
     * @param customerAddress Dirección del cliente
     * @param amount Monto requerido
     * @param tokenAddress Dirección del token a verificar (USDT o EURT)
     * @return bool True si tiene allowance suficiente
     */
    function hasSufficientAllowance(
        Storage storage self,
        address customerAddress,
        uint256 amount,
        address tokenAddress
    ) internal view returns (bool) {
        if (tokenAddress == address(0)) {
            tokenAddress = self.usdTokenAddress; // Default a USDT
        }
        if (tokenAddress == address(0)) return false;
        IERC20 token = IERC20(tokenAddress);
        return token.allowance(customerAddress, address(this)) >= amount;
    }
}

