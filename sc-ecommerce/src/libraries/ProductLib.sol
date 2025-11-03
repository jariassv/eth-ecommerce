// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Types.sol";
import "./CompanyLib.sol";

/**
 * @title ProductLib
 * @dev Librería para gestión de productos con control de stock
 */
library ProductLib {
    // Storage layout
    struct Storage {
        mapping(uint256 => Types.Product) products;
        mapping(uint256 => uint256[]) productsByCompany; // CompanyId -> ProductIds[]
        uint256 productCount;
    }

    // Storage slot
    bytes32 private constant STORAGE_SLOT = keccak256("product.lib.storage");

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
     * @dev Agregar un nuevo producto
     * @param companyId ID de la empresa propietaria
     * @param name Nombre del producto
     * @param description Descripción del producto
     * @param price Precio en centavos (6 decimals)
     * @param stock Cantidad inicial en stock
     * @param ipfsImageHash Hash IPFS de la imagen principal
     * @param ipfsAdditionalImages Array de hashes IPFS de imágenes adicionales
     * @return productId ID del producto creado
     */
    function addProduct(
        Storage storage self,
        uint256 companyId,
        string memory name,
        string memory description,
        uint256 price,
        uint256 stock,
        string memory ipfsImageHash,
        string[] memory ipfsAdditionalImages
    ) internal returns (uint256) {
        require(companyId > 0, "ProductLib: invalid companyId");
        require(bytes(name).length > 0, "ProductLib: name required");
        require(price > 0, "ProductLib: price must be greater than 0");

        self.productCount++;
        uint256 productId = self.productCount;

        self.products[productId] = Types.Product({
            productId: productId,
            companyId: companyId,
            name: name,
            description: description,
            price: price,
            stock: stock,
            ipfsImageHash: ipfsImageHash,
            ipfsAdditionalImages: ipfsAdditionalImages,
            totalSales: 0,
            isActive: true
        });

        self.productsByCompany[companyId].push(productId);

        return productId;
    }

    /**
     * @dev Obtener información de un producto
     * @param productId ID del producto
     * @return product Datos del producto
     */
    function getProduct(
        Storage storage self,
        uint256 productId
    ) internal view returns (Types.Product memory) {
        require(productId > 0 && productId <= self.productCount, "ProductLib: invalid productId");
        return self.products[productId];
    }

    /**
     * @dev Actualizar precio y stock de un producto
     * @param productId ID del producto
     * @param price Nuevo precio
     * @param stock Nuevo stock
     */
    function updateProduct(
        Storage storage self,
        uint256 productId,
        uint256 price,
        uint256 stock
    ) internal {
        require(productId > 0 && productId <= self.productCount, "ProductLib: invalid productId");
        require(price > 0, "ProductLib: price must be greater than 0");
        
        self.products[productId].price = price;
        self.products[productId].stock = stock;
    }

    /**
     * @dev Reducir stock de un producto (usado al vender)
     * @param productId ID del producto
     * @param quantity Cantidad a reducir
     */
    function reduceStock(
        Storage storage self,
        uint256 productId,
        uint256 quantity
    ) internal {
        require(productId > 0 && productId <= self.productCount, "ProductLib: invalid productId");
        require(
            self.products[productId].stock >= quantity,
            "ProductLib: insufficient stock"
        );
        require(self.products[productId].isActive, "ProductLib: product not active");

        self.products[productId].stock -= quantity;
        self.products[productId].totalSales += quantity;
    }

    /**
     * @dev Actualizar estado activo de un producto
     * @param productId ID del producto
     * @param isActive Nuevo estado
     */
    function setProductActive(
        Storage storage self,
        uint256 productId,
        bool isActive
    ) internal {
        require(productId > 0 && productId <= self.productCount, "ProductLib: invalid productId");
        self.products[productId].isActive = isActive;
    }

    /**
     * @dev Obtener todos los productos de una empresa
     * @param companyId ID de la empresa
     * @return products Array de productos
     */
    function getProductsByCompany(
        Storage storage self,
        uint256 companyId
    ) internal view returns (Types.Product[] memory) {
        uint256[] memory productIds = self.productsByCompany[companyId];
        Types.Product[] memory products = new Types.Product[](productIds.length);

        for (uint256 i = 0; i < productIds.length; i++) {
            products[i] = self.products[productIds[i]];
        }

        return products;
    }

    /**
     * @dev Obtener todos los productos activos (para catálogo)
     * @return products Array de productos activos
     */
    function getAllActiveProducts(
        Storage storage self
    ) internal view returns (Types.Product[] memory) {
        uint256 activeCount = 0;
        
        // Primera pasada: contar productos activos
        for (uint256 i = 1; i <= self.productCount; i++) {
            if (self.products[i].isActive) {
                activeCount++;
            }
        }

        // Segunda pasada: construir array
        Types.Product[] memory products = new Types.Product[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= self.productCount; i++) {
            if (self.products[i].isActive) {
                products[index] = self.products[i];
                index++;
            }
        }

        return products;
    }

    /**
     * @dev Verificar si hay stock suficiente
     * @param productId ID del producto
     * @param quantity Cantidad requerida
     * @return bool True si hay stock suficiente
     */
    function hasStock(
        Storage storage self,
        uint256 productId,
        uint256 quantity
    ) internal view returns (bool) {
        if (productId == 0 || productId > self.productCount) return false;
        if (!self.products[productId].isActive) return false;
        return self.products[productId].stock >= quantity;
    }

    /**
     * @dev Obtener el total de productos
     * @return uint256 Cantidad de productos
     */
    function getProductCount(Storage storage self) internal view returns (uint256) {
        return self.productCount;
    }
}

