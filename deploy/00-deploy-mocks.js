const { network, ethers } = require("hardhat");
const {DECIMALS, INITIAL_PRICE} = require("../helper-hardhat-config");

const BASE_FEE = ethers.utils.parseEther("0.25")
const GAS_PRICE_LINK = 1e9

module.exports = async function({ deployments, getNamedAccounts }) {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    if(chainId == 31337) {
        log("Local host detected!!! Deploying mocks...");

        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINK]

        })
        await deploy("MockV3Aggregator", {
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_PRICE],
        });

        log("Mocks deployed!")
    }

}

module.exports.tags = ["all", "mocks", "main"]