var Auction = artifacts.require("./Auction.sol");
var FixedSupplyToken = artifacts.require("./FixedSupplyToken.sol");
var TokenNRT = artifacts.require("./TokenNRT.sol");
var TokenNRTATF = artifacts.require("./TokenNRTATF.sol");

module.exports = function(deployer) {
  deployer.deploy(Auction, "0x627306090abab3a6e1400e9345bc60c78a8bef57", {
    from: "0x627306090abab3a6e1400e9345bc60c78a8bef57",
    gas: 8000000
  });
  deployer.deploy(FixedSupplyToken, {
    from: "0x627306090abab3a6e1400e9345bc60c78a8bef57",
    gas: 8000000
  });
  deployer.deploy(TokenNRT, 100000000, "TokenNRT", 18, "NRT", {
    from: "0x627306090abab3a6e1400e9345bc60c78a8bef57",
    gas: 8000000
  });
  deployer.deploy(TokenNRTATF, 100000000, "TokenNRTATF", 18, "NRTATF", {
    from: "0x627306090abab3a6e1400e9345bc60c78a8bef57",
    gas: 8000000
  })
};
