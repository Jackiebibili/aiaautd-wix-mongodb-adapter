const BadRequestError = require('../../model/error/bad-request');

function eventTextIndexFilter(input) {
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

function fileTextIndexFilter(input) {
   const query = {
      $text: {
         $search: "" + input.file_caption
      }
   };
   const aggregate = {
      score: {
         $meta: "textScore"
      }
   };
   return { query, aggregate }
}

function officerTextIndexFilter(input) {
   const query = {
      $text: {
         $search: "" + input.officer_name
      }
   };
   const aggregate = {
      score: {
         $meta: "textScore"
      }
   };
   return { query, aggregate }
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

function eventFilesFilter(input) {
   const res = {};
   const inputObj = JSON.parse(input.eventFileIds);
   res[inputObj.operator] = inputObj.ids.map((id) => {
      return eventFileFilter({ eventFileId: id }).query;
   });
   return { query: res };
}

function fieldEqualityFilter(input) {
   const pairs = Object.keys(input).reduce((acc, key) => {
      return { ...acc, [key]: input[key] };
   }, {});
   return { query: pairs };
}

function eventTimeFilter(input) {
   //format: in_n_days (from now)
   const date = new Date();
   const eventTime = JSON.parse(input.eventTime);
   switch (eventTime.date.toUpperCase()) {
      case 'NOW':
         break;
      case 'IN_1_DAY':
         date.setDate(date.getDate() + 1);
         break;
      case 'IN_3_DAYS':
         date.setDate(date.getDate() + 3);
         break;
      case 'IN_7_DAYS':
         date.setDate(date.getDate() + 7);
         break;
      default:
         throw new BadRequestError('request is not valid');
   }

   const res = {};
   res.query = { eventTime: { [eventTime.operator]: date } }
   return res;
}

// function defaultSort() {
//    return {
//       sort: {
//          eventTime: -1,
//          lastModifiedDate: -1,
//       }
//    };
// }

function fieldSort(input) {
   return {
      sort: {
         [input.dbFieldName]: input.value,
      }
   };
}

function textScoreSort() {
   return {
      sort: {
         "_": { "$meta": "textScore" }, /* field name will be discarded; supply with any field name */
      }
   };
}

/**
 * Use to determine the selection of query parameters if conflict
 */
const PRIORITY = {
   HIGH: 3,
   MEDIUM: 2,
   LOW: 1,
};

const sort_options = [
   {
      optionKey: "sortByTextMatchScore",
      dbFieldName: "_",                      //field name will be discarded; supply with any field name
      optionValues: [{ s: "", number: 0 }],  //empty string to match switch arg
      parser: textScoreSort,
      mutualExclusive: [{ optionKey: "ALL_OTHER_SORT" }],
      priority: PRIORITY.HIGH,
   },
   {
      optionKey: "sortByLastModifiedDate",
      dbFieldName: "lastModifiedDate",
      optionValues: [{ s: "ascending", number: 1 }, { s: "descending", number: -1 }],
      parser: fieldSort,
      mutualExclusive: [{ optionKey: "ALL_OTHER_SORT" }],
      priority: PRIORITY.MEDIUM,
   },
   {
      optionKey: "sortByEventTime",
      dbFieldName: "eventTime",
      optionValues: [{ s: "ascending", number: 1 }, { s: "descending", number: -1 }],
      parser: fieldSort,
      mutualExclusive: [{ optionKey: "ALL_OTHER_SORT" }],
      priority: PRIORITY.MEDIUM,
   },
   {
      optionKey: "sortByLastActivityDate",
      dbFieldName: "lastActivityDate",
      optionValues: [{ s: "ascending", number: 1 }, { s: "descending", number: -1 }],
      parser: fieldSort,
      mutualExclusive: [{ optionKey: "ALL_OTHER_SORT" }],
      priority: PRIORITY.MEDIUM,
   },
   {
      optionKey: "sortByCaption",
      dbFieldName: "caption",
      optionValues: [{ s: "ascending", number: 1 }, { s: "descending", number: -1 }],
      parser: fieldSort,
      mutualExclusive: [{ optionKey: "ALL_OTHER_SORT" }],
      priority: PRIORITY.MEDIUM,
   },
];

const filter_options = [
   {
      optionKey: "eventTitle",
      parser: eventTextIndexFilter,
      mutualExclusive: [{ optionKey: "file_caption" }, { optionKey: "officer_name" }, { optionKey: "eventLocation" }, { optionKey: "sortByLastModifiedDate" },
      { optionKey: "sortByEventTime" }, { optionKey: "sortByLastActivityDate" }, { optionKey: "sortByCaption" }],
      override_sort_options: [{ optionKey: "sortByTextMatchScore", optionValue: "" }],
      priority: PRIORITY.MEDIUM,
   },
   {
      optionKey: "eventLeadIds",
      parser: eventLeadNamesFilter,
      mutualExclusive: [{ optionKey: "sortByLastModifiedDate" }, { optionKey: "sortByLastActivityDate" }, { optionKey: "sortByCaption" }], //exact match, no other collection sorting involved
      priority: PRIORITY.MEDIUM,
   },
   {
      optionKey: "eventFileIds",
      parser: eventFilesFilter,
      mutualExclusive: [{ optionKey: "sortByTextMatchScore" }, { optionKey: "sortByLastActivityDate" }, { optionKey: "sortByCaption" }], //exact match, no other collection sorting involved
      priority: PRIORITY.MEDIUM,
   },
   {
      optionKey: "eventLocation",
      parser: eventTextIndexFilter,
      mutualExclusive: [{ optionKey: "file_caption" }, { optionKey: "officer_name" }, { optionKey: "eventTitle" }, { optionKey: "sortByLastModifiedDate" },
      { optionKey: "sortByEventTime" }, { optionKey: "sortByLastActivityDate" }, { optionKey: "sortByCaption" }],
      override_sort_options: [{ optionKey: "sortByTextMatchScore", optionValue: "" }],
      priority: PRIORITY.MEDIUM,
   },
   {
      optionKey: "eventType",
      mutualExclusive: [], //TBD
      priority: PRIORITY.MEDIUM,
   },
   {
      optionKey: "eventTags",
      mutualExclusive: [], //TBD
      priority: PRIORITY.MEDIUM,
   },
   {
      optionKey: "eventTime",
      parser: eventTimeFilter,
      mutualExclusive: [{ optionKey: "sortByLastModifiedDate" },
      { optionKey: "sortByTextMatchScore" }, { optionKey: "sortByLastActivityDate" }, { optionKey: "sortByCaption" }],
      priority: PRIORITY.MEDIUM,
   },
   {
      optionKey: "site_db_name",
      parser: fieldEqualityFilter,
      mutualExclusive: [{ optionKey: 'ALL_OTHERS' }], //exact match, no sorting involved
      priority: PRIORITY.MEDIUM,
   },
   {
      optionKey: "file_caption",
      parser: fileTextIndexFilter,
      mutualExclusive: [{ optionKey: "ALL_OTHER_FILTER" }, { optionKey: "sortByLastModifiedDate" },
      { optionKey: "sortByEventTime" }, { optionKey: "sortByLastActivityDate" }, { optionKey: "sortByCaption" }],
      override_sort_options: [{ optionKey: "sortByTextMatchScore", optionValue: "" }],
      priority: PRIORITY.MEDIUM,
   },
   {
      optionKey: "officer_name",
      parser: officerTextIndexFilter,
      mutualExclusive: [{ optionKey: "ALL_OTHER_FILTER" }, { optionKey: "sortByLastModifiedDate" },
      { optionKey: "sortByEventTime" }, { optionKey: "sortByLastActivityDate" }, { optionKey: "sortByCaption" }],
      override_sort_options: [{ optionKey: "sortByTextMatchScore", optionValue: "" }],
      priority: PRIORITY.MEDIUM,
   },
];

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
   keywords: {
      ['ALL_OTHER_SORT']: 'ALL_OTHER_SORT',
      ['ALL_OTHERS']: 'ALL_OTHERS',
      ['ALL_OTHER_FILTER']: 'ALL_OTHER_FILTER',
   }
}