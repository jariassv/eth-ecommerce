// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/Ecommerce.sol";
import "../src/libraries/Types.sol";
import "./mocks/MockUSDToken.sol";

contract EcommerceTest is Test {
    Ecommerce public ecommerce;
    MockUSDToken public usdToken;
    
    address public owner;
    address public company;
    address public customer;
    address public customer2;

    uint256 public constant INITIAL_TOKEN_SUPPLY = 1_000_000 * 10**6; // 1M tokens con 6 decimals

    event CompanyRegistered(uint256 indexed companyId, address indexed companyAddress, string name);
    event ProductAdded(uint256 indexed productId, uint256 indexed companyId, string name, uint256 price);
    event InvoiceCreated(uint256 indexed invoiceId, address indexed customer, uint256 indexed companyId, uint256 totalAmount);
    event PaymentProcessed(uint256 indexed invoiceId, address indexed customer, uint256 indexed companyId, uint256 amount, bytes32 paymentTxHash);

    function setUp() public {
        owner = address(this);
        company = address(0x1);
        customer = address(0x2);
        customer2 = address(0x3);

        // Deploy Mock USDToken
        usdToken = new MockUSDToken(owner);
        
        // Mint tokens para testing
        usdToken.mint(company, INITIAL_TOKEN_SUPPLY);
        usdToken.mint(customer, INITIAL_TOKEN_SUPPLY);
        usdToken.mint(customer2, INITIAL_TOKEN_SUPPLY);

        // Deploy Ecommerce
        ecommerce = new Ecommerce(owner, address(usdToken));
    }

    // ============ TESTS DE EMPRESAS ============

    function test_RegisterCompany() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        assertEq(companyId, 1);
        assertEq(ecommerce.getCompanyCount(), 1);

        Types.Company memory companyData = ecommerce.getCompany(companyId);
        assertEq(companyData.name, "Mi Tienda");
        assertEq(companyData.taxId, "TAX123");
        assertEq(companyData.companyAddress, company);
        assertTrue(companyData.isActive);
    }

    function test_RegisterCompanyFailsWithEmptyName() public {
        vm.prank(company);
        vm.expectRevert("CompanyLib: name required");
        ecommerce.registerCompany("", "TAX123");
    }

    function test_RegisterCompanyFailsWithEmptyTaxId() public {
        vm.prank(company);
        vm.expectRevert("CompanyLib: taxId required");
        ecommerce.registerCompany("Mi Tienda", "");
    }

    function test_RegisterMultipleCompanies() public {
        address company2 = address(0x4);
        
        vm.prank(company);
        uint256 companyId1 = ecommerce.registerCompany("Tienda 1", "TAX1");
        
        vm.prank(company2);
        uint256 companyId2 = ecommerce.registerCompany("Tienda 2", "TAX2");

        assertEq(companyId1, 1);
        assertEq(companyId2, 2);
        assertEq(ecommerce.getCompanyCount(), 2);
    }

    function test_CannotRegisterCompanyTwice() public {
        vm.prank(company);
        ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        vm.expectRevert("CompanyLib: address already registered");
        ecommerce.registerCompany("Otra Tienda", "TAX456");
    }

    function test_GetCompanyIdByAddress() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        assertEq(ecommerce.getCompanyIdByAddress(company), companyId);
        assertEq(ecommerce.getCompanyIdByAddress(address(0x999)), 0);
    }

    // ============ TESTS DE PRODUCTOS ============

    function test_AddProduct() public {
        // Registrar empresa primero
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        // Agregar producto
        vm.prank(company);
        uint256 productId = ecommerce.addProduct(
            "Producto 1",
            "Descripcion del producto",
            1000 * 10**6, // $10.00 con 6 decimals
            100, // stock
            "ipfs-hash-123",
            new string[](0)
        );

        assertEq(productId, 1);
        assertEq(ecommerce.getProductCount(), 1);

        Types.Product memory product = ecommerce.getProduct(productId);
        assertEq(product.name, "Producto 1");
        assertEq(product.price, 1000 * 10**6);
        assertEq(product.stock, 100);
        assertEq(product.companyId, companyId);
        assertTrue(product.isActive);
    }

    function test_CannotAddProductWithoutCompany() public {
        vm.prank(customer);
        vm.expectRevert("Ecommerce: not a registered company");
        ecommerce.addProduct(
            "Producto 1",
            "Descripcion",
            1000 * 10**6,
            100,
            "ipfs-hash",
            new string[](0)
        );
    }

    function test_AddMultipleProducts() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId1 = ecommerce.addProduct("Producto 1", "Desc 1", 1000 * 10**6, 100, "hash1", new string[](0));
        
        vm.prank(company);
        uint256 productId2 = ecommerce.addProduct("Producto 2", "Desc 2", 2000 * 10**6, 50, "hash2", new string[](0));

        assertEq(productId1, 1);
        assertEq(productId2, 2);
        assertEq(ecommerce.getProductCount(), 2);
    }

    function test_UpdateProduct() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        vm.prank(company);
        ecommerce.updateProduct(productId, 1500 * 10**6, 75);

        Types.Product memory product = ecommerce.getProduct(productId);
        assertEq(product.price, 1500 * 10**6);
        assertEq(product.stock, 75);
    }

    function test_CannotUpdateProductFromOtherCompany() public {
        address otherCompany = address(0x5);
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        vm.prank(otherCompany);
        vm.expectRevert("Ecommerce: not product owner");
        ecommerce.updateProduct(productId, 1500 * 10**6, 75);
    }

    function test_GetAllActiveProducts() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        ecommerce.addProduct("Producto 1", "Desc 1", 1000 * 10**6, 100, "hash1", new string[](0));
        
        vm.prank(company);
        ecommerce.addProduct("Producto 2", "Desc 2", 2000 * 10**6, 50, "hash2", new string[](0));

        Types.Product[] memory products = ecommerce.getAllActiveProducts();
        assertEq(products.length, 2);
    }

    // ============ TESTS DE CARRITO ============

    function test_AddToCart() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        vm.prank(customer);
        ecommerce.addToCart(productId, 5);

        vm.prank(customer);
        Types.CartItem[] memory cart = ecommerce.getCart();
        assertEq(cart.length, 1);
        assertEq(cart[0].productId, productId);
        assertEq(cart[0].quantity, 5);
    }

    function test_AddToCartIncreasesQuantity() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        vm.prank(customer);
        ecommerce.addToCart(productId, 5);
        
        vm.prank(customer);
        ecommerce.addToCart(productId, 3);

        vm.prank(customer);
        Types.CartItem[] memory cart = ecommerce.getCart();
        assertEq(cart.length, 1);
        assertEq(cart[0].quantity, 8);
    }

    function test_AddToCartFailsWithInsufficientStock() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 10, "hash", new string[](0));

        vm.prank(customer);
        vm.expectRevert("Ecommerce: insufficient stock");
        ecommerce.addToCart(productId, 11);
    }

    function test_GetCartTotal() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId1 = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash1", new string[](0));
        
        vm.prank(company);
        uint256 productId2 = ecommerce.addProduct("Producto 2", "Desc", 2000 * 10**6, 50, "hash2", new string[](0));

        vm.prank(customer);
        ecommerce.addToCart(productId1, 2); // 2 * $10 = $20
        
        vm.prank(customer);
        ecommerce.addToCart(productId2, 3); // 3 * $20 = $60

        vm.prank(customer);
        uint256 total = ecommerce.getCartTotal();
        assertEq(total, 8000 * 10**6); // $80 con 6 decimals
    }

    function test_ClearCart() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        vm.prank(customer);
        ecommerce.addToCart(productId, 5);
        
        vm.prank(customer);
        ecommerce.clearCart();

        vm.prank(customer);
        Types.CartItem[] memory cart = ecommerce.getCart();
        assertEq(cart.length, 0);
    }

    // ============ TESTS DE FACTURAS ============

    function test_CreateInvoice() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        vm.prank(customer);
        ecommerce.addToCart(productId, 5);

        vm.prank(customer);
        (uint256 invoiceId, uint256 totalAmount) = ecommerce.createInvoice(companyId);

        assertEq(invoiceId, 1);
        assertEq(totalAmount, 5000 * 10**6); // 5 * $10 = $50

        Types.Invoice memory invoice = ecommerce.getInvoice(invoiceId);
        assertEq(invoice.companyId, companyId);
        assertEq(invoice.customerAddress, customer);
        assertEq(invoice.totalAmount, totalAmount);
        assertFalse(invoice.isPaid);
    }

    function test_CreateInvoiceFailsWithEmptyCart() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(customer);
        vm.expectRevert("InvoiceLib: cart is empty");
        ecommerce.createInvoice(companyId);
    }

    function test_CreateInvoiceOnlyForCompanyProducts() public {
        address company2 = address(0x6);
        vm.prank(company);
        uint256 companyId1 = ecommerce.registerCompany("Tienda 1", "TAX1");
        
        vm.prank(company2);
        uint256 companyId2 = ecommerce.registerCompany("Tienda 2", "TAX2");

        vm.prank(company);
        uint256 productId1 = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash1", new string[](0));
        
        vm.prank(company2);
        uint256 productId2 = ecommerce.addProduct("Producto 2", "Desc", 2000 * 10**6, 50, "hash2", new string[](0));

        vm.prank(customer);
        ecommerce.addToCart(productId1, 2);
        
        vm.prank(customer);
        ecommerce.addToCart(productId2, 3);

        // Crear invoice solo para companyId1
        vm.prank(customer);
        (uint256 invoiceId, uint256 totalAmount) = ecommerce.createInvoice(companyId1);

        // Solo debe incluir producto de companyId1
        assertEq(totalAmount, 2000 * 10**6); // 2 * $10 = $20

        Types.CartItem[] memory items = ecommerce.getInvoiceItems(invoiceId);
        assertEq(items.length, 1);
        assertEq(items[0].productId, productId1);
    }

    // ============ TESTS DE PAGOS ============

    function test_ProcessPayment() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        vm.prank(customer);
        ecommerce.addToCart(productId, 5);

        vm.prank(customer);
        (uint256 invoiceId, uint256 totalAmount) = ecommerce.createInvoice(companyId);

        // Aprobar tokens
        vm.prank(customer);
        usdToken.approve(address(ecommerce), totalAmount);

        uint256 companyBalanceBefore = usdToken.balanceOf(company);
        uint256 customerBalanceBefore = usdToken.balanceOf(customer);

        // Procesar pago
        vm.prank(customer);
        ecommerce.processPayment(invoiceId);

        // Verificar balances
        assertEq(usdToken.balanceOf(company), companyBalanceBefore + totalAmount);
        assertEq(usdToken.balanceOf(customer), customerBalanceBefore - totalAmount);

        // Verificar invoice
        Types.Invoice memory invoice = ecommerce.getInvoice(invoiceId);
        assertTrue(invoice.isPaid);
        assertNotEq(invoice.paymentTxHash, bytes32(0));

        // Verificar stock
        Types.Product memory product = ecommerce.getProduct(productId);
        assertEq(product.stock, 95); // 100 - 5
        assertEq(product.totalSales, 5);
    }

    function test_ProcessPaymentFailsWithInsufficientBalance() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        address poorCustomer = address(0x7);
        vm.prank(poorCustomer);
        ecommerce.addToCart(productId, 5);

        vm.prank(poorCustomer);
        (uint256 invoiceId, uint256 totalAmount) = ecommerce.createInvoice(companyId);

        vm.prank(poorCustomer);
        usdToken.approve(address(ecommerce), totalAmount);

        vm.prank(poorCustomer);
        vm.expectRevert("Ecommerce: insufficient balance");
        ecommerce.processPayment(invoiceId);
    }

    function test_ProcessPaymentFailsWithInsufficientAllowance() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        vm.prank(customer);
        ecommerce.addToCart(productId, 5);

        vm.prank(customer);
        (uint256 invoiceId, uint256 totalAmount) = ecommerce.createInvoice(companyId);

        // No aprobar tokens
        vm.prank(customer);
        vm.expectRevert("Ecommerce: insufficient allowance");
        ecommerce.processPayment(invoiceId);
    }

    function test_CannotPayInvoiceTwice() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        vm.prank(customer);
        ecommerce.addToCart(productId, 5);

        vm.prank(customer);
        (uint256 invoiceId, uint256 totalAmount) = ecommerce.createInvoice(companyId);

        vm.prank(customer);
        usdToken.approve(address(ecommerce), totalAmount);

        vm.prank(customer);
        ecommerce.processPayment(invoiceId);

        vm.prank(customer);
        usdToken.approve(address(ecommerce), totalAmount);

        vm.prank(customer);
        vm.expectRevert("Ecommerce: invoice already paid");
        ecommerce.processPayment(invoiceId);
    }

    // ============ TESTS DE INTEGRACIÓN E2E ============

    function test_FullFlow() public {
        // 1. Registrar empresa
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        // 2. Agregar productos
        vm.prank(company);
        uint256 productId1 = ecommerce.addProduct("Producto 1", "Desc 1", 1000 * 10**6, 100, "hash1", new string[](0));
        
        vm.prank(company);
        uint256 productId2 = ecommerce.addProduct("Producto 2", "Desc 2", 2000 * 10**6, 50, "hash2", new string[](0));

        // 3. Cliente agrega productos al carrito
        vm.prank(customer);
        ecommerce.addToCart(productId1, 3);
        
        vm.prank(customer);
        ecommerce.addToCart(productId2, 2);

        // 4. Verificar total del carrito
        uint256 expectedTotal = (3 * 1000 + 2 * 2000) * 10**6; // $70
        vm.prank(customer);
        assertEq(ecommerce.getCartTotal(), expectedTotal);

        // 5. Crear invoice
        vm.prank(customer);
        (uint256 invoiceId, uint256 totalAmount) = ecommerce.createInvoice(companyId);
        assertEq(totalAmount, expectedTotal);

        // 6. Verificar stock antes del pago
        Types.Product memory product1Before = ecommerce.getProduct(productId1);
        Types.Product memory product2Before = ecommerce.getProduct(productId2);
        assertEq(product1Before.stock, 100);
        assertEq(product2Before.stock, 50);

        // 7. Aprobar y procesar pago
        vm.prank(customer);
        usdToken.approve(address(ecommerce), totalAmount);

        uint256 companyBalanceBefore = usdToken.balanceOf(company);
        
        vm.prank(customer);
        ecommerce.processPayment(invoiceId);

        // 8. Verificar pago
        Types.Invoice memory invoice = ecommerce.getInvoice(invoiceId);
        assertTrue(invoice.isPaid);
        assertEq(usdToken.balanceOf(company), companyBalanceBefore + totalAmount);

        // 9. Verificar stock actualizado
        Types.Product memory product1After = ecommerce.getProduct(productId1);
        Types.Product memory product2After = ecommerce.getProduct(productId2);
        assertEq(product1After.stock, 97); // 100 - 3
        assertEq(product2After.stock, 48); // 50 - 2
        assertEq(product1After.totalSales, 3);
        assertEq(product2After.totalSales, 2);

        // 10. Verificar carrito limpio (se limpia al crear invoice, no al pagar)
        // El carrito NO se limpia automaticamente al crear invoice segun nuestra implementacion
        // pero esto se puede hacer en el frontend o agregar logica adicional
    }

    function test_MultipleCustomersMultipleOrders() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        // Cliente 1
        vm.prank(customer);
        ecommerce.addToCart(productId, 10);
        vm.prank(customer);
        (uint256 invoiceId1, uint256 total1) = ecommerce.createInvoice(companyId);
        vm.prank(customer);
        usdToken.approve(address(ecommerce), total1);
        vm.prank(customer);
        ecommerce.processPayment(invoiceId1);

        // Cliente 2
        vm.prank(customer2);
        ecommerce.addToCart(productId, 15);
        vm.prank(customer2);
        (uint256 invoiceId2, uint256 total2) = ecommerce.createInvoice(companyId);
        vm.prank(customer2);
        usdToken.approve(address(ecommerce), total2);
        vm.prank(customer2);
        ecommerce.processPayment(invoiceId2);

        // Verificar stock final
        Types.Product memory product = ecommerce.getProduct(productId);
        assertEq(product.stock, 75); // 100 - 10 - 15
        assertEq(product.totalSales, 25); // 10 + 15

        // Verificar invoices
        vm.prank(customer);
        Types.Invoice[] memory customer1Invoices = ecommerce.getMyInvoices();
        assertEq(customer1Invoices.length, 1);
        assertTrue(customer1Invoices[0].isPaid);
    }

    // ============ TESTS ADICIONALES PARA COVERAGE ============

    function test_GetProductCount() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Tienda", "TAX");

        vm.prank(company);
        ecommerce.addProduct("Prod 1", "Desc", 1000 * 10**6, 100, "hash1", new string[](0));
        
        vm.prank(company);
        ecommerce.addProduct("Prod 2", "Desc", 2000 * 10**6, 50, "hash2", new string[](0));

        assertEq(ecommerce.getProductCount(), 2);
    }

    function test_GetCompanyCount() public {
        address company2 = address(0x4);
        
        vm.prank(company);
        ecommerce.registerCompany("Tienda 1", "TAX1");
        
        vm.prank(company2);
        ecommerce.registerCompany("Tienda 2", "TAX2");

        assertEq(ecommerce.getCompanyCount(), 2);
    }

    function test_GetCartItemCount() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Tienda", "TAX");

        vm.prank(company);
        uint256 productId1 = ecommerce.addProduct("Prod 1", "Desc", 1000 * 10**6, 100, "hash1", new string[](0));
        
        vm.prank(company);
        uint256 productId2 = ecommerce.addProduct("Prod 2", "Desc", 2000 * 10**6, 50, "hash2", new string[](0));

        vm.prank(customer);
        ecommerce.addToCart(productId1, 2);
        
        vm.prank(customer);
        ecommerce.addToCart(productId2, 3);

        vm.prank(customer);
        Types.CartItem[] memory cart = ecommerce.getCart();
        assertEq(cart.length, 2);
    }

    function test_GetInvoiceItems() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Tienda", "TAX");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Prod", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        vm.prank(customer);
        ecommerce.addToCart(productId, 5);

        vm.prank(customer);
        (uint256 invoiceId, ) = ecommerce.createInvoice(companyId);

        Types.CartItem[] memory items = ecommerce.getInvoiceItems(invoiceId);
        assertEq(items.length, 1);
        assertEq(items[0].productId, productId);
        assertEq(items[0].quantity, 5);
    }

    function test_GetCompanyInvoices() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Tienda", "TAX");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Prod", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        vm.prank(customer);
        ecommerce.addToCart(productId, 5);

        vm.prank(customer);
        (uint256 invoiceId, uint256 totalAmount) = ecommerce.createInvoice(companyId);

        vm.prank(customer);
        usdToken.approve(address(ecommerce), totalAmount);

        vm.prank(customer);
        ecommerce.processPayment(invoiceId);

        // Verificar invoices de la empresa
        vm.prank(company);
        Types.Invoice[] memory invoices = ecommerce.getCompanyInvoices(companyId);
        assertEq(invoices.length, 1);
        assertTrue(invoices[0].isPaid);
    }

    function test_GetTokenAddress() public {
        assertEq(ecommerce.getTokenAddress(), address(usdToken));
    }

    function test_CanPayInvoice() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Tienda", "TAX");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Prod", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        vm.prank(customer);
        ecommerce.addToCart(productId, 5);

        vm.prank(customer);
        (uint256 invoiceId, uint256 totalAmount) = ecommerce.createInvoice(companyId);

        // Sin aprobación - no puede pagar
        vm.prank(customer);
        bool canPay = ecommerce.canPayInvoice(invoiceId);
        assertFalse(canPay);

        // Con aprobación - puede pagar
        vm.prank(customer);
        usdToken.approve(address(ecommerce), totalAmount);

        vm.prank(customer);
        canPay = ecommerce.canPayInvoice(invoiceId);
        assertTrue(canPay);
    }

    function test_ProductWithMultipleImages() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Tienda", "TAX");

        string[] memory additionalImages = new string[](2);
        additionalImages[0] = "ipfs-hash-img2";
        additionalImages[1] = "ipfs-hash-img3";

        vm.prank(company);
        uint256 productId = ecommerce.addProduct(
            "Prod",
            "Desc",
            1000 * 10**6,
            100,
            "ipfs-hash-img1",
            additionalImages
        );

        Types.Product memory product = ecommerce.getProduct(productId);
        assertEq(product.ipfsAdditionalImages.length, 2);
        assertEq(keccak256(bytes(product.ipfsImageHash)), keccak256(bytes("ipfs-hash-img1")));
    }

    function test_ProductStockReductionAfterPayment() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Tienda", "TAX");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Prod", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        vm.prank(customer);
        ecommerce.addToCart(productId, 10);

        Types.Product memory productBefore = ecommerce.getProduct(productId);
        assertEq(productBefore.stock, 100);

        vm.prank(customer);
        (uint256 invoiceId, uint256 totalAmount) = ecommerce.createInvoice(companyId);

        vm.prank(customer);
        usdToken.approve(address(ecommerce), totalAmount);

        vm.prank(customer);
        ecommerce.processPayment(invoiceId);

        Types.Product memory productAfter = ecommerce.getProduct(productId);
        assertEq(productAfter.stock, 90); // 100 - 10
        assertEq(productAfter.totalSales, 10);
    }

    // ============ TESTS DE REVIEWS ============

    function test_AddReview() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        // Cliente compra el producto primero
        vm.prank(customer);
        ecommerce.addToCart(productId, 2);

        vm.prank(customer);
        (uint256 invoiceId, uint256 totalAmount) = ecommerce.createInvoice(companyId);

        vm.prank(customer);
        usdToken.approve(address(ecommerce), totalAmount);

        vm.prank(customer);
        ecommerce.processPayment(invoiceId);

        // Ahora puede dejar review
        vm.prank(customer);
        uint256 reviewId = ecommerce.addReview(productId, 5, "Excelente producto!");

        assertEq(reviewId, 1);
        
        Types.Review memory review = ecommerce.getReview(reviewId);
        assertEq(review.productId, productId);
        assertEq(review.customerAddress, customer);
        assertEq(review.rating, 5);
        assertEq(review.comment, "Excelente producto!");
        assertTrue(review.isVerified);
    }

    function test_AddReviewFailsWithoutPurchase() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        // Intenta dejar review sin haber comprado
        vm.prank(customer);
        vm.expectRevert("ReviewLib: customer must purchase product before reviewing");
        ecommerce.addReview(productId, 5, "Excelente producto!");
    }

    function test_AddReviewFailsWithInvalidRating() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        // Comprar producto
        vm.prank(customer);
        ecommerce.addToCart(productId, 1);

        vm.prank(customer);
        (uint256 invoiceId, uint256 totalAmount) = ecommerce.createInvoice(companyId);

        vm.prank(customer);
        usdToken.approve(address(ecommerce), totalAmount);

        vm.prank(customer);
        ecommerce.processPayment(invoiceId);

        // Intenta dejar review con rating inválido
        vm.prank(customer);
        vm.expectRevert("ReviewLib: rating must be between 1 and 5");
        ecommerce.addReview(productId, 6, "Comentario");

        vm.prank(customer);
        vm.expectRevert("ReviewLib: rating must be between 1 and 5");
        ecommerce.addReview(productId, 0, "Comentario");
    }

    function test_AddReviewFailsWithEmptyComment() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        // Comprar producto
        vm.prank(customer);
        ecommerce.addToCart(productId, 1);

        vm.prank(customer);
        (uint256 invoiceId, uint256 totalAmount) = ecommerce.createInvoice(companyId);

        vm.prank(customer);
        usdToken.approve(address(ecommerce), totalAmount);

        vm.prank(customer);
        ecommerce.processPayment(invoiceId);

        // Intenta dejar review sin comentario
        vm.prank(customer);
        vm.expectRevert("ReviewLib: comment required");
        ecommerce.addReview(productId, 5, "");
    }

    function test_CannotReviewSameProductTwice() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        // Comprar producto
        vm.prank(customer);
        ecommerce.addToCart(productId, 1);

        vm.prank(customer);
        (uint256 invoiceId, uint256 totalAmount) = ecommerce.createInvoice(companyId);

        vm.prank(customer);
        usdToken.approve(address(ecommerce), totalAmount);

        vm.prank(customer);
        ecommerce.processPayment(invoiceId);

        // Primer review
        vm.prank(customer);
        ecommerce.addReview(productId, 5, "Primer review");

        // Intenta dejar segundo review del mismo producto
        vm.prank(customer);
        vm.expectRevert("ReviewLib: customer already reviewed this product");
        ecommerce.addReview(productId, 4, "Segundo review");
    }

    function test_GetProductReviews() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        // Cliente 1 compra y deja review
        vm.prank(customer);
        ecommerce.addToCart(productId, 1);

        vm.prank(customer);
        (uint256 invoiceId1, uint256 totalAmount1) = ecommerce.createInvoice(companyId);

        vm.prank(customer);
        usdToken.approve(address(ecommerce), totalAmount1);

        vm.prank(customer);
        ecommerce.processPayment(invoiceId1);

        vm.prank(customer);
        ecommerce.addReview(productId, 5, "Muy bueno!");

        // Cliente 2 compra y deja review
        vm.prank(customer2);
        ecommerce.addToCart(productId, 1);

        vm.prank(customer2);
        (uint256 invoiceId2, uint256 totalAmount2) = ecommerce.createInvoice(companyId);

        vm.prank(customer2);
        usdToken.approve(address(ecommerce), totalAmount2);

        vm.prank(customer2);
        ecommerce.processPayment(invoiceId2);

        vm.prank(customer2);
        ecommerce.addReview(productId, 4, "Buen producto");

        // Obtener reviews del producto
        Types.Review[] memory reviews = ecommerce.getProductReviews(productId);
        assertEq(reviews.length, 2);
        assertEq(reviews[0].rating, 5);
        assertEq(reviews[1].rating, 4);
        assertTrue(reviews[0].isVerified);
        assertTrue(reviews[1].isVerified);
    }

    function test_GetProductAverageRating() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        // Cliente 1: rating 5
        vm.prank(customer);
        ecommerce.addToCart(productId, 1);
        vm.prank(customer);
        (uint256 invoiceId1, uint256 totalAmount1) = ecommerce.createInvoice(companyId);
        vm.prank(customer);
        usdToken.approve(address(ecommerce), totalAmount1);
        vm.prank(customer);
        ecommerce.processPayment(invoiceId1);
        vm.prank(customer);
        ecommerce.addReview(productId, 5, "Excelente");

        // Cliente 2: rating 4
        vm.prank(customer2);
        ecommerce.addToCart(productId, 1);
        vm.prank(customer2);
        (uint256 invoiceId2, uint256 totalAmount2) = ecommerce.createInvoice(companyId);
        vm.prank(customer2);
        usdToken.approve(address(ecommerce), totalAmount2);
        vm.prank(customer2);
        ecommerce.processPayment(invoiceId2);
        vm.prank(customer2);
        ecommerce.addReview(productId, 4, "Muy bueno");

        // Promedio: (5 + 4) / 2 = 4.5 = 450 (multiplicado por 100)
        (uint256 averageRating, uint256 reviewCount) = ecommerce.getProductAverageRating(productId);
        assertEq(averageRating, 450); // 4.50 * 100
        assertEq(reviewCount, 2);
    }

    function test_GetProductAverageRatingNoReviews() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        // Sin reviews
        (uint256 averageRating, uint256 reviewCount) = ecommerce.getProductAverageRating(productId);
        assertEq(averageRating, 0);
        assertEq(reviewCount, 0);
    }

    function test_HasPurchasedProduct() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        // Cliente no ha comprado
        vm.prank(customer);
        bool hasPurchased = ecommerce.hasPurchasedProduct(productId);
        assertFalse(hasPurchased);

        // Cliente compra
        vm.prank(customer);
        ecommerce.addToCart(productId, 1);

        vm.prank(customer);
        (uint256 invoiceId, uint256 totalAmount) = ecommerce.createInvoice(companyId);

        vm.prank(customer);
        usdToken.approve(address(ecommerce), totalAmount);

        vm.prank(customer);
        ecommerce.processPayment(invoiceId);

        // Ahora sí ha comprado
        vm.prank(customer);
        hasPurchased = ecommerce.hasPurchasedProduct(productId);
        assertTrue(hasPurchased);
    }

    function test_GetMyReviews() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId1 = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash1", new string[](0));
        
        vm.prank(company);
        uint256 productId2 = ecommerce.addProduct("Producto 2", "Desc", 2000 * 10**6, 100, "hash2", new string[](0));

        // Cliente compra ambos productos
        vm.prank(customer);
        ecommerce.addToCart(productId1, 1);
        vm.prank(customer);
        ecommerce.addToCart(productId2, 1);
        vm.prank(customer);
        (uint256 invoiceId, uint256 totalAmount) = ecommerce.createInvoice(companyId);
        vm.prank(customer);
        usdToken.approve(address(ecommerce), totalAmount);
        vm.prank(customer);
        ecommerce.processPayment(invoiceId);

        // Deja reviews de ambos productos
        vm.prank(customer);
        ecommerce.addReview(productId1, 5, "Buen producto 1");
        vm.prank(customer);
        ecommerce.addReview(productId2, 4, "Buen producto 2");

        // Obtener mis reviews
        vm.prank(customer);
        Types.Review[] memory myReviews = ecommerce.getMyReviews();
        assertEq(myReviews.length, 2);
        assertEq(myReviews[0].productId, productId1);
        assertEq(myReviews[1].productId, productId2);
    }

    function test_GetReviewCount() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        assertEq(ecommerce.getReviewCount(), 0);

        // Cliente 1 deja review
        vm.prank(customer);
        ecommerce.addToCart(productId, 1);
        vm.prank(customer);
        (uint256 invoiceId1, uint256 totalAmount1) = ecommerce.createInvoice(companyId);
        vm.prank(customer);
        usdToken.approve(address(ecommerce), totalAmount1);
        vm.prank(customer);
        ecommerce.processPayment(invoiceId1);
        vm.prank(customer);
        ecommerce.addReview(productId, 5, "Review 1");

        assertEq(ecommerce.getReviewCount(), 1);

        // Cliente 2 deja review
        vm.prank(customer2);
        ecommerce.addToCart(productId, 1);
        vm.prank(customer2);
        (uint256 invoiceId2, uint256 totalAmount2) = ecommerce.createInvoice(companyId);
        vm.prank(customer2);
        usdToken.approve(address(ecommerce), totalAmount2);
        vm.prank(customer2);
        ecommerce.processPayment(invoiceId2);
        vm.prank(customer2);
        ecommerce.addReview(productId, 4, "Review 2");

        assertEq(ecommerce.getReviewCount(), 2);
    }

    function test_GetProductReviewCount() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        assertEq(ecommerce.getProductReviewCount(productId), 0);

        // Cliente 1 deja review
        vm.prank(customer);
        ecommerce.addToCart(productId, 1);
        vm.prank(customer);
        (uint256 invoiceId1, uint256 totalAmount1) = ecommerce.createInvoice(companyId);
        vm.prank(customer);
        usdToken.approve(address(ecommerce), totalAmount1);
        vm.prank(customer);
        ecommerce.processPayment(invoiceId1);
        vm.prank(customer);
        ecommerce.addReview(productId, 5, "Review 1");

        assertEq(ecommerce.getProductReviewCount(productId), 1);

        // Cliente 2 deja review
        vm.prank(customer2);
        ecommerce.addToCart(productId, 1);
        vm.prank(customer2);
        (uint256 invoiceId2, uint256 totalAmount2) = ecommerce.createInvoice(companyId);
        vm.prank(customer2);
        usdToken.approve(address(ecommerce), totalAmount2);
        vm.prank(customer2);
        ecommerce.processPayment(invoiceId2);
        vm.prank(customer2);
        ecommerce.addReview(productId, 4, "Review 2");

        assertEq(ecommerce.getProductReviewCount(productId), 2);
    }

    function test_MultipleReviewsSameProductDifferentCustomers() public {
        vm.prank(company);
        uint256 companyId = ecommerce.registerCompany("Mi Tienda", "TAX123");

        vm.prank(company);
        uint256 productId = ecommerce.addProduct("Producto 1", "Desc", 1000 * 10**6, 100, "hash", new string[](0));

        // 3 clientes diferentes compran y dejan reviews
        address customer3 = address(0x8);
        usdToken.mint(customer3, INITIAL_TOKEN_SUPPLY);

        for (uint256 i = 0; i < 3; i++) {
            address currentCustomer = i == 0 ? customer : (i == 1 ? customer2 : customer3);
            
            vm.prank(currentCustomer);
            ecommerce.addToCart(productId, 1);
            
            vm.prank(currentCustomer);
            (uint256 invoiceId, uint256 totalAmount) = ecommerce.createInvoice(companyId);
            
            vm.prank(currentCustomer);
            usdToken.approve(address(ecommerce), totalAmount);
            
            vm.prank(currentCustomer);
            ecommerce.processPayment(invoiceId);
            
            vm.prank(currentCustomer);
            ecommerce.addReview(productId, uint256(5 - i), string(abi.encodePacked("Review ", toString(i + 1))));
        }

        // Verificar reviews
        Types.Review[] memory reviews = ecommerce.getProductReviews(productId);
        assertEq(reviews.length, 3);

        // Verificar promedio: (5 + 4 + 3) / 3 = 4.00 = 400
        (uint256 averageRating, uint256 reviewCount) = ecommerce.getProductAverageRating(productId);
        assertEq(averageRating, 400); // 4.00 * 100
        assertEq(reviewCount, 3);
    }

    // Helper function para convertir uint a string (usado en test)
    function toString(uint256 value) private pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}

