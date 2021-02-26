const filter_options = require('./options').filterMap;

const BadRequestError = require('../../model/error/bad-request');

exports.parseFilter = (query) => {
   let parsedOptions = [];
   if(query) {
      parsedOptions = Object.keys(query).filter((optionName) => {
         return filter_options.get(optionName);
      });
   }
   //clear for mutually exclusive options
   parsedOptions = parsedOptions.reduce((accept, cur) => {
      const mutualExList = filter_options.get(cur).mutualExclusive;
      if(accept.every((item) => {
         return mutualExList.every((exItem) => exItem.optionKey !== item);
      })) {
         return [...accept, cur];
      } else {
         //error --cause conflict
         return accept;
      }
   }, []);
   return parsedOptions.map((key) => {
      return {key: key, value: query[key]};
   });
}