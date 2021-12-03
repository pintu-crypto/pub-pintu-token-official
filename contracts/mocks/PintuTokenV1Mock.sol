pragma solidity 0.5.17;

import "../PintuTokenV1.sol";

contract PintuTokenV1Mock is ERC20, PintuTokenV1 {
    constructor (string memory name, string memory symbol, uint8 decimals, uint256 initialSupply) public {
      initialize(name, symbol, decimals, initialSupply);
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }

    function burnFrom(address account, uint256 amount) public {
        _burnFrom(account, amount);
    }

    function transferInternal(address from, address to, uint256 value) public {
        _transfer(from, to, value);
    }

    function approveInternal(address owner, address spender, uint256 value) public {
        require(
            (value == 0) || (allowance(_msgSender(), spender) == 0),
            "Can not approve from non-zero to non-zero allowance"
        );
        _approve(owner, spender, value);
    }
}