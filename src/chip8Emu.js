/* =============================================
 * chip8Emu 
 * ========================================== */
(function(undefined){
	
	'use strict';
	
	// 	keysCode = 	1, 2, 3, 4, 
	//				A, Z, E, R,
	//				Q, S, D, F,
	//				W, X, C, V
	
	var keysCode = [49, 50, 51, 52, 
					65, 90, 69, 82, 
					81, 83, 68, 70, 
					87, 88, 67, 86];
	
	function Chip8Emu(options){
		
		var chip8Emu = this;
		
		options = options || {};
		
		chip8Emu.idContainer 	= options.idContainer;
		chip8Emu.idFile 		= options.idFile;
		
		chip8Emu.init();
	}
	
	/* ---------------------------------------------
	 * init
	 * ------------------------------------------ */
	Chip8Emu.prototype = { 
		init : function(){
			
			var chip8Emu 	= this,
				container 	= document.getElementById(chip8Emu.idContainer),
				file		= document.getElementById(chip8Emu.idFile);
					
			if(container.hasChildNodes()) return;
			
			chip8Emu.renderer = new Chip8Emu.Renderer(container, chip8Emu.zoom);
			chip8Emu.chip8 = new Chip8Emu.Chip8();
			
			// file event
			file.addEventListener('change', function(e){
				var fileReader 		= new FileReader(),
					files			= e.target.files || e.dataTransfer.files,
					binaryString	= fileReader.readAsArrayBuffer(files[0]);
					
				cancelAnimationFrame(chip8Emu.rAF);	
					
				fileReader.onloadend = function(e){
					var int8Array = new Uint8Array(e.target.result); 
					chip8Emu.chip8.initialize();
					chip8Emu.chip8.loadGame(int8Array);
					chip8Emu.run();	
				};	
					
			},false);
			
			// keyboard event
			document.addEventListener('keydown', function(e){
				var i = keysCode.indexOf(e.which); 
				if(i != -1) chip8Emu.chip8.key[i] = 1;	
			});
			
			document.addEventListener('keyup', function(e){
				var i = keysCode.indexOf(e.which); 
				if(i != -1) chip8Emu.chip8.key[i] = 0;	
			});
		},
		
		run : function(){
			
			var chip8Emu 	= this,
				chip8 		= chip8Emu.chip8,
				renderer 	= chip8Emu.renderer,
				i;
			
			function loop(){
				
				for(i = 0; i < 10; i++)
					chip8.emulateCycle();
				
				if(chip8.drawFlag){
					renderer.drawGraphics(chip8.gfx);
					chip8.drawFlag = false;
				}
				
				chip8.setKeys();
				chip8Emu.rAF = requestAnimationFrame(loop);
			}
			loop();
		}
	};
	
	window.Chip8Emu = Chip8Emu;
	
})();
