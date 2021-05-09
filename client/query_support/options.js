function textIndexFilter(input) {
   const query = {
      $text: {
         $search: "" + (input.eventTitle || input.eventLocation),
      },
   };
   const aggregate = {
      score: {
         $meta: "textScore",
      },
   }; //no longer needed in mongodb 4.4
   return { query, aggregate };
   //return a filter object
}

function eventLeadNameFilter(input) {
   const query = {
      "leads.leadId": input.eventLeadId,
   };
   return { query };
   //return a filter object
}

function eventLeadNamesFilter(input) {
   const res = {};
   const inputObj = JSON.parse(input.eventLeadIds);
   res[inputObj.operator] = inputObj.ids.map((id) => {
      return eventLeadNameFilter({ eventLeadId: id }).query;
   });
   return { query: res };
}

function eventFileFilter(input) {
   const query = {
      "files.fileId": input.eventFileId,
   };
   return { query };
   //return a filter object
}

function fieldEqualityFilter(input) {
   const pairs = Object.keys(input).reduce((acc, key) => {
      return { ...acc, [key]: input[key] };
   }, {});
   return { query: pairs };
}

function eventTimeFilter(input) {
   const eventTime = JSON.parse(input.eventTime);
   const res = {};
   res.query = { eventTime: { [eventTime.operator]: new Date(eventTime.date) } }
   return res;
}

function defaultSort() {
   return {
      sort: {
         eventTime: -1,
         lastModifiedDate: -1,
      }
   };
}

function fieldSort(input) {
   return {
      sort: {
         [input.dbFieldName]: input.value,
      }
   };
}

const sort_options = [
   {
      optionKey: "sortByLastModifiedDate",
      dbFieldName: "lastModifiedDate",
      optionValues: [{ s: "ascending", number: 1 }, { s: "descending", number: -1 }],
      parser: fieldSort,
      mutualExclusive: []
   },
   {
      optionKey: "sortByEventTime",
      dbFieldName: "eventTime",
      optionValues: [{ s: "ascending", number: 1 }, { s: "descending", number: -1 }],
      parser: fieldSort,
      mutualExclusive: []
   },
   {
      optionKey: "sortByLastActivityDate",
      dbFieldName: "lastActivityDate",
      optionValues: [{ s: "ascending", number: 1 }, { s: "descending", number: -1 }],
      parser: fieldSort,
      mutualExclusive: []
   },
   {
      optionKey: "sortByCaption",
      dbFieldName: "caption",
      optionValues: [{ s: "ascending", number: 1 }, { s: "descending", number: -1 }],
      parser: fieldSort,
      mutualExclusive: []
   },
];

const filter_options = [
   {
      optionKey: "eventTitle",
      parser: textIndexFilter,
      mutualExclusive: [{ optionKey: "eventLocation" }]
   },
   {
      optionKey: "eventLeadIds",
      parser: eventLeadNamesFilter,
      mutualExclusive: []
   },
   {
      optionKey: "eventFileId",
      parser: eventFileFilter,
      mutualExclusive: []
   },
   {
      optionKey: "eventLocation",
      parser: textIndexFilter,
      mutualExclusive: [{ optionKey: "eventTitle" }]
   },
   {
      optionKey: "eventType",
      mutualExclusive: [{ optionKey: "eventLeadIds" }, { optionKey: "eventLocation" }, { optionKey: "eventTitle" }, { optionKey: "eventTag" }, { optionKey: "eventFileId" }]
   },
   {
      optionKey: "eventTag",
      mutualExclusive: [{ optionKey: "eventLeadIds" }, { optionKey: "eventLocation" }, { optionKey: "eventType" }, { optionKey: "eventTitle" }, { optionKey: "eventFileId" }]
   },
   {
      optionKey: "eventTime",
      parser: eventTimeFilter,
      mutualExclusive: []
   },
   {
      optionKey: "site_db_name",
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
      return map.set(pair.optionKey, { ...pair, optionValues: values });
   }, new Map()),
   filterMap: filter_options.reduce((map, pair) => {
      return map.set(pair.optionKey, pair);
   }, new Map()),
   defaultSort,
}