onmessage = function(evt) {
	console.log('------------ start worker ----------');
	setInterval(function() {
		postMessage('login');
	}, 1200000); // 20 min
}	