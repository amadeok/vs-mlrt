import os, pyautogui,vapoursynth


def get_trt_path():
    trtpath = ""

    got_trt_dll_path = os.getenv( "RIFE_PLAYER_TRT_DLL_PATH")
    RIFE_PLAYER_ROOT_PATH = os.getenv( "RIFE_PLAYER_ROOT_PATH")

    if got_trt_dll_path:
        print("'RIFE_PLAYER_TRT_DLL_PATH' variable found")
        trtpath = got_trt_dll_path
    else:
        print("Getting vstrt.dll path from file")
        if os.path.isfile("trt_dll_path.txt"):
            with open("trt_dll_path.txt", 'r') as file:
                path = file.read()
                if os.path.isfile(path):
                    trtpath = path
    if trtpath == "":
        pyautogui.alert('Error: failed to found vstrt.dll', 'vstrt.dll NOT found ')

    vapoursynth.core.std.LoadPlugin(path=trtpath)
    return trtpath