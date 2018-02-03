# IPFS Upload node

This is a node.js express app that uses the go-ipfs client (the js-ipfs client [doesn't support](https://github.com/ipfs/js-ipfs/pull/856) the DHT yet) to upload scenes to our IPFS node.

## Public API

| Endpoint| response |
|`api/resolve/{ipfs}` | { url: { ipfs: string } } | 
|`api/resolve/{ipfs}?dependencies=true` | { url: { ipfs: string, dependencies: array } } | 
|`api/pin/{ipfs}` | { ok: true } | 
|`api/get/{ipfs}` | { data } | 
|`api/dependencies/{ipns}` | { dependencies: [] } |

## Debugging

You can always check commands manually, get into the container:
```
docker exec it upload bash
```
The command api is documented [here](https://ipfs.io/docs/commands/).

## Test environment

You need to create your own source of assets and publish it. Let's say to create a 2 level deep folder structure like:

- sample 
  * child1
    - text.txt
  * hild2.txt

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

```
@GET
api/resolve/QmQC5yqpDaKdw8zyHpSJHUgWmf657uMn2RgCU3C7VSWztR
```

Should return:

```javascript
{
  "ok":true,
  "url":{
    "ipfs":"QmZ7yyb6gxSnp4xGSZmrsGBM9cNTCd97XPJztv58mF3Dvo",
    "dependencies":[]
  }
}
```

```
@GET
api/resolve/QmQC5yqpDaKdw8zyHpSJHUgWmf657uMn2RgCU3C7VSWztR?dependencies=true
```

returns

```javascript
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
Assuming `QmexQCWwaEdEDWrMArR2T2g3V4RGvXXiXj6HgWfRBCumDK` if one of the txt files.

```
  @GET 
  api/pin/QmexQCWwaEdEDWrMArR2T2g3V4RGvXXiXj6HgWfRBCumDK
```
returns

```javascript
{
  "ok":true,
  "data": "pinned QmexQCWwaEdEDWrMArR2T2g3V4RGvXXiXj6HgWfRBCumDK recursively"
}

Pinned to the local storage.

```
@GET
api/get/QmexQCWwaEdEDWrMArR2T2g3V4RGvXXiXj6HgWfRBCumDK
```

Should return

```javascript
{
  "ok":true,
  "date": "whatever string is on your txt file\n"
}

Notice you cannot get node, only leaf.

## Usage with docker

```
docker build . -t upload:latest
docker run -p 3000:3000 -p 4001:4001 -p 5001:5001 -p 8080:8080 upload:latest
```
