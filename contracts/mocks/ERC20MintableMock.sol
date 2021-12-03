pragma solidity ^0.5.0;

import "../PintuTokenV1.sol";

contract ERC20MintableMock is ERC20Mintable {
    constructor() public {
        Ownable.initialize(_msgSender());
    }
}