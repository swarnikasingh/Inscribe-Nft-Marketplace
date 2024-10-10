const instance = await NftMarket.deployed();
instance.mintToken("https://coral-decisive-egret-758.mypinata.cloud/ipfs/QmSr5wbn3GKvdeMtWfazDm4yEXwzf3CD6nxMb3wShJ3Pg1","500000000000000000",{ value: "25000000000000000", from: accounts[0] });

instance.mintToken("https://coral-decisive-egret-758.mypinata.cloud/ipfs/QmQLoMTzPDwJ7s3GRBoqoTtaf1SSaW1e6zuhaNYv8LgS4a","300000000000000000",{ value: "25000000000000000", from: accounts[0] });
