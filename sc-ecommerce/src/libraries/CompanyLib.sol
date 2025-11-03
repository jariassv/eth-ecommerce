// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Types.sol";

/**
 * @title CompanyLib
 * @dev Librería para gestión de empresas
 */
library CompanyLib {
    // Storage layout
    struct Storage {
        mapping(uint256 => Types.Company) companies;
        mapping(address => uint256) companyByAddress; // Dirección -> CompanyId
        uint256 companyCount;
    }

    // Storage slot
    bytes32 private constant STORAGE_SLOT = keccak256("company.lib.storage");

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
     * @dev Registrar una nueva empresa
     * @param companyAddress Dirección de la empresa (wallet)
     * @param name Nombre de la empresa
     * @param taxId ID fiscal de la empresa
     * @return companyId ID de la empresa creada
     */
    function registerCompany(
        Storage storage self,
        address companyAddress,
        string memory name,
        string memory taxId
    ) internal returns (uint256) {
        require(companyAddress != address(0), "CompanyLib: invalid address");
        require(bytes(name).length > 0, "CompanyLib: name required");
        require(bytes(taxId).length > 0, "CompanyLib: taxId required");
        require(
            self.companyByAddress[companyAddress] == 0,
            "CompanyLib: address already registered"
        );

        self.companyCount++;
        uint256 companyId = self.companyCount;

        self.companies[companyId] = Types.Company({
            companyId: companyId,
            name: name,
            companyAddress: companyAddress,
            taxId: taxId,
            isActive: true
        });

        self.companyByAddress[companyAddress] = companyId;

        return companyId;
    }

    /**
     * @dev Obtener información de una empresa
     * @param companyId ID de la empresa
     * @return company Datos de la empresa
     */
    function getCompany(
        Storage storage self,
        uint256 companyId
    ) internal view returns (Types.Company memory) {
        require(companyId > 0 && companyId <= self.companyCount, "CompanyLib: invalid companyId");
        return self.companies[companyId];
    }

    /**
     * @dev Obtener ID de empresa por dirección
     * @param companyAddress Dirección de la empresa
     * @return companyId ID de la empresa (0 si no existe)
     */
    function getCompanyIdByAddress(
        Storage storage self,
        address companyAddress
    ) internal view returns (uint256) {
        return self.companyByAddress[companyAddress];
    }

    /**
     * @dev Actualizar estado activo de una empresa
     * @param companyId ID de la empresa
     * @param isActive Nuevo estado
     */
    function setCompanyActive(
        Storage storage self,
        uint256 companyId,
        bool isActive
    ) internal {
        require(companyId > 0 && companyId <= self.companyCount, "CompanyLib: invalid companyId");
        self.companies[companyId].isActive = isActive;
    }

    /**
     * @dev Verificar si una dirección es una empresa registrada
     * @param companyAddress Dirección a verificar
     * @return bool True si está registrada y activa
     */
    function isCompany(
        Storage storage self,
        address companyAddress
    ) internal view returns (bool) {
        uint256 companyId = self.companyByAddress[companyAddress];
        if (companyId == 0) return false;
        return self.companies[companyId].isActive;
    }

    /**
     * @dev Obtener el total de empresas registradas
     * @return uint256 Cantidad de empresas
     */
    function getCompanyCount(Storage storage self) internal view returns (uint256) {
        return self.companyCount;
    }
}

