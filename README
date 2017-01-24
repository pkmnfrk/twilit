Twilit
======

A high-level language designed for use with Twilio.

If you want to do anything complicated with Twilio's voice or SMS APIs, you need to essentially
build a state-machine to track the flow through your process. This is made more difficult by the
fact that all I/O with Twilio happens via POSTs they make to your server.

This makes the logic more complicated than it needs to be, and mixes concerns (your back-end logic
becomes intertwined with your "front end" IVR logic). Plus, it's difficult to test in non-production
environments, since Twilio needs to call back into your application.

Twilit helps solve this by abstracting the front-end logic into a separate script that automatically
generates the state-machine for you.

Example
-------

	SAY Press 1, 2 or 3.                                      % Narrate someting to the user
	
	GATHER button 1                                           % Input a single button press
	
	IF $button == 1                                           % conditional logic ahoy
		SAY You pressed 1
	ELSEIF $button == 2
		SAY You pressed the second button
	ELSEIF $button == 3
		SAY That was number 3. Triggering a secret surprise!
		EVENT surprise                                        % EVENTs are callbacks into your app
	ELSE
		SAY That's not a valid option.
	ENDIF
	
