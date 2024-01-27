import os, shutil, sys

def copy_files_by_name(source_folder, destination_folder, files_to_copy):
    # Ensure the source folder exists
    if not os.path.exists(source_folder):
        print(f"Source folder '{source_folder}' does not exist.")
        return

    # Ensure the destination folder exists, create it if not
    if not os.path.exists(destination_folder):
        os.makedirs(destination_folder)

    # List all files in the source folder
    files = os.listdir(source_folder)

    # Filter files to copy based on provided names
    files_to_copy = [file for file in files if file in files_to_copy]

    # Copy each file to the destination folder
    for file in files_to_copy:
        source_path = os.path.join(source_folder, file)
        destination_path = os.path.join(destination_folder, file)
        shutil.copy2(source_path, destination_path)
        print(f"Copied '{file}' to '{destination_folder}'")

# Example usage:
source_folder = '/path/to/source/folder'
root = r"F:\all\GitHub\vs-mlrt\scripts\install_out\\"
files_to_copy = ['file1.txt', 'file2.jpg', 'file3.doc']
print("---------- > test")
#copy_files_by_name(source_folder, destination_folder, files_to_copy)