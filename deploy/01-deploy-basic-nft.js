const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const verify = require("../utils/verify")

module.exports = async({deployments, getNamedAccounts}) => {

    const { log, deploy } = deployments
    const { deployer } = await getNamedAccounts()

    const args = [];
    
    const basicNft = await deploy("BasicNft", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: network.config.blockConfirmation | 1,
    })

    log("BasicNft Contract Deployed!!!")
    log("-------------------------------------------------------------------------------------------------")

    if(!developmentChains.includes(network.name)) {
        log("Verifying BasicNft")
        await verify(basicNft.address, args)
    }
}

module.exports.tags = ["all", "basicNft"]