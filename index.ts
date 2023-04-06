import { Wallet } from 'ethers'
import * as fs from 'fs/promises'
import * as create from './generator'

const log = console.log

export const generateWallets = (count = 5, regex = /.*/) =>
  Array.from({ length: count }, () => {
    const generated = false
    while (!generated) {
      const wallet = Wallet.createRandom()
      log(wallet.address)
      if (regex.test(wallet.address)) {
        const phrase = wallet.mnemonic.phrase
        return {
          mnemonic: phrase,
          evm: {
            address: wallet.address,
            key: wallet.privateKey
          },
          aptos: create.aptos(phrase, 1),
          sui: create.sui(phrase, 1),
          starknet: create.starknet(phrase, 1)
        }
      }
    }
  })

const main = async () => {
  const count = parseFloat(process.argv[2]) || 1
  const regex = RegExp(process.argv[3]) || /.*/
  const filename = 'Ferm_' + Date.now()

  await fs.writeFile(
    `./wallets/${filename}.csv`,
    'Mnemonic;Address;Private Key;Aptos address;Aptos Private Key;Sui Address;Sui Private Key;Starknet Argent Address;Starknet Private Key\n'
  )
  await generateWallets(count, regex).map((wallet) => {
    fs.appendFile(
      `./wallets/${filename}.csv`,
      `${wallet.mnemonic};${wallet.evm.address};${wallet.evm.key};${wallet.aptos.address};${wallet.aptos.key};${wallet.sui.address};${wallet.sui.key};${wallet.starknet.address};${wallet.starknet.key}\n`
    )
    log('New wallets generated in /wallets/' + filename + '.csv')
  })
}

main()
