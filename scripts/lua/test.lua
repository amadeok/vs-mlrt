print("test")


-- Load the dkjson library
local json = require("dkjson")

-- Your JSON string
local jsonStr = '{"name": "John", "age": 30, "city": "New York"}'

-- Deserialize JSON string to a Lua table
local luaTable = json.decode(jsonStr)

-- Access elements in the Lua table
print("Name:", luaTable.name)
print("Age:", luaTable.age)
print("City:", luaTable.city)


-- Your Lua table
local luaTable2 = {
    name = "John",
    age = 30,
    city = "New York",
    interests = {"reading", "coding", "hiking"}
}

-- Encode Lua table to JSON string
local jsonString = json.encode(luaTable2)

-- Print the resulting JSON string
print(jsonString)