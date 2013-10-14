"use strict";

/**
 * BFS search implementation for finding the shortest path on a Maze
 * Author: João Ribeiro - me@joaoribeiro.me
 * Date: 13-10-2013
 */

window.Maze = window.Maze || (function() {
  
	/* 
	* Constructor
	*/
	function Maze(args) {
		this.basePath 		= args.basePath;				// Base path for the ajax calls
		this.mazeName 		= args.mazeName;				// Maze name used for dynamicly constructing the ajax call 
		this.startLocation 	= args.startLocation;			// Start Location - allows for starting the algorythm other than the normal starting point
		this.exitPoint 		= null							// Keep a record of the exit point for faster looping
		this.points 		= {}							// Store the points - this is usefull we need to consider only paths with
		this.path 			= []							// Stores the path after building the graph

		this.init();

	};

	/*
	* Bootstraps the app getting the starting point and it's adjency points
	*/
	Maze.prototype.init = function() {

		var startPoint = this.getLocation(this.startLocation);
		if(typeof startPoint !== 'undefined' && typeof startPoint.Exits !== 'undefined') {
			this.points[startPoint.LocationId] = startPoint.LocationType;
			this.BFS(startPoint.LocationId, this.exitsToLocations(startPoint.Exits));
		}
		else{
			var event = new CustomEvent('applicationError', { 'detail': 'Maze Name not Available' });
			window.dispatchEvent(event);
		}
	};

	Maze.prototype.getLocation = function(location){
		var xmlhttp,
			data;

		// Sorry IE5/6 I really don't care bout you
		xmlhttp = new XMLHttpRequest();

		xmlhttp.onreadystatechange = function() {
		    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
		        data = JSON.parse(xmlhttp.responseText);
		    }
		}

		xmlhttp.open("GET", this.buildAjaxUrl(location), false);
		xmlhttp.send();
	
		return data;
	};

	/* Based on Prof. Erik Demaine MIT lecture on Breadth-First Search: http://www.youtube.com/watch?v=s-CYnVz-uh4 */
	Maze.prototype.BFS = function (locationId, adj) {
		var level 		= {} 					// start-location = level 0
		,	parent 		= {}
		,	i 			= 1
		,	frontier 	= [locationId]
		;

		// set vars with starting points
		level[locationId] 	= 0;
		parent[locationId]	= null;

		while(0 < frontier.length) {
			var next = [];

			for (var j = frontier.length - 1; j >= 0; j--) {
				var node 	= frontier[j];
				if(node == "ce0ff34e-af40-45c3-b9df-751254908253,fd05a2e9-b275-4d3f-933c-99a9a96d6a53")
					console.log(node)

				if(typeof node === 'object')
					node = node[0];

				var adjNode = this.getAdj(node);

				/* Checking every single location as we may be missing out on possibilities otherwise */

				for (var z = adjNode.length - 1; z >= 0; z--) {
					var adjN = adjNode[z];

					if(node == "ce0ff34e-af40-45c3-b9df-751254908253,fd05a2e9-b275-4d3f-933c-99a9a96d6a53")
						console.log(node)


					if (typeof level[adjN] === 'undefined' && typeof parent[adjN] === 'undefined') {
						level[adjN] 	= i;
						parent[adjN] = node;
						next.push(adjN); 	// Append this to the next processing list
					}

				};
			};

			frontier = next;
			i +=1;
		}


		this.calculatePath(locationId, parent);
	}


	Maze.prototype.getAdj = function(node) {
		var point 	= this.getLocation(node);

		try {
			var adj 	= point.Exits;	
		} catch (e) {
			throw new Error("No exits found for the node " + node);
			var event = new CustomEvent('applicationError', { 'detail': 'Maze Name not Available' });
			window.dispatchEvent(event);
		}

		if(point.LocationType == 'Exit')
			this.exitPoint = point.LocationId;

		this.points[point.LocationId] = point.LocationType;
		
		return this.exitsToLocations(adj);
	}

	Maze.prototype.calculatePath = function (location, paths) {
		
		if (this.exitPoint == null) {
			var event = new CustomEvent('applicationError', { 'detail': "I'm lossssst"});
			window.dispatchEvent(event);
			return;
		}
		
		var results = [this.exitPoint];
		var parent 	= paths[this.exitPoint];
		
		while ( parent !== null) {
			results.push(parent);
			parent = paths[parent];

		}

		console.log(results)
		console.log(results.length)

		var event = new CustomEvent('success', { 'detail': {'total': results.length, 'data': results.reverse()} });
		window.dispatchEvent(event);
	}

  	/*
   	 * Builds url for ajax calls
   	 */
  	Maze.prototype.buildAjaxUrl = function(location){
    	return this.basePath + this.mazeName + '/' + location + '/json';
  	};

  	Maze.prototype.exitsToLocations = function (exits) {
  		var locArr = [];

		for (var i = exits.length - 1; i >= 0; i--) {
			locArr.push(this.getIdFromPath(exits[i]));
		};
		
		return locArr;
  	}

	Maze.prototype.getIdFromPath = function (path) {
		var arr = path.split('/');

		try {
			return arr[arr.length - 1];
		} catch (e) {
			throw new Error("The fully qualified location ID couldn't not be calculated for path: '" + path + "'. Aborting.");
			var event = new CustomEvent('applicationError', { 'detail': 'Maze Name not Available' });
			window.dispatchEvent(event);
		}
	}

	return Maze;
})();

/*
new Maze({
	"basePath": 		"http://labyrinth.lbi.co.uk/Maze/Location/"
,  	"mazeName": 		"easy"
,  	"startLocation": 	"start"
});
*/