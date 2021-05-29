const Options = require('./options');
const flags = Options.keywords;
// combine filter and sort options into one table
const optionMap = new Map(Options.filterMap.entries());
Options.sortMap.forEach((value, key) => {
  optionMap.set(key, value);
});

class QueryParamsAggregateUndirectedGraph {
  constructor() {
    this.initEntries(optionMap);
    this.initMatrix(optionMap);
    this.setParamsAdjacencyMatrix(optionMap);
    this.setAllCoexistedFilterRelationAtSortParamNodes();
  }

  initEntries(table) {
    this.entries = {};
    this.vertices = [];
    let i = 0;
    for (const key of table.keys()) {
      this.entries[key] = i++;
      this.vertices.push(key);
    }
  }

  initMatrix(table) {
    this.matrix = new Array(table.size);
    const length = this.matrix.length;
    for (let i = 0; i < length; i++) {
      // init entry to 0
      this.matrix[i] = new Array(length).fill(0);
    }
  }

  /**
   * The function sets the entries in the adjacency matrix to 1 if there is
   * an undirected edge and otherwise 0.
   * @param {Map} table
   */
  setParamsAdjacencyMatrix(table) {
    table.forEach((value, key) => {
      const optionKey = value.optionKey;
      const mutualExclusiveList = value.mutualExclusive;
      const key_idx = this.entries[key];
      if (typeof key_idx === 'undefined') return;
      mutualExclusiveList.forEach((obj, idx) => {
        // have special flags?
        if (obj.optionKey === flags.ALL_OTHER_SORT) {
          // add all others as mutually exclusive options from sortMap
          for (const key of Options.sortMap.keys()) {
            if (key === optionKey) return;
            // all other options in sort
            this.setEdgeWithOptionKeys(optionKey, key, 1);
          }
        } else if (obj.optionKey === flags.ALL_OTHER_FILTER) {
          // add all others as mutually exclusive options from filterMap
          for (const key of Options.filterMap.keys()) {
            if (key === optionKey) return;
            // all other options in filter
            this.setEdgeWithOptionKeys(optionKey, key, 1);
          }
        } else if (obj.optionKey === flags.ALL_OTHERS) {
          // add all others as  mutually exclusive options from optionMap
          for (const key of table.keys()) {
            if (key === optionKey) return;
            // all other options in the map
            this.setEdgeWithOptionKeys(optionKey, key, 1);
          }
        } else {
          // normal
          this.setEdgeWithOptionKeys(optionKey, obj.optionKey, 1);
        }
      });
    });

    // get the complement undirected graph
    for (let i = 0; i < this.matrix.length; i++) {
      for (let j = i; j < this.matrix[i].length; j++) {
        // inverse of the original graph
        this.matrix[i][j] = this.matrix[i][j] > 0 ? 0 : 1;
      }
    }
  }

  getEdgeRowAndColumn(v, w) {
    const [r, c] = [this.entries[v], this.entries[w]];
    return r < c ? [r, c] : [c, r];
  }

  setEdgeWithOptionKeys(k1, k2, val) {
    const [row, col] = this.getEdgeRowAndColumn(k1, k2);
    this.matrix[row][col] = val;
  }

  getNeighborNodesCallback(row, arr, value, idx) {
    let val = value;
    if (idx < row) {
      // swap the subscript for the entry: 'L' shape
      val = this.matrix[idx][row];
    } else if (idx > row) {
      val = this.matrix[row][idx];
    } else {
      return arr;
    }
    if (val > 0) {
      return [...arr, idx];
    } else {
      return arr;
    }
  }

  setAllCoexistedFilterRelationAtSortParamNodes() {
    this.coexistedFilterRelation =
      new Map(); /* {sortOptionIdx: {filterOptionIdx: coexistedFilterOptionIdx}} */
    for (const sortKey of Options.sortMap.keys()) {
      const sortIdx = this.entries[sortKey];

      const coexistFilterMap = this.matrix[sortIdx]
        .reduce(
          (arr, value, idx) =>
            this.getNeighborNodesCallback(sortIdx, arr, value, idx),
          []
        )
        .reduce((acc, node_idx, _, array) => {
          // find the coexisted filter nodes
          const coexistFilters = this.matrix[node_idx]
            .reduce((arr, value, idx) => {
              if (idx === sortIdx) return arr; // skip the edge to the previous sort
              return this.getNeighborNodesCallback(node_idx, arr, value, idx);
            }, [])
            .filter((filter_idx) =>
              array.some(
                (neighbor_node_idx) => filter_idx === neighbor_node_idx
              )
            );

          return acc.set(node_idx, coexistFilters);
        }, new Map());

      // store the updated coexistedFilterOption pairs
      this.coexistedFilterRelation.set(sortIdx, coexistFilterMap);
    }
  }

  pruneQueryParams(query) {
    // filter out unknown query parameters
    // store overridden query parameters
    const params = Object.entries(query).reduce((acc, [key, value]) => {
      if (!optionMap.has(key)) return acc;
      const optionValue = optionMap.get(key);

      let overriddenOptions = [];
      if (optionValue.override_sort_options) {
        overriddenOptions = optionValue.override_sort_options;
      } else if (optionValue.override_filter_options) {
        overriddenOptions = optionValue.override_filter_options;
      } else {
        // normal, no overridden fields
        return { ...acc, [key]: value };
      }

      return overriddenOptions.reduce(
        (acc, option) =>
          typeof query[option.optionKey] ===
          'undefined' /* prevent duplicate options */
            ? { ...acc, [option.optionKey]: option.optionValue }
            : acc,
        { ...acc, [key]: value }
      );
    }, {});

    if (Object.keys(params).length === 0) return {};

    // obtain all query parameters formation that pass the mutually exclusive test
    const visitedList = [];
    for (
      let counter = 0;
      Object.keys(params).length !==
      visitedList.reduce((acc, obj) => acc + Object.keys(obj).length, 0);
      counter++
    ) {
      const visitedGroup = visitedList.reduce((acc, obj) => {
        return { ...acc, ...obj };
      }, {});
      visitedList.push({});
      const residuals = Object.keys(params).filter(
        (value) => typeof visitedGroup[value] === 'undefined'
      );

      this.dfs(
        params,
        visitedList[counter],
        visitedGroup,
        null,
        this.entries[residuals[0]]
      );
    }

    // select the query parameters formation that is the most similar to original query parameters
    const acceptedParams = visitedList.reduce(
      (max, obj, idx) => {
        const priority = Object.keys(obj).reduce((acc, optionKey) => {
          return acc + optionMap.get(optionKey).priority;
        }, 0);
        const [update_max, max_idx] =
          priority > max[1] ? [priority, idx] : [max[1], max[2]];

        if (Object.keys(max[0]).length < Object.keys(obj).length) {
          return [obj, update_max, max_idx];
        }
        return [max[0], update_max, max_idx];
      },
      [{}, 0, 0]
    ); /* [acceptedParamsObj, max_priority_total, max_idx] */

    // if the max number of query parameter is 1 in the list, select the one with highest priority
    if (Object.keys(acceptedParams[0]).length === 1) {
      return visitedList[acceptedParams[2]];
    }
    return acceptedParams[0];
  }

  getNeighborsAfterFilterCoexistenceTest(selfObj, isPrevSortNode, prevNodeIdx) {
    const neighbors = this;
    // no changes for filter node
    if (!isPrevSortNode) return neighbors;

    const coexistFilterOptionMap =
      selfObj.coexistedFilterRelation.get(prevNodeIdx);
    const list = this.map((node_idx, _, array) => {
      const res = coexistFilterOptionMap
        .get(node_idx)
        .filter((value) => array.some((val) => val === value));
      res.push(node_idx);
      return res;
    }).sort((a, b) => b.length - a.length);
    return list.length !== 0 ? list[0] : [];
  }

  dfs(params, visited, visitedGroup, prev, next) {
    // mark visited
    const paramName = this.vertices[next];
    visited[paramName] = params[paramName];
    const isCurrentSortNode = Options.sortMap.has(this.vertices[next]);

    let neighbors = this.matrix[next]
      .reduce(
        (arr, value, idx) =>
          this.getNeighborNodesCallback(next, arr, value, idx),
        []
      )
      .filter((value) => typeof params[this.vertices[value]] !== 'undefined')
      .filter(
        (value) => typeof visitedGroup[this.vertices[value]] === 'undefined'
      )
      .filter((value) => typeof visited[this.vertices[value]] === 'undefined');

    if (isCurrentSortNode && prev !== null) {
      // prev node may cause conflict
      const coexistFilterOptionsWithPrevFilter = this.coexistedFilterRelation
        .get(next)
        .get(prev);
      neighbors = coexistFilterOptionsWithPrevFilter.filter((value) =>
        neighbors.some((val) => value === val)
      );
    } else {
      neighbors = this.getNeighborsAfterFilterCoexistenceTest.apply(neighbors, [
        this,
        isCurrentSortNode,
        next,
      ]);
    }
    prev = next;

    neighbors.forEach((value) => {
      this.dfs(params, visited, visitedGroup, prev, value);
    });
  }
}

module.exports = QueryParamsAggregateUndirectedGraph;
