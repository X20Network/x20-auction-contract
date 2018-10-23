const Auction = artifacts.require("Auction");
const FixedSupplyToken = artifacts.require("FixedSupplyToken");

var web3Utils = require("web3-utils");

function decToHex(str){ // .toString(16) only works up to 2^53
    var dec = str.toString().split(''), sum = [], hex = [], i, s
    while(dec.length){
        s = 1 * dec.shift()
        for(i = 0; s || i < sum.length; i++){
            s += (sum[i] || 0) * 10
            sum[i] = s % 16
            s = (s - sum[i]) / 16
        }
    }
    while(sum.length){
        hex.push(sum.pop().toString(16))
    }
    return hex.join('')
}

function extendDigits(str, digits) {
    return Array(digits - str.length + 1).join("0") + str;
}
function orderBits(userIndex, price, amount) {
    return "0x" + extendDigits(decToHex(userIndex), 8) + extendDigits(decToHex(price), 28) + extendDigits(decToHex(amount), 28);
}

contract('Auction', async (accounts) => {
    it("should execute a big auction with offchain orders correctly", async () => {
        let useReserve = 0;
        // let useReserve = 150;

        let auction = await Auction.deployed();
        let token = await FixedSupplyToken.deployed();

        await auction.addToken(token.address, 0);
        await auction.changeFeeAccount(accounts[1]);
        await auction.startAuction(token.address, 1546300800, 600, 600);

        await auction.deposit({value: 100000000000, from: accounts[0]});
        await token.approve(auction.address, 10000000);
        await auction.depositToken(token.address, 10000000);

        await auction.addReserve(useReserve * 2);
        await auction.addReserve(useReserve * 2);
        await auction.addReserve(useReserve * 2);

        await auction.startReveal(token.address);
        await auction.revealPublicOrdersCount(token.address, 43, 43);
        let auctionIndex = await auction.getAuctionIndex.call(token.address);
        let userIndex = await auction.getUserIndex.call(accounts[0]);

        let tokenAddresses = []; let orders = []; let vs = []; let rs = []; let ss = [];
        for (var i = 1; i <= 43; i++) {
            type = "Public buy"; price = i.toString() + "0000000000000000000"; amount = 3;
            orders.push(orderBits(userIndex, price, amount));
            msg = web3Utils.soliditySha3(type, amount, token.address, price, auctionIndex);
            signature = web3.eth.sign(accounts[0], msg);
            rs.push(signature.substr(0,66)); ss.push("0x" + signature.substr(66,64)); vs.push(parseInt(signature.substr(130, 2), 16) + 27);
        }
        await auction.revealBuys(token.address, orders, vs, rs, ss, useReserve);

        tokenAddresses = []; orders = []; vs = []; rs = []; ss = [];
        for (var i = 1; i <= 43; i++) {
            type = "Public sell"; price = i.toString() + "0000000000000000000"; amount = 3;
            orders.push(orderBits(userIndex, price, amount));
            msg = web3Utils.soliditySha3(type, amount, token.address, price, auctionIndex);
            signature = web3.eth.sign(accounts[0], msg);
            rs.push(signature.substr(0,66)); ss.push("0x" + signature.substr(66,64)); vs.push(parseInt(signature.substr(130, 2), 16) + 27);
        }
        await auction.revealSells(token.address, orders, vs, rs, ss, useReserve);

        await auction.checkVolume(token.address, "210000000000000000000", "210000000000000000000", 100, useReserve); // wrong price suggestion
        await auction.checkVolume(token.address, "220000000000000000000", "220000000000000000000", 100, useReserve); // correct price suggestion
        await auction.checkVolume(token.address, "230000000000000000000", "230000000000000000000", 100, useReserve); // wrong price suggestion
        let maxVolume = await auction.getMaxVolume.call(token.address);
        let auctionPrice = await auction.getMaxVolumePrice.call(token.address);
        await auction.executeAuction(token.address, 100, useReserve);

        assert(maxVolume.equals(22*3));
        assert(auctionPrice.equals("220000000000000000000"));
    });
})
