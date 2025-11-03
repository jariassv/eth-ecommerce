// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Types.sol";
import "./ProductLib.sol";

/**
 * @title CartLib
 * @dev Librería para gestión de carritos de compra
 */
library CartLib {
    // Storage layout
    struct Storage {
        mapping(address => Types.CartItem[]) carts; // Customer address -> CartItems[]
    }

    // Storage slot
    bytes32 private constant STORAGE_SLOT = keccak256("cart.lib.storage");

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
     * @dev Agregar un producto al carrito
     * @param customerAddress Dirección del cliente
     * @param productId ID del producto
     * @param quantity Cantidad a agregar
     */
    function addToCart(
        Storage storage self,
        address customerAddress,
        uint256 productId,
        uint256 quantity
    ) internal {
        require(customerAddress != address(0), "CartLib: invalid address");
        require(productId > 0, "CartLib: invalid productId");
        require(quantity > 0, "CartLib: quantity must be greater than 0");

        Types.CartItem[] storage cart = self.carts[customerAddress];
        
        // Buscar si el producto ya está en el carrito
        bool found = false;
        for (uint256 i = 0; i < cart.length; i++) {
            if (cart[i].productId == productId) {
                cart[i].quantity += quantity;
                found = true;
                break;
            }
        }

        // Si no está en el carrito, agregarlo
        if (!found) {
            cart.push(Types.CartItem({ productId: productId, quantity: quantity }));
        }
    }

    /**
     * @dev Remover un producto del carrito
     * @param customerAddress Dirección del cliente
     * @param productId ID del producto a remover
     */
    function removeFromCart(
        Storage storage self,
        address customerAddress,
        uint256 productId
    ) internal {
        require(customerAddress != address(0), "CartLib: invalid address");
        require(productId > 0, "CartLib: invalid productId");

        Types.CartItem[] storage cart = self.carts[customerAddress];
        
        for (uint256 i = 0; i < cart.length; i++) {
            if (cart[i].productId == productId) {
                // Mover el último elemento a la posición actual
                cart[i] = cart[cart.length - 1];
                cart.pop();
                break;
            }
        }
    }

    /**
     * @dev Actualizar cantidad de un producto en el carrito
     * @param customerAddress Dirección del cliente
     * @param productId ID del producto
     * @param quantity Nueva cantidad (0 para eliminar)
     */
    function updateCartItem(
        Storage storage self,
        address customerAddress,
        uint256 productId,
        uint256 quantity
    ) internal {
        require(customerAddress != address(0), "CartLib: invalid address");
        require(productId > 0, "CartLib: invalid productId");

        if (quantity == 0) {
            removeFromCart(self, customerAddress, productId);
            return;
        }

        Types.CartItem[] storage cart = self.carts[customerAddress];
        
        for (uint256 i = 0; i < cart.length; i++) {
            if (cart[i].productId == productId) {
                cart[i].quantity = quantity;
                return;
            }
        }

        // Si no existe, agregarlo
        cart.push(Types.CartItem({ productId: productId, quantity: quantity }));
    }

    /**
     * @dev Obtener el carrito de un cliente
     * @param customerAddress Dirección del cliente
     * @return items Array de items en el carrito
     */
    function getCart(
        Storage storage self,
        address customerAddress
    ) internal view returns (Types.CartItem[] memory) {
        return self.carts[customerAddress];
    }

    /**
     * @dev Limpiar el carrito de un cliente
     * @param customerAddress Dirección del cliente
     */
    function clearCart(
        Storage storage self,
        address customerAddress
    ) internal {
        delete self.carts[customerAddress];
    }

    /**
     * @dev Calcular el total del carrito usando ProductLib
     * @param customerAddress Dirección del cliente
     * @param productStorage Storage de ProductLib para obtener precios
     * @return total Monto total del carrito
     */
    function calculateTotal(
        Storage storage self,
        address customerAddress,
        ProductLib.Storage storage productStorage
    ) internal view returns (uint256) {
        Types.CartItem[] memory cart = self.carts[customerAddress];
        uint256 total = 0;

        for (uint256 i = 0; i < cart.length; i++) {
            Types.Product memory product = ProductLib.getProduct(productStorage, cart[i].productId);
            total += product.price * cart[i].quantity;
        }

        return total;
    }

    /**
     * @dev Obtener la cantidad de items en el carrito
     * @param customerAddress Dirección del cliente
     * @return uint256 Cantidad de items
     */
    function getCartItemCount(
        Storage storage self,
        address customerAddress
    ) internal view returns (uint256) {
        return self.carts[customerAddress].length;
    }
}

