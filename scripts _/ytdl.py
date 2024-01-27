import subprocess, os, sys
import pyperclip
import re
import time, threading

bin = r"E:\Users\amade\rifef\mpv-x86_64-v3-20231030-git-0341a6f\youtube-dl.exe"
downloadFls = r"C:\all\gm\VaM_Updater\v\1_\\"
if not os.path.isdir(downloadFls): os.mkdir(downloadFls)



def is_url_with_domain(text, target_domain):
    # Regular expression to match URLs
    url_regex = re.compile(
        r'^(?:http|ftp)s?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|'  # ...or ipv4
        r'\[?[A-F0-9]*:[A-F0-9:]+\]?)'  # ...or ipv6
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)

    # Check if it's a valid URL and contains the target domain
    return bool(re.match(url_regex, text)) and target_domain.lower() in text.lower()

def monitor_clipboard(target_domain):
    previous_clipboard = pyperclip.paste()

    while True:
        current_clipboard = pyperclip.paste()

        if current_clipboard != previous_clipboard:
            if is_url_with_domain(current_clipboard, target_domain):
                print(f"URL with {target_domain} found in clipboard: {current_clipboard}")
                fld = '-o '+  f'{downloadFls}"%(title)s.f%(format_id)s.%(ext)s"'
                cmd = bin + " " + current_clipboard + ' -S "height:1440" ' + fld
                print("cmd ", cmd)
                def fun():
                    os.system(cmd)   
                threading.Thread(target=fun).start()
                #os.system(cmd)

                #p = subprocess.Popen([bin, current_clipboard, ' -S "height:1440"', fld])
                #os.system(bin + " " + current_clipboard + " --format-sort=width:1440")


            previous_clipboard = current_clipboard

        time.sleep(0.2)

if __name__ == "__main__":
    # Replace 'example.com' with the specific domain you are looking for
    target_domain = ' '
    monitor_clipboard(target_domain)