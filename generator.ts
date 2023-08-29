import { HDNodeWallet, Mnemonic, toBeHex, Wallet } from 'ethers'
import { AptosAccount } from 'aptos'
import { Ed25519Keypair } from '@mysten/sui.js'
import { stark, hash, ec } from 'starknet'

type Credentials = {
  address: string
  key: string
}

/**
 * Get Aptos wallet from mnemonic
 * @param {string} mnemonic - BIP-39 phrase
 * @param {number} index - derive path index
 * @returns {Credentials} address and private key
 */
export const aptos = (mnemonic: string, index = 0): Credentials => {
  const aptos = AptosAccount.fromDerivePath(`m/44'/637'/0'/0'/${index}'`, mnemonic)
  return {
    address: aptos.address().toString(),
    key: aptos.toPrivateKeyObject().privateKeyHex
  }
}

/**
 * Get Sui wallet from mnemonic
 * @param {string} mnemonic - BIP-39 phrase
 * @param {number} index - derive path index
 * @returns {Credentials} address and private key
 */
export const sui = (mnemonic: string, index = 0) => {
  const keypair = Ed25519Keypair.deriveKeypair(mnemonic, `m/44'/784'/${index}'/0'/0'`)
  return {
    address: keypair.getPublicKey().toSuiAddress(),
    key: Buffer.from(keypair.export().privateKey, 'base64').toString('hex')
  }
}

/**
 * Get Starknet wallet from mnemonic (from ETH private)
 * @param {string} mnemonic - BIP-39 phrase
 * @param {number} index - derive path index
 * @param {string} whash - contract hash (Argent X default)
 * @param {string} wproxy - contract proxy hash (Argent X default)
 * @returns {Credentials} address and private key
 */
export const starknet = (
  mnemonic: string,
  index = 0,
  whash = '0x033434ad846cdd5f23eb73ff09fe6fddd568284a0fb7d1be20ee482f044dabe2',
  wproxy = '0x25ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918'
) => {
  const ethWallet = Wallet.fromPhrase(Mnemonic.fromPhrase(mnemonic).phrase)
  const getGroundKey = (index: number, ethPrivateKey: string) => {
    const masterNode = HDNodeWallet.fromSeed(toBeHex(BigInt(ethPrivateKey)))
    const childNode = masterNode.derivePath(`m/44'/9004'/0'/0/${index}`)
    const groundKey = ec.starkCurve.grindKey(childNode.privateKey)
    return `0x${groundKey}`
  }

  const privateKey = getGroundKey(index, ethWallet.privateKey)
  const publicKey = ec.starkCurve.getStarkKey(privateKey)
  const constructorCallData = stark.compileCalldata({
    implementation: whash,
    selector: hash.getSelectorFromName('initialize'),
    calldata: stark.compileCalldata({ signer: publicKey, guardian: '0' })
  })
  const contractAddress = hash.calculateContractAddressFromHash(publicKey, wproxy, constructorCallData, 0)

  return {
    address: contractAddress.replace('0x', '0x0'),
    key: BigInt(privateKey).toString()
  }
}
