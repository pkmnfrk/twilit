var eol = require("eol");

function firstWord(line) {
	var ix = line.indexOf(' ');
	if(ix == -1) return line;
	
	return line.substring(0, ix);
}

function exceptFirstWord(line, word) {
	if(!word) word = firstWord(line);
	
	if(line.length <= word.length) return "";
	
	return line.substring(word.length + 1);
}

function parseBinaryExpression(rest) {
	
	var parts = rest.split(/(\=\=|\!\=|\<\=?|\>\=?)/); // ==, !=, <=, <, >=, >
	
	if(parts.length != 3) {
		throw new Error("Invalid expression " + rest);
	}
	
	for(var i = 0; i < parts.length; i++) {
		parts[i] = parts[i].trim();
	}
	
	return parts;
	
}

exports.compile = function(source) {
	source = eol.lf(source);
	source = source.replace(/(^\s+|%.*$)/gm, "");
	
	var lines = source.split("\n");
	
	var ret = {
		commands: [],
		parameters: [],
		labels: {}
	};
	
	var ifs_stack = [];
	var current_if = [];
	
	for(var i = 0; i < lines.length; i++) {
		var word = firstWord(lines[i]).toUpperCase();
		
		if(!word) continue;
		
		var rest = exceptFirstWord(lines[i], word).trim();
		
		switch(word) {
		case 'PARAM':
			var params = rest.split(' ');
			
			for(var j = 0; j < params.length; j++) {
				var p = params[j].toLowerCase();
				
				if(ret.parameters.indexOf(p) !== -1) {
					throw new Error("duplicate parameter '" + p + "'");
				}
				
				ret.parameters.push(p);
			}
			break;
			
		case 'LABEL':
			ret.labels[rest] = ret.commands.length;
			
			break;
			
		case 'SAY':
			var cmd = {
				command: 'say',
				text: rest
			};
			ret.commands.push(cmd);
			break;
			
		case 'PAUSE':
			var cmd = {
				command: 'pause',
				length: rest
			};
			ret.commands.push(cmd);
			break;
			
		case 'GATHER':
			var cmd = {
				command: 'gather',
			};
			
			cmd.variable = firstWord(rest);
			rest = exceptFirstWord(rest, cmd.variable).trim();
			if(rest) {
				cmd.maxLength = rest;
			}
			ret.commands.push(cmd);
			break;
			
		case 'IF':
			var cmd = {
				command: 'if',
				negative: 0
			};
			
			cmd.expression = parseBinaryExpression(rest);
			
			ret.commands.push(cmd);
			
			current_if.unshift(cmd);
			ifs_stack.unshift(cmd);
			break;
			
		case 'ELSEIF':
			if(current_if.length == 0) {
				throw new Error("Cannot have ELSEIF without IF");
			}
			
			if(ret.commands[ret.commands.length - 1].command != "goto") {
				//don't bother outputting the goto endif if we're already jumping
				
				var cmd = {
					command: 'goto',
					position: '__ENDIF_' + ret.commands.indexOf(ifs_stack[0])
				}
				
				ret.commands.push(cmd);
			}
			
			cmd = {
				command: 'if',
				negative: 0
			};
			
			cmd.expression = parseBinaryExpression(rest);
			
			current_if[0].negative = ret.commands.length;
			
			ret.commands.push(cmd);
			
			current_if[0] = cmd;
			break;
			
		case 'ELSE':
			if(current_if.length == 0) {
				throw new Error("Cannot have ELSE without IF");
			}
			
			if(ret.commands[ret.commands.length - 1].command != "goto") {
				//don't bother outputting the goto endif if we're already jumping
				var cmd = {
					command: 'goto',
					position: '__ENDIF_' + ret.commands.indexOf(ifs_stack[0])
				}
				
				ret.commands.push(cmd);
			}
			
			current_if[0].negative = -ret.commands.length;
			
			break;
			
		case 'ENDIF':
			if(current_if.length == 0) {
				throw new Error("Cannot have ENDIF without IF");
			}
			
			if(current_if[0].negative >= 0) {
				current_if[0].negative = ret.commands.length;
			} else {
				current_if[0].negative = -current_if[0].negative;
			}
			
			ret.labels['__ENDIF_' + ret.commands.indexOf(ifs_stack[0])] = ret.commands.length;
			
			ifs_stack.shift();
			current_if.shift();
			break;
			
		case 'EVENT':
			var cmd = {
				command: 'event',
				event: firstWord(rest),
			};
			rest = exceptFirstWord(rest, cmd.event);
			if(rest) {
				cmd.arguments = rest.split(' ');
			}
			ret.commands.push(cmd);
			break;
			
		case 'GOTO':
			var cmd = {
				command: "goto",
				position: rest
			}
			ret.commands.push(cmd);
			break;
			
		default:
			console.log("Word = " + word);
			console.log("Rest = '" + rest + "'");
			break;
		}
		
	}
	
	if(current_if.length > 0) {
		throw new Error("Reached end of source without ENDIF");
	}
	
	//go back and fixup gotos
	
	for(var i = 0; i < ret.commands.length; i++) {
		if(ret.commands[i].command == "goto") {
			var pos = ret.commands[i].position;
			
			if(typeof ret.labels[pos] == "undefined") {
				throw new Error("Unknown label " + pos);
			}
			
			ret.commands[i].position = ret.labels[pos];
		}
	}
	
	return ret;
};
