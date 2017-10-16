const compact = require('lodash/compact');
const { DAL } = require('../../../dataAccess');
const { diff } = require('deep-diff');
const TAGS = require('../../../models/enums/tags');

const sourceKindTagMap = {
  'foreign-language': TAGS.FOREIGN_LANGUAGE,
};

const sourceStatusTagMap = {
  'Do not call': TAGS.DO_NOT_CALL,
  '': TAGS.PENDING,
};

exports.requires = ['location', 'externalLocation', 'congregationId', 'source'];
exports.returns = 'congregationLocation';
exports.handler = async function translateToCongregationLocation({ externalLocation, congregationId, location: { locationId }, source }) {
  const tags = compact([
    sourceKindTagMap[(externalLocation.Kind || '').toLowerCase()],
    sourceStatusTagMap[(externalLocation.Status || '').toLowerCase()],
  ]);

  let translatedCongregationLocation = {
    congregationId,
    locationId,
    source,
    sourceData: externalLocation, // TODO remove this
    language: externalLocation.Language ? externalLocation.Language.toUpperCase() : 'N/A', // TODO create automanaged enumeration
    sourceLocationId: externalLocation.Address_ID,
    isPendingTerritoryMapping: 0,
    isDeleted: 0, // TODO what to do with this?
    isActive: 1, // TODO what to do with this?
    notes: externalLocation.Notes,
    userDefined1: tags.join(','),
    userDefined2: externalLocation.Account, // TODO add a sourceCongregationId
  };

  let congregationLocation = await DAL.findCongregationLocation({ congregationId, locationId, source });

  if (!congregationLocation) {
    congregationLocation = await DAL.insertCongregationLocation(translatedCongregationLocation);
    await DAL.addCongregationLocationActivity({ congregationId, locationId, operation: 'I', source });

  } else {
    // Update only when there is a change
    const diffs = diff(congregationLocation, translatedCongregationLocation);
    if (diffs.length) {
      congregationLocation = await DAL.updateCongregationLocation(congregationId, locationId, translatedCongregationLocation);
      await DAL.addCongregationLocationActivity({ congregationId, locationId, operation: 'U', source });
    }
  }

  return congregationLocation;
};
