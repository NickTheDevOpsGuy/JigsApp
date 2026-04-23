#!/usr/bin/env bash

maybe_enable_edge_channel() {
  if [ "${PW_USE_EDGE:-}" = "1" ]; then
    echo "Using real Microsoft Edge channel for Playwright (PW_USE_EDGE=1)."
    return
  fi

  local edge_paths=(
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
    "/Applications/Microsoft Edge Beta.app/Contents/MacOS/Microsoft Edge Beta"
  )
  local edge_commands=(
    msedge
    microsoft-edge
    microsoft-edge-stable
  )
  local path
  local cmd

  for path in "${edge_paths[@]}"; do
    if [ -x "${path}" ]; then
      export PW_USE_EDGE=1
      echo "Detected Microsoft Edge at ${path}; enabling real Edge channel."
      return
    fi
  done

  for cmd in "${edge_commands[@]}"; do
    if command -v "${cmd}" >/dev/null 2>&1; then
      export PW_USE_EDGE=1
      echo "Detected Microsoft Edge command (${cmd}); enabling real Edge channel."
      return
    fi
  done

  echo "Microsoft Edge not detected locally; using Edge-compatible Chromium coverage."
}
