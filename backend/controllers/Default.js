'use strict';

var utils = require('../utils/writer.js');
var Default = require('../service/DefaultService');

module.exports.createLobbyPOST = function createLobbyPOST (req, res, next, body) {
  Default.createLobbyPOST(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.forceNextRoundPOST = function forceNextRoundPOST (req, res, next, gameId) {
  Default.forceNextRoundPOST(gameId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCurrentUserGET = function getCurrentUserGET (req, res, next) {
  Default.getCurrentUserGET()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGameStateGET = function getGameStateGET (req, res, next, gameId) {
  Default.getGameStateGET(gameId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.joinLobbyPOST = function joinLobbyPOST (req, res, next, body, lobbyId) {
  Default.joinLobbyPOST(body, lobbyId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.listLobbiesGET = function listLobbiesGET (req, res, next) {
  Default.listLobbiesGET()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.loginUserPOST = function loginUserPOST (req, res, next, body) {
  Default.loginUserPOST(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.logoutUserPOST = function logoutUserPOST (req, res, next) {
  Default.logoutUserPOST()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.nextRoundPOST = function nextRoundPOST (req, res, next, gameId) {
  Default.nextRoundPOST(gameId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.reorderPlayersPOST = function reorderPlayersPOST (req, res, next, body, gameId) {
  Default.reorderPlayersPOST(body, gameId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.resetRoundPOST = function resetRoundPOST (req, res, next, body, gameId) {
  Default.resetRoundPOST(body, gameId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.submitScorePOST = function submitScorePOST (req, res, next, body, gameId) {
  Default.submitScorePOST(body, gameId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.subscribeToGameEventsGET = function subscribeToGameEventsGET (req, res, next, gameId) {
  Default.subscribeToGameEventsGET(gameId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
