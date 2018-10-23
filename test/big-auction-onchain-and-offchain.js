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
    it("should execute a big auction with onchain and offchain orders correctly", async () => {
        let useReserve = 0;

        let amount = web3.toWei(2, 'ether');

        let auction = await Auction.deployed();
        let token = await FixedSupplyToken.deployed();

        await auction.addToken(token.address, 0);
        await auction.startAuction(token.address, 1546300800, 600, 600);

        await auction.addReserve(useReserve * 2);
        await auction.addReserve(useReserve * 2);
        await auction.addReserve(useReserve * 2);

        for (var i = 1; i <= 5; i++) {
            await auction.deposit({value: i * amount, from: accounts[i]});

            await auction.buy(token.address, web3.toWei(i, 'ether'), amount, { from: accounts[i] });
        }

        for (var i = 11; i <= 15; i++) {
            await token.transfer(accounts[i], amount, { from: accounts[0] });
            await token.approve(auction.address, amount, { from: accounts[i] });
            await auction.depositToken(token.address, amount, { from: accounts[i] });

            await auction.sell(token.address, web3.toWei(i - 10, 'ether'), amount, { from: accounts[i] });
        }

        await auction.startReveal(token.address);
        await auction.revealPublicOrdersCount(token.address, 10, 10);

        let auctionIndex = await auction.getAuctionIndex.call(token.address);
        let tokenAddresses = []; let orders = []; let vs = []; let rs = []; let ss = [];
        for (var i = 6; i <= 10; i++) {
            type = "Public buy"; price = web3.toWei(i - 5, 'ether');
            await auction.deposit({value: (i - 5) * amount, from: accounts[i]});

            let userIndex = await auction.getUserIndex.call(accounts[i]);
            orders.push(orderBits(userIndex, price.toString(), amount.toString()));
            msg = web3Utils.soliditySha3(type, amount.toString(), token.address, price.toString(), auctionIndex);
            signature = web3.eth.sign(accounts[i], msg);
            rs.push(signature.substr(0,66)); ss.push("0x" + signature.substr(66,64)); vs.push(parseInt(signature.substr(130, 2), 16) + 27);
        }
        await auction.revealBuys(token.address, orders, vs, rs, ss, useReserve);

        tokenAddresses = []; orders = []; vs = []; rs = []; ss = [];
        for (var i = 16; i <= 20; i++) {
            await token.transfer(accounts[i], amount, { from: accounts[0] });
            await token.approve(auction.address, amount, { from: accounts[i] });
            await auction.depositToken(token.address, amount, { from: accounts[i] });

            let userIndex = await auction.getUserIndex.call(accounts[i]);
            type = "Public sell"; price = web3.toWei(i - 15, 'ether');

            orders.push(orderBits(userIndex, price.toString(), amount.toString()));
            msg = web3Utils.soliditySha3(type, amount.toString(), token.address, price.toString(), auctionIndex);
            signature = web3.eth.sign(accounts[i], msg);
            rs.push(signature.substr(0,66)); ss.push("0x" + signature.substr(66,64)); vs.push(parseInt(signature.substr(130, 2), 16) + 27);
        }
        await auction.revealSells(token.address, orders, vs, rs, ss, useReserve);

        await auction.checkVolume(token.address, "2000000000000000000", "2000000000000000000", 100, useReserve);
        await auction.checkVolume(token.address, "2500000000000000000", "2500000000000000000", 100, useReserve);
        await auction.checkVolume(token.address, "3000000000000000000", "3000000000000000000", 100, useReserve); // Correct price
        await auction.checkVolume(token.address, "4000000000000000000", "4000000000000000000", 100, useReserve);

        let auctionPrice = await auction.getMaxVolumePrice.call(token.address);
        await auction.executeAuction(token.address, 100, useReserve);

        assert.equal(auctionPrice.toNumber(), "3000000000000000000");

        for (var i = 1; i <= 10; i++) {
            let balance = await auction.getBalance(token.address, accounts[i]);
            let ethBalance = await auction.getBalance(0, accounts[i]);
            let ethDeposited;
            if (i <= 5) {
                price = web3.toWei(i, 'ether');
                ethDeposited = i * amount;
            } else {
                price = web3.toWei(i - 5, 'ether');
                ethDeposited = (i - 5) * amount;
            }
            if (Number(price) >= auctionPrice.toNumber()) {
                assert.equal(balance.toNumber(), amount);
                assert.equal(ethBalance.toNumber(), ethDeposited - (auctionPrice.toNumber() * web3.fromWei(amount, 'ether')));
            } else {
                assert.equal(balance.toNumber(), 0);
                assert.equal(ethBalance.toNumber(), ethDeposited);
            }
        }

        for (var i = 11; i <= 20; i++) {
            if (i <= 15) {
                price = web3.toWei(i - 10, 'ether');
            } else {
                price = web3.toWei(i - 15, 'ether');
            }
            let balance = await auction.getBalance(token.address, accounts[i]);
            if (Number(price) <= auctionPrice.toNumber()) {
                assert.equal(balance.toNumber(), 0);
            } else {
                assert.equal(balance.toNumber(), amount);
            }
        }
    });
})
