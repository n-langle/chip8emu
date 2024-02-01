/* /////////////////////////////////////////////////////
 *
 *	CHIP-8 : https://multigesture.net/articles/how-to-write-an-emulator-chip-8-interpreter/
 *
 * ////////////////////////////////////////////////// */
(function(Chip8Emu, undefined){
	
	'use strict';
	/* ---------------------------------
	 * static var
	 * ------------------------------ */
	var fontset = [
		0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
		0x20, 0x60, 0x20, 0x20, 0x70, // 1
		0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
		0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
		0x90, 0x90, 0xF0, 0x10, 0x10, // 4
		0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
		0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
		0xF0, 0x10, 0x20, 0x40, 0x40, // 7
		0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
		0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
		0xF0, 0x90, 0xF0, 0x90, 0x90, // A
		0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
		0xF0, 0x80, 0x80, 0x80, 0xF0, // C
		0xE0, 0x90, 0x90, 0x90, 0xE0, // D
		0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
		0xF0, 0x80, 0xF0, 0x80, 0x80  // F
	];
	
	/* ---------------------------------
	 * Chip 8
	 * ------------------------------ */
	function Chip8(){
		
		var chip8 = this;
		
		// unsigned char memory
		// 4k memory
		chip8.memory = new Uint8Array(4096);
		
		// unsigned char V
		// CPU register 
		chip8.V = new Uint8Array(16);

		// unsigned short I
		// index register
		chip8.I;
		
		// unsigned short pc
		// program counter
		chip8.pc;
		
		// unsigned char gfx
		// graphic are black and white (0 or 1) on a map of 64x32
		chip8.gfx = new Array(64 * 32);
		
		// unsigned char delay_timer
		// 60Hz counter, when set above zero it will count down to zero
		chip8.delay_timer;
		
		// unsigned char sound_timer
		// 60Hz counter, when set above zero it will count down to zero
		// system buzzer sounds whenever timer reaches zero
		chip8.sound_timer;
		
		// unsigned short stack
		// remember position before program jump
		chip8.stack = new Array(16);
		
		// unsigned short sp
		// stack pointer
		chip8.sp;
		
		
		// unsigned char key
		// store the current state of the key
		chip8.key = new Array(16);
		
		// draw flag
		chip8.drawFlag;
	}
	
	Chip8.prototype = {
		constructor : Chip8,
		
		initialize : function(){
			
			var chip8 = this,
				i;
				
			chip8.I = 0;
			chip8.pc = 0x200;
			chip8.sp = 0;
			
			fillArray(chip8.gfx);
			fillArray(chip8.stack);
			fillArray(chip8.V);
			fillArray(chip8.memory);
			fillArray(chip8.key);
			
			for(i=0; i<fontset.length; i++)
				chip8.memory[i] = fontset[i];
			
			chip8.delay_timer = 0;
			chip8.sound_timer = 0;	
		},
		
		loadGame : function(uint8Array){
			
			var chip8 = this,
				i;
				
			for(i = 0; i < uint8Array.length; i++){
				chip8.memory[0x200 + i] = uint8Array[i]; 	
			}
		},
		
		
		emulateCycle : function(){
			
			var chip8 	= this,
				opcode	= chip8.memory[chip8.pc] << 8 | chip8.memory[chip8.pc + 1],
				X		= (opcode & 0x0F00) >> 8,
				Y		= (opcode & 0x00F0) >> 4,	
				bool, i;
			
			switch(opcode & 0xF000) // 0xF000 = 1111000000000000
			{
				// 0x0
				case 0x0000 :
					switch(opcode){
						// 0x00E0	clear the screen
						case 0x00E0 : 
							fillArray(chip8.gfx, 0);
							chip8.drawFlag = true;
							chip8.pc += 2;
							break;
						// 0x00EE	return to sub routine	
						case 0x00EE : 
							chip8.sp--; 						// 16 levels of stack, decrease stack pointer to prevent overwrite
							chip8.pc = chip8.stack[chip8.sp];	// Put the stored return address from the stack back into the program counter
							chip8.pc += 2;						// Don't forget to increase the program counter!
							break;
						default : 
							console.log("[Chip8Emu.Chip8] unknow opcode in 0x0000 : " + opcode);						
					}
					break;
				// 0x1NNN	Jumps to address NNN	
				case 0x1000 :	
					chip8.pc = opcode & 0x0FFF;
					break;
				// 0x2NNN	Calls subroutine at NNN	
				case 0x2000 :	
					chip8.stack[chip8.sp] = chip8.pc;
					chip8.sp++;
					chip8.pc = opcode & 0x0FFF;
					break;
				// 0x3XNN	Skips the next instruction if VX equals NN	
				case 0x3000 :	
					if(chip8.V[X] == (opcode & 0x00FF))
						chip8.pc += 4;
					else
						chip8.pc += 2;
					break;
				// 0x4XNN	Skips the next instruction if VX doesn't equal NN	
				case 0x4000 :	
					if(chip8.V[X] != (opcode & 0x00FF))
						chip8.pc += 4;
					else
						chip8.pc += 2;
					break;
				// 0x5XY0	Skips the next instruction if VX equals VY	
				case 0x5000 :	
					if(chip8.V[X] == chip8.V[Y])
						chip8.pc += 4;
					else
						chip8.pc += 2;
					break;
				// 0x6XNN	Sets VX to NN	
				case 0x6000 :	
					chip8.V[X] = opcode & 0x00FF;
					chip8.pc += 2;
					break;
				// 0X7XNN	Adds NN to VX	
				case 0x7000 :	
					chip8.V[X] += opcode & 0x00FF;
					chip8.pc += 2;
					break;
				// 0x8	
				case 0x8000 :
					switch(opcode & 0x000F){
						// 0x8XY0	Sets VX to the value of VY
						case 0x0000 :
							chip8.V[X] = chip8.V[Y];
							chip8.pc += 2;
							break;
						// 0x8XY1	Sets VX to VX or VY	
						case 0x0001 :
							chip8.V[X] |= chip8.V[Y];
							chip8.pc += 2;
							break;
						// 0x8XY2	Sets VX to VX and VY	
						case 0x0002 :
							chip8.V[X] &= chip8.V[Y];
							chip8.pc += 2;
							break;
						// 0x8XY3	Sets VX to VX xor VY	
						case 0x0003 :
							chip8.V[X] ^= chip8.V[Y];
							chip8.pc += 2;
							break;
						// 0x8XY4	Adds VY to VX. VF is set to 1 when there's a carry, 
						//			and to 0 when there isn't
						//			Because the register can only store values from 0 to 255 (8 bit value), 
						//			it means that if the sum of VX and VY is larger than 255, it can’t be 
						//			stored in the register (or actually it starts counting from 0 again)							
						case 0x0004 :
							if(chip8.V[Y] > (0xFF - chip8.V[X]))
								chip8.V[0xF] = 1; // carry
							else	
								chip8.V[0xF] = 0;
								
							chip8.V[X] += chip8.V[Y];
							chip8.pc += 2;
							break;
						// 0x8XY5	VY is subtracted from VX. VF is set to 0 when there's a 
						//			borrow, and 1 when there isn't		
						case 0x0005 :
							if(chip8.V[Y] > chip8.V[X])
									chip8.V[0xF] = 0; // there's a borrow
								else	
									chip8.V[0xF] = 1;
						
							chip8.V[X] -= chip8.V[Y];
							chip8.pc += 2;
							break;
						// 0x8XY6	Shifts VX right by one. VF is set to the value of the least 
						//			significant bit of VX before the shift		
						case 0x0006 :
							chip8.V[0xF] = chip8.V[X] & 0x1;
							chip8.V[X] >>= 1; 
							chip8.pc += 2;
							break;
						// 0x8XY7	Sets VX to VY minus VX. VF is set to 0 when there's a borrow, 
						//			and 1 when there isn't		
						case 0x0007 :
							if(chip8.V[X] > chip8.V[Y])
								chip8.V[0xF] = 0; // there's a borrow
							else	
								chip8.V[0xF] = 1;
							
							chip8.V[X] = chip8.V[Y] - chip8.V[X]; 		
							chip8.pc += 2;
							break;
						// 0x8XYE	Shifts VX left by one. VF is set to the value of the most 
						//			significant bit of VX before the shift		
						case 0x000E :
							chip8.V[0xF] = chip8.V[X] >> 7;
							chip8.V[X] <<= 1;
							chip8.pc += 2;
							break;							
						default :
							console.log("[Chip8Emu.Chip8] unknow opcode in 0x8000 : " + opcode); 		
					}
					break;
				// 0x9XY0	Skips the next instruction if VX doesn't equal VY	
				case 0x9000 :
					if(chip8.V[X] != chip8.V[Y])
						chip8.pc += 4;
					else
						chip8.pc += 2;
					break;
				// 0xANNN	Sets I to the address NNN	
				case 0xA000 : 
					chip8.I = opcode & 0x0FFF;
					chip8.pc += 2;
					break;
				// 0xBNNN	Jumps to the address NNN plus V0
				case 0xB000 : 
					chip8.pc = (opcode & 0x0FFF) + chip8.V[0];  
					break;
				// 0xCXNN 	Sets VX to the result of a bitwise and operation on a random number and NN
				case 0xC000 : 
					chip8.V[X] = Math.floor(Math.random() * 0xFF) & (opcode & 0x00FF);	
					chip8.pc += 2;
					break;
				// 0xDXYN 	Sprites stored in memory at location in index register (I), 
				//			8bits wide. Wraps around the screen. If when drawn, clears a pixel, 
				//			register VF is set to 1 otherwise it is zero. All drawing 
				//			is XOR drawing (i.e. it toggles the screen pixels). Sprites are 
				//			drawn starting at position VX, VY. N is the number of 8bit rows 
				//			that need to be drawn. If N is greater than 1, second line 
				//			continues at position VX, VY+1, and so on
				case 0xD000 :
					helper_dxyn(chip8, opcode, X, Y);	
					chip8.pc += 2;		
					break;
				// 0xE	
				case 0xE000 : 
					switch(opcode & 0x00FF){
						// 0xEX9E 	Skips the next instruction if the key stored in VX is pressed
						case 0x009E:
							if(chip8.key[chip8.V[X]] != 0)
								chip8.pc += 4;
							else
								chip8.pc += 2;
							break;
						// 0xEXA1 	Skips the next instruction if the key stored in VX isn't pressed	
						case 0x00A1:
							if(chip8.key[chip8.V[X]] == 0)
								chip8.pc += 4;
							else
								chip8.pc += 2;
							break;	 
						default :
							console.log("[Chip8Emu.Chip8] unknow opcode in 0xE000 : " + opcode);	
					}
					break;
				// 0x	
				case 0xF000 :			
					switch(opcode & 0x00FF){
						// 0xFX07 	Sets VX to the value of the delay timer.
						case 0x0007 :
							chip8.V[X] = chip8.delay_timer;
							chip8.pc += 2;
							break;
						// 0xFX0A 	A key press is awaited, and then stored in VX	
						case 0x000A :
							bool = false;	
						
							for(i = 0; i < 16; i++)
							{
								if(chip8.key[i] != 0)
								{
									chip8.V[X] = i;
									bool = true;	
								}
							}
							
							if(bool) chip8.pc += 2;
							
							break;
						// 0xFX15 	Sets the delay timer to VX	
						case 0x0015 :
							chip8.delay_timer = chip8.V[X];
							chip8.pc += 2;
							break;
						// 0xFX18 	Sets the sound timer to VX	
						case 0x0018 :
							chip8.sound_timer = chip8.V[X];
							chip8.pc += 2;
							break;
						// 0xFX1E 	Adds VX to I.	
						case 0x001E :
							if(chip8.I + chip8.V[X] > 0xFFF) 
								chip8.V[0xF] = 1;
							else
								chip8.V[0xF] = 0;
							
							chip8.I += chip8.V[X];
							chip8.pc += 2;
							break;
						// 0xFX29 	Sets I to the location of the sprite for the character in VX. 
						//			Characters 0-F (in hexadecimal) are represented by a 4x5 font	
						case 0x0029 :
							chip8.I = chip8.V[X] * 0x5;
							chip8.pc += 2;
							break;
						// 0xFX33 	Stores the binary-coded decimal representation of VX, with the most 
						//			significant of three digits at the address in I, the middle digit at 
						//			I plus 1, and the least significant digit at I plus 2. (In other words, 
						//			take the decimal representation of VX, place the hundreds digit in 
						//			memory at location in I, the tens digit at location I+1, and the ones 
						//			digit at location I+2.)	
						case 0x0033 :
							chip8.memory[chip8.I]		= chip8.V[X] / 100;
							chip8.memory[chip8.I + 1]	= (chip8.V[X] / 10) % 10;
							chip8.memory[chip8.I + 2]	= (chip8.V[X] % 100) / 10;
							chip8.pc += 2;
							break;
						// 0xFX55 	Stores V0 to VX (including VX) in memory starting at address I	
						case 0x0055 :
							for(i = 0; i <= X; i++)
								chip8.memory[chip8.I + i] = chip8.V[i];
							// On the original interpreter, when the operation is done, I = I + X + 1.
							chip8.I += X + 1;
							chip8.pc += 2;
							break;
						// 0xFX65 	Fills V0 to VX (including VX) with values from memory starting at address I	
						case 0x0065 :
							for(i = 0; i <= X; i++)
								chip8.V[i] = chip8.memory[chip8.I + i];
							// On the original interpreter, when the operation is done, I = I + X + 1.
							chip8.I += X + 1;	
							chip8.pc += 2;
							break;				
						default :
							console.log("[Chip8Emu.Chip8] unknow opcode in 0xF000 : " + opcode);
					}
					break;						
				default : 
					console.log("[Chip8Emu.Chip8] unknow opcode : " + opcode);		
			}
			
			if(chip8.delay_timer > 0)
				chip8.delay_timer--;
			
			if(chip8.sound_timer > 0){
				chip8.delay_timer--;
				if(chip8.delay_timer == 0) console.log("[Chip8Emu.Chip8] BEEP")	
			}
		},
		
		setKeys : function(){
			
		}
	};
	/* ---------------------------------
	 * function op helper
	 * ------------------------------ */
	// DXYN: Draws a sprite at coordinate (VX, VY) that has a width of 8 pixels and a height of N pixels. 
	// Each row of 8 pixels is read as bit-coded starting from memory location I; 
	// I value doesn't change after the execution of this instruction. 
	// VF is set to 1 if any screen pixels are flipped from set to unset when the sprite is drawn, 
	// and to 0 if that doesn't happen 
	function helper_dxyn(chip8, opcode, X, Y){

		var height = opcode & 0x000F,
			x, y, x2, y2, spr, i;
		
		chip8.V[0xF] = 0;
		
		for (y = 0; y < height; y++)
		{
			spr = chip8.memory[chip8.I + y];
			for (x = 0; x < 8; x++)
			{
				if ((spr & 0x80) > 0)
				{
					x2 = (chip8.V[X] + x) % 64;
					y2 = (chip8.V[Y] + y) % 32;
					i = x2 + y2 * 64;
					
					chip8.gfx[i] ^= 1;
					
					if (!chip8.gfx[i]) chip8.V[0xF] = 1;
				}
				spr <<= 1;
			}
			chip8.drawFlag = true;
		}
	}
	/* ---------------------------------
	 * function
	 * ------------------------------ */
	function fillArray(array, value){
		
		var i = 0,
			v = value || 0;
			
		for(;i<array.length;i++) array[i] = v;	
	}
	
	
	// export
	Chip8Emu.Chip8 = Chip8;
	
})(Chip8Emu);
