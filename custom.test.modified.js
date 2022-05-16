// [assignment] please copy the entire modified custom.test.js here

const hre = require('hardhat')
const { ethers, waffle } = hre
const { loadFixture } = waffle
const { expect } = require('chai')
const { utils } = ethers

const Utxo = require('../src/utxo')
const { transaction, prepareTransaction } = require('../src/index')
const { Keypair } = require('../src/keypair')
const { encodeDataForBridge } = require('./utils')

const MERKLE_TREE_HEIGHT = 5
const l1ChainId = 1
const MINIMUM_WITHDRAWAL_AMOUNT = utils.parseEther(process.env.MINIMUM_WITHDRAWAL_AMOUNT || '0.05')
const MAXIMUM_DEPOSIT_AMOUNT = utils.parseEther(process.env.MAXIMUM_DEPOSIT_AMOUNT || '1')

describe('Custom Tests', function () {
  this.timeout(20000)

  async function deploy(contractName, ...args) {
    const Factory = await ethers.getContractFactory(contractName)
    const instance = await Factory.deploy(...args)
    return instance.deployed()
  }

  async function fixture() {
    require('../scripts/compileHasher')
    const [sender, gov, l1Unwrapper, multisig] = await ethers.getSigners()
    const verifier2 = await deploy('Verifier2')
    const verifier16 = await deploy('Verifier16')
    const hasher = await deploy('Hasher')

    const token = await deploy('PermittableToken', 'Wrapped ETH', 'WETH', 18, l1ChainId)
    await token.mint(sender.address, utils.parseEther('10000'))

    const amb = await deploy('MockAMB', gov.address, l1ChainId)
    const omniBridge = await deploy('MockOmniBridge', amb.address)

    /** @type {TornadoPool} */
    const tornadoPoolImpl = await deploy(
      'TornadoPool',
      verifier2.address,
      verifier16.address,
      MERKLE_TREE_HEIGHT,
      hasher.address,
      token.address,
      omniBridge.address,
      l1Unwrapper.address,
      gov.address,
      l1ChainId,
      multisig.address,
    )

    const { data } = await tornadoPoolImpl.populateTransaction.initialize(
      MINIMUM_WITHDRAWAL_AMOUNT,
      MAXIMUM_DEPOSIT_AMOUNT,
    )
    const proxy = await deploy(
      'CrossChainUpgradeableProxy',
      tornadoPoolImpl.address,
      gov.address,
      data,
      amb.address,
      l1ChainId,
    )

    const tornadoPool = tornadoPoolImpl.attach(proxy.address)

    await token.approve(tornadoPool.address, utils.parseEther('10000'))

    return { tornadoPool, token, proxy, omniBridge, amb, gov, multisig }
  }

  it('[assignment] ii. deposit 0.1 ETH in L1 -> withdraw 0.08 ETH in L2 -> assert balances', async () => {
    // [assignment] complete code here


    let { tornadoPool, token, omniBridge } = await loadFixture(fixture)

    // initialize new keyPair
    const peggySigner = new Keypair()


    const peggyDepositAmount = utils.parseEther('0.1')

    // this will generate new UTXO with 0.1 ETH.
    const peggyDepositUtxo = new Utxo({ amount: peggyDepositAmount, signer: peggySigner })

    // generate a new proof for the UTXO of the peggy
    const { args, extData } = await prepareTransaction({
      tornadoPool,
      outputs: [peggyDepositUtxo],
    })

    // generate call-data for the bridge using proof args
    const onTokenBridgedData = encodeDataForBridge({
      proof: args,
      extData,
    })

    // creating bridge transaction
    const onTokenBridgedTx = await tornadoPool.populateTransaction.onTokenBridged(
      token.address,
      peggyDepositUtxo.amount,
      onTokenBridgedData,
    )

    // emulating bridge. first it sends tokens to omnibridge mock then it sends to the pool
    await token.transfer(omniBridge.address, peggyDepositAmount)

    // creating transfer transaction
    const transferTx = await token.populateTransaction.transfer(tornadoPool.address, peggyDepositAmount)

    // executing the transfer and bridge transaction
    await omniBridge.execute([
      { who: token.address, callData: transferTx.data }, // send tokens to pool
      { who: tornadoPool.address, callData: onTokenBridgedTx.data }, // call onTokenBridgedTx
    ])

    const peggyWithdrawAmount = utils.parseEther('0.08')
    const recipient = '0xDeaD00000000000000000000000000000000BEEf'

    // peggy updated UTXO , 0.1 - 0.8 
    const peggyChangeUtxo = new Utxo({
      amount: peggyDepositAmount.sub(peggyWithdrawAmount),
      keypair: peggySigner,
    })

    // This is the tornadoPool's balance before peggy's withdrawal
    const tornadoPoolBalanceBefore = await token.balanceOf(tornadoPool.address)

    // Changing is L1Withdrawal to false.
    // L1Withdrawal:false ==> withdrawing funds in the l2

    // we use the peggyDeposiUtxo and get the new updated utxo to use it later for
    // remaing amount withdrawal
    await transaction({
      tornadoPool,
      inputs: [peggyDepositUtxo],
      outputs: [peggyChangeUtxo],
      recipient: recipient,
      isL1Withdrawal: false,
    })

    // current recipientBalance
    const recipientBalance = await token.balanceOf(recipient)

    // recipient balance should be equal to the peggyWithdrawAmount
    expect(recipientBalance).to.be.equal(utils.parseEther('0.08'))
    expect(recipientBalance).to.be.equal(peggyWithdrawAmount)

    // current balance of the pool should be zero
    const omniBridgeBalance = await token.balanceOf(omniBridge.address)
    expect(omniBridgeBalance).to.be.equal(0)

    // current balance of the pool should be equal to the peggyDepositAmount - peggyWithdrawAmount
    // current balance of the pool should be equal to the tornadoPoolBalanceBefore - peggyWithdrawAmount

    const tornadoPoolBalanceAfter = await token.balanceOf(tornadoPool.address)
    expect(tornadoPoolBalanceAfter).to.be.equal(peggyDepositAmount.sub(peggyWithdrawAmount))
    expect(tornadoPoolBalanceAfter).to.be.equal(tornadoPoolBalanceBefore.sub(peggyWithdrawAmount))


  })

  it('[assignment] iii. see assignment doc for details', async () => {
    // [assignment] complete code here

    let { tornadoPool, token, omniBridge } = await loadFixture(fixture)

    // initialize new keyPair for alice
    const aliceSigner = new Keypair()

    const aliceDepositAmount = utils.parseEther('0.13')

    // this will generate new UTXO with 0.13 ETH.
    const aliceDepositUtxo = new Utxo({ amount: aliceDepositAmount, signer: aliceSigner })

    // generate a new proof for the UTXO of the peggy
    const { args, extData } = await prepareTransaction({
      tornadoPool,
      outputs: [aliceDepositUtxo],
    })

    // generate call-data for the bridge using proof args
    const onTokenBridgedData = encodeDataForBridge({
      proof: args,
      extData,
    })

    // creating bridge transaction
    const onTokenBridgedTx = await tornadoPool.populateTransaction.onTokenBridged(
      token.address,
      aliceDepositUtxo.amount,
      onTokenBridgedData,
    )

    // emulating bridge. first it sends tokens to omnibridge mock then it sends to the pool
    await token.transfer(omniBridge.address, aliceDepositAmount)

    // creating transfer transaction
    const transferTx = await token.populateTransaction.transfer(tornadoPool.address, aliceDepositAmount)

    // executing the transfer and bridge transaction
    await omniBridge.execute([
      { who: token.address, callData: transferTx.data }, // send tokens to pool
      { who: tornadoPool.address, callData: onTokenBridgedTx.data }, // call onTokenBridgedTx
    ])

    // initialize new keyPair for bob
    const bobSigner = new Keypair()

    // Alice sends some funds to Bob
    const bobSendAmount = utils.parseEther('0.06')

    // bob utxo with 0.6 eth amount
    const bobSendUtxo = new Utxo({ amount: bobSendAmount, keypair: bobSigner })


    // updated utxo of the alice after the transfer
    const aliceChangeUtxo = new Utxo({
      amount: aliceDepositAmount.sub(bobSendAmount),
      keypair: aliceDepositUtxo.keypair,
    })

    // alice sending shielded transaction 0.6eth ===> to bob
    await transaction({ tornadoPool, inputs: [aliceDepositUtxo], outputs: [bobSendUtxo, aliceChangeUtxo] })

    //     // Bob parses chain to detect incoming funds
    // getting the updatedc commitment state of the toranadoPool
    const filter = tornadoPool.filters.NewCommitment()

    const fromBlock = await ethers.provider.getBlock()
    const events = await tornadoPool.queryFilter(filter, fromBlock.number)
    let bobReceiveUtxo
    try {
      bobReceiveUtxo = Utxo.decrypt(bobSigner, events[0].args.encryptedOutput, events[0].args.index)
    } catch (e) {
      // we try to decrypt another output here because it shuffles outputs before sending to blockchain
      bobReceiveUtxo = Utxo.decrypt(bobSigner, events[1].args.encryptedOutput, events[1].args.index)
    }

    // checking that the bob recieved the utxo from the alice
    expect(bobReceiveUtxo.amount).to.be.equal(bobSendAmount)

    // Bob withdraws a part of his funds from the shielded pool
    const bobWithdrawAmount = utils.parseEther('0.06')
    const recipient = '0xDeaD00000000000000000000000000000000BEEf'
    const bobChangeUtxo = new Utxo({ amount: bobSendAmount.sub(bobWithdrawAmount), keypair: bobSigner })
    await transaction({
      tornadoPool,
      inputs: [bobReceiveUtxo],
      outputs: [bobChangeUtxo],
      recipient: recipient,
      isL1Withdrawal: false,
    })

    // expect the recipent balance equals to the bob withdrawal amount
    let recipientBalance = await token.balanceOf(recipient)
    expect(recipientBalance).to.be.equal(bobWithdrawAmount)
    expect(recipientBalance).to.be.equal(utils.parseEther('0.06'))

    // expect tornadoPool balance equal to the alice remaing balance
    const tornadoPoolBalanceAfterBobWithdrawal = await token.balanceOf(tornadoPool.address)
    expect(tornadoPoolBalanceAfterBobWithdrawal).to.be.equal(aliceDepositAmount.sub(bobWithdrawAmount))

    // creating alice remaing amount utxo
    const aliceL2WithdrawalUtxo = new Utxo({
      amount: aliceChangeUtxo.amount.sub(aliceChangeUtxo.amount),
      keypair: aliceSigner,
    })

    await transaction({
      tornadoPool,
      inputs: [aliceChangeUtxo],
      outputs: [aliceL2WithdrawalUtxo],
      recipient: recipient,
    })


    // recipient balance should be equal to the alice total Amount
    recipientBalance = await token.balanceOf(recipient)
    expect(recipientBalance).to.be.equal(utils.parseEther('0.13'))
    expect(recipientBalance).to.be.equal(aliceDepositUtxo.amount)

    // current balance of the pool should be zero
    const omniBridgeBalance = await token.balanceOf(omniBridge.address)
    expect(omniBridgeBalance).to.be.equal(0)

    // tornado pool balance equals to the 

    const tornadoPoolBalanceAfter = await token.balanceOf(tornadoPool.address)
    const aliceTotalAmount = aliceDepositAmount.sub(aliceChangeUtxo.amount)
    expect(tornadoPoolBalanceAfter).to.be.equal(aliceTotalAmount.sub(bobWithdrawAmount))

  })
})
