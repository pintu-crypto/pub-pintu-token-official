pragma solidity 0.5.17;

contract PintuTokenV2Mock {
  constructor() public {}

  function getMockNewTokenName() external pure returns (string memory) {
    return "PintuTokenV2";
  }

  function testRevert() external pure returns (string memory) {
    revert("test revert");
  }
}