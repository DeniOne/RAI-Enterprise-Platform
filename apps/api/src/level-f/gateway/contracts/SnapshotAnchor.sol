// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SnapshotAnchor
 * @dev Контракт для привязки (Anchoring) Merkle Roots уровня F в EVM-совместимых сетях.
 * Позволяет аудиторам проверять целостность данных системы.
 */
contract SnapshotAnchor {
    address public oracleNode;
    
    // rootHash => timestamp
    mapping(bytes32 => uint256) public anchors;

    event MerkleRootAnchored(bytes32 indexed rootHash, uint256 timestamp);

    modifier onlyOracle() {
        require(msg.sender == oracleNode, "Not authorized: only oracle node");
        _;
    }

    constructor() {
        oracleNode = msg.sender;
    }

    /**
     * @dev Замонолитить текущий Root Hash снимка
     */
    function anchorSnapshot(bytes32 _rootHash) external onlyOracle {
        require(anchors[_rootHash] == 0, "Root hash already anchored");
        
        anchors[_rootHash] = block.timestamp;
        
        emit MerkleRootAnchored(_rootHash, block.timestamp);
    }

    /**
     * @dev Управление доступом в случае смены ключа оракула
     */
    function setOracleNode(address _newOracle) external onlyOracle {
        require(_newOracle != address(0), "Invalid address");
        oracleNode = _newOracle;
    }
}
