const { BN } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

const PintuTokenV1Mock = artifacts.require('PintuTokenV1Mock');

const wei = web3.utils.toWei;

contract('PintuTokenV1', (accounts) => {
  const _name = 'My Detailed ERC20';
  const _symbol = 'MDT';
  const _decimals = new BN(18);
  const _initialSupply = new BN(wei("1000000", "ether"))

  beforeEach(async function () {
    this.pintuTokenV1 = await PintuTokenV1Mock.new(_name, _symbol, _decimals, _initialSupply);
  });

  it('has a name', async function () {
    expect(await this.pintuTokenV1.name()).to.equal(_name);
  });

  it('has a symbol', async function () {
    expect(await this.pintuTokenV1.symbol()).to.equal(_symbol);
  });

  it('has an amount of decimals', async function () {
    expect(await this.pintuTokenV1.decimals()).to.be.bignumber.equal(_decimals);
  });

  it('has an amount of total supply', async function () {
    expect(await this.pintuTokenV1.totalSupply()).to.be.bignumber.equal(_initialSupply);
  });
});
