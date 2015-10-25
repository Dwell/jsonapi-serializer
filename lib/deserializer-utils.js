'use strict';
var P = require('bluebird');
var _ = require('lodash');

module.exports = function (jsonapi, data, opts) {
  var ret = null;

  function findIncluded(relationship) {
    if (!jsonapi.included) { return; }

    var included = _.findWhere(jsonapi.included, {
      id: relationship.data.id,
      type: relationship.data.type
    });

    if (included) { return included.attributes; }
  }

  function extractAttributes() {
    return new P(function (resolve) {
      ret = data.attributes;
      ret.id = data.id;

      resolve(ret);
    });
  }

  function extractRelationships() {
    if (!data.relationships) { return ret; }

    return P
      .map(Object.keys(data.relationships), function (key) {
        var relationship = data.relationships[key];
        var included = findIncluded(relationship);
        var valueForRelationship = opts.valueForRelationship(relationship,
          included);

        if (_.isFunction(valueForRelationship.then)) {
          return valueForRelationship.then(function (value) {
            ret[key] = value;
            return ret;
          });
        } else {
          ret[key] = valueForRelationship;
          return ret;
        }
      });
  }

  this.perform = function () {
    return extractAttributes().then(extractRelationships);
  };
};
