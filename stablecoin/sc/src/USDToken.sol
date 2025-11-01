// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title USDToken
 * @dev Token ERC20 que representa dólares digitales (1 USDT = 1 USD)
 * @notice Este contrato permite crear tokens USDT pegados al dólar
 */
contract USDToken is ERC20, Ownable {
    /**
     * @dev Constructor que inicializa el token
     * @param initialOwner Dirección del propietario del contrato
     */
    constructor(address initialOwner) ERC20("USD Token", "USDT") Ownable(initialOwner) {}

    /**
     * @dev Crear nuevos tokens (solo owner)
     * @param to Dirección a la que se le asignarán los tokens
     * @param amount Cantidad de tokens a crear (en unidades base, 1 USDT = 1e6)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Obtener la cantidad de decimales del token
     * @return uint8 Cantidad de decimales (6 para representar centavos)
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @dev Quemar tokens de una dirección
     * @param from Dirección de la que se quemarán los tokens
     * @param amount Cantidad de tokens a quemar
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    /**
     * @dev Evento emitido cuando se crean nuevos tokens
     */
    event TokensMinted(address indexed to, uint256 amount);

    /**
     * @dev Evento emitido cuando se queman tokens
     */
    event TokensBurned(address indexed from, uint256 amount);
}

