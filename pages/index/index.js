//index.js
//获取应用实例
const app = getApp();
const md5 = require('js-md5');
Page({
  data: {
    publicIPAddress: "",
    networkType: "",
    natType: "",
    latitude: "",
    longitude: "",
    objectArray: [],
    connectedSSID: "",
    connectedBSSID: "",
    connectedsecure: "",
    connectedsignalStrength: "",
    natDepth: "",
    systeminfo: new Object()
  },

  //事件处理函数

  onLoad: function () {
    wx.showShareMenu({
      withShareTicket: true
    });
    wx.showModal({
      title: '用户须知',
      content: '1.这是一个科研性质的网络探测小程序,可用于探测NAT类型是否支持xbox游戏联机\n2.NAT类型如下： \n\t\tSymmetric\n\t\tFull cone\n\t\tPort-only-restricted cone\n\t\tAddress-restricted cone\n\t\tPort-restricted cone\n除了Port-restricted cone和Symmetric类型，其他类型说明都可支持p2p,steam,xbox联机\n3.测量时您需要打开定位\n4.我们仅仅收集与设备和网络环境有关的信息，不会收集任何个人隐私，相关源码已经公开，欢迎审查\n5.如果您同意以上，请开始测量',
      showCancel: false,
      confirmText: "我同意",
    })
  },
  onShow: function () {
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
    });
    wx.getNetworkType({
      success: function (res) {
        console.log(res);
        that.setData({
          networkType: res.networkType
        });
      },
    });
    wx.getLocation({
      success: function (res) {
        console.log(res);
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude
        })
      },
      fail: function (e) {
        console.log(e);
      }
    });
    wx.getSystemInfo({
      success(res) {
        that.data.systeminfo = res;
      }
    });

    // init udp
    that.udp = wx.createUDPSocket()
    that.udp.bind();
    // console.log(port);
    that.udp.send({
      address: '39.98.95.64',
      port: 10000,
      message: '39.98.95.64',
    });
    that.udp.onListening(function () {
      console.log("start listen");
    });
    that.udp.onMessage(function (res) {
      //字符串转换，很重要
      console.log("message come in");
      console.log(String.fromCharCode.apply(null, new Uint8Array(res.message)));

      that.setData({
        natDepth: JSON.parse(String.fromCharCode.apply(null, new Uint8Array(res.message))).natDepth
      });
    });
  },
  startMeasure: function () {
    var that = this; //很重要
    if (that.data.networkType != "wifi") {
      wx.showToast({
        title: "非wifi环境",
        icon: 'success',
        duration: 2000
      })

    } else {
      // wifi info
      wx.startWifi({
        success: function (res) {
          console.log(res);
          wx.getWifiList({
            success: function (res) {
              console.log(res);
            },
            fail: function (e) {
              console.log(e);
            }
          })
        },
        fail: function (e) {
          console.log(e)
        }
      });
      wx.onGetWifiList(function (CALLBACK) {
        for (var i = 0; i < CALLBACK.wifiList.length; i++) {

          that.data.objectArray = [{
            SSID: CALLBACK.wifiList[i].SSID,
            BSSID: CALLBACK.wifiList[i].BSSID,
            secure: CALLBACK.wifiList[i].secure,
            signalStrength: CALLBACK.wifiList[i].signalStrength
          }].concat(that.data.objectArray);
          that.setData({
            objectArray: that.data.objectArray
          });
        }
      });
      wx.getConnectedWifi({
        success: function (res) {
          console.log(res);
          that.setData({
            connectedSSID: res.wifi.SSID,
            connectedBSSID: res.wifi.BSSID,
            connectedsecure: res.wifi.secure,
            connectedsignalStrength: res.wifi.signalStrength
          })
        },
        fail: function (e) {
          console.log(e);
        }
      });

    }
    wx.showLoading({
      title: '加载中',
    });
    var stunClient = require("./stunClient.js");
    var client = stunClient.createClient();
    client.start(function (result) {
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


      client.close(function () {
        console.log("All sockets closed.");
      });

      wx.hideLoading();
      // Full cone\n\t\tPort-only-restricted cone\n\t\tAddress-restricted cone\n\t\tPort-restricted cone
      if (that.data.natType == "Full cone" || that.data.natType == "Port-only-restricted cone" || that.data.natType == "Address-restricted cone") {
        wx.showToast({
          title: "NAT类型可联机",
          icon: 'success',
          duration: 3000
        })
      } else {
        wx.showToast({
          title: "不可联机",
          icon: 'fail',
          duration: 3000
        })
      }
      // get id
      var seed = Math.round(Math.random() * 0x100000000).toString(16);
      seed += (new Date()).getTime().toString(16);

      // 腾讯云函数
      wx.cloud.init();
      wx.cloud.callFunction({
        // 要调用的云函数名称
        name: 'store',
        // 传递给云函数的参数
        data: {
          id: md5(seed),
          publicIPAddress: that.data.publicIPAddress,
          networkType: that.data.networkType,
          natType: that.data.natType,
          location: {
            latitude: that.data.latitude,
            longitude: that.data.longitude
          },
          nearDevice: that.data.objectArray,
          connected: {
            SSID: that.data.connectedSSID,
            BSSID: that.data.connectedBSSID,
            secure: that.data.secure,
            signalStrength: that.data.connectedsignalStrength
          },
          natDepth: that.data.natDepth,
          systeminfo: that.data.systeminfo
        },
        success: res => {
          // output: res.result === 3
          console.log(res.result);
          if (res.result.errMsg != "uploadFile:ok") {
            wx.showToast({
              title: "再试一次",
              icon: 'success',
              duration: 2000
            })
          }
        },
        fail: err => {
          // handle error
          console.log(err)
        }
      })
    });


  },
  reloadMeasure: function () {
    var that = this;
    wx.showToast({
      title: "清除缓存",
      icon: 'success',
      duration: 2000
    });
    that.setData({
      publicIPAddress: "",
      networkType: "",
      natType: "",
      latitude: "",
      longitude: "",
      objectArray: [],
      connectedSSID: "",
      connectedBSSID: "",
      connectedsecure: "",
      connectedsignalStrength: "",
      natDepth: "",
      systeminfo: new Object()
    });
    that.onShow();
  },
  onPullDownRefresh: function () {
    var that = this;
    wx.showToast({
      title: "清除缓存",
      icon: 'success',
      duration: 2000
    });
    that.setData({
      publicIPAddress: "",
      networkType: "",
      natType: "",
      latitude: "",
      longitude: "",
      objectArray: [],
      connectedSSID: "",
      connectedBSSID: "",
      connectedsecure: "",
      connectedsignalStrength: "",
      natDepth: "",
      systeminfo: new Object()
    });
    that.onShow();
  },
  startDownload: function () {
    wx.cloud.init();

    wx.cloud.getTempFileURL({
      fileList:['cloud://pla19970923.706c-pla19970923-1301706823/f6aa8df31c788b6b7b4935d674fbdefd.json',
      'cloud://pla19970923.706c-pla19970923-1301706823/f741df18dec6641538112572420134ce.json',
      'cloud://pla19970923.706c-pla19970923-1301706823/f8e18678bfc0574c39e456178d8d4d63.json',
      'cloud://pla19970923.706c-pla19970923-1301706823/f8f69523cffda37a5e8676bad6c1b945.json',
      'cloud://pla19970923.706c-pla19970923-1301706823/f901ab94420a9ae56a9acde88a894ef3.json',
      'cloud://pla19970923.706c-pla19970923-1301706823/f9d8a128d3dd3f1284e9a204eaaceda8.json',
      'cloud://pla19970923.706c-pla19970923-1301706823/faf73b71ae22e2d7d7715f357ae6664a.json',
      'cloud://pla19970923.706c-pla19970923-1301706823/fb40b8371370631a1cc7fdaa55c4b131.json',
      'cloud://pla19970923.706c-pla19970923-1301706823/fbb45b60dfdeaa666daebf8d4d88ca32.json',
      'cloud://pla19970923.706c-pla19970923-1301706823/fd0a5a9c9fdb80aec89a82c26d4b91ff.json',
      'cloud://pla19970923.706c-pla19970923-1301706823/fdb49adc12855116844dd8d9f6607a78.json',
      'cloud://pla19970923.706c-pla19970923-1301706823/fe7b14d6419a6bc436b29550487d44bf.json',
      'cloud://pla19970923.706c-pla19970923-1301706823/fe7e1b78e54d41814be4aaed6fddd2a7.json',
      'cloud://pla19970923.706c-pla19970923-1301706823/fecc92cc871d0b60fe0c14a4385a3aa4.json',
      'cloud://pla19970923.706c-pla19970923-1301706823/ff7c28cee05f69b2bae18013a861c626.json'], 
       success: res => {
        // get temp file URL
        // console.log(res.fileList[0].tempFileURL)
        let myArray=[]
        for(var i=0;i<res.fileList.length;i++){
          myArray.push(res.fileList[i].tempFileURL)
        }
        console.log(myArray)
      },
      fail: err => {
        // handle error
      }
    })
    
    // wx.request({
    //   url: 'https://706c-pla19970923-1301706823.tcb.qcloud.la', //仅为示例，并非真实的接口地址
  
    //   header: {
    //     'content-type': 'application/json' // 默认值
    //   },
    //   success (res) {
    //     console.log(res.data)
    //   }
    // })
  },
})