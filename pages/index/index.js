//index.js
//获取应用实例
const app = getApp();
Page({
  data: {

    PublicIPAddress: "",
    NetworkType: ""
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
          PublicIPAddress: res.data.ip
        });
      }
    })
    wx.getNetworkType({
      success: function(res) {
        console.log(res);
        that.setData({
          NetworkType: res.networkType
        });
      },
    });
    var md5 = require('js-md5');;


    var message = 'hello';
    var digest = md5.update(message).digest("hex");
    //'hex':将128为数转为十六进制
    //PS:这边进制一定要转 不然会报错

  

    // setTimeout(function(){
    //   console.log("????????");
    //   if (flag =="nothing"){
    //     console.log("is NAT")

    //   } else if (flag == "anything"){
    //     console.log()
    //   }
    //   ping.close();
    // },1000);
   



    // var stunClient = require("./stunClient.js");
    // var client = stunClient.createClient();
    // // client.setServerAddr("stun.xten.com");
    // client.start(function(result) {
    //   var mapped = client.getMappedAddr();
    //   console.log([
    //     "Complete(" + result + "): ",
    //     (client.isNatted() ? "Natted" : "Open"),
    //     " NB=" + client.getNB(),
    //     " EF=" + client.getEF(),
    //     " (" + client.getNatType() + ")",
    //     " mapped=" + mapped.address + ":" + mapped.port,
    //     " rtt=" + client.getRtt()
    //   ].join(''));

    //   client.close(function() {
    //     console.log("All sockets closed.");
    //   });
    // });



  },

})