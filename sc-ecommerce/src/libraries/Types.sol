// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Types
 * @dev Definiciones de estructuras de datos compartidas
 */
library Types {
    /**
     * @dev Estructura de datos para una empresa
     */
    struct Company {
        uint256 companyId;
        string name;
        address companyAddress; // Wallet donde recibe pagos
        string taxId;
        bool isActive;
    }

    /**
     * @dev Estructura de datos para un producto
     */
    struct Product {
        uint256 productId;
        uint256 companyId;
        string name;
        string description;
        uint256 price; // En centavos de dólar (6 decimals)
        uint256 stock;
        string ipfsImageHash; // IPFS hash de la imagen principal
        string[] ipfsAdditionalImages; // Imágenes adicionales en IPFS
        uint256 totalSales; // Contador de ventas para analytics
        bool isActive;
    }

    /**
     * @dev Estructura de datos para un item del carrito
     */
    struct CartItem {
        uint256 productId;
        uint256 quantity;
    }

    /**
     * @dev Estructura de datos para una factura
     */
    struct Invoice {
        uint256 invoiceId;
        uint256 companyId;
        address customerAddress;
        uint256 totalAmount;
        uint256 timestamp;
        bool isPaid;
        bytes32 paymentTxHash;
        uint256 itemCount; // Cantidad de items en la factura
        address paymentToken; // Token de pago (USDT o EURT). Si es address(0), se usa USDT por defecto
        uint256 expectedTotalUSDT; // Total esperado en USDT para validación dual (solo para invoices nuevas)
    }

    /**
     * @dev Estructura de datos para un review
     */
    struct Review {
        uint256 reviewId;
        uint256 productId;
        address customerAddress;
        uint256 rating; // 1-5 estrellas
        string comment;
        uint256 timestamp;
        bool isVerified; // Verificado que compró el producto
    }
}

