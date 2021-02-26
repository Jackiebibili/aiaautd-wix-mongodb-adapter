function textIndexFilter(input) {
   const query = {
      $text: {
         $search: "" + (input.eventTitle || input.location),
      },
   };
   const aggregate = {
      score: {
         $meta: "textScore",
      },
   }; //no longer needed in mongodb 4.4
   return {query, aggregate};
   //return a filter object
}

function eventLeadNameFilter(input) {
   const query = {
      "leads.leadId": input.leadId,
   };
   return query;
   //return a filter object
}

function fieldEqualityFilter(input) {
   const pairs = Object.keys(input).reduce((acc, key) => {
      return {...acc, [key]: input[key]};
   }, {});
   return {query: pairs};
}

function defaultSort() {
   const sort = {
      eventTime: -1,
      lastModifiedDate: -1,
   };
   return sort;
}

function fieldSort(input) {
   return {
      sort: {
         [input.key]: input.value,
      },
   };
}

const sort_options = [
   {optionKey: "lastModifiedDate", 
      optionValues: [{s: "ascending", number: 1}, {s:"descending", number: -1}], 
      parser: fieldSort, 
      mutualExclusive: [{optionKey: "eventTime"}]
   },
   {optionKey: "eventTime", 
      optionValues: [{s: "ascending", number: 1}, {s:"descending", number: -1}], 
      parser: fieldSort, 
      mutualExclusive: [{optionKey: "lastModifiedDate"}]
   },
];

const filter_options = [
   {optionKey: "eventTitle", 
      parser: textIndexFilter, 
      mutualExclusive: [{optionKey: "eventLeadName"}, {optionKey: "eventLocation"}, {optionKey: "eventType"}, {optionKey: "eventTag"}]
   },
   {optionKey: "eventLeadName",  
   parser: eventLeadNameFilter, 
      mutualExclusive: [{optionKey: "eventTitle"}, {optionKey: "eventLocation"}, {optionKey: "eventType"}, {optionKey: "eventTag"}]
   },
   {optionKey: "eventLocation",  
   parser: textIndexFilter, 
      mutualExclusive: [{optionKey: "eventLeadName"}, {optionKey: "eventTitle"}, {optionKey: "eventType"}, {optionKey: "eventTag"}]
   },
   {optionKey: "eventType",  
      mutualExclusive: [{optionKey: "eventLeadName"}, {optionKey: "eventLocation"}, {optionKey: "eventTitle"}, {optionKey: "eventTag"}]
   },
   {optionKey: "eventTag",  
      mutualExclusive: [{optionKey: "eventLeadName"}, {optionKey: "eventLocation"}, {optionKey: "eventType"}, {optionKey: "eventTitle"}]
   },
   {optionKey: "site_db_name", 
   parser: fieldEqualityFilter,
      mutualExclusive: []
   },
   // {optionKey: "skip", optionValues: "required"},
   // {optionKey: "limit", optionValues: "required"},
]

module.exports = {
   sortMap: sort_options.reduce((map, pair) => {
      const values = pair.optionValues.reduce((acc, pair) => {
         return acc.set(pair.s, pair.number);
      }, new Map());
      return map.set(pair.optionKey, {...pair, optionValues: values});
   }, new Map()),
   filterMap: filter_options.reduce((map, pair) => {
      return map.set(pair.optionKey, pair);
   }, new Map()),
   defaultSort,
}