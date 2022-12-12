const pinataSDK = require("@pinata/sdk")
const path = require("path")
const fs = require("fs")
require("dotenv").config({path: __dirname+"/.env"})

const pinata_apiKey = process.env.PINATA_API_KEY
const pinata_secret = process.env.PINATA_SECRET
const pinata = new pinataSDK(pinata_apiKey, pinata_secret)

async function storeImages(imageFilePath) {
    imageFullPath = path.resolve(imageFilePath) //get full path D://...

    const files = fs.readdirSync(imageFullPath)
    let responses = []
    console.log("Images Uploading...")
     for(index in files) {
        const readableStreamForFile = fs.createReadStream(`${imageFilePath}/${files[index]}`)
        const options = {
            pinataMetadata: {
                name: files[index],
            },
        }
        try {
            const response = await pinata.pinFileToIPFS(readableStreamForFile, options)
            responses.push(response) 
        } catch(err) {
            console.log(err.message)
        }
     }
     console.log("Images Uploaded...")
     return {responses, files}
}

async function storeTokenUriMetData(metadata) {
    try{
        const response = await pinata.pinJSONToIPFS(metadata)
        console.log(response)
        return response
    } catch(err) {
        console.log(err.message)
    }
}
module.exports = {storeImages, storeTokenUriMetData}