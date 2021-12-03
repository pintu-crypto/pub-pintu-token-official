pragma solidity ^0.5.0;

import "../PintuTokenV1.sol";

// mock class using ERC20Pausable
contract ERC20PausableMock is ERC20 {
    constructor (address initialAccount, uint256 initialBalance) public {
        Ownable.initialize(_msgSender());
        _mint(initialAccount, initialBalance);
    }
}