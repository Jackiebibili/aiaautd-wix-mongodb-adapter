const sort_options = require('./options').sortMap;

const BadRequestError = require('../../model/error/bad-request');
exports.parseSort = (sort) => {
   let parsedOptions = [];
   if(sort) {
      parsedOptions = Object.keys(sort).filter((optionName) => {
         return sort_options.get(optionName);
      });
   }
   //clear for mutually exclusive options
   parsedOptions = parsedOptions.reduce((accept, cur) => {
      const mutualExList = sort_options.get(cur).mutualExclusive;
      if(accept.every((item) => {
         return mutualExList.every((exItem) => exItem.optionKey !== item);
      })) {
         return [...accept, cur];
      } else {
         //error --cause conflict
         return accept;
      }
   }, []);
   return parsedOptions.reduce((array, key) => {
      const num = sort_options.get(key).optionValues.get(sort[key]);
      if(num) {
         return [...array, {key: key, value: num }]
      } else {
         return array;
      }
   }, []);
}