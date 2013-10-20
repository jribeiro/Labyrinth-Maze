"use strict";

/**
 * BFS search implementation for finding the shortest path on a Maze
 * Author: João Ribeiro - me@joaoribeiro.me
 * Date: 13-10-2013
 */

window.Maze = window.Maze || (function() 
{
  
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
		this.processedGraphs = []
		this.checkpointsPaths = []

		this.init();

	};

	/*
	* Bootstraps the app getting the starting point and it's adjency points
	*/
	Maze.prototype.init = function() {

		var startPoint = this.getLocation(this.startLocation);
		if(typeof startPoint !== 'undefined') {
			this.getPath(startPoint.id, [], []);

			var event = new CustomEvent('success', { 'detail': {'total': this.path.length, 'data': this.path} });
			window.dispatchEvent(event);

			//this.getPath2(startPoint.id);
		}
		else{
			var event = new CustomEvent('applicationError', { 'detail': 'Maze Name not Available' });
			window.dispatchEvent(event);
		}
	};


	/*
	* Shortest path between multiple points algorithm
	*/
	Maze.prototype.getPath = function (start, visited, result) 
	{

		var path 	= []
		,	parents = this.BFS(start);

		visited.push(start);

		// Final path:  S => E or C => E
		if(visited.length > this.powerPills.length)
		{
			var finale = this.calculate(start, this.exitPoint, parents);
			finale.push(this.exitPoint);

			result = result.concat(finale);

			if(finale.length > 1 && (result.length < this.path.length || this.path.length == 0))
				this.path = result.slice(0);

			// Nothing else to see here
			return;
		}

		// Let's search for all combos
		for (var i = 0; i < this.powerPills.length; i++) 
		{
		
			var checkpoint = this.powerPills[i];
			if (visited.indexOf(checkpoint) === -1)
			{

				var checkpointPath = this.calculate(start, checkpoint, parents);
				var tempRes = result.concat(checkpointPath);

				if (checkpointPath.length !== 0 && (this.path.length == 0 || this.path.length > tempRes.length))
				{

					// recursively calculate the next possible paths
					this.getPath(checkpoint, visited.slice(0), tempRes);
												
				}
				else
					return;

			}

		};

	}

	/*
	* Calculates the shortest path between two points
	*/
	Maze.prototype.calculate = function (start, checkpoint, paths) 
	{

		if(typeof this.checkpointsPaths[checkpoint] === 'undefined' || typeof this.checkpointsPaths[checkpoint][start] === 'undefined')
		{
			
			// well we need to do some heavy lifting
			var results = [];
			var parent 	= paths[checkpoint];

			/**
			 * IF:
			 *   start: path found
			 *   undefined: no path found 
			 **/
			
			while ( parent !== start && typeof parent !== undefined) {
				results.unshift(parent);
				parent = paths[parent];
			}

			if(typeof parent === undefined)
				results = [];

			results.unshift(start);

			if(typeof this.checkpointsPaths[checkpoint] === 'undefined')
				this.checkpointsPaths[checkpoint] = [];
			this.checkpointsPaths[checkpoint][start] = results;
			
		}

		return this.checkpointsPaths[checkpoint][start];
	}

	/*
	* Build the tree based on a start point
	*/
	Maze.prototype.BFS = function (start) 
	{

		var parents = this.processedGraphs[start];

		if(typeof parents === 'undefined') 
		{

			var parents		= {}
			,	frontier 	= [start]

			parents[start]	= null

			while(0 < frontier.length) {
				var next = [];

				for (var j = frontier.length - 1; j >= 0; j--) {
					var node 	= frontier[j]

					/*
					if(typeof node === 'object')
						node = node[0];
					*/

					var adjNode = this.getAdj(node);

					/* Checking every single location as we may be missing out on possibilities otherwise */
					for (var z = adjNode.length - 1; z >= 0; z--) {
						var adj = adjNode[z];

						if (typeof parents[adj] === 'undefined') {
							parents[adj] = node;
							next.push(adj); 	// Append this to the next processing list
						}

					};
				};

				frontier = next;
			}
			this.processedGraphs[start] = parents;
		}

		return parents;
	}

	/*
	* Gets the adjency list of a location from cache or fetches it from the server if not cached already
	*/
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

	/*
	* Fetches a location from the remote server
	*/
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


		        // wtf moment - why process the info?? 
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

  	/*
   	 * Builds url for ajax calls
   	 */
  	Maze.prototype.buildAjaxUrl = function(location){
    	return this.basePath + this.mazeName + '/' + location + '/json';
  	};

  	/*
   	 * Extracts the ids from the urls
   	 */
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
		this.path 			= []
		for (var i = this.powerPills.length - 1; i >= 0; i--) {
			this.powerPills[i] = undefined;
		};

		this.init();		
	}

	return Maze;
})();