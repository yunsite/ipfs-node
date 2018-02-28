# IPFS Upload node

This is a node.js express app that uses the go-ipfs client (the js-ipfs client [doesn't support](https://github.com/ipfs/js-ipfs/pull/856) the DHT yet) to upload scenes to our IPFS node.

## Public API

| Endpoint| Method | Response |
| ------------- |:-------------:|-------------|
| api/resolve/:ipns | GET | { url: { ipfs: string } } | 
| api/resolve/:ipns?dependencies=true | GET | { url: { ipfs: string, dependencies: array } } | 
| api/get/:ipfs | GET | { data: string } | 
| api/dependencies/:ipfs | GET | { dependencies: [] } |
| api/pin/:peerId/:x/:y | GET | { data: object } | 

## Debugging

You can always check commands manually, get into the container:
```
docker exec it ipfs-node bash
```
The command api is documented [here](https://ipfs.io/docs/commands/).

## Test environment

You need to create your own source of assets and publish it. Let's say to create a 2 level deep folder structure like:

- sample 
  * child1
    - text.txt
  * child2.txt

You can upload publish your assets like:

```
ipfs add -r ./sample
```
This will return a list of hashes per element, take the main one from the parent directory.

```bash
# output omitted for convenience...
# added QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH sample/child/text.txt
# added QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH sample/child2.txt
# added QmNrDkNEovk19jPe1wQA9vXFwGwBE8t9uCGuaXukfR385g sample/child
# added QmUt8guW4C7zDZ7WHociwudbfs83zMZ7Rkxrjkoeg3QupX sample

ipfs name publish QmUt8guW4C7zDZ7WHociwudbfs83zMZ7Rkxrjkoeg3QupX
#Published to QmNwrcEu5AiDdKZEWzFcGbWxP5j7E1z4eNC7xWaJaVjKMU: /ipfs/QmUt8guW4C7zDZ7WHociwudbfs83zMZ7Rkxrjkoeg3QupX
```
Et voila! votre ipfs hash is up. Now you can query ipns hashes and dependencies using the API.

```javascript
# @GET
# api/resolve/QmNwrcEu5AiDdKZEWzFcGbWxP5j7E1z4eNC7xWaJaVjKMU
# Should return:
{
  "ok":true,
  "url":{
    "ipfs":"QmZ7yyb6gxSnp4xGSZmrsGBM9cNTCd97XPJztv58mF3Dvo",
    "dependencies":[]
  }
}
```

```javascript
# @GET
# api/resolve/QmNwrcEu5AiDdKZEWzFcGbWxP5j7E1z4eNC7xWaJaVjKMU?dependencies=true
{
  "ok":true,
  "url":{
    "ipfs":"QmZ7yyb6gxSnp4xGSZmrsGBM9cNTCd97XPJztv58mF3Dvo",
    "dependencies":[
      "QmexQCWwaEdEDWrMArR2T2g3V4RGvXXiXj6HgWfRBCumDK",
      "QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH"
    ]
  }
}
```
Assuming `QmexQCWwaEdEDWrMArR2T2g3V4RGvXXiXj6HgWfRBCumDK` is the node peerId
and there is an IPNS  inside the parcel (1,2)

```javascript
# @GET 
# api/pin/QmexQCWwaEdEDWrMArR2T2g3V4RGvXXiXj6HgWfRBCumDK/1/2
# Success

{
  "ok":true
}

# Error

{
  "ok":false,
  "error": ""
}
```

Pinned to the local storage.

```javascript
# @GET
# api/get/QmexQCWwaEdEDWrMArR2T2g3V4RGvXXiXj6HgWfRBCumDK
{
  "ok":true,
  "data": "whatever string is on your txt file\n"
}
```

Notice you cannot get node, only leaf.

## Usage with docker

### Development

```
npm run docker:build
npm run docker:run
```

### AWS

```
npm run docker:build
npm run docker:aws:run
```

## Version
2.0.0 - Refactor API gateways.
