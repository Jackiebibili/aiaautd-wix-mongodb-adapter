const _ = require('lodash');
const {sortMap, defaultSort} = require('./options');
const BadRequestError = require('../../model/error/bad-request');

const parseSort = (sort) => {
   //filter for valid options
   let parsedOptions = [];
   if(sort) {
      parsedOptions = Object.keys(sort).filter((optionName) => {
         return sortMap.get(optionName);
      });
   }
   //clear for mutually exclusive options
   parsedOptions = parsedOptions.reduce((accept, cur) => {
      const mutualExList = sortMap.get(cur).mutualExclusive;
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
      const num = sortMap.get(key).optionValues.get(sort[key]);
      if(num) {
         return [...array, {key: key, value: num }]
      } else {
         return array;
      }
   }, []);
}

const formulateSortObject = (sort) => {
   const sortObj = sort.reduce((acc, obj) => {
      const controller = sortMap.get(obj.key).parser;
      const sortObject = controller(obj);
      return {
         sort: {
            ...acc.sort,
            ...sortObject.sort,
         },
      };
   }, {});
   if(_.isEmpty(sortObj)) {
      return defaultSort();
   }
   return sortObj;
}

exports.getSort = (sortObj) => {
   return formulateSortObject(parseSort(sortObj));
}