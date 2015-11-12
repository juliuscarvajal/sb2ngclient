angular.module('SB2')
.controller('AppController', ['$scope', '$timeout', 'createChangeStream', 'LiveSet', function($scope, $timeout, createChangeStream, LiveSet) {

  $scope.displayLimit = 5;
  $scope.totalDisplayed = {};

  var url = location.protocol + '//' + location.hostname + ':3000';
  var apiUrl = url + '/api/v0';
  var socket = io(url);

  socket.on('connect', function() {
    console.log('connected');
  });

  $scope.queryFilter = function(model) {
    $scope.totalDisplayed[model] = $scope.totalDisplayed[model] || 0; //initialize if it does not exist.
    return '?filter[limit]=' + $scope.displayLimit + '&filter[skip]=' + $scope.totalDisplayed[model];
  };

  var eventSources = {};
  var changes = {};
  function getModelData(model, filter, callback) {
    var model_plural = model + 's';
    if (!eventSources[model]) {
      eventSources[model] = new EventSource(apiUrl + '/' + model_plural + '/change-stream?_format=event-stream');
       changes[model] = createChangeStream(eventSources[model]);
    }

    var data = null;

    $.ajax(apiUrl + '/' + model_plural + filter(model))
    .done(function(result) {
      $timeout(function() {
        data = new LiveSet(result, changes[model]);
        $scope[model_plural] = data.toLiveArray();
      }, 0);
    });
  }

  getModelData('Location', $scope.queryFilter);
  getModelData('Channel', $scope.queryFilter);

  $scope.done = function (model, field, newval, oldval) {
    var data = {};
    data[field] = newval[field];

    var model_plural = model + 's';
    $.ajax({
      url: apiUrl + '/' + model_plural + '/' + newval.id,
      type: 'PUT', // Use POST with X-HTTP-Method-Override or a straight PUT if appropriate.
      dataType: 'json', // Set datatype - affects Accept header
      data: data
    })
    .done(function() {
      console.log('saved');
    });
  };

  $scope.editing = function (model, field, data) {
    socket.emit('coates_event', {
      source: socket.id,
      action: 'editing',
      data: {
        model: model,
        id: data.id,
        field: field
      }
    });
  };

  $scope.notEditing = function (model, field, data) {
    $('#tr-' + data.id).removeClass('error');
    socket.emit('coates_event', {
      source: socket.id,
      action: 'not_editing',
      data: {
        model: model,
        id: data.id,
        field: field
      }
    });
  };

  function toggleEditing(notification) {
    if (!notification)
      return;

    var data = notification.data;
    var editing = notification.action;
    var source = notification.source;
    if (editing === 'editing')
      $('#tr-' + data.id).attr('class', 'error');
    else
      $('#tr-' + data.id).removeClass('error');
  }

  var lastNotification = null;
  socket.on('coates_notify', function(notification) {
    lastNotification = notification;
    toggleEditing(notification);
  });

  $scope.hasPrev = function(model) {
    return $scope.totalDisplayed[model] > 0;
  }

  $scope.next = function(model) {
    $scope.totalDisplayed[model] += $scope.displayLimit;
    getModelData(model, $scope.queryFilter);
    toggleEditing(lastNotification);

  };

  $scope.prev = function(model) {
    $scope.totalDisplayed[model] -= $scope.displayLimit;
    getModelData(model, $scope.queryFilter);
    toggleEditing(notification);
  };

}]);
