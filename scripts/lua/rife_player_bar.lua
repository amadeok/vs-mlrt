-- Save this script as cursor_position.lua
local json = require("dkjson")

-- function on_mouse_move()
--     local mouse_x, mouse_y = mp.get_mouse_pos()
--     print("Mouse moved to:", mouse_x, mouse_y)
-- end

--local browser_video_cur_time = mp.get_opt("rife_player_bar-browser_video_cur_time")

print("lua version ", _VERSION)

function bytes_to_integer(bytes)
  local result = 0
  for i = 1, #bytes do
    result = result * 256 + string.byte(bytes, i)
  end
  return result
end

function encodeBigEndian(value)
    local byte1 = math.floor(value / 256)
    local byte2 = value % 256
    return string.char(byte1, byte2)
end


function round(number)
    local decimal = number % 1
    if decimal >= 0.5 then
        return math.ceil(number)
    else
        return math.floor(number)
    end
end

local browser_video_cur_time_perc = 0
local widthFactor = 1
--local bar_length = 30
local is_mouse_moved = false
local length = 100  -- desired length of the string
local assdraw = require 'mp.assdraw'

function show_progress_bar(pos, str2)--(position, duration)
    --local progress = position / duration
    local seg1 = pos--math.floor(progress * length)
    local seg2 = length - seg1
    local seg1Str = string.rep("-", seg1)
    local seg2Str = string.rep("-", seg2)
    local text = string.format("[%s█%s]\n%s", seg1Str, seg2Str, str2 )
    local finalfontsize = round(widthFactor*15);
    if finalfontsize > 15 then
        finalfontsize = 15
    end
    local text2 = string.format("{\\fs%d} %s {\\}",finalfontsize, text ) 
   -- local osd_text = mp.get_property("osd-ass-cc/0") .. "{\\u1} underline {\\u0}" .. mp.get_property("osd-ass-cc/1")
   
    local osd_text = mp.get_property("osd-ass-cc/0") .. text2 .. mp.get_property("osd-ass-cc/1")
    print("(osd_text ",osd_text)
    --mp.osd_message(osd_text, 4)
    --local time_pos = mp.get_property_number("time-pos")
    --local duration = mp.get_property_number("duration")
    --local formatted_time = mp.get_property("osd-ass-cc/0") .. string.format("{\\b1}Time: %.2f / %.2f{\\b0}", time_pos, duration)
    mp.osd_message(osd_text)
    --mp.commandv("show_text", text, 2);
end

-- Event handler for seek event
function on_seek()
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
    --print("----- >SAFE CALL")
    local success, err = pcall(on_seek)
    if not success then
        mp.osd_message("Error: " .. err)
    end
end

function draw_line()
    local w, h = mp.get_osd_size()
    
    -- Define the coordinates of the line
    local x1, y1 = 100, 100
    local x2, y2 = 500, 500
    
    -- Draw the line on the OSD
    mp.set_osd_ass(w, h, string.format(
        "{\\an7\\bord2\\pos(%d,%d)\\p1\\c&HFFFFFF&\\p2\\c&HFFFFFF&\\p3\\c&HFFFFFF&\\p4\\c&HFFFFFF&\\p5\\c&HFFFFFF&\\p6\\c&HFFFFFF&\\p7\\c&HFFFFFF&\\p8\\c&HFFFFFF&\\p9\\c&HFFFFFF&\\clip(m %d %d l %d %d %d %d %d %d %d %d %d %d)}",
        x1, y1, x1, y1, x2, y2, x2, y2, x2, y2, x1, y1, x1, y1
    ))
end

-- Register the event handlers
--mp.register_event("seek", on_seek)
--mp.register_event("mouse-move", on_mouse_move

--mp.add_forced_key_binding("MOUSE_MOVE", "mouse_move", safe_call)

local pipePath = "\\\\.\\pipe\\rife_player_mpv_lua_pipe"
local file, err = io.open(pipePath, "r+")

function monitor_partial()
    local data = file:read(2)

    local numBytesToRead = bytes_to_integer(data)
    print("numBytesToRead :", numBytesToRead)

    local data = file:read(numBytesToRead)
    local luaTable = nil

    local success, result = pcall(function()
        luaTable = json.decode(data)
    end)
    
    if not success then
        print("An error occurred: " .. result)
        return 1
    end

    for key, value in pairs(luaTable) do
        print(key, value)
    end
    if luaTable["type"] == "data"  and luaTable["resposeOf"] == "get_duration_and_curtime" then
        print("Received data:")
        local browserCurTime = luaTable["data"]["video_curTime"]
        local browserDuration = luaTable["data"]["video_duration"]
        if browserCurTime and browserCurTime then
            browser_video_cur_time_perc = round(length * (1 / (browserDuration / browserCurTime)))
        else
            browser_video_cur_time_perc = 0
        end
        print("browser_video_cur_time_perc", browser_video_cur_time_perc)

    elseif luaTable["type"] == "perform_operation" and luaTable["operation_type"] == "show_seek_bar" then
        local perc = luaTable["operation_details"]["mousePosPerc"]
        widthFactor = luaTable["operation_details"]["widthFactor"]
        
        if perc == -1 then
            show_progress_bar(browser_video_cur_time_perc,  "Press right mouse button to seek")
        else
            show_progress_bar(round(length*perc), string.format("Seeking to %.2f%s",  perc*100, "%" ) )
        end
    elseif luaTable["type"] == "get_attribute" then
        local attribute_name = luaTable["attribute_name"]
        print("attribute_name ", attribute_name)
        local attr = mp.get_property(attribute_name)
        print("attr ", attr)
        local myTable = {
            attribute_name = attribute_name,
            attribute_value = attr
        }
        local jsonString = json.encode(myTable)
        size_bytes = encodeBigEndian(string.len(jsonString))
        file:write(size_bytes)
        ret = file:write(jsonString)
        print("end  ", size_bytes, jsonString )
    elseif luaTable["type"] == "perform_operation" and luaTable["operation_type"] == "quit" then
        print("LUA SCRIPT EXIT")
        return true
        
    end
    return false
    
    --safe_call()
    -- mp.add_timeout(0, monitor_partial)
end


function monitor()

    if not file then
        print("Error opening the named pipe:", err)
    else
        while true do
            -- file:write("Hello, named pipe!")
            -- file:seek("set", 0)
           if (monitor_partial()) then
                break
           end
        end
    end
    local ret = file:close()
    print("Pipe closed ", ret )
end

--mp.add_timeout(0, monitor_partial)
mp.add_timeout(0, monitor)
--mp.add_periodic_timer(1, monitor_partial)

-- Function to show OSD message when seeking
function showOSDMessage()
    local time_pos = mp.get_property_number("time-pos", 0)
    mp.osd_message("Seeking: " .. string.format("%.2f", time_pos), 2)
end

-- Bind the function to the "seek" event
mp.register_event("seek", showOSDMessage)