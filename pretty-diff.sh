#!/bin/bash

# Check if an argument is given (the target directory)
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path_to_compare_with>"
    exit 1
fi

target_dir="$1"

# Function to compare files
compare_files() {
    local file="$1"
    local diff_output
    local begin_diff=0
    local middle_diff=0
    local end_diff=0
    local line_count
    local total_lines=$(wc -l < "$file")
    local half_point=$((total_lines / 2))

    # Compare files
    diff_output=$(diff -y --suppress-common-lines "$file" "$target_dir/$file" | awk '{print $0}')

    # Check where differences are located
    while IFS= read -r line; do
        line_count=$((line_count + 1))
        if [ "$line_count" -le "$half_point" ]; then
            begin_diff=1
        elif [ "$line_count" -gt "$((total_lines - half_point))" ]; then
            end_diff=1
        else
            middle_diff=1
        fi
    done <<< "$diff_output"

    NUMBER_OF_DIFFS=$(echo -n "$diff_output" | wc -l)
    
    echo "================================="
    echo "File: $file"

    echo "${NUMBER_OF_DIFFS} differences found."

    if [ "${NUMBER_OF_DIFFS}" -gt 0 ]
    then
        echo "=== DIFF OUTPUT ==="
        echo "$diff_output"
        echo "=== DIFF OUTPUT ==="
    fi
    
    echo "================================="
}

# Main loop to process each CSV file
for file in *.csv; do
    if [ -f "$target_dir/$file" ]; then
        compare_files "$file"
    else
        echo "File $file does not exist in the target directory."
    fi
done

echo "Comparison complete."