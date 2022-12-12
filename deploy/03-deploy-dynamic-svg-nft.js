const { network } = require("hardhat");
const { networkConfig, developmentChains } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify")
const fs = require("fs");

module.exports = async function({ getNamedAccounts, deployments }) {
    const { deploy, log } = await deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    let ethUsdPriceFeed;

    if(developmentChains.includes(network.name)) {
        const mockV3Aggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeed = mockV3Aggregator.address;
    } else {
        ethUsdPriceFeed = networkConfig[chainId].ethUsdPriceFeed;
    }

    const lowSvg = fs.readFileSync("./images/dynamicNft/frown.svg", {encoding: "utf8"});
    const highSvg = fs.readFileSync("./images/dynamicNft/happy.svg", {encoding: "utf8"});

    args = [lowSvg,highSvg,ethUsdPriceFeed];
    
    const dynamicSvgNft = await deploy("DynamicSvgNft", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: network.config.blockConfimation | 1,
    });
    log("DynamicSvgNft Contract Deployed!!!")
    log("-------------------------------------------------------------------------------------------------")

    if(!developmentChains.includes(network.name)) {
        log("Verifying DynamicSvg")
        await verify(dynamicSvgNft.address, args)
    }
}

module.exports.tags = ["all", "dynamicSvg", "main"];