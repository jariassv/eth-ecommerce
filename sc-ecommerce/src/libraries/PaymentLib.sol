// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Types.sol";
import "./InvoiceLib.sol";
import "./ProductLib.sol";
import "./CompanyLib.sol";

/**
 * @title PaymentLib
 * @dev Librería para procesamiento de pagos con USDToken
 */
library PaymentLib {
    // Storage layout
    struct Storage {
        address usdTokenAddress; // Dirección del contrato USDToken
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
     * @dev Inicializar la dirección del token de pago
     * @param usdTokenAddress Dirección del contrato USDToken
     */
    function initialize(
        Storage storage self,
        address usdTokenAddress
    ) internal {
        require(usdTokenAddress != address(0), "PaymentLib: invalid token address");
        self.usdTokenAddress = usdTokenAddress;
    }

    /**
     * @dev Procesar un pago
     * @param customerAddress Dirección del cliente que paga
     * @param invoiceId ID de la factura
     * @param invoiceStorage Storage de InvoiceLib
     * @param companyStorage Storage de CompanyLib
     * @return success True si el pago fue exitoso
     */
    function processPayment(
        Storage storage self,
        address customerAddress,
        uint256 invoiceId,
        InvoiceLib.Storage storage invoiceStorage,
        CompanyLib.Storage storage companyStorage
    ) internal returns (bool) {
        require(self.usdTokenAddress != address(0), "PaymentLib: token not initialized");
        
        Types.Invoice memory invoice = InvoiceLib.getInvoice(invoiceStorage, invoiceId);
        
        require(invoice.customerAddress == customerAddress, "PaymentLib: invalid customer");
        require(!invoice.isPaid, "PaymentLib: invoice already paid");
        require(invoice.totalAmount > 0, "PaymentLib: invalid amount");

        // Obtener información de la empresa
        Types.Company memory company = CompanyLib.getCompany(companyStorage, invoice.companyId);
        require(company.isActive, "PaymentLib: company not active");

        // Transferir tokens del cliente a la empresa
        IERC20 token = IERC20(self.usdTokenAddress);
        
        require(
            token.balanceOf(customerAddress) >= invoice.totalAmount,
            "PaymentLib: insufficient balance"
        );

        require(
            token.allowance(customerAddress, address(this)) >= invoice.totalAmount,
            "PaymentLib: insufficient allowance"
        );

        // Realizar la transferencia
        bool success = token.transferFrom(
            customerAddress,
            company.companyAddress,
            invoice.totalAmount
        );

        require(success, "PaymentLib: transfer failed");

        // Reducir stock de los productos (usar invoiceStorage para obtener items)
        // Esto se manejará desde el contrato principal que tiene acceso a invoiceStorage

        return true;
    }

    /**
     * @dev Obtener la dirección del token de pago
     * @return address Dirección del contrato USDToken
     */
    function getTokenAddress(Storage storage self) internal view returns (address) {
        return self.usdTokenAddress;
    }

    /**
     * @dev Verificar si un cliente tiene saldo suficiente
     * @param customerAddress Dirección del cliente
     * @param amount Monto requerido
     * @return bool True si tiene saldo suficiente
     */
    function hasSufficientBalance(
        Storage storage self,
        address customerAddress,
        uint256 amount
    ) internal view returns (bool) {
        if (self.usdTokenAddress == address(0)) return false;
        IERC20 token = IERC20(self.usdTokenAddress);
        return token.balanceOf(customerAddress) >= amount;
    }

    /**
     * @dev Verificar si un cliente tiene allowance suficiente
     * @param customerAddress Dirección del cliente
     * @param amount Monto requerido
     * @return bool True si tiene allowance suficiente
     */
    function hasSufficientAllowance(
        Storage storage self,
        address customerAddress,
        uint256 amount
    ) internal view returns (bool) {
        if (self.usdTokenAddress == address(0)) return false;
        IERC20 token = IERC20(self.usdTokenAddress);
        return token.allowance(customerAddress, address(this)) >= amount;
    }
}

