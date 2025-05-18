#!/bin/zsh

removeStableVersion() {
  # Extract .stableVersion removal logic into a variable
  jq_script="del(.stableVersion)"

  # Assign the input file to a variable for clarity
  input_file="$1"

  # Use jq to modify the JSON and save it back to the file
  modified_json=$(jq "$jq_script" "$input_file")
  echo "$modified_json" > "$input_file"
}

# A simple script to find all package.json files and run the workaround on them, filtering node_modules and .nx cache files
find . -type d \( -name node_modules \) -prune -o -name 'package.json' -print|while read -r fname; do
  removeStableVersion "$fname"
done
