var fs = require("fs");
var readline = require("readline");

var Twilit = require("./index");

var source = fs.readFileSync("test.twi", 'utf8');

var interpreter = new Twilit({
	source: source
});

interpreter.on('accept', function() {
	console.log("!! The user pressed 1!");
});

interpreter.on('reject', function() {
	console.log("!! The user pressed 2!");
});

for(var i = 0; i < interpreter.commands.length; i++) {
	console.log(i, JSON.stringify(interpreter.commands[i]));
}

function interpret(input) {
	
	interpreter.step(input);
	input = null;
		
	if(interpreter.stopped) {
		//process.exit(0);
		return;
	}
	
	if(interpreter.needsInput) {
		const rl = readline.createInterface({
		  input: process.stdin,
		  output: process.stdout
		});
		
		rl.on('close', function() {
			console.log("rl.close");
		});

		rl.question('> ', (answer) => {
			process.nextTick(function() {
				interpret(answer);
			});

			rl.close();
		});
		return;
	}
	
	setTimeout(interpret, 0);
}

interpret(null);