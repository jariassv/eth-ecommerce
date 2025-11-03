// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Types.sol";
import "./InvoiceLib.sol";
import "./ProductLib.sol";

/**
 * @title ReviewLib
 * @dev Librería para gestión de reviews de productos
 */
library ReviewLib {
    // Storage layout
    struct Storage {
        mapping(uint256 => Types.Review) reviews;
        mapping(uint256 => uint256[]) reviewsByProduct; // ProductId -> ReviewIds[]
        mapping(address => uint256[]) reviewsByCustomer; // Customer address -> ReviewIds[]
        mapping(bytes32 => bool) verifiedPurchases; // keccak256(customerAddress, productId) -> has purchased
        uint256 reviewCount;
    }

    // Storage slot
    bytes32 private constant STORAGE_SLOT = keccak256("review.lib.storage");

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
     * @dev Calcular la clave para verificar compras
     */
    function _getPurchaseKey(address customerAddress, uint256 productId) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(customerAddress, productId));
    }

    /**
     * @dev Marcar que un cliente compró un producto (llamado después del pago)
     * @param customerAddress Dirección del cliente
     * @param productId ID del producto comprado
     */
    function markProductPurchased(
        Storage storage self,
        address customerAddress,
        uint256 productId
    ) internal {
        bytes32 key = _getPurchaseKey(customerAddress, productId);
        self.verifiedPurchases[key] = true;
    }

    /**
     * @dev Verificar si un cliente compró un producto
     * @param customerAddress Dirección del cliente
     * @param productId ID del producto
     * @return bool True si el cliente compró el producto
     */
    function hasPurchasedProduct(
        Storage storage self,
        address customerAddress,
        uint256 productId
    ) internal view returns (bool) {
        bytes32 key = _getPurchaseKey(customerAddress, productId);
        return self.verifiedPurchases[key];
    }

    /**
     * @dev Agregar un review de un producto
     * @param productId ID del producto
     * @param customerAddress Dirección del cliente que hace el review
     * @param rating Calificación (1-5 estrellas)
     * @param comment Comentario del review
     * @param invoiceStorage Storage de InvoiceLib para verificar compra
     * @return reviewId ID del review creado
     */
    function addReview(
        Storage storage self,
        uint256 productId,
        address customerAddress,
        uint256 rating,
        string memory comment,
        InvoiceLib.Storage storage invoiceStorage
    ) internal returns (uint256) {
        require(productId > 0, "ReviewLib: invalid productId");
        require(customerAddress != address(0), "ReviewLib: invalid customer address");
        require(rating >= 1 && rating <= 5, "ReviewLib: rating must be between 1 and 5");
        require(bytes(comment).length > 0, "ReviewLib: comment required");

        // Verificar que el cliente compró el producto (reviews verificados)
        bytes32 purchaseKey = _getPurchaseKey(customerAddress, productId);
        require(self.verifiedPurchases[purchaseKey], "ReviewLib: customer must purchase product before reviewing");

        // Verificar que el cliente no haya dejado ya un review para este producto
        uint256[] memory customerReviews = self.reviewsByCustomer[customerAddress];
        for (uint256 i = 0; i < customerReviews.length; i++) {
            require(
                self.reviews[customerReviews[i]].productId != productId,
                "ReviewLib: customer already reviewed this product"
            );
        }

        self.reviewCount++;
        uint256 reviewId = self.reviewCount;

        self.reviews[reviewId] = Types.Review({
            reviewId: reviewId,
            productId: productId,
            customerAddress: customerAddress,
            rating: rating,
            comment: comment,
            timestamp: block.timestamp,
            isVerified: true // Verificado porque requiere compra previa
        });

        self.reviewsByProduct[productId].push(reviewId);
        self.reviewsByCustomer[customerAddress].push(reviewId);

        return reviewId;
    }

    /**
     * @dev Obtener información de un review
     * @param reviewId ID del review
     * @return review Datos del review
     */
    function getReview(
        Storage storage self,
        uint256 reviewId
    ) internal view returns (Types.Review memory) {
        require(reviewId > 0 && reviewId <= self.reviewCount, "ReviewLib: invalid reviewId");
        return self.reviews[reviewId];
    }

    /**
     * @dev Obtener todos los reviews de un producto
     * @param productId ID del producto
     * @return reviews Array de reviews
     */
    function getProductReviews(
        Storage storage self,
        uint256 productId
    ) internal view returns (Types.Review[] memory) {
        uint256[] memory reviewIds = self.reviewsByProduct[productId];
        Types.Review[] memory reviews = new Types.Review[](reviewIds.length);

        for (uint256 i = 0; i < reviewIds.length; i++) {
            reviews[i] = self.reviews[reviewIds[i]];
        }

        return reviews;
    }

    /**
     * @dev Obtener todos los reviews de un cliente
     * @param customerAddress Dirección del cliente
     * @return reviews Array de reviews
     */
    function getCustomerReviews(
        Storage storage self,
        address customerAddress
    ) internal view returns (Types.Review[] memory) {
        uint256[] memory reviewIds = self.reviewsByCustomer[customerAddress];
        Types.Review[] memory reviews = new Types.Review[](reviewIds.length);

        for (uint256 i = 0; i < reviewIds.length; i++) {
            reviews[i] = self.reviews[reviewIds[i]];
        }

        return reviews;
    }

    /**
     * @dev Calcular el rating promedio de un producto
     * @param productId ID del producto
     * @return averageRating Rating promedio (0-5, con 2 decimales de precisión: 1.00 = 100)
     * @return reviewCount Cantidad de reviews
     */
    function getProductAverageRating(
        Storage storage self,
        uint256 productId
    ) internal view returns (uint256 averageRating, uint256 reviewCount) {
        uint256[] memory reviewIds = self.reviewsByProduct[productId];
        
        if (reviewIds.length == 0) {
            return (0, 0);
        }

        uint256 totalRating = 0;
        for (uint256 i = 0; i < reviewIds.length; i++) {
            totalRating += self.reviews[reviewIds[i]].rating;
        }

        // Retornar promedio con 2 decimales de precisión (1.00 = 100, 4.50 = 450)
        // Para mantener precisión sin usar decimales, multiplicamos por 100
        averageRating = (totalRating * 100) / reviewIds.length;
        reviewCount = reviewIds.length;
    }

    /**
     * @dev Obtener la cantidad total de reviews
     * @return uint256 Cantidad total de reviews
     */
    function getReviewCount(Storage storage self) internal view returns (uint256) {
        return self.reviewCount;
    }

    /**
     * @dev Obtener la cantidad de reviews de un producto
     * @param productId ID del producto
     * @return uint256 Cantidad de reviews
     */
    function getProductReviewCount(
        Storage storage self,
        uint256 productId
    ) internal view returns (uint256) {
        return self.reviewsByProduct[productId].length;
    }
}

