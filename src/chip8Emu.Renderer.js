/* =============================================
 * chip8Emu Renderer
 * ========================================== */
(function(Chip8Emu, document, undefined)
{
	'use strict';
	// CONST STATIC
	var CHIP8_ORIGINAL_WIDTH = 64,
		CHIP8_ORIGINAL_HEIGHT = 32;
	
	function Renderer(container)
	{
		var renderer = this;
		
		renderer.container = container;
		renderer.init();
	}
	
	Renderer.prototype = {
		init : function()
		{
			var renderer = this,
				container = renderer.container;
			
			renderer.zoom = Math.max(container.offsetWidth / CHIP8_ORIGINAL_WIDTH, 1);
			renderer.canvas = document.createElement('canvas');
			renderer.context = renderer.canvas.getContext('2d');
			renderer.canvas.width = CHIP8_ORIGINAL_WIDTH * renderer.zoom;
			renderer.canvas.height = CHIP8_ORIGINAL_HEIGHT * renderer.zoom;
			
			renderer.container.appendChild(renderer.canvas);	
		},
		
		drawGraphics : function(gfx)
		{
			
			var renderer 	= this,
				context		= renderer.context,
				zoom		= renderer.zoom,
				i;
				
			context.fillStyle = "#000";
			context.fillRect(0, 0, renderer.canvas.width, renderer.canvas.height);
			
			context.fillStyle = "#fff";
			
			for(i=0; i<gfx.length; i++)
				if(gfx[i]){ 
					context.fillRect((i % CHIP8_ORIGINAL_WIDTH) * zoom, Math.floor(i / CHIP8_ORIGINAL_WIDTH) * zoom, 1 * zoom, 1 * zoom);	
				}
		}
	};
	
	Chip8Emu.Renderer = Renderer;
	
})(Chip8Emu, document);