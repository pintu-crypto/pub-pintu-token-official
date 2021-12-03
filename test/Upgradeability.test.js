const { BN, constants, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const PintuTokenV1Mock = artifacts.require('PintuTokenV1Mock');
const PintuTokenV2Mock = artifacts.require('PintuTokenV2Mock');
const PintuTokenV3Mock = artifacts.require('PintuTokenV3Mock');
const PintuTokenProxy = artifacts.require('PintuTokenProxy');
const { shouldBehaveLikeERC20Burnable } = require('./behaviors/ERC20Burnable.behavior');
const { shouldBehaveLikeERC20Mintable } = require('./behaviors/ERC20Mintable.behavior');

const wei = web3.utils.toWei;

contract('PintuTokenV1', (accounts) => {
  const _name = 'My Detailed ERC20';
  const _symbol = 'MDT';
  const _decimals = new BN(18);
  const _initialSupply = new BN(wei("1000000", "ether"))

  const proxyAdmin = accounts[1];

  beforeEach(async function () {
    this.pintuTokenV1 = await PintuTokenV1Mock.new(_name, _symbol, _decimals, _initialSupply);

    // Using Proxy
    this.pintuTokenProxy = await PintuTokenProxy.new(this.pintuTokenV1.address, {from: proxyAdmin});
    this.pintuTokenProxyImpl = await PintuTokenV1Mock.at(this.pintuTokenProxy.address);
    await this.pintuTokenProxyImpl.initialize(_name, _symbol, _decimals, _initialSupply);
  });

  it("check implementation", async function() {
    expect(await this.pintuTokenProxy.implementation({from: proxyAdmin})).to.be.equal(this.pintuTokenV1.address);
  });

  it("check admin proxy", async function() {
    expect(await this.pintuTokenProxy.admin({from: proxyAdmin})).to.be.equal(proxyAdmin);
  })

  it("Should not be able to call pintu proxy original function from non-admin proxy account", async function () {
    await expectRevert.unspecified(this.pintuTokenProxy.admin(), "");
  })

  it("change admin proxy should failed if zero address", async function () {
    await expectRevert(this.pintuTokenProxy.changeAdmin(constants.ZERO_ADDRESS, {from: proxyAdmin}), "Cannot change the admin of a proxy to the zero address" );
  })

  it("change admin proxy successfully", async function () {
    const newProxyAdmin = accounts[2];
    expect(await this.pintuTokenProxy.changeAdmin(newProxyAdmin, {from: proxyAdmin}));
    await expectRevert.unspecified(this.pintuTokenProxy.admin({from: proxyAdmin}), "");
    expect(await this.pintuTokenProxy.admin({from: newProxyAdmin})).to.be.equal(newProxyAdmin);
  })

  it('should not be able to initialize the logic implementation twice', async function() {
    await expectRevert(this.pintuTokenProxyImpl.initialize(_name, _symbol, _decimals, _initialSupply), "Initializable: contract is already initialized");
  })

  it('call from admin proxy should revert', async function () {
    await expectRevert(this.pintuTokenProxyImpl.name({from: proxyAdmin}), "Cannot call fallback function from the proxy admin");
  });

  it('has a name', async function () {
    expect(await this.pintuTokenProxyImpl.name()).to.equal(_name);
  });

  it('has a symbol', async function () {
    expect(await this.pintuTokenProxyImpl.symbol()).to.equal(_symbol);
  });

  it('has an amount of decimals', async function () {
    expect( (await this.pintuTokenProxyImpl.decimals()).toString()).to.equal(_decimals.toString());
  });

  it('has an amount of total supply', async function () {
    expect( (await this.pintuTokenProxyImpl.totalSupply()).toString() ).to.equal(_initialSupply.toString());
  });

  it('should revert if update the logic to not a contract address', async function () { 
    await expectRevert(this.pintuTokenProxy.upgradeTo(constants.ZERO_ADDRESS, {from: proxyAdmin}), "Cannot set a proxy implementation to a non-contract addres");
  })

  it('update the logic implementation', async function () {
    // Create instance v2
    const pintuTokenV2 = await PintuTokenV2Mock.new();

    // change abi of proxy to v2
    this.pintuTokenProxyImpl = await PintuTokenV2Mock.at(this.pintuTokenProxy.address);
    await expectRevert.unspecified(this.pintuTokenProxyImpl.getMockNewTokenName());
    await expectRevert.unspecified(this.pintuTokenProxyImpl.testRevert());

    // Upgrade contract
    await this.pintuTokenProxy.upgradeTo(pintuTokenV2.address, {from: proxyAdmin});
    
    expect( await this.pintuTokenProxyImpl.getMockNewTokenName()).to.equal("PintuTokenV2");
    await expectRevert(this.pintuTokenProxyImpl.testRevert(), "test revert");
  });

  it('update and call the logic implementation should revert if call failed', async function () {
    // Create instance v2
    const pintuTokenV3 = await PintuTokenV3Mock.new();

    // change abi of proxy to v3
    this.pintuTokenProxyImpl = await PintuTokenV3Mock.at(this.pintuTokenProxy.address);
    await expectRevert.unspecified(this.pintuTokenProxyImpl.additionalStorage());
    
    // Upgrade contract
    await expectRevert.unspecified(this.pintuTokenProxy.upgradeToAndCall(pintuTokenV3.address, "0x", {from: proxyAdmin, value: 0}));
  });

  it('update and call the logic implementation', async function () {
    // Create instance v2
    const pintuTokenV3 = await PintuTokenV3Mock.new();
    const changedString = "test";

    // change abi of proxy to v3
    this.pintuTokenProxyImpl = await PintuTokenV3Mock.at(this.pintuTokenProxy.address);
    await expectRevert.unspecified(this.pintuTokenProxyImpl.additionalStorage());

    let contract = new web3.eth.Contract(pintuTokenV3.abi, pintuTokenV3.address);
    const data = contract.methods.changeAdditionalStorage(changedString).encodeABI();
    
    // Upgrade contract
    await this.pintuTokenProxy.upgradeToAndCall(pintuTokenV3.address, data, {from: proxyAdmin, value: 0});
    expect( await this.pintuTokenProxyImpl.additionalStorage()).to.equal(changedString);
  });
});

contract("Burnable Upgrade", (accounts) => {
  const [ owner, ...otherAccounts ] = accounts;
  const _name = 'My Detailed ERC20';
  const _symbol = 'MDT';
  const _decimals = new BN(18);
  const _initialSupply = new BN(wei("1000000", "ether"))

  const proxyAdmin = accounts[9];

  beforeEach(async function () {
    this.pintuTokenV1 = await PintuTokenV1Mock.new(_name, _symbol, _decimals, _initialSupply);

    // Using Proxy
    this.pintuTokenProxy = await PintuTokenProxy.new(this.pintuTokenV1.address, {from: proxyAdmin});
    this.pintuTokenProxyImpl = await PintuTokenV1Mock.at(this.pintuTokenProxy.address);
    await this.pintuTokenProxyImpl.initialize(_name, _symbol, _decimals, _initialSupply);

    this.token = this.pintuTokenProxyImpl;
  })

  shouldBehaveLikeERC20Burnable(owner, _initialSupply, otherAccounts);
})

contract("Mintable Upgrade", (accounts) => {
  const [ minter, ...otherAccounts ] = accounts;
  const _name = 'My Detailed ERC20';
  const _symbol = 'MDT';
  const _decimals = new BN(18);
  const _initialSupply = new BN(wei("1000000", "ether"))

  const proxyAdmin = accounts[9];

  beforeEach(async function () {
    this.pintuTokenV1 = await PintuTokenV1Mock.new(_name, _symbol, _decimals, _initialSupply);

    // Using Proxy
    this.pintuTokenProxy = await PintuTokenProxy.new(this.pintuTokenV1.address, {from: proxyAdmin});
    this.pintuTokenProxyImpl = await PintuTokenV1Mock.at(this.pintuTokenProxy.address);
    await this.pintuTokenProxyImpl.initialize(_name, _symbol, _decimals, _initialSupply);

    this.token = this.pintuTokenProxyImpl;
  })

  shouldBehaveLikeERC20Mintable(minter, otherAccounts);
})


contract('Ownable Upgrade', function (accounts) {
  const [ owner, other ] = accounts;
  const ZERO_ADDRESS = constants.ZERO_ADDRESS;

  beforeEach(async function () {
    const _name = 'My Detailed ERC20';
    const _symbol = 'MDT';
    const _decimals = new BN(18);
    const _initialSupply = new BN(wei("1000000", "ether"))
    this.pintuTokenV1 = await PintuTokenV1Mock.new(_name, _symbol, _decimals, _initialSupply);

    const proxyAdmin = accounts[9];

    // Using Proxy
    this.pintuTokenProxy = await PintuTokenProxy.new(this.pintuTokenV1.address, {from: proxyAdmin});
    this.pintuTokenProxyImpl = await PintuTokenV1Mock.at(this.pintuTokenProxy.address);
    await this.pintuTokenProxyImpl.initialize(_name, _symbol, _decimals, _initialSupply);

    this.ownable = this.pintuTokenProxyImpl;
  });

  it('has an owner', async function () {
    expect(await this.ownable.owner()).to.equal(owner);
  });

  describe('transfer ownership', function () {
    it('changes owner after transfer', async function () {
      const receipt = await this.ownable.transferOwnership(other, { from: owner });
      expectEvent(receipt, 'OwnershipTransferred');

      expect(await this.ownable.owner()).to.equal(other);
    });

    it('prevents non-owners from transferring', async function () {
      await expectRevert(
        this.ownable.transferOwnership(other, { from: other }),
        'Ownable: caller is not the owner',
      );
    });

    it('guards ownership against stuck state', async function () {
      await expectRevert(
        this.ownable.transferOwnership(ZERO_ADDRESS, { from: owner }),
        'Ownable: new owner is the zero address',
      );
    });
  });

  describe('renounce ownership', function () {
    it('loses owner after renouncement', async function () {
      const receipt = await this.ownable.renounceOwnership({ from: owner });
      expectEvent(receipt, 'OwnershipTransferred');

      expect(await this.ownable.owner()).to.equal(ZERO_ADDRESS);
    });

    it('prevents non-owners from renouncement', async function () {
      await expectRevert(
        this.ownable.renounceOwnership({ from: other }),
        'Ownable: caller is not the owner',
      );
    });
  });
});



contract("Pausable Upgrade", (accounts) => {
  const [ pauser, otherPauser, recipient, anotherAccount, ...otherAccounts ] = accounts;
  const _name = 'My Detailed ERC20';
  const _symbol = 'MDT';
  const _decimals = new BN(18);
  const _initialSupply = initialSupply = new BN(wei("1000000", "ether"))

  const proxyAdmin = accounts[9];

  beforeEach(async function () {
    this.pintuTokenV1 = await PintuTokenV1Mock.new(_name, _symbol, _decimals, _initialSupply);

    // Using Proxy
    this.pintuTokenProxy = await PintuTokenProxy.new(this.pintuTokenV1.address, {from: proxyAdmin});
    this.pintuTokenProxyImpl = await PintuTokenV1Mock.at(this.pintuTokenProxy.address);
    await this.pintuTokenProxyImpl.initialize(_name, _symbol, _decimals, _initialSupply);

    this.token = this.pintuTokenProxyImpl;
  })

  describe('pause', function () {
    describe('when the sender is the token pauser', function () {
      const from = pauser;

      describe('when the token is unpaused', function () {
        it('pauses the token', async function () {
          await this.token.pause({ from });
          expect(await this.token.paused()).to.equal(true);
        });

        it('emits a Pause event', async function () {
          const { logs } = await this.token.pause({ from });

          expectEvent.inLogs(logs, 'Paused');
        });
      });

      describe('when the token is paused', function () {
        beforeEach(async function () {
          await this.token.pause({ from });
        });

        it('reverts', async function () {
          await expectRevert(this.token.pause({ from }), 'Pausable: paused');
        });
      });
    });

    describe('when the sender is not the token pauser', function () {
      const from = anotherAccount;

      it('reverts', async function () {
        await expectRevert(this.token.pause({ from }),
          'Ownable: caller is not the owner'
        );
      });
    });
  });

  describe('unpause', function () {
    describe('when the sender is the token pauser', function () {
      const from = pauser;

      describe('when the token is paused', function () {
        beforeEach(async function () {
          await this.token.pause({ from });
        });

        it('unpauses the token', async function () {
          await this.token.unpause({ from });
          expect(await this.token.paused()).to.equal(false);
        });

        it('emits an Unpause event', async function () {
          const { logs } = await this.token.unpause({ from });

          expectEvent.inLogs(logs, 'Unpaused');
        });
      });

      describe('when the token is unpaused', function () {
        it('reverts', async function () {
          await expectRevert(this.token.unpause({ from }), 'Pausable: not paused');
        });
      });
    });

    describe('when the sender is not the token pauser', function () {
      const from = anotherAccount;

      it('reverts', async function () {
        await expectRevert(this.token.unpause({ from }),
          'Ownable: caller is not the owner'
        );
      });
    });
  });

  describe('pausable token', function () {
    const from = pauser;

    describe('paused', function () {
      it('is not paused by default', async function () {
        expect(await this.token.paused({ from })).to.equal(false);
      });

      it('is paused after being paused', async function () {
        await this.token.pause({ from });
        expect(await this.token.paused({ from })).to.equal(true);
      });

      it('is not paused after being paused and then unpaused', async function () {
        await this.token.pause({ from });
        await this.token.unpause({ from });
        expect(await this.token.paused()).to.equal(false);
      });
    });

    describe('transfer', function () {
      it('allows to transfer when unpaused', async function () {
        await this.token.transfer(recipient, initialSupply, { from: pauser });

        expect(await this.token.balanceOf(pauser)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(initialSupply);
      });

      it('allows to transfer when paused and then unpaused', async function () {
        await this.token.pause({ from: pauser });
        await this.token.unpause({ from: pauser });

        await this.token.transfer(recipient, initialSupply, { from: pauser });

        expect(await this.token.balanceOf(pauser)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(initialSupply);
      });

      it('reverts when trying to transfer when paused', async function () {
        await this.token.pause({ from: pauser });

        await expectRevert(this.token.transfer(recipient, initialSupply, { from: pauser }),
          'Pausable: paused'
        );
      });
    });

    describe('approve', function () {
      const allowance = new BN(40);

      it('allows to approve when unpaused', async function () {
        await this.token.approve(anotherAccount, allowance, { from: pauser });

        expect(await this.token.allowance(pauser, anotherAccount)).to.be.bignumber.equal(allowance);
      });

      it('allows to approve when paused and then unpaused', async function () {
        await this.token.pause({ from: pauser });
        await this.token.unpause({ from: pauser });

        await this.token.approve(anotherAccount, allowance, { from: pauser });

        expect(await this.token.allowance(pauser, anotherAccount)).to.be.bignumber.equal(allowance);
      });

      it('reverts when trying to approve when paused', async function () {
        await this.token.pause({ from: pauser });

        await expectRevert(this.token.approve(anotherAccount, allowance, { from: pauser }),
          'Pausable: paused'
        );
      });
    });

    describe('transfer from', function () {
      const allowance = new BN(40);

      beforeEach(async function () {
        await this.token.approve(anotherAccount, allowance, { from: pauser });
      });

      it('allows to transfer from when unpaused', async function () {
        await this.token.transferFrom(pauser, recipient, allowance, { from: anotherAccount });

        expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(allowance);
        expect(await this.token.balanceOf(pauser)).to.be.bignumber.equal(initialSupply.sub(allowance));
      });

      it('allows to transfer when paused and then unpaused', async function () {
        await this.token.pause({ from: pauser });
        await this.token.unpause({ from: pauser });

        await this.token.transferFrom(pauser, recipient, allowance, { from: anotherAccount });

        expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(allowance);
        expect(await this.token.balanceOf(pauser)).to.be.bignumber.equal(initialSupply.sub(allowance));
      });

      it('reverts when trying to transfer from when paused', async function () {
        await this.token.pause({ from: pauser });

        await expectRevert(this.token.transferFrom(
          pauser, recipient, allowance, { from: anotherAccount }), 'Pausable: paused'
        );
      });
    });

    describe('decrease approval', function () {
      const allowance = new BN(40);
      const decrement = new BN(10);

      beforeEach(async function () {
        await this.token.approve(anotherAccount, allowance, { from: pauser });
      });

      it('allows to decrease approval when unpaused', async function () {
        await this.token.decreaseAllowance(anotherAccount, decrement, { from: pauser });

        expect(await this.token.allowance(pauser, anotherAccount)).to.be.bignumber.equal(allowance.sub(decrement));
      });

      it('allows to decrease approval when paused and then unpaused', async function () {
        await this.token.pause({ from: pauser });
        await this.token.unpause({ from: pauser });

        await this.token.decreaseAllowance(anotherAccount, decrement, { from: pauser });

        expect(await this.token.allowance(pauser, anotherAccount)).to.be.bignumber.equal(allowance.sub(decrement));
      });

      it('reverts when trying to transfer when paused', async function () {
        await this.token.pause({ from: pauser });

        await expectRevert(this.token.decreaseAllowance(
          anotherAccount, decrement, { from: pauser }), 'Pausable: paused'
        );
      });
    });

    describe('increase approval', function () {
      const allowance = new BN(40);
      const increment = new BN(30);

      beforeEach(async function () {
        await this.token.approve(anotherAccount, allowance, { from: pauser });
      });

      it('allows to increase approval when unpaused', async function () {
        await this.token.increaseAllowance(anotherAccount, increment, { from: pauser });

        expect(await this.token.allowance(pauser, anotherAccount)).to.be.bignumber.equal(allowance.add(increment));
      });

      it('allows to increase approval when paused and then unpaused', async function () {
        await this.token.pause({ from: pauser });
        await this.token.unpause({ from: pauser });

        await this.token.increaseAllowance(anotherAccount, increment, { from: pauser });

        expect(await this.token.allowance(pauser, anotherAccount)).to.be.bignumber.equal(allowance.add(increment));
      });

      it('reverts when trying to increase approval when paused', async function () {
        await this.token.pause({ from: pauser });

        await expectRevert(this.token.increaseAllowance(
          anotherAccount, increment, { from: pauser }), 'Pausable: paused'
        );
      });
    });
  });
})