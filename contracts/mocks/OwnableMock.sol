pragma solidity ^0.5.0;

import "../PintuTokenV1.sol";

contract OwnableMock is Ownable {
    constructor() public {
        initialize(_msgSender());
    }
}