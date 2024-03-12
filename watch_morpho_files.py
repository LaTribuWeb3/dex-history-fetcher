import os
import time
import sys

def count_folders_without_file(root_dir):
    count = 0
    # Iterate through each folder in the specified directory
    for folder in os.listdir(root_dir):
        folder_path = os.path.join(root_dir, folder)
        # Check if the item is a directory
        if os.path.isdir(folder_path):
            # Check if the folder contains the required file
            file_name = f"{folder}_morpho_CLFs.json"
            if file_name not in os.listdir(folder_path):
                count += 1
    return count

if __name__ == "__main__":
    target_dir = "data/clf/morpho"
    while True:
        num_folders_without_file = count_folders_without_file(target_dir)
        sys.stdout.write(f"\rNumber of folders without morpho CLFs file: {num_folders_without_file}")
        sys.stdout.flush()
        time.sleep(5)
