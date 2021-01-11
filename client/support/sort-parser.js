const EMPTY = ''

exports.parseSort = (sort, collRef) => {
  let sortRef = collRef;

  if (sort) {
    sort.forEach(sortOp => {
      sortRef = sortRef.sort({ [sortOp.fieldName]: sortOp.direction });
    })
  }

  return sortRef;
};

const parseInternal = entry => {
  return `${entry.fieldName} ${entry.direction.toUpperCase()}`
}
