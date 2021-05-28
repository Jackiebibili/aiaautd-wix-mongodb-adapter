const _ = require('lodash');
const { sortMap } = require('./options');
const BadRequestError = require('../../model/error/bad-request');

const parseSort = (sort) => {
   //filter for valid options
   const parsedOptions = Object.keys(sort).filter((optionName) => sortMap.has(optionName));

   // //clear for mutually exclusive options
   // parsedOptions = parsedOptions.reduce((accept, cur) => {
   //    const mutualExList = sortMap.get(cur).mutualExclusive;
   //    if (accept.every((item) => {
   //       return mutualExList.every((exItem) => exItem.optionKey !== item);
   //    })) {
   //       return [...accept, cur];
   //    } else {
   //       //error --cause conflict
   //       return accept;
   //    }
   // }, []);

   return parsedOptions.reduce((array, key) => {
      const mappedValue = sortMap.get(key);
      const dbFieldName = mappedValue.dbFieldName;
      const num = mappedValue.optionValues.get(sort[key]);
      if (Number.isInteger(num)) {
         return [...array, { key: key, dbFieldName, value: num }]
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
   // if (_.isEmpty(sortObj)) {
   //    return defaultSort();
   // }
   return sortObj;
}

exports.getSort = (sortObj) => {
   return formulateSortObject(parseSort(sortObj));
}