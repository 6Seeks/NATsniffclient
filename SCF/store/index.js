'use strict';
const cloud = require('wx-server-sdk');
cloud.init();
exports.main = (event, context) => {
  var res = cloud.uploadFile({
    cloudPath: String(event.id) + '.json',
    fileContent: JSON.stringify(event),
  });
  return res;
};