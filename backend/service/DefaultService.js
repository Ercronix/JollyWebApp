'use strict';


/**
 * Create a lobby
 *
 * body CreateLobbyRequest 
 * returns Lobby
 **/
exports.createLobbyPOST = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "createdAt" : "2000-01-23T04:56:07.000+00:00",
  "playerCount" : 0,
  "name" : "name",
  "id" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Force next round (Admin)
 *
 * gameId Integer 
 * returns NextRoundResponse
 **/
exports.forceNextRoundPOST = function(gameId) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "game" : {
    "currentDealer" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
    "currentRound" : 1,
    "createdAt" : "2000-01-23T04:56:07.000+00:00",
    "players" : [ {
      "createdAt" : "2000-01-23T04:56:07.000+00:00",
      "currentRoundScore" : 6,
      "name" : "name",
      "hasSubmitted" : true,
      "userId" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
      "totalScore" : 0
    }, {
      "createdAt" : "2000-01-23T04:56:07.000+00:00",
      "currentRoundScore" : 6,
      "name" : "name",
      "hasSubmitted" : true,
      "userId" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
      "totalScore" : 0
    } ],
    "id" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91"
  },
  "message" : "message"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Get current logged-in user
 *
 * returns User
 **/
exports.getCurrentUserGET = function() {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "createdAt" : "2000-01-23T04:56:07.000+00:00",
  "id" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
  "username" : "username"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Get game state
 *
 * gameId Integer 
 * returns Game
 **/
exports.getGameStateGET = function(gameId) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "currentDealer" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
  "currentRound" : 1,
  "createdAt" : "2000-01-23T04:56:07.000+00:00",
  "players" : [ {
    "createdAt" : "2000-01-23T04:56:07.000+00:00",
    "currentRoundScore" : 6,
    "name" : "name",
    "hasSubmitted" : true,
    "userId" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
    "totalScore" : 0
  }, {
    "createdAt" : "2000-01-23T04:56:07.000+00:00",
    "currentRoundScore" : 6,
    "name" : "name",
    "hasSubmitted" : true,
    "userId" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
    "totalScore" : 0
  } ],
  "id" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Join a lobby
 *
 * body JoinLobbyRequest 
 * lobbyId Integer 
 * returns inline_response_200
 **/
exports.joinLobbyPOST = function(body,lobbyId) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "lobby" : {
    "createdAt" : "2000-01-23T04:56:07.000+00:00",
    "playerCount" : 0,
    "name" : "name",
    "id" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91"
  },
  "playerId" : 0
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * List all lobbies
 *
 * returns LobbyListResponse
 **/
exports.listLobbiesGET = function() {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = [ {
  "createdAt" : "2000-01-23T04:56:07.000+00:00",
  "playerCount" : 0,
  "name" : "name",
  "id" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91"
}, {
  "createdAt" : "2000-01-23T04:56:07.000+00:00",
  "playerCount" : 0,
  "name" : "name",
  "id" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91"
} ];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Login user
 *
 * body LoginRequest 
 * returns User
 **/
exports.loginUserPOST = function(body) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "createdAt" : "2000-01-23T04:56:07.000+00:00",
  "id" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
  "username" : "username"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Logout user
 *
 * no response value expected for this operation
 **/
exports.logoutUserPOST = function() {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Advance to next round
 *
 * gameId Integer 
 * returns NextRoundResponse
 **/
exports.nextRoundPOST = function(gameId) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "game" : {
    "currentDealer" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
    "currentRound" : 1,
    "createdAt" : "2000-01-23T04:56:07.000+00:00",
    "players" : [ {
      "createdAt" : "2000-01-23T04:56:07.000+00:00",
      "currentRoundScore" : 6,
      "name" : "name",
      "hasSubmitted" : true,
      "userId" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
      "totalScore" : 0
    }, {
      "createdAt" : "2000-01-23T04:56:07.000+00:00",
      "currentRoundScore" : 6,
      "name" : "name",
      "hasSubmitted" : true,
      "userId" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
      "totalScore" : 0
    } ],
    "id" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91"
  },
  "message" : "message"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Reorder players
 *
 * body ReorderPlayersRequest 
 * gameId Integer 
 * returns Game
 **/
exports.reorderPlayersPOST = function(body,gameId) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "currentDealer" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
  "currentRound" : 1,
  "createdAt" : "2000-01-23T04:56:07.000+00:00",
  "players" : [ {
    "createdAt" : "2000-01-23T04:56:07.000+00:00",
    "currentRoundScore" : 6,
    "name" : "name",
    "hasSubmitted" : true,
    "userId" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
    "totalScore" : 0
  }, {
    "createdAt" : "2000-01-23T04:56:07.000+00:00",
    "currentRoundScore" : 6,
    "name" : "name",
    "hasSubmitted" : true,
    "userId" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
    "totalScore" : 0
  } ],
  "id" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Reset current round
 *
 * body ResetRoundRequest  (optional)
 * gameId Integer 
 * returns inline_response_200_2
 **/
exports.resetRoundPOST = function(body,gameId) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "game" : {
    "currentDealer" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
    "currentRound" : 1,
    "createdAt" : "2000-01-23T04:56:07.000+00:00",
    "players" : [ {
      "createdAt" : "2000-01-23T04:56:07.000+00:00",
      "currentRoundScore" : 6,
      "name" : "name",
      "hasSubmitted" : true,
      "userId" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
      "totalScore" : 0
    }, {
      "createdAt" : "2000-01-23T04:56:07.000+00:00",
      "currentRoundScore" : 6,
      "name" : "name",
      "hasSubmitted" : true,
      "userId" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
      "totalScore" : 0
    } ],
    "id" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91"
  },
  "message" : "message"
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Submit player score
 *
 * body SubmitScoreRequest 
 * gameId Integer 
 * returns inline_response_200_1
 **/
exports.submitScorePOST = function(body,gameId) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = {
  "game" : {
    "currentDealer" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
    "currentRound" : 1,
    "createdAt" : "2000-01-23T04:56:07.000+00:00",
    "players" : [ {
      "createdAt" : "2000-01-23T04:56:07.000+00:00",
      "currentRoundScore" : 6,
      "name" : "name",
      "hasSubmitted" : true,
      "userId" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
      "totalScore" : 0
    }, {
      "createdAt" : "2000-01-23T04:56:07.000+00:00",
      "currentRoundScore" : 6,
      "name" : "name",
      "hasSubmitted" : true,
      "userId" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
      "totalScore" : 0
    } ],
    "id" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91"
  },
  "player" : {
    "createdAt" : "2000-01-23T04:56:07.000+00:00",
    "currentRoundScore" : 6,
    "name" : "name",
    "hasSubmitted" : true,
    "userId" : "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
    "totalScore" : 0
  }
};
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Subscribe to game events (SSE)
 *
 * gameId Integer 
 * returns String
 **/
exports.subscribeToGameEventsGET = function(gameId) {
  return new Promise(function(resolve, reject) {
    var examples = {};
    examples['application/json'] = "";
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

