!/bin/bash

make_requests() {
  local num=$1

  for ((i = 0; i < num; i++)); do
    echo "Making request $((i + 1))"
    sleep 0.2
    curl -X GET "http://localhost:4001/$((i + 1))" &
    echo ""
  done
  
  wait
}

make_requests 25
 