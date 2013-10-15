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
		this.powerPills 	= []

		this.init();

	};

	/*
	* Bootstraps the app getting the starting point and it's adjency points
	*/
	Maze.prototype.init = function() {

		var startPoint = this.getLocation(this.startLocation);
		if(typeof startPoint !== 'undefined') {
			this.getPath(startPoint.id);
		}
		else{
			var event = new CustomEvent('applicationError', { 'detail': 'Maze Name not Available' });
			window.dispatchEvent(event);
		}
	};

	Maze.prototype.getLocation = function(location){
		var xmlhttp,
			data,
			self = this;

		// Sorry IE5/6 I really don't care bout you
		xmlhttp = new XMLHttpRequest();

		xmlhttp.onreadystatechange = function() {
		    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
		        // Cache each request to avoid extra processing
		        data = JSON.parse(xmlhttp.responseText);

		        self.points[data.LocationId] = {
		        	"id": data.LocationId
		        ,	"adj": 	self.exitsToLocations(data.Exits)
		        ,	"type": data.LocationType
		        };

		        if(data.LocationType == 'PowerPill')
					self.powerPills.push(data.LocationId)
				else if (data.LocationType == 'Exit')
					self.exitPoint = data.LocationId;


		    }
		};

		xmlhttp.open("GET", this.buildAjaxUrl(location), false);
		xmlhttp.send();
		
		return self.points[data.LocationId];
	};

	/* Based on Prof. Erik Demaine MIT lecture on Breadth-First Search: http://www.youtube.com/watch?v=s-CYnVz-uh4 */
	Maze.prototype.BFS = function (start) {
		var level 		= {} 					// start-location = level 0
		,	parents		= {}
		,	i 			= 1
		,	frontier 	= [start]
		;

		// set vars with starting points
		level[start] 	= 0;
		parents[start]	= null;

		while(0 < frontier.length) {
			var next = [];

			for (var j = frontier.length - 1; j >= 0; j--) {
				var node 	= frontier[j];

				if(typeof node === 'object')
					node = node[0];

				var adjNode = this.getAdj(node);

				/* Checking every single location as we may be missing out on possibilities otherwise */

				for (var z = adjNode.length - 1; z >= 0; z--) {
					var adjN = adjNode[z];

					if (typeof level[adjN] === 'undefined') {
						level[adjN] 	= i;
						parents[adjN] = node;
						next.push(adjN); 	// Append this to the next processing list
					}

				};
			};

			frontier = next;
			i +=1;
		}

		return parents;
	}

	Maze.prototype.getPath = function(start) {

		var parents = this.BFS(start);

		if(this.powerPills.length === 0){
			// No Power Pill in Maze, find the fastest route from S => E
			this.path = this.calculate(start, this.exitPoint, parents);
		}

		else {
			var minLength = -1;

			for (var i = this.powerPills.length - 1; i >= 0; i--) {
				// loop through each powerPill, check the shortest route that satisfies S => PP and PP => E
				var pillParents = this.BFS(this.powerPills[i]);

				var startToPill = this.calculate(start, this.powerPills[i], parents);
				var pillToExit 	= this.calculate(this.powerPills[i], this.exitPoint, pillParents);

				// Remove Power Pill from the middle to avoid duplication
				pillToExit.pop();

				var result = pillToExit.concat(startToPill);

				if(minLength == -1 || result.length < minLength)
					this.path = result;
			};
			
		}

		console.log(this.path)
		console.log(this.path.length)

		var event = new CustomEvent('success', { 'detail': {'total': this.path.length, 'data': this.path.reverse()} });
		window.dispatchEvent(event);

	}


	Maze.prototype.getAdj = function(location) {
		
		var adj;

		try {
		   // try to get resource from cache
		   adj = this.points[location].adj;
		}
		catch (e) {
			// try to fetch it from the server
			var point 	= this.getLocation(location);
			
			try{
				adj = point.adj;	
			}
			catch (e) {
				// Not possible to fetch, throwing error message event
		   		var event = new CustomEvent('applicationError', { 'detail': 'Maze Name not Available' });
				window.dispatchEvent(event);
			}
			
		}
		
		return adj;
	}

	Maze.prototype.calculate = function (start, exit, paths) {
		
		if (exit == null) {
			var event = new CustomEvent('applicationError', { 'detail': "I'm lossssst"});
			window.dispatchEvent(event);
			return;
		}
		
		var results = [exit];
		var parent 	= paths[exit];
		
		while ( parent !== start) {
			results.push(parent);
			parent = paths[parent];
		}

		results.push(start);

		return results;

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

	Maze.prototype.retry = function() {
		this.exitPoint 		= null
		this.path 			= []
		this.powerPills 	= []

		this.init();		
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