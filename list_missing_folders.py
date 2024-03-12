import os
import shutil

def remove_folders_without_file(root_dir):
    # Iterate through each folder in the specified directory
    for folder in os.listdir(root_dir):
        folder_path = os.path.join(root_dir, folder)
        # Check if the item is a directory
        if os.path.isdir(folder_path):
            # Check if the folder contains the required file
            file_name = f"{folder}_morpho_CLFs.json"
            if file_name not in os.listdir(folder_path):
                # If the required file is not found, remove the folder and its contents
                print(f"Removing folder: {folder}")
                shutil.rmtree(folder_path)

if __name__ == "__main__":
    target_dir = "data/clf/morpho"
    remove_folders_without_file(target_dir)
