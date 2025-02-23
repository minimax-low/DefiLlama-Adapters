const sdk = require("@defillama/sdk");
const { sumTokens2 } = require('../helper/unwrapLPs')
const abi = require('./abi.json')
const { getLogs } = require('../helper/cache/getLogs')

const chain = 'ethereum'
const factory = '0xbd16088611054fce04711aa9509d1d86e04dce2c'
const wl_stETH_token = '0xf9a98a9452485ed55cd3ce5260c2b71c9807b11a'

async function tvl(_, block, _1, { api }) {

  const logs = (
    await getLogs({
      api,
      target: factory,
      fromBlock: 14916925,
      topic: 'DeployYieldTokenPair(address,address,address,address)',
    })
  )
  const toa = []

  logs.forEach(({ topics }) => {
    const gate = `0x${topics[1].substring(26)}`
    const vault = `0x${topics[2].substring(26)}`
    toa.push([vault, gate])
  })
  const balances = await sumTokens2({ block, tokensAndOwners: toa, })

  const wl_stETH_balance = balances[wl_stETH_token]
  delete balances[wl_stETH_token]
  const { output: unwrappedAsset } = await sdk.api.abi.call({
    target: wl_stETH_token,
    abi: abi.asset,
    chain, block,
  })
  const { output: balance } = await sdk.api.abi.call({
    target: wl_stETH_token,
    abi: abi.convertToAssets,
    params: wl_stETH_balance,
    chain, block,
  })

  sdk.util.sumSingleBalance(balances, unwrappedAsset, balance)
  return balances
}

module.exports = {
  ethereum: {
    tvl,
  },
};
