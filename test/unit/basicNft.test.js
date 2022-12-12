const { assert } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");


!developmentChains.includes(network.name) ? describe.skip : describe("Basic NFT", () => {

    let deployer, basicNft
    beforeEach(async() => {
        const accounts = await ethers.getSigners()
        deployer = await accounts[0];
        await deployments.fixture(["basicNft"])
        basicNft = await ethers.getContract("BasicNft")
    })

    describe("Constructor", () => {
        it("Sets Value Correctly", async() => {
            const tokeName = await basicNft.name()
            assert.equal(tokeName.toString(), "Dogie")
            const tokenSymbol = await basicNft.symbol()
            assert.equal(tokenSymbol.toString(), "DOG")
            const tokenCounter = await basicNft.getTokenCounter()
            assert.equal(tokenCounter.toString(), "0")
        })
    })

    describe("MintNft", () => {
        it("Mints an NFT", async() => {
            await basicNft.mintNft()
            const tokenCounter = await basicNft.getTokenCounter()
            const owner = await basicNft.ownerOf(tokenCounter.toString())
            assert.equal(owner, deployer.address)
        })

        it("Increases Token Counter", async() => {
            const beforeTokenCounter = await basicNft.getTokenCounter()
            await basicNft.mintNft()
            const afterTokenCounter = await basicNft.getTokenCounter()

            assert.equal(beforeTokenCounter.add("1").toString(), afterTokenCounter.toString())
        })
    })

    describe("tokeURI", () => {
        it("returns correct tokenURI", async() => {
            const tokenUri = await basicNft.tokenURI("1")
            assert.equal(tokenUri.toString(), "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json")
        })
    })
})