// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./libraries/Types.sol";
import "./libraries/CompanyLib.sol";
import "./libraries/ProductLib.sol";
import "./libraries/InvoiceLib.sol";
import "./libraries/PaymentLib.sol";

/**
 * @title Ecommerce
 * @dev Contrato principal de e-commerce que integra todas las funcionalidades
 */
contract Ecommerce is Ownable {
    using CompanyLib for CompanyLib.Storage;
    using ProductLib for ProductLib.Storage;
    using InvoiceLib for InvoiceLib.Storage;
    using PaymentLib for PaymentLib.Storage;

    // Storages de las librerías
    CompanyLib.Storage private companyStorage;
    ProductLib.Storage private productStorage;
    InvoiceLib.Storage private invoiceStorage;
    PaymentLib.Storage private paymentStorage;
    
    // Cart storage - directamente en el contrato para evitar problemas con mappings en structs
    mapping(bytes32 => Types.CartItem) private cartItems; // keccak256(customerAddress, index) -> CartItem
    mapping(address => uint256) private cartItemCounts; // Customer address -> item count

    // Eventos
    event CompanyRegistered(
        uint256 indexed companyId,
        address indexed companyAddress,
        string name
    );

    event ProductAdded(
        uint256 indexed productId,
        uint256 indexed companyId,
        string name,
        uint256 price
    );

    event ProductUpdated(
        uint256 indexed productId,
        uint256 price,
        uint256 stock
    );

    event AddedToCart(
        address indexed customer,
        uint256 indexed productId,
        uint256 quantity
    );

    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed customer,
        uint256 indexed companyId,
        uint256 totalAmount
    );

    event PaymentProcessed(
        uint256 indexed invoiceId,
        address indexed customer,
        uint256 indexed companyId,
        uint256 amount,
        bytes32 paymentTxHash
    );

    /**
     * @dev Constructor
     * @param initialOwner Dirección del propietario del contrato
     * @param usdTokenAddress Dirección del contrato USDToken
     */
    constructor(address initialOwner, address usdTokenAddress) Ownable(initialOwner) {
        require(usdTokenAddress != address(0), "Ecommerce: invalid token address");
        paymentStorage.initialize(usdTokenAddress);
    }

    // ============ EMPRESAS ============

    /**
     * @dev Registrar una nueva empresa
     * @param name Nombre de la empresa
     * @param taxId ID fiscal de la empresa
     * @return companyId ID de la empresa creada
     */
    function registerCompany(
        string memory name,
        string memory taxId
    ) external returns (uint256) {
        uint256 companyId = companyStorage.registerCompany(msg.sender, name, taxId);
        emit CompanyRegistered(companyId, msg.sender, name);
        return companyId;
    }

    /**
     * @dev Obtener información de una empresa
     * @param companyId ID de la empresa
     * @return company Datos de la empresa
     */
    function getCompany(
        uint256 companyId
    ) external view returns (Types.Company memory) {
        return companyStorage.getCompany(companyId);
    }

    /**
     * @dev Obtener ID de empresa por dirección
     * @param companyAddress Dirección de la empresa
     * @return companyId ID de la empresa (0 si no existe)
     */
    function getCompanyIdByAddress(
        address companyAddress
    ) external view returns (uint256) {
        return companyStorage.getCompanyIdByAddress(companyAddress);
    }

    /**
     * @dev Desactivar/activar una empresa (solo owner del contrato)
     * @param companyId ID de la empresa
     * @param isActive Nuevo estado
     */
    function setCompanyActive(uint256 companyId, bool isActive) external onlyOwner {
        companyStorage.setCompanyActive(companyId, isActive);
    }

    /**
     * @dev Obtener el total de empresas registradas
     * @return uint256 Cantidad de empresas
     */
    function getCompanyCount() external view returns (uint256) {
        return companyStorage.getCompanyCount();
    }

    // ============ PRODUCTOS ============

    /**
     * @dev Agregar un nuevo producto (solo empresas registradas)
     * @param name Nombre del producto
     * @param description Descripción del producto
     * @param price Precio en centavos (6 decimals)
     * @param stock Cantidad inicial en stock
     * @param ipfsImageHash Hash IPFS de la imagen principal
     * @param ipfsAdditionalImages Array de hashes IPFS de imágenes adicionales
     * @return productId ID del producto creado
     */
    function addProduct(
        string memory name,
        string memory description,
        uint256 price,
        uint256 stock,
        string memory ipfsImageHash,
        string[] memory ipfsAdditionalImages
    ) external returns (uint256) {
        uint256 companyId = companyStorage.getCompanyIdByAddress(msg.sender);
        require(companyId > 0, "Ecommerce: not a registered company");
        require(
            companyStorage.getCompany(companyId).isActive,
            "Ecommerce: company not active"
        );

        uint256 productId = productStorage.addProduct(
            companyId,
            name,
            description,
            price,
            stock,
            ipfsImageHash,
            ipfsAdditionalImages
        );

        emit ProductAdded(productId, companyId, name, price);
        return productId;
    }

    /**
     * @dev Obtener información de un producto
     * @param productId ID del producto
     * @return product Datos del producto
     */
    function getProduct(
        uint256 productId
    ) external view returns (Types.Product memory) {
        return productStorage.getProduct(productId);
    }

    /**
     * @dev Actualizar precio y stock de un producto (solo owner de la empresa)
     * @param productId ID del producto
     * @param price Nuevo precio
     * @param stock Nuevo stock
     */
    function updateProduct(
        uint256 productId,
        uint256 price,
        uint256 stock
    ) external {
        Types.Product memory product = productStorage.getProduct(productId);
        uint256 companyId = companyStorage.getCompanyIdByAddress(msg.sender);
        
        require(
            product.companyId == companyId && companyId > 0,
            "Ecommerce: not product owner"
        );

        productStorage.updateProduct(productId, price, stock);
        emit ProductUpdated(productId, price, stock);
    }

    /**
     * @dev Activar/desactivar un producto (solo owner de la empresa)
     * @param productId ID del producto
     * @param isActive Nuevo estado
     */
    function setProductActive(uint256 productId, bool isActive) external {
        Types.Product memory product = productStorage.getProduct(productId);
        uint256 companyId = companyStorage.getCompanyIdByAddress(msg.sender);
        
        require(
            product.companyId == companyId && companyId > 0,
            "Ecommerce: not product owner"
        );

        productStorage.setProductActive(productId, isActive);
    }

    /**
     * @dev Obtener todos los productos de una empresa
     * @param companyId ID de la empresa
     * @return products Array de productos
     */
    function getProductsByCompany(
        uint256 companyId
    ) external view returns (Types.Product[] memory) {
        return productStorage.getProductsByCompany(companyId);
    }

    /**
     * @dev Obtener todos los productos activos (catálogo)
     * @return products Array de productos activos
     */
    function getAllActiveProducts() external view returns (Types.Product[] memory) {
        return productStorage.getAllActiveProducts();
    }

    /**
     * @dev Obtener el total de productos
     * @return uint256 Cantidad de productos
     */
    function getProductCount() external view returns (uint256) {
        return productStorage.getProductCount();
    }

    // ============ CARRITO ============

    /**
     * @dev Agregar un producto al carrito
     * @param productId ID del producto
     * @param quantity Cantidad a agregar
     */
    function addToCart(uint256 productId, uint256 quantity) external {
        // Verificar que el producto existe y tiene stock
        require(
            productStorage.hasStock(productId, quantity),
            "Ecommerce: insufficient stock"
        );

        // Implementación directa del carrito
        uint256 itemCount = cartItemCounts[msg.sender];
        for (uint256 i = 0; i < itemCount; i++) {
            bytes32 key = keccak256(abi.encodePacked(msg.sender, i));
            Types.CartItem storage item = cartItems[key];
            if (item.productId == productId) {
                item.quantity += quantity;
                emit AddedToCart(msg.sender, productId, quantity);
                return;
            }
        }

        // Si no está en el carrito, agregarlo
        bytes32 newKey = keccak256(abi.encodePacked(msg.sender, itemCount));
        cartItems[newKey] = Types.CartItem({
            productId: productId,
            quantity: quantity
        });
        unchecked {
            cartItemCounts[msg.sender] = itemCount + 1;
        }
        emit AddedToCart(msg.sender, productId, quantity);
    }

    /**
     * @dev Remover un producto del carrito
     * @param productId ID del producto a remover
     */
    function removeFromCart(uint256 productId) external {
        uint256 itemCount = cartItemCounts[msg.sender];
        for (uint256 i = 0; i < itemCount; i++) {
            bytes32 key = keccak256(abi.encodePacked(msg.sender, i));
            if (cartItems[key].productId == productId) {
                // Mover el último elemento a la posición actual
                if (i < itemCount - 1) {
                    bytes32 lastKey = keccak256(abi.encodePacked(msg.sender, itemCount - 1));
                    cartItems[key] = cartItems[lastKey];
                    delete cartItems[lastKey];
                } else {
                    delete cartItems[key];
                }
                unchecked {
                    cartItemCounts[msg.sender] = itemCount - 1;
                }
                break;
            }
        }
    }

    /**
     * @dev Actualizar cantidad de un producto en el carrito
     * @param productId ID del producto
     * @param quantity Nueva cantidad (0 para eliminar)
     */
    function updateCartItem(uint256 productId, uint256 quantity) external {
        if (quantity == 0) {
            // Llamar a removeFromCart directamente
            uint256 itemCount = cartItemCounts[msg.sender];
            for (uint256 i = 0; i < itemCount; i++) {
                bytes32 key = keccak256(abi.encodePacked(msg.sender, i));
                if (cartItems[key].productId == productId) {
                    // Mover el último elemento a la posición actual
                    if (i < itemCount - 1) {
                        bytes32 lastKey = keccak256(abi.encodePacked(msg.sender, itemCount - 1));
                        cartItems[key] = cartItems[lastKey];
                        delete cartItems[lastKey];
                    } else {
                        delete cartItems[key];
                    }
                    unchecked {
                        cartItemCounts[msg.sender] = itemCount - 1;
                    }
                    return;
                }
            }
            return;
        }

        require(
            productStorage.hasStock(productId, quantity),
            "Ecommerce: insufficient stock"
        );

        uint256 itemCount = cartItemCounts[msg.sender];
        for (uint256 i = 0; i < itemCount; i++) {
            bytes32 key = keccak256(abi.encodePacked(msg.sender, i));
            if (cartItems[key].productId == productId) {
                cartItems[key].quantity = quantity;
                return;
            }
        }

        // Si no existe, agregarlo (llamada interna directa)
        bytes32 newKey = keccak256(abi.encodePacked(msg.sender, itemCount));
        cartItems[newKey] = Types.CartItem({
            productId: productId,
            quantity: quantity
        });
        unchecked {
            cartItemCounts[msg.sender] = itemCount + 1;
        }
        emit AddedToCart(msg.sender, productId, quantity);
    }

    /**
     * @dev Obtener el carrito del usuario
     * @return items Array de items en el carrito
     */
    function getCart() external view returns (Types.CartItem[] memory) {
        uint256 itemCount = cartItemCounts[msg.sender];
        Types.CartItem[] memory cart = new Types.CartItem[](itemCount);
        
        for (uint256 i = 0; i < itemCount; i++) {
            bytes32 key = keccak256(abi.encodePacked(msg.sender, i));
            cart[i] = cartItems[key];
        }
        
        return cart;
    }

    /**
     * @dev Calcular el total del carrito
     * @return total Monto total del carrito
     */
    function getCartTotal() external view returns (uint256) {
        uint256 itemCount = cartItemCounts[msg.sender];
        uint256 total = 0;

        for (uint256 i = 0; i < itemCount; i++) {
            bytes32 key = keccak256(abi.encodePacked(msg.sender, i));
            Types.CartItem memory item = cartItems[key];
            Types.Product memory product = productStorage.getProduct(item.productId);
            total += product.price * item.quantity;
        }

        return total;
    }

    /**
     * @dev Limpiar el carrito
     */
    function clearCart() external {
        uint256 itemCount = cartItemCounts[msg.sender];
        for (uint256 i = 0; i < itemCount; i++) {
            bytes32 key = keccak256(abi.encodePacked(msg.sender, i));
            delete cartItems[key];
        }
        cartItemCounts[msg.sender] = 0;
    }

    // ============ FACTURAS ============

    /**
     * @dev Crear una factura desde el carrito
     * @param companyId ID de la empresa
     * @return invoiceId ID de la factura creada
     * @return totalAmount Monto total de la factura
     */
    function createInvoice(
        uint256 companyId
    ) external returns (uint256, uint256) {
        // Obtener el carrito actual del usuario
        uint256 itemCount = cartItemCounts[msg.sender];
        Types.CartItem[] memory cart = new Types.CartItem[](itemCount);
        for (uint256 i = 0; i < itemCount; i++) {
            bytes32 key = keccak256(abi.encodePacked(msg.sender, i));
            cart[i] = cartItems[key];
        }
        
        (uint256 invoiceId, uint256 totalAmount) = invoiceStorage.createInvoiceFromCart(
            msg.sender,
            companyId,
            cart,
            productStorage
        );

        emit InvoiceCreated(invoiceId, msg.sender, companyId, totalAmount);
        return (invoiceId, totalAmount);
    }

    /**
     * @dev Obtener información de una factura
     * @param invoiceId ID de la factura
     * @return invoice Datos de la factura
     */
    function getInvoice(
        uint256 invoiceId
    ) external view returns (Types.Invoice memory) {
        return invoiceStorage.getInvoice(invoiceId);
    }

    /**
     * @dev Obtener los items de una factura
     * @param invoiceId ID de la factura
     * @return items Array de items de la factura
     */
    function getInvoiceItems(
        uint256 invoiceId
    ) external view returns (Types.CartItem[] memory) {
        return InvoiceLib.getInvoiceItems(invoiceStorage, invoiceId);
    }

    /**
     * @dev Obtener todas las facturas del usuario
     * @return invoices Array de facturas
     */
    function getMyInvoices() external view returns (Types.Invoice[] memory) {
        return invoiceStorage.getInvoicesByCustomer(msg.sender);
    }

    /**
     * @dev Obtener todas las facturas de una empresa (solo owner de la empresa)
     * @param companyId ID de la empresa
     * @return invoices Array de facturas
     */
    function getCompanyInvoices(
        uint256 companyId
    ) external view returns (Types.Invoice[] memory) {
        uint256 senderCompanyId = companyStorage.getCompanyIdByAddress(msg.sender);
        require(
            senderCompanyId == companyId && companyId > 0,
            "Ecommerce: not company owner"
        );

        return invoiceStorage.getInvoicesByCompany(companyId);
    }

    // ============ PAGOS ============

    /**
     * @dev Procesar un pago
     * @param invoiceId ID de la factura
     * @return success True si el pago fue exitoso
     */
    function processPayment(uint256 invoiceId) external returns (bool) {
        Types.Invoice memory invoice = invoiceStorage.getInvoice(invoiceId);
        
        require(invoice.customerAddress == msg.sender, "Ecommerce: invalid customer");
        require(!invoice.isPaid, "Ecommerce: invoice already paid");
        require(invoice.totalAmount > 0, "Ecommerce: invalid amount");

        // Obtener información de la empresa
        Types.Company memory company = companyStorage.getCompany(invoice.companyId);
        require(company.isActive, "Ecommerce: company not active");

        // Transferir tokens del cliente a la empresa
        IERC20 token = IERC20(paymentStorage.getTokenAddress());
        
        require(
            token.balanceOf(msg.sender) >= invoice.totalAmount,
            "Ecommerce: insufficient balance"
        );

        require(
            token.allowance(msg.sender, address(this)) >= invoice.totalAmount,
            "Ecommerce: insufficient allowance"
        );

        // Realizar la transferencia
        bool success = token.transferFrom(
            msg.sender,
            company.companyAddress,
            invoice.totalAmount
        );

        require(success, "Ecommerce: transfer failed");

        // Reducir stock de los productos
        Types.CartItem[] memory items = InvoiceLib.getInvoiceItems(invoiceStorage, invoiceId);
        for (uint256 i = 0; i < items.length; i++) {
            ProductLib.reduceStock(
                productStorage,
                items[i].productId,
                items[i].quantity
            );
        }

        bytes32 paymentTxHash = keccak256(
            abi.encodePacked(block.timestamp, invoiceId, msg.sender)
        );

        invoiceStorage.markAsPaid(invoiceId, paymentTxHash);

        emit PaymentProcessed(
            invoiceId,
            msg.sender,
            invoice.companyId,
            invoice.totalAmount,
            paymentTxHash
        );

        return true;
    }

    /**
     * @dev Obtener la dirección del token de pago
     * @return address Dirección del contrato USDToken
     */
    function getTokenAddress() external view returns (address) {
        return paymentStorage.getTokenAddress();
    }

    /**
     * @dev Verificar si el usuario tiene saldo suficiente para una factura
     * @param invoiceId ID de la factura
     * @return bool True si tiene saldo suficiente
     */
    function canPayInvoice(uint256 invoiceId) external view returns (bool) {
        Types.Invoice memory invoice = invoiceStorage.getInvoice(invoiceId);
        return paymentStorage.hasSufficientBalance(msg.sender, invoice.totalAmount) &&
               paymentStorage.hasSufficientAllowance(msg.sender, invoice.totalAmount);
    }
}

