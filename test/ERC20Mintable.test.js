const { shouldBehaveLikeERC20Mintable } = require('./behaviors/ERC20Mintable.behavior');
const ERC20MintableMock = artifacts.require('ERC20MintableMock');

contract('ERC20Mintable', (accounts) => {
  const [ minter, otherMinter, ...otherAccounts ] = accounts;

  beforeEach(async function () {
    this.token = await ERC20MintableMock.new({ from: minter });
  });

  describe('minter role', function () {
    beforeEach(async function () {
      this.contract = this.token;
    });
  });

  shouldBehaveLikeERC20Mintable(minter, otherAccounts);
});