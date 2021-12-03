pragma solidity ^0.5.0;

import "../PintuTokenV1.sol";

contract PintuTokenV3Mock is ERC20, PintuTokenV1 {
    string private _additionalStorage;
    constructor() public {}

    function changeAdditionalStorage(string memory str) public {
      _additionalStorage = str;
    }

    function additionalStorage() external view returns (string memory) {
      return _additionalStorage;
    }
}