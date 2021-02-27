const { filterMap } = require('./options');
const BadRequestError = require('../../model/error/bad-request');

const parseFilter = (query) => {
   //filter for valid options
   let parsedOptions = [];
   if(query) {
      parsedOptions = Object.keys(query).filter((optionName) => {
         return filterMap.get(optionName);
      });
   }
   //clear for mutually exclusive options
   parsedOptions = parsedOptions.reduce((accept, cur) => {
      const mutualExList = filterMap.get(cur).mutualExclusive;
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

const formulateQueryObject = (filter) => {
   //formulate query and sort objects
   return filter.reduce((acc, obj) => {
      const controller = filterMap.get(obj.key).parser;
      const queryObject = controller({[obj.key]: obj.value});
      return {
         query: {
            ...acc.query,
            ...queryObject.query,
         },
         aggregate: {
            ...acc.aggregate,
            ...queryObject.aggregate,
         },
      };
   }, {});
}

exports.getFilters = (query_object) => {
   return formulateQueryObject(parseFilter(query_object));
}