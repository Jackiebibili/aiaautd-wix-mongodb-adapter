const { filterMap } = require('./options');
// const BadRequestError = require('../../model/error/bad-request');

const parseFilter = (query) => {
  // filter for valid options
  const parsedOptions = Object.keys(query).filter((optionName) =>
    filterMap.has(optionName)
  );

  // //clear for mutually exclusive options
  // parsedOptions = parsedOptions.reduce((accept, cur) => {
  //    const mutualExList = filterMap.get(cur).mutualExclusive;
  //    if (accept.every((item) => {
  //       return mutualExList.every((exItem) => exItem.optionKey !== item);
  //    })) {
  //       return [...accept, cur];
  //    } else {
  //       //error --cause conflict
  //       return accept;
  //    }
  // }, []);

  return parsedOptions.map((key) => {
    return { key: key, value: query[key] };
  });
};

const formulateQueryObject = (filter) => {
  // formulate query and sort objects
  return filter.reduce((acc, obj) => {
    const controller = filterMap.get(obj.key).parser;
    const queryObject = controller({ [obj.key]: obj.value });
    // if params have the same key, append the values
    const key = Object.keys(queryObject.query)[0];
    if (
      acc.query &&
      Object.prototype.hasOwnProperty.apply(
        acc.query,
        key
      ) /* acc.query.hasOwnProperty(key) */
    ) {
      const values = [...acc.query[key], ...queryObject.query[key]];
      return {
        query: {
          ...acc.query,
          [key]: values,
        },
        aggregate: {
          ...acc.aggregate,
          ...queryObject.aggregate,
        },
      };
    } else {
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
    }
  }, {});
};

exports.getFilters = (query_object) => {
  return formulateQueryObject(parseFilter(query_object));
};
