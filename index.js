"use strict";

const EventEmitter = require('events');
const compiler = require("./compiler");


module.exports = class extends EventEmitter {
	constructor(options) {
		super();
		
		if(typeof options.source != "string") {
			throw new Error("the source must be a string, not " + typeof(options.source));
		}
		
		this.options = {
			source: options.source || "",
		};
		
		this.cursor = 0;
		this.variables = {};
		
		var data = compiler.compile(this.options.source);
		
		this.commands = data.commands;
		this.parameters = data.parameters;
		this.labels = data.labels;
		
		this.isStopped = false;
		this.needsInput = false;

	}
	
	replaceVariables(text) {
	
		return text.replace(/\$(\w+)/g, function(match, p1) {
			p1 = p1.toLowerCase();
			
			if(this.variables[p1]) {
				return this.variables[p1];
			}
			
			return "";
		}.bind(this));
		
	}

	evaluateCondition(condition) {
		var left = this.replaceVariables(condition[0]);
		var right = this.replaceVariables(condition[2]);
		
		switch(condition[1]) {
		case "==":
			return left == right;
		case "!=":
			return left != right;
		case "<":
			return left < right;
		case "<=":
			return left <= right;
		case ">":
			return left > right;
		case ">=":
			return left >= right;
		default:
			throw new Error("Unknown operator " + condition[1]);
		}
	}

	step(input) {
		if(this.stopped) {
			throw new Error("Cannot step a stopped interpreter");
		}
		
		if(this.cursor >= this.commands.length) {
			this.stopped = true;
			return;
		}
		
		//console.log("Command " + this.cursor);
		
		var cmd = this.commands[this.cursor];
		
		switch(cmd.command) {
		case "say":
			console.log(this.replaceVariables(cmd.text));
			this.cursor += 1;
			break;
		case "pause":
			console.log("*pause for " + parseInt(this.replaceVariables(cmd.length), 10));
			this.cursor += 1;
			break;
		case "gather":
			if(typeof input == "undefined") {
				this.needsInput = true;
				break;
			}
			
			this.needsInput = false;
			input = parseInt(input, 10);
			
			var variable = this.replaceVariables(cmd.variable);
			this.variables[variable] = input;
			
			this.cursor += 1;
			break;
		case "if":
			var res = this.evaluateCondition(cmd.expression);
			
			if(!res) {
				this.cursor = cmd.negative;
			} else {
				this.cursor += 1;
			}
			
			break;
		case "goto":
			this.cursor = cmd.position;
			break;
			
		case "event":
			var args = [cmd.event];
			if(cmd.arguments) {
				for(var i = 0; i < cmd.arguments.length; i++) {
					args.push(this.replaceVariables(cmd.arguments[i]));
				}
			}
			
			this.emit.call(this, cmd.arguments);
			
			this.cursor += 1;
			break;
		}	
	}
};