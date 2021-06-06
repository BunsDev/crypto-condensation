const { expect } = require("chai");
const { network } = require("hardhat");
const { BigNumber } = require("@ethersproject/bignumber");

const BASE = BigNumber.from(10).pow(18);

let capsuleContract;
let walletA, walletB, walletC;
let tokenA, tokenB, tokenC;
let testCapsule;

const dateToUnix = (date) => {
  return Math.round(date.getTime() / 1000);
};

describe("Capsule", () => {
  before(async () => {
    let signers = await ethers.getSigners();
    walletA = signers[0];
    walletB = signers[1];
    walletC = signers[2];

    const TokenA = await ethers.getContractFactory("TestERC20");
    tokenA = await TokenA.deploy();
    tokenA.__ERC20_init("tokena", "tokena");
    tokenA.mint(walletA.address, BASE.mul(10));

    const TokenB = await ethers.getContractFactory("TestERC20");
    tokenB = await TokenB.deploy();
    tokenB.__ERC20_init("tokenb", "tokenb");
    tokenB.mint(walletA.address, BASE.mul(10));

    const TokenC = await ethers.getContractFactory("TestERC20");
    tokenC = await TokenC.deploy();
    tokenC.__ERC20_init("tokenc", "tokenc");
    tokenC.mint(walletA.address, BASE.mul(10));

    const Capsule = await ethers.getContractFactory("CryptoCapsule");
    capsuleContract = await Capsule.deploy();
  });

  it("Should have no Capsules on creation", async () => {
    const capsuleCount = await capsuleContract.getCapsuleCount();
    expect(capsuleCount).to.equal(0);

    await expect(capsuleContract.getCapsule(0)).to.be.revertedWith(
      "Capsule does not exist"
    );
  });

  it("Should return no Capsules for getCapsules", async () => {
    const capsules = await capsuleContract.getCapsules();
    expect(capsules.length).to.equal(0);
  });

  it("Should create Capsule", async () => {
    const now = new Date();
    const nextMonth = new Date(now.setMonth(now.getMonth() + 1));
    const distributionDate = dateToUnix(nextMonth);

    const balanceBefore = Number(await tokenA.balanceOf(walletA.address));

    await tokenA.approve(capsuleContract.address, BASE);
    await capsuleContract.createCapsule(
      walletB.address,
      distributionDate,
      1,
      1,
      [tokenA.address],
      [BASE],
      true
    );

    const balanceAfter = Number(await tokenA.balanceOf(walletA.address));
    expect(balanceAfter).to.equal(balanceBefore - Number(BASE));

    const sentA = await capsuleContract.getSentCapsules(walletA.address);
    expect(sentA.length).to.equal(1);
    const recA = await capsuleContract.getReceivedCapsules(walletA.address);
    expect(recA.length).to.equal(0);
    const sentB = await capsuleContract.getSentCapsules(walletB.address);
    expect(sentB.length).to.equal(0);
    const recB = await capsuleContract.getReceivedCapsules(walletB.address);
    expect(recB.length).to.equal(1);

    const capsule = await capsuleContract.getCapsule(0);
    expect(capsule.id).to.equal(0);
    expect(capsule.grantor).to.equal(walletA.address);
    expect(capsule.beneficiary).to.equal(walletB.address);
    expect(capsule.distributionDate).to.equal(distributionDate);
    expect(capsule.periodSize).to.equal(1);
    expect(capsule.periodCount).to.equal(1);
    expect(capsule.claimedPeriods).to.equal(0);
    expect(capsule.empty).to.equal(false);
    expect(capsule.value).to.equal(0);
    expect(capsule.tokens[0]).to.equal(tokenA.address);
    expect(capsule.amounts[0]).to.equal(BASE);
    expect(capsule.tokens.length).to.equal(1);
    expect(capsule.amounts.length).to.equal(1);
  });

  it("Should return a single capsule for getCapsules", async () => {
    const capsules = await capsuleContract.getCapsules();
    expect(capsules.length).to.equal(1);
    expect(capsules[0].id).to.equal(0);
    expect(capsules[0].grantor).to.equal(walletA.address);
  });

  it("Should fail on distribution date in past", async () => {
    const now = new Date();
    const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
    const distributionDate = dateToUnix(lastMonth);

    await tokenA.approve(capsuleContract.address, BASE);

    await expect(
      capsuleContract.createCapsule(
        walletB.address,
        distributionDate,
        1,
        1,
        [tokenA.address],
        [BASE],
        false
      )
    ).to.be.revertedWith("Distribution Date must be in future");
  });

  it("Should fail with no token value", async () => {
    const now = new Date();
    const nextMonth = new Date(now.setMonth(now.getMonth() + 1));
    const distributionDate = dateToUnix(nextMonth);

    await tokenA.approve(capsuleContract.address, BASE);

    await expect(
      capsuleContract.createCapsule(
        walletB.address,
        distributionDate,
        1,
        1,
        [tokenA.address],
        [0],
        true
      )
    ).to.be.revertedWith("Token value must be greater than 0");
  });

  it("Should fail on mismatched token and amount lengths", async () => {
    const now = new Date();
    const nextMonth = new Date(now.setMonth(now.getMonth() + 1));
    const distributionDate = dateToUnix(nextMonth);

    await tokenA.approve(capsuleContract.address, BASE);

    await expect(
      capsuleContract.createCapsule(
        walletB.address,
        distributionDate,
        1,
        1,
        [tokenA.address, tokenB.address],
        [BASE],
        true
      )
    ).to.be.revertedWith("Tokens and Values must be same length");

    await expect(
      capsuleContract.createCapsule(
        walletB.address,
        distributionDate,
        1,
        1,
        [tokenA.address],
        [BASE, BASE],
        false
      )
    ).to.be.revertedWith("Tokens and Values must be same length");
  });

  it("Should fail on negative or 0 period size", async () => {
    const now = new Date();
    const nextMonth = new Date(now.setMonth(now.getMonth() + 1));
    const distributionDate = dateToUnix(nextMonth);

    await tokenA.approve(capsuleContract.address, BASE);

    await expect(
      capsuleContract.createCapsule(
        walletB.address,
        distributionDate,
        0,
        1,
        [tokenA.address],
        [BASE],
        true
      )
    ).to.be.revertedWith("Period Size must greater than or equal to 1");
  });

  it("Should fail on negative or 0 period count", async () => {
    const now = new Date();
    const nextMonth = new Date(now.setMonth(now.getMonth() + 1));
    const distributionDate = dateToUnix(nextMonth);

    await tokenA.approve(capsuleContract.address, BASE);

    await expect(
      capsuleContract.createCapsule(
        walletB.address,
        distributionDate,
        1,
        0,
        [tokenA.address],
        [BASE],
        false
      )
    ).to.be.revertedWith("Period Count must greater than or equal to 1");
  });

  it("Should not open for non-beneficiary", async () => {
    await expect(capsuleContract.openCapsule(0)).to.be.revertedWith(
      "You are not the beneficiary of this Capsule"
    );
  });

  it("Should not open before distribution date", async () => {
    const now = new Date();
    const nextMonth = new Date(now.setMonth(now.getMonth() + 1));
    const distributionDate = dateToUnix(nextMonth);

    const capsuleCount = await capsuleContract.getCapsuleCount();

    await capsuleContract.createCapsule(
      walletA.address,
      distributionDate,
      1,
      1,
      [tokenA.address],
      [BASE],
      true
    );

    testCapsule = await capsuleContract.getCapsule(capsuleCount);

    await expect(
      capsuleContract.openCapsule(testCapsule.id)
    ).to.be.revertedWith("Capsule has not matured yet");
  });

  it("Should return two capsules with getCapsules", async () => {
    const capsules = await capsuleContract.getCapsules();
    expect(capsules.length).to.equal(2);
  });

  it("Should pass the time 1 months", async () => {
    await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 7 * 4 * 1]);
    await network.provider.send("evm_mine");
  });

  it("Should not open before distribution date", async () => {
    await expect(
      capsuleContract.openCapsule(testCapsule.id)
    ).to.be.revertedWith("Capsule has not matured yet");
  });

  it("Should pass the time past 2 months", async () => {
    await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 7 * 4 * 2]);
    await network.provider.send("evm_mine");
  });

  it("Should open Capsule", async () => {
    const balanceBefore = Number(await tokenA.balanceOf(walletA.address));

    await capsuleContract.openCapsule(testCapsule.id);
    testCapsule = await capsuleContract.getCapsule(testCapsule.id);
    expect(testCapsule.empty).to.equal(true);

    const balanceAfter = Number(await tokenA.balanceOf(walletA.address));
    expect(balanceAfter).to.equal(balanceBefore + Number(BASE));
  });

  it("Should not open empty Capsule", async () => {
    await expect(
      capsuleContract.openCapsule(testCapsule.id)
    ).to.be.revertedWith("Capsule is empty");
  });

  it("Should create Staggered Capsule", async () => {
    const now = new Date();
    now.setMonth(now.getMonth() + 12);
    await network.provider.send("evm_setNextBlockTimestamp", [dateToUnix(now)]);
    const nextMonth = new Date(now.setDate(now.getDate() + 30));
    const distributionStartDate = dateToUnix(nextMonth);
    const periodSize = 60 * 60 * 24 * 7;

    const capsuleCount = await capsuleContract.getCapsuleCount();

    await tokenA.approve(capsuleContract.address, BASE);
    await capsuleContract.createCapsule(
      walletA.address,
      distributionStartDate,
      periodSize,
      5,
      [tokenA.address],
      [BASE],
      false
    );

    testCapsule = await capsuleContract.getCapsule(capsuleCount);
    expect(testCapsule.periodSize).to.equal(periodSize);
    expect(testCapsule.periodCount).to.equal(5);
  });

  it("Should return three capsules with getCapsules", async () => {
    const capsules = await capsuleContract.getCapsules();
    expect(capsules.length).to.equal(3);
    expect(capsules[2].periodCount).to.equal(5);
  });

  it("Should not open Staggered Capsule before Distribution Start Date", async () => {
    await expect(
      capsuleContract.openCapsule(testCapsule.id)
    ).to.be.revertedWith("Capsule has not matured yet");
  });

  it("Should pass 31 days", async () => {
    await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 31]);
    await network.provider.send("evm_mine");
  });

  it("Should open Staggered Capsule", async () => {
    const balanceBefore = Number(await tokenA.balanceOf(walletA.address));
    await capsuleContract.openCapsule(testCapsule.id);
    const balanceAfter = Number(await tokenA.balanceOf(walletA.address));
    expect(balanceAfter).to.equal(balanceBefore + Math.trunc(Number(BASE) / 5));
  });

  it("Should require there are periods to claim to open", async () => {
    await expect(
      capsuleContract.openCapsule(testCapsule.id)
    ).to.be.revertedWith("No periods available to claim");
  });

  it("Should pass 8 days", async () => {
    await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 8]);
    await network.provider.send("evm_mine");
  });

  it("Should open second portion of staggered capsule", async () => {
    const balanceBefore = Number(await tokenA.balanceOf(walletA.address));
    await capsuleContract.openCapsule(testCapsule.id);
    const balanceAfter = Number(await tokenA.balanceOf(walletA.address));
    expect(balanceAfter).to.equal(balanceBefore + Math.trunc(Number(BASE) / 5));
  });

  it("Should pass 15 days", async () => {
    await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 15]);
    await network.provider.send("evm_mine");
  });

  it("Should open third and forth portion of staggered capsule", async () => {
    const balanceBefore = Number(await tokenA.balanceOf(walletA.address));
    await capsuleContract.openCapsule(testCapsule.id);
    const balanceAfter = Number(await tokenA.balanceOf(walletA.address));
    expect(balanceAfter).to.equal(
      balanceBefore + Math.trunc((Number(BASE) / 5) * 2)
    );
  });

  it("Should pass 8 days", async () => {
    await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 8]);
    await network.provider.send("evm_mine");
  });

  it("Should open last portion of staggered capsule", async () => {
    const balanceBefore = Number(await tokenA.balanceOf(walletA.address));
    await capsuleContract.openCapsule(testCapsule.id);
    const balanceAfter = Number(await tokenA.balanceOf(walletA.address));
    expect(balanceAfter).to.equal(balanceBefore + Math.trunc(Number(BASE) / 5));
  });

  it("Should have empty status", async () => {
    testCapsule = await capsuleContract.getCapsule(testCapsule.id);
    expect(testCapsule.empty).to.be.true;
  });

  it("Should create multi token Capsule", async () => {
    const now = new Date();
    now.setMonth(now.getMonth() + 24);
    await network.provider.send("evm_setNextBlockTimestamp", [dateToUnix(now)]);
    const nextMonth = new Date(now.setDate(now.getDate() + 30));
    const distributionStartDate = dateToUnix(nextMonth);

    const capsuleCount = await capsuleContract.getCapsuleCount();

    await tokenA.approve(capsuleContract.address, BASE);
    await tokenB.approve(capsuleContract.address, BASE);
    await tokenC.approve(capsuleContract.address, BASE);
    await capsuleContract.createCapsule(
      walletA.address,
      distributionStartDate,
      1,
      1,
      [tokenA.address, tokenB.address, tokenC.address],
      [BASE, BASE, BASE],
      true,
      { value: ethers.utils.parseEther("1") }
    );

    testCapsule = await capsuleContract.getCapsule(capsuleCount);
    expect(testCapsule.tokens.length).to.equal(3);
    expect(testCapsule.amounts.length).to.equal(3);
    expect(testCapsule.tokens[0]).to.equal(tokenA.address);
    expect(testCapsule.tokens[1]).to.equal(tokenB.address);
    expect(testCapsule.tokens[2]).to.equal(tokenC.address);
  });

  it("Should create Capsule with adding assets not allowed", async () => {
    const now = new Date();
    now.setMonth(now.getMonth() + 26);
    await network.provider.send("evm_setNextBlockTimestamp", [dateToUnix(now)]);
    const nextMonth = new Date(now.setDate(now.getDate() + 1));
    const distributionStartDate = dateToUnix(nextMonth);

    const capsuleCount = await capsuleContract.getCapsuleCount();

    await tokenA.approve(capsuleContract.address, BASE);
    await capsuleContract.createCapsule(
      walletA.address,
      distributionStartDate,
      1,
      1,
      [tokenA.address],
      [BASE],
      false,
      { value: ethers.utils.parseEther("1") }
    );

    testCapsule = await capsuleContract.getCapsule(capsuleCount);
  });

  it("Should fail when adding eth if not allowed", async () => {
    await tokenA.approve(capsuleContract.address, BASE);
    await expect(
      capsuleContract.addAssets(testCapsule.id, [], [], {
        value: ethers.utils.parseEther("1"),
      })
    ).to.be.revertedWith("Adding assets not allowed for this Capsule");
  });

  it("Should fail when adding tokens if not allowed", async () => {
    await tokenA.approve(capsuleContract.address, BASE);
    await expect(
      capsuleContract.addAssets(testCapsule.id, [tokenA.address], [BASE])
    ).to.be.revertedWith("Adding assets not allowed for this Capsule");
  });

  it("Should create Capsule with adding assets allowed", async () => {
    const now = new Date();
    now.setMonth(now.getMonth() + 27);
    await network.provider.send("evm_setNextBlockTimestamp", [dateToUnix(now)]);
    const nextMonth = new Date(now.setDate(now.getDate() + 1));
    const distributionStartDate = dateToUnix(nextMonth);

    const capsuleCount = await capsuleContract.getCapsuleCount();

    await tokenA.approve(capsuleContract.address, BASE);
    await capsuleContract.createCapsule(
      walletA.address,
      distributionStartDate,
      1,
      1,
      [tokenA.address],
      [BASE],
      true,
      { value: ethers.utils.parseEther("1") }
    );

    testCapsule = await capsuleContract.getCapsule(capsuleCount);
  });

  it("Should fail adding to non existant Capsule", async () => {
    await tokenA.approve(capsuleContract.address, BASE);
    await expect(
      capsuleContract.addAssets(testCapsule.id + 1, [tokenA.address], [BASE])
    ).to.be.revertedWith("Capsule does not exist");
  });

  it("Should fail adding inconsistant token and values", async () => {
    await tokenA.approve(capsuleContract.address, BASE);
    await expect(
      capsuleContract.addAssets(testCapsule.id, [tokenA.address], [BASE, BASE])
    ).to.be.revertedWith("Tokens and Values must be same length");

    await tokenA.approve(capsuleContract.address, BASE);
    await tokenB.approve(capsuleContract.address, BASE);
    await expect(
      capsuleContract.addAssets(
        testCapsule.id,
        [tokenA.address, tokenB.address],
        [BASE]
      )
    ).to.be.revertedWith("Tokens and Values must be same length");
  });

  it("Should fail adding for 0 token value", async () => {
    await tokenA.approve(capsuleContract.address, BASE);
    await tokenB.approve(capsuleContract.address, BASE);
    await tokenC.approve(capsuleContract.address, BASE);
    await expect(
      capsuleContract.addAssets(
        testCapsule.id,
        [tokenA.address, tokenB.address, tokenC.address],
        [BASE, 0, BASE]
      )
    ).to.be.revertedWith("Token value must be greater than 0");
  });

  it("Should have no additional values before adding", async () => {
    testCapsule = await capsuleContract.getCapsule(testCapsule.id);
    expect(testCapsule.tokens.length).to.equal(1);
    expect(testCapsule.tokens[0]).to.equal(tokenA.address);
    expect(testCapsule.amounts[0]).to.equal(BASE);
    expect(testCapsule.value).to.equal(BASE);
  });

  it("Should add eth", async () => {
    await capsuleContract.addAssets(testCapsule.id, [], [], {
      value: ethers.utils.parseEther("1"),
    });
    testCapsule = await capsuleContract.getCapsule(testCapsule.id);
    expect(testCapsule.value).to.equal(BASE.mul(2));
  });

  it("Should add existing token value", async () => {
    await tokenA.approve(capsuleContract.address, BASE);
    await capsuleContract.addAssets(testCapsule.id, [tokenA.address], [BASE]);
    testCapsule = await capsuleContract.getCapsule(testCapsule.id);
    expect(testCapsule.tokens.length).to.equal(1);
    expect(testCapsule.amounts[0]).to.equal(BASE.mul(2));
  });

  it("Should add new token value", async () => {
    await tokenB.approve(capsuleContract.address, BASE);
    await capsuleContract.addAssets(testCapsule.id, [tokenB.address], [BASE]);
    testCapsule = await capsuleContract.getCapsule(testCapsule.id);
    expect(testCapsule.tokens.length).to.equal(2);
    expect(testCapsule.amounts[0]).to.equal(BASE.mul(2));
    expect(testCapsule.amounts[1]).to.equal(BASE);
  });

  it("Should add all options at once", async () => {
    await tokenA.approve(capsuleContract.address, BASE);
    await tokenB.approve(capsuleContract.address, BASE.mul(2));
    await tokenC.approve(capsuleContract.address, BASE.mul(3));
    await capsuleContract.addAssets(
      testCapsule.id,
      [tokenA.address, tokenB.address, tokenC.address],
      [BASE, BASE.mul(2), BASE.mul(3)],

      { value: ethers.utils.parseEther("4") }
    );
    testCapsule = await capsuleContract.getCapsule(testCapsule.id);
    expect(testCapsule.tokens.length).to.equal(3);
    expect(testCapsule.amounts[0]).to.equal(BASE.mul(3));
    expect(testCapsule.amounts[1]).to.equal(BASE.mul(3));
    expect(testCapsule.amounts[2]).to.equal(BASE.mul(3));
    expect(testCapsule.value).to.equal(BASE.mul(6));
  });

  it("Should pass 2 days", async () => {
    await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 2]);
    await network.provider.send("evm_mine");
  });

  it("Should fail adding to Capsule past distribution date", async () => {
    await expect(
      capsuleContract.addAssets(testCapsule.id, [tokenA.address], [BASE])
    ).to.be.revertedWith("Capsule is past distribution date");
  });

  it("Opening should return all added values as well", async () => {
    const tokenABalanceBefore = await tokenA.balanceOf(walletA.address);
    const tokenBBalanceBefore = await tokenB.balanceOf(walletA.address);
    const tokenCBalanceBefore = await tokenC.balanceOf(walletA.address);
    await capsuleContract.openCapsule(testCapsule.id);
    const tokenABalanceAfter = await tokenA.balanceOf(walletA.address);
    const tokenBBalanceAfter = await tokenB.balanceOf(walletA.address);
    const tokenCBalanceAfter = await tokenC.balanceOf(walletA.address);
    expect(tokenABalanceAfter).to.equal(BASE.mul(3).add(tokenABalanceBefore));
    expect(tokenBBalanceAfter).to.equal(BASE.mul(3).add(tokenBBalanceBefore));
    expect(tokenCBalanceAfter).to.equal(BASE.mul(3).add(tokenCBalanceBefore));
  });

  it("Should create Capsule", async () => {
    const now = new Date();
    now.setMonth(now.getMonth() + 28);
    await network.provider.send("evm_setNextBlockTimestamp", [dateToUnix(now)]);
    const nextMonth = new Date(now.setDate(now.getDate() + 1));
    const distributionStartDate = dateToUnix(nextMonth);

    const capsuleCount = await capsuleContract.getCapsuleCount();

    await tokenA.approve(capsuleContract.address, BASE);
    await capsuleContract.createCapsule(
      walletA.address,
      distributionStartDate,
      1,
      1,
      [tokenA.address],
      [BASE],
      true,
      { value: ethers.utils.parseEther("1") }
    );

    testCapsule = await capsuleContract.getCapsule(capsuleCount);
  });

  it("Should fail on changing beneficiary for invalid capsuleId", async () => {
    await expect(
      capsuleContract.updateBeneficiary(testCapsule.id + 1, walletA.address)
    ).to.be.revertedWith("Capsule does not exist");
  });

  it("Should fail changing beneficiary to current value", async () => {
    await expect(
      capsuleContract.updateBeneficiary(testCapsule.id, walletA.address)
    ).to.be.revertedWith("Beneficiary is not different to curret");
  });

  it("Should return accurate Capsules for Received", async () => {
    const walletAReceived = await capsuleContract.getReceivedCapsules(
      walletA.address
    );
    const walletAHasCapsule =
      walletAReceived.filter((c) => c.id.eq(testCapsule.id)).length === 1;
    expect(walletAHasCapsule).to.be.true;

    const walletBReceived = await capsuleContract.getReceivedCapsules(
      walletB.address
    );
    const walletBHasCapsule =
      walletBReceived.filter((c) => c.id.eq(testCapsule.id)).length === 1;
    expect(walletBHasCapsule).to.be.false;
  });

  it("Should change beneficiary", async () => {
    const oldCapsule = await capsuleContract.getCapsule(testCapsule.id);
    const oldBeneficiary = oldCapsule.beneficiary;
    await capsuleContract.updateBeneficiary(testCapsule.id, walletB.address);
    const newCapsule = await capsuleContract.getCapsule(testCapsule.id);
    const newBeneficiary = newCapsule.beneficiary;
    expect(oldBeneficiary).to.equal(walletA.address);
    expect(newBeneficiary).to.equal(walletB.address);
    expect(newBeneficiary).to.not.equal(oldBeneficiary);
  });

  it("Should return accurate Capsules for Received", async () => {
    const walletAReceived = await capsuleContract.getReceivedCapsules(
      walletA.address
    );
    const walletAHasCapsule =
      walletAReceived.filter((c) => c.id.eq(testCapsule.id)).length === 1;
    expect(walletAHasCapsule).to.be.false;

    const walletBReceived = await capsuleContract.getReceivedCapsules(
      walletB.address
    );
    const walletBHasCapsule =
      walletBReceived.filter((c) => c.id.eq(testCapsule.id)).length === 1;
    expect(walletBHasCapsule).to.be.true;
  });

  it("Should fail for chaning beneficiary when not beneficiary", async () => {
    await expect(
      capsuleContract.updateBeneficiary(testCapsule.id, walletC.address)
    ).to.be.revertedWith("You are not the beneficiary of this Capsule");
  });

  it("Should create Capsule", async () => {
    const now = new Date();
    now.setMonth(now.getMonth() + 29);
    await network.provider.send("evm_setNextBlockTimestamp", [dateToUnix(now)]);
    const nextMonth = new Date(now.setDate(now.getDate() + 1));
    const distributionStartDate = dateToUnix(nextMonth);

    const capsuleCount = await capsuleContract.getCapsuleCount();

    await tokenA.approve(capsuleContract.address, BASE);
    await capsuleContract.createCapsule(
      walletA.address,
      distributionStartDate,
      1,
      1,
      [tokenA.address],
      [BASE],
      true,
      { value: ethers.utils.parseEther("1") }
    );

    testCapsule = await capsuleContract.getCapsule(capsuleCount);
  });

  it("Should pass 2 days", async () => {
    await network.provider.send("evm_increaseTime", [60 * 60 * 24 * 2]);
    await network.provider.send("evm_mine");
  });

  it("Should open capsule", async () => {
    await capsuleContract.openCapsule(testCapsule.id);
  });

  it("Should fail for changing beneficiary for open Capsule", async () => {
    await expect(
      capsuleContract.updateBeneficiary(testCapsule.id, walletA.address)
    ).to.be.revertedWith("Capsule is empty");
  });
});
