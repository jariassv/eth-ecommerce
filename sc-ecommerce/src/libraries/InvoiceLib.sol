// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Types.sol";
import "./ProductLib.sol";

/**
 * @title InvoiceLib
 * @dev Librería para gestión de facturas
 */
library InvoiceLib {
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
     * @dev Crear una factura desde el carrito
     * @param customerAddress Dirección del cliente
     * @param companyId ID de la empresa
     * @param cart Array de items del carrito
     * @param productStorage Storage de ProductLib
     * @return invoiceId ID de la factura creada
     * @return totalAmount Monto total de la factura
     */
    function createInvoiceFromCart(
        Storage storage self,
        address customerAddress,
        uint256 companyId,
        Types.CartItem[] memory cart,
        ProductLib.Storage storage productStorage
    ) internal returns (uint256, uint256) {
        require(customerAddress != address(0), "InvoiceLib: invalid customer address");
        require(companyId > 0, "InvoiceLib: invalid companyId");
        require(cart.length > 0, "InvoiceLib: cart is empty");

        // Filtrar items del carrito que pertenecen a esta empresa
        Types.CartItem[] memory companyItems = new Types.CartItem[](cart.length);
        uint256 itemCount = 0;
        uint256 totalAmount = 0;

        for (uint256 i = 0; i < cart.length; i++) {
            Types.Product memory product = ProductLib.getProduct(productStorage, cart[i].productId);
            
            if (product.companyId == companyId && product.isActive) {
                require(
                    ProductLib.hasStock(productStorage, cart[i].productId, cart[i].quantity),
                    "InvoiceLib: insufficient stock"
                );
                
                companyItems[itemCount] = cart[i];
                itemCount++;
                totalAmount += product.price * cart[i].quantity;
            }
        }

        require(itemCount > 0, "InvoiceLib: no items for this company in cart");
        require(totalAmount > 0, "InvoiceLib: invalid total amount");

        self.invoiceCount++;
        uint256 invoiceId = self.invoiceCount;

        // Crear la factura
        self.invoices[invoiceId] = Types.Invoice({
            invoiceId: invoiceId,
            companyId: companyId,
            customerAddress: customerAddress,
            totalAmount: totalAmount,
            timestamp: block.timestamp,
            isPaid: false,
            paymentTxHash: bytes32(0),
            itemCount: itemCount
        });

        // Agregar items al mapping
        uint256 itemIndex = 0;
        for (uint256 i = 0; i < cart.length; i++) {
            Types.Product memory product = ProductLib.getProduct(productStorage, cart[i].productId);
            if (product.companyId == companyId && product.isActive) {
                bytes32 key = _getInvoiceItemKey(invoiceId, itemIndex);
                self.invoiceItems[key] = cart[i];
                itemIndex++;
            }
        }

        self.invoiceItemCounts[invoiceId] = itemCount;

        self.invoicesByCustomer[customerAddress].push(invoiceId);
        self.invoicesByCompany[companyId].push(invoiceId);

        return (invoiceId, totalAmount);
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

