//index.js
//获取应用实例
const app = getApp();
Page({
  data: {

    publicIPAddress: "",
    networkType: "",
    natType: ""
  },
  //事件处理函数

  startMeasure: function() {
    var that = this; //很重要
    // 获取公网IP

    wx.request({
      url: 'https://api.ip.sb/jsonip', //仅为示例，并非真实的接口地址

      header: {
        'content-type': 'application/json' // 默认值
      },
      success(res) {
        console.log(res.data.ip);

        that.setData({
          publicIPAddress: res.data.ip
        });
      }
    })
    wx.getNetworkType({
      success: function(res) {
        console.log(res);
        that.setData({
          networkType: res.networkType
        });
      },
    });
    // var md5 = require('js-md5');;
    // var Buffer = require("buffer").Buffer;

    // var seed = Math.round(Math.random() * 0x100000000).toString(16);
    // seed += (new Date()).getTime().toString(16);
    // console.log(typeof(md5.arrayBuffer(seed)), md5.arrayBuffer(seed));
    // console.log(Buffer(md5.arrayBuffer(seed)), typeof (Buffer(md5.arrayBuffer(seed))));







    var stunClient = require("./stunClient.js");
    var client = stunClient.createClient();
    // client.setServerAddr("stun.xten.com");
    client.start(function(result) {
      var mapped = client.getMappedAddr();
      console.log([
        "Complete(" + result + "): ",
        (client.isNatted() ? "Natted" : "Open"),
        " NB=" + client.getNB(),
        " EF=" + client.getEF(),
        " (" + client.getNatType() + ")",
        " mapped=" + mapped.address + ":" + mapped.port,
        " rtt=" + client.getRtt()
      ].join(''));
      that.setData({
        natType: client.getNatType()
      });
      client.close(function() {
        console.log("All sockets closed.");
      });
    });
    



  },

})