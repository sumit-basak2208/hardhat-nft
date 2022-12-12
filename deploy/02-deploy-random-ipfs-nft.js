const { verifyMessage } = require("ethers/lib/utils");
const { network, ethers } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const {storeImages, storeTokenUriMetData} = require("../utils/upload-to-pinata")
const {verify} = require("../utils/verify")

const LINK_FUND = ethers.utils.parseEther("30")
const metaDataTemplate = {
    name: "",
    description:"",
    image:"",

}

module.exports = async({deployments, getNamedAccounts}) => {
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()
    const chainId = network.config.chainId

    let vrfCoordinatorAddress, subId, tokenUris, vrfCoordinator
    const callBackGasLimit = networkConfig[chainId].callBackGasLimit
    const keyHash = networkConfig[chainId].keyHash
    const mintFee = networkConfig[chainId].mintFee

    if(developmentChains.includes(network.name)) {
        vrfCoordinator = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorAddress = vrfCoordinator.address
        const tx = await vrfCoordinator.createSubscription()
        const txRec = await tx.wait(1)
        subId = txRec.events[0].args.subId
        await vrfCoordinator.fundSubscription(subId, LINK_FUND)
    } 
    else {
        vrfCoordinatorAddress = networkConfig[chainId].vrfCoordinator
        subId = networkConfig[chainId].subId
    }

    if(process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await getTokenUris()
    } else {
        tokenUris = ["QmVVx5Z9tCy9f4wVnSF5LHMe9hLoaztq7gJLMWXFZcCz6X", "QmVwfgv2RsFcaozcuvFetvxV4YU1aqmQCZcbgMmQRjHp2U", "QmXdzWV9adKYnG2DTwKEKSgsjTLVaNprD4K5yc8DhKpRSE"]
    }

    const args = [vrfCoordinatorAddress, mintFee, keyHash, subId, callBackGasLimit, tokenUris];

    const randomipfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: network.config.blockConfirmation | 1,
    })

    log("randomIpfsNft Contract Deployed!!!")
    log("-------------------------------------------------------------------------------------------------")

    if(!developmentChains.includes(network.name)) {
        log("Verifying RandomIpfsNft")
        await verify(randomipfsNft, args)
    } else {
        await vrfCoordinator.addConsumer(subId, randomipfsNft.address);
    }
}


async function getTokenUris() {
    let tokenUris = []
    const {responses, files} = await storeImages("./images/randomNft")
    for(imageResponseIndex in responses) {
        let tokenUriMetaData = {...metaDataTemplate}
        tokenUriMetaData.name = files[imageResponseIndex].replace(".png", "")
        tokenUriMetaData.description = `A powerfull ${tokenUriMetaData} pokemon`
        tokenUriMetaData.image = `ipfs://${responses[imageResponseIndex].IpfsHash}`
        console.log(`Uploading ${tokenUriMetaData.name} JSON...`)
        const metadataUploadResponse = await storeTokenUriMetData(tokenUriMetaData)
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`)
    }
    return tokenUris
}

module.exports.tags = ["all", "randomIpfs", "main"]