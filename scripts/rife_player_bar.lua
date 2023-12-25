-- Save this script as cursor_position.lua

function on_mouse_move()
    local mouse_x, mouse_y = mp.get_mouse_pos()
    print("Mouse moved to:", mouse_x, mouse_y)
end

local browser_video_cur_time = mp.get_opt("rife_player_bar-browser_video_cur_time")

print("lua version ", _VERSION)



function bytes_to_integer(bytes)
  local result = 0
  for i = 1, #bytes do
    result = result * 256 + string.byte(bytes, i)
  end
  return result
end



local bar_length = 30
local is_mouse_moved = false
local length = 71  -- desired length of the string

function show_progress_bar(position, duration)
    local progress = position / duration
    
    local seg1 = math.floor(progress * length)
    local seg2 = length - seg1

    local seg1Str = string.rep("-", seg1)
    local seg2Str = string.rep("-", seg2)

    local text = string.format("[%s█%s]", seg1Str, seg2Str )
    
    local osd_text = mp.get_property("osd-ass-cc/0") .. "{\\u1} underline {\\u0}" .. mp.get_property("osd-ass-cc/1")
    mp.osd_message(text, 2)
    --mp.commandv("show_text", text, 2);
end

-- Event handler for seek event
function on_seek(event)
        local position = mp.get_property_number("time-pos", 0)
        local duration = mp.get_property_number("duration", 1)
        show_progress_bar(position, duration)
end

-- Event handler for mouse-move event
function on_mouse_move()
    is_mouse_moved = true
    --print("is_mouse_moved", is_mouse_moved)
    mp.add_timeout(2, function()
        is_mouse_moved = false
        mp.osd_message("", 1)  -- Clear OSD after 2 seconds of no mouse movement
    end)
end

function safe_call()
    local success, err = pcall(on_seek)
    if not success then
        mp.osd_message("Error: " .. err)
    end
end

-- Register the event handlers
--mp.register_event("seek", on_seek)
--mp.register_event("mouse-move", on_mouse_move

mp.add_forced_key_binding("MOUSE_MOVE", "mouse_move", safe_call)



local pipePath = "\\\\.\\pipe\\rife_player_mpv_lua_pipe"
local file, err = io.open(pipePath, "r+")

if not file then
    print("Error opening the named pipe:", err)
else

    while true do
        
        -- file:write("Hello, named pipe!")
        -- file:seek("set", 0)
    
        local data = file:read(2)
    
        local numBytesToRead = bytes_to_integer(data)
        print("numBytesToRead :", numBytesToRead)
    
        local data = file:read(numBytesToRead)
        print("Received data:", data)
    
        -- Close the file (named pipe)
        file:close()
    
        print("Received data: " .. line)
    end

pipe:close()

