angular.module('SB2')
.controller('AppController', ['$scope', '$timeout', 'createChangeStream', 'LiveSet', function($scope, $timeout, createChangeStream, LiveSet) {	

	$scope.displayLimit = 5;
	$scope.totalDisplayed = 0;

	var url = location.protocol + '//' + location.hostname + ':3000';
	var apiUrl = url + '/api/v0';		
	$scope.queryFilter =  function() {
		return '?filter[limit]=' + $scope.displayLimit + '&filter[skip]=' + $scope.totalDisplayed;	
	}
	

	var eventSources = {};	
	var changes = {};
	function getModelData(model, filter, callback) {		
		var model_plural = model + 's';
		if (!eventSources[model]) {
			eventSources[model] = new EventSource(apiUrl + '/' + model_plural + '/change-stream?_format=event-stream');			
		 	changes[model] = createChangeStream(eventSources[model]);
		}	
			
		var data = null;		
		
		$.ajax(apiUrl + '/' + model_plural + filter)
		.done(function(result) {
			$timeout(function() {				
				data = new LiveSet(result, changes[model]);
				$scope[model_plural] = data.toLiveArray();
			}, 0);			
		});	
	};
	
	getModelData('Location', $scope.queryFilter());
	getModelData('Channel', $scope.queryFilter());	
				
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
		
	$scope.next = function(model) {
		$scope.totalDisplayed += $scope.displayLimit;
		getModelData(model, $scope.queryFilter());
	};
	
	$scope.prev = function(model) {
		$scope.totalDisplayed -= $scope.displayLimit;
		getModelData(model, $scope.queryFilter());
	};
	
}]);
