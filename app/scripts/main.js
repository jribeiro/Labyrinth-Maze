"use strict";

/**
 * BFS search implementation for finding the shortest path on a Maze
 * Author: João Ribeiro - me@joaoribeiro.me
 * Date: 13-10-2013
 *
 * 01. ELEMENT LISTENERS
 * 02. WINDOW LISTENERS
 * 
 */


!function ($) {

	$(function(){

		var userInput = "";
		
		var $body   = $(document.body);
		var maze 	= null;
		/*=============================================
		=          	 01. ELEMENT LISTENERS            =
		=============================================*/

		$('#maze-form').on('submit', function(e) {
			e.preventDefault();
			e.stopPropagation();

			userInput = $('#maze-input').val().toLowerCase();
			
			// Let's set some animation while processing
			document.body.className = "processing";

			// Allow some time for the animation to kick in
			setTimeout(function(){
				maze = new Maze({
					"basePath": 		"http://labyrinth.lbi.co.uk/Maze/Location/"
				,  	"mazeName": 		userInput
				,  	"startLocation": 	"start"
				});
			}, 500);

		});

		$('.try-again').on('click', function(){
			document.body.className = '';
		});

		$('#submit-info').on('click', function(){

			var resultElem = document.getElementById('result-path');
			var data = resultElem.innerHTML;

			/*
			var jsonData = {
		  		"player_name": "João Ribeiro"
			,	"email_address": "me@joaoribeiro.me"
			,	"computer_language": "javascript"
			,	"maze_name": userInput
			,	"maze_path": data
	  		};

			$.ajax({
			  	type: "POST",
			  	url: 'http://labyrinth.lbi.co.uk/Maze/SubmitHighScore/json',
			  	data: jsonData,
			  	success: function(data){
				  	$('#success p').replaceWith('<p>'+data+'</p>');
				},
				dataType: 'json'
			}); */
		});

		$('#retry').on('click', function(){
			maze.retry();
		})


		/*=============================================
		=            02. WINDOW LISTENERS             =
		=============================================*/

		window.addEventListener('applicationError', function(e){
			document.body.className = "error";

			var elem = document.getElementById('error-msg');
			elem.innerHTML = e.detail;					
		});

		window.addEventListener('success', function(e){

			document.body.className = "success";

			var totalElem = document.getElementById('total-steps');
			totalElem.innerHTML = e.detail.total;

			var resultElem = document.getElementById('result-path');
			resultElem.innerHTML = e.detail.data.join(',');
			
		});

	});

}(window.jQuery)