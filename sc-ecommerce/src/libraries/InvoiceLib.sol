// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Types.sol";
import "./ProductLib.sol";
import "./PaymentLib.sol";

/**
 * @title InvoiceLib
 * @dev Librería para gestión de facturas
 */
library InvoiceLib {
    // Constantes para validación
    uint256 private constant ROUNDING_TOLERANCE_PERCENT = 1000; // 0.1% = 1000/1000000
    uint256 private constant MIN_TOLERANCE_BASE_UNITS = 100; // 100 unidades base (0.0001 con 6 decimals)
    // Storage layout
    struct Storage {
        mapping(uint256 => Types.Invoice) invoices;
        mapping(bytes32 => Types.CartItem) invoiceItems; // keccak256(invoiceId, index) -> CartItem
        mapping(uint256 => uint256) invoiceItemCounts; // invoiceId -> item count
        mapping(address => uint256[]) invoicesByCustomer; // Customer address -> InvoiceIds[]
        mapping(uint256 => uint256[]) invoicesByCompany; // CompanyId -> InvoiceIds[]
        uint256 invoiceCount;
    }
    
    /**
     * @dev Calcular la clave del mapping para un item de factura
     */
    function _getInvoiceItemKey(uint256 invoiceId, uint256 index) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(invoiceId, index));
    }

    // Storage slot
    bytes32 private constant STORAGE_SLOT = keccak256("invoice.lib.storage");

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
     * @dev Crear una factura desde el carrito con soporte multimoneda
     * @param customerAddress Dirección del cliente
     * @param companyId ID de la empresa
     * @param cart Array de items del carrito
     * @param productStorage Storage de ProductLib
     * @param paymentStorage Storage de PaymentLib
     * @param paymentToken Token de pago seleccionado (address(0) = USDT por defecto)
     * @param expectedTotalUSDT Total esperado en USDT para validación dual
     * @return invoiceId ID de la factura creada
     * @return totalAmount Monto total de la factura en el token seleccionado
     */
    function createInvoiceFromCart(
        Storage storage self,
        address customerAddress,
        uint256 companyId,
        Types.CartItem[] memory cart,
        ProductLib.Storage storage productStorage,
        PaymentLib.Storage storage paymentStorage,
        address paymentToken,
        uint256 expectedTotalUSDT
    ) internal returns (uint256 invoiceId, uint256 totalAmount) {
        require(customerAddress != address(0), "InvoiceLib: invalid customer address");
        require(companyId > 0, "InvoiceLib: invalid companyId");
        require(cart.length > 0, "InvoiceLib: cart is empty");

        // Determinar token de pago y validar
        address usdtAddress = paymentStorage.usdTokenAddress;
        if (paymentToken == address(0)) {
            paymentToken = usdtAddress;
        }
        require(
            paymentToken == usdtAddress || paymentToken == paymentStorage.eurtTokenAddress,
            "InvoiceLib: unsupported payment token"
        );

        // Calcular total en USDT y filtrar items
        (uint256 totalUSDT, uint256 itemCount) = _calculateCartTotal(
            cart,
            companyId,
            productStorage
        );
        require(itemCount > 0, "InvoiceLib: no items for this company in cart");
        require(totalUSDT > 0, "InvoiceLib: invalid total amount");

        // Validación Dual del Total
        if (expectedTotalUSDT > 0) {
            uint256 tolerance = _calculateTolerance(totalUSDT);
            require(
                totalUSDT >= expectedTotalUSDT - tolerance && 
                totalUSDT <= expectedTotalUSDT + tolerance,
                "InvoiceLib: total mismatch"
            );
        }

        // Validar oráculo y convertir si es necesario
        if (paymentToken != usdtAddress) {
            require(
                address(paymentStorage.oracle) != address(0) && 
                paymentStorage.oracle.isRateValid(),
                "InvoiceLib: oracle rate invalid"
            );
            totalAmount = paymentStorage.oracle.convertUSDTtoEURT(totalUSDT);
        } else {
            totalAmount = totalUSDT;
        }

        // Crear invoice
        self.invoiceCount++;
        invoiceId = self.invoiceCount;
        self.invoices[invoiceId] = Types.Invoice({
            invoiceId: invoiceId,
            companyId: companyId,
            customerAddress: customerAddress,
            totalAmount: totalAmount,
            timestamp: block.timestamp,
            isPaid: false,
            paymentTxHash: bytes32(0),
            itemCount: itemCount,
            paymentToken: paymentToken,
            expectedTotalUSDT: expectedTotalUSDT
        });

        // Guardar items
        _saveInvoiceItems(self, invoiceId, cart, companyId, productStorage, itemCount);
        self.invoiceItemCounts[invoiceId] = itemCount;
        self.invoicesByCustomer[customerAddress].push(invoiceId);
        self.invoicesByCompany[companyId].push(invoiceId);

        return (invoiceId, totalAmount);
    }

    /**
     * @dev Calcular el total del carrito en USDT y obtener el número de items
     */
    function _calculateCartTotal(
        Types.CartItem[] memory cart,
        uint256 companyId,
        ProductLib.Storage storage productStorage
    ) private view returns (uint256 totalUSDT, uint256 itemCount) {
        for (uint256 i = 0; i < cart.length; i++) {
            Types.Product memory product = ProductLib.getProduct(productStorage, cart[i].productId);
            
            if (product.companyId == companyId && product.isActive) {
                require(
                    ProductLib.hasStock(productStorage, cart[i].productId, cart[i].quantity),
                    "InvoiceLib: insufficient stock"
                );
                totalUSDT += product.price * cart[i].quantity;
                itemCount++;
            }
        }
    }

    /**
     * @dev Guardar items de la invoice
     */
    function _saveInvoiceItems(
        Storage storage self,
        uint256 invoiceId,
        Types.CartItem[] memory cart,
        uint256 companyId,
        ProductLib.Storage storage productStorage,
        uint256 itemCount
    ) private {
        uint256 itemIndex = 0;
        for (uint256 i = 0; i < cart.length; i++) {
            Types.Product memory product = ProductLib.getProduct(productStorage, cart[i].productId);
            if (product.companyId == companyId && product.isActive) {
                bytes32 key = _getInvoiceItemKey(invoiceId, itemIndex);
                self.invoiceItems[key] = cart[i];
                itemIndex++;
                if (itemIndex >= itemCount) break;
            }
        }
    }

    /**
     * @dev Calcular la tolerancia de redondeo (±0.1% o 100 unidades base, el mayor)
     * @param amount Monto base
     * @return tolerance Tolerancia calculada
     */
    function _calculateTolerance(uint256 amount) private pure returns (uint256) {
        uint256 percentTolerance = (amount * ROUNDING_TOLERANCE_PERCENT) / 1_000_000;
        return percentTolerance > MIN_TOLERANCE_BASE_UNITS 
            ? percentTolerance 
            : MIN_TOLERANCE_BASE_UNITS;
    }

    /**
     * @dev Obtener información de una factura
     * @param invoiceId ID de la factura
     * @return invoice Datos de la factura
     */
    function getInvoice(
        Storage storage self,
        uint256 invoiceId
    ) internal view returns (Types.Invoice memory) {
        require(invoiceId > 0 && invoiceId <= self.invoiceCount, "InvoiceLib: invalid invoiceId");
        return self.invoices[invoiceId];
    }

    /**
     * @dev Obtener los items de una factura
     * @param invoiceId ID de la factura
     * @return items Array de items de la factura
     */
    function getInvoiceItems(
        Storage storage self,
        uint256 invoiceId
    ) internal view returns (Types.CartItem[] memory) {
        require(invoiceId > 0 && invoiceId <= self.invoiceCount, "InvoiceLib: invalid invoiceId");
        uint256 itemCount = self.invoiceItemCounts[invoiceId];
        Types.CartItem[] memory items = new Types.CartItem[](itemCount);
        
        for (uint256 i = 0; i < itemCount; i++) {
            bytes32 key = _getInvoiceItemKey(invoiceId, i);
            items[i] = self.invoiceItems[key];
        }
        
        return items;
    }

    /**
     * @dev Marcar una factura como pagada
     * @param invoiceId ID de la factura
     * @param paymentTxHash Hash de la transacción de pago
     */
    function markAsPaid(
        Storage storage self,
        uint256 invoiceId,
        bytes32 paymentTxHash
    ) internal {
        require(invoiceId > 0 && invoiceId <= self.invoiceCount, "InvoiceLib: invalid invoiceId");
        require(!self.invoices[invoiceId].isPaid, "InvoiceLib: invoice already paid");
        require(paymentTxHash != bytes32(0), "InvoiceLib: invalid tx hash");

        self.invoices[invoiceId].isPaid = true;
        self.invoices[invoiceId].paymentTxHash = paymentTxHash;
    }

    /**
     * @dev Obtener todas las facturas de un cliente
     * @param customerAddress Dirección del cliente
     * @return invoices Array de facturas
     */
    function getInvoicesByCustomer(
        Storage storage self,
        address customerAddress
    ) internal view returns (Types.Invoice[] memory) {
        uint256[] memory invoiceIds = self.invoicesByCustomer[customerAddress];
        Types.Invoice[] memory invoices = new Types.Invoice[](invoiceIds.length);

        for (uint256 i = 0; i < invoiceIds.length; i++) {
            invoices[i] = self.invoices[invoiceIds[i]];
        }

        return invoices;
    }

    /**
     * @dev Obtener todas las facturas de una empresa
     * @param companyId ID de la empresa
     * @return invoices Array de facturas
     */
    function getInvoicesByCompany(
        Storage storage self,
        uint256 companyId
    ) internal view returns (Types.Invoice[] memory) {
        uint256[] memory invoiceIds = self.invoicesByCompany[companyId];
        Types.Invoice[] memory invoices = new Types.Invoice[](invoiceIds.length);

        for (uint256 i = 0; i < invoiceIds.length; i++) {
            invoices[i] = self.invoices[invoiceIds[i]];
        }

        return invoices;
    }

    /**
     * @dev Obtener el total de facturas
     * @return uint256 Cantidad de facturas
     */
    function getInvoiceCount(Storage storage self) internal view returns (uint256) {
        return self.invoiceCount;
    }
}

